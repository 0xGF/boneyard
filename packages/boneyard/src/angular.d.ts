import type { ResponsiveBones, SkeletonResult, SnapshotConfig } from './types.js'

export type AnimationStyle = 'pulse' | 'shimmer' | 'solid' | boolean

export { registerBones } from './shared.js'
export function configureBoneyard(config: { color?: string; darkColor?: string; animate?: AnimationStyle }): void

export declare class SkeletonComponent {
  loading: boolean
  name?: string
  initialBones?: SkeletonResult | ResponsiveBones
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  cssClass?: string
  snapshotConfig?: SnapshotConfig
}
