import type { ResponsiveBones, SkeletonResult, SnapshotConfig } from './types.js'
import * as i0 from '@angular/core'

export type AnimationStyle = 'pulse' | 'shimmer' | 'solid' | boolean

export { registerBones } from './shared.js'
export function configureBoneyard(config: { color?: string; darkColor?: string; animate?: AnimationStyle; stagger?: number | boolean; transition?: number | boolean; boneClass?: string }): void

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

  static ɵfac: i0.ɵɵFactoryDeclaration<SkeletonComponent, never>
  static ɵcmp: i0.ɵɵComponentDeclaration<
    SkeletonComponent,
    'boneyard-skeleton',
    never,
    {
      'loading': { alias: 'loading'; required: false }
      'name': { alias: 'name'; required: false }
      'initialBones': { alias: 'initialBones'; required: false }
      'color': { alias: 'color'; required: false }
      'darkColor': { alias: 'darkColor'; required: false }
      'animate': { alias: 'animate'; required: false }
      'stagger': { alias: 'stagger'; required: false }
      'transition': { alias: 'transition'; required: false }
      'cssClass': { alias: 'cssClass'; required: false }
      'snapshotConfig': { alias: 'snapshotConfig'; required: false }
    },
    {},
    never,
    ['[fixture]', '[fallback]', '*'],
    true,
    never
  >
}
