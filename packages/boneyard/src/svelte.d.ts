import type { Component, Snippet } from 'svelte'
import type { ResponsiveBones, SkeletonResult, SnapshotConfig } from './types.js'

export type AnimationStyle = 'pulse' | 'shimmer' | 'solid' | boolean

export interface SkeletonProps {
  loading: boolean
  name?: string
  initialBones?: SkeletonResult | ResponsiveBones
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  class?: string
  className?: string
  fallback?: Snippet
  fixture?: Snippet
  children?: Snippet
  snapshotConfig?: SnapshotConfig
}

declare const Skeleton: Component<SkeletonProps>

export default Skeleton
export { registerBones } from './shared.js'
export function configureBoneyard(config: { color?: string; darkColor?: string; animate?: AnimationStyle }): void
