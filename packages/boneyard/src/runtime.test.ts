import { describe, it, expect } from 'bun:test'
import { createCanvas } from 'canvas'
import { renderBones } from './runtime.js'
import { computeLayout } from './layout.js'
import type { SkeletonResult, SkeletonDescriptor } from './types.js'

// Polyfill OffscreenCanvas for pretext
if (typeof globalThis.OffscreenCanvas === 'undefined') {
  ;(globalThis as any).OffscreenCanvas = class OffscreenCanvas {
    private _canvas: any
    constructor(w: number, h: number) { this._canvas = createCanvas(w, h) }
    getContext(type: string) { return this._canvas.getContext(type) }
  }
}

// ── renderBones ──

describe('renderBones', () => {
  it('renders empty skeleton', () => {
    const skel: SkeletonResult = { name: 'test', viewportWidth: 100, width: 100, height: 50, bones: [] }
    const html = renderBones(skel)
    expect(html).toContain('height:50px')
    expect(html).not.toContain('left:')
  })

  it('renders bones with correct positions', () => {
    const skel: SkeletonResult = {
      name: 'test', viewportWidth: 400, width: 400, height: 200,
      bones: [
        { x: 0, y: 0, w: 100, h: 180, r: 10 },
        { x: 0, y: 190, w: 50, h: 14, r: 4 },
      ],
    }
    const html = renderBones(skel)
    expect(html).toContain('left:0%;top:0px;width:100%;height:180px')
    expect(html).toContain('left:0%;top:190px;width:50%;height:14px')
  })

  it('handles circle radius', () => {
    const skel: SkeletonResult = {
      name: 'avatar', viewportWidth: 40, width: 40, height: 40,
      bones: [{ x: 0, y: 0, w: 40, h: 40, r: '50%' }],
    }
    expect(renderBones(skel)).toContain('border-radius:50%')
  })

  it('includes pulse animation by default', () => {
    const skel: SkeletonResult = {
      name: 'x', viewportWidth: 100, width: 100, height: 100,
      bones: [{ x: 0, y: 0, w: 100, h: 100, r: 4 }],
    }
    const html = renderBones(skel)
    expect(html).toContain('boneyard-pulse')
    expect(html).toContain('background-color:#e0e0e0')
  })

  it('no animation when disabled', () => {
    const skel: SkeletonResult = {
      name: 'x', viewportWidth: 100, width: 100, height: 100,
      bones: [{ x: 0, y: 0, w: 100, h: 100, r: 4 }],
    }
    const html = renderBones(skel, '#e0e0e0', false)
    expect(html).not.toContain('animation')
  })

  it('respects custom color', () => {
    const skel: SkeletonResult = {
      name: 'x', viewportWidth: 50, width: 50, height: 50,
      bones: [{ x: 0, y: 0, w: 50, h: 50, r: 0 }],
    }
    expect(renderBones(skel, '#ff0000', false)).toContain('#ff0000')
  })

  it('handles many bones', () => {
    const bones = Array.from({ length: 50 }, (_, i) => ({
      x: 0, y: i * 20, w: 300, h: 14, r: 4,
    }))
    const skel: SkeletonResult = { name: 'list', viewportWidth: 300, width: 300, height: 1000, bones }
    const matches = renderBones(skel).match(/class="boneyard-bone" style=/g)
    expect(matches).toHaveLength(50)
  })
})

// ── computeLayout with SkeletonDescriptor ──

describe('computeLayout', () => {
  it('renders a simple leaf with height', () => {
    const desc: SkeletonDescriptor = { height: 100 }
    const result = computeLayout(desc, 400, 'test')
    expect(result.bones).toHaveLength(1)
    expect(result.bones[0].w).toBe(400)
    expect(result.bones[0].h).toBe(100)
    expect(result.name).toBe('test')
    expect(result.viewportWidth).toBe(400)
  })

  it('renders leaf with explicit width', () => {
    const desc: SkeletonDescriptor = { width: 200, height: 100 }
    const result = computeLayout(desc, 400, 'test')
    expect(result.bones[0].w).toBe(200)
    expect(result.bones[0].h).toBe(100)
  })

  it('renders aspect ratio', () => {
    const desc: SkeletonDescriptor = { aspectRatio: 16 / 9 }
    const result = computeLayout(desc, 320, 'test')
    expect(result.bones).toHaveLength(1)
    expect(result.bones[0].w).toBe(320)
    expect(result.bones[0].h).toBe(180)
  })

  it('uses pretext for text measurement', () => {
    const desc: SkeletonDescriptor = {
      text: 'Hello world, this is a longer text that should wrap at narrow widths and produce a taller bone.',
      font: '16px sans-serif',
      lineHeight: 20,
    }
    const wide = computeLayout(desc, 800, 'test')
    const narrow = computeLayout(desc, 200, 'test')
    expect(wide.bones).toHaveLength(1)
    expect(narrow.bones).toHaveLength(1)
    expect(narrow.bones[0].h).toBeGreaterThan(wide.bones[0].h)
  })

  it('flex column with gap', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'column', gap: 10,
      children: [
        { height: 40 },
        { height: 40 },
        { height: 40 },
      ],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones).toHaveLength(3)
    expect(result.bones[0].y).toBe(0)
    expect(result.bones[1].y).toBe(50)
    expect(result.bones[2].y).toBe(100)
  })

  it('flex row distributing width', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'row', gap: 10,
      children: [
        { width: 40, height: 40, borderRadius: '50%' },
        { text: 'Author Name', font: '16px sans-serif', lineHeight: 20 },
      ],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones.length).toBeGreaterThanOrEqual(2)
    expect(result.bones[0].x).toBe(0)
    expect(result.bones[0].w).toBe(40)
    expect(result.bones[1].x).toBe(50)
  })

  it('nested flex with padding (number shorthand)', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'column', padding: 20, gap: 12,
      children: [
        { aspectRatio: 16 / 9 },
        { text: 'Card Title', font: '700 18px sans-serif', lineHeight: 25 },
      ],
    }
    const result = computeLayout(desc, 400, 'card')
    expect(result.bones.length).toBeGreaterThanOrEqual(2)
    const imgBone = result.bones[0]
    expect(imgBone.x).toBe(20)
    expect(imgBone.w).toBe(360)
    expect(imgBone.h).toBe(202.5)
    const titleBone = result.bones[1]
    expect(titleBone.x).toBe(20)
    expect(titleBone.y).toBeGreaterThan(imgBone.y + imgBone.h)
  })

  it('different heights for different widths', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'column', gap: 10,
      children: [{
        text: 'This is a paragraph of text that will wrap differently at different container widths, demonstrating how pretext recalculates layout without re-rendering.',
        font: '16px sans-serif', lineHeight: 22,
      }],
    }
    const desktop = computeLayout(desc, 800, 'test')
    const mobile = computeLayout(desc, 300, 'test')
    expect(mobile.height).toBeGreaterThan(desktop.height)
  })

  it('empty container produces no bones', () => {
    const desc: SkeletonDescriptor = { display: 'flex', flexDirection: 'column', children: [] }
    const result = computeLayout(desc, 400, 'test')
    expect(result.bones).toHaveLength(0)
    expect(result.height).toBe(0)
  })

  it('leaf: true forces a bone', () => {
    const desc: SkeletonDescriptor = { leaf: true, height: 44, borderRadius: 8 }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones).toHaveLength(1)
    expect(result.bones[0].r).toBe(8)
  })

  it('circle avatar in flex row with alignment', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center',
      children: [
        { width: 40, height: 40, borderRadius: '50%' },
        {
          display: 'flex', flexDirection: 'column', gap: 4,
          children: [
            { text: 'John Doe', font: '600 14px sans-serif', lineHeight: 18 },
            { text: '@johndoe', font: '12px sans-serif', lineHeight: 16 },
          ],
        },
      ],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones.length).toBeGreaterThanOrEqual(3)
    expect(result.bones[0].r).toBe('50%')
    expect(result.bones[0].w).toBe(40)
    expect(result.bones[1].x).toBe(50)
  })

  it('default border radius is 8', () => {
    const desc: SkeletonDescriptor = { height: 20 }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[0].r).toBe(8)
  })

  it('padding as number applies to all sides', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'column', padding: 16,
      children: [{ height: 50 }],
    }
    const result = computeLayout(desc, 200, 'test')
    expect(result.bones[0].x).toBe(16)
    expect(result.bones[0].y).toBe(16)
    expect(result.bones[0].w).toBe(168) // 200 - 32
  })
})

// ── Edge cases ──

describe('edge cases', () => {
  it('zero aspect ratio falls back to default height', () => {
    const desc: SkeletonDescriptor = { aspectRatio: 0 }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[0].h).toBe(20)
    expect(isFinite(result.bones[0].h)).toBe(true)
  })

  it('Infinity aspect ratio falls back to default height', () => {
    const desc: SkeletonDescriptor = { aspectRatio: Infinity }
    const result = computeLayout(desc, 300, 'test')
    expect(isFinite(result.bones[0].h)).toBe(true)
  })

  it('NaN aspect ratio falls back to default height', () => {
    const desc: SkeletonDescriptor = { aspectRatio: NaN }
    const result = computeLayout(desc, 300, 'test')
    expect(isFinite(result.bones[0].h)).toBe(true)
  })

  it('padding larger than height', () => {
    const desc: SkeletonDescriptor = {
      height: 10, padding: { top: 20, right: 0, bottom: 20, left: 0 },
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[0].h).toBe(40) // max(0, 10-40) + 40 = 40
    expect(result.bones[0].h).toBeGreaterThanOrEqual(0)
  })

  it('space-between justify-content', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
      children: [
        { width: 50, height: 30 },
        { width: 50, height: 30 },
      ],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[0].x).toBe(0)
    expect(result.bones[1].x).toBe(250)
  })

  it('flex-end justify-content', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'row', justifyContent: 'flex-end',
      children: [{ width: 50, height: 30 }],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[0].x).toBe(250)
  })

  it('center justify-content', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'row', justifyContent: 'center',
      children: [{ width: 100, height: 30 }],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[0].x).toBe(100)
  })

  it('align-items center', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      children: [
        { width: 50, height: 100 },
        { width: 50, height: 40 },
      ],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[0].y).toBe(0)
    expect(result.bones[1].y).toBe(30)
  })

  it('align-items flex-end', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'row', alignItems: 'flex-end',
      children: [
        { width: 50, height: 100 },
        { width: 50, height: 40 },
      ],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[1].y).toBe(60)
  })

  it('maxWidth clamping', () => {
    const desc: SkeletonDescriptor = { height: 100, maxWidth: 200 }
    const result = computeLayout(desc, 400, 'test')
    expect(result.bones[0].w).toBe(200)
  })

  it('margin offsets position', () => {
    const desc: SkeletonDescriptor = {
      children: [
        { height: 40, margin: { top: 10, right: 0, bottom: 10, left: 0 } },
        { height: 40 },
      ],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones[0].y).toBe(10)
    expect(result.bones[1].y).toBe(60)
  })

  it('deeply nested structure produces finite bones', () => {
    const desc: SkeletonDescriptor = {
      display: 'flex', flexDirection: 'column', padding: 10,
      children: [{
        display: 'flex', flexDirection: 'row', gap: 8,
        children: [
          { width: 32, height: 32, borderRadius: '50%' },
          {
            display: 'flex', flexDirection: 'column', gap: 4,
            children: [
              { text: 'Deep nested text', font: '14px sans-serif', lineHeight: 18 },
              {
                display: 'flex', flexDirection: 'row', gap: 4,
                children: [
                  { text: 'Tag 1', font: '12px sans-serif', lineHeight: 16 },
                  { text: 'Tag 2', font: '12px sans-serif', lineHeight: 16 },
                ],
              },
            ],
          },
        ],
      }],
    }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones.length).toBeGreaterThanOrEqual(4)
    for (const b of result.bones) {
      expect(isFinite(b.x)).toBe(true)
      expect(isFinite(b.y)).toBe(true)
      expect(b.w).toBeGreaterThan(0)
      expect(b.h).toBeGreaterThan(0)
    }
  })

  it('no children and no leaf properties produces no bone', () => {
    const desc: SkeletonDescriptor = { display: 'block' }
    const result = computeLayout(desc, 300, 'test')
    expect(result.bones).toHaveLength(0)
  })
})
