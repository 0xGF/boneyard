<script module lang="ts">
  export { registerBones } from './shared.js'
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { ResponsiveBones, SkeletonResult, SnapshotConfig } from './types.js'
  import {
    adjustColor,
    ensureBuildSnapshotHook,
    getRegisteredBones,
    isBuildMode,
    resolveResponsive,
  } from './shared.js'

  ensureBuildSnapshotHook()

  export interface SkeletonProps {
    loading: boolean
    name?: string
    initialBones?: SkeletonResult | ResponsiveBones
    color?: string
    darkColor?: string
    animate?: boolean
    class?: string
    className?: string
    fallback?: Snippet
    fixture?: Snippet
    children?: Snippet
    snapshotConfig?: SnapshotConfig
  }

  let {
    loading,
    name,
    initialBones,
    color,
    darkColor,
    animate = true,
    class: classProp,
    className: classNameProp,
    fallback,
    fixture,
    children,
    snapshotConfig,
  }: SkeletonProps = $props()

  let containerWidth = $state(0)
  let containerHeight = $state(0)
  let isDark = $state(false)

  let resolvedClassName = $derived(classNameProp ?? classProp)
  let buildMode = isBuildMode()
  let resolvedColor = $derived(isDark ? (darkColor ?? 'rgba(255,255,255,0.06)') : (color ?? 'rgba(0,0,0,0.08)'))
  let serializedSnapshotConfig = $derived(snapshotConfig ? JSON.stringify(snapshotConfig) : undefined)
  let effectiveBones = $derived(initialBones ?? (name ? getRegisteredBones(name) : undefined))
  let viewportWidth = $derived(typeof window !== 'undefined' ? window.innerWidth : containerWidth)
  let activeBones = $derived(
    effectiveBones && containerWidth > 0
      ? resolveResponsive(effectiveBones, viewportWidth)
      : null,
  )
  let showSkeleton = $derived(loading && !!activeBones)
  let showFallback = $derived(loading && !activeBones)
  let effectiveHeight = $derived(containerHeight > 0 ? containerHeight : activeBones?.height ?? 0)
  let capturedHeight = $derived(activeBones?.height ?? 0)
  let scaleY = $derived(
    effectiveHeight > 0 && capturedHeight > 0
      ? effectiveHeight / capturedHeight
      : 1,
  )
  let pulseColor = $derived(adjustColor(resolvedColor, isDark ? 0.04 : 0.3))

  function getBoneStyle(
    bone: SkeletonResult['bones'][number],
    scale: number,
    colorValue: string,
    dark: boolean,
    shouldAnimate: boolean,
  ) {
    const radius = typeof bone.r === 'string' ? bone.r : `${bone.r}px`
    const boneColor = bone.c ? adjustColor(colorValue, dark ? 0.03 : 0.45) : colorValue
    const animation = shouldAnimate ? 'animation:boneyard-pulse 1.8s ease-in-out infinite;' : ''
    return `position:absolute;left:${bone.x}%;top:${bone.y * scale}px;width:${bone.w}%;height:${bone.h * scale}px;border-radius:${radius};background-color:${boneColor};${animation}`
  }

  function resizeAttachment(element: HTMLDivElement): void | (() => void) {
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      containerWidth = Math.round(rect?.width ?? 0)
      if (rect && rect.height > 0) containerHeight = Math.round(rect.height)
    })

    observer.observe(element)

    return () => observer.disconnect()
  }

  function darkModeAttachment(element: HTMLDivElement): void | (() => void) {
    const updateDark = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark') || !!element.closest('.dark')
      isDark = hasDarkClass
    }

    updateDark()

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const mqHandler = () => updateDark()
    mq.addEventListener('change', mqHandler)

    const mutationObserver = new MutationObserver(updateDark)
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      mq.removeEventListener('change', mqHandler)
      mutationObserver.disconnect()
    }
  }
</script>

{#if buildMode}
  <div
    class={resolvedClassName}
    style="position:relative;"
    data-boneyard={name}
    data-boneyard-config={serializedSnapshotConfig}
  >
    <div>
      {#if fixture}
        {@render fixture()}
      {:else}
        {@render children?.()}
      {/if}
    </div>
  </div>
{:else}
  <div
    class={resolvedClassName}
    style="position:relative;"
    data-boneyard={name}
    data-boneyard-config={serializedSnapshotConfig}
    {@attach resizeAttachment}
    {@attach darkModeAttachment}
  >
    <div data-boneyard-content="true" style:visibility={showSkeleton ? 'hidden' : undefined}>
      {#if showFallback}
        {@render fallback?.()}
      {:else}
        {@render children?.()}
      {/if}
    </div>

    {#if showSkeleton && activeBones}
      <div data-boneyard-overlay="true" style="position:absolute;inset:0;overflow:hidden;">
        <div style="position:relative;width:100%;height:100%;">
          {#each activeBones.bones as bone, i (`${i}-${bone.x}-${bone.y}`)}
            <div
              data-boneyard-bone="true"
              style={getBoneStyle(bone, scaleY, resolvedColor, isDark, animate)}
            ></div>
          {/each}

          {#if animate}
            <style>{`@keyframes boneyard-pulse{0%,100%{background-color:${resolvedColor}}50%{background-color:${pulseColor}}}`}</style>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}
