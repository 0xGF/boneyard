import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "install", label: "1. Install" },
  { id: "wrap-your-component", label: "2. Wrap your component" },
  { id: "generate-bones", label: "3. Generate bones" },
  { id: "register-bones", label: "4. Register bones" },
  { id: "your-project-after-setup", label: "Your project after setup" },
  { id: "customization", label: "Customization" },
];

export default function InstallPage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Getting Started</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          Add skeleton loading screens to any React app in under 5 minutes.
        </p>
      </div>

      {/* Step 1 — Install */}
      <section>
        <div className="section-divider" id="install">
          <span>1. Install</span>
        </div>
        <div className="mt-4">
          <CodeBlock language="bash" code="npm install boneyard-js" />
        </div>
        <p className="text-[13px] text-stone-400 mt-2">
          Also works with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">yarn add boneyard-js</code> or <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">pnpm add boneyard-js</code>.
        </p>
      </section>

      {/* Step 2 — Wrap */}
      <section>
        <div className="section-divider" id="wrap-your-component">
          <span>2. Wrap your component</span>
        </div>
        <div className="mt-4">
          <CodeBlock filename="app/blog/page.tsx" language="tsx" code={`<span class="text-[#c084fc]">import</span> { Skeleton } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/react'</span>

<span class="text-[#c084fc]">function</span> <span class="text-[#fde68a]">BlogPage</span>() {
  <span class="text-[#c084fc]">const</span> { data, isLoading } = <span class="text-[#fde68a]">useFetch</span>(<span class="text-[#86efac]">'/api/post'</span>)

  <span class="text-[#c084fc]">return</span> (
    &lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"blog-card"</span> <span class="text-[#93c5fd]">loading</span>={isLoading}&gt;
      {data &amp;&amp; &lt;<span class="text-[#fde68a]">BlogCard</span> data={data} /&gt;}
    &lt;/<span class="text-[#fde68a]">Skeleton</span>&gt;
  )
}`} />
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4">
          Give each skeleton a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">name</code> — this
          is what the CLI uses to identify it and generate the bones file.
        </p>

        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          If your component needs data from an API or is behind authentication, add a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">fixture</code> prop
          with mock content. The CLI renders the fixture during capture — your real data isn&apos;t needed:
        </p>
        <CodeBlock filename="app/blog/page.tsx" language="tsx" code={`&lt;<span class="text-[#fde68a]">Skeleton</span>
  <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"blog-card"</span>
  <span class="text-[#93c5fd]">loading</span>={isLoading}
  <span class="text-[#93c5fd]">fixture</span>={&lt;<span class="text-[#fde68a]">BlogCard</span> data={{
    <span class="text-[#93c5fd]">title</span>: <span class="text-[#86efac]">"Sample Post"</span>,
    <span class="text-[#93c5fd]">excerpt</span>: <span class="text-[#86efac]">"Placeholder text for layout..."</span>,
    <span class="text-[#93c5fd]">author</span>: <span class="text-[#86efac]">"Jane Doe"</span>
  }} /&gt;}
&gt;
  {data &amp;&amp; &lt;<span class="text-[#fde68a]">BlogCard</span> data={data} /&gt;}
&lt;/<span class="text-[#fde68a]">Skeleton</span>&gt;`} />

        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
          <p className="text-[13px] font-medium text-stone-700">Notes</p>
          <ul className="text-[13px] text-[#78716c] space-y-1.5 list-disc pl-4">
            <li>
              <strong className="text-stone-600">Next.js App Router:</strong> <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> uses
              hooks — add <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&quot;use client&quot;</code> to any file that imports it.
            </li>
            <li>
              <strong className="text-stone-600">Data-dependent components:</strong> If your component needs API data to render,
              use the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">fixture</code> prop to provide mock content
              for the build step. The fixture is only rendered during <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build</code> — never in production.
            </li>
          </ul>
        </div>
      </section>

      {/* Step 3 — Build */}
      <section>
        <div className="section-divider" id="generate-bones">
          <span>3. Generate bones</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          With your dev server running, run the CLI. It visits your app at multiple viewport widths,
          snapshots every named <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code>,
          and writes a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.bones.json</code> file for each one.
        </p>
        <CodeBlock language="bash" code="npx boneyard-js build" />

        <p className="text-[13px] text-stone-400 mt-2 mb-4">
          Auto-detects your running dev server by scanning common ports (3000, 5173, 4321, 8080…). Captures at 375px, 768px, and 1280px by default.
        </p>

        <div className="mt-4 border-l-2 border-stone-300 pl-4 py-1">
          <p className="text-[13px] text-[#78716c]">
            Playwright is included as a dependency. On first run you may need to install the browser:{" "}
            <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx playwright install chromium</code>
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
          <p className="text-[13px] font-medium text-stone-700">Apps with authentication</p>
          <p className="text-[13px] text-[#78716c]">
            The build CLI uses a headless browser to visit your app. If your pages require login, you have a few options:
          </p>
          <ul className="text-[13px] text-[#78716c] space-y-1.5 list-disc pl-4">
            <li>
              <strong className="text-stone-600">Use the <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">fixture</code> prop</strong> — provide mock data so the CLI can capture bones without needing real user sessions. This is the recommended approach.
            </li>
            <li>
              <strong className="text-stone-600">Run against a dev server with auth disabled</strong> — many frameworks support an environment flag to bypass auth in development.
            </li>
            <li>
              <strong className="text-stone-600">Point the CLI at public pages</strong> — if your login/onboarding pages don&apos;t require auth, capture those directly and use fixtures for authenticated pages.
            </li>
          </ul>
        </div>
      </section>

      {/* Step 4 — Register */}
      <section>
        <div className="section-divider" id="register-bones">
          <span>4. Register bones</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          The build generates a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">registry.js</code> file alongside
          your bones. Add this one-line side-effect import to your app entry and every{" "}
          <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">&lt;Skeleton&gt;</code> auto-resolves its bones by name.
        </p>
        <CodeBlock filename="app/layout.tsx (or your entry file)" language="tsx" code={`<span class="text-[#c084fc]">import</span> <span class="text-[#86efac]">'./bones/registry'</span>`} />

        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          That&apos;s it. Your component stays clean — no per-file JSON imports needed:
        </p>
        <CodeBlock filename="app/blog/page.tsx" language="tsx" code={`<span class="text-[#c084fc]">import</span> { Skeleton } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/react'</span>

<span class="text-[#c084fc]">function</span> <span class="text-[#fde68a]">BlogPage</span>() {
  <span class="text-[#c084fc]">const</span> { data, isLoading } = <span class="text-[#fde68a]">useFetch</span>(<span class="text-[#86efac]">'/api/post'</span>)

  <span class="text-[#c084fc]">return</span> (
    &lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"blog-card"</span> <span class="text-[#93c5fd]">loading</span>={isLoading}&gt;
      {data &amp;&amp; &lt;<span class="text-[#fde68a]">BlogCard</span> data={data} /&gt;}
    &lt;/<span class="text-[#fde68a]">Skeleton</span>&gt;
  )
}`} />

        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4">
          boneyard picks the nearest breakpoint for the current viewport width. Re-run <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build</code> any time your layout changes to regenerate.
        </p>

        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 space-y-2">
          <p className="text-[13px] font-medium text-stone-700">Manual override</p>
          <p className="text-[13px] text-[#78716c]">
            You can still pass <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">initialBones</code> directly
            if you prefer per-component imports. It takes precedence over the registry when provided.
          </p>
        </div>
      </section>

      {/* Project structure */}
      <section>
        <div className="section-divider" id="your-project-after-setup">
          <span>Your project after setup</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-[#1a1a1a] p-5 font-mono text-[13px] leading-[1.8] overflow-x-auto">
          <div className="text-stone-500">your-app/</div>
          <div className="text-stone-400 pl-4">├── src/</div>
          <div className="text-stone-400 pl-8">├── bones/ <span className="text-stone-600">← generated by npx boneyard-js build</span></div>
          <div className="text-[#86efac] pl-12">├── blog-card.bones.json</div>
          <div className="text-[#86efac] pl-12">├── profile.bones.json</div>
          <div className="text-[#86efac] pl-12">├── dashboard.bones.json</div>
          <div className="text-[#fde68a] pl-12">└── registry.js <span className="text-stone-600">← import once in your entry file</span></div>
          <div className="text-stone-400 pl-8">├── app/</div>
          <div className="text-[#93c5fd] pl-12">├── layout.tsx <span className="text-stone-600">← import &apos;./bones/registry&apos;</span></div>
          <div className="text-stone-400 pl-12">├── blog/</div>
          <div className="text-stone-400 pl-16">└── page.tsx</div>
          <div className="text-stone-400 pl-12">└── dashboard/</div>
          <div className="text-stone-400 pl-16">└── page.tsx</div>
          <div className="text-stone-400 pl-8">└── components/</div>
          <div className="text-stone-400 pl-12">├── BlogCard.tsx</div>
          <div className="text-stone-400 pl-12">└── Dashboard.tsx</div>
          <div className="text-stone-400 pl-4">├── boneyard.config.json <span className="text-stone-600">← optional CLI defaults</span></div>
          <div className="text-stone-400 pl-4">├── package.json</div>
          <div className="text-stone-400 pl-4">└── node_modules/</div>
          <div className="text-stone-500 pl-8">└── boneyard/</div>
        </div>
        <p className="text-[13px] text-stone-400 mt-3">
          The <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">bones/</code> directory is auto-detected. If you have a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">src/</code> folder it goes
          to <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">src/bones/</code>, otherwise <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">./bones/</code>. Override
          with <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--out</code>.
        </p>
      </section>

      {/* Customization */}
      <section>
        <div className="section-divider" id="customization">
          <span>Customization</span>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-[12px] text-stone-400 mb-1.5">Custom bone color</p>
            <CodeBlock language="tsx" code={`&lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">loading</span>={isLoading} <span class="text-[#93c5fd]">color</span>=<span class="text-[#86efac]">"#c8b4f0"</span>&gt;`} />
          </div>

          <div>
            <p className="text-[12px] text-stone-400 mb-1.5">Static skeleton (no pulse animation)</p>
            <CodeBlock language="tsx" code={`&lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">loading</span>={isLoading} <span class="text-[#93c5fd]">animate</span>={<span class="text-[#fbbf24]">false</span>}&gt;`} />
          </div>

          <div>
            <p className="text-[12px] text-stone-400 mb-1.5">Config file (build + runtime defaults)</p>
            <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-[#93c5fd]">"breakpoints"</span>: [<span class="text-[#fbbf24]">390</span>, <span class="text-[#fbbf24]">820</span>, <span class="text-[#fbbf24]">1440</span>],
  <span class="text-[#93c5fd]">"out"</span>: <span class="text-[#86efac]">"./src/bones"</span>,
  <span class="text-[#93c5fd]">"color"</span>: <span class="text-[#86efac]">"#e5e5e5"</span>,
  <span class="text-[#93c5fd]">"animate"</span>: <span class="text-[#86efac]">"pulse"</span>
}`} />
          </div>
        </div>
      </section>

      {/* Config file */}
      <section>
        <div className="section-divider" id="config-file">
          <span>Config file</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Create a <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard.config.json</code> in your project root.
          Controls both the CLI and runtime defaults. Works with all frameworks.
        </p>
        <CodeBlock filename="boneyard.config.json" language="json" code={`{
  <span class="text-stone-500">// Build options</span>
  <span class="text-[#93c5fd]">"breakpoints"</span>: [<span class="text-[#fbbf24]">375</span>, <span class="text-[#fbbf24]">768</span>, <span class="text-[#fbbf24]">1280</span>],
  <span class="text-[#93c5fd]">"out"</span>: <span class="text-[#86efac]">"./src/bones"</span>,
  <span class="text-[#93c5fd]">"wait"</span>: <span class="text-[#fbbf24]">800</span>,

  <span class="text-stone-500">// Runtime defaults</span>
  <span class="text-[#93c5fd]">"color"</span>: <span class="text-[#86efac]">"#e5e5e5"</span>,
  <span class="text-[#93c5fd]">"darkColor"</span>: <span class="text-[#86efac]">"rgba(255,255,255,0.08)"</span>,
  <span class="text-[#93c5fd]">"animate"</span>: <span class="text-[#86efac]">"pulse"</span>,

  <span class="text-stone-500">// Auth (for protected pages — web only)</span>
  <span class="text-[#93c5fd]">"resolveEnvVars"</span>: <span class="text-[#fbbf24]">true</span>,
  <span class="text-[#93c5fd]">"auth"</span>: {
    <span class="text-[#93c5fd]">"cookies"</span>: [{ <span class="text-[#93c5fd]">"name"</span>: <span class="text-[#86efac]">"session"</span>, <span class="text-[#93c5fd]">"value"</span>: <span class="text-[#86efac]">"env[SESSION_TOKEN]"</span> }],
    <span class="text-[#93c5fd]">"headers"</span>: { <span class="text-[#93c5fd]">"Authorization"</span>: <span class="text-[#86efac]">"Bearer env[API_TOKEN]"</span> }
  }
}`} />
        <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden">
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
                <td className="px-4 py-2">Viewport widths (auto-detects Tailwind)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">out</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">./src/bones</td>
                <td className="px-4 py-2">Output directory</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">wait</td>
                <td className="px-4 py-2">number</td>
                <td className="px-4 py-2">800</td>
                <td className="px-4 py-2">ms to wait after page load</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">color</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">rgba(0,0,0,0.08)</td>
                <td className="px-4 py-2">Default bone color (light mode)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">darkColor</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">rgba(255,255,255,0.06)</td>
                <td className="px-4 py-2">Default bone color (dark mode)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">animate</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">pulse</td>
                <td className="px-4 py-2">Default animation (pulse, shimmer, solid)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">auth</td>
                <td className="px-4 py-2">object</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Cookies and headers for protected pages (web only)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">resolveEnvVars</td>
                <td className="px-4 py-2">boolean</td>
                <td className="px-4 py-2">false</td>
                <td className="px-4 py-2">Replace env[VAR] in auth values</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[13px] text-stone-400 mt-3">
          CLI flags override config. Per-component props override runtime defaults.
        </p>
      </section>

      {/* Next steps */}
      <section>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-[13px] font-medium text-stone-700 mb-2">Next steps</p>
          <ul className="text-[13px] text-[#78716c] space-y-1 list-disc pl-4">
            <li>See <a href="/features" className="text-stone-800 underline underline-offset-2">API Reference</a> for all props and snapshot config options</li>
            <li>Try the <a href="/demo" className="text-stone-800 underline underline-offset-2">Complex Example</a> to see live bone extraction</li>
            <li>Browse <a href="/try-it" className="text-stone-800 underline underline-offset-2">Examples</a> — blog cards, product grids, dashboards, chat threads</li>
          </ul>
        </div>
      </section>
    </div>

    <TableOfContents items={tocItems} />
    </>
  );
}
