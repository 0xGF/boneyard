---
name: boneyard
description: Use boneyard-js to add, configure, debug, or rebuild skeleton screens. Triggers when working with Skeleton components, bones JSON, the boneyard CLI, fixtures, leafTags, snapshotConfig, skeleton loading states, or boneyard.config.json.
allowed-tools: Bash Read Edit Write Glob Grep Agent
---

# Boneyard Skeleton Skill

You are an expert on `boneyard-js`, a skeleton screen generator that snapshots real UI into positioned rectangle "bones". Use this knowledge to help with any boneyard-related task.

## Architecture

### Core files (in `packages/boneyard/`)
- `src/react.tsx` — `<Skeleton>` React component (also exports `configureBoneyard`, `registerBones`)
- `src/preact.tsx` — Native Preact integration (no compat needed)
- `src/Skeleton.svelte` — Svelte 5 component
- `src/Skeleton.vue` — Vue component
- `src/angular.ts` — Angular component
- `src/native.tsx` / `src/react-native.tsx` — React Native
- `src/extract.ts` — `snapshotBones()` DOM walker, `fromElement()` descriptor extractor
- `src/shared.ts` — bone registry, animation constants (`SHIMMER`, `PULSE`, `DEFAULTS`), `resolveResponsive`
- `src/types.ts` — `SnapshotConfig`, `Bone`, `CompactBone`, `ResponsiveBones`
- `src/runtime.ts` — vanilla `renderBones()` for non-React usage
- `bin/cli.js` — CLI entry (`boneyard-js build`)

### Package exports
- `boneyard-js` — snapshotBones, renderBones, fromElement
- `boneyard-js/react` — Skeleton, registerBones, configureBoneyard
- `boneyard-js/preact` — Skeleton, registerBones, configureBoneyard
- `boneyard-js/native` — Skeleton, registerBones, configureBoneyard (React Native)
- `boneyard-js/svelte` — Skeleton component, registerBones
- `boneyard-js/vue` — Skeleton component, registerBones, configureBoneyard
- `boneyard-js/angular` — SkeletonComponent, registerBones, configureBoneyard
- `boneyard-js/vite` — boneyardPlugin() Vite plugin

### Bones format
Compact array: `[x%, y_px, w%, h_px, borderRadius, isContainer?]`
- `x` and `w` are percentages of container width
- `y` and `h` are pixels
- `borderRadius` is number (px) or string ("50%")
- `isContainer` (optional 6th element, truthy) — container bones are **skipped during rendering**. They represent parent backgrounds and would cause opacity overlap if rendered alongside child bones.

### Bone resolution priority
1. Explicit `initialBones` prop (highest priority)
2. Registry lookup by `name` (from `registry.js`)
3. Fixture fallback (only during CLI build mode when `window.__BONEYARD_BUILD === true`)

### Animation constants (in `shared.ts`)
All frameworks import from `shared.ts` — single source of truth:
```ts
SHIMMER = { angle: 110, start: 30, end: 70, speed: '2s', lightHighlight: '#f7f7f7', darkHighlight: '#2c2c2c' }
PULSE = { speed: '1.8s', lightAdjust: 0.3, darkAdjust: 0.02 }
DEFAULTS = { web: { light: '#f0f0f0', dark: '#222222' }, native: { light: '#f0f0f0', dark: '#222222' } }
```

### Dark mode
Detected via `.dark` class on `<html>` or any parent element (standard Tailwind convention). Does **NOT** use `prefers-color-scheme` — gives the app developer explicit control. When `.dark` is present, `darkColor` and `darkShimmerColor` are used.

### SnapshotConfig options
```ts
{
  leafTags?: string[]              // Tags treated as atomic bones (merged with defaults: p,h1-h6,li,td,th)
  captureRoundedBorders?: boolean  // Capture bordered+rounded elements even without bg (default: true)
  excludeTags?: string[]           // Skip these tags entirely
  excludeSelectors?: string[]      // Skip elements matching CSS selectors
}
```

## Config file (`boneyard.config.json`)

The **primary customization point**. Controls both CLI build and runtime defaults. Runtime options are baked into the generated `registry.js` via `configureBoneyard()`.

```json
{
  "breakpoints": [375, 768, 1280],
  "out": "./src/bones",
  "wait": 800,
  "color": "#e5e5e5",
  "darkColor": "#2a2a2a",
  "animate": "shimmer",
  "shimmerColor": "#ebebeb",
  "darkShimmerColor": "#333333",
  "speed": "2s",
  "shimmerAngle": 110,
  "stagger": false,
  "transition": false,
  "boneClass": "",
  "resolveEnvVars": true,
  "auth": {
    "cookies": [{ "name": "session", "value": "env[SESSION_TOKEN]", "domain": "localhost" }],
    "headers": { "Authorization": "Bearer env[API_TOKEN]" }
  }
}
```

### Build-time options
| Key | Default | Description |
|-----|---------|-------------|
| breakpoints | [375, 768, 1280] | Viewport widths captured by CLI (auto-detects Tailwind) |
| out | ./src/bones | Output directory |
| wait | 800 | ms to wait after page load before capturing |

### Runtime options (baked into registry.js)
| Key | Default | Description |
|-----|---------|-------------|
| color | #f0f0f0 | Bone fill color (light mode) |
| darkColor | #222222 | Bone fill color (dark mode, `.dark` class) |
| animate | "pulse" | Animation: "pulse", "shimmer", or "solid" |
| shimmerColor | #f7f7f7 | Shimmer highlight color (light mode) |
| darkShimmerColor | #2c2c2c | Shimmer highlight color (dark mode) |
| speed | "2s" (shimmer) / "1.8s" (pulse) | Animation duration |
| shimmerAngle | 110 | Shimmer gradient angle in degrees |
| stagger | false | Delay between bones in ms (true = 80ms) |
| transition | false | Fade transition when loading ends in ms (true = 300ms) |
| boneClass | — | CSS class applied to each bone element |

### Precedence
Per-component props > config file (via `configureBoneyard()`) > package defaults in `shared.ts`. CLI flags override config file for build options.

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

### Excluding elements from capture
```tsx
<nav data-no-skeleton>
  {/* No bone will be generated */}
</nav>
```

Or via `snapshotConfig`:
```tsx
<Skeleton snapshotConfig={{ excludeSelectors: ['.icon', 'svg'], excludeTags: ['nav'] }}>
```

### Running the CLI
```bash
# Auto-detect dev server
npx boneyard-js build

# Explicit URL + output
npx boneyard-js build http://localhost:PORT --out src/bones

# Force rebuild all (skip hash check)
npx boneyard-js build --force

# Watch mode (re-capture on HMR)
npx boneyard-js build --watch

# Custom breakpoints
npx boneyard-js build --breakpoints 375,640,768,1024,1280,1536

# React Native mode
npx boneyard-js build --native --out ./bones
```

### Skeleton props reference
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loading` | `boolean` | required | Show skeleton vs children |
| `children` | `ReactNode` | required | Real content |
| `name` | `string` | required | Registry key + CLI identifier |
| `initialBones` | `ResponsiveBones` | — | Pre-generated bones (overrides registry) |
| `color` | `string` | #f0f0f0 | Bone fill color (light mode) |
| `darkColor` | `string` | #222222 | Dark mode bone fill color (`.dark` class) |
| `animate` | `AnimationStyle` | `'pulse'` | "pulse", "shimmer", "solid" (also accepts boolean) |
| `stagger` | `number \| boolean` | `false` | Stagger delay (true=80ms) |
| `transition` | `number \| boolean` | `false` | Fade-out duration (true=300ms) |
| `boneClass` | `string` | — | CSS class per bone |
| `className` | `string` | — | Container class |
| `fallback` | `ReactNode` | — | Shown when loading + no bones |
| `fixture` | `ReactNode` | — | Mock content for CLI capture |
| `snapshotConfig` | `SnapshotConfig` | — | Controls bone extraction |

## Debugging checklist
1. **Skeleton shows nothing**: Check that `registry.js` is imported in app entry AND bones JSON exists for that name
2. **Too many bones / internal shapes**: Add `leafTags` to `snapshotConfig` and rebuild
3. **Bones don't match layout**: Rebuild with `--force` to regenerate from current DOM
4. **Wrong breakpoint**: Check container width — bones resolve using nearest `<=` breakpoint
5. **Dark mode not detected**: Skeleton uses `.dark` class on `<html>` or ancestor. Does NOT use `prefers-color-scheme`
6. **CLI finds no skeletons**: Components need `loading={false}` (or a fixture) so the real UI renders for capture
7. **Opacity overlap / double-layering**: Container bones (`c: true`) should be skipped in rendering — if they're not, the filter is missing
8. **Shimmer not visible**: Check that `shimmerColor` has enough contrast with `color` — defaults are `#f7f7f7` on `#f0f0f0`
