import { useRef, useState, useEffect, type ReactNode } from 'react'
import { snapshotBones } from './extract.js'
import { normalizeBone } from './types.js'
import type { Bone, AnyBone, SkeletonResult, ResponsiveBones, SnapshotConfig } from './types.js'

// ── Global defaults ─────────────────────────────────────────────────────────
export type AnimationStyle = 'pulse' | 'shimmer' | 'solid' | boolean

interface BoneyardConfig {
  color?: string
  darkColor?: string
  animate?: AnimationStyle
}

let globalConfig: BoneyardConfig = {}

/**
 * Set global defaults for all `<Skeleton>` components.
 * Individual props override these defaults.
 *
 * ```ts
 * import { configureBoneyard } from 'boneyard-js/react'
 *
 * configureBoneyard({
 *   color: '#e5e5e5',
 *   darkColor: 'rgba(255,255,255,0.08)',
 *   animate: true,
 * })
 * ```
 */
export function configureBoneyard(config: BoneyardConfig): void {
  globalConfig = { ...globalConfig, ...config }
}

// ── Bones registry ──────────────────────────────────────────────────────────
const bonesRegistry = new Map<string, SkeletonResult | ResponsiveBones>()

/**
 * Register pre-generated bones so `<Skeleton name="...">` can auto-resolve them.
 *
 * Called by the generated `registry.js` file (created by `npx boneyard-js build`).
 * Import it once in your app entry point:
 *
 * ```ts
 * import './bones/registry'
 * ```
 */
export function registerBones(map: Record<string, SkeletonResult | ResponsiveBones>): void {
  for (const [name, bones] of Object.entries(map)) {
    bonesRegistry.set(name, bones)
  }
}

// ── Expose snapshotBones for CLI build mode (module-level, no useEffect) ────
if (typeof window !== 'undefined' && (window as any).__BONEYARD_BUILD) {
  (window as any).__BONEYARD_SNAPSHOT = snapshotBones
}

/** Pick the right SkeletonResult from a responsive set for the current width */
function resolveResponsive(
  bones: SkeletonResult | ResponsiveBones,
  width: number,
): SkeletonResult | null {
  if (!('breakpoints' in bones)) return bones
  const bps = Object.keys(bones.breakpoints).map(Number).sort((a, b) => a - b)
  if (bps.length === 0) return null
  const match = [...bps].reverse().find(bp => width >= bp) ?? bps[0]
  return bones.breakpoints[match] ?? null
}

/** Mix a hex color toward white by `amount` (0–1). */
function adjustColor(color: string, amount: number): string {
  // Handle rgba
  const rgbaMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (rgbaMatch) {
    const [, r, g, b, a = '1'] = rgbaMatch
    const newAlpha = Math.min(1, parseFloat(a) + amount * 0.5)
    return `rgba(${r},${g},${b},${newAlpha.toFixed(3)})`
  }
  // Handle hex
  if (color.startsWith('#') && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const nr = Math.round(r + (255 - r) * amount)
      const ng = Math.round(g + (255 - g) * amount)
      const nb = Math.round(b + (255 - b) * amount)
      return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
    }
  }
  return color
}

export interface SkeletonProps {
  /** When true, shows the skeleton. When false, shows children. */
  loading: boolean
  /** Your component — rendered when not loading. */
  children: ReactNode
  /**
   * Name this skeleton. Used by `npx boneyard-js build` to identify and capture bones.
   * Also used to auto-resolve pre-generated bones from the registry.
   */
  name?: string
  /**
   * Pre-generated bones. Accepts a single `SkeletonResult` or a `ResponsiveBones` map.
   */
  initialBones?: SkeletonResult | ResponsiveBones
  /** Bone color (default: 'rgba(0,0,0,0.08)', auto-detects dark mode) */
  color?: string
  /** Bone color for dark mode (default: 'rgba(255,255,255,0.06)'). Used when prefers-color-scheme is dark or a .dark ancestor exists. */
  darkColor?: string
  /** Animation style: 'pulse' (default), 'shimmer', 'solid', or boolean (true = pulse, false = solid) */
  animate?: AnimationStyle
  /** Additional className for the container */
  className?: string
  /**
   * Shown when loading is true and no bones are available.
   */
  fallback?: ReactNode
  /**
   * Mock content rendered during `npx boneyard-js build` so the CLI can capture
   * bone positions even when real data isn't available.
   * Only rendered when the CLI sets `window.__BONEYARD_BUILD = true`.
   */
  fixture?: ReactNode
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
  className,
  fallback,
  fixture,
  snapshotConfig,
}: SkeletonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isDark, setIsDark] = useState(false)

  const isBuildMode = typeof window !== 'undefined' && (window as any).__BONEYARD_BUILD === true

  // Auto-detect dark mode (watches both prefers-color-scheme and .dark class)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkDark = () => {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const hasDarkClass = document.documentElement.classList.contains('dark') ||
        !!containerRef.current?.closest('.dark')
      setIsDark(hasDarkClass)
    }
    checkDark()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const mqHandler = () => checkDark()
    mq.addEventListener('change', mqHandler)
    // Watch for .dark class changes on <html>
    const mo = new MutationObserver(checkDark)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      mq.removeEventListener('change', mqHandler)
      mo.disconnect()
    }
  }, [])

  const effectiveColor = color ?? globalConfig.color ?? 'rgba(0,0,0,0.08)'
  const effectiveDarkColor = darkColor ?? globalConfig.darkColor ?? 'rgba(255,255,255,0.06)'
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
  if (isBuildMode) {
    return (
      <div ref={containerRef} className={className} style={{ position: 'relative' }} {...dataAttrs}>
        <div>{fixture ?? children}</div>
      </div>
    )
  }

  // Resolve bones: explicit initialBones > registry lookup
  // Use viewport width to pick breakpoint since bones are keyed by viewport width
  const effectiveBones = initialBones ?? (name ? bonesRegistry.get(name) : undefined)
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : containerWidth
  const activeBones = effectiveBones && containerWidth > 0
    ? resolveResponsive(effectiveBones, viewportWidth)
    : null

  const showSkeleton = loading && activeBones
  const showFallback = loading && !activeBones

  // Scale vertical positions to match actual container height
  const effectiveHeight = containerHeight > 0 ? containerHeight : activeBones?.height ?? 0
  const capturedHeight = activeBones?.height ?? 0
  const scaleY = (effectiveHeight > 0 && capturedHeight > 0) ? effectiveHeight / capturedHeight : 1

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }} {...dataAttrs}>
      <div style={showSkeleton ? { visibility: 'hidden' } : undefined}>
        {showFallback ? fallback : children}
      </div>

      {showSkeleton && (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {activeBones.bones.map((raw: AnyBone, i: number) => {
              const b = normalizeBone(raw)
              const boneColor = b.c ? adjustColor(resolvedColor, isDark ? 0.03 : 0.45) : resolvedColor
              const lighterColor = adjustColor(resolvedColor, isDark ? 0.04 : 0.3)
              const boneStyle: Record<string, any> = {
                position: 'absolute',
                left: `${b.x}%`,
                top: b.y * scaleY,
                width: `${b.w}%`,
                height: b.h * scaleY,
                borderRadius: typeof b.r === 'string' ? b.r : `${b.r}px`,
                backgroundColor: boneColor,
              }
              if (animationStyle === 'pulse') {
                boneStyle.animation = 'boneyard-pulse 1.8s ease-in-out infinite'
              } else if (animationStyle === 'shimmer') {
                boneStyle.background = `linear-gradient(90deg, ${boneColor} 30%, ${lighterColor} 50%, ${boneColor} 70%)`
                boneStyle.backgroundSize = '200% 100%'
                boneStyle.animation = 'boneyard-shimmer 2.4s linear infinite'
              }
              return <div key={i} style={boneStyle} />
            })}
            {animationStyle === 'pulse' && (
              <style>{`@keyframes boneyard-pulse{0%,100%{background-color:${resolvedColor}}50%{background-color:${adjustColor(resolvedColor, isDark ? 0.04 : 0.3)}}}`}</style>
            )}
            {animationStyle === 'shimmer' && (
              <style>{`@keyframes boneyard-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
