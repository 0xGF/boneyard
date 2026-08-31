# boneyard

Pixel-perfect skeleton loading screens, extracted from your real DOM.

Wrap your component in `<Skeleton>`, run the CLI, and get positioned bone rectangles that match your actual layout. No manual sizing, no guesswork.

## Quick start

```bash
npm install boneyard-js
```

```tsx
import { Skeleton } from 'boneyard-js/react'

function BlogPage() {
  const { data, isLoading } = useFetch('/api/post')

  return (
    <Skeleton name="blog-card" loading={isLoading}>
      <BlogCard data={data} />
    </Skeleton>
  )
}
```

```bash
npx boneyard-js build http://localhost:3000
```

```ts
// app/layout.tsx — import once, all skeletons auto-resolve
import './bones/registry'
```

## Frameworks

```tsx
// React
import { Skeleton } from 'boneyard-js/react'

// Preact
import { Skeleton } from 'boneyard-js/preact'

// React Native
import { Skeleton } from 'boneyard-js/native'
```

```svelte
<!-- Svelte -->
<script lang="ts">
  import Skeleton from 'boneyard-js/svelte'
</script>

<Skeleton name="profile-card" loading={isLoading}>
  <ProfileCard />
</Skeleton>
```

```vue
<!-- Vue -->
<script setup>
import Skeleton from 'boneyard-js/vue'
</script>

<Skeleton name="profile-card" :loading="isLoading">
  <ProfileCard />
</Skeleton>
```

```ts
// Angular
import { SkeletonComponent } from 'boneyard-js/angular'
```

## Config

Create `boneyard.config.json` in your project root. Controls both the CLI and runtime defaults.

```json
{
  "breakpoints": [375, 768, 1280],
  "out": "./src/bones",

  "color": "#e5e5e5",
  "darkColor": "#2a2a2a",
  "animate": "shimmer",
  "shimmerColor": "#ebebeb",
  "darkShimmerColor": "#333333",
  "speed": "2s",
  "shimmerAngle": 110
}
```

All color values accept any valid CSS color (hex, rgba, hsl, etc.).

| Key | Default | Description |
|-----|---------|-------------|
| `breakpoints` | auto | Viewport widths for capture (auto-detects Tailwind) |
| `out` | `./src/bones` | Output directory for `.bones.json` and `registry.js` |
| `wait` | `800` | ms to wait after page load before capturing |
| `color` | `#f0f0f0` | Bone fill color (light mode) |
| `darkColor` | `#222222` | Bone fill color (dark mode) |
| `animate` | `pulse` | `pulse`, `shimmer`, or `solid` |
| `shimmerColor` | `#f7f7f7` | Shimmer highlight (light mode) |
| `darkShimmerColor` | `#2c2c2c` | Shimmer highlight (dark mode) |
| `speed` | `2s` / `1.8s` | Animation duration (shimmer / pulse) |
| `shimmerAngle` | `110` | Shimmer gradient angle in degrees |
| `stagger` | `false` | Delay between bones in ms (`true` = 80ms) |
| `transition` | `false` | Fade out when loading ends in ms (`true` = 300ms) |
| `select` | `container` | Width used to pick the responsive breakpoint: `container` (measured width) or `viewport` (`window.innerWidth`). Use `viewport` for app-shell layouts where the container is narrower than the window |
| `url` | dev server | Capture origin for the Vite plugin, e.g. `https://myapp.dev` — use when the dev server sits behind a reverse proxy (portless, custom HTTPS origins) so auth cookies scoped to the real origin apply. Defaults to the server's own `localhost:<port>`. Also available as a `boneyardPlugin({ url })` option |

Per-component props override config. Config overrides package defaults.

## Fixtures

When your component needs API data or auth to render, provide a fixture for the CLI to snapshot instead:

```tsx
<Skeleton
  name="dashboard"
  loading={isLoading}
  fixture={<DashboardFixture />}
  snapshotConfig={{ leafTags: ["section"] }}
>
  <Dashboard data={data} />
</Skeleton>
```

Use `leafTags` to treat elements as atomic bones — prevents the extractor from recursing into children and creating unwanted internal shapes. A leaf tag is atomic only while everything it holds is inline: `<p>Hello <strong>world</strong></p>` is one bone, but an `li` (or any listed tag) wrapping block-level content — a card inside a list item, say — is walked into like a container, so lists of cards keep their inner structure.

## Dark mode

Detected via the `.dark` class on `<html>` or any ancestor (standard Tailwind convention). Does **not** use `prefers-color-scheme` — gives you explicit control.

When `.dark` is present, `darkColor` and `darkShimmerColor` are used automatically.

## CLI

The `build` command (and the Vite plugin) drive a headless Chromium via [Playwright](https://playwright.dev) to snapshot your rendered UI. Playwright ships as a dependency of `boneyard-js`, so it's already in `node_modules` — but its **browser binary** is downloaded separately. Install it **once** before your first build:

```bash
npx playwright install chromium
```

> Skipping this step is the most common first-run error. If Playwright reports a missing browser, run the command above. (Note: `playwright install` only works because Playwright is a dependency here — if you hit `Command "playwright" not found` in a strict pnpm/monorepo setup, use `npx playwright install chromium`.)

Prefer not to download a browser — e.g. in CI, or to reuse your logged-in session? See [Reusing an existing browser](#reusing-an-existing-browser).

```bash
npx boneyard-js build                              # auto-detect dev server
npx boneyard-js build http://localhost:3000         # explicit URL
npx boneyard-js build --out src/bones              # custom output
npx boneyard-js build --force                      # regenerate all
npx boneyard-js build --breakpoints 375,768,1280   # custom breakpoints
npx boneyard-js build --cookie "session=abc123"    # auth cookies
npx boneyard-js build --native --out ./bones       # React Native
```

### Reusing an existing browser

Instead of launching (and downloading) Playwright's Chromium, boneyard can attach to a Chrome you're already running over the DevTools Protocol. This reuses your cookies and auth state, and skips the browser download — useful in CI or behind a login.

Chrome exposes two remote-debugging modes, and boneyard supports both:

**Mode 1 — debug port (separate profile).** Launch Chrome with a debugging port. Since Chrome 136, `--remote-debugging-port` is ignored on the default profile, so a non-default `--user-data-dir` is required:

```bash
# 1. Fully quit Chrome, then start an isolated debugging profile:
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
# macOS:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# 2. CLI
npx boneyard-js build --cdp 9222

# 2. …or the Vite plugin
# boneyardPlugin({ cdp: 9222 })
```

**Mode 2 — attach to your normal running Chrome (Chrome 144+).** Enable `chrome://inspect/#remote-debugging` → *"Allow remote debugging for this browser instance"*. This mode doesn't expose the HTTP discovery endpoint (`/json/version` returns 404) — instead Chrome writes a WebSocket endpoint to `DevToolsActivePort` in your user data directory. Pass that full `ws://` endpoint to boneyard; Chrome will ask you to approve the incoming connection:

```bash
# macOS default profile — the file holds a port and a path, join them:
cat ~/Library/Application\ Support/Google/Chrome/DevToolsActivePort
# → 9222
# → /devtools/browser/<uuid>

npx boneyard-js build --cdp ws://127.0.0.1:9222/devtools/browser/<uuid>
# or: boneyardPlugin({ cdp: 'ws://127.0.0.1:9222/devtools/browser/<uuid>' })
```

> A `404 when connecting to http://localhost:9222/json/version` means the port isn't exposing the DevTools HTTP endpoint — you're either on Chrome 136+ without `--user-data-dir` (Mode 1), or using the chrome://inspect toggle, which only exposes the WebSocket endpoint (use Mode 2's `ws://` form).

## Layout APIs

For advanced use cases — SSR, responsive tooling, or rendering skeletons without the component.

### `computeLayout(descriptor, width)`

```ts
import { computeLayout } from 'boneyard-js'

const result = computeLayout(descriptor, 375)
```

The first call compiles the descriptor tree and measures text nodes. Later calls with the same descriptor reuse the compiled tree.

### `compileDescriptor(descriptor)` + `computeLayout(compiled, width)`

Explicit control over compilation:

```ts
import { compileDescriptor, computeLayout } from 'boneyard-js'

const compiled = compileDescriptor(descriptor)

const mobile  = computeLayout(compiled, 375)
const tablet  = computeLayout(compiled, 768)
const desktop = computeLayout(compiled, 1280)
```

Use `compileDescriptor` when you render the same skeleton at multiple breakpoints, keep a registry in memory, or want to benchmark cold vs hot performance.

If you mutate a descriptor in place, the engine detects the change and rebuilds automatically. To force an immediate rebuild, call `invalidateDescriptor(descriptor)`.

## Docs

[boneyard.vercel.app](https://boneyard.vercel.app)

## License

MIT
