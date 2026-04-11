import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "quick-start", label: "Quick start" },
  { id: "skeleton-props", label: "<Skeleton> props" },
  { id: "hiding-elements", label: "Hiding elements" },
  { id: "build-command", label: "CLI & Vite plugin" },
];

export default function FeaturesPage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">React</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          Use boneyard in Next.js, Vite, Remix, or any React app. Wrap your components, run the CLI, and get pixel-perfect skeleton screens.
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
            <CodeBlock language="tsx" code={`<span class="text-[#c084fc]">import</span> { Skeleton } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/react'</span>

<span class="text-[#c084fc]">function</span> <span class="text-[#fde68a]">BlogPage</span>() {
  <span class="text-[#c084fc]">const</span> { data, isLoading } = <span class="text-[#fde68a]">useFetch</span>(<span class="text-[#86efac]">'/api/post'</span>)
  <span class="text-[#c084fc]">return</span> (
    &lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"blog-card"</span> <span class="text-[#93c5fd]">loading</span>={isLoading}&gt;
      &lt;<span class="text-[#fde68a]">BlogCard</span> data={data} /&gt;
    &lt;/<span class="text-[#fde68a]">Skeleton</span>&gt;
  )
}`} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-500 mb-2">3. Generate bones</p>
            <CodeBlock language="bash" code="npx boneyard-js build" />
            <p className="text-[13px] text-stone-400 mt-2">
              Auto-detects your dev server and captures all named skeletons at multiple breakpoints.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-500 mb-2">4. Import the registry</p>
            <CodeBlock language="tsx" code={`<span class="text-stone-500">// Add once in your app entry (e.g. layout.tsx, _app.tsx, main.tsx)</span>
<span class="text-[#c084fc]">import</span> <span class="text-[#86efac]">'./bones/registry'</span>`} />
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[13px] text-amber-700">
                <strong className="text-amber-800">This import is required.</strong> Without it, skeletons won&apos;t render — the Skeleton component
                needs the registry to resolve bone data by name. Import it once at the top level of your app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── <Skeleton> props ── */}
      <section>
        <div className="section-divider" id="skeleton-props">
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
                <td className="px-4 py-2">Unique name — generates <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">name.bones.json</code></td>
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
                <td className="px-4 py-2 font-mono text-stone-800">className</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Extra CSS class on the wrapper</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">fallback</td>
                <td className="px-4 py-2">ReactNode</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Shown when loading but no bones available</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">fixture</td>
                <td className="px-4 py-2">ReactNode</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Mock content for CLI capture (dev only)</td>
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
                <td className="px-4 py-2 font-mono text-stone-800">snapshotConfig</td>
                <td className="px-4 py-2">SnapshotConfig</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Controls bone extraction (see Hiding elements)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-[13px] font-medium text-stone-700 mb-2">fixture prop</p>
          <p className="text-[13px] text-[#78716c]">
            Use <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">fixture</code> to provide mock content for the CLI when real data isn&apos;t available
            (auth-protected pages, user-specific data, API-dependent content). Only rendered during <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">npx boneyard-js build</code> — never in production.
          </p>
        </div>
      </section>

      {/* ── Excluding elements ── */}
      <section>
        <div className="section-divider" id="hiding-elements">
          <span>Hiding elements from the skeleton</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Sometimes you don&apos;t want everything to show up in the skeleton. Maybe you have icons, decorative elements, or a live widget that should always be visible. You can tell boneyard to skip them.
        </p>

        <p className="text-[14px] text-[#78716c] leading-relaxed mb-4">
          Pass a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">snapshotConfig</code> prop to control what gets included:
        </p>

        <div className="space-y-6">
          {/* Example 1 */}
          <div>
            <p className="text-[13px] font-medium text-stone-700 mb-2">Skip specific elements by CSS class or attribute</p>
            <p className="text-[13px] text-[#78716c] mb-2">
              Use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">excludeSelectors</code> — any CSS selector works.
              The element and everything inside it gets ignored.
            </p>
            <CodeBlock filename="example" language="tsx" code={`&lt;<span class="text-[#fde68a]">Skeleton</span>
  <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"dashboard"</span>
  <span class="text-[#93c5fd]">loading</span>={isLoading}
  <span class="text-[#93c5fd]">initialBones</span>={dashBones}
  <span class="text-[#93c5fd]">snapshotConfig</span>={{
    <span class="text-[#93c5fd]">excludeSelectors</span>: [
      <span class="text-[#86efac]">'.icon'</span>,                     <span class="text-stone-500">// skip all icons</span>
      <span class="text-[#86efac]">'[data-no-skeleton]'</span>,         <span class="text-stone-500">// skip anything with this attribute</span>
      <span class="text-[#86efac]">'svg'</span>,                        <span class="text-stone-500">// skip all SVGs</span>
    ]
  }}
&gt;`} />
          </div>

          {/* Example 2 */}
          <div>
            <p className="text-[13px] font-medium text-stone-700 mb-2">Skip entire HTML tags</p>
            <p className="text-[13px] text-[#78716c] mb-2">
              Use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">excludeTags</code> to skip every instance of a tag type. Good for nav bars and footers that shouldn&apos;t be part of the skeleton.
            </p>
            <CodeBlock language="tsx" code={`<span class="text-[#93c5fd]">snapshotConfig</span>={{
  <span class="text-[#93c5fd]">excludeTags</span>: [<span class="text-[#86efac]">'nav'</span>, <span class="text-[#86efac]">'footer'</span>, <span class="text-[#86efac]">'aside'</span>]
}}`} />
          </div>

          {/* Example 3 */}
          <div>
            <p className="text-[13px] font-medium text-stone-700 mb-2">Mark elements in your JSX</p>
            <p className="text-[13px] text-[#78716c] mb-2">
              The easiest way — add <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">data-no-skeleton</code> to any element you want to exclude from bone capture, then exclude it. Note: this only affects capture — the element is still hidden at runtime. Place elements outside the Skeleton wrapper to keep them visible during loading.
            </p>
            <CodeBlock filename="your-component.tsx" language="tsx" code={`<span class="text-stone-500">// No bone will be generated for this element during capture</span>
&lt;<span class="text-[#fde68a]">div</span> <span class="text-[#93c5fd]">data-no-skeleton</span>&gt;
  &lt;<span class="text-[#fde68a]">LiveChart</span> /&gt;
&lt;/<span class="text-[#fde68a]">div</span>&gt;

<span class="text-stone-500">// Then in your Skeleton wrapper</span>
<span class="text-[#93c5fd]">snapshotConfig</span>={{ <span class="text-[#93c5fd]">excludeSelectors</span>: [<span class="text-[#86efac]">'[data-no-skeleton]'</span>] }}`} />
          </div>
        </div>

        {/* Other config options */}
        <div className="mt-8 rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
          <p className="text-[13px] font-medium text-stone-700">Other snapshot options</p>
          <ul className="text-[13px] text-[#78716c] space-y-1.5 list-disc pl-4">
            <li>
              <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">leafTags</code> — Tags treated as one solid block (default: <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">p, h1–h6, li, tr</code>). Add <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">span</code> if your text renders inside span wrappers.
            </li>
            <li>
              <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">captureRoundedBorders</code> — Set <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">false</code> if your cards use shadows instead of borders (default: <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">true</code>).
            </li>
          </ul>
        </div>
      </section>

      {/* ── CLI ── */}
      <section>
        <div className="section-divider" id="build-command">
          <span>CLI &amp; Vite plugin</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4">
          See <a href="/cli" className="text-stone-800 underline underline-offset-2">CLI</a> for
          all build flags, watch mode, Vite plugin, and React Native scanning.
          See <a href="/install#config-file" className="text-stone-800 underline underline-offset-2">Install</a> for
          the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> reference.
        </p>
      </section>
    </div>

    <TableOfContents items={tocItems} />
    </>
  );
}
