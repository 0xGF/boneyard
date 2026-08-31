/**
 * URL classification helpers for the CLI.
 *
 * Kept in its own module (rather than inline in cli.js) so the logic can be
 * unit-tested from `src/` without spawning a real CLI subprocess. Imported by
 * `bin/cli.js` and `src/cli-url.test.ts`.
 */

/**
 * Returns true when the URL has a non-root path — anything after the origin
 * other than `/` or empty. Examples:
 *
 *   http://localhost:3000              → false  (bare origin)
 *   http://localhost:3000/             → false  (root path)
 *   http://localhost:3000/dashboard    → true
 *   http://localhost:3000/a/b?x=1#y    → true
 *
 * Returns false on parse errors so a malformed URL never silently activates
 * single-page mode.
 *
 * @param {string} u
 * @returns {boolean}
 */
export function hasNonRootPath(u) {
  try {
    const parsed = new URL(u)
    const p = parsed.pathname
    return p !== '' && p !== '/'
  } catch {
    return false
  }
}

/**
 * Single-page mode is active when the user explicitly passed at least one URL
 * with a non-root path. The CLI documents this as "Specific page" capture
 * (see apps/docs/src/app/cli/page.tsx) and the implementation must match —
 * skip link-following from the page, skip filesystem route discovery, skip
 * config.routes/skeletons augmentation. The given URLs ARE the queue.
 *
 * Bare origins (`http://localhost:3000`) and the empty list (auto-detect)
 * keep the legacy crawl-everything behaviour.
 *
 * @param {string[]} urls
 * @returns {boolean}
 */
export function isSinglePageMode(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return false
  return urls.some(hasNonRootPath)
}

/**
 * Resolve the `--cdp` / `cdp` option into a Playwright `connectOverCDP`
 * endpoint. Two Chrome remote-debugging modes are supported (#91):
 *
 *   9222                                   → 'http://localhost:9222'
 *     Chrome launched with --remote-debugging-port (plus --user-data-dir on
 *     Chrome 136+). Playwright discovers the WebSocket URL via /json/version.
 *
 *   'ws://127.0.0.1:9222/devtools/browser/<uuid>' → passed through verbatim
 *     The chrome://inspect "Allow remote debugging" toggle (Chrome 144+)
 *     exposes only a WebSocket endpoint — the HTTP discovery endpoints 404.
 *     The full endpoint is in <user-data-dir>/DevToolsActivePort.
 *
 * http(s):// URLs are also passed through for proxied discovery endpoints.
 * Returns null when the value is neither a valid port nor a URL.
 *
 * @param {number | string | null | undefined} value
 * @returns {string | null}
 */
export function resolveCdpEndpoint(value) {
  if (value === null || value === undefined || value === '') return null
  const s = String(value).trim()
  if (/^\d+$/.test(s)) {
    const port = Number(s)
    if (port < 1 || port > 65535) return null
    return `http://localhost:${port}`
  }
  if (/^(ws|wss|http|https):\/\//.test(s)) return s
  return null
}
