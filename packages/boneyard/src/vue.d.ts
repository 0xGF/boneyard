import type { DefineComponent } from 'vue'
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
  snapshotConfig?: SnapshotConfig
}

declare const Skeleton: DefineComponent<SkeletonProps>

export default Skeleton
export { registerBones } from './shared.js'
export function configureBoneyard(config: { color?: string; darkColor?: string; animate?: AnimationStyle }): void
