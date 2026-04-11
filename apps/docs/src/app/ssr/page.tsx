"use client";

import { useRef, useEffect, useState } from "react";
import { snapshotBones } from "boneyard-js";
import type { Bone } from "boneyard-js";
import { BrowserMockup } from "@/components/browser-mockup";
import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "how-it-works", label: "How it works" },
  { id: "live-examples", label: "Live examples" },
  { id: "when-to-use-ssr-skeletons", label: "When to use SSR skeletons" },
  { id: "why-boneyard-is-ssr-friendly", label: "Why boneyard is SSR-friendly" },
];

// ── Example components ──

function NotificationList() {
  return (
    <div className="flex flex-col divide-y divide-stone-100">
      {[
        { initials: "AK", name: "Anna Kim", text: "Merged PR #142 into main", time: "2m" },
        { initials: "TL", name: "Tom Lee", text: "Commented on your review", time: "8m" },
        { initials: "SR", name: "Sara R.", text: "Assigned you to INFRA-301", time: "15m" },
      ].map((n, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500 shrink-0">
            {n.initials}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold truncate">{n.name}</span>
              <span className="text-[11px] text-stone-400 shrink-0">{n.time}</span>
            </div>
            <span className="text-[12px] text-stone-500 truncate">{n.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsRow() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: "Requests", value: "12.4K" },
        { label: "Latency", value: "42ms" },
        { label: "Errors", value: "0.02%" },
      ].map((s, i) => (
        <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-stone-50">
          <span className="text-[11px] text-stone-400 uppercase tracking-wider">{s.label}</span>
          <span className="text-[18px] font-bold">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function PostCard() {
  return (
    <div className="flex gap-3">
      <img
        src="https://picsum.photos/seed/ssr-avatar/40/40"
        alt="avatar"
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">Marcus J.</span>
          <span className="text-[11px] text-stone-400">@marcusj</span>
          <span className="text-[11px] text-stone-400">3m</span>
        </div>
        <p className="text-[13px] text-stone-600 leading-relaxed">
          Just shipped the new dashboard. Feels good to see real metrics after weeks of placeholder data.
        </p>
        <div className="flex gap-4 mt-1">
          <span className="text-[11px] text-stone-400">12 replies</span>
          <span className="text-[11px] text-stone-400">38 likes</span>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton renderer (extracts bones from real component) ──

function SkeletonPreview({ children }: { children: React.ReactNode }) {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [bones, setBones] = useState<{ bones: Bone[]; height: number } | null>(null);

  useEffect(() => {
    if (!sourceRef.current) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!sourceRef.current) return;
        try {
          const result = snapshotBones(sourceRef.current, "ssr-demo");
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

export default function SSRPage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Server-Side Rendering</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          Boneyard is inherently SSR-friendly. The CLI pre-computes your skeleton layout at build time
          into <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">.bones.json</code> files —
          so the skeleton is ready to render on the very first frame. No runtime DOM measurement,
          no layout shift, no waiting for JavaScript to hydrate.
        </p>
      </div>

      {/* How it works */}
      <section>
        <div className="section-divider" id="how-it-works">
          <span>How it works</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Pass a{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">fixture</code>{" "}
          prop with representative placeholder data to your{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">&lt;Skeleton&gt;</code>.
          At build time, Playwright renders this fixture, snapshots the real DOM layout, and writes
          the exact pixel positions to a{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">.bones.json</code>{" "}
          file. At runtime, import that file as{" "}
          <code className="text-[12px] bg-stone-100 px-1.5 py-0.5 rounded">initialBones</code>{" "}
          — the skeleton renders instantly from the pre-generated data, no runtime DOM measurement needed.
        </p>
      </section>

      {/* Live examples */}
      <section>
        <div className="section-divider" id="live-examples">
          <span>Live examples</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-6">
          Real components on the left, their extracted skeletons on the right.
        </p>

        <div className="space-y-8">
          {/* Notifications */}
          <div>
            <p className="text-[12px] text-stone-400 mb-2">Notification list</p>
            <CodeBlock
              filename="app/page.tsx"
              language="tsx"
              code={`<span class="text-[#c084fc]">import</span> { Skeleton } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">"boneyard-js/react"</span>
<span class="text-[#c084fc]">import</span> bones <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">"./bones/notifications.bones.json"</span>

<span class="text-stone-500">// Fixture — representative data for build-time snapshot</span>
<span class="text-[#c084fc]">const</span> fixture = [
  { name: <span class="text-[#86efac]">"Anna Kim"</span>, text: <span class="text-[#86efac]">"Merged PR #142"</span> },
  { name: <span class="text-[#86efac]">"Tom Lee"</span>, text: <span class="text-[#86efac]">"Commented on review"</span> },
  { name: <span class="text-[#86efac]">"Sara R."</span>, text: <span class="text-[#86efac]">"Assigned you to INFRA-301"</span> },
]

<span class="text-[#c084fc]">export default function</span> <span class="text-[#fde68a]">Page</span>() {
  <span class="text-[#c084fc]">const</span> { data, isLoading } = <span class="text-[#fde68a]">useFetch</span>(<span class="text-[#86efac]">"/api/notifications"</span>)

  <span class="text-[#c084fc]">return</span> (
    &lt;<span class="text-[#fde68a]">Skeleton</span>
      <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"notifications"</span>
      <span class="text-[#93c5fd]">loading</span>={isLoading}
      <span class="text-[#93c5fd]">fixture</span>={fixture}
      <span class="text-[#93c5fd]">initialBones</span>={bones}
    &gt;
      &lt;<span class="text-[#fde68a]">NotificationList</span> data={data ?? fixture} /&gt;
    &lt;/<span class="text-[#fde68a]">Skeleton</span>&gt;
  )
}`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <BrowserMockup url="localhost:3000">
                <NotificationList />
              </BrowserMockup>
              <BrowserMockup url="SSR skeleton">
                <SkeletonPreview>
                  <NotificationList />
                </SkeletonPreview>
              </BrowserMockup>
            </div>
          </div>

          {/* Stats */}
          <div>
            <p className="text-[12px] text-stone-400 mb-2">Dashboard stats</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BrowserMockup url="localhost:3000">
                <StatsRow />
              </BrowserMockup>
              <BrowserMockup url="SSR skeleton">
                <SkeletonPreview>
                  <StatsRow />
                </SkeletonPreview>
              </BrowserMockup>
            </div>
          </div>

          {/* Post */}
          <div>
            <p className="text-[12px] text-stone-400 mb-2">Feed post</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BrowserMockup url="localhost:3000">
                <PostCard />
              </BrowserMockup>
              <BrowserMockup url="SSR skeleton">
                <SkeletonPreview>
                  <PostCard />
                </SkeletonPreview>
              </BrowserMockup>
            </div>
          </div>
        </div>
      </section>

      {/* When to use */}
      <section>
        <div className="section-divider" id="when-to-use-ssr-skeletons">
          <span>When to use SSR skeletons</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
          <ul className="text-[13px] text-[#78716c] space-y-1.5 list-disc pl-4">
            <li>
              <strong className="text-stone-600">React Server Components</strong> — skeleton loads with the page, not after hydration
            </li>
            <li>
              <strong className="text-stone-600">Static sites / SSG</strong> — bake skeletons into the build output
            </li>
            <li>
              <strong className="text-stone-600">Edge functions</strong> — render skeletons at the edge with zero runtime cost
            </li>
            <li>
              <strong className="text-stone-600">Non-React apps</strong> — <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">renderBones</code> returns an HTML string for any template engine
            </li>
          </ul>
        </div>
      </section>

      {/* Why it works */}
      <section>
        <div className="section-divider" id="why-boneyard-is-ssr-friendly">
          <span>Why boneyard is SSR-friendly</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
          <p className="text-[13px] text-[#78716c]">
            Most skeleton libraries measure the DOM at runtime — which means the skeleton can&apos;t render
            until JavaScript loads and hydrates. Boneyard works differently:
          </p>
          <ul className="text-[13px] text-[#78716c] space-y-1.5 list-disc pl-4 mt-2">
            <li>
              <strong className="text-stone-600">Bones are pre-computed at build time</strong> — the CLI snapshots your real
              layout and saves it as static JSON
            </li>
            <li>
              <strong className="text-stone-600">No runtime DOM measurement</strong> — <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">&lt;Skeleton&gt;</code> reads
              from the JSON, not from <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">getBoundingClientRect</code>
            </li>
            <li>
              <strong className="text-stone-600">Same API everywhere</strong> — use <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">initialBones</code> or
              the registry. Works the same in SSR, SSG, SPAs, and edge functions
            </li>
            <li>
              <strong className="text-stone-600">Configurable defaults</strong> — set colors, animation, and breakpoints in{" "}
              <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">boneyard.config.json</code>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <TableOfContents items={tocItems} />
    </>
  );
}
