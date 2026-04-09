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
import { createHash } from 'crypto'
import type { Plugin, ViteDevServer } from 'vite'

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
  /** Connect to existing Chrome via debug port instead of launching Playwright */
  cdp?: number
  /** Routes to capture skeletons from (default: ['/']). The plugin visits each route at every breakpoint. */
  routes?: string[]
}

export function boneyardPlugin(options: BoneyardPluginOptions = {}): Plugin {
  const {
    breakpoints = [375, 768, 1280],
    wait = 800,
    skipInitial = false,
    routes = ['/'],
  } = options

  let outDir = options.out ?? ''
  let detectedFramework = options.framework ?? ''
  let server: ViteDevServer | null = null
  let capturing = false
  let lastSnapshot = ''
  let browser: any = null
  let page: any = null
  let initialCaptureDone = false
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

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

  const cdpPort = options.cdp

  async function ensureBrowser() {
    if (browser && page) return
    const pw = await import('playwright')
    if (cdpPort) {
      browser = await pw.chromium.connectOverCDP(`http://localhost:${cdpPort}`)
      const context = await browser.newContext()
      page = await context.newPage()
    } else {
      browser = await pw.chromium.launch()
      page = await browser.newPage()
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
      const collected: Record<string, any> = {}

      const pageUrls = routes.map(route => {
        const r = route.startsWith('/') ? route : `/${route}`
        return `${serverUrl}${r === '/' ? '' : r}`
      })

      for (const pageUrl of pageUrls) {
        for (const width of breakpoints) {
          await page.setViewportSize({ width, height: 900 })

          try {
            await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15_000 })
          } catch {
            // networkidle can timeout — still try
          }

          if (wait > 0) await page.waitForTimeout(wait)

          const bones = await page.evaluate(() => {
            const fn = (window as any).__BONEYARD_SNAPSHOT
            if (!fn) return {}

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
              } catch {}
            }

            return results
          })

          for (const [name, result] of Object.entries(bones)) {
            if (!result) continue
            const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_')
            if (!collected[safeName]) collected[safeName] = { breakpoints: {} }

            // Compact bones
            const r = result as any
            if (r.bones) {
              r.bones = r.bones.map((b: any) => {
                const arr = [b.x, b.y, b.w, b.h, b.r]
                if (b.c) arr.push(true)
                return arr
              })
            }
            collected[safeName].breakpoints[width] = r
          }
        }
      }

      // Check if anything changed
      const snapshot = JSON.stringify(collected)
      if (snapshot === lastSnapshot || Object.keys(collected).length === 0) {
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

      writeFileSync(join(outputDir, 'registry.js'), registryLines.join('\n'))

      const ts = new Date().toLocaleTimeString()
      console.log(`  \x1b[35m[boneyard]\x1b[0m ${ts} — ${names.length} skeleton${names.length !== 1 ? 's' : ''} captured`)

    } catch (err: any) {
      // Silently handle errors — server might be restarting
      if (err.message && !err.message.includes('Target closed')) {
        console.log(`  \x1b[35m[boneyard]\x1b[0m error: ${err.message}`)
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
            console.log(`  \x1b[35m[boneyard]\x1b[0m watching for skeleton changes...`)
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
