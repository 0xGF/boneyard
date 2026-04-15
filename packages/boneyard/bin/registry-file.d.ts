/**
 * Detect whether the consumer project is TypeScript or JavaScript, so the
 * CLI and Vite plugin can emit `registry.ts` vs `registry.js` consistently.
 *
 * Heuristics (first match wins):
 *   1. `tsconfig.json` present  → 'ts'
 *   2. `jsconfig.json` present  → 'js'
 *   3. `next-env.d.ts` present  → 'ts'
 *   4. `typescript` in (dev)deps → 'ts'
 *   5. any .ts/.tsx/.mts/.cts source under src/app/pages/components/lib → 'ts'
 *   6. fallback                 → 'js'
 */
export function detectRegistryExtension(projectRoot?: string): 'ts' | 'js'
