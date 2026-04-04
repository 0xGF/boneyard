/**
 * Runtime — renders skeleton bones to HTML.
 *
 * Usage:
 *   import { computeLayout, renderBones } from 'boneyard-js'
 *
 *   const skeleton = computeLayout(myDescriptor, containerWidth)
 *   element.innerHTML = renderBones(skeleton)
 */

import { normalizeBone } from './types.js'
import type { AnyBone, SkeletonResult } from './types.js'

/** Mix a color toward white by `amount` (0–1). Supports hex and rgba(). */
function lightenColor(color: string, amount: number): string {
  // Handle rgba/rgb
  const rgbaMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (rgbaMatch) {
    const r = Math.round(parseFloat(rgbaMatch[1]) + (255 - parseFloat(rgbaMatch[1])) * amount)
    const g = Math.round(parseFloat(rgbaMatch[2]) + (255 - parseFloat(rgbaMatch[2])) * amount)
    const b = Math.round(parseFloat(rgbaMatch[3]) + (255 - parseFloat(rgbaMatch[3])) * amount)
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
    return `rgba(${r},${g},${b},${a})`
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

  // Fallback: return original color (animation still works, just no lightening)
  return color
}

/**
 * Render bones to an HTML string.
 * Use for SSR, innerHTML, or any HTML-based rendering.
 */
export function renderBones(
  skel: SkeletonResult,
  color?: string,
  animate?: boolean,
): string {
  const c = color ?? '#e0e0e0'
  const shouldAnimate = animate !== false
  const lighter = lightenColor(c, 0.3)

  const keyframes = shouldAnimate
    ? `<style>.boneyard-bone{animation:boneyard-pulse 1.8s ease-in-out infinite}@keyframes boneyard-pulse{0%,100%{background-color:${c}}50%{background-color:${lighter}}}</style>`
    : ''

  let html = `${keyframes}<div class="boneyard" style="position:relative;width:100%;height:${skel.height}px">`

  for (const raw of skel.bones) {
    const b = normalizeBone(raw as AnyBone)
    const radius = typeof b.r === 'string' ? b.r : `${b.r}px`
    html += `<div class="boneyard-bone" style="position:absolute;left:${b.x}%;top:${b.y}px;width:${b.w}%;height:${b.h}px;border-radius:${radius};background-color:${c}"></div>`
  }

  html += '</div>'
  return html
}
