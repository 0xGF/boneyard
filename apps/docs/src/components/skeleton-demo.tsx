"use client";

import { useState, useRef, useEffect } from "react";
import type { SkeletonResult } from "boneyard-js";
import { snapshotBones } from "boneyard-js";
import { BrowserMockup } from "@/components/browser-mockup";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/ui/color-picker";
import { SearchIcon } from "@/components/ui/icons/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import type { ResponsiveBones } from "boneyard-js";
import blogBonesJson from "@/bones/blog.bones.json";
import productBonesJson from "@/bones/product.bones.json";
import feedBonesJson from "@/bones/feed.bones.json";
import chatBonesJson from "@/bones/chat.bones.json";
import dashboardBonesJson from "@/bones/dashboard.bones.json";
import ecommerceBonesJson from "@/bones/ecommerce.bones.json";
import articleBonesJson from "@/bones/article.bones.json";

// Pre-generated bones keyed by demoKey
const preGeneratedBones: Record<string, ResponsiveBones> = {
  blog: blogBonesJson as unknown as ResponsiveBones,
  product: productBonesJson as unknown as ResponsiveBones,
  feed: feedBonesJson as unknown as ResponsiveBones,
  chat: chatBonesJson as unknown as ResponsiveBones,
  dashboard: dashboardBonesJson as unknown as ResponsiveBones,
  ecommerce: ecommerceBonesJson as unknown as ResponsiveBones,
  article: articleBonesJson as unknown as ResponsiveBones,
};

function resolveInitialBones(bones: ResponsiveBones, width: number): SkeletonResult | null {
  const bps = Object.keys(bones.breakpoints).map(Number).sort((a, b) => a - b);
  if (bps.length === 0) return null;
  const match = [...bps].reverse().find((bp) => width >= bp) ?? bps[0];
  return bones.breakpoints[match] ?? null;
}


// ── Real UI components — the skeletons are auto-extracted from these ──

function BlogPostUI() {
  return (
    <div className="flex flex-col gap-3">
      <img src="https://picsum.photos/seed/cabin/600/338" alt="hero" className="w-full aspect-video object-cover rounded-md" />
      <h3 className="text-[15px] font-bold leading-tight">We Moved to a Monorepo and It Broke Everything</h3>
      <p className="text-[13px] leading-[19px] text-stone-500">
        Three weeks of broken builds, circular deps, and one very long Friday. Here&apos;s what we actually learned.
      </p>
      <div className="flex items-center gap-2">
        <img src="https://picsum.photos/seed/jake7/40/40" alt="avatar" className="w-6 h-6 rounded-full object-cover shrink-0" />
        <span className="text-[12px] font-medium text-stone-500">Jake F.</span>
      </div>
    </div>
  );
}

function ProductCardUI() {
  return (
    <div className="flex flex-col gap-2">
      <img src="https://picsum.photos/seed/press/400/300" alt="product" className="w-full aspect-[4/3] object-cover rounded-md" />
      <h3 className="text-[14px] font-bold leading-tight">Aeropress Clear</h3>
      <p className="text-[12px] leading-[17px] text-stone-500">
        Same recipe, now in borosilicate glass. Brews a clean cup in 90 seconds.
      </p>
      <div className="font-mono text-[16px] font-bold">$40</div>
      <Button className="w-full text-[12px]" size="sm">Add to Cart</Button>
    </div>
  );
}

function SocialFeedUI() {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <img src="https://picsum.photos/seed/rach/40/40" alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold">Rachel</span>
            <span className="text-[11px] text-stone-400">@rachbreaks</span>
          </div>
        </div>
        <p className="text-[13px] leading-[18px] text-stone-500">
          finally got the espresso dial-in right. 18g in, 36g out, 28 seconds. took me three months and 4 kg of beans.
        </p>
        <img src="https://picsum.photos/seed/latte/600/338" alt="post" className="w-full aspect-video object-cover rounded-md" />
        <span className="text-[11px] text-stone-400">89 likes · 14 reposts</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <img src="https://picsum.photos/seed/dvd/40/40" alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold">David P.</span>
            <span className="text-[11px] text-stone-400">@dvdp</span>
          </div>
        </div>
        <p className="text-[13px] leading-[18px] text-stone-500">
          just realized I mass-renamed a prod table in a migration. deploy went out 4 min ago. currently sprinting.
        </p>
        <span className="text-[11px] text-stone-400">312 likes · 89 reposts</span>
      </div>
    </div>
  );
}

function ChatThreadUI() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-1.5">
        <img src="https://picsum.photos/seed/meg/30/30" alt="avatar" className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
        <div className="bg-stone-100 rounded-lg rounded-tl-none px-2.5 py-1.5 text-[13px] leading-[18px]">
          the deploy went out but I think the migration is stuck
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-stone-900 text-white rounded-lg rounded-tr-none px-2.5 py-1.5 text-[13px] leading-[18px]">
          which env? staging or prod
        </div>
      </div>
      <div className="flex items-start gap-1.5">
        <img src="https://picsum.photos/seed/meg/30/30" alt="avatar" className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
        <div className="bg-stone-100 rounded-lg rounded-tl-none px-2.5 py-1.5 text-[13px] leading-[18px]">
          staging. the users table alter has been running for 9 min
        </div>
      </div>
      <div className="flex justify-end">
        <div className="bg-stone-900 text-white rounded-lg rounded-tr-none px-2.5 py-1.5 text-[13px] leading-[18px]">
          on it, checking pg_stat_activity rn
        </div>
      </div>
    </div>
  );
}

function DashboardUI() {
  return (
    <div className="flex flex-col gap-4">
      {/* Nav bar */}
      <div className="flex items-center gap-3 h-12 bg-stone-100 rounded-lg px-3">
        <div className="w-6 h-6 rounded bg-stone-900 flex items-center justify-center text-white text-[10px] font-bold">S</div>
        <span className="text-[13px] font-semibold text-stone-600">Splitwise</span>
        <div className="flex-1" />
        <img src="https://picsum.photos/seed/nat/40/40" alt="avatar" className="w-7 h-7 rounded-full object-cover" />
      </div>
      {/* Stats row */}
      <div className="flex gap-3">
        {[
          { label: "You owe", value: "$48.20" },
          { label: "Owed to you", value: "$124.50" },
          { label: "Settled", value: "17" },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 flex flex-col gap-1 bg-stone-50 rounded-lg p-3 border border-stone-100">
            <span className="text-[11px] text-stone-400 uppercase tracking-wider">{stat.label}</span>
            <span className="text-[18px] font-bold text-stone-800">{stat.value}</span>
          </div>
        ))}
      </div>
      {/* Main content */}
      <div className="flex gap-3">
        {/* Left: chart area */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="w-full aspect-[2/1] bg-stone-50 rounded-lg border border-stone-100 p-3 flex items-end gap-1">
            {[30, 55, 40, 70, 45, 60, 80, 50, 65, 75, 42, 88].map((h, i) => (
              <div key={i} className="flex-1 bg-stone-300 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="h-4 w-3/4 bg-stone-100 rounded" />
          <div className="h-4 w-1/2 bg-stone-100 rounded" />
        </div>
        {/* Right: list */}
        <div className="flex flex-col gap-2 w-[180px]">
          {["Dinner — $67.40", "Groceries — $34.12", "Uber — $18.90", "Coffee — $5.50"].map((item, i) => (
            <div key={i} className="h-8 bg-stone-50 border border-stone-100 rounded-md flex items-center px-2">
              <span className="text-[11px] text-stone-500 truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EcommerceGridUI() {
  const productImgs = [
    { name: "Ceramic Pour-Over", price: "$34", imgSeed: "ceramic" },
    { name: "Wool Beanie", price: "$28", imgSeed: "beanie" },
    { name: "Field Notes 3-Pack", price: "$15", imgSeed: "notes" },
  ];
  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="h-10 bg-stone-100 rounded-full flex items-center px-4">
        <SearchIcon size={14} className="text-stone-400 mr-2" />
        <span className="text-[13px] text-stone-400">Search products...</span>
      </div>
      {/* Product grid */}
      <div className="flex gap-3">
        {productImgs.map((product) => (
          <div key={product.name} className="flex-1 flex flex-col gap-1.5">
            <img src={`https://picsum.photos/seed/${product.imgSeed}/200/200`} alt="product" className="w-full aspect-square object-cover rounded-md" />
            <span className="text-[13px] font-semibold text-stone-700 leading-tight">{product.name}</span>
            <span className="text-[12px] font-mono font-bold text-stone-500">{product.price}</span>
            <Button size="sm" className="h-8 text-[11px]">Add to Cart</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticleUI() {
  return (
    <div className="flex flex-col gap-3">
      {/* Hero image */}
      <img src="https://picsum.photos/seed/ridge/700/280" alt="hero" className="w-full aspect-[2.5/1] object-cover rounded-lg" />
      {/* Category badge */}
      <div className="w-20 h-6 bg-stone-100 rounded-xl flex items-center justify-center">
        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Opinion</span>
      </div>
      {/* Title */}
      <h2 className="text-[17px] font-bold leading-tight text-stone-800">
        Your Startup Doesn't Need a Design System Yet
      </h2>
      {/* Author row */}
      <div className="flex items-center gap-2">
        <img src="https://picsum.photos/seed/ren/50/50" alt="avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-stone-700">Ren Watanabe</span>
          <span className="text-[11px] text-stone-400">Jan 9, 2025 · 6 min read</span>
        </div>
      </div>
      {/* Paragraph */}
      <p className="text-[13px] leading-[20px] text-stone-500">
        Every three months someone on the team proposes building a design system. Tokens, primitives, a Figma library, the works. We're twelve people. We have nine screens.
      </p>
      {/* Paragraph */}
      <p className="text-[13px] leading-[20px] text-stone-500">
        The impulse is understandable — consistency matters. But the cost of maintaining shared abstractions at this stage almost always outweighs the benefit.
      </p>
      {/* Pull quote */}
      <div className="h-[60px] bg-stone-50 border-l-4 border-stone-300 rounded flex items-center px-4">
        <span className="text-[13px] italic text-stone-500">Ship the tenth screen first. Then talk about systems.</span>
      </div>
      {/* Paragraph */}
      <p className="text-[13px] leading-[20px] text-stone-500">
        Copy-paste is underrated. A component you copied and tweaked for one page is faster to build, easier to delete, and won't break four other pages when you change it.
      </p>
    </div>
  );
}

const demoComponents: Record<string, { label: string; description: string; Component: () => React.JSX.Element }> = {
  blog: { label: "Blog Post", description: "Hero image, title, excerpt, author row.", Component: BlogPostUI },
  product: { label: "Product Card", description: "Image, price, CTA button.", Component: ProductCardUI },
  feed: { label: "Social Feed", description: "Avatars, text, images, engagement counts.", Component: SocialFeedUI },
  chat: { label: "Chat Thread", description: "Alternating bubbles with mixed widths.", Component: ChatThreadUI },
  dashboard: { label: "Dashboard", description: "Nav, stats, chart, sidebar list.", Component: DashboardUI },
  ecommerce: { label: "Product Grid", description: "Search bar, image grid, buttons.", Component: EcommerceGridUI },
  article: { label: "Article", description: "Hero, byline, body text, pull quote.", Component: ArticleUI },
};

// ── Texture patterns for skeleton bones ──

type Texture = "solid" | "shimmer" | "pulse";

/** Mix a hex color toward white by `amount` (0–1). */
function lightenHex(color: string, amount: number): string {
  // Handle rgba
  const rgbaMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    const [, r, g, b, a = "1"] = rgbaMatch;
    const newAlpha = Math.min(1, parseFloat(a) + amount * 0.5);
    return `rgba(${r},${g},${b},${newAlpha.toFixed(3)})`;
  }
  // Handle hex
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const nr = Math.round(r + (255 - r) * amount);
    const ng = Math.round(g + (255 - g) * amount);
    const nb = Math.round(b + (255 - b) * amount);
    return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
  }
  return color;
}

function getTextureStyle(texture: Texture, color: string, isDark = false): { className: string; style: React.CSSProperties } {
  const lighterColor = lightenHex(color, isDark ? 0.04 : 0.3);
  switch (texture) {
    case "shimmer":
      return {
        className: "",
        style: {
          background: `linear-gradient(90deg, ${color} 30%, ${lighterColor} 50%, ${color} 70%)`,
          backgroundSize: "200% 100%",
          animation: "shimmer 2.4s linear infinite",
        },
      };
    case "pulse":
      // Pulse animates between color and a lighter shade via CSS color-mix
      return { className: "bone-pulse", style: { '--bone-color': color, '--bone-pulse-mix': isDark ? '6%' : '30%', backgroundColor: color } as React.CSSProperties };
    case "solid":
    default:
      return { className: "", style: { background: color } };
  }
}

// ── Skeleton renderer ──

function SkeletonRenderer({
  bones, height, color, texture, dark = false, stagger = 0,
}: {
  bones: { x: number; y: number; w: number; h: number; r: number | string; c?: boolean }[];
  height: number;
  color: string;
  texture: Texture;
  dark?: boolean;
  stagger?: number;
}) {
  const uid = useRef(Math.random().toString(36).slice(2, 8)).current;
  return (
    <div className="relative w-full" style={{ height }}>
      {bones.map((b, i) => {
        const r = typeof b.r === "string" ? b.r : `${b.r}px`;
        const boneColor = b.c ? lightenHex(color, dark ? 0.03 : 0.45) : color;
        const { className, style: textureStyle } = getTextureStyle(texture, boneColor, dark);
        const staggerStyle: React.CSSProperties = stagger > 0
          ? { opacity: 0, animation: `by-${uid} 0.3s ease-out ${i * stagger}ms forwards` }
          : {};
        return (
          <div
            key={i}
            className={`absolute ${className}`}
            style={{ left: `${b.x}%`, top: b.y, width: `${b.w}%`, height: b.h, borderRadius: r, ...textureStyle, ...staggerStyle }}
          />
        );
      })}
      {stagger > 0 && (
        <style>{`@keyframes by-${uid}{from{opacity:0}to{opacity:1}}`}</style>
      )}
    </div>
  );
}

// ── Demo card: renders real UI, auto-extracts descriptor, shows skeleton ──

// Which demo keys actually have variant data (cycling is only useful for these)
const HAS_VARIANTS = new Set(["blog", "product"]);

// ── Showcase sequence steps ──
interface ShowcaseStep {
  label: string
  apply: (s: {
    setColor: (c: string) => void
    setTexture: (t: Texture) => void
    setDark: (d: boolean) => void
    setStaggerVal: (v: number) => void
    setTransitionVal: (v: number) => void
    setShowContent: (v: boolean) => void
    setSkeletonKey: (fn: (k: number) => number) => void
  }) => void
  durationMs: number
}

const SHOWCASE_STEPS: ShowcaseStep[] = [
  {
    label: "Pulse animation",
    durationMs: 2200,
    apply: (s) => {
      s.setShowContent(false); s.setTexture("pulse"); s.setDark(false);
      s.setColor("#e0e0e0"); s.setStaggerVal(0); s.setTransitionVal(0);
      s.setSkeletonKey(k => k + 1);
    },
  },
  {
    label: "Stagger entrance",
    durationMs: 2500,
    apply: (s) => { s.setStaggerVal(100); s.setSkeletonKey(k => k + 1); },
  },
  {
    label: "Shimmer texture",
    durationMs: 2500,
    apply: (s) => { s.setTexture("shimmer"); s.setStaggerVal(0); s.setSkeletonKey(k => k + 1); },
  },
  {
    label: "Dark mode",
    durationMs: 2200,
    apply: (s) => { s.setDark(true); s.setColor("#2a2a2a"); },
  },
  {
    label: "Stagger + dark",
    durationMs: 2500,
    apply: (s) => { s.setStaggerVal(80); s.setTexture("pulse"); s.setSkeletonKey(k => k + 1); },
  },
  {
    label: "Transition fade out",
    durationMs: 2200,
    apply: (s) => { s.setTransitionVal(400); s.setStaggerVal(0); s.setShowContent(true); },
  },
  {
    label: "Back to skeleton",
    durationMs: 2200,
    apply: (s) => { s.setShowContent(false); s.setSkeletonKey(k => k + 1); },
  },
  {
    label: "Light mode reset",
    durationMs: 2000,
    apply: (s) => {
      s.setDark(false); s.setColor("#e0e0e0"); s.setTransitionVal(0);
      s.setTexture("pulse"); s.setSkeletonKey(k => k + 1);
    },
  },
];

function DemoCard({ demoKey, label, description, Component }: { demoKey: string; label: string; description: string; Component: () => React.JSX.Element }) {
  const uiRef = useRef<HTMLDivElement>(null);
  // Start null to avoid SSR/hydration mismatch; seeded in useEffect after mount
  const [skeleton, setSkeleton] = useState<SkeletonResult | null>(null);

  // Visual-only controls
  const [color, setColor] = useState("#e0e0e0");
  const [texture, setTexture] = useState<Texture>("pulse");
  const [dark, setDark] = useState(false);
  const [staggerVal, setStaggerVal] = useState(0);
  const [transitionVal, setTransitionVal] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [skeletonKey, setSkeletonKey] = useState(0);

  // Showcase auto-play
  const [showcaseActive, setShowcaseActive] = useState(false);
  const [showcaseStep, setShowcaseStep] = useState(-1);
  const showcaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!showcaseActive) {
      if (showcaseTimerRef.current) clearTimeout(showcaseTimerRef.current);
      setShowcaseStep(-1);
      return;
    }
    let step = 0;
    const setters = { setColor, setTexture, setDark, setStaggerVal, setTransitionVal, setShowContent, setSkeletonKey };

    function runStep() {
      if (step >= SHOWCASE_STEPS.length) {
        step = 0; // loop
      }
      setShowcaseStep(step);
      SHOWCASE_STEPS[step].apply(setters);
      showcaseTimerRef.current = setTimeout(() => {
        step++;
        runStep();
      }, SHOWCASE_STEPS[step].durationMs);
    }
    runStep();
    return () => { if (showcaseTimerRef.current) clearTimeout(showcaseTimerRef.current); };
  }, [showcaseActive]);
  const handleDarkToggle = () => {
    setDark((d) => {
      const next = !d;
      setColor(next ? "#2a2a2a" : "#e0e0e0");
      return next;
    });
  };
  const [showJson, setShowJson] = useState(false);
  const [showCode, setShowCode] = useState(true);

  // Seed skeleton from pre-generated bones on mount (runs client-side only)
  useEffect(() => {
    const pre = preGeneratedBones[demoKey];
    if (!pre) return;
    const initial = resolveInitialBones(pre, window.innerWidth);
    if (initial) setSkeleton(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snapshot exact bone positions from real UI — once on mount
  useEffect(() => {
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!uiRef.current) return;
        const firstChild = uiRef.current.firstElementChild;
        if (!firstChild) return;
        try {
          const result = snapshotBones(firstChild, demoKey);
          setSkeleton(result);
          // Register so `npx boneyard-js build` can capture these
          if (typeof window !== 'undefined') {
            const w = window as any;
            w.__BONEYARD_BONES = w.__BONEYARD_BONES ?? {};
            w.__BONEYARD_BONES[demoKey] = result;
          }
        } catch {}
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoKey]);

  const handleColorChange = (newColor: string) => {
    // Convert HSL from ColorPicker to hex for the skeleton renderer
    if (newColor.startsWith("hsl")) {
      const [h, s, l] = newColor.match(/[\d.]+/g)?.map(Number) || [0, 0, 0];
      const lNorm = l / 100;
      const a = (s / 100) * Math.min(lNorm, 1 - lNorm);
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const c = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * c).toString(16).padStart(2, "0");
      };
      setColor(`#${f(0)}${f(8)}${f(4)}`);
    } else {
      setColor(newColor);
    }
  };
  const handleTextureChange = (t: Texture) => setTexture(t);

  return (
    <div className="space-y-0">
      {/* Label */}
      <div className="mb-5">
        <h3 className="text-[15px] font-semibold text-stone-800">{label}</h3>
        <p className="text-[13px] text-stone-400 mt-0.5">{description}</p>
      </div>

      {/* Side-by-side: Real UI | Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Left: Real UI */}
        <div>
          <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5 px-1">Real UI</div>
          <div className={`rounded-xl p-4 overflow-hidden transition-colors duration-200 ${dark ? "bg-[#1A1A1A] [&_*]:text-stone-300 [&_.text-stone-800]:text-stone-200 [&_.text-stone-700]:text-stone-300 [&_.text-stone-600]:text-stone-400 [&_.text-stone-500]:text-stone-400 [&_.text-stone-400]:text-stone-500 [&_.bg-stone-100]:bg-[#2B2B2B] [&_.bg-stone-50]:bg-[#2B2B2B] [&_.bg-stone-300]:bg-stone-600 [&_.bg-stone-900]:bg-[#2B2B2B] [&_.bg-stone-900_*]:text-stone-300 [&_.border-stone-100]:border-[#333]" : "bg-white border border-stone-200"}`}>
            <div ref={uiRef}>
              <Component />
            </div>
          </div>
        </div>

        {/* Right: Skeleton / Content */}
        <div>
          <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5 px-1">
            {showContent ? 'Content' : 'Skeleton'}
          </div>
          <div className={`rounded-xl border p-4 overflow-hidden transition-colors duration-200 relative ${dark ? "bg-[#1c1917] border-stone-700" : "bg-white border-stone-200"}`}>
            {/* Content layer — visibility hidden keeps layout, skeleton covers it */}
            <div
              className={dark ? "[&_*]:text-stone-300 [&_.text-stone-800]:text-stone-200 [&_.text-stone-700]:text-stone-300 [&_.text-stone-600]:text-stone-400 [&_.text-stone-500]:text-stone-400 [&_.bg-stone-100]:bg-[#2B2B2B] [&_.bg-stone-50]:bg-[#2B2B2B]" : ""}
            >
              <Component />
            </div>
            {/* Skeleton overlay */}
            {skeleton && (
              <div
                style={{
                  position: 'absolute',
                  inset: '1rem',
                  opacity: showContent ? 0 : 1,
                  transition: transitionVal > 0 ? `opacity ${transitionVal}ms ease-out` : undefined,
                  pointerEvents: showContent ? 'none' : undefined,
                  background: dark ? '#1c1917' : 'white',
                }}
              >
                <SkeletonRenderer
                  key={skeletonKey}
                  bones={skeleton.bones}
                  height={skeleton.height}
                  color={color}
                  texture={texture}
                  dark={dark}
                  stagger={staggerVal}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 mt-2 overflow-hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          <ColorPicker color={color} onChange={handleColorChange} />

          <div className="w-px h-4 bg-stone-200 mx-1" />

          <Tabs defaultValue="pulse" value={texture} onValueChange={(v) => handleTextureChange(v as Texture)}>
            <TabsList className="h-7">
              {(["pulse", "solid", "shimmer"] as Texture[]).map((t) => (
                <TabsTrigger key={t} value={t} className="text-[11px] h-5 px-2.5 rounded-md">
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="w-px h-4 bg-stone-200 mx-1" />

          <button
            onClick={handleDarkToggle}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
              dark ? "bg-stone-800 text-stone-300" : "bg-stone-100 text-stone-500 hover:bg-stone-200/70"
            }`}
          >
            {dark ? "Dark" : "Light"}
          </button>

          <div className="w-px h-4 bg-stone-200 mx-1" />

          <Tabs
            defaultValue="code"
            value={showJson ? "json" : showCode ? "code" : ""}
            onValueChange={(v) => {
              setShowJson(v === "json" ? !showJson : false);
              setShowCode(v === "code" ? !showCode : false);
            }}
          >
            <TabsList className="h-7">
              <TabsTrigger value="json" className="text-[11px] h-5 px-2.5 rounded-md">
                Descriptor
              </TabsTrigger>
              <TabsTrigger value="code" className="text-[11px] h-5 px-2.5 rounded-md">
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stagger / Transition / Toggle / Reload row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-stone-400 font-mono">stagger</span>
            <input
              type="range"
              min={0}
              max={300}
              step={10}
              value={staggerVal}
              onChange={(e) => { setStaggerVal(Number(e.target.value)); setSkeletonKey(k => k + 1) }}
              className="w-16 h-1 accent-stone-400"
            />
            <span className="text-[10px] text-stone-500 font-mono w-8">{staggerVal}ms</span>
          </div>

          <div className="w-px h-4 bg-stone-200" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-stone-400 font-mono">transition</span>
            <input
              type="range"
              min={0}
              max={1000}
              step={50}
              value={transitionVal}
              onChange={(e) => setTransitionVal(Number(e.target.value))}
              className="w-16 h-1 accent-stone-400"
            />
            <span className="text-[10px] text-stone-500 font-mono w-8">{transitionVal}ms</span>
          </div>

          <div className="w-px h-4 bg-stone-200" />

          <button
            onClick={() => {
              if (showContent && transitionVal > 0) {
                setShowContent(false)
                setSkeletonKey(k => k + 1)
              } else {
                setShowContent(!showContent)
              }
            }}
            className="h-7 px-2.5 rounded-lg text-[11px] font-medium bg-stone-100 text-stone-500 hover:bg-stone-200/70 transition-colors"
          >
            {showContent ? 'Show Skeleton' : 'Show Content'}
          </button>

          <button
            onClick={() => { setShowContent(false); setSkeletonKey(k => k + 1) }}
            className="h-7 px-2 rounded-lg text-[11px] font-medium bg-stone-100 text-stone-500 hover:bg-stone-200/70 transition-colors"
            title="Replay stagger animation"
          >
            Reload
          </button>

          <div className="w-px h-4 bg-stone-200" />

          <button
            onClick={() => setShowcaseActive(a => !a)}
            className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${
              showcaseActive
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200/70"
            }`}
          >
            {showcaseActive ? "Stop" : "Showcase"}
          </button>
        </div>

        {/* Showcase progress */}
        {showcaseActive && showcaseStep >= 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-1">
              {SHOWCASE_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === showcaseStep ? "w-4 bg-stone-700" : i < showcaseStep ? "w-1.5 bg-stone-400" : "w-1.5 bg-stone-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-stone-400 font-mono">{SHOWCASE_STEPS[showcaseStep].label}</span>
          </div>
        )}
      </div>

      {/* Auto-extracted bones JSON */}
      {showJson && skeleton && (
        <div className="relative rounded-xl border border-stone-200 bg-[#1a1a1a] p-3 mt-2 max-h-[300px] overflow-auto">
          <CopyButton text={JSON.stringify(skeleton, null, 2)} />
          <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider mb-2">Auto-extracted via snapshotBones()</div>
          <pre className="text-[11px] font-mono text-stone-400 leading-relaxed">
            {JSON.stringify(skeleton, null, 2)}
          </pre>
        </div>
      )}

      {/* Code — reflects the current control selections */}
      {showCode && (() => {
        const compName = label.replace(/\s+/g, "");
        const colorProp = color !== "#d4d4d4" ? `\n      color="${color}"` : "";
        const animateProp = texture === "solid" ? "\n      animate={false}" : "";
        const staggerProp = staggerVal > 0 ? `\n      stagger={${staggerVal}}` : "";
        const transitionProp = transitionVal > 0 ? `\n      transition={${transitionVal}}` : "";
        const codeStr = `import { Skeleton } from 'boneyard-js/react'\n\nfunction ${compName}Page() {\n  const { data, isLoading } = useFetch('/api/${demoKey}')\n\n  return (\n    <Skeleton\n      loading={isLoading}${colorProp}${animateProp}${staggerProp}${transitionProp}\n    >\n      {data && <${compName} data={data} />}\n    </Skeleton>\n  )\n}`;
        return (
          <div className="relative rounded-xl border border-stone-200 bg-[#1a1a1a] p-4 mt-2 max-h-[400px] overflow-auto">
            <CopyButton text={codeStr} />
            <pre className="text-[11px] font-mono leading-relaxed whitespace-pre">
              <span className="text-[#c084fc]">import</span><span className="text-stone-300"> {"{ Skeleton }"} </span><span className="text-[#c084fc]">from</span><span className="text-[#86efac]"> &apos;boneyard-js/react&apos;</span>{"\n\n"}
              <span className="text-[#c084fc]">function</span><span className="text-[#fde68a]"> {compName}Page</span><span className="text-stone-300">() {"{"}</span>{"\n"}
              <span className="text-stone-300">  </span><span className="text-[#c084fc]">const</span><span className="text-stone-300"> {"{ data, isLoading }"} = </span><span className="text-[#fde68a]">useFetch</span><span className="text-stone-300">(</span><span className="text-[#86efac]">&apos;/api/{demoKey}&apos;</span><span className="text-stone-300">)</span>{"\n\n"}
              <span className="text-stone-300">  </span><span className="text-[#c084fc]">return</span><span className="text-stone-300"> (</span>{"\n"}
              <span className="text-stone-300">    </span><span className="text-stone-500">{"<"}</span><span className="text-[#fde68a]">Skeleton</span>{"\n"}
              <span className="text-stone-300">      </span><span className="text-[#93c5fd]">loading</span><span className="text-stone-300">={"{isLoading}"}</span>{"\n"}
              {color !== "#d4d4d4" && <><span className="text-stone-300">      </span><span className="text-[#93c5fd]">color</span><span className="text-stone-300">=</span><span className="text-[#86efac]">&quot;{color}&quot;</span>{"\n"}</>}
              {texture === "solid" && <><span className="text-stone-300">      </span><span className="text-[#93c5fd]">animate</span><span className="text-stone-300">={"{false}"}</span>{"\n"}</>}
              {staggerVal > 0 && <><span className="text-stone-300">      </span><span className="text-[#93c5fd]">stagger</span><span className="text-stone-300">={"{"}{staggerVal}{"}"}</span>{"\n"}</>}
              {transitionVal > 0 && <><span className="text-stone-300">      </span><span className="text-[#93c5fd]">transition</span><span className="text-stone-300">={"{"}{transitionVal}{"}"}</span>{"\n"}</>}
              <span className="text-stone-300">    </span><span className="text-stone-500">{">"}</span>{"\n"}
              <span className="text-stone-300">      {"{data && "}</span><span className="text-stone-500">{"<"}</span><span className="text-[#fde68a]">{compName}</span><span className="text-stone-300"> data={"{data}"} </span><span className="text-stone-500">{"/>"}</span><span className="text-stone-300">{"}"}</span>{"\n"}
              <span className="text-stone-300">    </span><span className="text-stone-500">{"</"}</span><span className="text-[#fde68a]">Skeleton</span><span className="text-stone-500">{">"}</span>{"\n"}
              <span className="text-stone-300">  )</span>{"\n"}
              <span className="text-stone-300">{"}"}</span>{"\n\n"}
              <span className="text-stone-500">{"// color: bone fill color (default: '#e0e0e0')"}</span>{"\n"}
              <span className="text-stone-500">{"// animate: pulse animation (default: true, set false for solid)"}</span>{"\n"}
              <span className="text-stone-500">{"// The skeleton is generated automatically from your real UI."}</span>
            </pre>
          </div>
        );
      })()}
    </div>
  );
}

export function SkeletonDemos() {
  return (
    <div className="space-y-8">
      {Object.entries(demoComponents).map(([key, { label, description, Component }]) => (
        <DemoCard key={key} demoKey={key} label={label} description={description} Component={Component} />
      ))}
    </div>
  );
}
