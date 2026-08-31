import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Skeleton, BoneSuspense, configureBoneyard } from './react.js'
import type { SkeletonResult } from './types.js'

// Client-rendered tests (happy-dom via preload). The preloaded
// ResizeObserver stub reports width 375 / height 400 asynchronously; a
// zero-height variant is swapped in for the collapse test (#110).

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
// The test preload copies happy-dom Window props onto globalThis but skips
// ones that already exist there (like SyntaxError) — happy-dom's selector
// engine needs it on the window instance itself.
;(globalThis as any).window.SyntaxError ??= SyntaxError

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const cardBones: SkeletonResult = {
  name: 'runtime-card',
  viewportWidth: 375,
  width: 375,
  height: 80,
  bones: [
    { x: 0, y: 0, w: 100, h: 20, r: 4 },
    { x: 0, y: 30, w: 60, h: 14, r: 4 },
  ],
}

let host: HTMLElement
let root: Root

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  // Reset global config between tests — configureBoneyard merges, so
  // explicitly clear the keys these tests set.
  configureBoneyard({ transition: undefined, stagger: undefined })
})

async function render(ui: any) {
  await act(async () => {
    root.render(ui)
    // Let the ResizeObserver stub fire so containerWidth resolves bones.
    await sleep(20)
  })
}

const overlay = () => host.querySelector('[data-boneyard-overlay]') as HTMLElement | null

describe('Skeleton transition (#109)', () => {
  it('reads transition from configureBoneyard when the prop is omitted', async () => {
    configureBoneyard({ transition: 100 })
    await render(
      <Skeleton name="runtime-card" loading={true} initialBones={cardBones}>
        <div>content</div>
      </Skeleton>,
    )
    expect(overlay()).not.toBeNull()

    await render(
      <Skeleton name="runtime-card" loading={false} initialBones={cardBones}>
        <div>content</div>
      </Skeleton>,
    )
    // Config-enabled transition: overlay is still mounted, fading out.
    const el = overlay()
    expect(el).not.toBeNull()
    expect(el!.style.opacity).toBe('0')
    expect(el!.style.transition).toContain('100ms')

    await act(async () => { await sleep(150) })
    expect(overlay()).toBeNull()
  })

  it('keeps the overlay mounted in the commit where loading flips (no remount)', async () => {
    await render(
      <Skeleton name="runtime-card" loading={true} transition={100} initialBones={cardBones}>
        <div>content</div>
      </Skeleton>,
    )
    const before = overlay()
    expect(before).not.toBeNull()
    expect(before!.style.opacity).toBe('1')

    await act(async () => {
      root.render(
        <Skeleton name="runtime-card" loading={false} transition={100} initialBones={cardBones}>
          <div>content</div>
        </Skeleton>,
      )
    })
    // Same element instance — a remount would have nothing to fade from.
    expect(overlay()).toBe(before)
    expect(before!.style.opacity).toBe('0')
    // Flush the transition timer inside act so it doesn't fire mid-teardown.
    await act(async () => { await sleep(150) })
  })

  it('overlay never intercepts pointer events', async () => {
    await render(
      <Skeleton name="runtime-card" loading={true} transition={100} initialBones={cardBones}>
        <div>content</div>
      </Skeleton>,
    )
    expect(overlay()!.style.pointerEvents).toBe('none')
    await act(async () => { await sleep(150) })
  })

  it('hides the skeleton immediately when transition is unset', async () => {
    await render(
      <Skeleton name="runtime-card" loading={true} initialBones={cardBones}>
        <div>content</div>
      </Skeleton>,
    )
    expect(overlay()).not.toBeNull()
    await render(
      <Skeleton name="runtime-card" loading={false} initialBones={cardBones}>
        <div>content</div>
      </Skeleton>,
    )
    expect(overlay()).toBeNull()
  })

  it('reads stagger from configureBoneyard when the prop is omitted', async () => {
    configureBoneyard({ stagger: true })
    await render(
      <Skeleton name="runtime-card" loading={true} initialBones={cardBones}>
        <div>content</div>
      </Skeleton>,
    )
    const bone = host.querySelector('[data-boneyard-bone]') as HTMLElement
    expect(bone.style.animation).toContain('by-')
  })
})

describe('Skeleton container height (#110)', () => {
  const zeroHeightRO = class {
    cb: any
    constructor(cb: any) { this.cb = cb }
    observe() { setTimeout(() => this.cb([{ contentRect: { width: 375, height: 0 } }]), 0) }
    unobserve() {}
    disconnect() {}
  }
  let realRO: any

  beforeEach(() => {
    realRO = (globalThis as any).ResizeObserver
    ;(globalThis as any).ResizeObserver = zeroHeightRO
  })
  afterEach(() => {
    ;(globalThis as any).ResizeObserver = realRO
  })

  it('reserves the captured bones height when children render nothing', async () => {
    await render(
      <Skeleton name="runtime-card" loading={true} initialBones={cardBones}>
        {null}
      </Skeleton>,
    )
    const container = host.firstElementChild as HTMLElement
    expect(overlay()).not.toBeNull()
    expect(container.style.minHeight).toBe('80px')
  })

  it('drops the reserved height once loading ends', async () => {
    await render(
      <Skeleton name="runtime-card" loading={true} initialBones={cardBones}>
        {null}
      </Skeleton>,
    )
    await render(
      <Skeleton name="runtime-card" loading={false} initialBones={cardBones}>
        <div>loaded</div>
      </Skeleton>,
    )
    const container = host.firstElementChild as HTMLElement
    expect(container.style.minHeight).toBe('')
  })

  it('BoneSuspense fallback skeleton is not collapsed', async () => {
    function Suspends(): never {
      throw new Promise<void>(() => {})
    }
    await render(
      <BoneSuspense name="runtime-card" initialBones={cardBones}>
        <Suspends />
      </BoneSuspense>,
    )
    const container = host.querySelector('[aria-busy]') as HTMLElement
    expect(container).not.toBeNull()
    expect(container.style.minHeight).toBe('80px')
    expect(overlay()).not.toBeNull()
  })
})
