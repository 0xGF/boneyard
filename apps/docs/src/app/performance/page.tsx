import { CodeBlock } from "@/components/ui/code-block";
import { TableOfContents } from "@/components/toc";

const tocItems = [
  { id: "how-it-works", label: "How it works" },
  { id: "default-path", label: "Default path" },
  { id: "explicit-compiled-path", label: "Explicit compiled path" },
  { id: "mutation-detection", label: "Mutation detection" },
  { id: "benchmarks", label: "Benchmarks" },
];

export default function PerformancePage() {
  return (
    <>
    <div className="w-full max-w-[720px] px-6 pt-14 pb-12 space-y-12">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Performance</h1>
        <p className="text-[15px] text-[#78716c] leading-relaxed">
          The layout engine compiles descriptor trees once, reuses text metrics,
          and caches subtree layouts by width. Repeated relayouts are just arithmetic.
        </p>
      </div>

      {/* How it works */}
      <section>
        <div className="section-divider" id="how-it-works">
          <span>How it works</span>
        </div>
        <div className="mt-4 space-y-4">
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            When you call{" "}
            <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">computeLayout(descriptor, width)</code>,
            the engine does two things:
          </p>
          <div className="space-y-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="text-[13px] font-semibold text-stone-900 mb-1">1. Cold step (first call)</div>
              <p className="text-[13px] text-[#78716c] leading-relaxed">
                Compiles the descriptor tree — prepares text metrics, resolves padding/margin,
                and builds reusable node metadata. This is the expensive part.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="text-[13px] font-semibold text-stone-900 mb-1">2. Hot step (subsequent calls)</div>
              <p className="text-[13px] text-[#78716c] leading-relaxed">
                Reuses the compiled tree and subtree caches keyed by width.
                Only box-model arithmetic runs — no text re-measurement, no tree re-walking.
              </p>
            </div>
          </div>
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            This happens automatically. If you pass the same descriptor object twice,
            the second call reuses the compiled state from the first.
          </p>
        </div>
      </section>

      {/* Default path */}
      <section>
        <div className="section-divider" id="default-path">
          <span>Default path</span>
        </div>
        <div className="mt-4 space-y-4">
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            The simplest API. The engine auto-compiles on the first call and caches for subsequent ones.
          </p>
          <CodeBlock
            language="ts"
            code={`import { computeLayout } from "boneyard-js"

const mobile = computeLayout(descriptor, 375)   // cold: compiles + layouts
const desktop = computeLayout(descriptor, 1280)  // warm: reuses compiled`}
          />
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            If you only use{" "}
            <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">computeLayout</code>,
            you don&apos;t need to change anything. You already get the caching benefit.
          </p>
        </div>
      </section>

      {/* Explicit compiled path */}
      <section>
        <div className="section-divider" id="explicit-compiled-path">
          <span>Explicit compiled path</span>
        </div>
        <div className="mt-4 space-y-4">
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            Use{" "}
            <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">compileDescriptor()</code>{" "}
            when you want to control exactly when the cold step happens.
          </p>
          <CodeBlock
            language="ts"
            code={`import { compileDescriptor, computeLayout } from "boneyard-js"

const compiled = compileDescriptor(descriptor)

const mobile  = computeLayout(compiled, 375)   // hot
const tablet  = computeLayout(compiled, 768)   // hot
const desktop = computeLayout(compiled, 1280)  // hot`}
          />
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            This is useful for:
          </p>
          <ul className="text-[13px] text-[#78716c] leading-relaxed list-disc pl-4 space-y-1">
            <li>SSR rendering at multiple breakpoints</li>
            <li>Descriptor registries loaded once at startup</li>
            <li>Animation loops or responsive tools that relayout often</li>
            <li>Benchmarking cold vs warm cost separately</li>
          </ul>
        </div>
      </section>

      {/* Mutation detection */}
      <section>
        <div className="section-divider" id="mutation-detection">
          <span>Mutation detection</span>
        </div>
        <div className="mt-4 space-y-4">
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            If you mutate a descriptor object in place, the engine detects the change
            and rebuilds the compiled state automatically on the next layout call.
          </p>
          <CodeBlock
            language="ts"
            code={`descriptor.children[0].text = "Updated title"

// Automatically detects the mutation and recompiles
const result = computeLayout(descriptor, 375)`}
          />
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            You can also force a rebuild immediately with{" "}
            <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">invalidateDescriptor()</code>:
          </p>
          <CodeBlock
            language="ts"
            code={`import { invalidateDescriptor } from "boneyard-js"

invalidateDescriptor(descriptor)  // clears cached compiled state`}
          />
        </div>
      </section>

      {/* Benchmarks */}
      <section>
        <div className="section-divider" id="benchmarks">
          <span>Benchmarks</span>
        </div>
        <div className="mt-4 space-y-4">
          <p className="text-[13px] text-[#78716c] leading-relaxed">
            Measured with the built-in benchmark runner
            (<code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">pnpm --dir packages/boneyard benchmark</code>).
          </p>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-stone-400">
                  <th className="pb-2 pr-4 font-medium">Case</th>
                  <th className="pb-2 pr-4 font-medium">Cold</th>
                  <th className="pb-2 pr-4 font-medium">Warm</th>
                  <th className="pb-2 pr-4 font-medium">Compiled</th>
                  <th className="pb-2 font-medium">Speedup</th>
                </tr>
              </thead>
              <tbody className="text-stone-700">
                <tr className="border-t border-stone-100">
                  <td className="py-2.5 pr-4 font-medium">text-leaf</td>
                  <td className="py-2.5 pr-4">0.041 ms</td>
                  <td className="py-2.5 pr-4">0.0004 ms</td>
                  <td className="py-2.5 pr-4">0.0004 ms</td>
                  <td className="py-2.5">
                    <span className="text-emerald-600 font-medium">~105x</span>
                  </td>
                </tr>
                <tr className="border-t border-stone-100">
                  <td className="py-2.5 pr-4 font-medium">dashboard-card</td>
                  <td className="py-2.5 pr-4">0.096 ms</td>
                  <td className="py-2.5 pr-4">0.006 ms</td>
                  <td className="py-2.5 pr-4">0.006 ms</td>
                  <td className="py-2.5">
                    <span className="text-emerald-600 font-medium">~16x</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[13px] text-[#78716c] leading-relaxed">
            Cold = brand new descriptor each call. Warm/compiled = same object, cache populated.
            Run your own benchmarks with{" "}
            <code className="text-[12px] bg-stone-100 px-1 py-0.5 rounded">pnpm --dir packages/boneyard benchmark</code>.
          </p>
        </div>
      </section>
    </div>

    <TableOfContents items={tocItems} />
    </>
  );
}
