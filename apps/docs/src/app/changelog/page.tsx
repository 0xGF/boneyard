export default function ChangelogPage() {
  return (
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Changelog</h1>
        <p className="text-[15px] text-[#78716c]">
          What&apos;s new in boneyard.
        </p>
      </div>

      {/* v1.7.4 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.4</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">latest</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Configurable shimmer via <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code></h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New runtime config keys: <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">shimmerColor</code>,{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">darkShimmerColor</code>,{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">speed</code>,{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">shimmerAngle</code>.
              Values are baked into the generated registry. Per-component props still override.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fix container bone opacity overlap</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Container bones were rendering as semi-transparent with child bones stacked on top, creating darker overlap regions. Container bones are now skipped during rendering across all frameworks.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fix dark mode detection</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Reverted to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.dark</code> class-only detection. The <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">prefers-color-scheme</code> media query was incorrectly overriding app-level theme control. Skeleton now only responds to the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.dark</code> class on ancestors.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Opaque default bone colors</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Switched from semi-transparent <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">rgba()</code> to opaque <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">#f0f0f0</code> / <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">#222222</code>. Eliminates transparency stacking artifacts. Centralized all animation constants in <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">shared.ts</code>.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.3 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.3</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fix <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--cookie</code> CLI flag with config file</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Fixed a ReferenceError when using <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--cookie</code> —
              the config object was accessed before initialization. CLI cookies are now preserved when a config file is also loaded.
              <span className="text-stone-400"> (</span>
              <a href="https://github.com/0xGF/boneyard/pull/57" className="text-stone-800 underline underline-offset-2">#57</a>
              <span className="text-stone-400">)</span>
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Consistent docs layout</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Fixed content shifting between pages — standardized spacing, removed unnecessary flex wrapper,
              and added a page footer.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.2 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.2</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Skip redirected routes</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The crawler now detects server-side redirects and skips them automatically, avoiding duplicate
              skeleton captures for aliased routes.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1"><code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--cookie</code> CLI flag</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Pass cookies directly from the command line for quick auth-protected builds without editing the config file.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Per-skeleton crawler config</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Override crawler settings (viewport, wait conditions, selectors) per skeleton
              in <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> for
              guided crawling of complex pages.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.1 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.1</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Stagger &amp; transition in global config</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">configureBoneyard()</code> now
              accepts <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">stagger</code> and{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">transition</code> as global defaults.
              Added missing type definitions for Vue, Angular, and Svelte adapters.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Vite plugin routes option</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The Vite plugin now accepts a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">routes</code> option
              for multi-page skeleton capture. Framework-specific import paths are now used in the generated registry.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Docs improvements</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Clarified that <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">data-no-skeleton</code> only
              affects capture, not runtime rendering.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.0 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.0</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Vite plugin</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/vite</code> plugin
              for automatic bone capture during development. Includes browser cleanup, debounced rebuilds,
              and path sanitization.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Stagger &amp; transition animations</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">stagger</code> and{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">transition</code> props
              across all five framework adapters. Bones can now fade in sequentially and transition
              smoothly when loading completes.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">CLI docs page</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Dedicated <a href="/cli" className="text-stone-800 underline underline-offset-2">CLI</a> page
              with full flag reference, examples, and Vite plugin setup instructions.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fixes</h3>
            <ul className="text-[13px] text-[#78716c] leading-relaxed list-disc pl-4 space-y-1">
              <li>Table skeletons now use td/th as leaf tags instead of tr</li>
              <li>Fixed <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">getFiber()</code> returning null on React Native 0.76+ dev builds</li>
              <li>Improved validation and error handling across the CLI</li>
            </ul>
          </div>
        </div>
      </section>

      {/* v1.6.6 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.6.6</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Nuxt &amp; Remix route scanning</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Filesystem route discovery now supports Nuxt (<code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">pages/**/*.vue</code>)
              and Remix / React Router v7 (<code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">app/routes/</code> flat routes),
              in addition to Next.js and SvelteKit.
            </p>
          </div>
        </div>
      </section>

      {/* v1.6.5 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.6.5</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Angular adapter</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/angular</code> export
              with a standalone Angular 14+ component. OnPush change detection, dark mode auto-detection,
              content projection with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">[fixture]</code> and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">[fallback]</code> selectors.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Watch mode</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--watch</code> flag keeps the browser open and
              re-captures skeletons when your app changes. Listens for HMR events from Vite, Next.js, and Webpack.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Filesystem route scanning</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The CLI now scans route folders (Next.js App/Pages Router, SvelteKit, Vite/Remix) to discover pages
              not linked in navigation. Use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--no-scan</code> to opt out.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Svelte 5 attachments</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Refactored Svelte adapter to use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">{"@attach"}</code> directives
              instead of onMount. Requires Svelte 5.29+. Added shimmer/solid animation modes and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">configureBoneyard()</code>.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Bun env file support</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--env-file</code> flag loads environment variables
              from a file, useful for Bun runtime where env vars aren&apos;t inherited by subprocesses.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Framework auto-detection</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The CLI reads your package.json to detect Vue, Svelte, Angular, or React and generates
              the correct registry imports automatically.
            </p>
          </div>
        </div>
      </section>

      {/* v1.6.4 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.6.4</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Vue 3 adapter</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/vue</code> export
              with a native Vue 3 Skeleton component. Pulse, shimmer, and solid animations with scoped keyframes,
              dark mode auto-detection, and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">#fixture</code> / <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">#fallback</code> slots.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Native device scanning</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build --native</code> captures
              bones directly from a running React Native app on device or simulator. Walks the React fiber tree,
              measures views via UIManager, and sends bone data to the CLI automatically.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Security hardening</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              CLI scan server now validates skeleton names, sanitizes output filenames against path traversal,
              and enforces a 5MB request body limit. Vue adapter sanitizes CSS radius values to prevent injection.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Docs restructure</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Framework-organized sidebar with dedicated pages for React, React Native, Svelte, and Vue.
              New table of contents component and Svelte docs page.
            </p>
          </div>
        </div>
      </section>

      {/* v1.6.3 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.6.3</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Svelte 5 adapter</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/svelte</code> export
              with a native Svelte 5 Skeleton component. Shared registry and build-mode logic extracted into a
              framework-neutral module.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">React Native support</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/native</code> export
              for iOS and Android. Uses RN Animated API for pulse animation, auto-detects dark mode
              via <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">useColorScheme</code>, and
              includes Metro bundler compatibility.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Compiled layout engine</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              New <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">compileDescriptor()</code> API
              for up to 105x faster relayouts. Automatic mutation detection rebuilds compiled state when descriptors
              change in place. See the <a href="/performance" className="text-stone-800 underline underline-offset-2">Performance</a> page.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Auth for protected routes</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The CLI now supports <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">auth.cookies</code> and{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">auth.headers</code> in{" "}
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> for
              generating skeletons on authenticated pages. Supports <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">env[VAR]</code> syntax
              for secrets.
            </p>
          </div>
        </div>
      </section>

      {/* v1.6.0 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.6.0</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
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
