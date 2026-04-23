/**
 * Vite plugin for boneyard — auto-captures skeleton bones on HMR updates.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { boneyardPlugin } from 'boneyard-js/vite'
 *
 * export default defineConfig({
 *   plugins: [boneyardPlugin()]
 * })
 * ```
 *
 * Runs the initial capture when the dev server starts, then re-captures
 * automatically when files change. No second terminal needed.
 */

import { resolve, join } from 'path'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import type { Plugin, ViteDevServer } from 'vite'
import { detectRegistryExtension } from '../bin/registry-file.js'

export interface BoneyardPluginOptions {
  /** Output directory for .bones.json files (default: './src/bones' or './bones') */
  out?: string
  /** Viewport widths to capture (default: [375, 768, 1280]) */
  breakpoints?: number[]
  /** Extra ms to wait after page load (default: 800) */
  wait?: number
  /** Framework for registry imports (default: auto-detected) */
  framework?: 'react' | 'vue' | 'svelte' | 'preact'
  /** Skip initial capture on server start (default: false) */
  skipInitial?: boolean
  /** Connect to existing Chrome via debug port instead of launching Playwright (reuses cookies, auth, state) */
  cdp?: number
  /** Routes to capture skeletons from (default: ['/']). The plugin visits each route at every breakpoint. */
  routes?: string[]
  /** Verbose per-step logging — useful when capture returns nothing and you need to see why */
  debug?: boolean
}

type BoneyardConfig = {
  routes?: string[]
  breakpoints?: number[]
  wait?: number
  out?: string
  auth?: {
    cookies?: Array<{ name: string; value: string; domain?: string; path?: string; expires?: number; httpOnly?: boolean; secure?: boolean; sameSite?: 'Strict' | 'Lax' | 'None' }>
    headers?: Record<string, string>
  }
}

const ALLOWED_COOKIE_KEYS = new Set(['name', 'value', 'path', 'domain', 'expires', 'httpOnly', 'secure', 'sameSite'])
const BLOCKED_HEADERS = new Set(['host', 'content-length', 'transfer-encoding', 'connection', 'upgrade'])

function loadConfig(root: string): BoneyardConfig | null {
  const p = resolve(root, 'boneyard.config.json')
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as BoneyardConfig
  } catch (e: any) {
    console.log(`  \x1b[35m[boneyard]\x1b[0m failed to parse boneyard.config.json — ${e.message}`)
    return null
  }
}

function sanitizeCookies(cookies: NonNullable<BoneyardConfig['auth']>['cookies']): any[] {
  if (!cookies) return []
  return cookies.map(c => {
    const safe: Record<string, any> = {}
    for (const [k, v] of Object.entries(c)) {
      if (ALLOWED_COOKIE_KEYS.has(k)) safe[k] = v
    }
    return safe
  })
}

function sanitizeHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  if (!headers) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) {
    if (BLOCKED_HEADERS.has(k.toLowerCase())) {
      console.log(`  \x1b[35m[boneyard]\x1b[0m blocked unsafe header '${k}' in auth config`)
      continue
    }
    out[k] = v
  }
  return out
}

export function boneyardPlugin(options: BoneyardPluginOptions = {}): Plugin {
  const debug = options.debug === true
  const log = (msg: string) => console.log(`  \x1b[35m[boneyard]\x1b[0m ${msg}`)
  const dbg = (msg: string) => { if (debug) log(msg) }

  let outDir = options.out ?? ''
  let detectedFramework = options.framework ?? ''
  let server: ViteDevServer | null = null
  let capturing = false
  let lastSnapshot = ''
  let browser: any = null
  let page: any = null
  let initialCaptureDone = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let loadedConfig: BoneyardConfig | null = null

  // Options may be overridden by boneyard.config.json — resolved in configureServer.
  let breakpoints = options.breakpoints ?? [375, 768, 1280]
  let wait = options.wait ?? 800
  let routes = options.routes ?? ['/']
  const skipInitial = options.skipInitial === true
  const cdpPort = options.cdp

  function detectOutDir(root: string): string {
    if (outDir) return resolve(root, outDir)
    if (existsSync(resolve(root, 'src'))) return resolve(root, 'src/bones')
    return resolve(root, 'bones')
  }

  function detectFramework(root: string): string {
    if (detectedFramework) return detectedFramework
    try {
      const pkgPath = resolve(root, 'package.json')
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
        if (allDeps['vue'] || allDeps['nuxt']) return 'vue'
        if (allDeps['svelte'] || allDeps['@sveltejs/kit']) return 'svelte'
        if (allDeps['preact']) return 'preact'
      }
    } catch {}
    return 'react'
  }

  async function ensureBrowser() {
    if (browser && page) return
    const pw = await import('playwright')
    let context: any
    if (cdpPort) {
      dbg(`connecting to Chrome on port ${cdpPort}`)
      browser = await pw.chromium.connectOverCDP(`http://localhost:${cdpPort}`)
      // Reuse the existing browser context so cookies and auth state from
      // the user's Chrome session carry over (matches the CLI's --cdp fix
      // in #73). A fresh context would throw away any logged-in session.
      context = browser.contexts()[0] ?? await browser.newContext()
    } else {
      dbg('launching headless chromium')
      browser = await pw.chromium.launch()
      context = await browser.newContext()
    }
    page = await context.newPage()

    // Apply auth from boneyard.config.json, if any.
    const auth = loadedConfig?.auth
    if (auth?.cookies?.length) {
      const cookies = sanitizeCookies(auth.cookies)
      log(`applying ${cookies.length} cookie(s) from boneyard.config.json`)
      try {
        await context.addCookies(cookies)
      } catch (e: any) {
        log(`failed to apply cookies — ${e.message}`)
      }
    }
    if (auth?.headers && Object.keys(auth.headers).length) {
      const headers = sanitizeHeaders(auth.headers)
      const count = Object.keys(headers).length
      if (count) {
        log(`applying ${count} header(s) from boneyard.config.json`)
        await page.setExtraHTTPHeaders(headers)
      }
    }

    await page.addInitScript(() => {
      (window as any).__BONEYARD_BUILD = true
    })
  }

  async function capture(serverUrl: string, root: string) {
    if (capturing) return
    capturing = true

    try {
      await ensureBrowser()

      const outputDir = detectOutDir(root)
      const fw = detectFramework(root)
      const registryFilename = `registry.${detectRegistryExtension(root)}`
      const collected: Record<string, any> = {}
      const routeDiagnostics: Array<{ path: string; finalPath: string; redirected: boolean; markerCount: number; title: string; error?: string }> = []

      const pageUrls = routes.map(route => {
        const r = route.startsWith('/') ? route : `/${route}`
        return `${serverUrl}${r === '/' ? '' : r}`
      })

      for (const pageUrl of pageUrls) {
        const requestedPath = new URL(pageUrl).pathname
        const diag: typeof routeDiagnostics[number] = {
          path: requestedPath,
          finalPath: requestedPath,
          redirected: false,
          markerCount: 0,
          title: '',
        }

        for (const width of breakpoints) {
          await page.setViewportSize({ width, height: 900 })

          try {
            await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15_000 })
          } catch (e: any) {
            // networkidle can legitimately time out on long-polling pages,
            // but other errors (DNS, connection refused, invalid URL) are
            // usually fatal for this route. Record either way so the user
            // has something to look at when nothing is captured.
            const isTimeout = e?.name === 'TimeoutError' || /timeout/i.test(e?.message ?? '')
            if (!isTimeout) {
              diag.error = e?.message ?? String(e)
            } else {
              dbg(`${requestedPath} @ ${width}px — networkidle timeout (proceeding anyway)`)
            }
          }

          // Detect auth redirects etc. Once is enough — only log on first breakpoint.
          if (width === breakpoints[0]) {
            const finalUrl = page.url()
            try {
              const finalPath = new URL(finalUrl).pathname
              diag.finalPath = finalPath
              diag.redirected = finalPath !== requestedPath
              if (diag.redirected) {
                log(`\x1b[33m⚠  Redirected: ${requestedPath} → ${finalPath}\x1b[0m`)
              }
            } catch {}
          }

          if (wait > 0) await page.waitForTimeout(wait)

          // Capture page-level diagnostics once per route (cheapest breakpoint).
          if (width === breakpoints[0]) {
            try {
              const info = await page.evaluate(() => ({
                title: document.title ?? '',
                markerCount: document.querySelectorAll('[data-boneyard]').length,
              }))
              diag.title = info.title
              diag.markerCount = info.markerCount
              dbg(`${requestedPath} — title="${info.title}", ${info.markerCount} <Skeleton> marker(s)`)
            } catch {}
          }

          const bones = await page.evaluate(() => {
            const fn = (window as any).__BONEYARD_SNAPSHOT
            if (!fn) return { __error: 'no-snapshot-fn' as const }

            const elements = document.querySelectorAll('[data-boneyard]')
            const results: Record<string, any> = {}

            for (const el of elements) {
              const name = el.getAttribute('data-boneyard')
              if (!name || results[name]) continue

              const configStr = el.getAttribute('data-boneyard-config')
              const config = configStr ? JSON.parse(configStr) : undefined
              const target = el.firstElementChild
              if (!target) continue

              try {
                results[name] = fn(target, name, config)
              } catch (err: any) {
                results[name] = { __error: err?.message ?? String(err) }
              }
            }

            return results
          })

          if (bones && typeof bones === 'object' && '__error' in (bones as any)) {
            // No __BONEYARD_SNAPSHOT on the page — the <Skeleton> component
            // didn't mount. Most likely the user is capturing a route that
            // doesn't render a <Skeleton>, or the registry import isn't
            // being loaded by the app entry.
            if (width === breakpoints[0]) {
              log(`\x1b[33m⚠  ${requestedPath} — __BONEYARD_SNAPSHOT not on window; <Skeleton> may not have mounted\x1b[0m`)
            }
            continue
          }

          for (const [name, result] of Object.entries(bones as Record<string, any>)) {
            if (!result) continue
            if (result.__error) {
              log(`\x1b[33m⚠  ${requestedPath} — ${name}: snapshot threw: ${result.__error}\x1b[0m`)
              continue
            }
            const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_')
            if (!collected[safeName]) collected[safeName] = { breakpoints: {} }

            // Compact bones
            if (result.bones) {
              result.bones = result.bones.map((b: any) => {
                const arr = [b.x, b.y, b.w, b.h, b.r]
                if (b.c) arr.push(true)
                return arr
              })
            }
            collected[safeName].breakpoints[width] = result
          }
        }

        routeDiagnostics.push(diag)
      }

      // Check if anything changed
      const snapshot = JSON.stringify(collected)
      if (Object.keys(collected).length === 0) {
        // Nothing captured. Always print the per-route rundown so the user
        // can see why — this is the failure mode #75 flagged.
        log('captured 0 skeletons — nothing to write')
        for (const d of routeDiagnostics) {
          const bits = [`  ${d.path}`]
          if (d.redirected) bits.push(`→ ${d.finalPath}`)
          if (d.error) bits.push(`[error: ${d.error}]`)
          if (d.title) bits.push(`title="${d.title}"`)
          bits.push(`${d.markerCount} marker(s)`)
          log(bits.join(' '))
        }
        if (routeDiagnostics.every(d => d.markerCount === 0)) {
          log('no <Skeleton> markers anywhere — is the registry import wired up? did the pages redirect to a login screen?')
        }
        return
      }
      if (snapshot === lastSnapshot) {
        dbg('snapshot unchanged — no files rewritten')
        return
      }
      lastSnapshot = snapshot

      // Write files
      mkdirSync(outputDir, { recursive: true })
      const names = Object.keys(collected)

      for (const [name, data] of Object.entries(collected)) {
        const outPath = resolve(outputDir, `${name}.bones.json`)
        if (!outPath.startsWith(resolve(outputDir))) continue
        writeFileSync(outPath, JSON.stringify(data, null, 2))
      }

      // Generate registry
      const registryImportPath = fw === 'vue' ? 'boneyard-js/vue'
        : fw === 'svelte' ? 'boneyard-js/svelte'
        : fw === 'preact' ? 'boneyard-js/preact'
        : 'boneyard-js/react'
      const registryLines = [
        ...(fw === 'react' ? ['"use client"'] : []),
        '// Auto-generated by boneyard vite plugin — do not edit',
        `import { registerBones } from '${registryImportPath}'`,
        '',
      ]
      for (const name of names) {
        const varName = '_' + name.replace(/[^a-zA-Z0-9]/g, '_')
        registryLines.push(`import ${varName} from './${name}.bones.json'`)
      }
      registryLines.push('')
      registryLines.push('registerBones({')
      for (const name of names) {
        const varName = '_' + name.replace(/[^a-zA-Z0-9]/g, '_')
        registryLines.push(`  "${name}": ${varName},`)
      }
      registryLines.push('})')
      registryLines.push('')

      writeFileSync(join(outputDir, registryFilename), registryLines.join('\n'))

      const ts = new Date().toLocaleTimeString()
      log(`${ts} — ${names.length} skeleton${names.length !== 1 ? 's' : ''} captured`)

    } catch (err: any) {
      // "Target closed" happens legitimately when the dev server restarts
      // or the browser was torn down mid-capture — not worth alerting on.
      if (err?.message?.includes('Target closed')) {
        dbg(`capture aborted — ${err.message}`)
      } else {
        log(`\x1b[31m✗  capture failed: ${err?.message ?? err}\x1b[0m`)
        if (debug && err?.stack) console.log(err.stack)
      }
    } finally {
      capturing = false
    }
  }

  return {
    name: 'boneyard',
    apply: 'serve',

    configureServer(srv) {
      server = srv

      // Load boneyard.config.json once at startup. Plugin options still win
      // when both are set, so config is treated as a fallback.
      loadedConfig = loadConfig(srv.config.root)
      if (loadedConfig) {
        dbg('loaded boneyard.config.json')
        if (options.breakpoints === undefined && Array.isArray(loadedConfig.breakpoints)) {
          breakpoints = loadedConfig.breakpoints
        }
        if (options.wait === undefined && typeof loadedConfig.wait === 'number') {
          wait = loadedConfig.wait
        }
        if (options.out === undefined && typeof loadedConfig.out === 'string') {
          outDir = loadedConfig.out
        }
        if (options.routes === undefined && Array.isArray(loadedConfig.routes) && loadedConfig.routes.length) {
          routes = loadedConfig.routes
        }
      }

      // Clean up browser when dev server closes
      srv.httpServer?.on('close', async () => {
        if (browser) {
          await browser.close()
          browser = null
          page = null
        }
      })

      if (!skipInitial) {
        srv.httpServer?.once('listening', () => {
          const address = srv.httpServer?.address()
          if (!address || typeof address === 'string') return
          const url = `http://localhost:${address.port}`

          // Delay initial capture to let the server fully start
          setTimeout(async () => {
            log(`watching for skeleton changes...`)
            dbg(`routes: ${routes.join(', ')}  breakpoints: ${breakpoints.join(', ')}px`)
            await capture(url, srv.config.root)
            initialCaptureDone = true
          }, 2000)
        })
      }
    },

    async handleHotUpdate({ server: srv }) {
      if (!initialCaptureDone && !skipInitial) return

      const address = srv.httpServer?.address()
      if (!address || typeof address === 'string') return
      const url = `http://localhost:${address.port}`

      // Debounce — cancel previous timer, wait for HMR to settle
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = null
        capture(url, srv.config.root)
      }, 1500)
    },
  }
}
