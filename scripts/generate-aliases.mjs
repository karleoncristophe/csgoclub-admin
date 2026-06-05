import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const apiFilePath = path.join(root, 'src', 'redux', 'types', 'api.d.ts')
const outputPath = path.join(root, 'src', 'redux', 'types', 'api-aliases.ts')

if (!fs.existsSync(apiFilePath)) {
  console.error('Arquivo api.d.ts não encontrado. Rode pnpm codegen com o backend no ar.')
  process.exit(1)
}

const content = fs.readFileSync(apiFilePath, 'utf-8')
const regex = /components\["schemas"\]\["([a-zA-Z0-9_]+)"\]/g
const matches = [...content.matchAll(regex)]

const seen = new Set()
const uniqueTypes = []

for (const [, typeName] of matches) {
  if (!seen.has(typeName)) {
    seen.add(typeName)
    uniqueTypes.push(typeName)
  }
}

const outputContent = `// Arquivo gerado por scripts/generate-aliases.mjs — não edite manualmente.
import type { components } from './api'

${uniqueTypes.map((type) => `export type ${type} = components['schemas']['${type}']`).join('\n')}
`

fs.writeFileSync(outputPath, outputContent)
console.log(
  `${uniqueTypes.length} aliases em src/redux/types/api-aliases.ts`,
)
