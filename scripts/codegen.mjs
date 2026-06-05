import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outFile = path.join(root, 'src', 'redux', 'types', 'api.d.ts')

function loadEnvFile() {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  const text = fs.readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

function resolveOpenApiUrl() {
  loadEnvFile()
  if (process.env.OPENAPI_URL) return process.env.OPENAPI_URL
  const base = process.env.VITE_API_URL
  if (base) return `${base.replace(/\/$/, '')}/docs-json`
  return 'http://localhost:9000/docs-json'
}

const url = resolveOpenApiUrl()
fs.mkdirSync(path.dirname(outFile), { recursive: true })

console.log(`OpenAPI: ${url}`)
console.log(`Saída: ${path.relative(root, outFile)}`)

const openapiBin = path.join(root, 'node_modules', '.bin', 'openapi-typescript')
if (!fs.existsSync(openapiBin)) {
  console.error('Instale as dependências: pnpm install')
  process.exit(1)
}

execFileSync(openapiBin, [url, '-o', outFile], {
  cwd: root,
  stdio: 'inherit',
})
