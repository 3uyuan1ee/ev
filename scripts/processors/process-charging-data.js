#!/usr/bin/env node

/**
 * Charging Infrastructure Data Processor v2
 * Country-specific parsers for heterogeneous CSV formats.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DATASET_DIR = path.join(ROOT, 'dataset')
const DATA_DIR = path.join(ROOT, 'src/data')

function roundTo(num, decimals = 2) {
  const factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`  ✓ ${path.relative(ROOT, filePath)}`)
}

function parseCsvLines(raw) {
  return raw.replace(/^\uFEFF/, '').trim().split('\n').map(line =>
    line.split(',').map(c => c.trim())
  )
}

async function processChina() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/charging_infrastructure/china_charging_stations.csv'), 'utf-8')
  const lines = parseCsvLines(raw)
  const data = []
  // Format: [source_header, , AC, DC, AC/DC, Total, , source_url, ...]
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
    const year = parseInt(cols[1])
    if (isNaN(year)) continue
    const total = parseFloat(cols[5]) || parseFloat(cols[4]) || 0
    if (total <= 0) continue
    data.push({
      year,
      ac: parseFloat(cols[2]) || 0,
      dc: parseFloat(cols[3]) || 0,
      total,
      bevSales: parseFloat(cols[6]) || null,
    })
  }
  return data
}

async function processNorway() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/charging_infrastructure/norway_charging_stations.csv'), 'utf-8')
  const lines = parseCsvLines(raw)
  const data = []
  // Headers: ,Standard,Chademo 50kw,CCS 50kw,Type 243 kw,Tesla Supercharger,Total,BEV,...
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
    const year = parseInt(cols[0])
    if (isNaN(year)) continue
    const total = parseFloat(cols[6]) || 0
    if (total <= 0) continue
    const standard = parseFloat(cols[1]) || 0
    const fast = (parseFloat(cols[2]) || 0) + (parseFloat(cols[3]) || 0) + (parseFloat(cols[4]) || 0) + (parseFloat(cols[5]) || 0)
    data.push({
      year,
      ac: standard,
      dc: fast,
      total,
      bevSales: parseFloat(cols[7]) || null,
    })
  }
  return data
}

async function processGermany() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/charging_infrastructure/germany_charging_stations.csv'), 'utf-8')
  const lines = parseCsvLines(raw)

  // Two-section CSV: lines 0-10 are BEV sales data, lines 11+ are charging data
  // Section 1 (BEV sales): year, PVS, BEV, penetration
  const bevByYear = new Map()
  for (let i = 1; i < 11 && i < lines.length; i++) {
    const cols = lines[i]
    const year = parseInt(cols[0])
    const pvs = parseFloat(cols[1]) || 0
    const bev = parseFloat(cols[2]) || 0
    if (!isNaN(year)) {
      bevByYear.set(year, { pvs, bev, penetration: pvs > 0 ? bev / pvs : 0 })
    }
  }

  // Section 2 (Charging): starts at line 12 (after header at line 11)
  // Headers: ,Normal Charge (<=22kw),ChaDeMo,CCS,Type-2AC,Tesla SC,Total,,,
  const data = []
  for (let i = 12; i < lines.length; i++) {
    const cols = lines[i]
    const year = parseInt(cols[0])
    if (isNaN(year)) continue
    const normal = parseFloat(cols[1]) || 0
    const chademo = parseFloat(cols[2]) || 0
    const ccs = parseFloat(cols[3]) || 0
    const type2ac = parseFloat(cols[4]) || 0
    const teslaSc = parseFloat(cols[5]) || 0
    const total = parseFloat(cols[6]) || 0
    if (total <= 0) continue

    const bevInfo = bevByYear.get(year) || {}
    data.push({
      year,
      ac: normal + type2ac,
      dc: chademo + ccs + teslaSc,
      total,
      bevSales: bevInfo.bev || null,
      pvs: bevInfo.pvs || null,
      penetrationRate: bevInfo.penetration || null,
    })
  }
  return data
}

async function processNetherlands() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/charging_infrastructure/netherlands_charging_stations.csv'), 'utf-8')
  const lines = parseCsvLines(raw)
  const data = []
  // Headers: ,,standard,BEV,Penetrations,,
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
    const year = parseInt(cols[1])
    if (isNaN(year)) continue
    const standard = parseFloat(cols[2]) || 0
    const bev = parseFloat(cols[3]) || 0
    const penetration = parseFloat(cols[4]) || 0
    if (standard <= 0 && bev <= 0) continue
    data.push({
      year,
      total: standard,
      ac: standard,
      dc: 0,
      bevSales: bev,
      penetrationRate: penetration,
    })
  }
  return data
}

async function processSweden() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/charging_infrastructure/sweden_charging_stations.csv'), 'utf-8')
  const lines = parseCsvLines(raw)
  const data = []
  // Headers: ,,Standard (<22kW),Fast (>22kW),Total,BEV Sales,Penetration
  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
    const year = parseInt(cols[1])
    if (isNaN(year)) continue
    const standard = parseFloat(cols[2]) || 0
    const fast = parseFloat(cols[3]) || 0
    const total = parseFloat(cols[4]) || 0
    const bev = parseFloat(cols[5]) || 0
    const penetration = parseFloat(cols[6]) || 0
    if (total <= 0 && standard <= 0) continue
    data.push({
      year,
      ac: standard,
      dc: fast,
      total: total || standard + fast,
      bevSales: bev,
      penetrationRate: penetration,
    })
  }
  return data
}

export async function processChargingInfrastructure() {
  console.log('\n🔌 Processing Charging Infrastructure data...')

  const processors = [
    { name: 'China', fn: processChina, color: '#E85A4F' },
    { name: 'Norway', fn: processNorway, color: '#8E8DBA' },
    { name: 'Sweden', fn: processSweden, color: '#7A79A8' },
    { name: 'Netherlands', fn: processNetherlands, color: '#E98074' },
    { name: 'Germany', fn: processGermany, color: '#D8C3A5' },
  ]

  const result = { countries: [], source: 'IEA, national statistics, statista' }

  for (const { name, fn, color } of processors) {
    try {
      const data = await fn()
      const maxTotal = data.length > 0 ? Math.max(...data.map(d => d.total || 0)) : 0
      const maxBev = data.length > 0 ? Math.max(...data.map(d => d.bevSales || 0)) : 0

      result.countries.push({
        country: name,
        color,
        data,
        yearRange: data.length > 0 ? `${data[0].year}-${data[data.length - 1].year}` : 'N/A',
        dataPoints: data.length,
        maxTotal,
        maxBevSales: maxBev,
      })

      console.log(`  ${name}: ${data.length} pts, years ${data[0]?.year}-${data[data.length - 1]?.year}, max chargers: ${maxTotal.toLocaleString()}`)
    } catch (err) {
      console.log(`  ⚠ ${name}: ${err.message}`)
    }
  }

  await writeJson(path.join(DATA_DIR, 'act3/charging-infrastructure.json'), result)
  return result
}

if (process.argv[1] && process.argv[1].includes('process-charging-data')) {
  processChargingInfrastructure().catch(err => { console.error('Failed:', err); process.exit(1) })
}
