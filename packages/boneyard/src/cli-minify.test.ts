import { describe, expect, it } from 'bun:test'
import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
// @ts-expect-error The CLI helper is JavaScript without a declaration file.
import { stringifyBones } from '../bin/json-output.js'

describe('bone JSON serialization', () => {
  const bones = { breakpoints: [{ width: 375, bones: [[0, 0, 100, 20, 0]] }] }

  it('preserves indented output by default', () => {
    expect(stringifyBones(bones, false)).toContain('\n  "breakpoints"')
  })

  it('writes compact JSON when minification is enabled', () => {
    const formatted = stringifyBones(bones, false)
    const minified = stringifyBones(bones, true)

    expect(minified).not.toContain('\n')
    expect(JSON.parse(minified)).toEqual(JSON.parse(formatted))
  })
})

describe('native CLI JSON output', () => {
  it('keeps formatted output by default and compacts it with --minify', async () => {
    const capture = async (minify: boolean) => {
      const outDir = mkdtempSync(join(tmpdir(), 'boneyard-minify-'))
      const cliPath = resolve(import.meta.dir, '../bin/cli.js')
      const args = [cliPath, 'build', '--native', '--watch', ...(minify ? ['--minify'] : []), '--out', outDir]
      const child = spawn(process.execPath, args, {
        cwd: resolve(import.meta.dir, '..'),
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let logs = ''
      child.stdout.on('data', chunk => { logs += chunk })
      child.stderr.on('data', chunk => { logs += chunk })

      const waitFor = async (condition: () => boolean | Promise<boolean>) => {
        const deadline = Date.now() + 5_000
        while (Date.now() < deadline) {
          if (await condition()) return
          if (child.exitCode !== null) throw new Error(`CLI exited unexpectedly. Logs:\n${logs}`)
          await delay(50)
        }
        throw new Error(`Timed out waiting for CLI. Logs:\n${logs}`)
      }

      try {
        await waitFor(async () => {
          try {
            return (await fetch('http://127.0.0.1:9999/ping')).ok
          } catch {
            return false
          }
        })

        const response = await fetch('http://127.0.0.1:9999/bones', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'minify-test',
            result: { viewportWidth: 375, bones: [[0, 0, 100, 20, 0]] },
          }),
        })
        expect(response.status).toBe(200)

        child.kill('SIGINT')
        await waitFor(() => child.exitCode !== null)
        expect(child.exitCode).toBe(0)

        return readFileSync(join(outDir, 'minify-test.bones.json'), 'utf8')
      } finally {
        if (child.exitCode === null) child.kill('SIGKILL')
        rmSync(outDir, { recursive: true, force: true })
      }
    }

    const formatted = await capture(false)
    const minified = await capture(true)

    expect(formatted).toContain('\n  "breakpoints"')
    expect(minified).not.toContain('\n')
    expect(JSON.parse(minified)).toEqual(JSON.parse(formatted))
  }, 15_000)
})
