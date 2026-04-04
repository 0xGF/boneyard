import { CodeBlock } from "@/components/ui/code-block";

function PropDef({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2 first:pt-0">
      <code className="font-[family-name:var(--font-mono)] text-[13px] text-[#1c1917] sm:w-28 shrink-0 font-medium">{name}</code>
      <p className="text-[14px] text-[#78716c] leading-relaxed">{children}</p>
    </div>
  );
}

export default function OutputPage() {
  return (
    <div className="max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Output Format</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          What boneyard generates when it snapshots your UI — the bones JSON format, where files go, and how to use them.
        </p>
      </div>

      {/* Where files live */}
      <section>
        <div className="section-divider">
          <span>Generated files</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Running <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build</code> creates
          one <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.bones.json</code> file per
          named <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> in your app:
        </p>
        <div className="rounded-lg border border-stone-200 bg-[#1a1a1a] p-5 font-mono text-[13px] leading-[1.8]">
          <div className="text-stone-500">src/bones/ <span className="text-stone-600">← auto-created by the CLI</span></div>
          <div className="text-[#86efac] pl-4">├── blog-card.bones.json <span className="text-stone-600">← from &lt;Skeleton name=&quot;blog-card&quot;&gt;</span></div>
          <div className="text-[#86efac] pl-4">├── profile.bones.json</div>
          <div className="text-[#86efac] pl-4">└── dashboard.bones.json</div>
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
        <div className="section-divider">
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
        <div className="section-divider">
          <span>Bone fields</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Each bone is a compact array: <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">[x, y, w, h, r]</code> with
          an optional 6th element for container bones. <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">x</code> and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">w</code> are
          percentages of the container width. <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">y</code> and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">h</code> are pixels.
        </p>
        <div className="divide-y divide-stone-100">
          <PropDef name="x">Horizontal offset from the left edge (px).</PropDef>
          <PropDef name="y">Vertical offset from the top edge (px).</PropDef>
          <PropDef name="w">Width (px).</PropDef>
          <PropDef name="h">Height (px).</PropDef>
          <PropDef name="r">Border radius. A number for pixels, or a string like <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&quot;50%&quot;</code> for circles.</PropDef>
          <PropDef name="c">
            Container flag. When <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">true</code>, this bone represents a container element (card, panel) that has child bones on top. Rendered at a lighter shade so children stand out.
          </PropDef>
        </div>
      </section>

      {/* Result-level fields */}
      <section>
        <div className="section-divider">
          <span>Result fields</span>
        </div>
        <div className="mt-4 divide-y divide-stone-100">
          <PropDef name="name">Identifier from the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">name</code> prop, or <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&apos;component&apos;</code> by default.</PropDef>
          <PropDef name="viewportWidth">Browser viewport width at capture time (px).</PropDef>
          <PropDef name="width">Container element width at capture time (px).</PropDef>
          <PropDef name="height">Total content height (px). Used to size the skeleton overlay.</PropDef>
          <PropDef name="bones">Flat array of positioned rectangles — every visible element as a bone.</PropDef>
        </div>
      </section>

      {/* Direct API */}
      <section>
        <div className="section-divider">
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
  );
}
