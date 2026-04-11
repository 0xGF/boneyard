import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "generated-files", label: "Generated files" },
  { id: "skeleton-result", label: "SkeletonResult" },
  { id: "bone-fields", label: "Bone fields" },
  { id: "result-fields", label: "Result fields" },
  { id: "direct-api", label: "Direct API (non-React)" },
];

export default function OutputPage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Output Format</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          What boneyard generates when it snapshots your UI — the bones JSON format, where files go, and how to use them.
        </p>
      </div>

      {/* Generated files */}
      <section>
        <div className="section-divider" id="generated-files">
          <span>Generated files</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Running <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build</code> scans
          your app for named <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> components,
          captures bone data at each breakpoint, and writes the results
          to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.bones.json</code> files. A <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">registry.js</code> file
          is also generated so every skeleton can be imported in one line.
        </p>
        <div className="rounded-lg border border-stone-200 bg-[#1a1a1a] p-5 font-mono text-[13px] leading-[1.8]">
          <div className="text-stone-500">src/bones/ <span className="text-stone-600">← auto-created by the CLI</span></div>
          <div className="text-[#86efac] pl-4">├── blog-card.bones.json <span className="text-stone-600">← from &lt;Skeleton name=&quot;blog-card&quot;&gt;</span></div>
          <div className="text-[#86efac] pl-4">├── profile.bones.json</div>
          <div className="text-[#86efac] pl-4">├── dashboard.bones.json</div>
          <div className="text-[#86efac] pl-4">└── registry.js <span className="text-stone-600">← import once in your app entry</span></div>
        </div>
        <p className="text-[13px] text-stone-400 mt-2">
          Each file contains responsive bone data captured at multiple viewport widths. Breakpoints are auto-detected from Tailwind or set
          in <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code>.
          Bones use a compact array format for smaller file sizes.
          The generated <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">registry.js</code> imports all of these automatically — just add <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">import &apos;./bones/registry&apos;</code> to your app entry.
        </p>
      </section>

      {/* SkeletonResult */}
      <section>
        <div className="section-divider" id="skeleton-result">
          <span>SkeletonResult</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Each breakpoint inside a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.bones.json</code> file
          is a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">SkeletonResult</code> — a flat list of
          positioned rectangles that mirror your real layout pixel-for-pixel.
        </p>
        <CodeBlock filename="src/bones/blog-card.bones.json" language="json" code={`{
  <span class="text-[#86efac]">"name"</span>: <span class="text-[#86efac]">"blog-card"</span>,
  <span class="text-[#86efac]">"viewportWidth"</span>: <span class="text-[#fbbf24]">375</span>,
  <span class="text-[#86efac]">"width"</span>: <span class="text-[#fbbf24]">343</span>,
  <span class="text-[#86efac]">"height"</span>: <span class="text-[#fbbf24]">284</span>,
  <span class="text-[#86efac]">"bones"</span>: [
    [<span class="text-[#fbbf24]">0</span>,    <span class="text-[#fbbf24]">0</span>,   <span class="text-[#fbbf24]">100</span>,  <span class="text-[#fbbf24]">180</span>, <span class="text-[#fbbf24]">8</span>],      <span class="text-stone-600">// hero image</span>
    [<span class="text-[#fbbf24]">0</span>,    <span class="text-[#fbbf24]">192</span>, <span class="text-[#fbbf24]">69.9</span>, <span class="text-[#fbbf24]">20</span>,  <span class="text-[#fbbf24]">4</span>],      <span class="text-stone-600">// title</span>
    [<span class="text-[#fbbf24]">0</span>,    <span class="text-[#fbbf24]">220</span>, <span class="text-[#fbbf24]">100</span>,  <span class="text-[#fbbf24]">16</span>,  <span class="text-[#fbbf24]">4</span>],      <span class="text-stone-600">// excerpt</span>
    [<span class="text-[#fbbf24]">0</span>,    <span class="text-[#fbbf24]">244</span>, <span class="text-[#fbbf24]">6.99</span>, <span class="text-[#fbbf24]">24</span>,  <span class="text-[#86efac]">"50%"</span>], <span class="text-stone-600">// avatar</span>
    [<span class="text-[#fbbf24]">9.33</span>, <span class="text-[#fbbf24]">248</span>, <span class="text-[#fbbf24]">23.3</span>, <span class="text-[#fbbf24]">16</span>,  <span class="text-[#fbbf24]">4</span>]       <span class="text-stone-600">// author name</span>
  ]
}`} />
      </section>

      {/* Bone fields */}
      <section>
        <div className="section-divider" id="bone-fields">
          <span>Bone fields</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Each bone is stored as a compact tuple: <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">[x, y, w, h, r, c?]</code>.
          The 6th element is optional and only present for container bones.
        </p>
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Field</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Type</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">x</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">Horizontal offset as a percentage of the container width</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">y</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">Vertical offset from the top edge in pixels</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">w</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">Width as a percentage of the container width</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">h</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">Height in pixels</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">r</td>
                <td className="px-4 py-2">{`number | "50%"`}</td>
                <td className="px-4 py-2">Border radius — a number for pixels, or <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&quot;50%&quot;</code> for circles</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">c</td>
                <td className="px-4 py-2">true (optional)</td>
                <td className="px-4 py-2">Container bone flag — when <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">true</code>, this bone represents a container element (card, panel) and is rendered at a lighter shade so child bones stand out</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Result fields */}
      <section>
        <div className="section-divider" id="result-fields">
          <span>Result fields</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Top-level fields on each <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">SkeletonResult</code> object
          in the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.bones.json</code> file.
        </p>
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Field</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Type</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">name</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">Identifier from the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">name</code> prop, or <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&apos;component&apos;</code> by default</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">viewportWidth</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">Browser viewport width at capture time (px)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">width</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">Container element width at capture time (px)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">height</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">Total content height (px) — used to size the skeleton overlay</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">bones</td>
                <td className="px-4 py-2">Bone[]</td>
                <td className="px-4 py-2">Flat array of positioned rectangles — every visible element as a bone</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Direct API */}
      <section>
        <div className="section-divider" id="direct-api">
          <span>Direct API (non-React)</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          The React <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> wrapper calls these automatically. You can also call them directly for vanilla JS, SSR, or other frameworks.
        </p>

        <div className="space-y-4">
          <div>
            <p className="text-[12px] text-stone-400 mb-1.5">Snapshot from a live DOM element (browser only)</p>
            <CodeBlock language="ts" code={`<span class="text-[#c084fc]">import</span> { snapshotBones } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard'</span>

<span class="text-[#c084fc]">const</span> result = <span class="text-[#fde68a]">snapshotBones</span>(document.<span class="text-[#fde68a]">querySelector</span>(<span class="text-[#86efac]">'.card'</span>))
<span class="text-stone-500">// result: { name, viewportWidth, width, height, bones: Bone[] }</span>`} />
          </div>

          <div>
            <p className="text-[12px] text-stone-400 mb-1.5">Render bones to an HTML string (SSR / vanilla)</p>
            <CodeBlock language="ts" code={`<span class="text-[#c084fc]">import</span> { renderBones } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard'</span>

<span class="text-[#c084fc]">const</span> html = <span class="text-[#fde68a]">renderBones</span>(result, <span class="text-[#86efac]">'#d4d4d4'</span>)
container.innerHTML = html`} />
          </div>
        </div>
      </section>

      {/* Note */}
      <div className="border-l-2 border-[#d6d3d1] pl-4 py-1">
        <p className="text-[14px] text-[#78716c]">
          The bones array is framework-agnostic — just positioned rectangles. Render them however you want, or use
          the React <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> wrapper which handles everything automatically.
        </p>
      </div>
    </div>

    <TableOfContents items={tocItems} />
    </>
  );
}
