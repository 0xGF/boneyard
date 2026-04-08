import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { normalizeBone } from './types.js'
import type { AnyBone, SkeletonResult, ResponsiveBones, SnapshotConfig } from './types.js'
import {
  adjustColor,
  ensureBuildSnapshotHook,
  getRegisteredBones,
  isBuildMode,
  registerBones,
  resolveResponsive,
} from './shared.js'

export { registerBones }

// ── Global defaults ─────────────────────────────────────────────────────────
export type AnimationStyle = 'pulse' | 'shimmer' | 'solid' | boolean

interface BoneyardConfig {
  color?: string
  darkColor?: string
  animate?: AnimationStyle
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
    <!-- Build mode: render content for CLI capture -->
    <div
      *ngIf="buildMode; else runtimeMode"
      #container
      [class]="cssClass"
      style="position:relative;"
      [attr.data-boneyard]="name"
      [attr.data-boneyard-config]="serializedSnapshotConfig"
    >
      <div>
        <ng-content select="[fixture]"></ng-content>
        <ng-content></ng-content>
      </div>
    </div>

    <!-- Runtime mode -->
    <ng-template #runtimeMode>
      <div
        #container
        [class]="cssClass"
        style="position:relative;"
        [attr.data-boneyard]="name"
        [attr.data-boneyard-config]="serializedSnapshotConfig"
      >
        <div data-boneyard-content="true" [style.visibility]="showSkeleton && !transitioning ? 'hidden' : null">
          <ng-container *ngIf="showFallback; else defaultContent">
            <ng-content select="[fallback]"></ng-content>
          </ng-container>
          <ng-template #defaultContent>
            <ng-content></ng-content>
          </ng-template>
        </div>

        <div
          *ngIf="showSkeleton && activeBones"
          data-boneyard-overlay="true"
          [style]="'position:absolute;inset:0;overflow:hidden;opacity:' + (transitioning ? 0 : 1) + ';' + (transitionMs > 0 ? 'transition:opacity ' + transitionMs + 'ms ease-out;' : '')"
        >
          <div style="position:relative;width:100%;height:100%;">
            <div
              *ngFor="let bone of activeBones.bones; let i = index; trackBy: trackBone"
              data-boneyard-bone="true"
              [style]="getBoneStyle(bone, i)"
            >
              <div
                *ngIf="animationStyle !== 'solid' && !isContainerBone(bone)"
                [style]="getOverlayStyle()"
              ></div>
            </div>

            <style *ngIf="animationStyle === 'pulse'">
              @keyframes bp-{{ uid }} { 0%,100%{opacity:0} 50%{opacity:1} }
            </style>
            <style *ngIf="animationStyle === 'shimmer'">
              @keyframes bs-{{ uid }} { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            </style>
            <style *ngIf="staggerMs > 0">
              @keyframes by-{{ uid }} { from{opacity:0} to{opacity:1} }
            </style>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class SkeletonComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() loading = false
  @Input() name?: string
  @Input() initialBones?: SkeletonResult | ResponsiveBones
  @Input() color?: string
  @Input() darkColor?: string
  @Input() animate?: AnimationStyle
  @Input() stagger: number | boolean = false
  @Input() transition: number | boolean = false
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

  get staggerMs(): number {
    return this.stagger === true ? 80 : this.stagger === false ? 0 : this.stagger
  }

  get transitionMs(): number {
    return this.transition === true ? 300 : this.transition === false ? 0 : this.transition
  }

  private transitionTimer: any = null

  private resizeObserver: ResizeObserver | null = null
  private mutationObserver: MutationObserver | null = null
  private mq: MediaQueryList | null = null
  private mqHandler: (() => void) | null = null

  constructor(private cdr: ChangeDetectorRef) {}

  get resolvedColor(): string {
    return this.isDark
      ? (this.darkColor ?? _globalConfig.darkColor ?? 'rgba(255,255,255,0.06)')
      : (this.color ?? _globalConfig.color ?? 'rgba(0,0,0,0.08)')
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

    this.mq = window.matchMedia('(prefers-color-scheme: dark)')
    this.mqHandler = () => {
      this.updateDarkMode()
      this.cdr.markForCheck()
    }
    this.mq.addEventListener('change', this.mqHandler)

    this.mutationObserver = new MutationObserver(() => {
      this.updateDarkMode()
      this.cdr.markForCheck()
    })
    this.mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    this.cdr.markForCheck()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading']) {
      const prev = changes['loading'].previousValue
      const curr = changes['loading'].currentValue
      if (prev && !curr && this.transitionMs > 0 && this.activeBones) {
        this.transitioning = true
        if (this.transitionTimer) clearTimeout(this.transitionTimer)
        this.transitionTimer = setTimeout(() => {
          this.transitioning = false
          this.cdr.markForCheck()
        }, this.transitionMs)
      }
    }
    if (changes['loading'] || changes['name'] || changes['initialBones']) {
      this.updateBones()
    }
  }

  ngOnDestroy(): void {
    if (this.mq && this.mqHandler) this.mq.removeEventListener('change', this.mqHandler)
    this.mutationObserver?.disconnect()
    this.resizeObserver?.disconnect()
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

  isContainerBone(raw: AnyBone): boolean {
    return Array.isArray(raw) ? !!raw[5] : !!raw.c
  }

  getBoneStyle(raw: AnyBone, index: number = 0): string {
    const bone = normalizeBone(raw)
    const radius = typeof bone.r === 'string' ? bone.r : `${bone.r}px`
    const boneColor = bone.c ? adjustColor(this.resolvedColor, this.isDark ? 0.03 : 0.45) : this.resolvedColor
    const stagger = this.staggerMs > 0
      ? `opacity:0;animation:by-${this.uid} 0.3s ease-out ${index * this.staggerMs}ms forwards;`
      : ''
    return `position:absolute;left:${bone.x}%;top:${bone.y * this.scaleY}px;width:${bone.w}%;height:${bone.h * this.scaleY}px;border-radius:${radius};background-color:${boneColor};overflow:hidden;${stagger}`
  }

  getOverlayStyle(): string {
    const anim = this.animationStyle
    if (anim === 'solid') return ''
    const lighterColor = adjustColor(this.resolvedColor, this.isDark ? 0.04 : 0.3)
    if (anim === 'pulse') {
      return `position:absolute;inset:0;background-color:${lighterColor};animation:bp-${this.uid} 1.8s ease-in-out infinite;`
    }
    if (anim === 'shimmer') {
      return `position:absolute;inset:0;background:linear-gradient(90deg, transparent 30%, ${lighterColor} 50%, transparent 70%);background-size:200% 100%;animation:bs-${this.uid} 2.4s linear infinite;`
    }
    return ''
  }
}
