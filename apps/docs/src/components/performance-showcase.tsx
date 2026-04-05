"use client";

import { useEffect, useState } from "react";
import { compileDescriptor, computeLayout, type SkeletonDescriptor, type SkeletonResult } from "boneyard-js";

type BenchmarkRow = {
  label: string;
  description: string;
  avgMs: number;
  speedup?: number;
};

const SAMPLE_DESCRIPTOR: SkeletonDescriptor = {
  display: "flex",
  flexDirection: "column",
  padding: 16,
  gap: 12,
  children: [
    { aspectRatio: 16 / 9, borderRadius: 14 },
    {
      text: "Compiled layout keeps relayouts fast even when titles wrap differently across breakpoints.",
      font: "700 18px Inter",
      lineHeight: 24,
    },
    {
      text: "This sample card has enough nested text and structure to show the cost difference between cold compilation and warmed relayouts.",
      font: "400 14px Inter",
      lineHeight: 20,
      margin: { bottom: 8 },
    },
    {
      display: "flex",
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      children: [
        { width: 40, height: 40, borderRadius: "50%" },
        {
          display: "flex",
          flexDirection: "column",
          gap: 6,
          children: [
            { text: "Jordan Miller", font: "600 14px Inter", lineHeight: 18 },
            { text: "Staff Engineer", font: "400 12px Inter", lineHeight: 16 },
          ],
        },
      ],
    },
  ],
};

const WIDTH = 360;
const WIDTHS = [320, 375, 768];

function cloneDescriptor(): SkeletonDescriptor {
  return structuredClone(SAMPLE_DESCRIPTOR);
}

function compareResults(a: SkeletonResult, b: SkeletonResult): boolean {
  return JSON.stringify(a.bones) === JSON.stringify(b.bones) && a.height === b.height;
}

function measure(iterations: number, fn: () => void): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const end = performance.now();
  return (end - start) / iterations;
}

function SkeletonPreview({ result }: { result: SkeletonResult }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_1px_0_rgba(28,25,23,0.04)]">
      <div className="relative mx-auto w-full max-w-[360px] overflow-hidden rounded-[20px] border border-stone-200 bg-stone-50" style={{ height: result.height }}>
        {result.bones.map((bone, index) => (
          <div
            key={index}
            className="absolute bg-stone-300/80"
            style={{
              left: `${bone.x}%`,
              top: bone.y,
              width: `${bone.w}%`,
              height: bone.h,
              borderRadius: typeof bone.r === "string" ? bone.r : `${bone.r}px`,
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px] text-stone-500">
        <span>{result.bones.length} bones</span>
        <span>{result.height}px tall</span>
      </div>
    </div>
  );
}

export function PerformanceShowcase() {
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [running, setRunning] = useState(false);
  const [rawResult, setRawResult] = useState<SkeletonResult | null>(null);
  const [compiledResult, setCompiledResult] = useState<SkeletonResult | null>(null);
  const parityMatch = rawResult && compiledResult ? compareResults(rawResult, compiledResult) : null;

  const runBenchmarks = () => {
    setRunning(true);
    const nextRows = window.setTimeout(() => {
      const coldMs = measure(1200, () => {
        computeLayout(cloneDescriptor(), WIDTHS[Math.floor(Math.random() * WIDTHS.length)]!, "cold");
      });

      const warmSource = cloneDescriptor();
      for (let i = 0; i < 24; i++) computeLayout(warmSource, WIDTHS[i % WIDTHS.length]!, "warm-prime");
      const warmMs = measure(8000, () => {
        computeLayout(warmSource, WIDTHS[Math.floor(Math.random() * WIDTHS.length)]!, "warm");
      });

      const compiled = compileDescriptor(cloneDescriptor());
      for (let i = 0; i < 24; i++) computeLayout(compiled, WIDTHS[i % WIDTHS.length]!, "compiled-prime");
      const compiledMs = measure(8000, () => {
        computeLayout(compiled, WIDTHS[Math.floor(Math.random() * WIDTHS.length)]!, "compiled");
      });

      setRows([
        {
          label: "Cold compile + layout",
          description: "Brand new descriptor object each pass.",
          avgMs: coldMs,
        },
        {
          label: "Warm descriptor relayout",
          description: "Same descriptor object, cache already populated.",
          avgMs: warmMs,
          speedup: coldMs / warmMs,
        },
        {
          label: "Explicit compiled relayout",
          description: "Precompiled tree reused across widths.",
          avgMs: compiledMs,
          speedup: coldMs / compiledMs,
        },
      ]);
      setRunning(false);
    }, 0);

    return () => window.clearTimeout(nextRows);
  };

  useEffect(() => {
    setRawResult(computeLayout(cloneDescriptor(), WIDTH, "raw-preview"));
    const compiled = compileDescriptor(cloneDescriptor());
    setCompiledResult(computeLayout(compiled, WIDTH, "compiled-preview"));

    const cleanup = runBenchmarks();
    return cleanup;
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="section-divider">
          <span>Performance</span>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight">Compiled layout, visible and measurable.</h1>
            <p className="max-w-[620px] text-[15px] leading-relaxed text-stone-500">
              The layout engine now compiles descriptor trees once, reuses text metrics, and caches subtree relayouts by width.
              The result is the same output with far cheaper repeat work.
            </p>
          </div>
          <button
            onClick={() => { runBenchmarks(); }}
            disabled={running}
            className="shrink-0 rounded-full bg-stone-900 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-wait disabled:bg-stone-400"
          >
            {running ? "Running..." : "Run again"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-stone-400">{row.label}</div>
            <div className="mt-2 text-[34px] font-semibold tracking-tight text-stone-900">{row.avgMs.toFixed(4)}<span className="ml-1 text-[13px] text-stone-400">ms</span></div>
            <p className="mt-2 text-[13px] leading-relaxed text-stone-500">{row.description}</p>
            <div className="mt-4 inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[12px] font-medium text-stone-700">
              {row.speedup ? `${row.speedup.toFixed(1)}x faster than cold` : "baseline"}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="rounded-[28px] border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-stone-400">Layout parity</div>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-stone-900">Raw and compiled output stay identical.</h2>
            </div>
            <div className={`rounded-full px-3 py-1 text-[12px] font-semibold ${parityMatch === null ? "bg-stone-100 text-stone-500" : parityMatch ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {parityMatch === null ? "Measuring..." : parityMatch ? "Matched output" : "Mismatch detected"}
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-[12px] font-medium text-stone-500">Fresh descriptor layout</div>
              {rawResult ? <SkeletonPreview result={rawResult} /> : <div className="h-[320px] rounded-2xl border border-stone-200 bg-stone-100 animate-pulse" />}
            </div>
            <div className="space-y-2">
              <div className="text-[12px] font-medium text-stone-500">Compiled descriptor layout</div>
              {compiledResult ? <SkeletonPreview result={compiledResult} /> : <div className="h-[320px] rounded-2xl border border-stone-200 bg-stone-100 animate-pulse" />}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-stone-200 bg-[#f7f4ef] p-5">
          <div className="text-[11px] uppercase tracking-[0.16em] text-stone-400">What changed</div>
          <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-stone-600">
            <p><strong className="text-stone-900">Cold step:</strong> descriptor trees now compile once into prepared text metrics and reusable node metadata.</p>
            <p><strong className="text-stone-900">Hot step:</strong> relayout reuses subtree caches keyed by width instead of rebuilding measurement state during traversal.</p>
            <p><strong className="text-stone-900">Flex rows:</strong> child fragments are measured once and positioned from the cached fragment data instead of walking the subtree twice.</p>
          </div>
          <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="text-[12px] font-medium text-stone-500">Which API should you use?</div>
            <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-stone-600">
              <p><strong className="text-stone-900">Use `computeLayout(descriptor, width)`</strong> if you want the simplest API. It stays backward compatible, and repeated calls on the same descriptor object automatically reuse the compiled tree.</p>
              <p><strong className="text-stone-900">Use `compileDescriptor(descriptor)` first</strong> if you want explicit control over when the cold step happens, then call `computeLayout(compiled, width)` for guaranteed hot-path relayouts.</p>
              <p>That explicit path is useful for SSR across multiple breakpoints, in-memory descriptor registries, repeated responsive relayouts, and benchmarking cold vs warm work separately.</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="text-[12px] font-medium text-stone-500">Sample parity checks</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] text-stone-600">
              <div className="rounded-xl bg-stone-100 px-3 py-2">
                <div className="text-stone-400">Heights</div>
                <div className="mt-1 font-semibold text-stone-900">{rawResult?.height ?? "—"}{rawResult ? "px" : ""} / {compiledResult?.height ?? "—"}{compiledResult ? "px" : ""}</div>
              </div>
              <div className="rounded-xl bg-stone-100 px-3 py-2">
                <div className="text-stone-400">Bone count</div>
                <div className="mt-1 font-semibold text-stone-900">{rawResult?.bones.length ?? "—"} / {compiledResult?.bones.length ?? "—"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
