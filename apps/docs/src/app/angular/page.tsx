import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "quick-start", label: "Quick start" },
  { id: "inputs", label: "Inputs" },
  { id: "content-projection", label: "Content projection" },
  { id: "dark-mode", label: "Dark mode" },
  { id: "animations", label: "Animations" },
  { id: "global-defaults", label: "Global defaults" },
  { id: "config-file", label: "Config file" },
];

export default function AngularPage() {
  return (
    <div className="flex gap-10">
    <div className="max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Angular</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          Use boneyard in any Angular 14+ app. Standalone component — no module needed. Same CLI, same pixel-perfect skeletons.
        </p>
      </div>

      {/* Quick start */}
      <section>
        <div className="section-divider" id="quick-start">
          <span>Quick start</span>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-[13px] font-medium text-stone-500 mb-2">1. Install</p>
            <CodeBlock language="bash" code="npm install boneyard-js" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-500 mb-2">2. Add the component</p>
            <CodeBlock filename="app.component.ts" language="typescript" code={`<span class="text-[#c084fc]">import</span> { Component } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'@angular/core'</span>
<span class="text-[#c084fc]">import</span> { SkeletonComponent } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/angular'</span>
<span class="text-[#c084fc]">import</span> <span class="text-[#86efac]">'./bones/registry'</span>

@<span class="text-[#fde68a]">Component</span>({
  <span class="text-[#93c5fd]">selector</span>: <span class="text-[#86efac]">'app-root'</span>,
  <span class="text-[#93c5fd]">standalone</span>: <span class="text-[#fbbf24]">true</span>,
  <span class="text-[#93c5fd]">imports</span>: [SkeletonComponent],
  <span class="text-[#93c5fd]">template</span>: \`
    &lt;<span class="text-[#fde68a]">boneyard-skeleton</span> <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"blog-card"</span> <span class="text-[#93c5fd]">[loading]</span>=<span class="text-[#86efac]">"isLoading"</span>&gt;
      &lt;<span class="text-[#fde68a]">app-blog-card</span> /&gt;
    &lt;/<span class="text-[#fde68a]">boneyard-skeleton</span>&gt;
  \`
})
<span class="text-[#c084fc]">export class</span> <span class="text-[#fde68a]">AppComponent</span> {
  isLoading = <span class="text-[#fbbf24]">true</span>
}`} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-500 mb-2">3. Generate bones</p>
            <CodeBlock language="bash" code="npx boneyard-js build" />
            <p className="text-[13px] text-stone-400 mt-2">
              Auto-detects your Angular dev server and captures all named skeletons.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-500 mb-2">4. Import the registry</p>
            <CodeBlock language="ts" code={`<span class="text-stone-500">// Add once in your app entry (e.g. main.ts)</span>
<span class="text-[#c084fc]">import</span> <span class="text-[#86efac]">'./bones/registry'</span>`} />
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[13px] text-amber-700">
                <strong className="text-amber-800">This import is required.</strong> Without it, skeletons won&apos;t render — the component
                needs the registry to resolve bone data by name.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <div className="section-divider" id="inputs">
          <span>Inputs</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Input</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Type</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Default</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">loading</td>
                <td className="px-4 py-2">boolean</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Show skeleton or children</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">name</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Resolve bones from registry by name</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">initialBones</td>
                <td className="px-4 py-2">ResponsiveBones</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Pass bones directly (overrides registry)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">color</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">rgba(0,0,0,0.08)</td>
                <td className="px-4 py-2">Bone color in light mode</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">darkColor</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">rgba(255,255,255,0.06)</td>
                <td className="px-4 py-2">Bone color in dark mode</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">animate</td>
                <td className="px-4 py-2">{`'pulse' | 'shimmer' | 'solid'`}</td>
                <td className="px-4 py-2">pulse</td>
                <td className="px-4 py-2">Animation style (also accepts true/false)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">stagger</td>
                <td className="px-4 py-2">number | boolean</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Stagger delay between bones in ms (true = 80ms)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">transition</td>
                <td className="px-4 py-2">number | boolean</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Fade out duration in ms when loading ends (true = 300ms)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">boneClass</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">CSS class applied to each bone element</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">cssClass</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">CSS class on the container</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">snapshotConfig</td>
                <td className="px-4 py-2">SnapshotConfig</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Controls bone extraction during CLI capture</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Content projection */}
      <section>
        <div className="section-divider" id="content-projection">
          <span>Content projection</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Selector</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">(default)</td>
                <td className="px-4 py-2">Your real component — shown when not loading</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">[fallback]</td>
                <td className="px-4 py-2">Shown when loading but no bones are available</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">[fixture]</td>
                <td className="px-4 py-2">Mock content for CLI capture (dev only)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <CodeBlock language="html" code={`&lt;<span class="text-[#fde68a]">boneyard-skeleton</span> <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"dashboard"</span> <span class="text-[#93c5fd]">[loading]</span>=<span class="text-[#86efac]">"isLoading"</span>&gt;
  <span class="text-stone-500">&lt;!-- Default: your real component --&gt;</span>
  &lt;<span class="text-[#fde68a]">app-dashboard</span> <span class="text-[#93c5fd]">[data]</span>=<span class="text-[#86efac]">"data"</span> /&gt;

  <span class="text-stone-500">&lt;!-- Fixture: mock content for CLI bone capture --&gt;</span>
  &lt;<span class="text-[#fde68a]">app-dashboard</span> fixture <span class="text-[#93c5fd]">[data]</span>=<span class="text-[#86efac]">"mockData"</span> /&gt;

  <span class="text-stone-500">&lt;!-- Fallback: shown if no bones generated yet --&gt;</span>
  &lt;<span class="text-[#fde68a]">p</span> fallback&gt;Loading...&lt;/<span class="text-[#fde68a]">p</span>&gt;
&lt;/<span class="text-[#fde68a]">boneyard-skeleton</span>&gt;`} />
        </div>
      </section>

      {/* Dark mode */}
      <section>
        <div className="section-divider" id="dark-mode">
          <span>Dark mode</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Auto-detects via <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.dark</code> class
          on <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">{'<html>'}</code> or any parent element (Tailwind convention),
          and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">prefers-color-scheme</code> media query.
          Uses <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">darkColor</code> when dark mode is active.
        </p>
      </section>

      {/* Animations */}
      <section>
        <div className="section-divider" id="animations">
          <span>Animations</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Value</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Effect</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">{`'pulse'`}</td>
                <td className="px-4 py-2">Fades a lighter overlay in and out (1.8s cycle)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">{`'shimmer'`}</td>
                <td className="px-4 py-2">Sweeps a gradient highlight across each bone (2.4s cycle)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">{`'solid'`}</td>
                <td className="px-4 py-2">Static — no animation</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">true / false</td>
                <td className="px-4 py-2">true = pulse, false = solid</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Global defaults */}
      <section>
        <div className="section-divider" id="global-defaults">
          <span>Global defaults</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Set defaults for all skeletons with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">configureBoneyard()</code>:
        </p>
        <CodeBlock language="typescript" code={`<span class="text-[#c084fc]">import</span> { configureBoneyard } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/angular'</span>

<span class="text-[#fde68a]">configureBoneyard</span>({
  <span class="text-[#93c5fd]">color</span>: <span class="text-[#86efac]">'#e5e5e5'</span>,
  <span class="text-[#93c5fd]">darkColor</span>: <span class="text-[#86efac]">'rgba(255,255,255,0.08)'</span>,
  <span class="text-[#93c5fd]">animate</span>: <span class="text-[#86efac]">'shimmer'</span>,
})`} />
        <p className="text-[13px] text-stone-400 mt-2">
          Per-component inputs override global defaults.
        </p>
      </section>

      {/* Config file */}
      <section>
        <div className="section-divider" id="config-file">
          <span>Config file</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4">
          See <a href="/install#config-file" className="text-stone-800 underline underline-offset-2">Install &rarr; Config file</a> for
          the full <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> reference. Works with all frameworks.
        </p>
      </section>

      {/* Next steps */}
      <section>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-[13px] font-medium text-stone-700 mb-2">Next steps</p>
          <ul className="text-[13px] text-[#78716c] space-y-1 list-disc pl-4">
            <li>See <a href="/install" className="text-stone-800 underline underline-offset-2">Getting Started</a> for the full web setup walkthrough</li>
            <li>See <a href="/output" className="text-stone-800 underline underline-offset-2">Output</a> to understand the .bones.json format</li>
            <li>See <a href="/features" className="text-stone-800 underline underline-offset-2">CLI &amp; Props Reference</a> for all flags and options</li>
          </ul>
        </div>
      </section>
    </div>

    <TableOfContents items={tocItems} />
    </div>
  );
}
