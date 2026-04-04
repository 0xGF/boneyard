export default function ChangelogPage() {
  return (
    <div className="max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Changelog</h1>
        <p className="text-[15px] text-[#78716c]">
          What&apos;s new in boneyard.
        </p>
      </div>

      {/* v1.6.0 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.6.0</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">latest</span>
        </div>

        <div className="space-y-6">
          {/* Compact format */}
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Compact bone format</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Bones are now stored as arrays <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">[x, y, w, h, r]</code> instead
              of objects — smaller JSON files, faster parsing. The runtime supports both formats for backwards compatibility.
            </p>
          </div>

          {/* Incremental builds */}
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Incremental builds</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The CLI hashes each skeleton&apos;s DOM content and skips unchanged components on subsequent builds.
              Use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--force</code> to bypass the cache.
            </p>
          </div>

          {/* Config file */}
          <div>
            <h3 className="text-[14px] font-semibold mb-1">boneyard.config.json</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              One config file for both CLI and runtime defaults — breakpoints, output dir, color, animation style.
              Runtime defaults are auto-included in the generated registry.
            </p>
          </div>

          {/* Animation styles */}
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Animation styles</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">animate</code> prop now
              accepts <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&quot;pulse&quot;</code>,{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&quot;shimmer&quot;</code>, or{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&quot;solid&quot;</code> in
              addition to boolean values.
            </p>
          </div>

          {/* Responsive page */}
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Responsive docs</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New <a href="/responsive" className="text-stone-800 underline underline-offset-2">Responsive</a> page
              showing how breakpoint detection and auto-selection works.
            </p>
          </div>

          {/* SSR rewrite */}
          <div>
            <h3 className="text-[14px] font-semibold mb-1">SSR rewrite</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The <a href="/ssr" className="text-stone-800 underline underline-offset-2">SSR</a> page now shows
              side-by-side examples with fixture data and explains the build-time snapshot flow.
            </p>
          </div>

          {/* Bug fixes */}
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fixes</h3>
            <ul className="text-[13px] text-[#78716c] leading-relaxed list-disc pl-4 space-y-1">
              <li><code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">renderBones</code> now uses <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">%</code> for x/w values (was px)</li>
              <li>NaN validation in hex color parsing</li>
              <li>Fixed import paths in docs (<code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/react</code>)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* v1.5.0 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.5.0</span>
          <span className="text-[12px] text-stone-400">March 2026</span>
        </div>
        <p className="text-[13px] text-[#78716c] leading-relaxed">
          Initial public release. CLI-based skeleton extraction with Playwright, responsive breakpoints,
          dark mode detection, fixture support, and React component.
        </p>
      </section>
    </div>
  );
}
