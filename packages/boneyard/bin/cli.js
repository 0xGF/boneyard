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

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { resolve, join, dirname } from 'path'
import http from 'http'
import https from 'https'

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
console.log(`  \x1b[2moutput\x1b[0m       ${outDir}\n`)

let browser
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
const page = await browser.newPage()

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

async function gotoPage(page, pageUrl) {
  try {
    await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 15_000 })
  } catch {
    // networkidle can timeout on heavy pages — still try to capture
  }

  if (waitMs > 0) await page.waitForTimeout(waitMs)
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
      if (!fn) return { results: {}, hashes: {} }

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

// Crawl all pages
const startUrl = urls[0]
const startOrigin = new URL(startUrl).origin

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

// Visit all discovered pages
for (const pageUrl of toVisit) {
  if (visited.has(pageUrl)) continue
  visited.add(pageUrl)
  await capturePage(pageUrl)
}

await browser.close()

// ── Write files ───────────────────────────────────────────────────────────────

if (Object.keys(collected).length === 0) {
  console.error(
    '\n  boneyard: nothing captured.\n\n' +
    '  Make sure your components have <Skeleton name="my-component" loading={false}>\n' +
    '  so boneyard can snapshot them before the CLI reads the registry.\n'
  )
  process.exit(1)
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
  const outPath = join(outputDir, `${name}.bones.json`)
  writeFileSync(outPath, JSON.stringify(data, null, 2))
  const bpCount = Object.keys(data.breakpoints).length
  console.log(`  \x1b[32m→\x1b[0m ${name}.bones.json  \x1b[2m(${bpCount} breakpoint${bpCount !== 1 ? 's' : ''})\x1b[0m`)
}

// ── Generate registry.js ─────────────────────────────────────────────────────
const names = Object.keys(collected)
const hasRuntimeConfig = config.color || config.darkColor || config.animate !== undefined
const registryImportPath = nativeMode ? 'boneyard-js/native' : 'boneyard-js/react'
const registryLines = [
  ...(nativeMode ? [] : ['"use client"']),
  '// Auto-generated by `npx boneyard-js build` — do not edit',
  hasRuntimeConfig
    ? `import { registerBones, configureBoneyard } from '${registryImportPath}'`
    : `import { registerBones } from '${registryImportPath}'`,
  '',
]
for (const name of names) {
  const varName = '_' + name.replace(/[^a-zA-Z0-9]/g, '_')
  registryLines.push(`import ${varName} from './${name}.bones.json'`)
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
  const varName = '_' + name.replace(/[^a-zA-Z0-9]/g, '_')
  registryLines.push(`  "${name}": ${varName},`)
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


// ── Native scan command ──────────────────────────────────────────────────────

async function runScan() {
  const scanOut = outDir
  const scanPort = 9999
  const scanTimeout = 120000

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
  console.log('  \x1b[2mPress Ctrl+C when done, or wait for all bones.\x1b[0m')
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

    // Auto-finish 2s after last bone received
    function resetDoneTimer() {
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

    // Global timeout
    setTimeout(() => {
      server.close()
      writeBones()
    }, scanTimeout)

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
    --force              Recapture all skeletons      (skip incremental cache)
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

  Examples:
    npx boneyard-js build
    npx boneyard-js build http://localhost:5173
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
