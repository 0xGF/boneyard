import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { transform } from '@solidjs/compiler'
import ts from 'typescript'

const sourcePath = resolve('src/solid.tsx')
const source = await readFile(sourcePath, 'utf8')

function compile(generate) {
  const { code } = transform(source, {
    filename: sourcePath,
    generate,
    hydratable: true,
  })
  return ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  }).outputText
}

// Solid 2's DOM output is selected for browser builds; SSR needs the server form
// because @solidjs/web's Node condition intentionally disables DOM helpers.
await Promise.all([
  writeFile(resolve('dist/solid.js'), compile('dom')),
  writeFile(resolve('dist/solid-server.js'), compile('ssr')),
])
