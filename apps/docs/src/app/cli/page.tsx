import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "build-command", label: "Build command" },
  { id: "flags", label: "Flags" },
  { id: "examples", label: "Examples" },
  { id: "vite-plugin", label: "Vite plugin" },
  { id: "watch-mode", label: "Watch mode" },
  { id: "incremental-builds", label: "Incremental builds" },
  { id: "react-native", label: "React Native" },
];

export default function CliPage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">CLI</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          Generate skeleton bones from your running app. Works with every framework.
        </p>
      </div>

      {/* Build command */}
      <section>
        <div className="section-divider" id="build-command">
          <span>Build command</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Start your dev server, then run the CLI. It opens a headless browser, visits your app,
          finds every <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">{'<Skeleton name="...">'}</code>,
          and snapshots the layout at each breakpoint.
        </p>
        <CodeBlock language="bash" code="npx boneyard-js build" />
        <p className="text-[13px] text-stone-400 mt-2">
          Auto-detects your dev server by scanning common ports (3000, 5173, 4321, 8080...).
          Auto-detects Tailwind breakpoints from your config.
        </p>
      </section>

      {/* Flags */}
      <section>
        <div className="section-divider" id="flags">
          <span>Flags</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Flag</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Default</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">[url]</td>
                <td className="px-4 py-2">auto-detected</td>
                <td className="px-4 py-2">URL to visit (scans common ports if omitted)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">--out</td>
                <td className="px-4 py-2">./src/bones</td>
                <td className="px-4 py-2">Output directory for .bones.json files</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">--breakpoints</td>
                <td className="px-4 py-2">375,768,1280</td>
                <td className="px-4 py-2">Viewport widths to capture, comma-separated</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">--wait</td>
                <td className="px-4 py-2">800</td>
                <td className="px-4 py-2">ms to wait after page load before capturing</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">--force</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Skip incremental cache, recapture all</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">--watch</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Re-capture when your app changes (listens for HMR)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">--native</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">React Native mode — scans from device</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">--no-scan</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Skip filesystem route scanning (only crawl links)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">--cdp &lt;port&gt;</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Connect to existing Chrome via debug port (reuses cookies/auth)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">--env-file</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Load env vars from file (useful for Bun runtime)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Examples */}
      <section>
        <div className="section-divider" id="examples">
          <span>Examples</span>
        </div>
        <div className="mt-4">
          <CodeBlock language="bash" code={`<span class="text-stone-500"># Auto-detect server, default breakpoints</span>
npx boneyard-js build

<span class="text-stone-500"># Specific page</span>
npx boneyard-js build http://localhost:3000/dashboard

<span class="text-stone-500"># Custom breakpoints + output dir</span>
npx boneyard-js build --breakpoints 390,820,1440 --out ./public/bones

<span class="text-stone-500"># Force recapture all</span>
npx boneyard-js build --force

<span class="text-stone-500"># Watch mode</span>
npx boneyard-js build --watch

<span class="text-stone-500"># React Native</span>
npx boneyard-js build --native --out ./bones

<span class="text-stone-500"># Use existing Chrome (reuses cookies, auth, extensions)</span>
npx boneyard-js build --cdp 9222`} />
        </div>
      </section>

      {/* Vite plugin */}
      <section>
        <div className="section-divider" id="vite-plugin">
          <span>Vite plugin</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          For Vite-based projects (Vue, Svelte, React with Vite, Nuxt, SvelteKit), use the plugin
          instead of the CLI. Bones are captured on dev server start and re-captured on every HMR update.
          No second terminal.
        </p>
        <CodeBlock filename="vite.config.ts" language="ts" code={`<span class="text-[#c084fc]">import</span> { boneyardPlugin } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/vite'</span>

<span class="text-[#c084fc]">export default</span> <span class="text-[#fde68a]">defineConfig</span>({
  <span class="text-[#93c5fd]">plugins</span>: [<span class="text-[#fde68a]">boneyardPlugin</span>()]
})`} />
        <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Option</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Default</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">out</td>
                <td className="px-4 py-2">./src/bones</td>
                <td className="px-4 py-2">Output directory</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">breakpoints</td>
                <td className="px-4 py-2">[375, 768, 1280]</td>
                <td className="px-4 py-2">Viewport widths to capture</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">wait</td>
                <td className="px-4 py-2">800</td>
                <td className="px-4 py-2">ms to wait after page load</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">framework</td>
                <td className="px-4 py-2">auto</td>
                <td className="px-4 py-2">Registry import (auto-detects vue/svelte/react)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">skipInitial</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Skip capture on server start</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">cdp</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Chrome debug port (reuses existing browser session)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Watch mode */}
      <section>
        <div className="section-divider" id="watch-mode">
          <span>Watch mode</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Keep the CLI running and re-capture when your dev server pushes HMR updates.
          Works with Vite, Next.js, Webpack, and SvelteKit.
        </p>
        <CodeBlock language="bash" code="npx boneyard-js build --watch" />
        <p className="text-[13px] text-stone-400 mt-2">
          Silent when nothing changes. Prints a one-line summary when bones are updated.
          Only writes files when the captured bones actually differ from the previous capture.
        </p>
      </section>

      {/* Incremental builds */}
      <section>
        <div className="section-divider" id="incremental-builds">
          <span>Incremental builds</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          The CLI hashes each skeleton&apos;s content and skips unchanged components on subsequent builds.
          Only modified skeletons are recaptured — saving time on large apps.
        </p>
        <p className="text-[13px] text-stone-400">
          Use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--force</code> to
          bypass the cache and recapture everything.
        </p>
        <div className="mt-4 border-l-2 border-stone-300 pl-4 py-1">
          <p className="text-[13px] text-[#78716c]">
            Playwright is included as a dependency. On first run you may need to install the browser:{" "}
            <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx playwright install chromium</code>
          </p>
        </div>
      </section>

      {/* React Native */}
      <section>
        <div className="section-divider" id="react-native">
          <span>React Native</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          The <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--native</code> flag
          starts a scan receiver instead of opening a browser. The Skeleton component on your device
          auto-scans and sends bones to the CLI.
        </p>
        <CodeBlock language="bash" code={`npx boneyard-js build --native --out ./bones
<span class="text-stone-500"># Open your app on device — bones capture automatically</span>`} />
        <p className="text-[13px] text-stone-400 mt-2">
          See <a href="/react-native" className="text-stone-700 underline underline-offset-2">React Native docs</a> for
          full setup details.
        </p>
      </section>
    </div>

    <TableOfContents items={tocItems} />
    </>
  );
}
