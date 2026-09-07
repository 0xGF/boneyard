/** @jsxImportSource @solidjs/web */

import {
  For,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onSettled,
} from 'solid-js'
import type { JSX } from '@solidjs/web'
import {
  adjustColor,
  DEFAULTS,
  ensureBuildSnapshotHook,
  getRegisteredBones,
  isBuildMode,
  PULSE,
  resolveResponsive,
  SHIMMER,
} from './shared.js'
import { normalizeBone } from './types.js'
import type {
  AnimationStyle,
  AnyBone,
  ResponsiveBones,
  SkeletonResult,
  SnapshotConfig,
} from './types.js'

ensureBuildSnapshotHook()

export type { AnimationStyle }

export interface BoneyardConfig {
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  boneClass?: string
  shimmerColor?: string
  darkShimmerColor?: string
  speed?: string
  shimmerAngle?: number
  select?: 'container' | 'viewport'
}

let globalConfig: BoneyardConfig = {}

export function configureBoneyard(config: BoneyardConfig): void {
  globalConfig = { ...globalConfig, ...config }
}

type InitialBones = SkeletonResult | ResponsiveBones

type ResolvedAnimation = 'pulse' | 'shimmer' | 'solid'

export interface SkeletonProps {
  loading: boolean
  children: JSX.Element
  name?: string
  initialBones?: InitialBones
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  boneClass?: string
  class?: string
  fallback?: JSX.Element
  fixture?: JSX.Element
  snapshotConfig?: SnapshotConfig
  select?: 'container' | 'viewport'
}

export interface SkeletonViewProps {
  name?: string
  initialBones?: InitialBones
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  class?: string
  snapshotConfig?: SnapshotConfig
  select?: 'container' | 'viewport'
}

const RADIUS_RE = /^(?:[0-9]+(?:\.[0-9]+)?(?:%|px|em|rem)?)(?:\s+[0-9]+(?:\.[0-9]+)?(?:%|px|em|rem)?)*$/

function serializeSnapshotConfig(config: SnapshotConfig | undefined): string | undefined {
  if (config === undefined) return undefined

  try {
    const json = JSON.stringify(config, (_key, value) => {
      if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
        throw new TypeError('functions, symbols, and bigint values are not supported')
      }
      if (typeof Node !== 'undefined' && value instanceof Node) {
        throw new TypeError('DOM nodes are not supported')
      }
      return value
    })
    return json === undefined ? undefined : json
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid value'
    throw new TypeError(`boneyard: snapshotConfig must be JSON-serializable (${message})`)
  }
}

function isResponsiveBones(value: unknown): value is ResponsiveBones {
  return !!value && typeof value === 'object' && !Array.isArray(value) && 'breakpoints' in value
}

function assertFiniteNumber(value: unknown, label: string, minimum = 0): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new TypeError(`invalid ${label}`)
  }
}

function validateBone(raw: AnyBone): void {
  const bone = normalizeBone(raw)
  assertFiniteNumber(bone.x, 'bone.x')
  assertFiniteNumber(bone.y, 'bone.y')
  assertFiniteNumber(bone.w, 'bone.w')
  assertFiniteNumber(bone.h, 'bone.h')

  if (typeof bone.r === 'number') {
    assertFiniteNumber(bone.r, 'bone.r')
  } else if (typeof bone.r !== 'string' || !RADIUS_RE.test(bone.r)) {
    throw new TypeError('invalid bone.r')
  }

  if (bone.c !== undefined && typeof bone.c !== 'boolean') {
    throw new TypeError('invalid bone.c')
  }
}

function validateResult(value: unknown): asserts value is SkeletonResult {
  if (!value || typeof value !== 'object') throw new TypeError('invalid skeleton artifact')
  const result = value as SkeletonResult
  if (typeof result.name !== 'string') throw new TypeError('invalid skeleton name')
  assertFiniteNumber(result.viewportWidth, 'skeleton viewportWidth')
  assertFiniteNumber(result.width, 'skeleton width')
  assertFiniteNumber(result.height, 'skeleton height')
  if (!Array.isArray(result.bones)) throw new TypeError('invalid skeleton bones')
  for (const bone of result.bones) validateBone(bone)
}

function validateArtifact(value: InitialBones): void {
  if (!isResponsiveBones(value)) {
    validateResult(value)
    return
  }

  if (!value.breakpoints || typeof value.breakpoints !== 'object') {
    throw new TypeError('invalid responsive skeleton artifact')
  }
  for (const [key, result] of Object.entries(value.breakpoints)) {
    assertFiniteNumber(Number(key), 'breakpoint')
    validateResult(result)
  }
}

function resolveArtifact(
  input: InitialBones | undefined,
  width: number,
): SkeletonResult | null {
  if (!input) return null
  try {
    validateArtifact(input)
    return resolveResponsive(input, width)
  } catch {
    return null
  }
}

function resolveAnimation(value: AnimationStyle | undefined): ResolvedAnimation {
  if (value === true) return 'pulse'
  if (value === false) return 'solid'
  return value === 'pulse' || value === 'shimmer' || value === 'solid' ? value : 'solid'
}

function resolveDuration(value: number | boolean | undefined, enabledMs: number): number {
  return value === true ? enabledMs : value === false || !value ? 0 : Math.max(0, value)
}

interface EnvironmentState {
  rootRef: (element: HTMLDivElement | null) => void
  contentRef: (element: HTMLDivElement | null) => void
  containerWidth: () => number
  containerHeight: () => number
  viewportWidth: () => number
  isDark: () => boolean
}

function createEnvironmentState(): EnvironmentState {
  const [containerWidth, setContainerWidth] = createSignal(0)
  const [containerHeight, setContainerHeight] = createSignal(0)
  const [viewportWidth, setViewportWidth] = createSignal(0)
  const [isDark, setIsDark] = createSignal(false)
  let root: HTMLDivElement | undefined
  let content: HTMLDivElement | undefined

  const rootRef = (element: HTMLDivElement | null) => {
    root = element ?? undefined
  }
  const contentRef = (element: HTMLDivElement | null) => {
    content = element ?? undefined
  }

  onSettled(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !root) return

    // The root may be held by the skeleton's reserved min-height. Measure the
    // content wrapper so that artificial height never becomes the next height.
    const measureLayout = (width?: number) => {
      if (!root) return
      setContainerWidth(Math.round((width ?? root.getBoundingClientRect().width) || 0))
      if (content) setContainerHeight(Math.round(content.getBoundingClientRect().height || 0))
    }
    const measure = () => {
      measureLayout()
      setViewportWidth(Math.round(window.innerWidth || 0))
    }
    const updateDark = () => {
      setIsDark(
        document.documentElement.classList.contains('dark') ||
          !!root?.closest('.dark'),
      )
    }

    measure()
    updateDark()

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      try {
        resizeObserver = new ResizeObserver(entries => {
          measureLayout(entries[0]?.contentRect.width)
          setViewportWidth(Math.round(window.innerWidth || 0))
        })
        resizeObserver.observe(root)
      } catch {
        resizeObserver = undefined
      }
    }

    const mutationObserver = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(updateDark)
      : undefined
    mutationObserver?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    })

    window.addEventListener('resize', measure)

    return () => {
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      window.removeEventListener('resize', measure)
    }
  })

  return { rootRef, contentRef, containerWidth, containerHeight, viewportWidth, isDark }
}

interface BoneOverlayProps {
  result: SkeletonResult
  color: string
  isDark: boolean
  animationStyle: ResolvedAnimation
  staggerMs: number
  scaleY: number
  transitionMs: number
  transitioning: boolean
  boneClass?: string
  uid: string
}

function BoneOverlay(props: BoneOverlayProps): JSX.Element {
  const bones = createMemo(() => props.result.bones.filter(raw => !normalizeBone(raw).c))
  const lighterColor = createMemo(() =>
    adjustColor(props.color, props.isDark ? PULSE.darkAdjust : PULSE.lightAdjust),
  )

  return (
    <div
      data-boneyard-overlay="true"
      aria-hidden="true"
      class={['boneyard-overlay', `boneyard-overlay-${props.uid}`]}
      style={{
        position: 'absolute',
        inset: '0',
        overflow: 'hidden',
        opacity: props.transitioning ? 0 : 1,
        transition: props.transitionMs > 0 ? `opacity ${props.transitionMs}ms ease-out` : undefined,
        'pointer-events': 'none',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <For each={bones()}>
          {(raw, index) => (
            <BoneRect
              bone={raw}
              index={index()}
              color={props.color}
              isDark={props.isDark}
              animationStyle={props.animationStyle}
              staggerMs={props.staggerMs}
              scaleY={props.scaleY}
              capturedWidth={props.result.width}
              boneClass={props.boneClass}
              uid={props.uid}
            />
          )}
        </For>

        {props.animationStyle === 'pulse' && (
          <style>{`@keyframes bp-${props.uid}{0%,100%{background-color:${props.color}}50%{background-color:${lighterColor()}}}`}</style>
        )}
        {props.animationStyle === 'shimmer' && (
          <style>{`@keyframes bs-${props.uid}{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        )}
        {props.staggerMs > 0 && props.animationStyle !== 'solid' && (
          <style>{`@keyframes by-${props.uid}{from{opacity:0}to{opacity:1}}`}</style>
        )}
        <style>{`@media (prefers-reduced-motion: reduce){.boneyard-overlay-${props.uid},.boneyard-overlay-${props.uid} .boneyard-bone{animation:none!important;transition:none!important}.boneyard-overlay-${props.uid} .boneyard-bone{opacity:1!important;background-image:none!important;background-color:${props.color}!important}}`}</style>
      </div>
    </div>
  )
}

interface BoneRectProps {
  bone: AnyBone
  index: number
  color: string
  isDark: boolean
  animationStyle: ResolvedAnimation
  staggerMs: number
  scaleY: number
  capturedWidth: number
  boneClass?: string
  uid: string
}

function BoneRect(props: BoneRectProps): JSX.Element {
  const bone = createMemo(() => normalizeBone(props.bone))
  const style = createMemo(() => {
    const value = bone()
    const capturedPxW = (value.w / 100) * props.capturedWidth
    const isCircle = value.r === '50%' && props.capturedWidth > 0 && Math.abs(capturedPxW - value.h) < 4
    const output: Record<string, string | number> = {
      position: 'absolute',
      left: `${value.x}%`,
      top: `${value.y * props.scaleY}px`,
      width: isCircle ? `${value.h * props.scaleY}px` : `${value.w}%`,
      height: `${value.h * props.scaleY}px`,
      'border-radius': typeof value.r === 'string' ? value.r : `${value.r}px`,
      'background-color': props.color,
    }

    if (props.animationStyle === 'pulse') {
      output.animation = `bp-${props.uid} ${globalConfig.speed ?? PULSE.speed} ease-in-out infinite`
    } else if (props.animationStyle === 'shimmer') {
      const highlight = props.isDark
        ? (globalConfig.darkShimmerColor ?? SHIMMER.darkHighlight)
        : (globalConfig.shimmerColor ?? SHIMMER.lightHighlight)
      delete output['background-color']
      output['background-image'] = `linear-gradient(${globalConfig.shimmerAngle ?? SHIMMER.angle}deg, ${props.color} ${SHIMMER.start}%, ${highlight} 50%, ${props.color} ${SHIMMER.end}%)`
      output['background-size'] = '200% 100%'
      output.animation = `bs-${props.uid} ${globalConfig.speed ?? SHIMMER.speed} linear infinite`
    }

    if (props.staggerMs > 0 && props.animationStyle !== 'solid') {
      output.opacity = '0'
      output.animation = `${output.animation ? `${output.animation},` : ''}by-${props.uid} 0.3s ease-out ${props.index * props.staggerMs}ms forwards`
    }

    return output
  })

  return (
    <div
      data-boneyard-bone="true"
      aria-hidden="true"
      class={['boneyard-bone', props.boneClass]}
      style={style()}
    />
  )
}

function SolidSurface(props: { color: string; uid: string }): JSX.Element {
  return (
    <div
      aria-hidden="true"
      class={['boneyard-solid-surface', `boneyard-solid-surface-${props.uid}`]}
      style={{ position: 'absolute', inset: '0', background: props.color }}
    />
  )
}

export function Skeleton(props: SkeletonProps): JSX.Element {
  const serializedSnapshotConfig = createMemo(() => serializeSnapshotConfig(props.snapshotConfig))
  const buildMode = isBuildMode()

  if (buildMode) {
    return (
      <div
        class={props.class}
        style={{ position: 'relative' }}
        data-boneyard={props.name}
        data-boneyard-config={serializedSnapshotConfig()}
      >
        <div>{props.fixture ?? props.children}</div>
      </div>
    )
  }

  const environment = createEnvironmentState()
  const uid = (createUniqueId().replace(/[^a-zA-Z0-9_-]/g, '') || 'skeleton')
  const effectiveBones = createMemo(() =>
    props.initialBones ?? (props.name ? getRegisteredBones(props.name) : undefined),
  )
  const effectiveSelect = createMemo(() => props.select ?? globalConfig.select ?? 'container')
  const resolveWidth = createMemo(() => {
    if (effectiveSelect() === 'viewport') {
      return environment.viewportWidth() > 0
        ? environment.viewportWidth()
        : typeof window !== 'undefined' ? Math.round(window.innerWidth || 0) : 0
    }
    return environment.containerWidth()
  })
  const activeBones = createMemo(() =>
    resolveArtifact(effectiveBones(), resolveWidth()),
  )
  const resolvedColor = createMemo(() =>
    environment.isDark()
      ? (props.darkColor ?? globalConfig.darkColor ?? DEFAULTS.web.dark)
      : (props.color ?? globalConfig.color ?? DEFAULTS.web.light),
  )
  const animationStyle = createMemo(() => resolveAnimation(props.animate ?? globalConfig.animate ?? 'pulse'))
  const staggerMs = createMemo(() => resolveDuration(props.stagger ?? globalConfig.stagger, 80))
  const transitionMs = createMemo(() => resolveDuration(props.transition ?? globalConfig.transition, 300))
  const [isTransitioning, setTransitioning] = createSignal(false)
  // Keep the same overlay mounted while it fades out. The loading prop can
  // update before an effect applies the transition state, so the extra bit
  // prevents a one-commit unmount/remount.
  const [keepOverlay, setKeepOverlay] = createSignal(true)
  const [initialized, setInitialized] = createSignal(false)
  let previousLoading: boolean | undefined
  let transitionTimer: ReturnType<typeof setTimeout> | undefined

  // Solid 2 treats signal writes from render-effect callbacks as owned-scope
  // writes. Use the regular effect so its apply phase is the supported
  // imperative/writable scope for transition state updates.
  createEffect(
    () => ({
      loading: props.loading,
      transitionMs: transitionMs(),
      hasBones: !!activeBones(),
    }),
    state => {
      if (previousLoading === undefined) {
        previousLoading = state.loading
        // Capture the initial loading state without reading the reactive prop
        // untracked in the component body.
        setKeepOverlay(state.loading)
        // Gate the default keepOverlay=true until the initial state is known,
        // preventing an overlay flash when the component starts idle.
        setInitialized(true)
        return
      }

      if (state.loading) {
        previousLoading = true
        if (transitionTimer) clearTimeout(transitionTimer)
        transitionTimer = undefined
        setTransitioning(false)
        setKeepOverlay(true)
        return
      }

      if (previousLoading && state.transitionMs > 0 && state.hasBones) {
        setKeepOverlay(true)
        setTransitioning(true)
        if (transitionTimer) clearTimeout(transitionTimer)
        transitionTimer = setTimeout(() => {
          setTransitioning(false)
          setKeepOverlay(false)
          transitionTimer = undefined
        }, state.transitionMs)
      } else {
        setTransitioning(false)
        setKeepOverlay(false)
      }
      previousLoading = false
    },
  )

  onSettled(() => () => {
    if (transitionTimer) clearTimeout(transitionTimer)
  })

  const showOverlay = createMemo(() =>
    !!activeBones() && (props.loading || (initialized() && keepOverlay())),
  )
  const showFallback = createMemo(() =>
    props.loading && !activeBones() && !isTransitioning(),
  )
  const hideContent = createMemo(() =>
    (showOverlay() && !isTransitioning()) || (showFallback() && !props.fallback),
  )
  const effectiveHeight = createMemo(() =>
    environment.containerHeight() > 0
      ? environment.containerHeight()
      : activeBones()?.height ?? 0,
  )
  const scaleY = createMemo(() => {
    const height = effectiveHeight()
    const capturedHeight = activeBones()?.height ?? 0
    return height > 0 && capturedHeight > 0 ? height / capturedHeight : 1
  })

  return (
    <div
      ref={environment.rootRef}
      class={props.class}
      style={{
        position: 'relative',
        'min-height': showOverlay() && effectiveHeight() > 0
          ? `${effectiveHeight()}px`
          : showFallback() && !props.fallback
            ? '40px'
            : undefined,
      }}
      aria-busy={props.loading ? 'true' : undefined}
      data-boneyard={props.name}
      data-boneyard-config={serializedSnapshotConfig()}
    >
      <div
        ref={environment.contentRef}
        data-boneyard-content="true"
        style={{ visibility: hideContent() ? 'hidden' : undefined }}
      >
        {showFallback() && props.fallback ? props.fallback : props.children}
      </div>

      {showOverlay() && activeBones() && (
        <BoneOverlay
          result={activeBones()!}
          color={resolvedColor()}
          isDark={environment.isDark()}
          animationStyle={animationStyle()}
          staggerMs={staggerMs()}
          scaleY={scaleY()}
          transitionMs={transitionMs()}
          transitioning={isTransitioning()}
          boneClass={props.boneClass ?? globalConfig.boneClass}
          uid={uid}
        />
      )}

      {showFallback() && !props.fallback && (
        <SolidSurface color={resolvedColor()} uid={uid} />
      )}
    </div>
  )
}

export function SkeletonView(props: SkeletonViewProps): JSX.Element {
  const environment = createEnvironmentState()
  const uid = (createUniqueId().replace(/[^a-zA-Z0-9_-]/g, '') || 'skeleton-view')
  const effectiveBones = createMemo(() =>
    props.initialBones ?? (props.name ? getRegisteredBones(props.name) : undefined),
  )
  const effectiveSelect = createMemo(() => props.select ?? globalConfig.select ?? 'container')
  const resolveWidth = createMemo(() => {
    if (effectiveSelect() === 'viewport') {
      return environment.viewportWidth() > 0
        ? environment.viewportWidth()
        : typeof window !== 'undefined' ? Math.round(window.innerWidth || 0) : 0
    }
    return environment.containerWidth()
  })
  const activeBones = createMemo(() =>
    resolveArtifact(effectiveBones(), resolveWidth()),
  )
  const resolvedColor = createMemo(() =>
    environment.isDark()
      ? (props.darkColor ?? globalConfig.darkColor ?? DEFAULTS.web.dark)
      : (props.color ?? globalConfig.color ?? DEFAULTS.web.light),
  )
  const animationStyle = createMemo(() => resolveAnimation(props.animate ?? globalConfig.animate ?? 'pulse'))
  const staggerMs = createMemo(() => resolveDuration(props.stagger ?? globalConfig.stagger, 80))
  const effectiveHeight = createMemo(() => activeBones()?.height ?? 40)
  const scaleY = createMemo(() => {
    const height = effectiveHeight()
    const capturedHeight = activeBones()?.height ?? 0
    return height > 0 && capturedHeight > 0 ? height / capturedHeight : 1
  })

  return (
    <div
      ref={environment.rootRef}
      class={props.class}
      style={{ position: 'relative', 'min-height': `${effectiveHeight()}px` }}
    >
      {activeBones() ? (
        <BoneOverlay
          result={activeBones()!}
          color={resolvedColor()}
          isDark={environment.isDark()}
          animationStyle={animationStyle()}
          staggerMs={staggerMs()}
          scaleY={scaleY()}
          transitionMs={0}
          transitioning={false}
          uid={uid}
        />
      ) : (
        <SolidSurface color={resolvedColor()} uid={uid} />
      )}
    </div>
  )
}
