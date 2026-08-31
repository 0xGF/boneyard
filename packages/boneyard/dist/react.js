import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, useRef, useState, useEffect, useLayoutEffect, useId } from 'react';
import { normalizeBone } from './types.js';
import { adjustColor, ensureBuildSnapshotHook, getRegisteredBones, isBuildMode, registerBones, resolveResponsive, SHIMMER, PULSE, DEFAULTS, } from './shared.js';
ensureBuildSnapshotHook();
export { registerBones };
let globalConfig = {};
/**
 * Set global defaults for all `<Skeleton>` components.
 * Individual props override these defaults.
 *
 * ```ts
 * import { configureBoneyard } from 'boneyard-js/react'
 *
 * configureBoneyard({
 *   color: '#e5e5e5',
 *   darkColor: '#2a2a2a',
 *   animate: true,
 * })
 * ```
 */
export function configureBoneyard(config) {
    globalConfig = { ...globalConfig, ...config };
}
/**
 * Wrap any component to get automatic skeleton loading screens.
 *
 * 1. Run `npx boneyard-js build` — captures bone positions from your rendered UI
 * 2. Import the generated registry in your app entry
 * 3. `<Skeleton name="..." loading={isLoading}>` auto-resolves bones by name
 */
export function Skeleton({ loading, children, name, initialBones, color, darkColor, animate, stagger, transition, boneClass, className, fallback, fixture, snapshotConfig, select, }) {
    const containerRef = useRef(null);
    // Sanitized because uid is interpolated into CSS animation and @keyframes
    // identifiers, and useId() returns colon-wrapped values like ":r0:".
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const [containerWidth, setContainerWidth] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [isDark, setIsDark] = useState(false);
    // Auto-detect dark mode via .dark class on <html> or ancestor
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const checkDark = () => {
            const hasDarkClass = document.documentElement.classList.contains('dark') ||
                !!containerRef.current?.closest('.dark');
            setIsDark(hasDarkClass);
        };
        checkDark();
        // MutationObserver catches .dark toggling on <html>
        const mo = new MutationObserver(checkDark);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        // matchMedia catches OS theme changes that may toggle .dark on non-<html> ancestors
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', checkDark);
        return () => {
            mo.disconnect();
            mq.removeEventListener('change', checkDark);
        };
    }, []);
    const effectiveColor = color ?? globalConfig.color ?? DEFAULTS.web.light;
    const effectiveDarkColor = darkColor ?? globalConfig.darkColor ?? DEFAULTS.web.dark;
    const resolvedColor = isDark ? effectiveDarkColor : effectiveColor;
    const rawAnimate = animate ?? globalConfig.animate ?? 'pulse';
    const animationStyle = rawAnimate === true ? 'pulse' :
        rawAnimate === false ? 'solid' :
            rawAnimate;
    // Track container width for responsive breakpoint selection
    useEffect(() => {
        const el = containerRef.current;
        if (!el)
            return;
        const ro = new ResizeObserver(entries => {
            const rect = entries[0]?.contentRect;
            setContainerWidth(Math.round(rect?.width ?? 0));
            if (rect && rect.height > 0)
                setContainerHeight(Math.round(rect.height));
        });
        ro.observe(el);
        const rect = el.getBoundingClientRect();
        setContainerWidth(Math.round(rect.width));
        if (rect.height > 0)
            setContainerHeight(Math.round(rect.height));
        return () => ro.disconnect();
    }, []);
    // Data attributes for CLI discovery
    const dataAttrs = {};
    if (name) {
        dataAttrs['data-boneyard'] = name;
        if (snapshotConfig) {
            dataAttrs['data-boneyard-config'] = JSON.stringify(snapshotConfig);
        }
    }
    // Build mode: render fixture (if provided) or children so CLI can capture bones
    if (isBuildMode()) {
        return (_jsx("div", { ref: containerRef, className: className, style: { position: 'relative' }, ...dataAttrs, children: _jsx("div", { children: fixture ?? children }) }));
    }
    // Resolve bones: explicit initialBones > registry lookup
    // Use viewport width to pick breakpoint since bones are keyed by viewport width
    // After mount, use window.innerWidth as fallback so bones render immediately
    // without waiting for ResizeObserver. Before mount (SSR/hydration), use 0
    // to avoid hydration mismatch.
    const [mounted, setMounted] = useState(false);
    useLayoutEffect(() => { setMounted(true); }, []);
    const effectiveBones = initialBones ?? (name ? getRegisteredBones(name) : undefined);
    const viewportWidth = mounted && typeof window !== 'undefined' ? window.innerWidth : 0;
    // Which width selects the breakpoint. 'container' (default) keeps the
    // container-query behavior; 'viewport' matches how the CLI keys captures,
    // for app-shell layouts where the container is narrower than the window (#92).
    const effectiveSelect = select ?? globalConfig.select ?? 'container';
    const resolveWidth = effectiveSelect === 'viewport'
        ? (viewportWidth > 0 ? viewportWidth : containerWidth)
        : (containerWidth > 0 ? containerWidth : viewportWidth);
    const activeBones = effectiveBones && resolveWidth > 0
        ? resolveResponsive(effectiveBones, resolveWidth)
        : null;
    const resolvedBoneClass = boneClass ?? globalConfig.boneClass;
    // Stagger: delay between each bone's animation
    const staggerMs = (() => { const v = stagger ?? globalConfig.stagger; return v === true ? 80 : v === false || !v ? 0 : v; })();
    // Transition: fade out skeleton when loading ends
    const transitionMs = (() => { const v = transition ?? globalConfig.transition; return v === true ? 300 : v === false || !v ? 0 : v; })();
    const [transitioning, setTransitioning] = useState(false);
    const prevLoadingRef = useRef(loading);
    const transitionTimerRef = useRef(null);
    // Derive `transitioning` during render, not in an effect: the overlay must
    // stay mounted in the same commit where `loading` flips false, or it
    // unmounts and remounts at opacity 0 with nothing to transition from (#109).
    if (prevLoadingRef.current !== loading) {
        const ending = prevLoadingRef.current && !loading && transitionMs > 0 && activeBones;
        prevLoadingRef.current = loading;
        setTransitioning(!!ending);
    }
    useEffect(() => {
        if (!transitioning)
            return;
        transitionTimerRef.current = setTimeout(() => {
            setTransitioning(false);
            transitionTimerRef.current = null;
        }, transitionMs);
        return () => {
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current);
                transitionTimerRef.current = null;
            }
        };
    }, [transitioning, transitionMs]);
    const showSkeleton = (loading || transitioning) && activeBones;
    const showFallback = loading && !activeBones && !transitioning;
    // Scale vertical positions to match actual container height
    const effectiveHeight = containerHeight > 0 ? containerHeight : activeBones?.height ?? 0;
    const capturedHeight = activeBones?.height ?? 0;
    const scaleY = (effectiveHeight > 0 && capturedHeight > 0) ? effectiveHeight / capturedHeight : 1;
    return (_jsxs("div", { ref: containerRef, className: className, 
        // minHeight reserves the captured height while the skeleton shows: the
        // overlay is position:absolute, so with empty children (BoneSuspense
        // renders `{null}`) the container would otherwise collapse to 0px and
        // clip the bones (#110). Removed once real content takes over.
        style: { position: 'relative', minHeight: showSkeleton && effectiveHeight > 0 ? effectiveHeight : undefined }, "aria-busy": loading || undefined, ...dataAttrs, children: [_jsx("div", { "data-boneyard-content": "true", style: showSkeleton && !transitioning ? { visibility: 'hidden' } : undefined, children: showFallback ? fallback : children }), showSkeleton && (_jsx("div", { "data-boneyard-overlay": "true", style: {
                    position: 'absolute', inset: 0, overflow: 'hidden',
                    opacity: transitioning ? 0 : 1,
                    transition: transitionMs > 0 ? `opacity ${transitionMs}ms ease-out` : undefined,
                    // An opacity:0 element still hit-tests — without this the fading
                    // overlay swallows clicks meant for the revealed content (#109).
                    pointerEvents: 'none',
                }, children: _jsxs("div", { style: { position: 'relative', width: '100%', height: '100%' }, children: [activeBones.bones.filter(raw => !normalizeBone(raw).c).map((raw, i) => {
                            const b = normalizeBone(raw);
                            const boneColor = resolvedColor;
                            const lighterColor = adjustColor(resolvedColor, isDark ? PULSE.darkAdjust : PULSE.lightAdjust);
                            const capturedPxW = (b.w / 100) * (activeBones.width ?? 0);
                            const isCircle = b.r === '50%' && Math.abs(capturedPxW - b.h) < 4;
                            const boneStyle = {
                                position: 'absolute',
                                left: `${b.x}%`,
                                top: b.y * scaleY,
                                width: isCircle ? b.h * scaleY : `${b.w}%`,
                                height: b.h * scaleY,
                                borderRadius: typeof b.r === 'string' ? b.r : `${b.r}px`,
                                backgroundColor: boneColor,
                            };
                            const effectiveSpeed = globalConfig.speed;
                            if (animationStyle === 'pulse') {
                                boneStyle.animation = `bp-${uid} ${effectiveSpeed ?? PULSE.speed} ease-in-out infinite`;
                            }
                            else if (animationStyle === 'shimmer') {
                                const shimmerHighlight = isDark
                                    ? (globalConfig.darkShimmerColor ?? SHIMMER.darkHighlight)
                                    : (globalConfig.shimmerColor ?? SHIMMER.lightHighlight);
                                const angle = globalConfig.shimmerAngle ?? SHIMMER.angle;
                                delete boneStyle.backgroundColor;
                                boneStyle.backgroundImage = `linear-gradient(${angle}deg, ${boneColor} ${SHIMMER.start}%, ${shimmerHighlight} 50%, ${boneColor} ${SHIMMER.end}%)`;
                                boneStyle.backgroundSize = '200% 100%';
                                boneStyle.animation = `bs-${uid} ${effectiveSpeed ?? SHIMMER.speed} linear infinite`;
                            }
                            if (staggerMs > 0) {
                                boneStyle.opacity = 0;
                                boneStyle.animation = `${boneStyle.animation ? boneStyle.animation + ',' : ''} by-${uid} 0.3s ease-out ${i * staggerMs}ms forwards`;
                            }
                            return _jsx("div", { "data-boneyard-bone": "true", className: resolvedBoneClass, style: boneStyle }, i);
                        }), animationStyle === 'pulse' && (_jsx("style", { children: `@keyframes bp-${uid}{0%,100%{background-color:${resolvedColor}}50%{background-color:${adjustColor(resolvedColor, isDark ? PULSE.darkAdjust : PULSE.lightAdjust)}}}` })), animationStyle === 'shimmer' && (_jsx("style", { children: `@keyframes bs-${uid}{0%{background-position:200% 0}100%{background-position:-200% 0}}` })), staggerMs > 0 && (_jsx("style", { children: `@keyframes by-${uid}{from{opacity:0}to{opacity:1}}` }))] }) }))] }));
}
/**
 * Suspense-aware skeleton wrapper. Use with React's `<Suspense>` model —
 * components that throw promises (e.g., `useSuspenseQuery`) suspend, and a
 * `<Skeleton>` is shown as the fallback.
 *
 * ```tsx
 * <BoneSuspense name="user-card">
 *   <UserCard />  // uses useSuspenseQuery
 * </BoneSuspense>
 * ```
 *
 * At runtime, behaves like `<Suspense fallback={<Skeleton name="..." loading />}>`.
 *
 * At build time (`npx boneyard-js build`), wraps children in `<Suspense>` so a
 * suspending query doesn't crash extraction. The CLI's `--wait` window lets the
 * query resolve naturally; the resolved DOM is then snapshotted. Pass `fixture`
 * for a build-time fallback if the query can't resolve in the wait window.
 */
export function BoneSuspense({ children, name, initialBones, color, darkColor, animate, stagger, transition, boneClass, className, fallback, fixture, snapshotConfig, select, }) {
    if (isBuildMode()) {
        const dataAttrs = {};
        if (name) {
            dataAttrs['data-boneyard'] = name;
            if (snapshotConfig) {
                dataAttrs['data-boneyard-config'] = JSON.stringify(snapshotConfig);
            }
        }
        return (_jsx("div", { className: className, style: { position: 'relative' }, ...dataAttrs, children: _jsx("div", { children: _jsx(Suspense, { fallback: fixture ?? null, children: children }) }) }));
    }
    const skeletonFallback = (_jsx(Skeleton, { loading: true, name: name, initialBones: initialBones, color: color, darkColor: darkColor, animate: animate, stagger: stagger, transition: transition, boneClass: boneClass, className: className, fallback: fallback, fixture: fixture, snapshotConfig: snapshotConfig, select: select, children: null }));
    return _jsx(Suspense, { fallback: skeletonFallback, children: children });
}
