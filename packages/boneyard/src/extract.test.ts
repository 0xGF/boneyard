import { describe, it, expect } from 'bun:test'
import { snapshotBones } from './extract.js'

// The test preload copies happy-dom Window props onto globalThis but skips
// ones that already exist there (like SyntaxError) — happy-dom's computed
// style engine needs it on the window instance itself.
;(globalThis as any).window.SyntaxError ??= SyntaxError

// happy-dom (preloaded) computes styles but returns zero rects, so each
// element gets an explicit getBoundingClientRect stub. Elements are located
// by walking .children — happy-dom's selector engine is not available here.

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

function stubRect(el: Element, r: Rect) {
  ;(el as any).getBoundingClientRect = () => ({
    ...r,
    right: r.left + r.width,
    bottom: r.top + r.height,
    x: r.left,
    y: r.top,
  })
}

function el(tag: string, display: string, children: Element[] = [], text?: string): Element {
  const node = document.createElement(tag)
  ;(node as any).style.display = display
  if (text) node.appendChild(document.createTextNode(text))
  for (const c of children) node.appendChild(c)
  return node
}

function mount(child: Element): HTMLElement {
  const root = document.createElement('div')
  root.appendChild(child)
  document.body.appendChild(root)
  stubRect(root, { left: 0, top: 0, width: 400, height: 300 })
  return root
}

const isContainer = (b: any) => b.c === true

describe('snapshotBones leafTags (#112)', () => {
  it('keeps a leaf tag holding only inline content as a single bone', () => {
    const strong = el('strong', 'inline', [], 'world')
    stubRect(strong, { left: 50, top: 0, width: 60, height: 24 })
    const p = el('p', 'block', [strong], 'Hello ')
    stubRect(p, { left: 0, top: 0, width: 400, height: 24 })
    const root = mount(p)

    const { bones } = snapshotBones(root)
    const leaves = bones.filter(b => !isContainer(b))
    expect(leaves.length).toBe(1)
    expect(leaves[0].h).toBe(24)
    document.body.removeChild(root)
  })

  it('recurses into a leaf tag that wraps block-level content', () => {
    const h3 = el('h3', 'block', [], 'Upper A')
    stubRect(h3, { left: 16, top: 16, width: 120, height: 24 })
    const p = el('p', 'block', [], '2 sections · 5 exercises')
    stubRect(p, { left: 16, top: 48, width: 220, height: 20 })
    const btn1 = el('button', 'inline-block', [], 'Edit')
    stubRect(btn1, { left: 16, top: 80, width: 80, height: 36 })
    const btn2 = el('button', 'inline-block', [], 'Start')
    stubRect(btn2, { left: 110, top: 80, width: 80, height: 36 })
    const footer = el('footer', 'block', [btn1, btn2])
    stubRect(footer, { left: 16, top: 80, width: 368, height: 40 })
    const article = el('article', 'block', [h3, p, footer])
    stubRect(article, { left: 0, top: 0, width: 400, height: 167 })
    const li = el('li', 'block', [article])
    stubRect(li, { left: 0, top: 0, width: 400, height: 167 })
    const ul = el('ul', 'block', [li])
    stubRect(ul, { left: 0, top: 0, width: 400, height: 167 })
    const root = mount(ul)

    const { bones } = snapshotBones(root)
    const leaves = bones.filter(b => !isContainer(b))
    // The li must not swallow the card: heading + copy + two buttons all emit.
    expect(leaves.length).toBe(4)
    // No leaf bone should be the full 167px slab of the li itself.
    expect(leaves.every(b => b.h < 100)).toBe(true)
    document.body.removeChild(root)
  })

  it('still treats an empty leaf tag as a leaf', () => {
    const li = el('li', 'block')
    stubRect(li, { left: 0, top: 0, width: 400, height: 20 })
    const root = mount(li)

    const { bones } = snapshotBones(root)
    const leaves = bones.filter(b => !isContainer(b))
    expect(leaves.length).toBe(1)
    document.body.removeChild(root)
  })

  it('applies the same inline-only rule to user-supplied leafTags', () => {
    const inner = el('div', 'block', [], 'Nested block')
    stubRect(inner, { left: 8, top: 8, width: 384, height: 20 })
    const section = el('section', 'block', [inner])
    stubRect(section, { left: 0, top: 0, width: 400, height: 60 })
    const root = mount(section)

    const { bones } = snapshotBones(root, 'component', { leafTags: ['section'] })
    const leaves = bones.filter(b => !isContainer(b))
    // section wraps a block div → recurse; the div (childless) is the leaf.
    expect(leaves.length).toBe(1)
    expect(leaves[0].h).toBe(20)
    document.body.removeChild(root)
  })
})
