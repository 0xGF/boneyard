import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterContentInit,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { normalizeBone } from './types.js'
import type { AnyBone, SkeletonResult, ResponsiveBones, SnapshotConfig, AnimationStyle } from './types.js'
import {
  adjustColor,
  ensureBuildSnapshotHook,
  getRegisteredBones,
  isBuildMode,
  registerBones,
  resolveResponsive,
  SHIMMER,
  PULSE,
  DEFAULTS,
} from './shared.js'

export { registerBones }
export type { AnimationStyle }

interface BoneyardConfig {
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  boneClass?: string
}

let _globalConfig: BoneyardConfig = {}

export function configureBoneyard(config: BoneyardConfig): void {
  _globalConfig = { ..._globalConfig, ...config }
}

ensureBuildSnapshotHook()

@Component({
  selector: 'boneyard-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #container
      [class]="cssClass"
      style="position:relative;"
      [attr.data-boneyard]="name"
      [attr.data-boneyard-config]="serializedSnapshotConfig"
    >
      <div
        data-boneyard-content="true"
        [style.visibility]="!buildMode && showSkeleton && !transitioning ? 'hidden' : null"
      >
        <!-- Fixture slot: only rendered during CLI capture. -->
        <ng-container *ngIf="buildMode">
          <ng-content select="[fixture]"></ng-content>
        </ng-container>
        <!-- Fallback slot: rendered while loading if no bones are available. -->
        <ng-container *ngIf="!buildMode && showFallback">
          <ng-content select="[fallback]"></ng-content>
        </ng-container>
        <!-- Default slot: real children. Hidden (not removed) in build mode
             when a fixture is present, or at runtime when the fallback is
             showing — keeps projection stable across *ngIf changes. -->
        <div [style.display]="(buildMode && hasFixture) || (!buildMode && showFallback) ? 'none' : null">
          <ng-content></ng-content>
        </div>
      </div>

      <div
        *ngIf="!buildMode && showSkeleton && activeBones"
        data-boneyard-overlay="true"
        [style]="'position:absolute;inset:0;overflow:hidden;opacity:' + (transitioning ? 0 : 1) + ';' + (transitionMs > 0 ? 'transition:opacity ' + transitionMs + 'ms ease-out;' : '')"
      >
        <div style="position:relative;width:100%;height:100%;">
          <div
            *ngFor="let bone of visibleBones; let i = index; trackBy: trackBone"
            data-boneyard-bone="true"
            [class]="resolvedBoneClass"
            [style]="getBoneStyle(bone, i)"
          >
            <div
              *ngIf="animationStyle !== 'solid'"
              [style]="getOverlayStyle()"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SkeletonComponent implements AfterContentInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() loading = false
  @Input() name?: string
  @Input() initialBones?: SkeletonResult | ResponsiveBones
  @Input() color?: string
  @Input() darkColor?: string
  @Input() animate?: AnimationStyle
  @Input() stagger: number | boolean = false
  @Input() transition: number | boolean = false
  @Input() boneClass?: string
  @Input() cssClass?: string
  @Input() snapshotConfig?: SnapshotConfig

  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>

  readonly uid = Math.random().toString(36).slice(2, 8)
  readonly buildMode = isBuildMode()

  containerWidth = 0
  containerHeight = 0
  isDark = false
  activeBones: SkeletonResult | null = null
  transitioning = false
  /** True iff the user projected an element with the [fixture] attribute. */
  hasFixture = false

  get resolvedBoneClass(): string | undefined {
    return this.boneClass ?? _globalConfig.boneClass
  }

  get staggerMs(): number {
    const v = this.stagger ?? _globalConfig.stagger
    return v === true ? 80 : v === false || !v ? 0 : v
  }

  get transitionMs(): number {
    const v = this.transition ?? _globalConfig.transition
    return v === true ? 300 : v === false || !v ? 0 : v
  }

  private transitionTimer: any = null

  /**
   * Keyframes live in a global <style> injected into document.head rather than
   * in the component template. Two reasons:
   *   1. Angular does not interpolate `{{ uid }}` inside inline <style> elements,
   *      so template keyframes kept the literal name `bs-{{ uid }}` (#95).
   *   2. Emulated ViewEncapsulation rewrites @keyframes names with a
   *      `_ngcontent-*` prefix, so they never matched the `animation:` set in
   *      getOverlayStyle()/getBoneStyle() (#95, #86 — also affects the esbuild
   *      `@angular/build:application` builder). Global keyframes are unscoped and
   *      built in TS, so the uid resolves and the name matches.
   */
  private keyframeStyle: HTMLStyleElement | null = null

  private resizeObserver: ResizeObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private mq: MediaQueryList | null = null
  private mqHandler: (() => void) | null = null

  constructor(
    private cdr: ChangeDetectorRef,
    private hostRef: ElementRef<HTMLElement>,
  ) {}

  ngAfterContentInit(): void {
    // Detect whether the user projected an element tagged with `fixture`.
    // Only matters in build mode — at runtime the fixture slot isn't rendered,
    // so nothing to hide.
    if (this.buildMode && typeof window !== 'undefined') {
      this.hasFixture = !!this.hostRef.nativeElement.querySelector('[fixture]')
      this.cdr.markForCheck()
    }
  }

  get resolvedColor(): string {
    return this.isDark
      ? (this.darkColor ?? _globalConfig.darkColor ?? DEFAULTS.web.dark)
      : (this.color ?? _globalConfig.color ?? DEFAULTS.web.light)
  }

  get animationStyle(): 'pulse' | 'shimmer' | 'solid' {
    const raw = this.animate ?? _globalConfig.animate ?? 'pulse'
    return raw === true ? 'pulse' : raw === false ? 'solid' : raw
  }

  get serializedSnapshotConfig(): string | undefined {
    return this.snapshotConfig ? JSON.stringify(this.snapshotConfig) : undefined
  }

  get showSkeleton(): boolean {
    return (this.loading || this.transitioning) && !!this.activeBones
  }

  get showFallback(): boolean {
    return this.loading && !this.activeBones && !this.transitioning
  }

  get scaleY(): number {
    const effectiveHeight = this.containerHeight > 0 ? this.containerHeight : this.activeBones?.height ?? 0
    const capturedHeight = this.activeBones?.height ?? 0
    return effectiveHeight > 0 && capturedHeight > 0 ? effectiveHeight / capturedHeight : 1
  }

  ngAfterViewInit(): void {
    this.injectKeyframes()
    this.updateDarkMode()
    this.updateBones()

    const el = this.containerRef?.nativeElement
    if (el) {
      const rect = el.getBoundingClientRect()
      this.containerWidth = Math.round(rect.width)
      if (rect.height > 0) this.containerHeight = Math.round(rect.height)

      this.resizeObserver = new ResizeObserver(entries => {
        const r = entries[0]?.contentRect
        this.containerWidth = Math.round(r?.width ?? 0)
        if (r && r.height > 0) this.containerHeight = Math.round(r.height)
        this.updateBones()
        this.cdr.markForCheck()
      })
      this.resizeObserver.observe(el)
    }

    this.mutationObserver = new MutationObserver(() => {
      this.updateDarkMode()
      this.cdr.markForCheck()
    })
    this.mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    this.mq = window.matchMedia('(prefers-color-scheme: dark)')
    this.mqHandler = () => { this.updateDarkMode(); this.cdr.markForCheck() }
    this.mq.addEventListener('change', this.mqHandler)

    this.cdr.markForCheck()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading'] || changes['name'] || changes['initialBones']) {
      this.updateBones()
    }
    if (changes['loading']) {
      const prev = changes['loading'].previousValue
      const curr = changes['loading'].currentValue
      if (prev && !curr && this.transitionMs > 0 && this.activeBones) {
        if (this.transitionTimer) clearTimeout(this.transitionTimer)
        this.transitioning = true
        this.transitionTimer = setTimeout(() => {
          this.transitioning = false
          this.transitionTimer = null
          this.cdr.markForCheck()
        }, this.transitionMs)
      }
    }
  }

  ngOnDestroy(): void {
    if (this.mq && this.mqHandler) this.mq.removeEventListener('change', this.mqHandler)
    this.mutationObserver?.disconnect()
    this.resizeObserver?.disconnect()
    this.keyframeStyle?.remove()
    this.keyframeStyle = null
  }

  /**
   * Inject this instance's animation keyframes into document.head, keyed by uid.
   * The definitions are static given the uid (pulse/stagger animate opacity,
   * shimmer animates background-position — none depend on color or dark mode),
   * so all three are defined once; unused ones cost nothing.
   */
  private injectKeyframes(): void {
    if (this.buildMode || this.keyframeStyle) return
    if (typeof document === 'undefined' || !document.head) return
    const style = document.createElement('style')
    style.setAttribute('data-boneyard-keyframes', this.uid)
    style.textContent =
      `@keyframes bp-${this.uid}{0%,100%{opacity:0}50%{opacity:1}}` +
      `@keyframes bs-${this.uid}{0%{background-position:200% 0}100%{background-position:-200% 0}}` +
      `@keyframes by-${this.uid}{from{opacity:0}to{opacity:1}}`
    document.head.appendChild(style)
    this.keyframeStyle = style
  }

  private updateDarkMode(): void {
    if (typeof window === 'undefined') return
    const el = this.containerRef?.nativeElement
    this.isDark =
      document.documentElement.classList.contains('dark') ||
      !!el?.closest('.dark')
  }

  private updateBones(): void {
    const effectiveBones = this.initialBones ?? (this.name ? getRegisteredBones(this.name) : undefined)
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : this.containerWidth
    const resolveWidth = this.containerWidth > 0 ? this.containerWidth : viewportWidth
    this.activeBones = effectiveBones && resolveWidth > 0
      ? resolveResponsive(effectiveBones, resolveWidth)
      : null
  }

  trackBone(index: number): number {
    return index
  }

  get visibleBones(): AnyBone[] {
    return (this.activeBones?.bones as AnyBone[] ?? []).filter(raw => !normalizeBone(raw).c)
  }

  getBoneStyle(raw: AnyBone, index: number = 0): string {
    const bone = normalizeBone(raw)
    const radius = typeof bone.r === 'string' ? bone.r : `${bone.r}px`
    const boneColor = this.resolvedColor
    const capturedPxW = (bone.w / 100) * (this.activeBones?.width ?? 0)
    const isCircle = bone.r === '50%' && (this.activeBones?.width ?? 0) > 0 && Math.abs(capturedPxW - bone.h) < 4
    const w = isCircle ? `${bone.h * this.scaleY}px` : `${bone.w}%`
    const stagger = this.staggerMs > 0
      ? `opacity:0;animation:by-${this.uid} 0.3s ease-out ${index * this.staggerMs}ms forwards;`
      : ''
    return `position:absolute;left:${bone.x}%;top:${bone.y * this.scaleY}px;width:${w};height:${bone.h * this.scaleY}px;border-radius:${radius};background-color:${boneColor};overflow:hidden;${stagger}`
  }

  getOverlayStyle(): string {
    const anim = this.animationStyle
    if (anim === 'solid') return ''
    const lighterColor = adjustColor(this.resolvedColor, this.isDark ? PULSE.darkAdjust : PULSE.lightAdjust)
    if (anim === 'pulse') {
      return `position:absolute;inset:0;background-color:${lighterColor};animation:bp-${this.uid} ${PULSE.speed} ease-in-out infinite;`
    }
    if (anim === 'shimmer') {
      return `position:absolute;inset:0;background:linear-gradient(${SHIMMER.angle}deg, transparent ${SHIMMER.start}%, ${lighterColor} 50%, transparent ${SHIMMER.end}%);background-size:200% 100%;animation:bs-${this.uid} ${SHIMMER.speed} linear infinite;`
    }
    return ''
  }
}
