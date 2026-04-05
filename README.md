<p align="center">
  <img src="boneyard-logo.gif" alt="Boneyard" width="1000" />
</p>

# boneyard

Pixel-perfect skeleton loading screens, extracted from your real DOM. No manual measurement, no hand-tuned placeholders.

## How it works

1. Wrap your component with `<Skeleton>` and give it a name
2. Run `npx boneyard-js build` — it snapshots the DOM and generates bones
3. Import the registry once — every skeleton auto-resolves

```tsx
import { Skeleton } from 'boneyard-js/react'

function BlogPage() {
  const { data, isLoading } = useFetch('/api/post')

  return (
    <Skeleton name="blog-card" loading={isLoading}>
      {data && <BlogCard data={data} />}
    </Skeleton>
  )
}
```

```bash
npx boneyard-js build
```

```ts
// app/layout.tsx — add once
import './bones/registry'
```

Done. Every `<Skeleton name="...">` shows a pixel-perfect skeleton on load.

## Install

```bash
npm install boneyard-js
```

## Framework adapters

### React

```tsx
import { Skeleton } from 'boneyard-js/react'
```

### Svelte 5

```svelte
<script lang="ts">
  import Skeleton from 'boneyard-js/svelte'
  import ProfileCard from './ProfileCard.svelte'
</script>

<Skeleton name="profile-card" loading={isLoading}>
  {#snippet fallback()}
    <p>Loading profile...</p>
  {/snippet}

  <ProfileCard />
</Skeleton>
```

Import the generated registry once in your app entry:

```svelte
<script lang="ts">
  import '$lib/bones/registry.js'
</script>
```

## What it does

- Reads `getBoundingClientRect()` on every visible element in your component
- Stores positions as a flat array of `{ x, y, w, h, r }` bones
- Renders them as gray rectangles that match your real layout exactly
- Responsive — captures at multiple breakpoints (375px, 768px, 1280px by default)
- Pulse animation shimmers to a lighter shade of whatever color you set

## Layout API

If you work with hand-authored or extracted descriptors, you can use the layout engine in two ways.

### Default path

```ts
import { computeLayout } from "boneyard-js";

const result = computeLayout(descriptor, 375);
```

This is the simple, backward-compatible path. The first call compiles the descriptor tree. Later calls with the same descriptor object reuse that compiled state automatically.

### Explicit compiled path

```ts
import { compileDescriptor, computeLayout } from "boneyard-js";

const compiled = compileDescriptor(descriptor);

const mobile = computeLayout(compiled, 375);
const desktop = computeLayout(compiled, 1280);
```

Use this when you know you will reuse the same descriptor many times and want to move the cold work up front.

Examples:

- SSR code rendering several breakpoints
- descriptor registries loaded once at startup
- responsive tools or animation loops that relayout often
- benchmarks where you want to separate cold compile cost from hot relayout cost

If you already use `computeLayout(descriptor, width)`, you do not need to change your code. `compileDescriptor()` is an optimization API, not a migration requirement.

If you mutate the same descriptor object in place later, boneyard will detect that change and rebuild its compiled state automatically on the next layout call. You can also call `invalidateDescriptor(descriptor)` to force a rebuild immediately.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | string | required | Unique name for this skeleton |
| `loading` | boolean | required | Show skeleton or real content |
| `color` | string | `#e0e0e0` | Bone fill color |
| `animate` | boolean | `true` | Pulse animation |
| `snapshotConfig` | object | — | Control which elements are included |

## CLI

```bash
npx boneyard-js build                    # auto-detect dev server
npx boneyard-js build http://localhost:3000
npx boneyard-js build --breakpoints 390,820,1440 --out ./public/bones
```

The generated `registry.js` is framework-neutral and imports `registerBones` from `boneyard-js`.

## Links

- [Website](https://boneyard.vercel.app/overview)
- [npm](https://www.npmjs.com/package/boneyard-js)
- [Twitter thread](https://x.com/0xGoodfuture/status/2039818750568878245)
- [GitHub](https://github.com/0xGF/boneyard)

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=0xGF/boneyard&type=Date)](https://star-history.com/#0xGF/boneyard&Date)

## License

MIT
