const PROMPT = `# boneyard-js

Pixel-perfect skeleton loading screens, extracted directly from your real DOM. No manual measurement, no hand-tuned placeholders.

## How it works

1. Wrap your component with \`<Skeleton>\` and give it a \`name\`
2. Optionally add a \`fixture\` prop with mock data for the build step
3. Run \`npx boneyard-js build\` — Playwright crawls your app, snapshots every named Skeleton at multiple breakpoints, and writes \`.bones.json\` files + a \`registry.js\`
4. Add \`import './bones/registry'\` once in your app entry — every Skeleton auto-resolves its bones by name

## Install

\`\`\`
npm install boneyard-js
\`\`\`

## Quick start

\`\`\`tsx
// app/layout.tsx — import the registry once (must be client-side for Next.js)
import './bones/registry'
\`\`\`

\`\`\`tsx
import { Skeleton } from 'boneyard-js/react'

function BlogPage() {
  const { data, isLoading } = useFetch('/api/post')
  return (
    <Skeleton
      name="blog-card"
      loading={isLoading}
      fixture={<BlogCard data={MOCK_DATA} />}
    >
      {data && <BlogCard data={data} />}
    </Skeleton>
  )
}
\`\`\`

## The fixture prop

Apps often have authentication or user-specific data that isn't available during the build step. The \`fixture\` prop provides mock content that only renders when the CLI is capturing — never in production.

\`\`\`tsx
<Skeleton
  name="dashboard"
  loading={isLoading}
  fixture={<Dashboard data={{
    title: "Sample Title",
    stats: [{ label: "Revenue", value: "$12.3k" }]
  }} />}
>
  {data && <Dashboard data={data} />}
</Skeleton>
\`\`\`

The mock data doesn't need to be real — it just needs to produce the same layout shape (same number of cards, similar text lengths, etc.).

## Generate the bones

With your dev server running:

\`\`\`
npx boneyard-js build
\`\`\`

The CLI:
- Auto-detects your dev server by scanning common ports (3000, 5173, 4321, 8080…)
- Auto-detects Tailwind breakpoints from your config (falls back to 375, 768, 1280)
- Crawls all internal links starting from the root URL
- Finds every \`<Skeleton name="...">\` on each page
- Captures bones at every breakpoint
- Writes \`.bones.json\` files + a \`registry.js\` to your output directory
- Auto-installs Chromium on first run

Or pass a URL explicitly: \`npx boneyard-js build http://localhost:5173\`

Re-run whenever your layout changes to regenerate. The CLI uses incremental builds — it hashes each skeleton's content and skips unchanged components. Use \`--force\` to bypass the cache and recapture everything.

**Next.js App Router:** The generated \`registry.js\` includes \`"use client"\` automatically. \`<Skeleton>\` uses hooks — add \`"use client"\` to any file that imports it.

## Responsive

The CLI captures bones at multiple breakpoints (default: 375, 768, 1280). At runtime, \`<Skeleton>\` uses ResizeObserver to pick the closest breakpoint based on container width.

Bones store \`x\` and \`w\` as percentages of the container width, so they scale naturally within a breakpoint range.

Custom breakpoints: \`npx boneyard-js build --breakpoints 390,820,1440\`

Tailwind breakpoints are auto-detected from your config.

## SSR

Boneyard is SSR-friendly. The CLI pre-computes skeleton layouts at build time into \`.bones.json\` files. At runtime, \`<Skeleton>\` renders from that static JSON — no DOM measurement needed. The skeleton HTML is in the initial server response before any JS hydrates.

You can also import bones directly via \`initialBones\` prop instead of using the registry:

\`\`\`tsx
import bones from './bones/notifications.bones.json'

<Skeleton name="notifications" loading={isLoading} initialBones={bones}>
  <NotificationList data={data} />
</Skeleton>
\`\`\`

## Excluding elements from capture

Add \`data-no-skeleton\` to any element you want to exclude from bone capture:

\`\`\`tsx
<nav data-no-skeleton>
  {/* No bone will be generated for this element */}
</nav>
\`\`\`

**Note:** This only affects the capture/snapshot phase — excluded elements won't have bones drawn over them, but they are still hidden at runtime along with all other slot content (via \`visibility: hidden\`). To keep an element visible during loading, place it **outside** the \`<Skeleton>\` wrapper.

Or use \`snapshotConfig\` for more control:

\`\`\`tsx
<Skeleton
  snapshotConfig={{
    excludeSelectors: ['.icon', '[data-no-skeleton]', 'svg'],
    excludeTags: ['nav', 'footer'],
  }}
>
\`\`\`

## Dark mode

The component auto-detects dark mode via the \`.dark\` class on \`<html>\` or any parent element (standard Tailwind convention). It uses \`darkColor\` when dark mode is active.

\`\`\`tsx
<Skeleton color="rgba(0,0,0,0.08)" darkColor="rgba(255,255,255,0.06)" />
\`\`\`

### Skeleton props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| loading | boolean | required | Show skeleton when true, real content when false |
| name | string | required | Unique name — the CLI uses this to generate the \`.bones.json\` file |
| fixture | ReactNode | — | Mock content rendered only during \`npx boneyard-js build\`. Never touches production |
| initialBones | ResponsiveBones | — | Optional manual override. If you use the registry, you don't need this |
| color | string | rgba(0,0,0,0.08) | Bone fill color for light mode |
| darkColor | string | rgba(255,255,255,0.06) | Bone fill color for dark mode (\`.dark\` class) |
| animate | "pulse" | "shimmer" | "solid" | "pulse" | Animation style (also accepts true/false) |
| className | string | — | Extra CSS class on the wrapper div |
| fallback | ReactNode | — | What to show if bones haven't been generated yet |
| snapshotConfig | SnapshotConfig | — | Control which elements are included/excluded during capture |

### snapshotConfig

| Option | Default | Description |
|--------|---------|-------------|
| excludeSelectors | [] | CSS selectors to skip (with all children) |
| excludeTags | [] | HTML tags to skip entirely |
| leafTags | p, h1–h6, li, tr | Tags treated as one solid block (merged with defaults) |
| captureRoundedBorders | true | Capture containers with border + border-radius as bones |

### npx boneyard-js build options

\`\`\`
npx boneyard-js build [url] [options]
  --out <dir>          Output directory (default: ./src/bones)
  --breakpoints <bp>   Viewport widths, comma-separated (auto-detects Tailwind)
  --wait <ms>          Extra wait after page load (default: 800)
  --force              Recapture all (skip incremental cache)
  --watch              Re-capture when your app changes (listens for HMR)
  --no-scan            Skip filesystem route scanning (only crawl links)
  --env-file <path>    Load env vars from file (useful for Bun runtime)
  --native             React Native mode — scans from device (no browser)
\`\`\`

## Bone format

Bones are stored as compact arrays: \`[x, y, w, h, r]\` with an optional 6th element \`c\` for container bones. \`x\` and \`w\` are percentages of container width. \`y\` and \`h\` are pixels. \`r\` is border radius (number or "50%"). The runtime also supports the legacy object format \`{ x, y, w, h, r, c? }\` for backwards compatibility.

## Low-level API (non-React)

\`\`\`ts
import { snapshotBones } from 'boneyard-js'
const result = snapshotBones(document.querySelector('.card'))

import { renderBones } from 'boneyard-js'
const html = renderBones(result, '#d4d4d4')
container.innerHTML = html

// Manual bone registration (what the generated registry.js does automatically)
import { registerBones } from 'boneyard-js/react'
registerBones({ 'my-card': bonesJson })
\`\`\`

## Known limitations

- **Images**: Bone captures the bounding box — works even before the image loads
- **Dynamic content**: Bones reflect the layout at capture time. Re-run the build if layout changes
- **CSS transforms**: Bones use bounding rects, so transforms affect position but not bone sizing
- **React portals**: Elements outside the snapshot root aren't captured

## Config file

Create \`boneyard.config.json\` in your project root. Controls both the CLI build and runtime defaults for all \`<Skeleton>\` components:

\`\`\`json
{
  "breakpoints": [375, 640, 768, 1024, 1280, 1536],
  "out": "./src/bones",
  "wait": 800,
  "color": "#e5e5e5",
  "darkColor": "rgba(255,255,255,0.08)",
  "animate": "pulse"
}
\`\`\`

Runtime defaults (\`color\`, \`darkColor\`, \`animate\`) are automatically included in the generated \`registry.js\`. Per-component props and CLI flags override config values. \`animate\` accepts \`"pulse"\`, \`"shimmer"\`, or \`"solid"\`.

## React Native

\`\`\`tsx
import { Skeleton } from 'boneyard-js/native'

<Skeleton name="profile" loading={isLoading}>
  <ProfileCard />
</Skeleton>
\`\`\`

Generate bones: \`npx boneyard-js build --native --out ./bones\`, then open your app on device. The Skeleton component auto-scans in dev mode via fiber tree + UIManager. In production, scan code is inactive.

Auth is a non-issue — the app is already running with the user logged in.

## Svelte

\`\`\`svelte
<script>
  import Skeleton from 'boneyard-js/svelte'
  import '../bones/registry'
  let loading = true
</script>

<Skeleton name="card" {loading}>
  <Card />
</Skeleton>
\`\`\`

Uses Svelte 5 snippets for \`fallback\` and \`fixture\`. Same CLI: \`npx boneyard-js build\`.

## Authentication

**Web:** Configure in \`boneyard.config.json\`:
\`\`\`json
{ "auth": { "cookies": [...], "headers": {...} }, "resolveEnvVars": true }
\`\`\`
**React Native:** Not needed — device handles auth natively.

## Package exports

- \`boneyard-js\` — snapshotBones, renderBones, fromElement
- \`boneyard-js/react\` — Skeleton, registerBones, configureBoneyard
- \`boneyard-js/native\` — Skeleton, registerBones, configureBoneyard (React Native)
- \`boneyard-js/svelte\` — Skeleton component, registerBones
- \`boneyard-js/vue\` — Skeleton component, registerBones, configureBoneyard
- \`boneyard-js/angular\` — SkeletonComponent, registerBones, configureBoneyard
- \`boneyard-js/vite\` — boneyardPlugin() Vite plugin for auto-capture

## Vite plugin

For Vite projects, add the plugin instead of using the CLI:

\`\`\`ts
import { boneyardPlugin } from 'boneyard-js/vite'
export default defineConfig({ plugins: [boneyardPlugin()] })
\`\`\`

Auto-captures on dev server start and HMR updates. Options: \`out\`, \`breakpoints\`, \`wait\`, \`framework\`, \`skipInitial\`.
`;

export async function GET() {
  return new Response(PROMPT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
