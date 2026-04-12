/** @jsxImportSource preact */
import { useRef, useState, useEffect } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { normalizeBone } from './types.js'
import type { AnyBone, SkeletonResult, ResponsiveBones, SnapshotConfig, AnimationStyle } from './types.js'
import {
  adjustColor,
  ensureBuildSnapshotHook,
  getRegisteredBones,
  isBuildMode,
  registerBones,
  resolveResponsive,
  SHIMMER,
  PULSE,
  DEFAULTS,
} from './shared.js'

ensureBuildSnapshotHook()

export { registerBones }
export type { AnimationStyle }

interface BoneyardConfig {
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  boneClass?: string
}

let globalConfig: BoneyardConfig = {}

/**
 * Set global defaults for all `<Skeleton>` components.
 * Individual props override these defaults.
 *
 * ```ts
 * import { configureBoneyard } from 'boneyard-js/preact'
 *
 * configureBoneyard({
 *   color: '#e5e5e5',
 *   darkColor: '#2a2a2a',
 *   animate: true,
 * })
 * ```
 */
export function configureBoneyard(config: BoneyardConfig): void {
  globalConfig = { ...globalConfig, ...config }
}

export interface SkeletonProps {
  /** When true, shows the skeleton. When false, shows children. */
  loading: boolean
  /** Your component — rendered when not loading. */
  children: ComponentChildren
  /**
   * Name this skeleton. Used by `npx boneyard-js build` to identify and capture bones.
   * Also used to auto-resolve pre-generated bones from the registry.
   */
  name?: string
  /**
   * Pre-generated bones. Accepts a single `SkeletonResult` or a `ResponsiveBones` map.
   */
  initialBones?: SkeletonResult | ResponsiveBones
  /** Bone fill color — any CSS color value (default: '#f0f0f0') */
  color?: string
  /** Bone fill color for dark mode (default: '#222222'). Used when a .dark ancestor exists. */
  darkColor?: string
  /** Animation style: 'pulse' (default), 'shimmer', 'solid', or boolean (true = pulse, false = solid) */
  animate?: AnimationStyle
  /** Stagger animation delay between bones in ms (default: false, true = 80ms) */
  stagger?: number | boolean
  /** Fade transition duration in ms when skeleton hides (default: false, true = 300ms) */
  transition?: number | boolean
  /** CSS class applied to each bone element */
  boneClass?: string
  /** Additional className for the container */
  className?: string
  /**
   * Shown when loading is true and no bones are available.
   */
  fallback?: ComponentChildren
  /**
   * Mock content rendered during `npx boneyard-js build` so the CLI can capture
   * bone positions even when real data isn't available.
   * Only rendered when the CLI sets `window.__BONEYARD_BUILD = true`.
   */
  fixture?: ComponentChildren
  /**
   * Controls how `npx boneyard-js build` extracts bones from the fixture.
   * Stored as a data attribute — the CLI reads it during capture.
   */
  snapshotConfig?: SnapshotConfig
}

/**
 * Wrap any component to get automatic skeleton loading screens.
 *
 * 1. Run `npx boneyard-js build` — captures bone positions from your rendered UI
 * 2. Import the generated registry in your app entry
 * 3. `<Skeleton name="..." loading={isLoading}>` auto-resolves bones by name
 */
export function Skeleton({
  loading,
  children,
  name,
  initialBones,
  color,
  darkColor,
  animate,
  stagger = false,
  transition = false,
  boneClass,
  className,
  fallback,
  fixture,
  snapshotConfig,
}: SkeletonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const uid = useRef(Math.random().toString(36).slice(2, 8)).current
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isDark, setIsDark] = useState(false)

  // Auto-detect dark mode via .dark class on <html> or ancestor
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkDark = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark') ||
        !!containerRef.current?.closest('.dark')
      setIsDark(hasDarkClass)
    }
    checkDark()
    const mo = new MutationObserver(checkDark)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', checkDark)
    return () => {
      mo.disconnect()
      mq.removeEventListener('change', checkDark)
    }
  }, [])

  const effectiveColor = color ?? globalConfig.color ?? DEFAULTS.web.light
  const effectiveDarkColor = darkColor ?? globalConfig.darkColor ?? DEFAULTS.web.dark
  const resolvedColor = isDark ? effectiveDarkColor : effectiveColor
  const rawAnimate = animate ?? globalConfig.animate ?? 'pulse'
  const animationStyle: 'pulse' | 'shimmer' | 'solid' =
    rawAnimate === true ? 'pulse' :
    rawAnimate === false ? 'solid' :
    rawAnimate

  // Track container width for responsive breakpoint selection
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      setContainerWidth(Math.round(rect?.width ?? 0))
      if (rect && rect.height > 0) setContainerHeight(Math.round(rect.height))
    })
    ro.observe(el)
    const rect = el.getBoundingClientRect()
    setContainerWidth(Math.round(rect.width))
    if (rect.height > 0) setContainerHeight(Math.round(rect.height))
    return () => ro.disconnect()
  }, [])

  // Data attributes for CLI discovery
  const dataAttrs: Record<string, string> = {}
  if (name) {
    dataAttrs['data-boneyard'] = name
    if (snapshotConfig) {
      dataAttrs['data-boneyard-config'] = JSON.stringify(snapshotConfig)
    }
  }

  // Build mode: render fixture (if provided) or children so CLI can capture bones
  if (isBuildMode()) {
    return (
      <div ref={containerRef} className={className} style={{ position: 'relative' }} {...dataAttrs}>
        <div>{fixture ?? children}</div>
      </div>
    )
  }

  // Resolve bones: explicit initialBones > registry lookup
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const effectiveBones = initialBones ?? (name ? getRegisteredBones(name) : undefined)
  const viewportWidth = mounted && typeof window !== 'undefined' ? window.innerWidth : 0
  const resolveWidth = containerWidth > 0 ? containerWidth : viewportWidth
  const activeBones = effectiveBones && resolveWidth > 0
    ? resolveResponsive(effectiveBones, resolveWidth)
    : null

  const resolvedBoneClass = boneClass ?? globalConfig.boneClass

  // Stagger: delay between each bone's animation
  const staggerMs = (() => { const v = stagger ?? globalConfig.stagger; return v === true ? 80 : v === false || !v ? 0 : v })()

  // Transition: fade out skeleton when loading ends
  const transitionMs = (() => { const v = transition ?? globalConfig.transition; return v === true ? 300 : v === false || !v ? 0 : v })()
  const [transitioning, setTransitioning] = useState(false)
  const prevLoadingRef = useRef(loading)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (prevLoadingRef.current && !loading && transitionMs > 0 && activeBones) {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
      setTransitioning(true)
      transitionTimerRef.current = setTimeout(() => {
        setTransitioning(false)
        transitionTimerRef.current = null
      }, transitionMs)
    }
    prevLoadingRef.current = loading
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    }
  }, [loading, transitionMs, activeBones])

  const showSkeleton = (loading || transitioning) && activeBones
  const showFallback = loading && !activeBones && !transitioning

  // Scale vertical positions to match actual container height
  const effectiveHeight = containerHeight > 0 ? containerHeight : activeBones?.height ?? 0
  const capturedHeight = activeBones?.height ?? 0
  const scaleY = (effectiveHeight > 0 && capturedHeight > 0) ? effectiveHeight / capturedHeight : 1

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }} {...dataAttrs}>
      <div data-boneyard-content="true" style={showSkeleton && !transitioning ? { visibility: 'hidden' } : undefined}>
        {showFallback ? fallback : children}
      </div>

      {showSkeleton && (
        <div data-boneyard-overlay="true" style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          opacity: transitioning ? 0 : 1,
          transition: transitionMs > 0 ? `opacity ${transitionMs}ms ease-out` : undefined,
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {(activeBones.bones as AnyBone[]).filter(raw => !normalizeBone(raw).c).map((raw, i) => {
              const b = normalizeBone(raw)
              const boneColor = resolvedColor
              const lighterColor = adjustColor(resolvedColor, isDark ? PULSE.darkAdjust : PULSE.lightAdjust)
              const capturedPxW = (b.w / 100) * (activeBones.width ?? 0)
              const isCircle = b.r === '50%' && Math.abs(capturedPxW - b.h) < 4
              const boneStyle: Record<string, any> = {
                position: 'absolute',
                left: `${b.x}%`,
                top: b.y * scaleY,
                width: isCircle ? b.h * scaleY : `${b.w}%`,
                height: b.h * scaleY,
                borderRadius: typeof b.r === 'string' ? b.r : `${b.r}px`,
                backgroundColor: boneColor,
              }
              if (animationStyle === 'pulse') {
                boneStyle.animation = `bp-${uid} ${PULSE.speed} ease-in-out infinite`
              } else if (animationStyle === 'shimmer') {
                const shimmerHighlight = isDark ? SHIMMER.darkHighlight : SHIMMER.lightHighlight
                delete boneStyle.backgroundColor
                boneStyle.backgroundImage = `linear-gradient(${SHIMMER.angle}deg, ${boneColor} ${SHIMMER.start}%, ${shimmerHighlight} 50%, ${boneColor} ${SHIMMER.end}%)`
                boneStyle.backgroundSize = '200% 100%'
                boneStyle.animation = `bs-${uid} ${SHIMMER.speed} linear infinite`
              }
              if (staggerMs > 0) {
                boneStyle.opacity = 0
                boneStyle.animation = `${boneStyle.animation ? boneStyle.animation + ',' : ''} by-${uid} 0.3s ease-out ${i * staggerMs}ms forwards`
              }
              return <div key={i} data-boneyard-bone="true" className={resolvedBoneClass} style={boneStyle} />
            })}
            {animationStyle === 'pulse' && (
              <style>{`@keyframes bp-${uid}{0%,100%{background-color:${resolvedColor}}50%{background-color:${adjustColor(resolvedColor, isDark ? PULSE.darkAdjust : PULSE.lightAdjust)}}}`}</style>
            )}
            {animationStyle === 'shimmer' && (
              <style>{`@keyframes bs-${uid}{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            )}
            {staggerMs > 0 && (
              <style>{`@keyframes by-${uid}{from{opacity:0}to{opacity:1}}`}</style>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
