/**
 * Controls how `snapshotBones` extracts bones from the DOM.
 * Pass as `snapshotConfig` on `<Skeleton>` or as the third arg to `snapshotBones()`.
 *
 * @example
 * <Skeleton loading={isLoading} snapshotConfig={{ leafTags: ['p', 'h1', 'h2', 'li'] }}>
 *   <MyComponent />
 * </Skeleton>
 */
export interface SnapshotConfig {
  /**
   * HTML tags always captured as a single atomic bone, regardless of children.
   * Use this for block-level text elements in your design system.
   * Default: ['p','h1','h2','h3','h4','h5','h6','li','tr']
   */
  leafTags?: string[]

  /**
   * When true, containers with a visible border AND border-radius are captured
   * as container bones — even with a white or transparent background.
   * This catches white cards (`bg-white rounded-xl border`) that would otherwise
   * produce no container bone.
   * Default: true
   */
  captureRoundedBorders?: boolean

  /**
   * HTML tags to skip entirely — no bone emitted, children not walked.
   * Useful for decorative elements, icons, or custom components you don't
   * want represented in the skeleton.
   *
   * @example ['nav', 'footer', 'aside']
   */
  excludeTags?: string[]

  /**
   * CSS selectors to skip entirely. Any element matching a selector is
   * excluded along with all its descendants. Supports any valid CSS selector —
   * classes, IDs, attributes, tags, or combinations.
   *
   * @example
   * excludeSelectors: [
   *   '.icon',              // skip by class
   *   '[data-no-skeleton]', // skip by data attribute
   *   '#sidebar',           // skip by ID
   *   'nav',                // skip by tag
   *   '.card .badge',       // skip by nested selector
   * ]
   */
  excludeSelectors?: string[]
}

/** A single skeleton bone — a rounded rect placeholder */
export interface Bone {
  x: number
  y: number
  w: number
  h: number
  r: number | string
  /** True if this bone is a background container — rendered lighter so children stand out */
  c?: boolean
}

/** Compact bone format: [x, y, w, h, r, c?] — c is omitted if false */
export type CompactBone = [number, number, number, number, number | string] | [number, number, number, number, number | string, boolean]

/** Either format — runtime detects which is being used */
export type AnyBone = Bone | CompactBone

/** Normalize a bone from either format to the object format */
export function normalizeBone(b: AnyBone): Bone {
  if (Array.isArray(b)) {
    if (b.length < 5 || b.length > 6) {
      throw new Error(`Invalid bone format: expected [x,y,w,h,r,c?] but got ${b.length} elements`)
    }
    return { x: b[0], y: b[1], w: b[2], h: b[3], r: b[4], c: b[5] || undefined }
  }
  return b
}

/** Skeleton layout result for a component at a specific width */
export interface SkeletonResult {
  name: string
  viewportWidth: number
  width: number
  height: number
  bones: Bone[]
}

/**
 * Describes a component's visual structure for skeleton generation.
 * Auto-extracted from the DOM via `fromElement()`, or hand-authored for
 * SSR/build-time paths where no DOM is available.
 * `computeLayout` uses the compiled layout engine to measure text and compute bone positions
 * at any container width — no DOM needed at render time.
 *
 * For the simpler browser path, use `snapshotBones()` or `<Skeleton>` instead.
 *
 * @example
 * const card: SkeletonDescriptor = {
 *   display: 'flex', flexDirection: 'column', padding: 16, gap: 12,
 *   children: [
 *     { aspectRatio: 16/9 },
 *     { text: 'Title text here', font: '700 18px Inter', lineHeight: 24 },
 *     { text: 'Body text content', font: '14px Inter', lineHeight: 20 },
 *     { height: 44, borderRadius: 8 },
 *   ]
 * }
 */
export interface SkeletonDescriptor {
  /** Display mode (default: 'block') */
  display?: 'block' | 'flex'
  /** Flex direction (default: 'row') */
  flexDirection?: 'row' | 'column'
  /** Align items — cross-axis alignment */
  alignItems?: string
  /** Justify content — main-axis alignment */
  justifyContent?: string
  /** Explicit width in px */
  width?: number
  /** Explicit height in px */
  height?: number
  /** CSS aspect-ratio (e.g. 16/9) */
  aspectRatio?: number
  /** Padding — single number or per-side (missing sides default to 0) */
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  /** Margin — single number or per-side (missing sides default to 0) */
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number }
  /** Gap between flex children */
  gap?: number
  /** Row gap (overrides gap for vertical) */
  rowGap?: number
  /** Column gap (overrides gap for horizontal) */
  columnGap?: number
  /** Border radius (default: 8, use '50%' for circles) */
  borderRadius?: number | string
  /** CSS font string used by the compiled text measurement pass (e.g. '700 18px Inter') */
  font?: string
  /** Line height in px */
  lineHeight?: number
  /** Text content — measured during compilation to compute responsive height */
  text?: string
  /** Max width constraint (px) */
  maxWidth?: number
  /** Whether this is a leaf bone (auto-detected if not set) */
  leaf?: boolean
  /** Child descriptors */
  children?: SkeletonDescriptor[]
}

/**
 * A responsive skeleton descriptor — maps min-width breakpoints to
 * structural variants. The layout engine picks the best match for
 * the current container width.
 *
 * @example
 * const card: ResponsiveDescriptor = {
 *   // Mobile: single column
 *   0: { display: 'flex', flexDirection: 'column', ... },
 *   // Tablet+: row with sidebar
 *   768: { display: 'flex', flexDirection: 'row', ... },
 * }
 */
export type ResponsiveDescriptor = Record<number, SkeletonDescriptor>

/**
 * Responsive bones — a set of SkeletonResults captured at different viewport widths.
 * Generated by `boneyard build`, passed as `initialBones` to `<Skeleton>`.
 *
 * `<Skeleton>` picks the nearest matching breakpoint for the current container width.
 * Keys are the min-widths at which each snapshot was taken (e.g. 375, 768, 1280).
 *
 * @example
 * // Generated by: npx boneyard-js build http://localhost:3000 --out ./src/bones
 * // Then import:
 * import blogBones from './src/bones/blog-card.bones.json'
 * // { "breakpoints": { "375": {...}, "768": {...}, "1280": {...} } }
 *
 * <Skeleton loading={isLoading} initialBones={blogBones}>
 *   <BlogCard />
 * </Skeleton>
 */
export interface ResponsiveBones {
  breakpoints: Record<number, SkeletonResult>
}
