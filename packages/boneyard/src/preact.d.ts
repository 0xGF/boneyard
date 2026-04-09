import type { ComponentChildren } from 'preact'
import type { ResponsiveBones, SkeletonResult, SnapshotConfig } from './types.js'

export type AnimationStyle = 'pulse' | 'shimmer' | 'solid' | boolean

export { registerBones } from './shared.js'
export function configureBoneyard(config: {
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  boneClass?: string
}): void

export interface SkeletonProps {
  loading: boolean
  children: ComponentChildren
  name?: string
  initialBones?: SkeletonResult | ResponsiveBones
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  boneClass?: string
  className?: string
  fallback?: ComponentChildren
  fixture?: ComponentChildren
  snapshotConfig?: SnapshotConfig
}

export function Skeleton(props: SkeletonProps): ComponentChildren
