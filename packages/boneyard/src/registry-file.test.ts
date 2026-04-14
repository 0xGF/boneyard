import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { detectRegistryExtension } from '../bin/registry-file.js'

const createdDirs: string[] = []

function createTempProject() {
  const dir = mkdtempSync(join(tmpdir(), 'boneyard-registry-'))
  createdDirs.push(dir)
  return dir
}

afterEach(() => {
  while (createdDirs.length) {
    const dir = createdDirs.pop()
    if (!dir) continue
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('CLI registry filename detection', () => {
  it('returns ts when tsconfig.json exists', () => {
    const root = createTempProject()
    writeFileSync(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }))

    expect(detectRegistryExtension(root)).toBe('ts')
  })

  it('returns js when jsconfig.json exists and tsconfig is absent', () => {
    const root = createTempProject()
    writeFileSync(join(root, 'jsconfig.json'), JSON.stringify({ compilerOptions: {} }))

    expect(detectRegistryExtension(root)).toBe('js')
  })

  it('returns ts when source contains TypeScript files', () => {
    const root = createTempProject()
    const srcDir = join(root, 'src')
    mkdirSync(srcDir, { recursive: true })
    writeFileSync(join(srcDir, 'index.tsx'), 'export const x = 1')

    expect(detectRegistryExtension(root)).toBe('ts')
  })

  it('defaults to js for plain projects', () => {
    const root = createTempProject()
    writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'plain-js' }))

    expect(detectRegistryExtension(root)).toBe('js')
  })
})
