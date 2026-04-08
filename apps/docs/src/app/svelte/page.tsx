import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "quick-start", label: "Quick start" },
  { id: "how-it-works", label: "How it works" },
  { id: "props", label: "Props" },
  { id: "dark-mode", label: "Dark mode" },
  { id: "snippets", label: "Snippets" },
  { id: "config-file", label: "Config file" },
];

export default function SveltePage() {
  return (
    <div className="flex gap-10">
      <div className="max-w-[720px] px-6 pt-14 pb-12 space-y-12">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight mb-2">Svelte</h1>
          <p className="text-[15px] text-[#78716c] leading-relaxed">
            Use boneyard in SvelteKit and Svelte 5 apps. Same pixel-perfect skeletons, same CLI — native Svelte component with snippets.
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
              <p className="text-[13px] font-medium text-stone-500 mb-2">2. Wrap your components</p>
              <CodeBlock filename="src/routes/+page.svelte" language="svelte" code={`<span class="text-[#c084fc]">&lt;script&gt;</span>
  <span class="text-[#c084fc]">import</span> Skeleton <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/svelte'</span>
  <span class="text-[#c084fc]">import</span> <span class="text-[#86efac]">'$lib/bones/registry'</span>

  <span class="text-[#c084fc]">let</span> loading = <span class="text-[#fbbf24]">true</span>
<span class="text-[#c084fc]">&lt;/script&gt;</span>

<span class="text-[#fde68a]">&lt;Skeleton</span> <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"profile-card"</span> <span class="text-[#93c5fd]">{loading}</span><span class="text-[#fde68a]">&gt;</span>
  <span class="text-[#fde68a]">&lt;ProfileCard</span> /&gt;
<span class="text-[#fde68a]">&lt;/Skeleton&gt;</span>`} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-stone-500 mb-2">3. Generate bones</p>
              <p className="text-[13px] text-stone-400 mb-2">Option A — Vite plugin (recommended, no second terminal):</p>
              <CodeBlock filename="vite.config.ts" language="ts" code={`<span class="text-[#c084fc]">import</span> { boneyardPlugin } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/vite'</span>
<span class="text-[#c084fc]">import</span> { sveltekit } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'@sveltejs/kit/vite'</span>

<span class="text-[#c084fc]">export default</span> <span class="text-[#fde68a]">defineConfig</span>({
  <span class="text-[#93c5fd]">plugins</span>: [<span class="text-[#fde68a]">sveltekit</span>(), <span class="text-[#fde68a]">boneyardPlugin</span>()]
})`} />
              <p className="text-[13px] text-stone-400 mt-3 mb-2">Option B — CLI:</p>
              <CodeBlock language="bash" code={`npx boneyard-js build`} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-stone-500 mb-2">4. Import the registry</p>
              <CodeBlock language="js" code={`<span class="text-stone-500">// Add once in your +layout.svelte or +page.svelte</span>
<span class="text-[#c084fc]">import</span> <span class="text-[#86efac]">'$lib/bones/registry'</span>`} />
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-[13px] text-amber-700">
                  <strong className="text-amber-800">This import is required.</strong> Without it, skeletons won&apos;t render — the Skeleton component
                  needs the registry to resolve bone data by name.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section>
          <div className="section-divider" id="how-it-works">
            <span>How it works</span>
          </div>
          <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
            The Svelte component works identically to the React version under the hood. The CLI visits your running SvelteKit app
            in a headless browser, finds all <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">{'<Skeleton name="...">'}</code> components,
            and snapshots their layout at each breakpoint. The bone data format is the same across all frameworks.
          </p>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-[13px] text-[#78716c]">
              The Svelte adapter is a <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">.svelte</code> file that uses Svelte 5 snippets
              for children and fallback content. It reads from the same bone registry and uses the same
              CSS keyframe animations as the React version.
            </p>
          </div>
        </section>

        {/* Props */}
        <section>
          <div className="section-divider" id="props">
            <span>Props</span>
          </div>
          <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-4 py-2 font-medium text-stone-700">Prop</th>
                  <th className="text-left px-4 py-2 font-medium text-stone-700">Type</th>
                  <th className="text-left px-4 py-2 font-medium text-stone-700">Default</th>
                  <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
                </tr>
              </thead>
              <tbody className="text-[#78716c]">
                <tr className="border-b border-stone-100">
                  <td className="px-4 py-2 font-mono text-stone-800">loading</td>
                  <td className="px-4 py-2">boolean</td>
                  <td className="px-4 py-2">—</td>
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
                  <td className="px-4 py-2">Pass bones directly</td>
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
                  <td className="px-4 py-2 font-mono text-stone-800">class</td>
                  <td className="px-4 py-2">string</td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2">Additional CSS class for the container</td>
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
                <tr>
                  <td className="px-4 py-2 font-mono text-stone-800">fallback</td>
                  <td className="px-4 py-2">Snippet</td>
                  <td className="px-4 py-2">—</td>
                  <td className="px-4 py-2">Shown when loading but no bones available</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Dark mode */}
        <section>
          <div className="section-divider" id="dark-mode">
            <span>Dark mode</span>
          </div>
          <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
            Detects <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">prefers-color-scheme: dark</code> and
            a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.dark</code> ancestor class automatically — same as the React version.
          </p>
        </section>

        {/* Snippets */}
        <section>
          <div className="section-divider" id="snippets">
            <span>Snippets (fallback &amp; fixture)</span>
          </div>
          <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
            Svelte 5 snippets replace slots. Use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">fallback</code> for
            a custom loading state when no bones are available, and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">fixture</code> for
            mock content during bone generation:
          </p>
          <CodeBlock language="svelte" code={`<span class="text-[#fde68a]">&lt;Skeleton</span> <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"card"</span> <span class="text-[#93c5fd]">{loading}</span><span class="text-[#fde68a]">&gt;</span>
  <span class="text-stone-500">&lt;!-- Default slot: your real component --&gt;</span>
  <span class="text-[#fde68a]">&lt;Card</span> {data} /&gt;

  <span class="text-stone-500">&lt;!-- Fallback: shown while loading if no bones --&gt;</span>
  {#snippet fallback()}
    <span class="text-[#fde68a]">&lt;p&gt;</span>Loading...<span class="text-[#fde68a]">&lt;/p&gt;</span>
  {/snippet}

  <span class="text-stone-500">&lt;!-- Fixture: mock content for CLI capture --&gt;</span>
  {#snippet fixture()}
    <span class="text-[#fde68a]">&lt;Card</span> data={mockData} /&gt;
  {/snippet}
<span class="text-[#fde68a]">&lt;/Skeleton&gt;</span>`} />
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
      </div>

      <TableOfContents items={tocItems} />
    </div>
  );
}
