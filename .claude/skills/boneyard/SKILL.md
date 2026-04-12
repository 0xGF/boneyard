---
name: boneyard
description: Use boneyard-js to add, configure, debug, or rebuild skeleton screens. Triggers when working with Skeleton components, bones JSON, the boneyard CLI, fixtures, leafTags, snapshotConfig, or skeleton loading states.
allowed-tools: Bash Read Edit Write Glob Grep Agent
---

# Boneyard Skeleton Skill

You are an expert on `boneyard-js`, a skeleton screen generator that snapshots real UI into positioned rectangle "bones". Use this knowledge to help with any boneyard-related task.

## Architecture

### Core files (in `packages/boneyard/`)
- `src/react.tsx` — `<Skeleton>` React component (also exports `configureBoneyard`)
- `src/extract.ts` — `snapshotBones()` DOM walker, `fromElement()` descriptor extractor
- `src/shared.ts` — bone registry (`registerBones`, `getRegisteredBones`, `isBuildMode`, `resolveResponsive`)
- `src/types.ts` — `SnapshotConfig`, `Bone`, `CompactBone`, `SkeletonDescriptor`, `ResponsiveBones`
- `bin/cli.js` — CLI entry (`boneyard-js build`)

### Bones format
Compact array: `[x%, y_px, w%, h_px, borderRadius, isContainer?]`
- `x` and `w` are percentages of container width
- `y` and `h` are pixels
- `borderRadius` is number (px) or string ("50%", "4px 4px 0px 0px")
- `isContainer` (optional `true`) means lighter color so child bones stand out

### Bone resolution priority
1. Explicit `initialBones` prop (highest priority)
2. Registry lookup by `name` (from `registry.js`)
3. Fixture fallback (only during CLI build mode when `window.__BONEYARD_BUILD === true`)

### SnapshotConfig options
```ts
{
  leafTags?: string[]        // Tags treated as atomic bones (merged with defaults: p,h1-h6,li,td,th)
  captureRoundedBorders?: boolean  // Capture bordered+rounded elements even without bg (default: true)
  excludeTags?: string[]     // Skip these tags entirely
  excludeSelectors?: string[] // Skip elements matching CSS selectors
}
```

## Common tasks

### Adding a skeleton to a component
```tsx
import { Skeleton } from 'boneyard-js/react'

<Skeleton name="my-component" loading={isLoading}>
  <MyComponent data={data} />
</Skeleton>
```

### Using a fixture (when real data isn't available at build time)
```tsx
function MyFixture() {
  return (
    <div className="flex flex-col gap-2">
      <section className="h-8 rounded" />      {/* atomic bone */}
      <section className="h-24 rounded-lg" />   {/* atomic bone */}
    </div>
  )
}

<Skeleton
  name="my-component"
  loading={isLoading}
  fixture={<MyFixture />}
  snapshotConfig={{ leafTags: ["section"] }}
>
  <MyComponent data={data} />
</Skeleton>
```

Key pattern: use `<section>` (or any custom tag) as leaf elements in the fixture, then add that tag to `leafTags` so the extractor treats each as a single flat bone without recursing into children.

### Preventing internal bones (the most common issue)
If a skeleton shows unwanted internal rectangles (text labels, icons, chart bars inside cards), you need `leafTags`:
1. Create a fixture using `<section>` for each block you want as a single bone
2. Add `snapshotConfig={{ leafTags: ["section"] }}`
3. Rebuild with the CLI

### Running the CLI
```bash
# From repo root — auto-detect dev server
node packages/boneyard/bin/cli.js build

# Explicit URL
node packages/boneyard/bin/cli.js build http://localhost:PORT

# With output directory
node packages/boneyard/bin/cli.js build http://localhost:PORT --out src/bones

# Force rebuild all (skip hash check)
node packages/boneyard/bin/cli.js build --force

# Custom breakpoints
node packages/boneyard/bin/cli.js build --breakpoints 375,640,768,1024,1280,1536

# With auth cookies
node packages/boneyard/bin/cli.js build --cookie "session=abc123"
```

The CLI:
1. Sets `window.__BONEYARD_BUILD = true`
2. Crawls all pages finding `[data-boneyard]` elements
3. Reads `data-boneyard-config` for `SnapshotConfig`
4. Renders fixture (if present) or children
5. Calls `snapshotBones()` at each breakpoint width
6. Hashes results — only writes changed skeletons
7. Generates `registry.js` that auto-registers all bones

### Global configuration
```tsx
import { configureBoneyard } from 'boneyard-js/react'

configureBoneyard({
  color: '#e5e5e5',           // Light mode bone color
  darkColor: 'rgba(255,255,255,0.08)', // Dark mode bone color
  animate: 'shimmer',         // 'pulse' | 'shimmer' | 'solid' | boolean
  stagger: 80,                // Delay between bone animations (ms)
  transition: 300,            // Fade-out duration when loading ends (ms)
  boneClass: 'my-bone',       // CSS class on each bone element
})
```

### Skeleton props reference
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | required | Show skeleton vs children |
| `children` | `ReactNode` | required | Real content |
| `name` | `string` | — | Registry key + CLI identifier |
| `initialBones` | `SkeletonResult \| ResponsiveBones` | — | Pre-generated bones (overrides registry) |
| `color` | `string` | `rgba(0,0,0,0.08)` | Bone color |
| `darkColor` | `string` | `rgba(255,255,255,0.06)` | Dark mode bone color |
| `animate` | `AnimationStyle` | `'pulse'` | Animation style |
| `stagger` | `number \| boolean` | `false` | Stagger delay (true=80ms) |
| `transition` | `number \| boolean` | `false` | Fade-out duration (true=300ms) |
| `boneClass` | `string` | — | CSS class per bone |
| `className` | `string` | — | Container class |
| `fallback` | `ReactNode` | — | Shown when loading + no bones |
| `fixture` | `ReactNode` | — | Mock content for CLI capture |
| `snapshotConfig` | `SnapshotConfig` | — | Controls bone extraction |

### Config file (`boneyard.config.json`)
```json
{
  "out": "./src/bones",
  "breakpoints": [375, 768, 1280],
  "wait": 800,
  "auth": {
    "cookies": [{ "name": "session", "value": "env[SESSION_TOKEN]" }],
    "headers": { "Authorization": "Bearer env[API_TOKEN]" }
  },
  "resolveEnvVars": true
}
```

## Debugging checklist
1. **Skeleton shows nothing**: Check that `registry.js` is imported in app entry AND bones JSON exists for that name
2. **Too many bones / internal shapes**: Add `leafTags` to `snapshotConfig` and rebuild
3. **Bones don't match layout**: Rebuild with `--force` to regenerate from current DOM
4. **Wrong breakpoint**: Check `containerWidth` — bones resolve using nearest `<=` breakpoint
5. **Dark mode not detected**: Skeleton watches `prefers-color-scheme` and `.dark` class on `<html>`
6. **CLI finds no skeletons**: Components need `loading={false}` (or a fixture) so the real UI renders for capture
