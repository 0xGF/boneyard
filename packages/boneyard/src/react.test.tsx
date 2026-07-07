import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { renderToString } from 'react-dom/server'
import { Skeleton, BoneSuspense } from './react.js'
import { registerBones } from './shared.js'
import type { SkeletonResult } from './types.js'

// ── Helpers ────────────────────────────────────────────────────────────────

function setBuildMode(on: boolean) {
  const w = ((globalThis as any).window ??= {})
  if (on) w.__BONEYARD_BUILD = true
  else delete w.__BONEYARD_BUILD
}

function SuspendingChild(): never {
  throw new Promise<void>(() => {})
}

function ResolvedCard() {
  return <div className="resolved-card">Real Data</div>
}

const userCardBones: SkeletonResult = {
  name: 'user-card',
  viewportWidth: 375,
  width: 375,
  height: 80,
  bones: [
    { x: 0, y: 0, w: 100, h: 20, r: 4 },
    { x: 0, y: 30, w: 60, h: 14, r: 4 },
  ],
}

// ── Skeleton smoke tests in build mode ─────────────────────────────────────

describe('Skeleton (build mode)', () => {
  beforeEach(() => setBuildMode(true))
  afterEach(() => setBuildMode(false))

  it('emits data-boneyard wrapper around children for CLI capture', () => {
    const html = renderToString(
      <Skeleton name="card" loading={true}>
        <div className="real-content">Hello</div>
      </Skeleton>,
    )
    expect(html).toContain('data-boneyard="card"')
    expect(html).toContain('real-content')
  })

  it('prefers fixture over children when both are provided', () => {
    const html = renderToString(
      <Skeleton
        name="card"
        loading={true}
        fixture={<div className="my-fixture">Fixture</div>}
      >
        <div className="real-content">Hello</div>
      </Skeleton>,
    )
    expect(html).toContain('my-fixture')
    expect(html).not.toContain('real-content')
  })
})

// ── Runtime accessibility ──────────────────────────────────────────────────

describe('Skeleton (runtime a11y)', () => {
  beforeEach(() => setBuildMode(false))

  it('sets aria-busy on the container while loading', () => {
    const html = renderToString(
      <Skeleton name="user-card" loading={true} initialBones={userCardBones}>
        <div className="real-content">Hello</div>
      </Skeleton>,
    )
    expect(html).toContain('aria-busy="true"')
  })

  it('omits aria-busy when not loading', () => {
    const html = renderToString(
      <Skeleton name="user-card" loading={false} initialBones={userCardBones}>
        <div className="real-content">Hello</div>
      </Skeleton>,
    )
    expect(html).not.toContain('aria-busy')
  })
})

// ── BoneSuspense ───────────────────────────────────────────────────────────

describe('BoneSuspense (runtime)', () => {
  beforeEach(() => setBuildMode(false))

  it('renders children when they do not suspend', () => {
    const html = renderToString(
      <BoneSuspense name="user-card">
        <ResolvedCard />
      </BoneSuspense>,
    )
    expect(html).toContain('resolved-card')
    expect(html).toContain('Real Data')
  })

  it('shows the Skeleton fallback when children suspend', () => {
    registerBones({ 'user-card': userCardBones })
    const html = renderToString(
      <BoneSuspense name="user-card" initialBones={userCardBones}>
        <SuspendingChild />
      </BoneSuspense>,
    )
    expect(html).toContain('data-boneyard-content')
    expect(html).not.toContain('resolved-card')
  })

  it('Skeleton fallback receives the configured name and class', () => {
    const html = renderToString(
      <BoneSuspense
        name="user-card"
        initialBones={userCardBones}
        className="suspense-wrap"
      >
        <SuspendingChild />
      </BoneSuspense>,
    )
    expect(html).toContain('suspense-wrap')
    expect(html).toContain('data-boneyard-content')
  })

  it('passes the user-provided fallback through to Skeleton', () => {
    const html = renderToString(
      <BoneSuspense
        name="missing-skeleton"
        fallback={<div className="custom-fallback">Loading…</div>}
      >
        <SuspendingChild />
      </BoneSuspense>,
    )
    expect(html).toContain('custom-fallback')
    expect(html).toContain('Loading')
  })
})

describe('BoneSuspense (build mode)', () => {
  beforeEach(() => setBuildMode(true))
  afterEach(() => setBuildMode(false))

  it('wraps children in a data-boneyard region the CLI can find', () => {
    const html = renderToString(
      <BoneSuspense name="user-card">
        <ResolvedCard />
      </BoneSuspense>,
    )
    expect(html).toContain('data-boneyard="user-card"')
    expect(html).toContain('resolved-card')
  })

  it('serializes snapshotConfig to data attribute for CLI consumption', () => {
    const html = renderToString(
      <BoneSuspense
        name="user-card"
        snapshotConfig={{ excludeSelectors: ['.ad-banner'] }}
      >
        <ResolvedCard />
      </BoneSuspense>,
    )
    expect(html).toContain('data-boneyard-config')
    expect(html).toContain('.ad-banner')
  })

  it('shows the fixture when a suspending query has not resolved yet', () => {
    const html = renderToString(
      <BoneSuspense
        name="user-card"
        fixture={<div className="build-fixture">Stub Card</div>}
      >
        <SuspendingChild />
      </BoneSuspense>,
    )
    expect(html).toContain('data-boneyard="user-card"')
    expect(html).toContain('build-fixture')
    expect(html).toContain('Stub Card')
  })

  it('does not wrap children in a Skeleton overlay during build', () => {
    const html = renderToString(
      <BoneSuspense name="user-card" initialBones={userCardBones}>
        <ResolvedCard />
      </BoneSuspense>,
    )
    expect(html).not.toContain('data-boneyard-overlay')
    expect(html).not.toContain('data-boneyard-bone')
  })
})
