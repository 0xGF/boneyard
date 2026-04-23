"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Skeleton } from "boneyard-js/react";
import { BrowserMockup } from "@/components/browser-mockup";
import { CopyIcon } from "@/components/ui/icons/copy";
import { CheckIcon } from "@/components/ui/icons/check";
import { GitHubStarsButton } from "@/components/animate-ui/components/buttons/github-stars";
import { CopyButton } from "@/components/ui/copy-button";

function useGitHubStars() {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    fetch("https://api.github.com/repos/0xGF/boneyard")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.stargazers_count === "number") setStars(d.stargazers_count);
      })
      .catch(() => { });
  }, []);
  return stars;
}

// ── Dashboard mock UI — boneyard stats ──────────────────────────────────────
// Uses <article> for elements that should be captured as single atomic bones.
// The Skeleton's snapshotConfig uses leafTags: ["article"] so boneyard treats
// each <article> as one flat bone — no inner text/bars leak through.
function DashboardMock() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        <article className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
          <div className="text-[9px] text-emerald-600 font-medium">Downloads</div>
          <div className="text-[13px] font-bold text-emerald-700">18.2k</div>
        </article>
        <article className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="text-[9px] text-blue-600 font-medium">Stars</div>
          <div className="text-[13px] font-bold text-blue-700">4,521</div>
        </article>
        <article className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-2">
          <div className="text-[9px] text-amber-600 font-medium">Bones</div>
          <div className="text-[13px] font-bold text-amber-700">1.2M</div>
        </article>
      </div>
      <article className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-2">
        <div className="flex items-end gap-[2px] h-[36px]">
          {[30, 45, 40, 55, 65, 60, 70, 85, 80, 90, 95, 88].map((h, i) => (
            <div key={i} className="flex-1 bg-indigo-400 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </article>
      <div className="flex flex-col gap-1">
        {["v1.8.1 — 7 bones captured", "v1.8.0 — 12 routes scanned"].map((row, i) => (
          <article key={i} className="h-5 bg-stone-50 border border-stone-100 rounded flex items-center px-2 text-[9px] text-stone-500 truncate">{row}</article>
        ))}
      </div>
    </div>
  );
}

// ── Live side-by-side demo ─────────────────────────────────────────────────
function StaticHeroDemo() {
  return (
    <BrowserMockup url="localhost:3000">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
        {/* Real UI column */}
        <div>
          <div className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-2">Real UI</div>
          <div className="flex items-center gap-1 mb-2">
            <Image src="/logo.png" alt="boneyard" width={80} height={20} className="h-[16px] w-auto" />
          </div>
          <DashboardMock />
        </div>

        {/* Skeleton column — outer shapes only via leafTags */}
        <div>
          <div className="text-[10px] font-medium text-stone-400 uppercase tracking-wide mb-2">Skeleton</div>
          <div className="flex items-center gap-1 mb-2">
            <Image src="/logo.png" alt="boneyard" width={80} height={20} className="h-[16px] w-auto opacity-20" />
          </div>
          <Skeleton
            name="overview-dashboard"
            loading={true}
            animate="shimmer"
            stagger={40}
            snapshotConfig={{ leafTags: ["article"] }}
          >
            <DashboardMock />
          </Skeleton>
        </div>
      </div>
    </BrowserMockup>
  );
}

export default function OverviewPage() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText("npm install boneyard-js").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      {/* Hero */}
      <div className="space-y-6">
        <h1 className="text-[26px] sm:text-[32px] leading-[1.15] font-bold tracking-tight">
          Skeleton screens.
          <br />
          <span className="inline-block">
            <span className="shimmer-text">Automatically generated.</span>
            <span className="shimmer-underline" />
          </span>
        </h1>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleCopy}
            className="group flex items-center h-9 rounded-lg bg-[#1c1917] text-[13px] font-[family-name:var(--font-mono)] text-[#e7e5e4] hover:bg-[#292524] transition-colors overflow-hidden"
          >
            <span className="flex items-center gap-2 px-3.5">
              <span className="text-[#78716c]">$</span>
              npm install boneyard-js
            </span>
            <span className="flex items-center justify-center w-9 h-9 border-l border-white/10 text-[#78716c] group-hover:text-[#a8a29e] transition-colors">
              {copied ? (
                <CheckIcon size={14} />
              ) : (
                <CopyIcon size={14} />
              )}
            </span>
          </button>

          <GitHubStarsButton
            username="0xGF"
            repo="boneyard"
            variant="default"
            size="default"
            className="h-9 bg-[#1c1917] text-white hover:bg-[#292524] border-0 rounded-lg text-[13px]"
          />
        </div>

        <div className="space-y-4 text-[15px] leading-relaxed text-[#78716c]">
          <p>
            <strong className="text-[#1c1917] pr-1">boneyard</strong> snapshots your real
            UI and captures a flat list of skeleton &ldquo;bones&rdquo; &mdash; positioned, sized
            rectangles that mirror the page exactly.
          </p>
          <p>
            No manual measurement. No hand-tuned placeholders. Wrap your component
            in <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> and
            get pixel-perfect skeleton screens that stay in sync
            with your actual layout.
          </p>
        </div>
      </div>

      {/* Browser demo */}
      <StaticHeroDemo />

      {/* How you use it */}
      <div>
        <div className="section-divider">
          <span>How you use it</span>
        </div>

        <div className="mt-4 space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-stone-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
            <div className="min-w-0">
              <p className="text-[14px] text-[#1c1917] font-medium mb-2">Wrap your component</p>
              <div className="relative rounded-lg border border-stone-200 bg-[#1a1a1a] p-4 font-mono text-[13px] leading-relaxed">
                <CopyButton text={`import { Skeleton } from 'boneyard-js/react'\n\n<Skeleton name="blog-card" loading={isLoading}>\n  {data && <BlogCard data={data} />}\n</Skeleton>`} />
                <pre className="whitespace-pre text-stone-300 m-0 overflow-x-auto"><span className="text-[#c084fc]">import</span>{" { Skeleton } "}<span className="text-[#c084fc]">from</span><span className="text-[#86efac]"> &apos;boneyard-js/react&apos;</span>{"\n"}{"\n"}<span className="text-stone-500">{"<"}</span><span className="text-[#fde68a]">Skeleton</span><span className="text-[#93c5fd]"> name</span>=<span className="text-[#86efac]">&quot;blog-card&quot;</span><span className="text-[#93c5fd]"> loading</span>={"{isLoading}"}<span className="text-stone-500">{">"}</span>{"\n"}{"  "}{"{data && "}<span className="text-stone-500">{"<"}</span><span className="text-[#fde68a]">BlogCard</span>{" data={data} "}<span className="text-stone-500">{"/>"}</span>{"}"}{"\n"}<span className="text-stone-500">{"</"}</span><span className="text-[#fde68a]">Skeleton</span><span className="text-stone-500">{">"}</span></pre>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-stone-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
            <div className="min-w-0">
              <p className="text-[14px] text-[#1c1917] font-medium mb-2">Run the CLI once to generate bones</p>
              <div className="relative rounded-lg border border-stone-200 bg-[#1a1a1a] p-4 font-mono text-[13px] leading-relaxed">
                <CopyButton text="npx boneyard-js build" />
                <span className="text-[#a78bfa]">npx</span><span className="text-stone-300"> boneyard-js build</span>
              </div>
              <p className="text-[13px] text-[#78716c] mt-2">
                Auto-detects your running dev server and Tailwind breakpoints. Writes responsive JSON to <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">src/bones/</code> automatically.
                Customize with <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="w-5 h-5 rounded-full bg-stone-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
            <div className="min-w-0">
              <p className="text-[14px] text-[#1c1917] font-medium mb-2">Import the registry once</p>
              <div className="relative rounded-lg border border-stone-200 bg-[#1a1a1a] p-4 font-mono text-[13px] leading-relaxed">
                <CopyButton text={`import './bones/registry'`} />
                <span className="text-[#c084fc]">import</span><span className="text-[#86efac]"> &apos;./bones/registry&apos;</span>
              </div>
              <p className="text-[13px] text-[#78716c] mt-2">
                Add this to your app entry (e.g. <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">layout.tsx</code>). Every <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> auto-resolves its bones by name.
              </p>
            </div>
          </div>
        </div>

        <p className="text-[14px] text-[#78716c] mt-4">
          The skeleton is extracted from your <strong className="text-[#1c1917]">real rendered content</strong>.
          Run <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build</code> once
          to generate bones JSON from your live DOM. Import the registry once and every <code className="text-[13px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> auto-resolves — pixel-perfect, zero layout shift.
        </p>
      </div>

      {/* Why it's fast */}
      <div>
        <div className="section-divider">
          <span>Built for production</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-[13px] font-semibold text-stone-700 mb-1">~7.5KB runtime</p>
            <p className="text-[12px] text-[#78716c] leading-relaxed">
              The React component is tiny. Bones data is static JSON — no layout engine at runtime.
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-[13px] font-semibold text-stone-700 mb-1">Compact format</p>
            <p className="text-[12px] text-[#78716c] leading-relaxed">
              Bones are stored as arrays instead of objects — smaller JSON files, faster parsing.
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-[13px] font-semibold text-stone-700 mb-1">Incremental builds</p>
            <p className="text-[12px] text-[#78716c] leading-relaxed">
              The CLI hashes each skeleton and skips unchanged ones — only modified components are recaptured.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
