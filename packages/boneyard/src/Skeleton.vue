<script lang="ts">
import { normalizeBone } from './types.js'
import type { Bone, AnyBone, SkeletonResult, ResponsiveBones, SnapshotConfig } from './types.js'
import {
  adjustColor,
  ensureBuildSnapshotHook,
  getRegisteredBones,
  isBuildMode,
  registerBones,
  resolveResponsive,
} from './shared.js'

export { registerBones }

export type AnimationStyle = 'pulse' | 'shimmer' | 'solid' | boolean

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

export function getGlobalConfig(): BoneyardConfig {
  return _globalConfig
}

export interface SkeletonProps {
  loading: boolean
  name?: string
  initialBones?: SkeletonResult | ResponsiveBones
  color?: string
  darkColor?: string
  animate?: AnimationStyle
  stagger?: number | boolean
  transition?: number | boolean
  boneClass?: string
  class?: string
  snapshotConfig?: SnapshotConfig
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

ensureBuildSnapshotHook()

const props = withDefaults(defineProps<SkeletonProps>(), {
  animate: 'pulse',
})

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)
const isDark = ref(false)
const uid = Math.random().toString(36).slice(2, 8)

const buildMode = isBuildMode()

const rawAnimate = computed(() => props.animate ?? _globalConfig.animate ?? 'pulse')
const animationStyle = computed<'pulse' | 'shimmer' | 'solid'>(() => {
  const v = rawAnimate.value
  return v === true ? 'pulse' : v === false ? 'solid' : v
})

const resolvedColor = computed(() =>
  isDark.value
    ? (props.darkColor ?? _globalConfig.darkColor ?? 'rgba(255,255,255,0.06)')
    : (props.color ?? _globalConfig.color ?? 'rgba(0,0,0,0.08)')
)

const serializedSnapshotConfig = computed(() =>
  props.snapshotConfig ? JSON.stringify(props.snapshotConfig) : undefined
)

const effectiveBones = computed(() =>
  props.initialBones ?? (props.name ? getRegisteredBones(props.name) : undefined)
)

const viewportWidth = computed(() =>
  typeof window !== 'undefined' ? window.innerWidth : containerWidth.value
)

const activeBones = computed(() =>
  effectiveBones.value && (viewportWidth.value > 0 || containerWidth.value > 0)
    ? resolveResponsive(effectiveBones.value, viewportWidth.value || containerWidth.value)
    : null
)

const resolvedBoneClass = computed(() => props.boneClass ?? _globalConfig.boneClass)

// Stagger
const staggerMs = computed(() => {
  const v = props.stagger ?? _globalConfig.stagger
  return v === true ? 80 : v === false || !v ? 0 : v
})

// Transition
const transitionMs = computed(() => {
  const v = props.transition ?? _globalConfig.transition
  return v === true ? 300 : v === false || !v ? 0 : v
})
const transitioning = ref(false)
let transitionTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.loading, (newVal, oldVal) => {
  if (oldVal && !newVal && transitionMs.value > 0 && activeBones.value) {
    if (transitionTimer) clearTimeout(transitionTimer)
    transitioning.value = true
    transitionTimer = setTimeout(() => {
      transitioning.value = false
      transitionTimer = null
    }, transitionMs.value)
  }
})

const showSkeleton = computed(() => (props.loading || transitioning.value) && !!activeBones.value)
const showFallback = computed(() => props.loading && !activeBones.value && !transitioning.value)

const effectiveHeight = computed(() =>
  containerHeight.value > 0 ? containerHeight.value : activeBones.value?.height ?? 0
)

const capturedHeight = computed(() => activeBones.value?.height ?? 0)

const scaleY = computed(() =>
  effectiveHeight.value > 0 && capturedHeight.value > 0
    ? effectiveHeight.value / capturedHeight.value
    : 1
)

const pulseColor = computed(() =>
  adjustColor(resolvedColor.value, isDark.value ? 0.04 : 0.3)
)

function updateDarkMode() {
  if (typeof window === 'undefined') return
  try {
    isDark.value =
      document.documentElement.classList.contains('dark') ||
      !!containerRef.value?.closest('.dark')
  } catch {
    isDark.value = false
  }
}

function sanitizeRadius(r: number | string): string {
  if (typeof r === 'number') return `${r}px`
  // Allow only safe CSS radius values: digits, px, %, em, rem, spaces, slashes
  if (/^[0-9.]+(%|px|em|rem)?(\s+[0-9.]+(%|px|em|rem)?)*(\s*\/\s*[0-9.]+(%|px|em|rem)?(\s+[0-9.]+(%|px|em|rem)?)*)?$/.test(r)) return r
  return '0px'
}

function getBoneStyle(raw: AnyBone, scale: number, color: string, dark: boolean, index: number = 0) {
  const bone = normalizeBone(raw)
  const radius = sanitizeRadius(bone.r)
  const boneColor = bone.c ? adjustColor(color, dark ? 0.03 : 0.45) : color
  const stagger = staggerMs.value > 0
    ? `opacity:0;animation:by-${uid} 0.3s ease-out ${index * staggerMs.value}ms forwards;`
    : ''
  return `position:absolute;left:${bone.x}%;top:${bone.y * scale}px;width:${bone.w}%;height:${bone.h * scale}px;border-radius:${radius};background-color:${boneColor};overflow:hidden;${stagger}`
}

function getOverlayStyle(color: string, dark: boolean, anim: 'pulse' | 'shimmer' | 'solid') {
  if (anim === 'solid') return ''
  const lighterColor = adjustColor(color, dark ? 0.04 : 0.3)
  if (anim === 'pulse') {
    return `position:absolute;inset:0;background-color:${lighterColor};animation:bp-${uid} 1.8s ease-in-out infinite;`
  }
  if (anim === 'shimmer') {
    return `position:absolute;inset:0;background:linear-gradient(90deg, transparent 30%, ${lighterColor} 50%, transparent 70%);background-size:200% 100%;animation:bs-${uid} 2.4s linear infinite;`
  }
  return ''
}

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null
let mqHandler: (() => void) | null = null
let mq: MediaQueryList | null = null

onMounted(() => {
  updateDarkMode()

  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    containerWidth.value = Math.round(rect.width)
    if (rect.height > 0) containerHeight.value = Math.round(rect.height)
  }

  mq = window.matchMedia('(prefers-color-scheme: dark)')
  mqHandler = () => updateDarkMode()
  mq.addEventListener('change', mqHandler)

  mutationObserver = new MutationObserver(updateDarkMode)
  mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })

  resizeObserver = new ResizeObserver(entries => {
    const rect = entries[0]?.contentRect
    containerWidth.value = Math.round(rect?.width ?? 0)
    if (rect && rect.height > 0) containerHeight.value = Math.round(rect.height)
  })

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (mq && mqHandler) mq.removeEventListener('change', mqHandler)
  mutationObserver?.disconnect()
  resizeObserver?.disconnect()
})
</script>

<template>
  <!-- Build mode: render fixture or children for CLI capture -->
  <div
    v-if="buildMode"
    ref="containerRef"
    :class="props.class"
    style="position:relative;"
    :data-boneyard="name"
    :data-boneyard-config="serializedSnapshotConfig"
  >
    <div>
      <slot name="fixture">
        <slot />
      </slot>
    </div>
  </div>

  <!-- Runtime mode -->
  <div
    v-else
    ref="containerRef"
    :class="props.class"
    style="position:relative;"
    :data-boneyard="name"
    :data-boneyard-config="serializedSnapshotConfig"
  >
    <div data-boneyard-content="true" :style="{ visibility: showSkeleton && !transitioning ? 'hidden' : undefined }">
      <template v-if="showFallback">
        <slot name="fallback" />
      </template>
      <template v-else>
        <slot />
      </template>
    </div>

    <div
      v-if="showSkeleton && activeBones"
      data-boneyard-overlay="true"
      :style="`position:absolute;inset:0;overflow:hidden;opacity:${transitioning ? 0 : 1};${transitionMs > 0 ? `transition:opacity ${transitionMs}ms ease-out;` : ''}`"
    >
      <div style="position:relative;width:100%;height:100%;">
        <div
          v-for="(bone, i) in activeBones.bones"
          :key="`${i}-${(bone as any).x ?? (bone as any)[0]}`"
          data-boneyard-bone="true"
          :class="resolvedBoneClass"
          :style="getBoneStyle(bone, scaleY, resolvedColor, isDark, i)"
        >
          <div
            v-if="animationStyle !== 'solid'"
            :style="getOverlayStyle(resolvedColor, isDark, animationStyle)"
          />
        </div>

        <component v-if="animationStyle === 'pulse'" :is="'style'">
          @keyframes bp-{{ uid }}{0%,100%{opacity:0}50%{opacity:1}}
        </component>
        <component v-if="animationStyle === 'shimmer'" :is="'style'">
          @keyframes bs-{{ uid }}{0%{background-position:200% 0}100%{background-position:-200% 0}}
        </component>
        <component v-if="staggerMs > 0" :is="'style'">
          @keyframes by-{{ uid }}{from{opacity:0}to{opacity:1}}
        </component>
      </div>
    </div>
  </div>
</template>
