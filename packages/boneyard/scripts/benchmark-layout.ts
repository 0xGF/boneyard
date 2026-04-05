import { createCanvas } from 'canvas'
import { compileDescriptor, computeLayout } from '../src/layout.js'
import type { SkeletonDescriptor } from '../src/types.js'

type BenchmarkCase = {
  label: string
  descriptor: SkeletonDescriptor
  widths: number[]
  coldIterations: number
  warmIterations: number
}

type BenchmarkResult = {
  label: string
  coldMs: number
  warmMs: number
  compiledMs: number
  warmSpeedupVsCold: number
  compiledSpeedupVsCold: number
}

if (typeof globalThis.OffscreenCanvas === 'undefined') {
  ;(globalThis as typeof globalThis & {
    OffscreenCanvas: new (width: number, height: number) => { getContext(type: string): unknown }
  }).OffscreenCanvas = class OffscreenCanvas {
    private _canvas: ReturnType<typeof createCanvas>

    constructor(width: number, height: number) {
      this._canvas = createCanvas(width, height)
    }

    getContext(type: string) {
      return this._canvas.getContext(type as '2d')
    }
  }
}

const cases: BenchmarkCase[] = [
  {
    label: 'text-leaf',
    descriptor: {
      text: 'A long leaf of text that wraps differently at different widths and stresses repeated relayout work.',
      font: '16px Inter',
      lineHeight: 20,
    },
    widths: [220, 360, 720],
    coldIterations: 4000,
    warmIterations: 40000,
  },
  {
    label: 'dashboard-card',
    descriptor: {
      display: 'flex',
      flexDirection: 'column',
      padding: 16,
      gap: 12,
      children: [
        { aspectRatio: 16 / 9, borderRadius: 12 },
        {
          text: 'A concise but realistic card title that may wrap on smaller widths',
          font: '700 18px Inter',
          lineHeight: 24,
        },
        {
          text: 'This skeleton body copy is long enough to wrap across multiple lines and force the layout engine to do real work instead of a trivial single-line case.',
          font: '400 14px Inter',
          lineHeight: 20,
          margin: { bottom: 8 },
        },
        {
          display: 'flex',
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center',
          children: [
            { width: 40, height: 40, borderRadius: '50%' },
            {
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              children: [
                { text: 'John Appleseed', font: '600 14px Inter', lineHeight: 18 },
                { text: 'Senior Engineer', font: '400 12px Inter', lineHeight: 16 },
              ],
            },
          ],
        },
        {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 8,
          children: [
            { text: '12 comments', font: '500 12px Inter', lineHeight: 16 },
            { text: 'Updated 2h ago', font: '500 12px Inter', lineHeight: 16 },
          ],
        },
      ],
    },
    widths: [320, 375, 768],
    coldIterations: 2000,
    warmIterations: 20000,
  },
]

function measure(iterations: number, fn: () => void): number {
  const start = performance.now()
  for (let i = 0; i < iterations; i++) fn()
  const end = performance.now()
  return (end - start) / iterations
}

function benchmarkCase(entry: BenchmarkCase): BenchmarkResult {
  let widthIndex = 0
  const nextWidth = () => {
    const width = entry.widths[widthIndex % entry.widths.length]!
    widthIndex++
    return width
  }

  const coldMs = measure(entry.coldIterations, () => {
    computeLayout(structuredClone(entry.descriptor), nextWidth(), entry.label)
  })

  const warmSource = structuredClone(entry.descriptor)
  for (let i = 0; i < entry.widths.length * 8; i++) {
    computeLayout(warmSource, entry.widths[i % entry.widths.length]!, entry.label)
  }
  widthIndex = 0
  const warmMs = measure(entry.warmIterations, () => {
    computeLayout(warmSource, nextWidth(), entry.label)
  })

  const compiled = compileDescriptor(structuredClone(entry.descriptor))
  for (let i = 0; i < entry.widths.length * 8; i++) {
    computeLayout(compiled, entry.widths[i % entry.widths.length]!, entry.label)
  }
  widthIndex = 0
  const compiledMs = measure(entry.warmIterations, () => {
    computeLayout(compiled, nextWidth(), entry.label)
  })

  return {
    label: entry.label,
    coldMs,
    warmMs,
    compiledMs,
    warmSpeedupVsCold: coldMs / warmMs,
    compiledSpeedupVsCold: coldMs / compiledMs,
  }
}

const results = cases.map(benchmarkCase)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2))
} else {
  console.log('boneyard layout benchmark')
  console.log('')
  console.log('case           cold ms   warm ms   compiled ms   warm x   compiled x')
  for (const result of results) {
    console.log(
      `${result.label.padEnd(14)} ${result.coldMs.toFixed(4).padStart(7)}   ${result.warmMs.toFixed(4).padStart(7)}   ${result.compiledMs.toFixed(4).padStart(11)}   ${result.warmSpeedupVsCold.toFixed(1).padStart(6)}   ${result.compiledSpeedupVsCold.toFixed(1).padStart(10)}`,
    )
  }
}
