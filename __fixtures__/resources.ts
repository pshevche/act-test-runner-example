import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export function resourcePath(relativePath: string): string {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  return resolve(__dirname, relativePath)
}
