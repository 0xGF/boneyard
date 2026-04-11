import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "quick-start", label: "Quick start" },
  { id: "how-scanning-works", label: "How scanning works" },
  { id: "dynamic-type", label: "Dynamic Type" },
  { id: "other-ways", label: "Other ways to generate" },
  { id: "props", label: "Props" },
  { id: "dark-mode", label: "Dark mode" },
  { id: "auth", label: "Auth-protected screens" },
  { id: "expo-metro", label: "Expo & Metro setup" },
  { id: "project-structure", label: "Project structure" },
  { id: "differences", label: "Differences from web" },
];

export default function ReactNativePage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">React Native</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          Use boneyard in React Native and Expo apps. Same pixel-perfect skeletons, same bone format — native renderer with built-in device scanning.
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
            <CodeBlock language="tsx" code={`<span class="text-[#c084fc]">import</span> { Skeleton } <span class="text-[#c084fc]">from</span> <span class="text-[#86efac]">'boneyard-js/native'</span>

<span class="text-[#c084fc]">function</span> <span class="text-[#fde68a]">ProfileScreen</span>() {
  <span class="text-[#c084fc]">const</span> [loading, setLoading] = <span class="text-[#fde68a]">useState</span>(<span class="text-[#fbbf24]">true</span>)
  <span class="text-[#c084fc]">return</span> (
    &lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">name</span>=<span class="text-[#86efac]">"profile-card"</span> <span class="text-[#93c5fd]">loading</span>={loading}&gt;
      &lt;<span class="text-[#fde68a]">ProfileCard</span> /&gt;
    &lt;/<span class="text-[#fde68a]">Skeleton</span>&gt;
  )
}`} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-500 mb-2">3. Generate bones</p>
            <CodeBlock language="bash" code={`npx boneyard-js build --native --out ./bones`} />
            <p className="text-[13px] text-stone-400 mt-2">
              Then open your app on device or simulator. Bones are captured automatically.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-medium text-stone-500 mb-2">4. Import the registry and reload</p>
            <CodeBlock language="tsx" code={`<span class="text-stone-500">// Add once in your app entry (e.g. App.tsx)</span>
<span class="text-[#c084fc]">import</span> <span class="text-[#86efac]">'./bones/registry'</span>`} />
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[13px] text-amber-700">
                <strong className="text-amber-800">This import is required.</strong> Without it, skeletons won&apos;t render.
                Reload your app after adding it — the skeletons will render on the next launch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How scanning works */}
      <section>
        <div className="section-divider" id="how-scanning-works">
          <span>How native scanning works</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          On web, the CLI opens a headless browser and snapshots the DOM. On React Native, the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">{'<Skeleton>'}</code> component
          itself does the scanning — no browser needed.
        </p>
        <div className="rounded-lg border border-stone-200 bg-[#1a1a1a] p-5 font-mono text-[13px] leading-[1.8] overflow-x-auto">
          <div className="text-stone-500"># Terminal — start the capture listener</div>
          <div className="text-[#86efac]">npx boneyard-js build --native --out ./bones</div>
          <div className="text-stone-600 mt-2"># Open your app on device or simulator</div>
          <div className="text-stone-600"># Bones appear in the CLI as they&apos;re captured</div>
          <div className="text-stone-600"># Press Ctrl+C when done</div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-[13px] font-medium text-stone-700 mb-2">What happens under the hood</p>
            <ol className="text-[13px] text-[#78716c] space-y-1.5 list-decimal pl-4">
              <li>The CLI starts a listener on port 9999 and waits for bone data.</li>
              <li>In dev mode, every <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">{'<Skeleton name="...">'}</code> checks if the CLI is listening.</li>
              <li>If found, it walks the React fiber tree, measures each native view&apos;s position with <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">UIManager.measureLayout</code>, and sends the results.</li>
              <li>The CLI writes <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">.bones.json</code> files + a <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">registry.js</code> that imports from <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">boneyard-js/native</code>.</li>
            </ol>
            <p className="text-[13px] text-[#78716c] mt-3">
              Scanning happens once per named skeleton, 800ms after mount. In production builds (<code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">__DEV__ === false</code>) the scan code is completely inactive — zero overhead.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-[13px] font-medium text-amber-800 mb-1">Reload after generating bones</p>
          <p className="text-[13px] text-amber-700">
            After running <code className="text-[12px] bg-amber-100 px-1 py-0.5 rounded">build --native</code>, you need to reload your app for the new bone data to take effect.
            The registry is imported at startup — a hot reload won&apos;t pick up new <code className="text-[12px] bg-amber-100 px-1 py-0.5 rounded">.bones.json</code> files.
            Shake your device and tap &quot;Reload&quot;, or press <code className="text-[12px] bg-amber-100 px-1 py-0.5 rounded">r</code> in the Expo terminal.
          </p>
        </div>
      </section>

      {/* Dynamic Type */}
      <section>
        <div className="section-divider" id="dynamic-type">
          <span>Dynamic Type &amp; accessibility text sizing</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          Boneyard adapts to iOS Dynamic Type and Android font scaling at runtime. When a user changes their
          text size, the actual content grows or shrinks — boneyard detects the new container height and
          scales bone positions proportionally to match.
        </p>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-[13px] font-medium text-amber-800 mb-1">Generate bones at default font scale</p>
          <p className="text-[13px] text-amber-700">
            Always capture bones with your device set to the <strong>default</strong> text size (font scale 1.0).
            The skeleton automatically scales bone positions up or down at runtime to match the user&apos;s
            actual font scale — no need to capture at multiple sizes.
          </p>
        </div>
        <p className="text-[13px] text-stone-400 mt-3">
          Under the hood, children are rendered invisibly behind the skeleton overlay so the container
          reflects the real content height. A <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">scaleY</code> ratio
          adjusts all bone Y positions and heights to fit.
        </p>
      </section>

      {/* Other ways to get bones */}
      <section>
        <div className="section-divider" id="other-ways">
          <span>Other ways to generate bones</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          The <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--native</code> flag is the easiest way. But if you need alternatives:
        </p>

        <div className="space-y-6">
          <div>
            <p className="text-[13px] font-medium text-stone-700 mb-2">Expo web</p>
            <p className="text-[14px] text-[#78716c] leading-relaxed mb-3">
              If your app supports Expo web, you can use the standard web CLI. Create a capture page with the <strong className="text-stone-600">web</strong> Skeleton,
              run <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx expo start --web</code>, then <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">npx boneyard-js build http://localhost:8081 --native</code>.
              The <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--native</code> flag ensures the registry imports from <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/native</code>.
            </p>
          </div>

          <div>
            <p className="text-[13px] font-medium text-stone-700 mb-2">Copy from a web project</p>
            <p className="text-[14px] text-[#78716c] leading-relaxed mb-3">
              If you already have a web version with boneyard, just copy the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">.bones.json</code> files. The format is identical across platforms.
            </p>
            <CodeBlock language="bash" code={`cp src/bones/*.bones.json ../my-rn-app/bones/`} />
          </div>

          <div>
            <p className="text-[13px] font-medium text-stone-700 mb-2">Write by hand</p>
            <p className="text-[14px] text-[#78716c] leading-relaxed mb-3">
              Bones are compact tuples: <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">[x, y, w, h, r, c?]</code>.
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded ml-1">x/w</code> are % of container width,
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded ml-1">y/h</code> are pixels,
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded ml-1">r</code> is border radius,
              <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded ml-1">c</code> marks container bones.
            </p>
            <CodeBlock filename="bones/card.bones.json" language="json" code={`{
  <span class="text-[#93c5fd]">"breakpoints"</span>: {
    <span class="text-[#93c5fd]">"375"</span>: {
      <span class="text-[#93c5fd]">"name"</span>: <span class="text-[#86efac]">"card"</span>,
      <span class="text-[#93c5fd]">"viewportWidth"</span>: <span class="text-[#fbbf24]">375</span>,
      <span class="text-[#93c5fd]">"width"</span>: <span class="text-[#fbbf24]">343</span>,
      <span class="text-[#93c5fd]">"height"</span>: <span class="text-[#fbbf24]">200</span>,
      <span class="text-[#93c5fd]">"bones"</span>: [
        [<span class="text-[#fbbf24]">0</span>, <span class="text-[#fbbf24]">0</span>, <span class="text-[#fbbf24]">100</span>, <span class="text-[#fbbf24]">200</span>, <span class="text-[#fbbf24]">12</span>, <span class="text-[#fbbf24]">true</span>],
        [<span class="text-[#fbbf24]">4</span>, <span class="text-[#fbbf24]">16</span>, <span class="text-[#fbbf24]">18</span>, <span class="text-[#fbbf24]">64</span>, <span class="text-[#86efac]">"50%"</span>],
        [<span class="text-[#fbbf24]">26</span>, <span class="text-[#fbbf24]">20</span>, <span class="text-[#fbbf24]">45</span>, <span class="text-[#fbbf24]">18</span>, <span class="text-[#fbbf24]">6</span>]
      ]
    }
  }
}`} />
          </div>
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
                <td className="px-4 py-2">Resolve bones from registry by name (also used for scanning)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">initialBones</td>
                <td className="px-4 py-2">ResponsiveBones</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Pass bones directly (takes precedence over registry)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">color</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">#d4d4d4</td>
                <td className="px-4 py-2">Bone color in light mode</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">darkColor</td>
                <td className="px-4 py-2">string</td>
                <td className="px-4 py-2">#3a3a3c</td>
                <td className="px-4 py-2">Bone color in dark mode</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">dark</td>
                <td className="px-4 py-2">boolean</td>
                <td className="px-4 py-2">auto</td>
                <td className="px-4 py-2">Force dark/light mode (defaults to system scheme)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">animate</td>
                <td className="px-4 py-2">boolean</td>
                <td className="px-4 py-2">true</td>
                <td className="px-4 py-2">Enable pulse animation</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 font-mono text-stone-800">style</td>
                <td className="px-4 py-2">ViewStyle</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Additional style for the container</td>
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
              <tr>
                <td className="px-4 py-2 font-mono text-stone-800">fallback</td>
                <td className="px-4 py-2">ReactNode</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">Shown when loading but no bones are available</td>
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
          Auto-detects via <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">useColorScheme()</code>.
          Override with the <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">dark</code> prop if your app manages its own theme:
        </p>
        <CodeBlock language="tsx" code={`<span class="text-stone-500">// Force light mode regardless of system theme</span>
&lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">loading</span>={loading} <span class="text-[#93c5fd]">dark</span>={<span class="text-[#fbbf24]">false</span>}&gt;

<span class="text-stone-500">// Force dark mode</span>
&lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">loading</span>={loading} <span class="text-[#93c5fd]">dark</span>={<span class="text-[#fbbf24]">true</span>}&gt;

<span class="text-stone-500">// Custom dark mode colors</span>
&lt;<span class="text-[#fde68a]">Skeleton</span> <span class="text-[#93c5fd]">loading</span>={loading} <span class="text-[#93c5fd]">dark</span> <span class="text-[#93c5fd]">darkColor</span>=<span class="text-[#86efac]">"#1e1e2e"</span>&gt;`} />
      </section>

      {/* Expo / Metro */}
      <section>
        <div className="section-divider" id="expo-metro">
          <span>Expo &amp; Metro setup</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden mb-4">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Requirement</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Minimum version</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">Expo SDK</td>
                <td className="px-4 py-2">50+ (Fabric/New Architecture enabled by default)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">React Native (bare)</td>
                <td className="px-4 py-2">0.71+ (works with both Paper and Fabric)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mb-4">
          Import from <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/native</code> (not <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">boneyard-js/react-native</code>).
          Metro has special handling for paths containing &quot;react-native&quot; which can cause resolution issues.
        </p>

        <p className="text-[14px] text-[#78716c] leading-relaxed mb-4">
          If you link the package locally during development, add the source directory to Metro&apos;s watch folders:
        </p>
        <CodeBlock filename="metro.config.js" language="js" code={`<span class="text-[#c084fc]">const</span> { getDefaultConfig } = <span class="text-[#fde68a]">require</span>(<span class="text-[#86efac]">'expo/metro-config'</span>)
<span class="text-[#c084fc]">const</span> path = <span class="text-[#fde68a]">require</span>(<span class="text-[#86efac]">'path'</span>)

<span class="text-[#c084fc]">const</span> config = <span class="text-[#fde68a]">getDefaultConfig</span>(__dirname)

<span class="text-stone-500">// Only needed for local symlinked development</span>
<span class="text-[#c084fc]">const</span> boneyardPath = path.<span class="text-[#fde68a]">resolve</span>(__dirname, <span class="text-[#86efac]">'../boneyard/packages/boneyard'</span>)
config.watchFolders = [boneyardPath]
config.resolver.nodeModulesPaths = [
  path.<span class="text-[#fde68a]">resolve</span>(__dirname, <span class="text-[#86efac]">'node_modules'</span>),
  path.<span class="text-[#fde68a]">resolve</span>(boneyardPath, <span class="text-[#86efac]">'node_modules'</span>),
]

module.exports = config`} />

        <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-[13px] text-[#78716c]">
            When using boneyard-js from npm (not a local symlink), no Metro config changes are needed.
          </p>
        </div>
      </section>

      {/* Project structure */}
      <section>
        <div className="section-divider" id="project-structure">
          <span>Project structure</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 bg-[#1a1a1a] p-5 font-mono text-[13px] leading-[1.8] overflow-x-auto">
          <div className="text-stone-500">my-rn-app/</div>
          <div className="text-stone-400 pl-4">├── bones/</div>
          <div className="text-[#86efac] pl-8">├── profile-card.bones.json</div>
          <div className="text-[#86efac] pl-8">├── feed-item.bones.json</div>
          <div className="text-[#fde68a] pl-8">└── registry.js <span className="text-stone-600">← auto-generated</span></div>
          <div className="text-stone-400 pl-4">├── components/</div>
          <div className="text-stone-400 pl-8">├── ProfileCard.tsx</div>
          <div className="text-stone-400 pl-8">└── FeedItem.tsx</div>
          <div className="text-[#93c5fd] pl-4">├── App.tsx <span className="text-stone-600">← import &apos;./bones/registry&apos;</span></div>
          <div className="text-stone-400 pl-4">├── app.json</div>
          <div className="text-stone-400 pl-4">└── package.json</div>
        </div>
      </section>

      {/* Differences from web */}
      <section>
        <div className="section-divider" id="differences">
          <span>Differences from web</span>
        </div>
        <div className="mt-4 rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-4 py-2 font-medium text-stone-700">Feature</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">Web</th>
                <th className="text-left px-4 py-2 font-medium text-stone-700">React Native</th>
              </tr>
            </thead>
            <tbody className="text-[#78716c]">
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">Import</td>
                <td className="px-4 py-2 font-mono text-[12px]">boneyard-js/react</td>
                <td className="px-4 py-2 font-mono text-[12px]">boneyard-js/native</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">CLI</td>
                <td className="px-4 py-2 font-mono text-[12px]">npx boneyard-js build</td>
                <td className="px-4 py-2 font-mono text-[12px]">npx boneyard-js build --native</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">How it scans</td>
                <td className="px-4 py-2">Headless browser (Playwright)</td>
                <td className="px-4 py-2">Fiber tree + UIManager on device</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">Animation</td>
                <td className="px-4 py-2">CSS keyframes</td>
                <td className="px-4 py-2">Animated API (opacity pulse)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">Dark mode</td>
                <td className="px-4 py-2">prefers-color-scheme + .dark class</td>
                <td className="px-4 py-2">useColorScheme() + dark prop</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">Responsive</td>
                <td className="px-4 py-2">ResizeObserver on container</td>
                <td className="px-4 py-2">useWindowDimensions (screen width)</td>
              </tr>
              <tr className="border-b border-stone-100">
                <td className="px-4 py-2 text-stone-800">Text scaling</td>
                <td className="px-4 py-2">N/A (browser handles it)</td>
                <td className="px-4 py-2">scaleY adapts to Dynamic Type / font scale</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-stone-800">Bone format</td>
                <td className="px-4 py-2" colSpan={2}>Identical .bones.json — fully cross-platform</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Auth */}
      <section>
        <div className="section-divider" id="auth">
          <span>Auth-protected screens</span>
        </div>
        <p className="text-[14px] text-[#78716c] leading-relaxed mt-4 mb-4">
          With <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">--native</code>, auth is a non-issue.
          Your app is already running on the device with the user logged in — the Skeleton component scans
          whatever is currently rendered. There are no cookies or headers to configure because no browser
          is involved.
        </p>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-[13px] text-[#78716c]">
            The <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">auth</code> config
            in <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">boneyard.config.json</code> (cookies, headers) is only
            for the web CLI path where a headless browser needs to access protected pages. With <code className="text-[12px] bg-white px-1 py-0.5 rounded border border-stone-200">--native</code>,
            the device handles auth natively — just open the screen you want to scan.
          </p>
        </div>
      </section>

      {/* Next steps */}
      <section>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-[13px] font-medium text-stone-700 mb-2">Next steps</p>
          <ul className="text-[13px] text-[#78716c] space-y-1 list-disc pl-4">
            <li>See <a href="/install" className="text-stone-800 underline underline-offset-2">Getting Started</a> for the full web setup walkthrough</li>
            <li>See <a href="/output" className="text-stone-800 underline underline-offset-2">Output</a> to understand the .bones.json format in detail</li>
            <li>Browse <a href="/try-it" className="text-stone-800 underline underline-offset-2">Examples</a> for bone data you can use in your RN app</li>
          </ul>
        </div>
      </section>
    </div>

    <TableOfContents items={tocItems} />
    </>
  );
}
