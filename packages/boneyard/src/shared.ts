import { snapshotBones } from './extract.js'
import type { ResponsiveBones, SkeletonResult } from './types.js'

export type RegisteredBones = SkeletonResult | ResponsiveBones

const bonesRegistry = new Map<string, RegisteredBones>()

export function registerBones(map: Record<string, RegisteredBones>): void {
  for (const [name, bones] of Object.entries(map)) {
    bonesRegistry.set(name, bones)
  }
}

export function getRegisteredBones(name: string): RegisteredBones | undefined {
  return bonesRegistry.get(name)
}

export function ensureBuildSnapshotHook(): void {
  if (typeof window !== 'undefined' && (window as any).__BONEYARD_BUILD) {
    (window as any).__BONEYARD_SNAPSHOT = snapshotBones
  }
}

export function isBuildMode(): boolean {
  return typeof window !== 'undefined' && (window as any).__BONEYARD_BUILD === true
}

export function resolveResponsive(
  bones: RegisteredBones,
  width: number,
): SkeletonResult | null {
  if (!('breakpoints' in bones)) return bones
  const bps = Object.keys(bones.breakpoints).map(Number).sort((a, b) => a - b)
  if (bps.length === 0) return null
  const match = [...bps].reverse().find(bp => width >= bp) ?? bps[0]
  return bones.breakpoints[match] ?? null
}

const RGBA_REGEX = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/

export function adjustColor(color: string, amount: number): string {
  const rgbaMatch = color.match(RGBA_REGEX)
  if (rgbaMatch) {
    const [, r, g, b, a = '1'] = rgbaMatch
    const newAlpha = Math.min(1, parseFloat(a) + amount * 0.5)
    return `rgba(${r},${g},${b},${newAlpha.toFixed(3)})`
  }

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
