import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DATA_DIR = path.join(ROOT, 'src/data')
const DATASET_DIR = path.join(ROOT, 'dataset')

export function datasetPath(filename) {
  return path.join(DATASET_DIR, filename)
}

export function dataPath(...segments) {
  return path.join(DATA_DIR, ...segments)
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  const stat = await fs.stat(filePath)
  console.log(`  ✓ ${path.relative(ROOT, filePath)} (${(stat.size / 1024).toFixed(1)} KB)`)
}

export async function readJson(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export function roundTo(num, decimals = 2) {
  const factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}
