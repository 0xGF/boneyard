"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { snapshotBones } from "boneyard-js";
import { Skeleton } from "boneyard-js/react";
import type { SkeletonResult, SnapshotConfig } from "boneyard-js";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

// ── Mock data ────────────────────────────────────────────────────────────────

const users = [
  { name: "Priya Sharma", role: "Engineering Lead", avatar: "a8a29e", status: "online" },
  { name: "Jake Morrison", role: "Product Designer", avatar: "78716c", status: "online" },
  { name: "Lea Chen", role: "Backend Engineer", avatar: "c4b5a2", status: "away" },
  { name: "Tom Nakamura", role: "Data Scientist", avatar: "57534e", status: "offline" },
  { name: "Sarah O'Brien", role: "DevOps", avatar: "d6d3d1", status: "online" },
];

const notifications = [
  { text: "Deploy #4821 succeeded on production", time: "2m", type: "success" },
  { text: "CPU usage above 90% on us-east-1", time: "8m", type: "warning" },
  { text: "New PR: Refactor auth middleware", time: "14m", type: "info" },
  { text: "Stripe webhook failed 3 retries", time: "22m", type: "error" },
  { text: "Migration completed: users_v2 table", time: "1h", type: "success" },
];

const tableData = [
  { endpoint: "/api/users", method: "GET", p50: "12ms", p99: "89ms", rpm: "2.4k", status: "healthy" },
  { endpoint: "/api/billing", method: "POST", p50: "34ms", p99: "210ms", rpm: "890", status: "healthy" },
  { endpoint: "/api/search", method: "GET", p50: "67ms", p99: "450ms", rpm: "3.1k", status: "degraded" },
  { endpoint: "/api/webhooks", method: "POST", p50: "8ms", p99: "42ms", rpm: "12k", status: "healthy" },
  { endpoint: "/api/uploads", method: "PUT", p50: "120ms", p99: "1.2s", rpm: "340", status: "warning" },
  { endpoint: "/api/auth", method: "POST", p50: "22ms", p99: "156ms", rpm: "5.6k", status: "healthy" },
];

const calendarEvents = [
  { title: "Sprint Planning", time: "9:00 AM", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { title: "Design Review", time: "11:30 AM", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { title: "1:1 w/ Jake", time: "2:00 PM", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { title: "Deploy Window", time: "4:00 PM", color: "bg-amber-100 text-amber-700 border-amber-200" },
];

const sparkline = [20, 35, 28, 45, 38, 52, 48, 62, 55, 70, 65, 78, 72, 85, 80, 92];
const barData = [45, 62, 38, 78, 55, 90, 42, 68, 75, 50, 82, 60];
const donutSegments = [
  { pct: 42, color: "#6366f1", label: "API" },
  { pct: 28, color: "#f59e0b", label: "Web" },
  { pct: 18, color: "#10b981", label: "Mobile" },
  { pct: 12, color: "#ef4444", label: "Other" },
];

const kanbanColumns = [
  {
    title: "Backlog",
    color: "bg-stone-100",
    cards: [
      { title: "Dark mode support", tags: ["design", "frontend"], priority: "low" },
      { title: "Export to CSV", tags: ["backend"], priority: "medium" },
    ],
  },
  {
    title: "In Progress",
    color: "bg-blue-50",
    cards: [
      { title: "Auth middleware refactor", tags: ["backend", "security"], priority: "high" },
      { title: "Dashboard redesign", tags: ["design"], priority: "high" },
      { title: "Rate limiting v2", tags: ["backend", "infra"], priority: "medium" },
    ],
  },
  {
    title: "Review",
    color: "bg-amber-50",
    cards: [
      { title: "Billing page updates", tags: ["frontend"], priority: "medium" },
    ],
  },
  {
    title: "Done",
    color: "bg-emerald-50",
    cards: [
      { title: "SSO integration", tags: ["backend", "security"], priority: "high" },
      { title: "Onboarding flow v3", tags: ["frontend", "design"], priority: "medium" },
    ],
  },
];

const recentFiles = [
  { name: "Q4 Revenue Report.xlsx", size: "2.4 MB", modified: "2h ago", icon: "spreadsheet" },
  { name: "Architecture Diagram.fig", size: "14 MB", modified: "5h ago", icon: "design" },
  { name: "API Spec v2.yaml", size: "89 KB", modified: "1d ago", icon: "code" },
  { name: "Brand Guidelines.pdf", size: "8.1 MB", modified: "2d ago", icon: "document" },
];

const chatMessages = [
  { sender: "Priya", text: "The migration is running — should be done in ~10 min", self: false },
  { sender: "You", text: "Perfect, I'll hold off on the deploy until then", self: true },
  { sender: "Priya", text: "Also heads up: the search index needs a rebuild after", self: false },
  { sender: "You", text: "Got it. I'll add it to the runbook", self: true },
];

// ── Snapshot helper: captures bones from a ref ───────────────────────────────

const SNAPSHOT_CONFIG: SnapshotConfig = {
  captureRoundedBorders: false,
  excludeSelectors: [],
  leafTags: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "td", "th"],
};

function useSkeletonCapture() {
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [bones, setBones] = useState<Record<string, SkeletonResult>>({});
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const setRef = useCallback((name: string) => (el: HTMLDivElement | null) => {
    if (el) refs.current.set(name, el);
    else refs.current.delete(name);
  }, []);

  const generate = useCallback(() => {
    setIsGenerating(true);
    setLoading(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const captured: Record<string, SkeletonResult> = {};
        refs.current.forEach((el, name) => {
          try {
            captured[name] = snapshotBones(el, name, SNAPSHOT_CONFIG);
          } catch (e) {
            console.error(`Snapshot failed for ${name}:`, e);
          }
        });
        setBones(captured);
        setLoading(true);
        setIsGenerating(false);
      });
    });
  }, []);

  const totalBones = Object.values(bones).reduce((sum, b) => sum + b.bones.length, 0);

  // Synchronous capture — captures bones immediately from current DOM
  const captureSync = useCallback(() => {
    const captured: Record<string, SkeletonResult> = {};
    refs.current.forEach((el, name) => {
      try {
        captured[name] = snapshotBones(el, name, SNAPSHOT_CONFIG);
      } catch (e) {}
    });
    setBones(captured);
    return captured;
  }, []);

  return { setRef, bones, loading, setLoading, generate, isGenerating, totalBones, captureSync };
}

// ── Skeleton wrapper: captures from ref, passes bones to <Skeleton> ──────────

type AnimateStyle = 'pulse' | 'shimmer' | 'solid'

function SkeletonSection({
  name, loading, bones, setRef, children, fixture, stagger, transition, dark, animate,
}: {
  name: string;
  loading: boolean;
  bones: Record<string, SkeletonResult>;
  setRef: (name: string) => (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
  fixture?: React.ReactNode;
  stagger?: number | boolean;
  transition?: number | boolean;
  dark?: boolean;
  animate?: AnimateStyle;
}) {
  return (
    <Skeleton loading={loading} initialBones={bones[name]} name={name} animate={animate} fixture={fixture} stagger={stagger} transition={transition}>
      <div ref={setRef(name)}>{children}</div>
    </Skeleton>
  );
}

// ── Demo Page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const { setRef, bones, loading, setLoading, generate, isGenerating, totalBones, captureSync } = useSkeletonCapture();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [staggerVal, setStaggerVal] = useState<number | false>(false);
  const [transitionVal, setTransitionVal] = useState<number | false>(false);
  const [texture, setTexture] = useState<AnimateStyle>("pulse");
  const [dark, setDark] = useState(false);

  // Dark mode uses CSS filter inversion on the container — no .dark class needed.
  // Adding .dark would cause Skeleton to use dark colors, which then get inverted
  // back to bright by the filter, creating a double-inversion artifact.

  // Toggle skeleton with live capture for pixel-perfect accuracy
  const toggleSkeleton = useCallback(() => {
    if (showSkeleton) {
      setShowSkeleton(false);
      setLoading(false);
    } else {
      captureSync();
      setShowSkeleton(true);
      setLoading(true);
    }
  }, [showSkeleton, setLoading, captureSync]);

  // Use registry bones by default, live-captured bones after clicking generate
  const effectiveLoading = showSkeleton || loading;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fafaf9]" style={dark ? { filter: 'invert(0.93) hue-rotate(180deg) saturate(0.85)' } : undefined}>
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        {/* Back button */}
        <a href="/overview" className="inline-flex items-center gap-1.5 text-[13px] text-stone-400 hover:text-stone-600 transition-colors">
          &larr; Back to docs
        </a>

        {/* Hero */}
        <div className="text-center">
          <h1 className="text-[48px] md:text-[64px] font-black tracking-tight leading-[0.95] mb-4 text-stone-900">
            Never Write A<br />Skeleton Again
          </h1>
          <p className="text-[16px] text-stone-500 max-w-[480px] mx-auto">
            One click. Zero layout thrashing. Pixel-perfect loading states extracted directly from your real UI.
          </p>
        </div>

        {/* Sticky controls */}
        <div className="sticky top-4 z-[100] flex justify-center px-2 mb-6">
          <div className="rounded-xl border border-stone-200 bg-white px-3 py-2">
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                onClick={toggleSkeleton}
                className="inline-flex items-center justify-center w-[100px] h-7 rounded-md text-[11px] font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all"
              >
                {showSkeleton ? "Show UI" : "Skeleton"}
              </button>

              <div className="w-px h-4 mx-1 bg-stone-200" />

              <div className="flex items-center gap-0.5 rounded-md p-0.5 bg-stone-100">
                {(["pulse", "solid", "shimmer"] as AnimateStyle[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTexture(t)}
                    className={`text-[11px] h-5 px-2.5 rounded-md font-medium transition-colors ${texture === t ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 mx-1 bg-stone-200" />

              <button
                onClick={() => setDark(d => !d)}
                className={`h-7 px-2.5 rounded-md text-[11px] font-medium transition-colors ${dark ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200/70"}`}
              >
                {dark ? "Light" : "Dark"}
              </button>

              <div className="w-px h-4 mx-1 bg-stone-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-stone-400 font-mono">stagger</span>
                <input
                  type="range" min={0} max={200} step={10}
                  value={staggerVal === false ? 0 : staggerVal}
                  onChange={(e) => { const v = Number(e.target.value); setStaggerVal(v === 0 ? false : v); }}
                  className="w-16 h-1 accent-stone-400"
                />
                <span className="text-[10px] text-stone-500 font-mono w-7">{staggerVal === false ? 'off' : `${staggerVal}`}</span>
              </div>
            </div>
          </div>
        </div>
          <div className="relative flex flex-col bg-stone-50 text-[13px] overflow-hidden rounded-xl border border-stone-200" style={{ minHeight: 700 }}>
            {/* ── Top nav bar — always visible ── */}
            <div className="flex items-center justify-between px-3 md:px-4 bg-white border-b border-stone-200">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="shrink-0 pt-5 origin-left"><Logo /></div>
                <div className="hidden md:block h-5 w-px bg-stone-200 mx-1" />
                <div className="hidden md:flex gap-1">
                  {["Dashboard", "Analytics", "Projects", "Settings"].map((tab, i) => (
                    <button key={tab} className={`px-3 py-1 rounded-md text-[12px] ${i === 0 ? "bg-stone-900 text-white font-medium" : "text-stone-500 hover:bg-stone-100"
                      }`}>{tab}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1.5 bg-stone-100 rounded-lg px-3 py-1.5 text-stone-400 text-[12px] w-[200px]">
                  <span className="text-[11px]">&#x2315;</span>
                  <span>Search anything...</span>
                  <span className="ml-auto text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-500">&#x2318;K</span>
                </div>
                <div className="relative">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-stone-100 flex items-center justify-center text-[13px] md:text-[14px]">&#x1F514;</div>
                  <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">3</div>
                </div>
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-stone-300 shrink-0" />
              </div>
            </div>

            <div className="flex flex-1">
              {/* ── Left sidebar — hidden on mobile ── */}
              <aside className="hidden md:flex w-[220px] shrink-0 bg-white border-r border-stone-200 p-3 flex-col gap-4">
                <div>
                  <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">Team</div>
                  <SkeletonSection name="sidebar-nav" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                    fixture={
                      <div className="space-y-1">
                        {["Dashboard", "Analytics", "Projects", "Team", "Settings"].map((item) => (
                          <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                            <div className="w-7 h-7 rounded-full bg-stone-200" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[12px] font-medium text-stone-700">{item}</div>
                              <div className="text-[10px] text-stone-400">Navigation link</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <div className="space-y-1">
                      {users.map((u) => (
                        <div key={u.name} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                          <div className="relative">
                            <img src={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect fill='%23${u.avatar}' width='28' height='28' rx='14'/%3E%3C/svg%3E`} alt="" className="w-7 h-7 rounded-full object-cover" />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${u.status === "online" ? "bg-emerald-400" : u.status === "away" ? "bg-amber-400" : "bg-stone-300"
                              }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-medium text-stone-700 truncate">{u.name}</div>
                            <div className="text-[10px] text-stone-400 truncate">{u.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SkeletonSection>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">Today</div>
                  <SkeletonSection name="calendar" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                    fixture={
                      <div className="space-y-1.5">
                        {calendarEvents.map((e) => (
                          <div key={e.title} className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${e.color}`}>
                            <div className="font-medium">{e.title}</div>
                            <div className="opacity-70 text-[10px]">{e.time}</div>
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <div className="space-y-1.5">
                      {calendarEvents.map((e) => (
                        <div key={e.title} className={`px-2.5 py-1.5 rounded-lg border text-[11px] ${e.color}`}>
                          <div className="font-medium">{e.title}</div>
                          <div className="opacity-70 text-[10px]">{e.time}</div>
                        </div>
                      ))}
                    </div>
                  </SkeletonSection>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">Chat</div>
                  <SkeletonSection name="chat" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                    fixture={
                      <div className="space-y-1.5 bg-stone-50 rounded-lg p-2">
                        {chatMessages.map((m, i) => (
                          <div key={i} className={`flex ${m.self ? "justify-end" : "justify-start"}`}>
                            <div className={`px-2 py-1 rounded-lg text-[11px] max-w-[85%] ${m.self ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600"
                              }`}>{m.text}</div>
                          </div>
                        ))}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 text-[11px] bg-white border border-stone-200 rounded-md px-2 py-1 text-stone-300">Type a message...</div>
                          <div className="w-6 h-6 rounded-md bg-stone-900" />
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-1.5 bg-stone-50 rounded-lg p-2">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.self ? "justify-end" : "justify-start"}`}>
                          <div className={`px-2 py-1 rounded-lg text-[11px] max-w-[85%] ${m.self ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600"
                            }`}>{m.text}</div>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5 mt-1">
                        <input type="text" placeholder="Type a message..." className="flex-1 text-[11px] bg-white border border-stone-200 rounded-md px-2 py-1 placeholder:text-stone-300" readOnly />
                        <button className="w-6 h-6 rounded-md bg-stone-900 text-white flex items-center justify-center text-[10px]">&#x2191;</button>
                      </div>
                    </div>
                  </SkeletonSection>
                </div>
              </aside>

              {/* ── Main content area ── */}
              <div className="flex-1 overflow-hidden p-4 space-y-3">
                {/* Stats row */}
                <SkeletonSection name="dashboard-stats" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                  fixture={
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {[
                        { label: "Total Revenue", value: "$128.4k", change: "+12.3%" },
                        { label: "Active Users", value: "24,891", change: "+8.1%" },
                        { label: "API Calls", value: "1.2M", change: "-2.4%" },
                        { label: "Error Rate", value: "0.12%", change: "-18%" },
                      ].map((s) => (
                        <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-3">
                          <div className="text-[10px] text-stone-400 font-medium mb-1">{s.label}</div>
                          <div>
                            <div className="text-[20px] font-bold text-stone-800 leading-none">{s.value}</div>
                            <div className="text-[10px] mt-1 font-medium text-emerald-600">{s.change} vs last month</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  }
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { label: "Total Revenue", value: "$128.4k", change: "+12.3%", trend: "up" },
                      { label: "Active Users", value: "24,891", change: "+8.1%", trend: "up" },
                      { label: "API Calls", value: "1.2M", change: "-2.4%", trend: "down" },
                      { label: "Error Rate", value: "0.12%", change: "-18%", trend: "up" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-xl border border-stone-200 p-3">
                        <div className="text-[10px] text-stone-400 font-medium mb-1">{s.label}</div>
                        <div>
                          <div className="text-[20px] font-bold text-stone-800 leading-none">{s.value}</div>
                          <div className={`text-[10px] mt-1 font-medium ${s.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                            {s.change} vs last month
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SkeletonSection>

                {/* Charts row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  <div className="bg-white rounded-xl border border-stone-200 p-3">
                    <div className="text-[11px] font-semibold text-stone-700 mb-1">Traffic (7d)</div>
                    <div className="text-[9px] text-stone-400 mb-2">Requests per second</div>
                    <SkeletonSection name="chart-traffic" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                      fixture={
                        <svg viewBox="0 0 160 40" className="w-full h-[40px]">
                          <rect x="0" y="10" width="160" height="30" fill="#e0e0e0" rx="4" />
                        </svg>
                      }
                    >
                      <svg viewBox="0 0 160 40" className="w-full h-[40px]">
                        <polyline fill="none" stroke="#6366f1" strokeWidth="2"
                          points={sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * 160},${40 - (v / 100) * 40}`).join(" ")} />
                        <polyline fill="url(#sparkGrad)" stroke="none"
                          points={`0,40 ${sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * 160},${40 - (v / 100) * 40}`).join(" ")} 160,40`} />
                        <defs>
                          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </SkeletonSection>
                  </div>

                  <div className="bg-white rounded-xl border border-stone-200 p-3">
                    <div className="text-[11px] font-semibold text-stone-700 mb-1">Deploys (12w)</div>
                    <div className="text-[9px] text-stone-400 mb-2">Per week</div>
                    <SkeletonSection name="chart-deploys" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                      fixture={
                        <div className="flex items-end gap-[2px] h-[40px]">
                          {barData.map((h, i) => (
                            <div key={i} className="flex-1 rounded-t bg-stone-400 opacity-80" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      }
                    >
                      <div className="flex items-end gap-[2px] h-[40px]">
                        {barData.map((h, i) => (
                          <div key={i} className="flex-1 rounded-t bg-stone-400 opacity-80" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </SkeletonSection>
                  </div>

                  <div className="bg-white rounded-xl border border-stone-200 p-3">
                    <div className="text-[11px] font-semibold text-stone-700 mb-1">Traffic Split</div>
                    <div className="text-[9px] text-stone-400 mb-2">By client type</div>
                    <SkeletonSection name="chart-split" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                      fixture={
                        <div className="flex items-center gap-3">
                          <div className="w-[44px] h-[44px] rounded-full bg-stone-200 shrink-0" />
                          <div className="flex flex-col gap-1">
                            {donutSegments.map((seg) => (
                              <div key={seg.label} className="flex items-center gap-1.5 text-[9px]">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: seg.color }} />
                                <span className="text-stone-500">{seg.label}</span>
                                <span className="font-semibold text-stone-700 ml-auto">{seg.pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      }
                    >
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 36 36" className="w-[44px] h-[44px] shrink-0">
                          {(() => {
                            let offset = 0;
                            return donutSegments.map((seg) => {
                              const el = (
                                <circle key={seg.label} cx="18" cy="18" r="15.9" fill="none" stroke={seg.color}
                                  strokeWidth="4" strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                                  strokeDashoffset={-offset} transform="rotate(-90 18 18)" />
                              );
                              offset += seg.pct;
                              return el;
                            });
                          })()}
                        </svg>
                        <div className="flex flex-col gap-0.5">
                          {donutSegments.map((seg) => (
                            <div key={seg.label} className="flex items-center gap-1.5 text-[9px]">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: seg.color }} />
                              <span className="text-stone-500">{seg.label}</span>
                              <span className="font-semibold text-stone-700 ml-auto">{seg.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SkeletonSection>
                  </div>
                </div>

                {/* API table + activity */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                  <div className="col-span-1 md:col-span-3 bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
                      <span className="text-[11px] font-semibold text-stone-700">API Endpoints</span>
                      <div className="flex gap-1">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px]">4 healthy</Badge>
                        <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px]">1 degraded</Badge>
                      </div>
                    </div>
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-stone-100 text-stone-400">
                          <th className="text-left font-medium px-3 py-1.5">Endpoint</th>
                          <th className="text-left font-medium px-2 py-1.5">Method</th>
                          <th className="text-left font-medium px-2 py-1.5">P50</th>
                          <th className="text-left font-medium px-2 py-1.5">P99</th>
                          <th className="text-left font-medium px-2 py-1.5">RPM</th>
                          <th className="text-left font-medium px-3 py-1.5">Status</th>
                        </tr>
                      </thead>
                    </table>
                    <SkeletonSection name="user-table" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                      fixture={
                        <table className="w-full text-[10px]">
                          <tbody>
                            {tableData.map((row) => (
                              <tr key={row.endpoint} className="border-b border-stone-50">
                                <td className="px-3 py-1.5 font-mono text-stone-700 font-medium">{row.endpoint}</td>
                                <td className="px-2 py-1.5"><span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{row.method}</span></td>
                                <td className="px-2 py-1.5 font-mono text-stone-500">{row.p50}</td>
                                <td className="px-2 py-1.5 font-mono text-stone-500">{row.p99}</td>
                                <td className="px-2 py-1.5 font-mono text-stone-500">{row.rpm}</td>
                                <td className="px-3 py-1.5"><span className="text-stone-500 capitalize">{row.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      }
                    >
                      <table className="w-full text-[10px]">
                        <tbody>
                          {tableData.map((row) => (
                            <tr key={row.endpoint} className="border-b border-stone-50">
                              <td className="px-3 py-1.5 font-mono text-stone-700 font-medium">{row.endpoint}</td>
                              <td className="px-2 py-1.5">
                                <Badge className={`text-[8px] ${row.method === "GET" ? "bg-blue-50 text-blue-600" :
                                  row.method === "POST" ? "bg-emerald-50 text-emerald-600" :
                                    "bg-amber-50 text-amber-600"
                                  }`}>{row.method}</Badge>
                              </td>
                              <td className="px-2 py-1.5 font-mono text-stone-500">{row.p50}</td>
                              <td className="px-2 py-1.5 font-mono text-stone-500">{row.p99}</td>
                              <td className="px-2 py-1.5 font-mono text-stone-500">{row.rpm}</td>
                              <td className="px-3 py-1.5">
                                <div className="flex items-center gap-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${row.status === "healthy" ? "bg-emerald-400" :
                                    row.status === "degraded" ? "bg-amber-400" : "bg-red-400"
                                    }`} />
                                  <span className="text-stone-500 capitalize">{row.status}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </SkeletonSection>
                  </div>

                  <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
                      <span className="text-[11px] font-semibold text-stone-700">Activity Feed</span>
                      <button className="text-[10px] text-stone-600 font-medium">View all</button>
                    </div>
                    <SkeletonSection name="activity" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                      fixture={
                        <div className="divide-y divide-stone-50">
                          {notifications.map((n, i) => (
                            <div key={i} className="flex items-start gap-2 px-3 py-2">
                              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-stone-300" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] text-stone-600 leading-tight">{n.text}</div>
                                <div className="text-[9px] text-stone-400 mt-0.5">{n.time} ago</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      }
                    >
                      <div className="divide-y divide-stone-50">
                        {notifications.map((n, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.type === "success" ? "bg-emerald-400" :
                              n.type === "warning" ? "bg-amber-400" :
                                n.type === "error" ? "bg-red-400" : "bg-blue-400"
                              }`} />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] text-stone-600 leading-tight">{n.text}</div>
                              <div className="text-[9px] text-stone-400 mt-0.5">{n.time} ago</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SkeletonSection>
                  </div>
                </div>

                {/* Kanban */}
                <div className="bg-white rounded-xl border border-stone-200 p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-semibold text-stone-700">Project Board</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-stone-500">Filter</Button>
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-stone-600">+ New</Button>
                    </div>
                  </div>
                  <SkeletonSection name="kanban" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                    fixture={
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {kanbanColumns.map((col) => (
                          <div key={col.title} className={`rounded-lg p-1.5 ${col.color}`}>
                            <div className="flex items-center justify-between mb-1.5 px-1">
                              <span className="text-[10px] font-semibold text-stone-600">{col.title}</span>
                              <span className="text-[9px] text-stone-400 bg-white rounded-full w-4 h-4 flex items-center justify-center">{col.cards.length}</span>
                            </div>
                            <div className="space-y-1">
                              {col.cards.map((card) => (
                                <div key={card.title} className="bg-white rounded-md p-2 border border-stone-100">
                                  <div className="text-[11px] font-medium text-stone-700 mb-1">{card.title}</div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {card.tags.map((tag) => (
                                      <span key={tag} className="text-[8px] px-1 py-0.5 rounded-full bg-stone-100 text-stone-500">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {kanbanColumns.map((col) => (
                        <div key={col.title} className={`rounded-lg p-1.5 ${col.color}`}>
                          <div className="flex items-center justify-between mb-1.5 px-1">
                            <span className="text-[10px] font-semibold text-stone-600">{col.title}</span>
                            <span className="text-[9px] text-stone-400 bg-white rounded-full w-4 h-4 flex items-center justify-center">{col.cards.length}</span>
                          </div>
                          <div className="space-y-1">
                            {col.cards.map((card) => (
                              <div key={card.title} className="bg-white rounded-md p-2 border border-stone-100">
                                <div className="text-[11px] font-medium text-stone-700 mb-1">{card.title}</div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {card.tags.map((tag) => (
                                    <span key={tag} className="text-[8px] px-1 py-0.5 rounded-full bg-stone-100 text-stone-500">{tag}</span>
                                  ))}
                                  <div className={`ml-auto w-1.5 h-1.5 rounded-full ${card.priority === "high" ? "bg-red-400" :
                                    card.priority === "medium" ? "bg-amber-400" : "bg-stone-300"
                                    }`} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </SkeletonSection>
                </div>

                {/* Files + progress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
                      <span className="text-[11px] font-semibold text-stone-700">Recent Files</span>
                      <button className="text-[10px] text-stone-600 font-medium">Browse all</button>
                    </div>
                    <SkeletonSection name="files" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                      fixture={
                        <div className="divide-y divide-stone-50">
                          {recentFiles.map((f) => (
                            <div key={f.name} className="flex items-center gap-2.5 px-3 py-1.5">
                              <div className="w-7 h-7 rounded-md bg-stone-100" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium text-stone-700 truncate">{f.name}</div>
                                <div className="text-[9px] text-stone-400">{f.size} &middot; {f.modified}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      }
                    >
                      <div className="divide-y divide-stone-50">
                        {recentFiles.map((f) => (
                          <div key={f.name} className="flex items-center gap-2.5 px-3 py-1.5">
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-semibold ${f.icon === "spreadsheet" ? "bg-emerald-50 text-emerald-600" :
                              f.icon === "design" ? "bg-purple-50 text-purple-600" :
                                f.icon === "code" ? "bg-blue-50 text-blue-600" :
                                  "bg-stone-50 text-stone-500"
                              }`}>
                              {f.icon === "spreadsheet" ? "XL" :
                                f.icon === "design" ? "FG" :
                                  f.icon === "code" ? "{ }" : "DC"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-medium text-stone-700 truncate">{f.name}</div>
                              <div className="text-[9px] text-stone-400">{f.size} &middot; {f.modified}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SkeletonSection>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="bg-white rounded-xl border border-stone-200 p-3">
                      <div className="text-[11px] font-semibold text-stone-700 mb-2.5">Sprint Progress</div>
                      <SkeletonSection name="progress" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                        fixture={
                          <div className="space-y-2">
                            {[
                              { label: "Frontend", pct: 78 },
                              { label: "Backend", pct: 92 },
                              { label: "Design", pct: 45 },
                              { label: "QA", pct: 33 },
                            ].map((bar) => (
                              <div key={bar.label}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[10px] text-stone-500">{bar.label}</span>
                                  <span className="text-[10px] font-semibold text-stone-700">{bar.pct}%</span>
                                </div>
                                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-stone-400" style={{ width: `${bar.pct}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        }
                      >
                        <div className="space-y-2">
                          {[
                            { label: "Frontend", pct: 78, color: "bg-stone-700" },
                            { label: "Backend", pct: 92, color: "bg-emerald-500" },
                            { label: "Design", pct: 45, color: "bg-purple-500" },
                            { label: "QA", pct: 33, color: "bg-amber-500" },
                          ].map((bar) => (
                            <div key={bar.label}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] text-stone-500">{bar.label}</span>
                                <span className="text-[10px] font-semibold text-stone-700">{bar.pct}%</span>
                              </div>
                              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </SkeletonSection>
                    </div>

                    <div className="bg-white rounded-xl border border-stone-200 p-3">
                      <div className="text-[11px] font-semibold text-stone-700 mb-2">Server Status</div>
                      <SkeletonSection name="servers" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}
                        fixture={
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { name: "us-east-1", uptime: "99.98%" },
                              { name: "eu-west-1", uptime: "99.95%" },
                              { name: "ap-south-1", uptime: "98.2%" },
                              { name: "us-west-2", uptime: "99.99%" },
                            ].map((s) => (
                              <div key={s.name} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-stone-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <div className="min-w-0">
                                  <div className="text-[10px] font-mono text-stone-600">{s.name}</div>
                                  <div className="text-[8px] text-stone-400">{s.uptime}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        }
                      >
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { name: "us-east-1", status: "operational", uptime: "99.98%" },
                            { name: "eu-west-1", status: "operational", uptime: "99.95%" },
                            { name: "ap-south-1", status: "degraded", uptime: "98.2%" },
                            { name: "us-west-2", status: "operational", uptime: "99.99%" },
                          ].map((s) => (
                            <div key={s.name} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-stone-100">
                              <div className={`w-1.5 h-1.5 rounded-full ${s.status === "operational" ? "bg-emerald-400" : "bg-amber-400"}`} />
                              <div className="min-w-0">
                                <div className="text-[10px] font-mono text-stone-600">{s.name}</div>
                                <div className="text-[8px] text-stone-400">{s.uptime}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </SkeletonSection>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* ── Additional test components ── */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 space-y-3">
          {/* User profile card */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-profile" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div className="flex flex-col items-center text-center">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23a8a29e' width='64' height='64' rx='32'/%3E%3C/svg%3E" alt="" className="w-16 h-16 rounded-full mb-3" />
                <div className="text-[14px] font-bold text-stone-800 w-fit">Sarah Chen</div>
                <div className="text-[11px] text-stone-400 mb-3 w-fit">Senior Engineer &middot; Platform Team</div>
                <div className="flex gap-6 text-center mb-3">
                  <div><div className="text-[16px] font-bold text-stone-800">142</div><div className="text-[9px] text-stone-400">Commits</div></div>
                  <div><div className="text-[16px] font-bold text-stone-800">38</div><div className="text-[9px] text-stone-400">PRs</div></div>
                  <div><div className="text-[16px] font-bold text-stone-800">12</div><div className="text-[9px] text-stone-400">Reviews</div></div>
                </div>
                <div className="flex gap-1.5 w-full">
                  <button className="flex-1 text-[11px] bg-stone-900 text-white rounded-lg py-1.5 font-medium">Message</button>
                  <button className="flex-1 text-[11px] bg-stone-100 text-stone-600 rounded-lg py-1.5 font-medium">Follow</button>
                </div>
              </div>
            </SkeletonSection>
          </div>

          {/* Pricing card */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-pricing" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div>
                <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1 w-fit">Pro Plan</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-[28px] font-black text-stone-900">$29</span>
                  <span className="text-[12px] text-stone-400">/month</span>
                </div>
                <div className="space-y-2 mb-4">
                  {["Unlimited projects", "50GB storage", "Priority support", "Custom domains", "API access"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-[11px] text-stone-600">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[8px] shrink-0">&#x2713;</div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full text-[12px] bg-indigo-600 text-white rounded-lg py-2 font-semibold">Get Started</button>
              </div>
            </SkeletonSection>
          </div>

          {/* Notification list */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-notifications" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div className="space-y-3">
                <div className="text-[12px] font-semibold text-stone-700 w-fit">Notifications</div>
                {[
                  { title: "New comment on PR #421", desc: "Jake left a review on your pull request", time: "2m" },
                  { title: "Deploy succeeded", desc: "Production deploy v2.4.1 completed", time: "15m" },
                  { title: "Invited to project", desc: "You were added to Design System", time: "1h" },
                  { title: "Billing alert", desc: "Usage approaching 80% of plan limit", time: "3h" },
                ].map((n, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-stone-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-stone-700 w-fit">{n.title}</p>
                      <p className="text-[10px] text-stone-400 w-fit">{n.desc}</p>
                      <p className="text-[9px] text-stone-400 mt-0.5 w-fit">{n.time} ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </SkeletonSection>
          </div>

          {/* Settings form */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-form" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div className="space-y-3">
                <div className="text-[12px] font-semibold text-stone-700 w-fit">Account Settings</div>
                <div>
                  <label className="text-[10px] text-stone-500 font-medium block mb-1 w-fit">Display Name</label>
                  <input type="text" value="Sarah Chen" readOnly className="w-full text-[11px] border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 bg-white" />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 font-medium block mb-1 w-fit">Email</label>
                  <input type="text" value="sarah@example.com" readOnly className="w-full text-[11px] border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 bg-white" />
                </div>
                <div>
                  <label className="text-[10px] text-stone-500 font-medium block mb-1 w-fit">Role</label>
                  <div className="w-full text-[11px] border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 bg-stone-50">Senior Engineer</div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 text-[11px] bg-stone-900 text-white rounded-lg py-1.5 font-medium">Save</button>
                  <button className="flex-1 text-[11px] bg-stone-100 text-stone-500 rounded-lg py-1.5 font-medium">Cancel</button>
                </div>
              </div>
            </SkeletonSection>
          </div>

          {/* Media gallery */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-gallery" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div>
                <div className="text-[12px] font-semibold text-stone-700 mb-2 w-fit">Media Gallery</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="aspect-square rounded-lg bg-stone-200" />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-stone-400">6 of 24 items</span>
                  <button className="text-[10px] text-stone-600 font-medium">View all</button>
                </div>
              </div>
            </SkeletonSection>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-timeline" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div>
                <div className="text-[12px] font-semibold text-stone-700 mb-3 w-fit">Recent Activity</div>
                <div className="space-y-3 relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-stone-200" />
                  {[
                    { action: "Pushed 3 commits to main", time: "10 min ago" },
                    { action: "Opened PR #422: Fix auth flow", time: "1 hour ago" },
                    { action: "Closed issue #389", time: "3 hours ago" },
                    { action: "Created branch feature/dark-mode", time: "Yesterday" },
                  ].map((e, i) => (
                    <div key={i} className="flex gap-3 relative">
                      <div className="w-[15px] h-[15px] rounded-full border-2 border-stone-300 bg-white shrink-0 z-10" />
                      <div>
                        <div className="text-[11px] text-stone-700 w-fit">{e.action}</div>
                        <div className="text-[9px] text-stone-400 w-fit">{e.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SkeletonSection>
          </div>

          {/* Comment thread */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-comments" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div className="space-y-3">
                <div className="text-[12px] font-semibold text-stone-700 w-fit">Discussion</div>
                {[
                  { name: "Alex", text: "Should we migrate to the new API before the freeze?", time: "2h" },
                  { name: "Priya", text: "I think so. The old endpoints are getting rate-limited more aggressively now.", time: "1h" },
                  { name: "Jake", text: "Agreed. I can start on the client SDK changes tomorrow.", time: "45m" },
                ].map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-stone-300 shrink-0" />
                    <div className="bg-stone-50 rounded-lg px-2.5 py-1.5 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold text-stone-700">{c.name}</span>
                        <span className="text-[9px] text-stone-400">{c.time} ago</span>
                      </div>
                      <p className="text-[11px] text-stone-600 w-fit">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 items-center">
                  <div className="w-6 h-6 rounded-full bg-stone-300 shrink-0" />
                  <input type="text" placeholder="Write a reply..." readOnly className="flex-1 text-[11px] border border-stone-200 rounded-lg px-3 py-1.5 placeholder:text-stone-300" />
                </div>
              </div>
            </SkeletonSection>
          </div>

          {/* Tag cloud / badges */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-tags" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div>
                <div className="text-[12px] font-semibold text-stone-700 mb-2 w-fit">Popular Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "Next.js", "Tailwind", "GraphQL", "Prisma", "Docker", "AWS", "PostgreSQL", "Redis", "Node.js", "Rust"].map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-stone-100 text-stone-600 font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            </SkeletonSection>
          </div>

          {/* Music player */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-player" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-lg bg-stone-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-stone-700 truncate w-fit">Midnight City</div>
                  <div className="text-[10px] text-stone-400 w-fit">M83 &middot; Hurry Up, We&apos;re Dreaming</div>
                  <div className="h-1 bg-stone-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-stone-400 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-[10px]">&#x23EE;</div>
                  <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white text-[10px]">&#x25B6;</div>
                  <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-[10px]">&#x23ED;</div>
                </div>
              </div>
            </SkeletonSection>
          </div>

          {/* Metric cards row */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-metrics" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Uptime", value: "99.9%", sub: "Last 30 days" },
                  { label: "Latency", value: "24ms", sub: "p95 avg" },
                  { label: "Errors", value: "0.02%", sub: "Rate this week" },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-[9px] text-stone-400 uppercase tracking-wider w-fit mx-auto">{m.label}</div>
                    <div className="text-[20px] font-black text-stone-800 w-fit mx-auto">{m.value}</div>
                    <div className="text-[9px] text-stone-400 w-fit mx-auto">{m.sub}</div>
                  </div>
                ))}
              </div>
            </SkeletonSection>
          </div>

          {/* Breadcrumb + search */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 break-inside-avoid">
            <SkeletonSection name="test-nav" loading={effectiveLoading} bones={bones} setRef={setRef} stagger={staggerVal} transition={transitionVal} dark={dark} animate={texture}>
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                  <span>Home</span><span>/</span><span>Projects</span><span>/</span><span className="text-stone-700 font-medium">Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Search files, commands..." readOnly className="flex-1 text-[11px] border border-stone-200 rounded-lg px-3 py-2 placeholder:text-stone-300" />
                  <button className="text-[11px] bg-stone-900 text-white rounded-lg px-3 py-2 font-medium shrink-0">Search</button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {["All", "Documents", "Images", "Code", "Settings"].map((tab, i) => (
                    <button key={tab} className={`text-[10px] px-2.5 py-1 rounded-md font-medium ${i === 0 ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"}`}>{tab}</button>
                  ))}
                </div>
              </div>
            </SkeletonSection>
          </div>
        </div>
      </div>
    </div>
  );
}
