"use client";

import { useRef, useEffect, useState } from "react";
import { snapshotBones } from "boneyard-js";
import type { Bone } from "boneyard-js";
import { BrowserMockup } from "@/components/browser-mockup";
import { CodeBlock } from "@/components/ui/code-block";

// ── Example component that changes layout at different widths ──
// Uses a width prop to simulate responsive behavior at different breakpoints

function ProductCard({ layout }: { layout: "mobile" | "tablet" | "desktop" }) {
  if (layout === "mobile") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="w-full aspect-square bg-stone-200 rounded-md" />
        <h3 className="text-[14px] font-bold leading-tight">Wireless Headphones</h3>
        <p className="text-[12px] text-stone-500 leading-relaxed">
          Active noise cancellation, 30hr battery.
        </p>
        <span className="text-[16px] font-bold">$249</span>
        <button className="w-full py-2 bg-stone-900 text-white text-[12px] rounded-md">Add to Cart</button>
      </div>
    );
  }

  if (layout === "tablet") {
    return (
      <div className="flex gap-4">
        <div className="w-[140px] h-[140px] bg-stone-200 rounded-md shrink-0" />
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className="text-[14px] font-bold leading-tight">Wireless Headphones</h3>
          <p className="text-[12px] text-stone-500 leading-relaxed">
            Active noise cancellation, 30hr battery. Premium comfort for all-day listening.
          </p>
          <span className="text-[16px] font-bold mt-1">$249</span>
          <button className="w-[120px] py-1.5 bg-stone-900 text-white text-[12px] rounded-md mt-1">Add to Cart</button>
        </div>
      </div>
    );
  }

  // desktop
  return (
    <div className="flex gap-5 items-start">
      <div className="w-[180px] h-[180px] bg-stone-200 rounded-md shrink-0" />
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <h3 className="text-[16px] font-bold leading-tight">Wireless Headphones</h3>
        <p className="text-[13px] text-stone-500 leading-relaxed">
          Active noise cancellation, 30hr battery life. Premium comfort designed for all-day listening with adaptive EQ.
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[18px] font-bold">$249</span>
          <span className="text-[12px] text-stone-400 line-through">$349</span>
        </div>
      </div>
      <button className="px-4 py-2 bg-stone-900 text-white text-[12px] rounded-md shrink-0">Add to Cart</button>
    </div>
  );
}

// ── Skeleton extractor ──

function SkeletonPreview({ children }: { children: React.ReactNode }) {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [bones, setBones] = useState<{ bones: Bone[]; height: number } | null>(null);

  useEffect(() => {
    if (!sourceRef.current) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!sourceRef.current) return;
        try {
          const result = snapshotBones(sourceRef.current, "responsive-demo");
          setBones(result);
        } catch {}
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative">
      <div ref={sourceRef} style={bones ? { visibility: "hidden", position: "absolute" } : undefined}>
        {children}
      </div>
      {bones && (
        <div className="relative w-full" style={{ height: bones.height }}>
          {bones.bones.map((b: Bone, i: number) => (
            <div
              key={i}
              className="bone absolute"
              style={{
                left: `${b.x}%`,
                top: b.y,
                width: `${b.w}%`,
                height: b.h,
                borderRadius: typeof b.r === "string" ? b.r : `${b.r}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──

export default function ResponsivePage() {
  return (
    <div className="max-w-[720px] px-6 pt-14 pb-12 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Responsive</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          Boneyard captures your layout at multiple breakpoints automatically. The right skeleton
          is selected at runtime based on the container width — no media queries, no manual work.
        </p>
      </div>

      {/* How it works */}
      <section>
        <div className="section-divider">
          <span>How it works</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          When you run{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">npx boneyard-js build</code>,
          Playwright visits your page at multiple breakpoints and snapshots the DOM at each one.
          If you have Tailwind, it auto-detects your breakpoints — <strong className="text-stone-600">375, 640, 768, 1024, 1280, 1536px</strong>.
          Without Tailwind, it falls back to 375, 768, 1280px. All breakpoints are stored
          in a single{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">.bones.json</code> file.
        </p>
        <p className="text-[14px] text-[#78716c] leading-relaxed mb-4">
          At runtime, the{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">&lt;Skeleton&gt;</code>{" "}
          component uses a{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">ResizeObserver</code>{" "}
          to measure its container and picks the closest breakpoint. When the window resizes,
          it swaps to the matching skeleton automatically.
        </p>
      </section>

      {/* Breakpoint examples */}
      <section>
        <div className="section-divider">
          <span>Same component, different breakpoints</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-6">
          The same product card at mobile, tablet, and desktop widths. Each skeleton
          matches the actual layout at that size.
        </p>

        <div className="space-y-6">
          {[
            { layout: "mobile" as const, label: "375px", tag: "mobile", width: 220 },
            { layout: "tablet" as const, label: "768px", tag: "tablet", width: 400 },
            { layout: "desktop" as const, label: "1280px", tag: "desktop", width: undefined },
          ].map(({ layout, label, tag, width }) => (
            <div key={label}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[12px] font-mono text-stone-400">{label}</span>
                <span className="text-[11px] text-stone-300">{tag}</span>
              </div>
              <div style={width ? { maxWidth: width } : undefined}>
                <BrowserMockup url="skeleton">
                  <SkeletonPreview>
                    <ProductCard layout={layout} />
                  </SkeletonPreview>
                </BrowserMockup>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Output format */}
      <section>
        <div className="section-divider">
          <span>What the JSON looks like</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Each{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">.bones.json</code>{" "}
          file contains all breakpoints in a single object. The{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">x</code> and{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">w</code>{" "}
          values are percentages of the container width, so they scale naturally.
        </p>
        <CodeBlock
          filename="dashboard.bones.json"
          language="json"
          code={`{
  <span class="text-[#93c5fd]">"breakpoints"</span>: {
    <span class="text-[#93c5fd]">"375"</span>: {
      <span class="text-[#93c5fd]">"width"</span>: <span class="text-[#fbbf24]">343</span>,
      <span class="text-[#93c5fd]">"height"</span>: <span class="text-[#fbbf24]">198</span>,
      <span class="text-[#93c5fd]">"bones"</span>: [
        [<span class="text-[#fbbf24]">0</span>, <span class="text-[#fbbf24]">0</span>, <span class="text-[#fbbf24]">38.2</span>, <span class="text-[#fbbf24]">17</span>, <span class="text-[#fbbf24]">8</span>],
        <span class="text-stone-500">// ...</span>
      ]
    },
    <span class="text-[#93c5fd]">"768"</span>: { <span class="text-stone-500">/* tablet bones */</span> },
    <span class="text-[#93c5fd]">"1280"</span>: { <span class="text-stone-500">/* desktop bones */</span> }
  }
}`}
        />
      </section>

      {/* Custom breakpoints */}
      <section>
        <div className="section-divider">
          <span>Custom breakpoints</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Tailwind breakpoints are auto-detected. Without Tailwind, the defaults are 375, 768, 1280.
          You can override them via{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">boneyard.config.json</code>{" "}
          or the CLI flag.
        </p>
        <CodeBlock
          filename="boneyard.config.json"
          language="json"
          code={`{
  <span class="text-[#93c5fd]">"breakpoints"</span>: [<span class="text-[#fbbf24]">390</span>, <span class="text-[#fbbf24]">820</span>, <span class="text-[#fbbf24]">1440</span>]
}`}
        />
        <p className="text-[13px] text-stone-400 mt-2 mb-4">
          Or pass directly: <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build --breakpoints 390,820,1440</code>
        </p>
      </section>

      {/* How selection works */}
      <section>
        <div className="section-divider">
          <span>How breakpoint selection works</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
          <ul className="text-[13px] text-[#78716c] space-y-1.5 list-disc pl-4">
            <li>
              <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">&lt;Skeleton&gt;</code>{" "}
              measures its container width with{" "}
              <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">ResizeObserver</code>
            </li>
            <li>
              Picks the largest breakpoint that fits (e.g., 500px container → uses 375px bones)
            </li>
            <li>
              Updates automatically on resize — no re-render needed, just swaps the bone set
            </li>
            <li>
              <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">x</code> and{" "}
              <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">w</code>{" "}
              are stored as percentages, so bones scale smoothly within a breakpoint range
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
