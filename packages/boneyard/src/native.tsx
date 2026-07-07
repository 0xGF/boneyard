import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  View,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  UIManager,
  findNodeHandle,
  useWindowDimensions,
  useColorScheme,
  type ViewStyle,
  type LayoutChangeEvent,
} from 'react-native'
import { normalizeBone } from './types.js'
import type { AnyBone, Bone, SkeletonResult, ResponsiveBones, AnimationStyle } from './types.js'
import {
  adjustColor,
  resolveResponsive as sharedResolveResponsive,
  DEFAULTS,
  NATIVE_SHIMMER,
  PULSE,
} from './shared.js'

export type { AnimationStyle }

interface BoneyardConfig {
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
}

let globalConfig: BoneyardConfig = {}

/**
 * Set global defaults for all `<Skeleton>` components.
 * Individual props override these defaults.
 */
export function configureBoneyard(config: BoneyardConfig): void {
  globalConfig = { ...globalConfig, ...config }
}

// ── Bones registry ──────────────────────────────────────────────────────────
const bonesRegistry = new Map<string, SkeletonResult | ResponsiveBones>()

export function registerBones(map: Record<string, SkeletonResult | ResponsiveBones>): void {
  for (const [name, bones] of Object.entries(map)) {
    bonesRegistry.set(name, bones)
  }
}

const resolveResponsive = sharedResolveResponsive

// ── Animations ──────────────────────────────────────────────────────────────

/** Hook: pulse animation value 0→1→0 looping at 1.8s total */
function usePulseAnimation(enabled: boolean): Animated.Value {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!enabled) {
      anim.setValue(0)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [enabled, anim])

  return anim
}

/** Hook: shimmer animation — sweeps a highlight across each bone */
function useShimmerAnimation(enabled: boolean): Animated.Value {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!enabled) {
      anim.setValue(0)
      return
    }
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: NATIVE_SHIMMER.speed,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    loop.start()
    return () => loop.stop()
  }, [enabled, anim])

  return anim
}

/** Hook: stagger fade-in — each bone fades in with an incremental delay */
function useStaggerAnimation(enabled: boolean, count: number, delayMs: number): Animated.Value[] {
  const anims = useRef<Animated.Value[]>([]).current

  // Grow array if needed
  while (anims.length < count) anims.push(new Animated.Value(0))

  useEffect(() => {
    if (!enabled || count === 0 || delayMs === 0) return
    // Reset
    for (let i = 0; i < count; i++) anims[i].setValue(0)
    const animations = anims.slice(0, count).map((a, i) =>
      Animated.timing(a, {
        toValue: 1,
        duration: 300,
        delay: i * delayMs,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    )
    Animated.parallel(animations).start()
  }, [enabled, count, delayMs])

  return anims
}

// ── Dev scan — auto-captures bones when `npx boneyard-js build --native` is running

interface FiberNode {
  tag: number
  type: string | Function
  stateNode: any
  memoizedProps: Record<string, any>
  child: FiberNode | null
  sibling: FiberNode | null
  return: FiberNode | null
}

const HOST_COMPONENT = 5
const HOST_TEXT = 6
const LEAF_TYPES = new Set(['RCTText', 'RCTImage', 'RCTImageView', 'Image', 'Text'])

let _scanUrl: string | null | undefined = undefined
let _scanPromise: Promise<string | null> | null = null

/** Extract the dev server host from the JS bundle URL (works on physical devices) */
function getDevServerHost(): string | null {
  try {
    const { NativeModules } = require('react-native')
    const sourceCode = NativeModules.SourceCode
    const scriptURL: string | undefined =
      sourceCode?.scriptURL ?? sourceCode?.getConstants?.()?.scriptURL
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/)
      if (match) return match[1]
    }
  } catch {}
  return null
}

function getScanUrls(): string[] {
  const urls: string[] = []
  const devHost = getDevServerHost()
  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    urls.push(`http://${devHost}:9999`)
  }
  if (Platform.OS === 'android') urls.push('http://10.0.2.2:9999')
  urls.push('http://localhost:9999')
  return urls
}

/** Check if the boneyard CLI scan receiver is running (deduped across all Skeleton instances) */
function checkCLI(): Promise<string | null> {
  if (_scanPromise) return _scanPromise
  _scanPromise = (async () => {
    for (const url of getScanUrls()) {
      try {
        const res = await fetch(`${url}/ping`, { method: 'GET' })
        const data = await res.json()
        if (data?.boneyard) {
          _scanUrl = url
          return url
        }
      } catch {}
    }
    _scanUrl = null
    return null
  })()
  return _scanPromise
}

async function sendBones(name: string, result: SkeletonResult): Promise<void> {
  if (!_scanUrl) return
  try {
    await fetch(`${_scanUrl}/bones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, result }),
    })
  } catch {}
}

/** Get the React fiber node from a native ref */
function getFiber(ref: any): FiberNode | null {
  const fiber = ref?.__internalInstanceHandle
    ?? ref?._internalFiberInstanceHandleDEV
    ?? ref?._reactInternals
    ?? ref?._reactInternalInstance
    ?? null
  if (fiber?.tag !== undefined) return fiber
  if (fiber?.current) return fiber.current
  return fiber
}

function findFirstHostChild(fiber: FiberNode): FiberNode | null {
  let current: FiberNode | null = fiber.child
  while (current) {
    if (current.tag === HOST_COMPONENT || current.tag === HOST_TEXT) return current
    const deeper = findFirstHostChild(current)
    if (deeper) return deeper
    current = current.sibling
  }
  return null
}

interface ScannedView {
  stateNode: any
  style: Record<string, any>
  isLeaf: boolean
  isContainer: boolean
}

/** Walk the fiber tree and collect host views that should become bones */
function collectHostViews(fiber: FiberNode): ScannedView[] {
  const views: ScannedView[] = []

  function walk(node: FiberNode | null): void {
    if (!node) return
    if (node.tag === HOST_COMPONENT && node.stateNode) {
      const flatStyle = StyleSheet.flatten(node.memoizedProps?.style) || {}
      const typeName = typeof node.type === 'string' ? node.type : ''

      let hasHostChildren = false
      let childFiber = node.child
      while (childFiber) {
        if (childFiber.tag === HOST_COMPONENT || childFiber.tag === HOST_TEXT) {
          hasHostChildren = true
          break
        }
        if (childFiber.child && findFirstHostChild(childFiber)) {
          hasHostChildren = true
          break
        }
        childFiber = childFiber.sibling
      }

      const isLeaf = LEAF_TYPES.has(typeName) || !hasHostChildren
      const bg = flatStyle.backgroundColor
      const hasBg = !!bg && bg !== 'transparent' && bg !== 'rgba(0,0,0,0)'
      const hasBorder = (flatStyle.borderWidth ?? flatStyle.borderTopWidth ?? 0) > 0
      const hasVisualSurface = hasBg || hasBorder

      if (isLeaf || hasVisualSurface) {
        views.push({
          stateNode: node.stateNode,
          style: flatStyle,
          isLeaf,
          isContainer: !isLeaf && hasVisualSurface,
        })
      }
    }
    walk(node.child)
    walk(node.sibling)
  }

  walk(fiber.child)
  return views
}

function extractBorderRadius(style: Record<string, any>): number | string {
  const tl = style.borderTopLeftRadius
  const tr = style.borderTopRightRadius
  const br = style.borderBottomRightRadius
  const bl = style.borderBottomLeftRadius
  if (tl != null || tr != null || br != null || bl != null) {
    const vals = [tl ?? 0, tr ?? 0, br ?? 0, bl ?? 0]
    if (vals.every((v: number) => v === vals[0])) return vals[0] || 0
    return `${vals[0]}px ${vals[1]}px ${vals[2]}px ${vals[3]}px`
  }
  const r = style.borderRadius
  if (r == null) return 8
  if (typeof r === 'string' && r.includes('%')) return r
  return typeof r === 'number' ? r : parseFloat(r) || 8
}

/** Get the native view tag from a ref or fiber stateNode */
function getNativeTag(ref: any): number | null {
  const handle = findNodeHandle(ref)
  if (handle) return handle
  if (typeof ref?.nativeTag === 'number') return ref.nativeTag
  if (typeof ref?.canonical?.nativeTag === 'number') return ref.canonical.nativeTag
  if (typeof ref?._nativeTag === 'number') return ref._nativeTag
  return null
}

function measureLayoutByTag(
  childTag: number, parentTag: number,
): Promise<{ x: number; y: number; w: number; h: number } | null> {
  return new Promise(resolve => {
    try {
      UIManager.measureLayout(childTag, parentTag,
        () => resolve(null),
        (x: number, y: number, w: number, h: number) => resolve({ x, y, w, h }))
    } catch { resolve(null) }
  })
}

function measureByTag(tag: number): Promise<{ w: number; h: number } | null> {
  return new Promise(resolve => {
    try {
      UIManager.measure(tag,
        (_x: number, _y: number, w: number, h: number) => resolve({ w, h }))
    } catch { resolve(null) }
  })
}

/** Scan a Skeleton container's children and send bone data to the CLI */
async function scanContainer(name: string, containerRef: View, screenWidth: number) {
  try {
    const url = await checkCLI()
    if (!url) return

    const containerTag = getNativeTag(containerRef)
    if (!containerTag) return

    const containerSize = await measureByTag(containerTag)
    if (!containerSize || containerSize.w < 1 || containerSize.h < 1) return

    const fiber = getFiber(containerRef)
    if (!fiber) return

    const cw = containerSize.w
    const ch = containerSize.h
    const scanned = collectHostViews(fiber)

    const bones: any[] = []
    for (const sv of scanned) {
      const rawState = sv.stateNode
      const childTag = typeof rawState?.nativeTag === 'number' ? rawState.nativeTag
        : typeof rawState?.canonical?.nativeTag === 'number' ? rawState.canonical.nativeTag
        : typeof rawState?._nativeTag === 'number' ? rawState._nativeTag
        : getNativeTag(rawState)
      if (!childTag) continue

      const layout = await measureLayoutByTag(childTag, containerTag)
      if (!layout || layout.w < 2 || layout.h < 2) continue

      let r: number | string = extractBorderRadius(sv.style)
      // Detect circles: square-ish element with borderRadius >= half the size
      if (typeof r === 'number' && r > 0) {
        const isSquarish = Math.abs(layout.w - layout.h) < 4
        if (isSquarish && r >= Math.min(layout.w, layout.h) / 2 - 1) {
          r = '50%'
        }
      }

      const arr: any[] = [
        cw > 0 ? +((layout.x / cw) * 100).toFixed(4) : 0,
        Math.round(layout.y),
        cw > 0 ? +((layout.w / cw) * 100).toFixed(4) : 0,
        Math.round(layout.h),
        r,
      ]
      if (sv.isContainer) arr.push(true)
      bones.push(arr)
    }

    const result: SkeletonResult = {
      name,
      viewportWidth: Math.round(screenWidth),
      width: Math.round(cw),
      height: Math.round(ch),
      bones: bones as any,
    }

    await sendBones(name, result)
  } catch (e: any) {
    console.warn(`[boneyard] scan failed for "${name}": ${e.message}`)
  }
}

// ── Skeleton component ──────────────────────────────────────────────────────

export interface SkeletonProps {
  loading: boolean
  children: ReactNode
  name?: string
  initialBones?: SkeletonResult | ResponsiveBones
  /** Bone fill color — any valid React Native color (default: '#f0f0f0') */
  color?: string
  /** Bone fill color for dark mode (default: '#222222') */
  darkColor?: string
  /** Force dark/light mode. When omitted, uses system scheme. */
  dark?: boolean
  /** Animation style: 'pulse' (default), 'shimmer', 'solid', or boolean (true = pulse, false = solid) */
  animate?: AnimationStyle
  /** Stagger animation delay between bones in ms (default: false, true = 80ms) */
  stagger?: number | boolean
  /** Fade transition duration in ms when skeleton hides (default: false, true = 300ms) */
  transition?: number | boolean
  style?: ViewStyle
  fallback?: ReactNode
}

export function Skeleton({
  loading,
  children,
  name,
  initialBones,
  color,
  darkColor,
  dark,
  animate = true,
  stagger = false,
  transition = false,
  style,
  fallback,
}: SkeletonProps) {
  const systemScheme = useColorScheme()
  const isDark = dark ?? systemScheme === 'dark'

  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const containerRef = useRef<View>(null)
  const hasScanned = useRef(false)
  const { width: screenWidth, fontScale } = useWindowDimensions()

  const effectiveColor = color ?? globalConfig.color ?? (isDark ? DEFAULTS.native.dark : DEFAULTS.native.light)
  const effectiveDarkColor = darkColor ?? globalConfig.darkColor ?? DEFAULTS.native.dark
  const resolvedColor = isDark ? effectiveDarkColor : effectiveColor

  const rawAnimate = animate ?? globalConfig.animate ?? 'pulse'
  const animationStyle: 'pulse' | 'shimmer' | 'solid' =
    rawAnimate === true ? 'pulse' :
    rawAnimate === false ? 'solid' :
    rawAnimate

  const pulseAnim = usePulseAnimation(loading && animationStyle === 'pulse')
  const shimmerAnim = useShimmerAnimation(loading && animationStyle === 'shimmer')

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setContainerWidth(Math.round(width))
    if (height > 0) setContainerHeight(Math.round(height))
  }, [])

  // Dev scan — when CLI is running, auto-capture bones from children
  // Re-scans when fontScale changes so bones match Dynamic Type sizing
  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__ || !name || hasScanned.current) return
    hasScanned.current = true
    const timer = setTimeout(() => {
      if (containerRef.current) {
        scanContainer(name, containerRef.current, screenWidth)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [name, screenWidth, fontScale])

  const effectiveBones = initialBones ?? (name ? bonesRegistry.get(name) : undefined)
  const activeBones = effectiveBones
    ? resolveResponsive(effectiveBones, screenWidth)
    : null

  const staggerMs = (() => { const v = stagger ?? globalConfig.stagger; return v === true ? 80 : v === false || !v ? 0 : v })()
  const transitionMs = (() => { const v = transition ?? globalConfig.transition; return v === true ? 300 : v === false || !v ? 0 : v })()
  const boneCount = activeBones?.bones?.length ?? 0
  const staggerAnims = useStaggerAnimation(loading && staggerMs > 0, boneCount, staggerMs)

  const [transitioning, setTransitioning] = useState(false)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const fadeAnimRef = useRef<Animated.CompositeAnimation | null>(null)
  const prevLoadingRef = useRef(loading)

  useEffect(() => {
    if (prevLoadingRef.current && !loading && transitionMs > 0 && activeBones) {
      fadeAnimRef.current?.stop()
      setTransitioning(true)
      fadeAnimRef.current = Animated.timing(fadeAnim, {
        toValue: 0,
        duration: transitionMs,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
      fadeAnimRef.current.start(() => {
        setTransitioning(false)
        fadeAnim.setValue(1)
        fadeAnimRef.current = null
      })
    }
    prevLoadingRef.current = loading
  }, [loading])

  const showSkeleton = (loading || transitioning) && activeBones
  const showFallback = loading && !activeBones && !transitioning

  // Scale vertical positions to match actual container height (handles Dynamic Type / font scaling)
  const capturedHeight = activeBones?.height ?? 0
  const effectiveHeight = containerHeight > 0 ? containerHeight : capturedHeight
  const scaleY = (effectiveHeight > 0 && capturedHeight > 0) ? effectiveHeight / capturedHeight : 1

  return (
    <View ref={containerRef} style={[styles.container, style]} onLayout={onLayout} collapsable={false} aria-busy={loading || undefined}>
      {/* Always render children so the container reflects real content height (handles Dynamic Type) */}
      <View style={showSkeleton && !transitioning ? styles.hidden : undefined} pointerEvents={showSkeleton ? 'none' : 'auto'}>
        {showFallback ? fallback ?? null : children}
      </View>

      {showSkeleton && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: transitioning ? fadeAnim : 1 }]}>
          {(activeBones.bones as AnyBone[]).filter(raw => !normalizeBone(raw).c).map((raw: AnyBone, i: number) => {
            const b = normalizeBone(raw)
            const borderRadius = typeof b.r === 'number'
              ? b.r
              : b.r === '50%'
                ? Math.min(
                    containerWidth > 0 ? (b.w / 100) * containerWidth : b.h,
                    b.h,
                  ) / 2
                : (parseFloat(b.r) || 0)

            const boneColor = resolvedColor
            const lighterColor = adjustColor(resolvedColor, isDark ? PULSE.darkAdjust : PULSE.lightAdjust)

            const boneWidth = containerWidth > 0 ? (b.w / 100) * containerWidth : 100
            const useStagger = staggerMs > 0 && staggerAnims[i]

            return (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  left: `${b.x}%`,
                  top: b.y * scaleY,
                  width: `${b.w}%`,
                  height: b.h * scaleY,
                  borderRadius,
                  backgroundColor: boneColor,
                  overflow: 'hidden',
                  opacity: useStagger ? staggerAnims[i] : 1,
                }}
              >
                {animationStyle === 'pulse' && !b.c && (
                  <Animated.View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      backgroundColor: lighterColor,
                      opacity: pulseAnim,
                    }}
                  />
                )}
                {animationStyle === 'shimmer' && !b.c && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: boneWidth * NATIVE_SHIMMER.widthFraction,
                      backgroundColor: lighterColor,
                      opacity: NATIVE_SHIMMER.opacity,
                      transform: [{
                        translateX: shimmerAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [-boneWidth * NATIVE_SHIMMER.widthFraction, boneWidth, boneWidth],
                        }),
                      }],
                    }}
                  />
                )}
              </Animated.View>
            )
          })}
        </Animated.View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hidden: {
    opacity: 0,
  },
})
