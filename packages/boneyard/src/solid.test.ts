import { describe, expect, it } from 'bun:test'
import { Window } from 'happy-dom'
import { createComponent, createSignal, flush } from 'solid-js'
import type { Component } from 'solid-js'
import type { ResponsiveBones, SkeletonResult } from './types.js'

const dom = new Window()
const testWindow = dom as unknown as Window & typeof globalThis
Object.assign(globalThis, {
  window: testWindow,
  document: testWindow.document,
  Node: testWindow.Node,
  HTMLElement: testWindow.HTMLElement,
})
;(testWindow as any).SyntaxError = SyntaxError
testWindow.innerWidth = 800

class TestResizeObserver {
  static instances: TestResizeObserver[] = []
  observed = false
  disconnected = false
  constructor(private readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this)
  }
  observe() {
    this.observed = true
  }
  disconnect() {
    this.disconnected = true
  }
  trigger(width: number, height = 0) {
    this.callback([
      { contentRect: { width, height } } as ResizeObserverEntry,
    ], this as unknown as ResizeObserver)
  }
}

globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver

const [{ render }, { Skeleton, SkeletonView }, { registerBones }] = await Promise.all([
  import('@solidjs/web'),
  import('../dist/solid.js'),
  import('../dist/shared.js'),
])

const cardBones: SkeletonResult = {
  name: 'solid-card',
  viewportWidth: 375,
  width: 375,
  height: 80,
  bones: [
    [0, 0, 100, 20, 4],
    [0, 30, 60, 14, 4],
  ],
}

const responsiveBones: ResponsiveBones = {
  breakpoints: {
    375: cardBones,
    768: { ...cardBones, viewportWidth: 768, width: 768, height: 120 },
  },
}

function element(tag = 'div', text = 'content') {
  const el = document.createElement(tag)
  el.textContent = text
  return el
}

function mount(Component: Component<any>, props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const dispose = render(() => createComponent(Component, props), host)
  return { host, dispose }
}

function cleanup(host: HTMLElement, dispose: () => void) {
  dispose()
  host.remove()
  delete (globalThis.window as any).__BONEYARD_BUILD
}

describe('Solid adapter', () => {
  it('renders an accessible loading overlay', () => {
    const { host, dispose } = mount(Skeleton, {
      loading: true,
      initialBones: cardBones,
      children: element('button', 'Save'),
    })
    try {
      expect(host.querySelector('[aria-busy="true"]')).not.toBeNull()
      expect(host.querySelector('[data-boneyard-overlay]')).not.toBeNull()
      expect(host.querySelectorAll('[data-boneyard-bone]')).toHaveLength(2)
      expect(host.querySelector('[data-boneyard-overlay]')?.getAttribute('aria-hidden')).toBe('true')
      expect((host.querySelector('[data-boneyard-overlay]') as HTMLElement).style.pointerEvents).toBe('none')
    } finally {
      cleanup(host, dispose)
    }
  })

  it('uses the shared registry when initialBones is omitted', () => {
    const name = 'solid-registry-card'
    registerBones({ [name]: { ...cardBones, name } })
    const { host, dispose } = mount(Skeleton, {
      name,
      loading: true,
      children: element(),
    })
    try {
      expect(host.querySelector('[data-boneyard-overlay]')).not.toBeNull()
    } finally {
      cleanup(host, dispose)
    }
  })

  it('renders fixture only in build mode', () => {
    ;(globalThis.window as any).__BONEYARD_BUILD = true
    const { host, dispose } = mount(Skeleton, {
      name: 'solid-build',
      loading: true,
      fixture: element('div', 'fixture'),
      children: element('div', 'real'),
    })
    try {
      expect(host.querySelector('[data-boneyard="solid-build"]')).not.toBeNull()
      expect(host.textContent).toContain('fixture')
      expect(host.textContent).not.toContain('real')
    } finally {
      cleanup(host, dispose)
    }
  })

  it('reacts to loading changes without replacing the overlay', () => {
    const [loading, setLoading] = createSignal(true)
    const props = {
      get loading() {
        return loading()
      },
      transition: 50,
      initialBones: cardBones,
      children: element(),
    }
    const { host, dispose } = mount(Skeleton, props)
    try {
      const before = host.querySelector('[data-boneyard-overlay]')
      expect(before).not.toBeNull()

      setLoading(false)
      flush()
      flush()
      expect(host.querySelector('[data-boneyard-overlay]')).toBe(before)
      expect((before as HTMLElement).style.opacity).toBe('0')
    } finally {
      cleanup(host, dispose)
    }
  })

  it('selects responsive bones from container width and disconnects on dispose', () => {
    const { host, dispose } = mount(Skeleton, {
      name: 'responsive',
      loading: true,
      initialBones: responsiveBones,
      children: element(),
    })
    try {
      const observer = TestResizeObserver.instances.at(-1)!
      expect(observer.observed).toBe(true)

      observer.trigger(800)
      flush()
      expect((host.querySelector('[data-boneyard="responsive"]') as HTMLElement).style.minHeight).toBe('120px')

      dispose()
      expect(observer.disconnected).toBe(true)
    } finally {
      host.remove()
    }
  })

  it('renders SkeletonView without loading state', () => {
    const { host, dispose } = mount(SkeletonView, {
      initialBones: responsiveBones,
      animate: 'solid',
    })
    try {
      expect(host.querySelector('[aria-busy]')).toBeNull()
      expect(host.querySelectorAll('[data-boneyard-bone]')).toHaveLength(2)
    } finally {
      cleanup(host, dispose)
    }
  })

  it('makes reduced motion visible and non-animated', () => {
    const { host, dispose } = mount(Skeleton, {
      loading: true,
      initialBones: cardBones,
      animate: 'shimmer',
      stagger: true,
      children: element(),
    })
    try {
      const styles = [...host.querySelectorAll('style')].map(style => style.textContent).join(' ')
      expect(styles).toContain('opacity:1!important')
      expect(styles).toContain('background-image:none!important')
    } finally {
      cleanup(host, dispose)
    }
  })
})
