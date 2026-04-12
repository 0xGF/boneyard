import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "file", label: "Config file" },
  { id: "build-options", label: "Build options" },
  { id: "runtime-options", label: "Runtime options" },
  { id: "animation", label: "Animation" },
  { id: "dark-mode", label: "Dark mode" },
  { id: "auth", label: "Authentication" },
  { id: "precedence", label: "Precedence" },
];

export default function ConfigPage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Config</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          Customize boneyard via <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> in your project root. Controls both the CLI build and runtime defaults for all <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> components.
        </p>
      </div>

      {/* Full example */}
      <section>
        <div className="section-divider" id="file">
          <span>Config file</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Create <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> in your project root. All fields are optional.
        </p>
        <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-stone-500">// Build options</span>
  <span class="text-[#93c5fd]">"breakpoints"</span>: [<span class="text-[#fbbf24]">375</span>, <span class="text-[#fbbf24]">768</span>, <span class="text-[#fbbf24]">1280</span>],
  <span class="text-[#93c5fd]">"out"</span>: <span class="text-[#86efac]">"./src/bones"</span>,
  <span class="text-[#93c5fd]">"wait"</span>: <span class="text-[#fbbf24]">800</span>,

  <span class="text-stone-500">// Runtime defaults</span>
  <span class="text-[#93c5fd]">"color"</span>: <span class="text-[#86efac]">"#e5e5e5"</span>,
  <span class="text-[#93c5fd]">"darkColor"</span>: <span class="text-[#86efac]">"#2a2a2a"</span>,
  <span class="text-[#93c5fd]">"animate"</span>: <span class="text-[#86efac]">"shimmer"</span>,
  <span class="text-[#93c5fd]">"shimmerColor"</span>: <span class="text-[#86efac]">"#ebebeb"</span>,
  <span class="text-[#93c5fd]">"darkShimmerColor"</span>: <span class="text-[#86efac]">"#333333"</span>,
  <span class="text-[#93c5fd]">"speed"</span>: <span class="text-[#86efac]">"2s"</span>,
  <span class="text-[#93c5fd]">"shimmerAngle"</span>: <span class="text-[#fbbf24]">110</span>,
  <span class="text-[#93c5fd]">"stagger"</span>: <span class="text-[#fbbf24]">80</span>,
  <span class="text-[#93c5fd]">"transition"</span>: <span class="text-[#fbbf24]">300</span>,

  <span class="text-stone-500">// Auth (for protected pages — web only)</span>
  <span class="text-[#93c5fd]">"resolveEnvVars"</span>: <span class="text-[#fbbf24]">true</span>,
  <span class="text-[#93c5fd]">"auth"</span>: {
    <span class="text-[#93c5fd]">"cookies"</span>: [{ <span class="text-[#93c5fd]">"name"</span>: <span class="text-[#86efac]">"session"</span>, <span class="text-[#93c5fd]">"value"</span>: <span class="text-[#86efac]">"env[SESSION_TOKEN]"</span>, <span class="text-[#93c5fd]">"domain"</span>: <span class="text-[#86efac]">"localhost"</span> }],
    <span class="text-[#93c5fd]">"headers"</span>: { <span class="text-[#93c5fd]">"Authorization"</span>: <span class="text-[#86efac]">"Bearer env[API_TOKEN]"</span> }
  }
}`} />
      </section>

      {/* Build options */}
      <section>
        <div className="section-divider" id="build-options">
          <span>Build options</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          These control the CLI capture step. CLI flags override config values.
        </p>
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Key</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Type</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Default</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">breakpoints</td>
                <td className="px-4 py-2">number[]</td>
                <td className="px-4 py-2">auto</td>
                <td className="px-4 py-2">Viewport widths to capture. Auto-detects Tailwind breakpoints, falls back to [375, 768, 1280]</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">out</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">./src/bones</td>
                <td className="px-4 py-2">Output directory for generated <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.bones.json</code> files and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">registry.js</code></td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">wait</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">800</td>
                <td className="px-4 py-2">Milliseconds to wait after page load before capturing</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Runtime options */}
      <section>
        <div className="section-divider" id="runtime-options">
          <span>Runtime options</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Runtime options are baked into the generated <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">registry.js</code> via <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">configureBoneyard()</code>. Per-component props override these.
        </p>
        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Key</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Type</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Default</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Description</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">color</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">#f0f0f0</td>
                <td className="px-4 py-2">Bone fill color (light mode)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">darkColor</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">#222222</td>
                <td className="px-4 py-2">Bone fill color (dark mode)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">animate</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">pulse</td>
                <td className="px-4 py-2"><code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">pulse</code>, <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">shimmer</code>, or <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">solid</code></td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">shimmerColor</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">#f7f7f7</td>
                <td className="px-4 py-2">Shimmer highlight color (light mode)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">darkShimmerColor</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">#2c2c2c</td>
                <td className="px-4 py-2">Shimmer highlight color (dark mode)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">speed</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">2s / 1.8s</td>
                <td className="px-4 py-2">Animation duration (shimmer / pulse)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">shimmerAngle</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">110</td>
                <td className="px-4 py-2">Shimmer gradient angle in degrees</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">stagger</td>
                <td className="px-4 py-2">number | boolean</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Delay between bones in ms. <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">true</code> = 80ms</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">transition</td>
                <td className="px-4 py-2">number | boolean</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Fade transition when loading ends in ms. <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">true</code> = 300ms</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">boneClass</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">CSS class applied to each bone element</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Animation */}
      <section>
        <div className="section-divider" id="animation">
          <span>Animation</span>
        </div>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-[14px] font-semibold mb-2">Pulse</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed mb-3">
              Default. Bones fade in and out. Speed defaults to 1.8s.
            </p>
            <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-[#93c5fd]">"animate"</span>: <span class="text-[#86efac]">"pulse"</span>,
  <span class="text-[#93c5fd]">"speed"</span>: <span class="text-[#86efac]">"1.8s"</span>
}`} />
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-2">Shimmer</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed mb-3">
              A diagonal highlight sweeps across bones. Customize the highlight color, speed, and angle.
            </p>
            <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-[#93c5fd]">"animate"</span>: <span class="text-[#86efac]">"shimmer"</span>,
  <span class="text-[#93c5fd]">"shimmerColor"</span>: <span class="text-[#86efac]">"#ebebeb"</span>,
  <span class="text-[#93c5fd]">"darkShimmerColor"</span>: <span class="text-[#86efac]">"#333333"</span>,
  <span class="text-[#93c5fd]">"speed"</span>: <span class="text-[#86efac]">"2s"</span>,
  <span class="text-[#93c5fd]">"shimmerAngle"</span>: <span class="text-[#fbbf24]">110</span>
}`} />
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-2">Solid</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed mb-3">
              No animation. Static bone rectangles.
            </p>
            <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-[#93c5fd]">"animate"</span>: <span class="text-[#86efac]">"solid"</span>
}`} />
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-2">Stagger</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed mb-3">
              Bones appear one after another with a delay. Works with any animation style.
            </p>
            <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-[#93c5fd]">"stagger"</span>: <span class="text-[#fbbf24]">80</span>
}`} />
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-2">Transition</h3>
            <p className="text-[13px] text-[#78716c] leading-relaxed mb-3">
              Fade out the skeleton overlay when loading ends.
            </p>
            <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-[#93c5fd]">"transition"</span>: <span class="text-[#fbbf24]">300</span>
}`} />
          </div>
        </div>
      </section>

      {/* Dark mode */}
      <section>
        <div className="section-divider" id="dark-mode">
          <span>Dark mode</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Boneyard detects dark mode via the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.dark</code> class on <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;html&gt;</code> or any parent element (standard Tailwind convention). It does <strong>not</strong> use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">prefers-color-scheme</code> — this gives you explicit control over when dark bone colors are used.
        </p>
        <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-[#93c5fd]">"color"</span>: <span class="text-[#86efac]">"#e5e5e5"</span>,
  <span class="text-[#93c5fd]">"darkColor"</span>: <span class="text-[#86efac]">"#2a2a2a"</span>,
  <span class="text-[#93c5fd]">"shimmerColor"</span>: <span class="text-[#86efac]">"#ebebeb"</span>,
  <span class="text-[#93c5fd]">"darkShimmerColor"</span>: <span class="text-[#86efac]">"#333333"</span>
}`} />
        <p className="text-[13px] text-stone-400 mt-3">
          When the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.dark</code> class is present, <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">darkColor</code> and <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">darkShimmerColor</code> are used automatically. Per-component overrides work too:
        </p>
        <div className="mt-3">
          <CodeBlock language="tsx" code={`<span class="text-stone-500">// Override per component</span>
&lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">color</span>=<span class="text-[#86efac]">"#d4d4d4"</span> <span class="text-[#93c5fd]">darkColor</span>=<span class="text-[#86efac]">"#333"</span> /&gt;`} />
        </div>
      </section>

      {/* Auth */}
      <section>
        <div className="section-divider" id="auth">
          <span>Authentication</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          For protected pages, configure cookies and headers so the CLI can access them during capture. Use <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">env[VAR]</code> syntax with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">resolveEnvVars</code> to keep tokens out of your config file.
        </p>
        <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-[#93c5fd]">"resolveEnvVars"</span>: <span class="text-[#fbbf24]">true</span>,
  <span class="text-[#93c5fd]">"auth"</span>: {
    <span class="text-[#93c5fd]">"cookies"</span>: [
      {
        <span class="text-[#93c5fd]">"name"</span>: <span class="text-[#86efac]">"session"</span>,
        <span class="text-[#93c5fd]">"value"</span>: <span class="text-[#86efac]">"env[SESSION_TOKEN]"</span>,
        <span class="text-[#93c5fd]">"domain"</span>: <span class="text-[#86efac]">"localhost"</span>
      }
    ],
    <span class="text-[#93c5fd]">"headers"</span>: {
      <span class="text-[#93c5fd]">"Authorization"</span>: <span class="text-[#86efac]">"Bearer env[API_TOKEN]"</span>
    }
  }
}`} />
        <p className="text-[13px] text-stone-400 mt-3">
          Or use the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">fixture</code> prop to provide mock content that renders without auth.
        </p>
      </section>

      {/* Precedence */}
      <section>
        <div className="section-divider" id="precedence">
          <span>Precedence</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Values resolve in this order (highest to lowest priority):
        </p>
        <ol className="text-[13px] text-[#78716c] space-y-2 list-decimal pl-5">
          <li><strong className="text-stone-800">Per-component props</strong> — <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton color=&quot;#ccc&quot; /&gt;</code></li>
          <li><strong className="text-stone-800">Config file</strong> — <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> runtime options, baked into <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">registry.js</code></li>
          <li><strong className="text-stone-800">Package defaults</strong> — built-in values in <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">shared.ts</code></li>
        </ol>
        <p className="text-[13px] text-stone-400 mt-3">
          For build options, CLI flags override config file values.
        </p>
      </section>
    </div>
    <TableOfContents items={tocItems} />
    </>
  );
}
