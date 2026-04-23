export default function ChangelogPage() {
  return (
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Changelog</h1>
        <p className="text-[15px] text-[#78716c]">
          What&apos;s new in boneyard.
        </p>
      </div>

      {/* v1.8.1 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.8.1</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">latest</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">HTTPS dev servers</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The CLI and Vite plugin now work against dev servers running over TLS. Auto-detect tries <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">http://</code> first (still the common case) and falls back to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">https://</code> on every port if nothing responds. The Vite plugin honours <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">server.https</code> from Vite config and constructs the capture URL as <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">https://localhost:{'<port>'}</code> when set. Playwright contexts now launch with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">ignoreHTTPSErrors: true</code> so self-signed certs (mkcert, <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">next --experimental-https</code>, vite preview, Quasar https mode) don&apos;t fail at navigation. Fixes <a href="https://github.com/0xGF/boneyard/issues/80" className="underline">#80</a>.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Previously-captured bones no longer drop out of the registry</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The registry was regenerated from the current run&apos;s captures alone, so any skeleton whose route wasn&apos;t visited this run silently disappeared from the generated imports. Typical repro: capture <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">/login</code> unauthenticated, then add <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">auth.cookies</code> and re-run — <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">/login</code> now redirects to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">/dashboard</code> for the authenticated headless browser, and the valid <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">login.bones.json</code> on disk gets orphaned from the registry. v1.8.0 single-page mode (<a href="https://github.com/0xGF/boneyard/issues/78" className="underline">#78</a>) made this significantly worse — running <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">build /dashboard</code> would prune the registry down to that one skeleton. Fixed in both the CLI and the Vite plugin: previously-captured bones on disk are now seeded into the in-memory map at startup and preserved across runs. Fresh captures overwrite stale entries of the same name; <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--force</code> still rebuilds from scratch. Watch-mode recapture no longer wipes the collected map either. Fixes <a href="https://github.com/0xGF/boneyard/issues/81" className="underline">#81</a>.
            </p>
          </div>
        </div>
      </section>

      {/* v1.8.0 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.8.0</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Vite plugin no longer fails silently</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Three places in the Vite plugin used to swallow errors silently — <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">page.goto</code> failures, empty captures, and most exceptions in the outer catch — leaving users staring at <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">[boneyard] watching for skeleton changes...</code> with no way to diagnose. The plugin now prints a per-route rundown when capture returns nothing (final path so redirects are visible, page title, <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">data-boneyard</code> marker count, any <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">page.goto</code> error). Redirects log at the first breakpoint as they happen. The outer catch logs all real failures; only the benign &quot;Target closed&quot; (dev-server restart) stays quiet. New <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">debug: true</code> plugin option turns on verbose per-step logging. Fixes <a href="https://github.com/0xGF/boneyard/issues/75" className="underline">#75</a> via <a href="https://github.com/0xGF/boneyard/pull/77" className="underline">#77</a>.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Vite plugin reads <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> (incl. <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">auth</code>)</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">routes</code>, <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">breakpoints</code>, <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">wait</code>, <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">out</code>, and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">auth</code> (cookies + headers, sanitized against the same allowlist/blocklist the CLI uses) are now honoured by the plugin as fallbacks. Plugin options still win when both are set. Authed pages behind cookie sessions can be captured in watch mode without a second terminal.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Vite plugin <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">cdp</code> reuses your Chrome session</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Same fix as <a href="https://github.com/0xGF/boneyard/pull/73" className="underline">#73</a> in the CLI, ported to the plugin. <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">browser.contexts()[0] ?? browser.newContext()</code> — inherits cookies/auth from the Chrome window you point it at instead of spawning a fresh empty context.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1"><code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build {'<url>'}/path</code> now actually captures only that page</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The CLI documents <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build http://localhost:3000/dashboard</code> as the way to capture a &quot;Specific page&quot;, but the implementation treated every URL as a starting point — link-following from the page, walking <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">app/**/page.tsx</code> for additional routes, adding anything in <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">config.routes</code>. So passing <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">/dashboard/analytics</code> still scanned the whole project. Now: when any URL has a non-root path, the CLI prints <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">Specific page: 1 URL(s) — no link/filesystem crawl</code> and visits exactly the URL(s) you passed. Bare-origin URLs (<code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">http://localhost:3000</code>) and the auto-detect path keep crawling everything. Fixes <a href="https://github.com/0xGF/boneyard/issues/78" className="underline">#78</a>.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.9 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.9</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Type-safe JSON bone imports</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Consumer projects with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">resolveJsonModule: true</code> (the default in most Vite / Next.js setups) were hitting <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">TS2322</code> on every <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">import _x from &apos;./x.bones.json&apos;</code> inside the auto-generated <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">registry.ts</code>. TypeScript infers JSON arrays as <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">number[]</code>, not the tuple <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">CompactBone</code> describes. Widened <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">AnyBone</code> to accept the JSON-inferred shape and loosened <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">SkeletonResult.bones</code> from <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">Bone[]</code> to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">AnyBone[]</code>. Runtime is unchanged — <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">normalizeBone</code> still validates tuple length. Fixes <a href="https://github.com/0xGF/boneyard/issues/72" className="underline">#72</a> via <a href="https://github.com/0xGF/boneyard/pull/74" className="underline">#74</a>.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1"><code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--cdp</code> now actually reuses your Chrome session</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The CLI help promised <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--cdp</code> &quot;reuses cookies, auth, state&quot;, but after <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">chromium.connectOverCDP()</code> the CLI called <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">browser.newContext()</code>, which spawned a fresh context that didn&apos;t inherit any session state. Every authed route 302&apos;d to sign-in and skeleton capture returned <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">No skeletons found</code>. Now reuses the existing context when Chrome has one, falling back to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">newContext()</code> only when there are no tabs. Authed pages behind Clerk / NextAuth / cookie sessions capture correctly again. Fixed via <a href="https://github.com/0xGF/boneyard/pull/73" className="underline">#73</a>.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Test suite back to green</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Two <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">renderBones</code> tests and their Vue equivalents were asserting that container bones (<code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">c: true</code>) rendered with a lightened color, but the runtime has intentionally skipped them since v1.6 to avoid opacity overlap with child bones. Rewrote those tests to positively assert the skip, and removed the stray <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">true</code> flag from compact-tuple fixtures that weren&apos;t testing container behavior. Suite is now 123 pass / 0 fail.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.8 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.8</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Add <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--version</code> flag to the CLI</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js --version</code> (or <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">-v</code>) now prints <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js 1.7.8</code>. Reads the version from the shipped <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">package.json</code> via <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">import.meta.url</code> so it works regardless of install location. Fixes <a href="https://github.com/0xGF/boneyard/issues/64" className="underline">#64</a>.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fix filesystem route discovery on Windows</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">path.dirname</code> and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">path.join</code> return backslash-separated paths on Windows, so the group-stripping regex in <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">discoverRoutes()</code> never matched. A reporter's SvelteKit route <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">(protected)/(app)/(admin_devs)/test_page</code> was being crawled with the groups intact, 404'ing their dev server. Added a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">toUrlPath()</code> helper that normalizes separators before any regex or string op; applied to all 5 framework branches. Fixes <a href="https://github.com/0xGF/boneyard/issues/65" className="underline">#65</a>.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Support explicit routes in <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code></h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Some pages can't be reached by link-crawling or filesystem walking — Angular <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">loadChildren</code> lazy modules, auth-gated pages, custom routers. Added a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">routes</code> field to the config that accepts plain paths (<code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&quot;/dashboard&quot;</code>) or same-origin full URLs. They're merged in after filesystem discovery and crawled normally. Also updated the &quot;nothing captured&quot; error to point users at this option. Addresses <a href="https://github.com/0xGF/boneyard/issues/66" className="underline">#66</a>.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.7 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.7</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fix Angular skeletons capturing 0 bones</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The Angular template had two unselected <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;ng-content&gt;</code> slots (one in the build-mode branch, one in the runtime branch). Angular deduplicates catch-all slots and only projects content into the last declared one — so during CLI capture the build branch rendered as an empty wrapper, producing a 0&nbsp;×&nbsp;0 container and no bones. Collapsed the split into a single template with one catch-all slot, controlling build vs. runtime with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">*ngIf</code> around the skeleton overlay only. Fixes <a href="https://github.com/0xGF/boneyard/issues/62" className="underline">#62</a>.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.6 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.6</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fix skeleton bones not rendering on first frame in Next.js App Router</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">mounted</code> flag used <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">useEffect</code> which fires after paint, causing bones to not appear until frame 3. Switched to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">useLayoutEffect</code> so bones render on the first visible client frame. Fixes blank skeleton flash for short loading states. Affects React and Preact.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fix Angular component import error</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              The Angular package was shipping raw TypeScript instead of pre-compiled JavaScript, causing &quot;Standard Angular field decorators are not supported in JIT mode&quot; errors in Angular 17+. The component is now compiled with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">ngc</code> using Ivy partial compilation, and the CLI correctly detects and captures skeletons in Angular projects.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.5 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.5</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-[14px] font-semibold mb-1">Clean up dark mode detection across all frameworks</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Removed <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">mq.matches</code> from the dark mode decision — only the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.dark</code> class determines dark mode. The <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">matchMedia</code> listener
              is kept as a safety net to trigger rechecks when the OS theme changes, catching apps that toggle <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.dark</code> on non-<code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;html&gt;</code> ancestors.
              Affects React, Preact, Vue, Svelte, Angular.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Fix stale defaults in JSDoc across all frameworks</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Updated color defaults from <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">rgba()</code> to opaque hex values in JSDoc comments across React, Preact, React Native, and native. All color props accept any CSS color value.
            </p>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-1">Tune shimmer highlights</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed">
              Adjusted shimmer highlight defaults to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">#f7f7f7</code> (light) / <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">#2c2c2c</code> (dark) for visible but not overpowering sweep.
            </p>
          </div>
        </div>
      </section>

      {/* v1.7.4 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[14px] font-bold">v1.7.4</span>
          <span className="text-[12px] text-stone-400">April 2026</span>
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
