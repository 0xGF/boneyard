import { describe, expect, it } from 'bun:test'
import { spawn } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

describe('native CLI watch mode', () => {
  it('buffers bones until SIGINT, then writes the bones and registry', async () => {
    const outDir = mkdtempSync(join(tmpdir(), 'boneyard-native-watch-'))
    const cliPath = resolve(import.meta.dir, '../bin/cli.js')
    const child = spawn(process.execPath, [cliPath, 'build', '--native', '--watch', '--out', outDir], {
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
          name: 'watch-test',
          result: { viewportWidth: 375, bones: [[0, 0, 100, 20, 0]] },
        }),
      })

      expect(response.status).toBe(200)
      // Longer than the non-watch two-second auto-finish timeout.
      await delay(2_300)
      expect(child.exitCode).toBeNull()
      expect(readdirSync(outDir)).toEqual([])

      child.kill('SIGINT')
      await waitFor(() => child.exitCode !== null)

      expect(child.exitCode).toBe(0)
      const bone = JSON.parse(readFileSync(join(outDir, 'watch-test.bones.json'), 'utf8'))
      const registry = readFileSync(join(outDir, 'registry.js'), 'utf8')
      expect(bone.breakpoints['375']).toBeDefined()
      expect(registry).toContain('watch-test')
    } finally {
      if (child.exitCode === null) child.kill('SIGKILL')
      rmSync(outDir, { recursive: true, force: true })
    }
  }, 10_000)
})
