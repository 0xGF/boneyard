import type { Plugin } from 'vite'

export interface BoneyardPluginOptions {
  /** Output directory for .bones.json files (default: './src/bones' or './bones') */
  out?: string
  /** Viewport widths to capture (default: [375, 768, 1280]) */
  breakpoints?: number[]
  /** Extra ms to wait after page load (default: 800) */
  wait?: number
  /** Framework for registry imports (default: auto-detected) */
  framework?: 'react' | 'vue' | 'svelte' | 'preact'
  /** Skip initial capture on server start (default: false) */
  skipInitial?: boolean
  /** Connect to existing Chrome via debug port instead of launching Playwright */
  cdp?: number
  /** Routes to capture skeletons from (default: ['/']). The plugin visits each route at every breakpoint. */
  routes?: string[]
}

export declare function boneyardPlugin(options?: BoneyardPluginOptions): Plugin
