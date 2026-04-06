/**
 * BoneScan — Dev-only component that scans a React Native view hierarchy
 * and generates bone data from the actual native layout.
 *
 * Uses React fiber internals to walk the component tree, then calls
 * measureLayout() on each host view to capture pixel-perfect positions.
 *
 * Works with `npx boneyard-js scan` — bones are sent to the CLI automatically.
 *
 * @example
 * ```tsx
 * import { BoneScan } from 'boneyard-js/native-scan'
 *
 * // Dev screen — wrap each component you want to generate bones for
 * <BoneScan name="profile-card">
 *   <ProfileCard user={mockUser} />
 * </BoneScan>
 * ```
 *
 * Then run: npx boneyard-js scan --out ./bones
 */
import {
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  View,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import type { Bone, SkeletonResult, CompactBone, ResponsiveBones } from './types.js'

// ── CLI connection ───────────────────────────────────────────────────────────

/**
 * Scan server URLs to try. Order: Metro host (physical device), Android
 * emulator bridge, localhost (simulator).
 */
function buildScanUrls(): string[] {
  const urls: string[] = []

  // Expo sets the bundler URL in __DEV__ — extract the host IP for physical devices
  // @ts-ignore — Expo injects this at build time
  const scriptURL: string | undefined = typeof globalThis?.nativeCallSyncHook !== 'undefined'
    ? undefined // Hermes — no sourceURL
    // @ts-ignore
    : (typeof globalThis?.__fbBatchedBridge?.getCallableModule === 'function' ? undefined : undefined)

  // Try common patterns for physical device connectivity
  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:9999') // Android emulator → host
  }
  urls.push('http://localhost:9999')

  return urls
}

const SCAN_URLS = buildScanUrls()

let _scanUrl: string | null | undefined = undefined // undefined = not checked yet

async function getScanUrl(): Promise<string | null> {
  if (_scanUrl !== undefined) return _scanUrl
  for (const url of SCAN_URLS) {
    try {
      const res = await fetch(`${url}/ping`, { method: 'GET' })
      const data = await res.json()
      if (data?.boneyard) {
        _scanUrl = url
        console.log(`[BoneScan] Connected to CLI at ${url}`)
        return _scanUrl
      }
    } catch {}
  }
  _scanUrl = null
  return null
}

async function sendToCLI(name: string, result: SkeletonResult): Promise<void> {
  const url = await getScanUrl()
  if (!url) return
  try {
    await fetch(`${url}/bones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, result }),
    })
  } catch {}
}

async function sendResponsiveToCLI(name: string, responsive: ResponsiveBones): Promise<void> {
  const url = await getScanUrl()
  if (!url) return
  try {
    await fetch(`${url}/bones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, responsive }),
    })
  } catch {}
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface BoneScanProps {
  /** Name for this skeleton (used in the output JSON) */
  name: string
  /** The component to scan */
  children: ReactNode
  /** Called with the generated SkeletonResult after scanning */
  onCapture?: (result: SkeletonResult) => void
  /**
   * Delay in ms before measuring (lets animations/layout settle).
   * Default: 500
   */
  delay?: number
  /**
   * Use compact tuple format [x,y,w,h,r,c?] instead of objects.
   * Default: true (matches v1.6 CLI output)
   */
  compact?: boolean
}

// ── Fiber tree walker ────────────────────────────────────────────────────────

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

function getFiber(ref: any): FiberNode | null {
  return ref?._reactInternals ?? ref?._reactInternalInstance ?? null
}

interface ScannedView {
  stateNode: any
  style: Record<string, any>
  isLeaf: boolean
  isContainer: boolean
  type: string
}

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
        if (childFiber.child) {
          const inner = findFirstHostChild(childFiber)
          if (inner) { hasHostChildren = true; break }
        }
        childFiber = childFiber.sibling
      }

      const isLeaf = LEAF_TYPES.has(typeName) || !hasHostChildren
      const hasVisualSurface = hasBackground(flatStyle) || hasBorder(flatStyle)

      if (isLeaf || hasVisualSurface) {
        views.push({
          stateNode: node.stateNode,
          style: flatStyle,
          isLeaf,
          isContainer: !isLeaf && hasVisualSurface,
          type: typeName,
        })
      }
    }

    walk(node.child)
    walk(node.sibling)
  }

  walk(fiber.child)
  return views
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

// ── Style helpers ────────────────────────────────────────────────────────────

function hasBackground(style: Record<string, any>): boolean {
  const bg = style.backgroundColor
  return !!bg && bg !== 'transparent' && bg !== 'rgba(0,0,0,0)'
}

function hasBorder(style: Record<string, any>): boolean {
  return (style.borderWidth ?? style.borderTopWidth ?? 0) > 0
}

function extractBorderRadius(style: Record<string, any>): number | string {
  const tl = style.borderTopLeftRadius
  const tr = style.borderTopRightRadius
  const br = style.borderBottomRightRadius
  const bl = style.borderBottomLeftRadius

  if (tl != null || tr != null || br != null || bl != null) {
    const vals = [tl ?? 0, tr ?? 0, br ?? 0, bl ?? 0]
    if (vals.every(v => v === vals[0])) return vals[0] || 0
    return `${vals[0]}px ${vals[1]}px ${vals[2]}px ${vals[3]}px`
  }

  const r = style.borderRadius
  if (r == null) return 8
  if (typeof r === 'string' && r.includes('%')) return r
  return typeof r === 'number' ? r : parseFloat(r) || 8
}

// ── Measurement ──────────────────────────────────────────────────────────────

function measureView(
  view: any,
  relativeTo: any,
): Promise<{ x: number; y: number; w: number; h: number } | null> {
  return new Promise((resolve) => {
    try {
      view.measureLayout(
        relativeTo,
        (x: number, y: number, w: number, h: number) => resolve({ x, y, w, h }),
        () => resolve(null),
      )
    } catch { resolve(null) }
  })
}

function measureSelf(view: any): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    try {
      view.measure((_x: number, _y: number, w: number, h: number) => resolve({ w, h }))
    } catch { resolve(null) }
  })
}

// ── BoneScan component ───────────────────────────────────────────────────────

export function BoneScan({
  name,
  children,
  onCapture,
  delay = 500,
  compact = true,
}: BoneScanProps) {
  const containerRef = useRef<View>(null)
  const { width: screenWidth } = useWindowDimensions()
  const hasScanned = useRef(false)

  const scan = useCallback(async () => {
    if (typeof __DEV__ !== 'undefined' && !__DEV__) return
    if (hasScanned.current) return
    const container = containerRef.current
    if (!container) return

    const containerSize = await measureSelf(container)
    if (!containerSize || containerSize.w < 1 || containerSize.h < 1) return

    hasScanned.current = true
    const containerW = containerSize.w
    const containerH = containerSize.h

    const fiber = getFiber(container)
    if (!fiber) {
      console.warn('[BoneScan] Could not access React fiber tree. Requires dev mode.')
      return
    }

    const scannedViews = collectHostViews(fiber)
    const bones: Bone[] = []

    for (const sv of scannedViews) {
      const layout = await measureView(sv.stateNode, container)
      if (!layout || layout.w < 1 || layout.h < 1) continue

      const bone: Bone = {
        x: containerW > 0 ? +((layout.x / containerW) * 100).toFixed(4) : 0,
        y: Math.round(layout.y),
        w: containerW > 0 ? +((layout.w / containerW) * 100).toFixed(4) : 0,
        h: Math.round(layout.h),
        r: extractBorderRadius(sv.style),
      }
      if (sv.isContainer) bone.c = true
      bones.push(bone)
    }

    const finalBones = compact
      ? bones.map(b => {
          const arr: any[] = [b.x, b.y, b.w, b.h, b.r]
          if (b.c) arr.push(true)
          return arr
        })
      : bones

    const result: SkeletonResult = {
      name,
      viewportWidth: Math.round(screenWidth),
      width: Math.round(containerW),
      height: Math.round(containerH),
      bones: finalBones as any,
    }

    console.log(`[BoneScan] "${name}" — ${bones.length} bones`)

    // Auto-send to CLI
    await sendToCLI(name, result)

    onCapture?.(result)
  }, [name, screenWidth, onCapture, compact])

  useEffect(() => {
    const timer = setTimeout(scan, delay)
    return () => clearTimeout(timer)
  }, [scan, delay])

  return (
    <View ref={containerRef} collapsable={false}>
      {children}
    </View>
  )
}

/**
 * Multi-breakpoint scan — renders at each width and captures bones.
 *
 * @example
 * ```tsx
 * <BoneScanResponsive name="dashboard" breakpoints={[375, 768, 1280]}>
 *   <Dashboard />
 * </BoneScanResponsive>
 * ```
 */
export function BoneScanResponsive({
  name,
  children,
  breakpoints: bps = [375, 768, 1280],
  onCapture,
  delay = 500,
  compact = true,
}: {
  name: string
  children: ReactNode
  breakpoints?: number[]
  onCapture?: (result: ResponsiveBones) => void
  delay?: number
  compact?: boolean
}) {
  const collected = useRef<Record<number, SkeletonResult>>({})
  const count = useRef(0)

  const handleCapture = useCallback((bp: number) => (result: SkeletonResult) => {
    collected.current[bp] = result
    count.current++

    if (count.current === bps.length) {
      const responsive: ResponsiveBones = { breakpoints: collected.current }
      console.log(`[BoneScan] "${name}" — ${bps.length} breakpoints captured`)
      sendResponsiveToCLI(name, responsive)
      onCapture?.(responsive)
    }
  }, [name, bps.length, onCapture])

  return (
    <>
      {bps.map((bp) => (
        <View key={bp} style={{ width: bp, overflow: 'hidden' }}>
          <BoneScan
            name={name}
            delay={delay}
            compact={compact}
            onCapture={handleCapture(bp)}
          >
            {children}
          </BoneScan>
        </View>
      ))}
    </>
  )
}
