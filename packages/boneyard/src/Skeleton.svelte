<script module lang="ts">
  export { registerBones } from './shared.js'

  export type AnimationStyle = 'pulse' | 'shimmer' | 'solid' | boolean

  interface BoneyardConfig {
    color?: string
    darkColor?: string
    animate?: AnimationStyle
  }

  let _globalConfig: BoneyardConfig = {}

  export function configureBoneyard(config: BoneyardConfig): void {
    _globalConfig = { ..._globalConfig, ...config }
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import type { Snippet } from 'svelte'
  import { normalizeBone } from './types.js'
  import type { AnyBone, ResponsiveBones, SkeletonResult, SnapshotConfig } from './types.js'
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
    animate?: AnimationStyle
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
    animate = 'pulse',
    class: classProp,
    className: classNameProp,
    fallback,
    fixture,
    children,
    snapshotConfig,
  }: SkeletonProps = $props()

  let containerRef = $state<HTMLDivElement | null>(null)
  let containerWidth = $state(0)
  let containerHeight = $state(0)
  let isDark = $state(false)

  const uid = Math.random().toString(36).slice(2, 8)

  let resolvedClassName = $derived(classNameProp ?? classProp)
  let buildMode = isBuildMode()
  let resolvedColor = $derived(isDark ? (darkColor ?? _globalConfig.darkColor ?? 'rgba(255,255,255,0.06)') : (color ?? _globalConfig.color ?? 'rgba(0,0,0,0.08)'))
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

  let rawAnimate = $derived(animate ?? _globalConfig.animate ?? 'pulse')
  let animationStyle = $derived<'pulse' | 'shimmer' | 'solid'>(
    rawAnimate === true ? 'pulse' :
    rawAnimate === false ? 'solid' :
    rawAnimate
  )

  function updateDarkMode() {
    if (typeof window === 'undefined') return
    const hasDarkClass = document.documentElement.classList.contains('dark') || !!containerRef?.closest('.dark')
    isDark = hasDarkClass
  }

  function getBoneStyle(raw: AnyBone, scale: number, colorValue: string, dark: boolean) {
    const bone = normalizeBone(raw)
    const radius = typeof bone.r === 'string' ? bone.r : `${bone.r}px`
    const boneColor = bone.c ? adjustColor(colorValue, dark ? 0.03 : 0.45) : colorValue
    return `position:absolute;left:${bone.x}%;top:${bone.y * scale}px;width:${bone.w}%;height:${bone.h * scale}px;border-radius:${radius};background-color:${boneColor};overflow:hidden;`
  }

  function getOverlayStyle(colorValue: string, dark: boolean, anim: 'pulse' | 'shimmer' | 'solid') {
    if (anim === 'solid') return ''
    const lighterColor = adjustColor(colorValue, dark ? 0.04 : 0.3)
    if (anim === 'pulse') {
      return `position:absolute;inset:0;background-color:${lighterColor};animation:bp-${uid} 1.8s ease-in-out infinite;`
    }
    if (anim === 'shimmer') {
      return `position:absolute;inset:0;background:linear-gradient(90deg, transparent 30%, ${lighterColor} 50%, transparent 70%);background-size:200% 100%;animation:bs-${uid} 2.4s linear infinite;`
    }
    return ''
  }

  onMount(() => {
    updateDarkMode()

    if (containerRef) {
      const rect = containerRef.getBoundingClientRect()
      containerWidth = Math.round(rect.width)
      if (rect.height > 0) containerHeight = Math.round(rect.height)
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const mqHandler = () => updateDarkMode()
    mq.addEventListener('change', mqHandler)

    const mutationObserver = new MutationObserver(updateDarkMode)
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    const resizeObserver = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      containerWidth = Math.round(rect?.width ?? 0)
      if (rect && rect.height > 0) containerHeight = Math.round(rect.height)
    })

    if (containerRef) {
      resizeObserver.observe(containerRef)
    }

    return () => {
      mq.removeEventListener('change', mqHandler)
      mutationObserver.disconnect()
      resizeObserver.disconnect()
    }
  })
</script>

{#if buildMode}
  <div
    bind:this={containerRef}
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
    bind:this={containerRef}
    class={resolvedClassName}
    style="position:relative;"
    data-boneyard={name}
    data-boneyard-config={serializedSnapshotConfig}
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
          {#each activeBones.bones as bone, i (i)}
            <div
              data-boneyard-bone="true"
              style={getBoneStyle(bone, scaleY, resolvedColor, isDark)}
            >
              {#if animationStyle !== 'solid' && !(Array.isArray(bone) ? bone[5] : bone.c)}
                <div style={getOverlayStyle(resolvedColor, isDark, animationStyle)}></div>
              {/if}
            </div>
          {/each}

          {#if animationStyle === 'pulse'}
            <style>{`@keyframes bp-${uid}{0%,100%{opacity:0}50%{opacity:1}}`}</style>
          {/if}
          {#if animationStyle === 'shimmer'}
            <style>{`@keyframes bs-${uid}{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}
