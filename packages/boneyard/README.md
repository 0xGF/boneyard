# boneyard

Pixel-perfect skeleton loading screens, extracted from your real DOM.

## Quick start

```bash
npm install boneyard-js
```

```tsx
import { Skeleton } from 'boneyard-js/react'

<Skeleton name="blog-card" loading={isLoading}>
  <BlogCard data={data} />
</Skeleton>
```

```bash
npx boneyard-js build
```

```ts
// app/layout.tsx
import './bones/registry'
```

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

Done. See the [full documentation](https://github.com/0xGF/boneyard) for all props, CLI options, and examples.

## Layout APIs

You do not need to change your existing usage to benefit from the compiled layout engine.

### `computeLayout(descriptor, width)`

This is the default API. It is backward compatible and still the right choice for most callers.

```ts
import { computeLayout } from "boneyard-js";

const result = computeLayout(descriptor, 375);
```

What happens:

- The first call compiles the descriptor tree and measures its text nodes.
- Later calls with the same descriptor object reuse that compiled tree.
- This means the default API becomes fast after first use.

### `compileDescriptor(descriptor)` + `computeLayout(compiled, width)`

Use this when you want explicit control over the cold step.

```ts
import { compileDescriptor, computeLayout } from "boneyard-js";

const compiled = compileDescriptor(descriptor);

const mobile = computeLayout(compiled, 375);
const tablet = computeLayout(compiled, 768);
const desktop = computeLayout(compiled, 1280);
```

What this gives you:

- The descriptor is compiled up front.
- Every later `computeLayout()` call is guaranteed to use the hot relayout path.
- This is useful when you know the same descriptor will be reused many times.

### Which one should you use?

Use `computeLayout(descriptor, width)` when:

- you want the simplest API
- you already have working code and do not want to change it
- you only relayout a descriptor a small number of times

Use `compileDescriptor(descriptor)` when:

- you render the same skeleton at multiple breakpoints
- you keep a registry of descriptors in memory
- you relayout repeatedly in SSR, responsive tooling, or animation-heavy flows
- you want to benchmark cold work separately from hot relayouts

If your app already calls `computeLayout(descriptor, width)`, you do not have to rewrite it. `compileDescriptor()` exists for callers who want predictable warm performance and explicit ownership of the compiled artifact.

### Mutating descriptors

If you mutate the same descriptor object in place, the engine will detect the change and rebuild its compiled state automatically on the next layout call.

If you want to force that rebuild immediately, you can call `invalidateDescriptor(descriptor)` before the next `computeLayout()`.

## License

MIT
