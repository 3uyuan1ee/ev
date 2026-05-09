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

/**
 * Build a column index map from a header row and a mapping spec.
 * @param {string[]} headerRow - the CSV header tokens
 * @param {Object.<string, RegExp>} spec - maps canonical name \u2192 regex to match header
 * @returns {Object.<string, number|null>} maps canonical name \u2192 column index (or null)
 */
function buildColumnMap(headerRow, spec) {
  const map = {}
  for (const [canonical, regex] of Object.entries(spec)) {
    const idx = headerRow.findIndex(h => regex.test(h))
    map[canonical] = idx >= 0 ? idx : null
  }
  return map
}

function col(row, map, key, fallback = 0) {
  const idx = map[key]
  if (idx == null || idx >= row.length) return fallback
  const val = parseFloat(row[idx])
  return isNaN(val) ? fallback : val
}

function colYear(row, map, key, fallback = NaN) {
  const idx = map[key]
  if (idx == null || idx >= row.length) return fallback
  const val = parseInt(row[idx])
  return isNaN(val) ? fallback : val
}

async function processChina() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/charging_infrastructure/china_charging_stations.csv'), 'utf-8')
  const lines = parseCsvLines(raw)
  const data = []

  // Build column map from header rows (rows 0–1)
  // Format: [source_header, , AC, DC, AC/DC, Total, BEV, ...]
  const headerRow = lines[1] || lines[0]
  const mappedCols = buildColumnMap(headerRow, {
    year:   /year/i,           // year column is second (index 1) but has no header — fallback below
    ac:     /^ac$/i,
    dc:     /^dc$/i,
    acdc:   /^ac.?dc$/i,
    total:  /^total$/i,
  })
  // China year column has empty header — fall back to index 1 if not found
  if (mappedCols.year == null) mappedCols.year = 1

  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
    const year = colYear(cols, mappedCols, 'year')
    if (isNaN(year)) continue
    const total = col(cols, mappedCols, 'total') || col(cols, mappedCols, 'acdc') || 0
    if (total <= 0) continue
    
    // BEV sales data is at index 6 (7th column, 0-indexed)
    // From the CSV, we can see BEV numbers are in column 6
    const bevSales = cols.length > 6 && cols[6] ? parseFloat(cols[6]) : null
    const finalBevSales = isNaN(bevSales) ? null : bevSales
    
    data.push({
      year,
      ac: col(cols, mappedCols, 'ac'),
      dc: col(cols, mappedCols, 'dc'),
      total,
      bevSales: finalBevSales,
    })
  }
  return data
}

async function processNorway() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/charging_infrastructure/norway_charging_stations.csv'), 'utf-8')
  const lines = parseCsvLines(raw)
  const data = []

  // Headers: ,Standard,Chademo 50kw,CCS 50kw,Type 243 kw,Tesla Supercharger,Total,BEV,...
  const headerRow = lines[1] || lines[0]
  const mappedCols = buildColumnMap(headerRow, {
    year:    /^\d{4}$/ ,          // first col is year but has no label header — fallback below
    standard: /standard/i,
    chademo: /chademo/i,
    ccs:     /ccs/i,
    type2:   /type.*kw/i,
    tesla:   /tesla|supercharger/i,
    total:   /^total$/i,
    bev:     /bev/i,
  })
  // Norway year column has numeric values in header row, so fallback to index 0
  if (mappedCols.year == null) mappedCols.year = 0

  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
    const year = colYear(cols, mappedCols, 'year')
    if (isNaN(year)) continue
    const total = col(cols, mappedCols, 'total')
    if (total <= 0) continue
    const standard = col(cols, mappedCols, 'standard')
    const fast = col(cols, mappedCols, 'chademo') + col(cols, mappedCols, 'ccs') +
                 col(cols, mappedCols, 'type2') + col(cols, mappedCols, 'tesla')
    data.push({
      year,
      ac: standard,
      dc: fast,
      total,
      bevSales: col(cols, mappedCols, 'bev') || null,
    })
  }
  return data
}

async function processGermany() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/charging_infrastructure/germany_charging_stations.csv'), 'utf-8')
  const lines = parseCsvLines(raw)

  // Two-section CSV: lines 0-10 are BEV sales data, lines 11+ are charging data

  // Section 1 (BEV sales): year, PVS, BEV, penetration
  const bevSpec = buildColumnMap(lines[0], {
    year: /year|^\d{4}$/i,
    pvs:  /pvs/i,
    bev:  /bev/i,
  })
  if (bevSpec.year == null) bevSpec.year = 0

  const bevByYear = new Map()
  for (let i = 1; i < 11 && i < lines.length; i++) {
    const cols = lines[i]
    const year = colYear(cols, bevSpec, 'year')
    const pvs = col(cols, bevSpec, 'pvs')
    const bev = col(cols, bevSpec, 'bev')
    if (!isNaN(year)) {
      bevByYear.set(year, { pvs, bev, penetration: pvs > 0 ? bev / pvs : 0 })
    }
  }

  // Section 2 (Charging): starts at line 12 (after header at line 11)
  // Headers: ,Normal Charge (<=22kw),ChaDeMo,CCS,Type-2AC,Tesla SC,Total,,,
  const chargeSpec = buildColumnMap(lines[11] || lines[0], {
    year:    /year|^\d{4}$/i,
    normal:  /normal/i,
    chademo: /chademo/i,
    ccs:     /ccs/i,
    type2ac: /type.?2.?ac/i,
    tesla:   /tesla|supercharger/i,
    total:   /^total$/i,
  })
  if (chargeSpec.year == null) chargeSpec.year = 0

  const data = []
  for (let i = 12; i < lines.length; i++) {
    const cols = lines[i]
    const year = colYear(cols, chargeSpec, 'year')
    if (isNaN(year)) continue
    const normal = col(cols, chargeSpec, 'normal')
    const chademo = col(cols, chargeSpec, 'chademo')
    const ccs = col(cols, chargeSpec, 'ccs')
    const type2ac = col(cols, chargeSpec, 'type2ac')
    const teslaSc = col(cols, chargeSpec, 'tesla')
    const total = col(cols, chargeSpec, 'total')
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
  const headerRow = lines[0]
  const mappedCols = buildColumnMap(headerRow, {
    year:        /year|^\d{4}$/i,
    standard:    /standard/i,
    bev:         /bev/i,
    penetration: /penetrat/i,
  })
  if (mappedCols.year == null) mappedCols.year = 1

  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
    const year = colYear(cols, mappedCols, 'year')
    if (isNaN(year)) continue
    const standard = col(cols, mappedCols, 'standard')
    const bev = col(cols, mappedCols, 'bev')
    const penetration = col(cols, mappedCols, 'penetration')
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

  // Headers: ,,Standard(<22kw),Fast Charge (>22kw),Total,BEV Sales,Penetration
  const headerRow = lines[0]
  const mappedCols = buildColumnMap(headerRow, {
    year:        /year|^\d{4}$/i,
    standard:    /standard/i,
    fast:        /fast/i,
    total:       /^total$/i,
    bev:         /bev/i,
    penetration: /penetrat/i,
  })
  if (mappedCols.year == null) mappedCols.year = 1

  for (let i = 2; i < lines.length; i++) {
    const cols = lines[i]
    const year = colYear(cols, mappedCols, 'year')
    if (isNaN(year)) continue
    const standard = col(cols, mappedCols, 'standard')
    const fast = col(cols, mappedCols, 'fast')
    const total = col(cols, mappedCols, 'total')
    const bev = col(cols, mappedCols, 'bev')
    const penetration = col(cols, mappedCols, 'penetration')
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
