"use client";

import { useRef, useEffect, useState } from "react";
import { snapshotBones } from "boneyard-js";
import type { Bone } from "boneyard-js";
import { BrowserMockup } from "@/components/browser-mockup";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "under-the-hood", label: "Under the hood" },
  { id: "layout-api", label: "Layout API" },
];

// ── The example card used across all 3 steps ──

function ExampleCard({ showScanOverlay }: { showScanOverlay?: boolean }) {
  return (
    <div className="flex flex-col gap-3 relative">
      {/* Image placeholder */}
      <div className="relative w-full aspect-video bg-stone-200 rounded-md">
        {showScanOverlay && (
          <div className="absolute inset-0 border-2 border-dashed border-green-500 rounded-md" />
        )}
      </div>
      {/* Title */}
      <div className="relative">
        <h3 className="text-[15px] font-bold leading-tight">Understanding Modern Web Performance</h3>
        {showScanOverlay && (
          <div className="absolute inset-0 border-2 border-dashed border-green-500 rounded" />
        )}
      </div>
      {/* Description */}
      <div className="relative">
        <p className="text-[13px] leading-[19px] text-stone-500">
          Layout shift occurs when visible elements move during page load.
        </p>
        {showScanOverlay && (
          <div className="absolute inset-0 border-2 border-dashed border-green-500 rounded" />
        )}
      </div>
      {/* Avatar row */}
      <div className="flex items-center gap-2 relative">
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-stone-300 shrink-0" />
          {showScanOverlay && (
            <div className="absolute inset-0 border-2 border-dashed border-green-500 rounded-full" />
          )}
        </div>
        <div className="relative">
          <span className="text-[12px] font-medium text-stone-500">Sarah Chen</span>
          {showScanOverlay && (
            <div className="absolute inset-0 border-2 border-dashed border-green-500 rounded" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton extracted from the real ExampleCard ──

function SkeletonCard() {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [bones, setBones] = useState<{ bones: Bone[]; height: number } | null>(null);

  useEffect(() => {
    if (!sourceRef.current) return;
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!sourceRef.current) return;
        try {
          const result = snapshotBones(sourceRef.current, "how-it-works");
          setBones(result);
        } catch {}
      });
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  return (
    <div className="relative">
      {/* Hidden source for extraction */}
      <div ref={sourceRef} style={bones ? { visibility: "hidden", position: "absolute" } : undefined}>
        <ExampleCard />
      </div>
      {/* Rendered skeleton */}
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

export default function HowItWorksPage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">
          How it works
        </h1>
        <p className="text-[15px] text-[#78716c]">
          What happens when you wrap a component with{" "}
          <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">&lt;Skeleton&gt;</code>.
        </p>
      </div>

      {/* Side-by-side: Real UI vs Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2">Your component</div>
          <BrowserMockup url="localhost:3000">
            <ExampleCard />
          </BrowserMockup>
        </div>
        <div>
          <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-2">Generated skeleton</div>
          <BrowserMockup url="localhost:3000">
            <SkeletonCard />
          </BrowserMockup>
        </div>
      </div>

      {/* Under the hood */}
      <div>
        <div className="section-divider" id="under-the-hood">
          <span>Under the hood</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-6">
          Boneyard generates skeletons at build time &mdash; not at runtime.
          Here&apos;s the three-step flow:
        </p>

        <div className="space-y-8">
          {/* Step 1 */}
          <div>
            <h3 className="text-[15px] font-semibold mb-2">1. Wrap</h3>
            <p className="text-[14px] text-[#78716c] leading-relaxed mb-3">
              Wrap your component with{" "}
              <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">&lt;Skeleton name=&quot;blog-card&quot; loading=&#123;isLoading&#125;&gt;</code>.
              When <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">loading</code> is
              false, your children render normally.
            </p>
            <BrowserMockup url="localhost:3000">
              <ExampleCard />
            </BrowserMockup>
          </div>

          {/* Step 2 */}
          <div>
            <h3 className="text-[15px] font-semibold mb-2">2. Build</h3>
            <p className="text-[14px] text-[#78716c] leading-relaxed mb-3">
              Run{" "}
              <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">npx boneyard-js build</code>.
              This launches a headless browser via Playwright, visits your running app at
              multiple breakpoints, and calls{" "}
              <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">getBoundingClientRect()</code>{" "}
              on every visible element inside each named{" "}
              <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">&lt;Skeleton&gt;</code>.
              The exact pixel positions, sizes, and border radii are written to{" "}
              <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">.bones.json</code>{" "}
              files and a{" "}
              <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">registry.js</code>{" "}
              that maps each skeleton name to its bones. Subsequent builds are incremental — only changed components are recaptured.
              Customize breakpoints and defaults with{" "}
              <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">boneyard.config.json</code>.
            </p>
            <BrowserMockup url="localhost:3000">
              <ExampleCard showScanOverlay />
            </BrowserMockup>
          </div>

          {/* Step 3 */}
          <div>
            <h3 className="text-[15px] font-semibold mb-2">3. Render</h3>
            <p className="text-[14px] text-[#78716c] leading-relaxed mb-3">
              Import the generated registry once in your app entry. When{" "}
              <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">loading</code>{" "}
              is true, boneyard looks up the pre-generated bones by name and renders them as
              gray rectangles &mdash; each one an absolutely positioned div matching the exact
              position from the real layout. When loading becomes false, your children
              replace the skeleton with zero layout shift.
            </p>
            <BrowserMockup url="localhost:3000">
              <SkeletonCard />
            </BrowserMockup>
          </div>
        </div>
      </div>

      {/* Layout API */}
      <div>
        <div className="section-divider" id="layout-api">
          <span>Layout API</span>
        </div>
        <div className="mt-4 space-y-5">
          <p className="text-[14px] text-[#78716c] leading-relaxed">
            If you work with descriptors directly, there are two ways to use the layout engine.
            You do not need to switch APIs to benefit from the new performance model.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">Default path</div>
              <h3 className="mt-2 text-[15px] font-semibold">computeLayout(descriptor, width)</h3>
              <p className="mt-2 text-[14px] text-[#78716c] leading-relaxed">
                This is still the default API. It stays backward compatible and is the right choice for most callers.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-[#1a1a1a] p-4 font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-stone-300"><code>{`import { computeLayout } from "boneyard-js";

const result = computeLayout(descriptor, 375);`}</code></pre>
              <div className="mt-3 space-y-2 text-[13px] text-[#78716c] leading-relaxed">
                <p>The first call compiles the descriptor tree.</p>
                <p>Later calls on the same descriptor object reuse that compiled state automatically.</p>
                <p>This means the default path becomes fast after first use.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">Explicit fast path</div>
              <h3 className="mt-2 text-[15px] font-semibold">compileDescriptor(descriptor)</h3>
              <p className="mt-2 text-[14px] text-[#78716c] leading-relaxed">
                Use this when you want explicit control over when the cold step happens.
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-[#1a1a1a] p-4 font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-stone-300"><code>{`import { compileDescriptor, computeLayout } from "boneyard-js";

const compiled = compileDescriptor(descriptor);

const mobile = computeLayout(compiled, 375);
const desktop = computeLayout(compiled, 1280);`}</code></pre>
              <div className="mt-3 space-y-2 text-[13px] text-[#78716c] leading-relaxed">
                <p>The descriptor is compiled up front.</p>
                <p>Every later <code className="font-[family-name:var(--font-mono)] text-[12px] bg-[#f5f5f4] px-1 py-0.5 rounded">computeLayout()</code> call uses the hot relayout path.</p>
                <p>This is best when you know the same descriptor will be reused many times.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-[#f7f4ef] p-4">
            <div className="text-[12px] font-medium text-stone-500">When to use each one</div>
            <div className="mt-3 space-y-2 text-[14px] text-[#78716c] leading-relaxed">
              <p><strong className="text-[#1c1917]">Use the default path</strong> when you want the simplest API, already have working code, or only relayout a descriptor a small number of times.</p>
              <p><strong className="text-[#1c1917]">Use the explicit compiled path</strong> for SSR across several breakpoints, descriptor registries loaded at startup, repeated responsive relayouts, or benchmarks that need to separate cold compile cost from hot relayout cost.</p>
              <p>If your app already calls <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">computeLayout(descriptor, width)</code>, you do not need to rewrite it. <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">compileDescriptor()</code> is an optimization API, not a migration requirement.</p>
              <p>If the same descriptor object is mutated in place later, the engine will detect that and rebuild automatically on the next layout call. <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">invalidateDescriptor(descriptor)</code> is available if you want to force that rebuild immediately.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to use */}
      <div className="border-l-2 border-[#d6d3d1] pl-4 py-1 space-y-2">
        <p className="text-[14px] text-[#78716c]">
          Run{" "}
          <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">npx boneyard-js build</code>{" "}
          to pre-generate bones, then add{" "}
          <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">import &apos;./bones/registry&apos;</code>{" "}
          to your app entry. Every{" "}
          <code className="font-[family-name:var(--font-mono)] text-[13px] bg-[#f5f5f4] px-1.5 py-0.5 rounded">&lt;Skeleton name=&quot;...&quot;&gt;</code>{" "}
          auto-resolves its bones from the registry — no per-component imports needed.
        </p>
      </div>
    </div>

    <TableOfContents items={tocItems} />
    </>
  );
}
