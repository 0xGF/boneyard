#!/usr/bin/env node
/**
 * boneyard CLI
 *
 * Visits your running app at every breakpoint, captures all named <Skeleton>
 * components, and writes responsive bones JSON files to disk.
 *
 * Usage:
 *   npx boneyard-js build [url] [options]
 *   npx boneyard-js build                          ← auto-detects your dev server
 *   npx boneyard-js build http://localhost:5173     ← explicit URL
 *   npx boneyard-js build http://localhost:3000/blog http://localhost:3000/shop
 *
 * Options:
 *   --out <dir>          Where to write .bones.json files (default: auto-detected)
 *   --breakpoints <bp>   Viewport widths to capture, comma-separated (default: 375,768,1280)
 *   --wait <ms>          Extra ms to wait after page load (default: 800)
 *
 * Requires playwright:
 *   npm install -D playwright && npx playwright install chromium
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs'
import { resolve, join, dirname } from 'path'
import http from 'http'
import https from 'https'

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    console.error(`  boneyard: env file not found: ${filePath}`)
    process.exit(1)
  }
  // Path traversal check
  const resolved = resolve(filePath)
  const cwd = resolve(process.cwd())
  if (!resolved.startsWith(cwd)) {
    console.error(`  boneyard: env file must be within the project directory`)
    process.exit(1)
  }
  const lines = readFileSync(filePath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    // Strip optional "export " prefix
    const entry = trimmed.startsWith('export ') ? trimmed.slice(7) : trimmed
    const eqIdx = entry.indexOf('=')
    if (eqIdx < 0) continue
    const key = entry.slice(0, eqIdx).trim()
    const raw = entry.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) {
      process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2')
    }
  }
  process.stdout.write(`  boneyard: loaded env from ${filePath}\n`)
}

const args = process.argv.slice(2)
const command = args[0]

if (!command || command === '--help' || command === '-h') {
  printHelp()
  process.exit(0)
}

if (command !== 'build') {
  console.error(`boneyard: unknown command "${command}". Try: npx boneyard-js build`)
  process.exit(1)
}

// ── Parse args ────────────────────────────────────────────────────────────────

const urls = []
const defaultOutDir = existsSync(resolve(process.cwd(), 'src')) ? './src/bones' : './bones'
let outDir = defaultOutDir
let breakpoints = null // null = auto-detect
let waitMs = 800
let cliSetOut = false
let cliSetBreakpoints = false
let cliSetWait = false
let forceRebuild = false
let nativeMode = false
let noScan = false
let envFilePath = null
let watchMode = false
let cdpPort = null

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--out') {
    outDir = args[++i]
    cliSetOut = true
  } else if (args[i] === '--breakpoints') {
    breakpoints = args[++i].split(',').map(Number).filter(n => n > 0)
    cliSetBreakpoints = true
  } else if (args[i] === '--wait') {
    waitMs = Math.max(0, Number(args[++i]) || 800)
    cliSetWait = true
  } else if (args[i] === '--force') {
    forceRebuild = true
  } else if (args[i] === '--native') {
    nativeMode = true
  } else if (args[i] === '--no-scan') {
    noScan = true
  } else if (args[i] === '--env-file') {
    envFilePath = args[++i]
    if (!envFilePath) {
      console.error('  boneyard: --env-file requires a path argument')
      process.exit(1)
    }
  } else if (args[i] === '--watch') {
    watchMode = true
  } else if (args[i] === '--cdp') {
    cdpPort = Number(args[++i])
    if (!cdpPort || cdpPort < 1) {
      console.error('  boneyard: --cdp requires a valid port number (e.g. --cdp 9222)')
      process.exit(1)
    }
  } else if (!args[i].startsWith('--')) {
    urls.push(args[i])
  }
}

// ── Load config file ─────────────────────────────────────────────────────────

let config = {}
const configPath = resolve(process.cwd(), 'boneyard.config.json')
if (existsSync(configPath)) {
  try {
    config = JSON.parse(readFileSync(configPath, 'utf-8'))
    process.stdout.write(`  boneyard: loaded config from boneyard.config.json\n`)
  } catch (e) {
    console.error(`  boneyard: failed to parse boneyard.config.json — ${e.message}`)
  }
}

// Apply config as defaults — CLI flags take priority
if (!cliSetBreakpoints && Array.isArray(config.breakpoints)) {
  breakpoints = config.breakpoints
}
if (!cliSetOut && config.out) {
  outDir = config.out
}
if (!cliSetWait && typeof config.wait === 'number') {
  waitMs = config.wait
}

// Resolve env vars in auth config
const allowedCookieKeys = new Set(['name', 'value', 'path', 'domain', 'expires', 'httpOnly', 'secure', 'sameSite'])
const blockedHeaders = new Set(['host', 'content-length', 'transfer-encoding', 'connection', 'upgrade'])

if (envFilePath) {
  loadEnvFile(resolve(process.cwd(), envFilePath))
}

if (config.resolveEnvVars && config.auth) {
  if (config.auth.cookies) {
    config.auth.cookies = config.auth.cookies.map(c => {
      const safe = {}
      for (const [k, v] of Object.entries(c)) {
        if (allowedCookieKeys.has(k)) safe[k] = v
      }
      safe.value = replaceEnvStrings(safe.value)
      return safe
    })
  }
  if (config.auth.headers) {
    for (const [key, val] of Object.entries(config.auth.headers)) {
      if (blockedHeaders.has(key.toLowerCase())) {
        console.error(`\nboneyard: blocked unsafe header '${key}' in auth config`)
        process.exit(1)
      }
      config.auth.headers[key] = replaceEnvStrings(val)
    }
  }
}

/**
 * Only active if config.resolveEnvVars is true
 * Resolves all `env[...]` in a config value
 *
 * @returns {string} the value with all env strings resolved
 */
function replaceEnvStrings(value) {
  if (typeof value !== 'string') {
    return value
  }
  const regex = /env\[[^\]]*\]/g
  return value.replace(regex, resolveEnv)
}

/**
 * @param {string} str 
 * @returns the resolved env string 
 */
function resolveEnv(str) {
  const start = str.indexOf('[') + 1;
  const end = str.indexOf(']');
  let key
  if (end > start && end === str.length - 1) {
    key = str.substring(start, end)
  } else {
    console.error(
      `\nboneyard: could not parse environment variable: ${str}` +
      `\n  it should look like this: env[<VAR_NAME>]`
    )
    process.exit(1)
  }

  const value = process.env[key]
  if (value) {
    return value
  } else {
    console.error(
      `\nboneyard: no environment variable '${key} found'` +
      `\n  try: export $${key}='...'`
    )
    process.exit(1)
  }
}


// ── Auto-detect breakpoints from Tailwind ────────────────────────────────────

/** Tailwind v4 default breakpoints */
const TAILWIND_DEFAULTS = [640, 768, 1024, 1280, 1536]

async function detectTailwindBreakpoints() {
  // Check for Tailwind v4 (CSS-based config)
  const cssConfigPaths = [
    'src/app/globals.css',
    'src/globals.css',
    'app/globals.css',
    'styles/globals.css',
    'src/index.css',
    'index.css',
  ]

  for (const p of cssConfigPaths) {
    const full = resolve(process.cwd(), p)
    if (!existsSync(full)) continue
    try {
      const css = readFileSync(full, 'utf-8')
      if (css.includes('@import "tailwindcss"') || css.includes("@import 'tailwindcss'") || css.includes('@tailwind')) {
        return TAILWIND_DEFAULTS
      }
    } catch {}
  }

  // Check for tailwind in package.json dependencies
  try {
    const pkgPath = resolve(process.cwd(), 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (allDeps['tailwindcss']) return TAILWIND_DEFAULTS
    }
  } catch {}

  return null
}

if (!breakpoints) {
  const tw = await detectTailwindBreakpoints()
  if (tw) {
    // Add mobile (375) as the smallest breakpoint since Tailwind's start at 640
    breakpoints = [375, ...tw]
    process.stdout.write(`  boneyard: detected Tailwind — using breakpoints: ${breakpoints.join(', ')}px\n`)
  } else {
    breakpoints = [375, 768, 1280]
  }
}

// ── Auto-detect dev server ────────────────────────────────────────────────────

/**
 * Check if a URL is responding. Returns true if we get any HTTP response
 * (even 4xx/5xx — we just want to know something is listening).
 */
function probe(url) {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, { timeout: 1500 }, res => {
      res.destroy()
      resolve(true)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

/** Common dev server ports in priority order */
const DEV_PORTS = nativeMode
  ? [8081, 19006, 8082, 3000, 3001, 8080]
  : [3000, 3001, 3002, 5173, 5174, 4321, 8080, 8000, 4200, 8888]

async function detectDevServer() {
  for (const port of DEV_PORTS) {
    const url = `http://localhost:${port}`
    const ok = await probe(url)
    if (ok) return url
  }
  return null
}

// --native always uses the native scan receiver — no web server needed
if (nativeMode && urls.length === 0) {
  await runScan()
  process.exit(0)
}

if (urls.length === 0) {
  process.stdout.write('  boneyard: no URL provided — scanning for dev server...')
  const detected = await detectDevServer()
  if (detected) {
    process.stdout.write(` found ${detected}\n`)
    urls.push(detected)
  } else {
    process.stdout.write(' none found\n\n')
    console.error(
      '  boneyard: could not find a running dev server.\n\n' +
      '  Start your dev server first, then run:\n' +
      '    npx boneyard-js build\n\n' +
      '  Or pass your URL explicitly:\n' +
      '    npx boneyard-js build http://localhost:3000\n'
    )
    process.exit(1)
  }
}

// ── Load playwright ───────────────────────────────────────────────────────────

let chromium
try {
  const pw = await import('playwright')
  chromium = pw.chromium
} catch {
  console.error(
    '\nboneyard: playwright not found.\n\n' +
    'Install it:\n' +
    '  npm install -D playwright\n' +
    '  npx playwright install chromium\n'
  )
  process.exit(1)
}

// ── Capture ───────────────────────────────────────────────────────────────────

console.log(`\n  \x1b[1m💀 boneyard build\x1b[0m`)
console.log(`  \x1b[2m${'─'.repeat(50)}\x1b[0m`)
console.log(`  \x1b[2mbreakpoints\x1b[0m  ${breakpoints.join(', ')}px`)
console.log(`  \x1b[2moutput\x1b[0m       ${outDir}`)
if (watchMode) console.log(`  \x1b[2mwatch\x1b[0m        on`)
if (cdpPort) console.log(`  \x1b[2mcdp\x1b[0m          localhost:${cdpPort}`)
console.log('')

let browser
let cdpContext = null
if (cdpPort) {
  try {
    browser = await chromium.connectOverCDP(`http://localhost:${cdpPort}`)
    cdpContext = await browser.newContext()
    console.log(`  \x1b[2mConnected to Chrome on port ${cdpPort}\x1b[0m\n`)
  } catch (e) {
    console.error(
      `\nboneyard: could not connect to Chrome on port ${cdpPort}.\n\n` +
      'Make sure Chrome is running with:\n' +
      `  google-chrome --remote-debugging-port=${cdpPort}\n` +
      '  # or on macOS:\n' +
      `  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${cdpPort}\n`
    )
    process.exit(1)
  }
} else {
  try {
    browser = await chromium.launch()
  } catch (e) {
    if (e.message.includes("Executable doesn't exist")) {
      console.log('  boneyard: installing chromium...\n')
      const { execSync } = await import('child_process')
      const { createRequire } = await import('module')
      const require = createRequire(import.meta.url)
      const pwPath = dirname(require.resolve('playwright/package.json'))
      const playwrightCli = join(pwPath, 'cli.js')
      execSync(`node "${playwrightCli}" install chromium`, { stdio: 'inherit' })
      browser = await chromium.launch()
    } else {
      throw e
    }
  }
}
const page = cdpContext ? await cdpContext.newPage() : await browser.newPage()

// Apply auth if configured
if (config.auth) {
  if (config.auth.cookies?.length) {
    console.log(`  \x1b[2mApplying ${config.auth.cookies.length} cookie(s) to browser session\x1b[0m`)
    await page.context().addCookies(config.auth.cookies)
  }
  if (config.auth.headers) {
    const count = Object.keys(config.auth.headers).length
    console.log(`  \x1b[2mApplying ${count} header(s) to browser session\x1b[0m`)
    await page.setExtraHTTPHeaders(config.auth.headers)
  }
}

// Set build mode flag before any page loads so <Skeleton fixture={...}> renders mock content
await page.addInitScript(() => {
  window.__BONEYARD_BUILD = true
})

// ── Load existing bones for incremental builds ──────────────────────────────
import { createHash } from 'crypto'

const existingBones = {}
const outputDir = resolve(process.cwd(), outDir)
if (!forceRebuild && existsSync(outputDir)) {
  const files = (await import('fs')).readdirSync(outputDir)
  for (const f of files) {
    if (!f.endsWith('.bones.json')) continue
    try {
      const data = JSON.parse(readFileSync(join(outputDir, f), 'utf-8'))
      const name = f.replace('.bones.json', '')
      existingBones[name] = data
    } catch {}
  }
}

function hashContent(html) {
  return createHash('md5').update(html).digest('hex')
}


// ── gotoPage logic ────────────────────────────────────────────────────────────────

var guidedWaitOverrides = null

async function gotoPage(page, pageUrl) {
  try {
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15_000 })
  } catch {
    // networkidle can timeout on heavy pages — still try to capture
  }

  // Detect redirects (e.g. auth middleware sending to /login)
  const finalUrl = page.url()
  const requestedPath = new URL(pageUrl).pathname
  const finalPath = new URL(finalUrl).pathname
  if (finalPath !== requestedPath) {
    console.log(`    \x1b[33m⚠  Redirected: ${requestedPath} → ${finalPath}\x1b[0m`)
  }

  const effectiveWait = (typeof guidedWaitOverrides === 'object' && guidedWaitOverrides !== null && guidedWaitOverrides[pageUrl]) || waitMs
  if (effectiveWait > 0) await page.waitForTimeout(effectiveWait)
}

const skippedSkeletons = new Set()

// { [skeletonName]: { breakpoints: { [width]: SkeletonResult } } }
const collected = {}

// Crawl: discover all internal links starting from the provided URLs
const visited = new Set()
const toVisit = [...urls]

async function capturePage(pageUrl) {
  const pageSkeletons = new Map()
  const shortPath = pageUrl.replace(new URL(pageUrl).origin, '') || '/'
  console.log(`  ${shortPath}`)

  // At the first breakpoint, collect hashes to detect changes
  let pageHashes = {}
  const isFirstBreakpoint = (width) => width === breakpoints[0]

  for (const width of breakpoints) {
    await page.setViewportSize({ width, height: 900 })

    await gotoPage(page, pageUrl)

    // Find [data-boneyard] elements and extract bones using the real snapshotBones function
    const bones = await page.evaluate((collectHashes) => {
      const fn = window.__BONEYARD_SNAPSHOT
      if (!fn) return { results: {}, hashes: {}, snapshotMissing: true }

      const elements = document.querySelectorAll('[data-boneyard]')
      const results = {}
      const hashes = {}
      const duplicates = []

      for (const el of elements) {
        const name = el.getAttribute('data-boneyard')
        if (!name) continue

        // Only capture the first occurrence of each name — duplicates are skipped
        if (results[name]) {
          duplicates.push(name)
          continue
        }

        // Read snapshotConfig from data attribute
        const configStr = el.getAttribute('data-boneyard-config')
        const config = configStr ? JSON.parse(configStr) : undefined

        // Target the inner wrapper div that contains the fixture content
        const target = el.firstElementChild
        if (!target) continue

        // Collect hash of innerHTML for incremental builds
        if (collectHashes) {
          hashes[name] = target.innerHTML
        }

        try {
          results[name] = fn(target, name, config)
        } catch {
          // skip on error
        }
      }

      // Surface duplicate names so the user can fix them
      if (duplicates.length > 0) {
        results.__duplicates = [...new Set(duplicates)]
      }

      return { results, hashes }
    }, isFirstBreakpoint(width))

    // Log when __BONEYARD_SNAPSHOT is not found — usually means the <Skeleton> component
    // didn't mount (auth redirect, hydration failure, or addInitScript timing issue)
    if (bones.snapshotMissing && isFirstBreakpoint(width)) {
      console.log(`    \x1b[33m⚠  boneyard: __BONEYARD_SNAPSHOT not found — <Skeleton> may not have mounted on this page\x1b[0m`)
    }

    // On first breakpoint, compute hashes and check for unchanged skeletons
    if (isFirstBreakpoint(width) && bones.hashes) {
      for (const [name, html] of Object.entries(bones.hashes)) {
        const hash = hashContent(html)
        pageHashes[name] = hash
        if (!forceRebuild && existingBones[name]?._hash === hash) {
          // Skeleton unchanged — reuse existing data
          collected[name] = existingBones[name]
          skippedSkeletons.add(name)
        }
      }
    }

    // Replace bones with the results object
    const boneResults = bones.results ?? bones

    // Warn about duplicate skeleton names
    if (boneResults.__duplicates) {
      for (const dup of boneResults.__duplicates) {
        console.log(`    ⚠  Duplicate name "${dup}" — only the first occurrence was captured`)
      }
      delete boneResults.__duplicates
    }

    const names = Object.keys(boneResults)

    if (names.length === 0) {
      continue
    }

    for (const name of names) {
      // Skip unchanged skeletons
      if (skippedSkeletons.has(name)) continue

      collected[name] ??= { breakpoints: {} }
      // Convert bones to compact array format
      const result = boneResults[name]
      if (result.bones) {
        result.bones = result.bones.map(b => {
          const arr = [b.x, b.y, b.w, b.h, b.r]
          if (b.c) arr.push(true)
          return arr
        })
      }
      collected[name].breakpoints[width] = result
      // Store hash from first breakpoint
      if (pageHashes[name]) {
        collected[name]._hash = pageHashes[name]
      }
      const boneCount = result.bones?.length ?? 0
      if (!pageSkeletons.has(name)) {
        pageSkeletons.set(name, { counts: [] })
      }
      pageSkeletons.get(name).counts.push(boneCount)
    }
  }

  // Print grouped summary for this page
  // Show skipped skeletons found on this page
  const pageSkeletonNames = new Set([...pageSkeletons.keys()])
  const skippedOnPage = [...skippedSkeletons].filter(n => !pageSkeletonNames.has(n))

  if (pageSkeletons.size === 0 && skippedOnPage.length === 0) {
    // Check if there were skipped skeletons via hash from this page's evaluate
    const skippedHere = Object.keys(pageHashes).filter(n => skippedSkeletons.has(n))
    if (skippedHere.length > 0) {
      for (const name of skippedHere) {
        console.log(`    ⊘  ${name.padEnd(24)} unchanged`)
      }
    } else {
      console.log(`    –  No skeletons found`)
    }
  } else {
    // Show skipped from this page's hashes
    for (const name of Object.keys(pageHashes)) {
      if (skippedSkeletons.has(name)) {
        console.log(`    ⊘  ${name.padEnd(24)} unchanged`)
      }
    }
    for (const [name, info] of pageSkeletons) {
      const min = Math.min(...info.counts)
      const max = Math.max(...info.counts)
      const boneStr = min === max
        ? `${min} bones`
        : `${min} → ${max} bones (responsive)`
      console.log(`    ✓  ${name.padEnd(24)} ${boneStr}`)
    }
  }
}

// Discover internal links from a page
async function discoverLinks(pageUrl) {
  await gotoPage(page, pageUrl)

  const origin = new URL(pageUrl).origin
  const links = await page.evaluate((orig) => {
    return [...document.querySelectorAll('a[href]')]
      .map(a => a.href)
      .filter(href => href.startsWith(orig))
      .map(href => {
        const u = new URL(href)
        u.hash = ''
        u.search = ''
        return u.toString()
      })
  }, origin)

  return [...new Set(links)]
}

// Discover routes from filesystem (Next.js, SvelteKit, Vite/Remix)
function discoverRoutes(origin) {
  const cwd = process.cwd()
  const routes = []

  function walkDir(dir) {
    if (!existsSync(dir)) return []
    const entries = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        // Skip dynamic route segments like [id], (groups), __tests__
        if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
        entries.push(...walkDir(full))
      } else {
        entries.push(full)
      }
    }
    return entries
  }

  // Next.js App Router: app/**/page.{tsx,jsx,ts,js}
  const appDir = existsSync(join(cwd, 'src/app')) ? join(cwd, 'src/app') : join(cwd, 'app')
  if (existsSync(appDir)) {
    for (const file of walkDir(appDir)) {
      const base = file.split('/').pop()
      if (/^page\.(tsx|jsx|ts|js)$/.test(base)) {
        let route = dirname(file).replace(appDir, '') || '/'
        // Skip route groups like (marketing) — flatten them
        route = route.replace(/\/\([^)]+\)/g, '')
        if (!route) route = '/'
        routes.push(route)
      }
    }
  }

  // Next.js Pages Router: pages/**/*.{tsx,jsx,ts,js}
  const pagesDir = existsSync(join(cwd, 'src/pages')) ? join(cwd, 'src/pages') : join(cwd, 'pages')
  if (existsSync(pagesDir) && !existsSync(appDir)) {
    for (const file of walkDir(pagesDir)) {
      const base = file.split('/').pop()
      if (!/\.(tsx|jsx|ts|js)$/.test(base)) continue
      // Skip Next.js special files and API routes
      const name = base.replace(/\.(tsx|jsx|ts|js)$/, '')
      if (['_app', '_document', '_error', '404', '500'].includes(name)) continue
      let route = file.replace(pagesDir, '').replace(/\.(tsx|jsx|ts|js)$/, '')
      if (route.includes('/api/')) continue
      if (route.endsWith('/index')) route = route.replace(/\/index$/, '') || '/'
      routes.push(route)
    }
  }

  // SvelteKit: src/routes/**/+page.svelte
  const svelteDir = join(cwd, 'src/routes')
  if (existsSync(svelteDir)) {
    for (const file of walkDir(svelteDir)) {
      if (file.endsWith('+page.svelte')) {
        let route = dirname(file).replace(svelteDir, '') || '/'
        route = route.replace(/\/\([^)]+\)/g, '')
        if (!route) route = '/'
        routes.push(route)
      }
    }
  }

  // Nuxt: pages/**/*.vue
  const nuxtDir = existsSync(join(cwd, 'pages')) ? join(cwd, 'pages') : null
  if (nuxtDir && !existsSync(appDir) && !existsSync(pagesDir)) {
    for (const file of walkDir(nuxtDir)) {
      if (!file.endsWith('.vue')) continue
      let route = file.replace(nuxtDir, '').replace(/\.vue$/, '')
      if (route.endsWith('/index')) route = route.replace(/\/index$/, '') || '/'
      routes.push(route)
    }
  }

  // Remix / React Router v7: app/routes/**/*.{tsx,jsx,ts,js}
  const remixDir = join(cwd, 'app/routes')
  if (existsSync(remixDir)) {
    for (const file of walkDir(remixDir)) {
      const base = file.split('/').pop()
      if (!/\.(tsx|jsx|ts|js)$/.test(base)) continue
      let route = file.replace(remixDir, '').replace(/\.(tsx|jsx|ts|js)$/, '')
      // Remix flat routes: dots become slashes, _ prefix = pathless layout
      route = route.replace(/\./g, '/')
      if (route.endsWith('/index') || route.endsWith('/_index')) route = route.replace(/\/_?index$/, '') || '/'
      // Skip layout routes (prefixed with _)
      const segments = route.split('/')
      if (segments.some(s => s.startsWith('_') && s !== '_index')) continue
      routes.push(route)
    }
  }

  // Convert to full URLs and deduplicate
  const seen = new Set()
  const urls = []
  for (const route of routes) {
    // Skip dynamic segments — can't visit without params
    if (route.includes('[')) continue
    const url = `${origin}${route}`
    if (!seen.has(url)) {
      seen.add(url)
      urls.push(url)
    }
  }
  return urls
}

// Crawl all pages
const startUrl = urls[0]
const startOrigin = new URL(startUrl).origin

// Per-skeleton guided crawling: skip route discovery and go directly to specified routes
const skeletonsConfig = config.skeletons
if (skeletonsConfig && typeof skeletonsConfig === 'object' && Object.keys(skeletonsConfig).length > 0) {
  const entries = Object.entries(skeletonsConfig)
  console.log(`  \x1b[2mGuided crawl: ${entries.length} skeleton(s) configured\x1b[0m\n`)
  const guidedRoutes = new Set()
  const perRouteWait = {}
  for (const [name, opts] of entries) {
    if (!opts.route) continue
    const fullUrl = `${startOrigin}${opts.route}`
    guidedRoutes.add(fullUrl)
    if (opts.wait) perRouteWait[fullUrl] = opts.wait
  }
  // Replace toVisit with guided routes only
  toVisit.length = 0
  toVisit.push(...guidedRoutes)
  // Store per-route wait overrides for use in gotoPage
  guidedWaitOverrides = perRouteWait
} else {
  console.log(`  \x1b[2mCrawling ${startOrigin}\x1b[0m\n`)

  // Discover links from starting URLs
  for (const url of urls) {
    if (!visited.has(url)) {
      const links = await discoverLinks(url)
      for (const link of links) {
        if (!visited.has(link) && !toVisit.includes(link)) {
          toVisit.push(link)
        }
      }
    }
  }

  // Discover routes from filesystem
  if (!noScan) {
    const fsRoutes = discoverRoutes(startOrigin)
    let added = 0
    for (const route of fsRoutes) {
      if (!visited.has(route) && !toVisit.includes(route)) {
        toVisit.push(route)
        added++
      }
    }
    if (added > 0) {
      console.log(`  \x1b[2mFound ${added} additional route(s) from filesystem\x1b[0m\n`)
    }
  }
}

// Visit all discovered pages
for (const pageUrl of toVisit) {
  if (visited.has(pageUrl)) continue
  visited.add(pageUrl)
  await capturePage(pageUrl)
}

if (!watchMode) {
  if (cdpContext) await cdpContext.close()
  await browser.close()
}

// ── Write files ───────────────────────────────────────────────────────────────

if (Object.keys(collected).length === 0) {
  if (watchMode) {
    console.log('\n  boneyard: no skeletons found on first pass — will keep watching...\n')
  } else {
    console.error(
      '\n  boneyard: nothing captured.\n\n' +
      '  Make sure your components have <Skeleton name="my-component" loading={false}>\n' +
      '  so boneyard can snapshot them before the CLI reads the registry.\n'
    )
    process.exit(1)
  }
}

// ── Validate bones before writing ────────────────────────────────────────────
let hasWarnings = false
for (const [name, data] of Object.entries(collected)) {
  for (const [bp, result] of Object.entries(data.breakpoints)) {
    const bones = result.bones
    if (!bones || bones.length === 0) continue
    const maxRight = Math.max(...bones.map(b => b.x + b.w))
    if (maxRight < 50) {
      if (!hasWarnings) {
        console.log(`\n  \x1b[33m⚠  Bone coverage warnings:\x1b[0m`)
        hasWarnings = true
      }
      console.log(`     "${name}" at ${bp}px: bones only cover ${maxRight.toFixed(0)}% of container width`)
      console.log(`     This usually means the skeleton was captured from a container wider than its content.`)
      console.log(`     Check that the element rendered inside <Skeleton name="${name}"> fills its container.\n`)
    }
  }
}

mkdirSync(outputDir, { recursive: true })

console.log(`\n  \x1b[2m${'─'.repeat(50)}\x1b[0m`)
console.log(`  \x1b[1mWriting files\x1b[0m\n`)
for (const [name, data] of Object.entries(collected)) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const outPath = resolve(outputDir, `${safeName}.bones.json`)
  if (!outPath.startsWith(resolve(outputDir))) {
    console.error(`  \x1b[31m✗\x1b[0m Skipping "${name}" — path escapes output directory`)
    continue
  }
  writeFileSync(outPath, JSON.stringify(data, null, 2))
  const bpCount = Object.keys(data.breakpoints).length
  console.log(`  \x1b[32m→\x1b[0m ${safeName}.bones.json  \x1b[2m(${bpCount} breakpoint${bpCount !== 1 ? 's' : ''})\x1b[0m`)
}

// ── Generate registry.js ─────────────────────────────────────────────────────
const names = Object.keys(collected)
const hasRuntimeConfig = config.color || config.darkColor || config.animate !== undefined
// Detect framework for registry import — registerBones is always from the base
// package (shared across all adapters), configureBoneyard needs the framework path
function detectFramework() {
  if (nativeMode) return 'native'
  try {
    const pkgPath = resolve(process.cwd(), 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (allDeps['vue'] || allDeps['nuxt']) return 'vue'
      if (allDeps['svelte'] || allDeps['@sveltejs/kit']) return 'svelte'
      if (allDeps['@angular/core']) return 'angular'
      if (allDeps['preact']) return 'preact'
    }
  } catch {}
  return 'react'
}
const detectedFramework = detectFramework()
// registerBones lives in boneyard-js (shared). configureBoneyard is framework-specific.
const frameworkPaths = { react: 'boneyard-js/react', vue: 'boneyard-js/vue', native: 'boneyard-js/native', svelte: 'boneyard-js/svelte', angular: 'boneyard-js/angular', preact: 'boneyard-js/preact' }
const registryImportPath = 'boneyard-js'
const configImportPath = frameworkPaths[detectedFramework] || 'boneyard-js/react'
const registryLines = [
  ...(detectedFramework === 'react' ? ['"use client"'] : []),
  '// Auto-generated by `npx boneyard-js build` — do not edit',
]
if (hasRuntimeConfig) {
  registryLines.push(`import { registerBones } from '${registryImportPath}'`)
  registryLines.push(`import { configureBoneyard } from '${configImportPath}'`)
} else {
  registryLines.push(`import { registerBones } from '${registryImportPath}'`)
}
registryLines.push('')
for (const name of names) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const varName = '_' + safeName.replace(/[^a-zA-Z0-9]/g, '_')
  registryLines.push(`import ${varName} from './${safeName}.bones.json'`)
}
registryLines.push('')

// Emit configureBoneyard call if runtime defaults exist in config
if (hasRuntimeConfig) {
  const runtimeConfig = {}
  if (config.color) runtimeConfig.color = config.color
  if (config.darkColor) runtimeConfig.darkColor = config.darkColor
  if (config.animate !== undefined) runtimeConfig.animate = config.animate
  registryLines.push(`configureBoneyard(${JSON.stringify(runtimeConfig)})`)
  registryLines.push('')
}

registryLines.push('registerBones({')
for (const name of names) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const varName = '_' + safeName.replace(/[^a-zA-Z0-9]/g, '_')
  registryLines.push(`  "${safeName}": ${varName},`)
}
registryLines.push('})')
registryLines.push('')

const registryPath = join(outputDir, 'registry.js')
writeFileSync(registryPath, registryLines.join('\n'))
console.log(`  \x1b[32m→\x1b[0m registry.js  \x1b[2m(${names.length} skeleton${names.length !== 1 ? 's' : ''})\x1b[0m`)

const count = names.length
const skippedCount = skippedSkeletons.size
const updatedCount = count - skippedCount
if (skippedCount > 0) {
  console.log(`\n  \x1b[32m\x1b[1m💀 ${count} skeleton${count !== 1 ? 's' : ''}\x1b[0m \x1b[2m(${updatedCount} updated, ${skippedCount} unchanged)\x1b[0m\n`)
} else {
  console.log(`\n  \x1b[32m\x1b[1m💀 ${count} skeleton${count !== 1 ? 's' : ''} captured.\x1b[0m\n`)
}
console.log(`  \x1b[2mAdd once to your app entry:\x1b[0m  import '${outDir}/registry'`)
if (nativeMode) {
  console.log(`  \x1b[2mImport Skeleton from:\x1b[0m       import { Skeleton } from 'boneyard-js/native'`)
}
console.log(`  \x1b[2mThen just use:\x1b[0m              <Skeleton name="..." loading={isLoading}>\n`)


// ── Watch mode ───────────────────────────────────────────────────────────────

if (watchMode && !nativeMode) {
  console.log(`  \x1b[2m👀 Watching for changes... (Ctrl+C to stop)\x1b[0m\n`)

  // Store a snapshot of all bone hashes from the initial build
  let lastSnapshot = JSON.stringify(collected)

  function writeWatchResults() {
    const writeNames = Object.keys(collected)
    if (writeNames.length === 0) return

    mkdirSync(outputDir, { recursive: true })
    for (const [wName, wData] of Object.entries(collected)) {
      const safeName = wName.replace(/[^a-zA-Z0-9._-]/g, '_')
      const wPath = resolve(outputDir, `${safeName}.bones.json`)
      if (!wPath.startsWith(resolve(outputDir))) continue
      writeFileSync(wPath, JSON.stringify(wData, null, 2))
    }

    const wRegistryLines = [
      ...(detectedFramework === 'react' ? ['"use client"'] : []),
      '// Auto-generated by `npx boneyard-js build` — do not edit',
    ]
    if (hasRuntimeConfig) {
      wRegistryLines.push(`import { registerBones } from '${registryImportPath}'`)
      wRegistryLines.push(`import { configureBoneyard } from '${configImportPath}'`)
    } else {
      wRegistryLines.push(`import { registerBones } from '${registryImportPath}'`)
    }
    wRegistryLines.push('')
    for (const wn of writeNames) {
      const wsafe = wn.replace(/[^a-zA-Z0-9._-]/g, '_')
      const wv = '_' + wsafe.replace(/[^a-zA-Z0-9]/g, '_')
      wRegistryLines.push(`import ${wv} from './${wsafe}.bones.json'`)
    }
    wRegistryLines.push('')
    if (hasRuntimeConfig) {
      const rc = {}
      if (config.color) rc.color = config.color
      if (config.darkColor) rc.darkColor = config.darkColor
      if (config.animate !== undefined) rc.animate = config.animate
      wRegistryLines.push(`configureBoneyard(${JSON.stringify(rc)})`)
      wRegistryLines.push('')
    }
    wRegistryLines.push('registerBones({')
    for (const wn of writeNames) {
      const wsafe = wn.replace(/[^a-zA-Z0-9._-]/g, '_')
      const wv = '_' + wsafe.replace(/[^a-zA-Z0-9]/g, '_')
      wRegistryLines.push(`  "${wsafe}": ${wv},`)
    }
    wRegistryLines.push('})')
    wRegistryLines.push('')
    writeFileSync(join(outputDir, 'registry.js'), wRegistryLines.join('\n'))
  }

  async function recapture() {
    const originalLog = console.log
    originalLog(`  \x1b[2m⟳ Change detected — recapturing...\x1b[0m`)
    console.log = () => {}
    try {
      for (const key of Object.keys(collected)) delete collected[key]
      skippedSkeletons.clear()
      visited.clear()
      toVisit.length = 0
      for (const url of urls) toVisit.push(url)

      for (const watchUrl of [...toVisit]) {
        if (visited.has(watchUrl)) continue
        visited.add(watchUrl)
        const links = await discoverLinks(watchUrl)
        for (const link of links) {
          if (!visited.has(link) && !toVisit.includes(link)) toVisit.push(link)
        }
      }
      for (const watchUrl of toVisit) {
        await capturePage(watchUrl)
      }

      const newSnapshot = JSON.stringify(collected)
      if (newSnapshot !== lastSnapshot && Object.keys(collected).length > 0) {
        lastSnapshot = newSnapshot
        const ts = new Date().toLocaleTimeString()
        const updatedNames = Object.keys(collected)
        originalLog(`  \x1b[32m↻\x1b[0m \x1b[2m${ts}\x1b[0m Updated: ${updatedNames.join(', ')}`)
        writeWatchResults()
      }
    } catch {
      // Dev server might be restarting — ignore
    } finally {
      console.log = originalLog
    }
  }

  let debounceTimer = null
  let isRecapturing = false

  function scheduleRecapture() {
    if (isRecapturing) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (isRecapturing) return
      isRecapturing = true
      try { await recapture() } finally { isRecapturing = false }
    }, 2000)
  }

  // Navigate to the start page and wait for it to settle
  await gotoPage(page, urls[0])

  // NOW start listening — after initial build + navigation are done
  // Detect HMR updates across frameworks:
  //   Vite:    "[vite] hot updated: /src/App.vue"
  //   Next.js: "[Fast Refresh] done" or "[HMR] connected"
  //   Webpack: "[HMR] Updated modules:" or "[webpack] Recompiling"
  //   Nuxt:    "[vite] hot updated"
  //   SvelteKit: "[vite] hot updated"
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.includes('hot updated') ||
        text.includes('Fast Refresh] done') ||
        text.includes('[HMR] Updated') ||
        text.includes('Recompiling')) {
      scheduleRecapture()
    }
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (cdpContext) await cdpContext.close()
    await browser.close()
    console.log('\n  \x1b[2mWatch stopped.\x1b[0m\n')
    process.exit(0)
  })

  // Keep process alive
  await new Promise(() => {})
}

// ── Native scan command ──────────────────────────────────────────────────────

async function runScan() {
  const scanOut = outDir
  const scanPort = 9999
  const scanTimeout = watchMode ? 0 : 120000

  const scanOutDir = resolve(process.cwd(), scanOut)
  mkdirSync(scanOutDir, { recursive: true })

  const collected = {}
  let skeletonCount = 0

  console.log('')
  console.log('  \x1b[1m💀 boneyard build --native\x1b[0m')
  console.log('')
  console.log(`  \x1b[2mListening on port ${scanPort}...\x1b[0m`)
  console.log(`  \x1b[2mSaving to: ${scanOut}\x1b[0m`)
  console.log('')
  console.log('  Open your app — bones are captured automatically.')
  if (watchMode) {
    console.log('  \x1b[2m👀 Watch mode — stays open until you press Ctrl+C.\x1b[0m')
  } else {
    console.log('  \x1b[2mPress Ctrl+C when done, or wait for all bones.\x1b[0m')
  }
  console.log('')

  return new Promise((resolvePromise) => {
    let doneTimer = null

    function writeBones() {
      const names = Object.keys(collected)
      if (names.length === 0) {
        console.log('  \x1b[33m⚠  No bones received.\x1b[0m')
        console.log('  Make sure your app has <Skeleton name="..." loading={...}> components')
        console.log('  and the app is open on device/simulator.\n')
        resolvePromise()
        return
      }

      console.log(`\n  \x1b[2m${'─'.repeat(50)}\x1b[0m`)
      console.log('  \x1b[1mWriting files\x1b[0m\n')

      for (const [name, data] of Object.entries(collected)) {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const outPath = join(scanOutDir, `${safeName}.bones.json`)
        // Ensure the resolved path stays within the output directory
        const resolvedOut = resolve(outPath)
        const resolvedDir = resolve(scanOutDir)
        if (!resolvedOut.startsWith(resolvedDir)) {
          console.error(`  \x1b[31m✗\x1b[0m Skipping "${name}" — path escapes output directory`)
          continue
        }
        writeFileSync(resolvedOut, JSON.stringify(data, null, 2))
        const bpCount = Object.keys(data.breakpoints).length
        console.log(`  \x1b[32m→\x1b[0m ${safeName}.bones.json  \x1b[2m(${bpCount} breakpoint${bpCount !== 1 ? 's' : ''})\x1b[0m`)
      }

      // Generate registry
      const registryLines = [
        '// Auto-generated by `npx boneyard-js scan` — do not edit',
        "import { registerBones } from 'boneyard-js/native'",
        '',
      ]
      for (const name of names) {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const varName = '_' + safeName.replace(/[^a-zA-Z0-9]/g, '_')
        registryLines.push(`import ${varName} from './${safeName}.bones.json'`)
      }
      registryLines.push('')
      registryLines.push('registerBones({')
      for (const name of names) {
        const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const varName = '_' + safeName.replace(/[^a-zA-Z0-9]/g, '_')
        registryLines.push(`  "${safeName}": ${varName},`)
      }
      registryLines.push('})')
      registryLines.push('')

      const registryPath = join(scanOutDir, 'registry.js')
      writeFileSync(registryPath, registryLines.join('\n'))
      console.log(`  \x1b[32m→\x1b[0m registry.js  \x1b[2m(${names.length} skeleton${names.length !== 1 ? 's' : ''})\x1b[0m`)

      console.log(`\n  \x1b[32m\x1b[1m💀 ${names.length} skeleton${names.length !== 1 ? 's' : ''} captured.\x1b[0m\n`)
      console.log(`  \x1b[2mAdd once to your app entry:\x1b[0m  import '${scanOut}/registry'`)
      console.log(`  \x1b[2mImport Skeleton from:\x1b[0m       import { Skeleton } from 'boneyard-js/native'`)
      console.log(`  \x1b[2mThen just use:\x1b[0m              <Skeleton name="..." loading={isLoading}>\n`)

      resolvePromise()
    }

    // Auto-finish 2s after last bone received (watch mode: only write if changed)
    let lastWrittenSnapshot = ''
    function resetDoneTimer() {
      if (watchMode) {
        // Only write if bones actually changed — prevents Metro hot reload loop
        const snapshot = JSON.stringify(collected)
        if (snapshot !== lastWrittenSnapshot && Object.keys(collected).length > 0) {
          lastWrittenSnapshot = snapshot
          writeBones()
        }
        return
      }
      if (doneTimer) clearTimeout(doneTimer)
      doneTimer = setTimeout(() => {
        server.close()
        writeBones()
      }, 2000)
    }

    const server = http.createServer((req, res) => {
      // CORS for device → localhost
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(200)
        res.end()
        return
      }

      if (req.method === 'POST' && req.url === '/bones') {
        const MAX_BODY = 5 * 1024 * 1024 // 5MB limit
        let body = ''
        let overflow = false
        req.on('data', chunk => {
          body += chunk
          if (body.length > MAX_BODY) {
            overflow = true
            req.destroy()
          }
        })
        req.on('end', () => {
          if (overflow) {
            res.writeHead(413)
            res.end(JSON.stringify({ error: 'Request body too large' }))
            return
          }
          try {
            const data = JSON.parse(body)
            const name = data.name
            const result = data.result
            const responsive = data.responsive

            // Validate name: must be a non-empty string with safe characters only
            if (!name || typeof name !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(name)) {
              res.writeHead(400)
              res.end(JSON.stringify({ error: 'Invalid skeleton name. Use only alphanumeric, dot, dash, underscore.' }))
              return
            }

            if (responsive && typeof responsive === 'object' && responsive.breakpoints) {
              collected[name] = responsive
              const bpCount = Object.keys(responsive.breakpoints).length
              console.log(`  \x1b[32m✓\x1b[0m ${name}  \x1b[2m(${bpCount} breakpoints)\x1b[0m`)
              skeletonCount++
            } else if (result && typeof result === 'object') {
              if (!collected[name]) collected[name] = { breakpoints: {} }
              const bp = result.viewportWidth || result.width
              collected[name].breakpoints[bp] = result
              const boneCount = result.bones?.length ?? 0
              console.log(`  \x1b[32m✓\x1b[0m ${name}  \x1b[2m(${boneCount} bones @ ${bp}px)\x1b[0m`)
              skeletonCount++
            }

            resetDoneTimer()
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            console.error(`  \x1b[31m✗\x1b[0m Error: ${err.message}`)
            res.writeHead(400)
            res.end(JSON.stringify({ error: err.message }))
          }
        })
        return
      }

      // Health check — BoneScan pings this to know the CLI is running
      if (req.method === 'GET' && req.url === '/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ boneyard: true }))
        return
      }

      res.writeHead(404)
      res.end('Not found')
    })

    server.listen(scanPort, '0.0.0.0')

    // Global timeout (disabled in watch mode)
    if (scanTimeout > 0) {
      setTimeout(() => {
        server.close()
        writeBones()
      }, scanTimeout)
    }

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      server.close()
      writeBones()
    })
  })
}

// ── Help ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
  boneyard build [url] [options]

  Visits your app in a headless browser, captures all named <Skeleton>
  components, and writes .bones.json files + a registry to disk.

  Auto-detects your dev server if no URL is given (scans ports 3000, 5173, etc.).

  Options:
    --out <dir>          Output directory             (default: ./src/bones)
    --breakpoints <bp>   Comma-separated px widths    (default: 375,768,1280)
    --wait <ms>          Extra wait after page load   (default: 800)
    --env-file <path>    Load env vars from file      (useful for Bun runtime)
    --force              Recapture all skeletons      (skip incremental cache)
    --no-scan            Skip filesystem route scanning (only crawl links)
    --watch              Re-capture when your app changes (listens for HMR)
    --cdp <port>         Connect to existing Chrome via debug port instead
                         of launching Playwright (reuses cookies, auth, state).
                         Launch Chrome with: --remote-debugging-port=<port>
    --native             React Native mode — captures bones from a running
                         native app on device/simulator (no browser needed).
                         Registry imports from boneyard-js/native.

  Config file:
    Create boneyard.config.json in your project root to set defaults:

    {
      "breakpoints": [375, 768, 1280],
      "out": "./src/bones",
      "wait": 800
    }

    CLI flags override config file values.

  Authentication (for pages requiring login):
    {
      "resolveEnvVars": true,
      "auth": {
        "cookies": [{ "name": "session", "value": "env[SESSION_TOKEN]" }],
        "headers": { "Authorization": "Bearer env[TOKEN]" }
      }
    }

    Use env[VAR_NAME] syntax to reference environment variables.
    Set resolveEnvVars: true to enable env var resolution.
    Note: env var resolution is only supported for auth config (cookies and headers).
    Use --env-file .env.local if env vars aren't in your shell (e.g. Bun runtime).

  Examples:
    npx boneyard-js build
    npx boneyard-js build http://localhost:5173
    npx boneyard-js build --watch
    npx boneyard-js build --native --out ./bones

  Web setup:
    1. Wrap your component:
       <Skeleton name="blog-card" loading={isLoading}>
         <BlogCard />
       </Skeleton>

    2. Run: npx boneyard-js build

    3. Import the registry once in your app entry:
       import './bones/registry'

  React Native setup:
    1. Wrap your component:
       import { Skeleton } from 'boneyard-js/native'
       <Skeleton name="blog-card" loading={isLoading}>
         <BlogCard />
       </Skeleton>

    2. Run: npx boneyard-js build --native
       Then open your app on device — bones capture automatically.

    3. Import the registry once in your app entry:
       import './bones/registry'

    Done. Every <Skeleton name="..."> auto-resolves its bones.
`)
}
