"use client";

import { useState } from "react";
import { CopyIcon } from "@/components/ui/icons/copy";
import { CheckIcon } from "@/components/ui/icons/check";

const AGENT_PROMPT = `# boneyard-js

Pixel-perfect skeleton loading screens, extracted directly from your real DOM. No manual measurement, no hand-tuned placeholders.

## How it works

1. Wrap your component with \`<Skeleton>\` and give it a \`name\`
2. Optionally add a \`fixture\` prop with mock data for the build step
3. Run \`npx boneyard-js build\` — it crawls your app, snapshots every named Skeleton, and writes \`.bones.json\` files + a \`registry.js\`
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

## Excluding elements

Add \`data-no-skeleton\` to any element you want to skip:

\`\`\`tsx
<nav data-no-skeleton>
  {/* This stays visible during loading */}
</nav>
\`\`\`

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

You can also pass colors explicitly:

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
| animate | "pulse" &#124; "shimmer" &#124; "solid" | "pulse" | Animation style (also accepts true/false) |
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

## Authentication & Playwright access

If your app requires authentication:
- Use the \`fixture\` prop to provide mock data that renders without auth
- Or set up a dev/preview mode that bypasses auth for the build step
- The CLI runs Playwright in headless mode — it won't have access to your browser sessions or cookies

## Known limitations

- **Images**: Bone captures the bounding box — works even before the image loads
- **Dynamic content**: Bones reflect the layout at capture time. Re-run the build if layout changes
- **CSS transforms**: Bones use bounding rects, so transforms affect position but not bone sizing
- **React portals**: Elements outside the snapshot root aren't captured
- **Viewport vs container**: Breakpoints are based on viewport width, not container width

## Responsive

The CLI captures bones at multiple breakpoints (default: 375, 768, 1280). At runtime, \`<Skeleton>\` uses ResizeObserver to pick the closest match. Bones store \`x\` and \`w\` as percentages so they scale within a breakpoint range.

Custom breakpoints: \`npx boneyard-js build --breakpoints 390,820,1440\`

Tailwind breakpoints are auto-detected from your config.

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

## Package exports

- \`boneyard-js\` — snapshotBones, renderBones, fromElement
- \`boneyard-js/react\` — Skeleton, registerBones, configureBoneyard
`;

export default function AgentPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(AGENT_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-[720px] px-6 pt-14 pb-12 space-y-10">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Agent</h1>
        <p className="text-[15px] text-[#78716c]">
          Feed this to Claude, ChatGPT, or any LLM to teach it boneyard.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#1c1917] text-[13px] text-[#e7e5e4] hover:bg-[#292524] transition-colors"
          >
            {copied ? (
              <>
                <CheckIcon size={14} />
                Copied
              </>
            ) : (
              <>
                <CopyIcon size={14} />
                Copy prompt
              </>
            )}
          </button>
          <span className="text-[12px] text-[#a8a29e]">
            {AGENT_PROMPT.length.toLocaleString()} chars
          </span>
        </div>

        <p className="text-[13px] text-[#a8a29e]">
          Also available at{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">/agent/llms.txt</code>
          {" "}for automated agent consumption.
        </p>
      </div>

      <div className="rounded-lg bg-[#1a1a1a] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-[12px] text-[#a8a29e]">
          <span>llms.txt</span>
          <button
            onClick={handleCopy}
            className="text-[11px] text-[#78716c] hover:text-[#d6d3d1] transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <CheckIcon size={12} />
                copied
              </>
            ) : (
              <>
                <CopyIcon size={12} />
                copy
              </>
            )}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-[family-name:var(--font-mono)] text-[#d6d3d1] max-h-[600px] overflow-y-auto whitespace-pre-wrap">
          {AGENT_PROMPT}
        </pre>
      </div>

      <div className="border-l-2 border-[#d6d3d1] pl-4 py-1">
        <p className="text-[14px] text-[#78716c]">
          <strong className="text-[#1c1917]">CLAUDE.md:</strong> Drop this into your project&apos;s{" "}
          <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">CLAUDE.md</code> or{" "}
          <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">.cursorrules</code> file
          to give your AI assistant full context on boneyard.
        </p>
      </div>
    </div>
  );
}
