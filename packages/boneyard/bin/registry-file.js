import { existsSync, readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

function hasFileWithExtensions(dir, extensions, depth = 0) {
  if (depth > 3 || !existsSync(dir)) return false
  let entries = []
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return false
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (hasFileWithExtensions(fullPath, extensions, depth + 1)) return true
      continue
    }
    for (const ext of extensions) {
      if (entry.name.endsWith(ext)) return true
    }
  }
  return false
}

export function detectRegistryExtension(projectRoot = process.cwd()) {
  if (existsSync(resolve(projectRoot, 'tsconfig.json'))) return 'ts'
  if (existsSync(resolve(projectRoot, 'jsconfig.json'))) return 'js'
  if (existsSync(resolve(projectRoot, 'next-env.d.ts'))) return 'ts'

  try {
    const pkgPath = resolve(projectRoot, 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
      if (allDeps.typescript) return 'ts'
    }
  } catch {}

  const hasTsSource = ['src', 'app', 'pages', 'components', 'lib']
    .some((folder) => hasFileWithExtensions(resolve(projectRoot, folder), ['.ts', '.tsx', '.mts', '.cts']))

  return hasTsSource ? 'ts' : 'js'
}
