#!/usr/bin/env node

/**
 * IEA Global EV Growth Data Processor
 * Extracts EV sales, stock, and sales share by region from IEA GEVO 2025 master CSV.
 * Produces multi-region time series with STEPS projections to 2030.
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

export async function processIeaGrowth() {
  console.log('\n🌍 Processing IEA Global EV Growth data...')

  const csvPath = path.join(DATASET_DIR, 'data/global_ev_outlook/GEVO_EV_2025_main.csv')
  const raw = await fs.readFile(csvPath, 'utf-8')
  const lines = raw.replace(/^\uFEFF/, '').trim().split('\n')
  const header = lines[0].split(',')

  const idx = {
    region: header.indexOf('region_country'),
    category: header.indexOf('category'),
    parameter: header.indexOf('parameter'),
    mode: header.indexOf('mode'),
    powertrain: header.indexOf('powertrain'),
    year: header.indexOf('year'),
    unit: header.indexOf('unit'),
    value: header.indexOf('value'),
  }

  // Target regions for visualization
  const targetRegions = ['World', 'China', 'United States', 'Europe', 'India', 'Norway', 'Rest of the world']

  // Parse all relevant rows
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const region = cols[idx.region]?.trim()
    const parameter = cols[idx.parameter]?.trim()
    const mode = cols[idx.mode]?.trim()
    const powertrain = cols[idx.powertrain]?.trim()
    const category = cols[idx.category]?.trim()
    const year = parseInt(cols[idx.year])
    const value = parseFloat(cols[idx.value])

    if (isNaN(year) || isNaN(value)) continue
    if (!targetRegions.includes(region) && region !== 'European Union') continue
    if (mode !== 'Cars') continue  // Focus on cars for now

    rows.push({ region, parameter, mode, powertrain, category, year, value })
  }

  // Map "European Union" to "Europe"
  for (const r of rows) {
    if (r.region === 'European Union') r.region = 'Europe'
  }

  // Aggregate: get EV sales, EV stock, EV sales share for Cars, BEV+PHEV aggregate
  const metrics = ['EV sales', 'EV stock', 'EV sales share']
  const regions = ['World', 'China', 'United States', 'Europe', 'India', 'Norway', 'Rest of the world']

  // Color mapping for regions
  const regionColors = {
    'China': '#E85A4F',
    'Europe': '#8E8DBA',
    'United States': '#E98074',
    'India': '#D8C3A5',
    'Norway': '#7A79A8',
    'Rest of the world': '#9B9590',
    'World': '#6B6560',
  }

  const result = { regions: [], years: [], data: {} }

  // Collect all years
  const yearSet = new Set()
  for (const r of rows) yearSet.add(r.year)
  result.years = Array.from(yearSet).sort((a, b) => a - b)

  for (const region of regions) {
    const regionData = { region, color: regionColors[region] || '#9B9590' }

    for (const metric of metrics) {
      const metricRows = rows.filter(r =>
        r.region === region && r.parameter === metric
      )

      // Merge powertrains (sum BEV + PHEV for sales/stock; use EV aggregate for share)
      const byYearHistorical = {}
      const byYearProjection = {}

      for (const r of metricRows) {
        const bucket = r.category === 'Historical' ? byYearHistorical : byYearProjection
        if (metric === 'EV sales share') {
          // Share: take the value directly (it's already a percentage)
          bucket[r.year] = r.value
        } else {
          // Sales/stock: sum across powertrains
          bucket[r.year] = (bucket[r.year] || 0) + r.value
        }
      }

      regionData[metric.replace(/ /g, '_')] = {
        historical: result.years
          .filter(y => byYearHistorical[y] !== undefined)
          .map(y => ({ year: y, value: roundTo(byYearHistorical[y], 2) })),
        projection: result.years
          .filter(y => byYearProjection[y] !== undefined)
          .map(y => ({ year: y, value: roundTo(byYearProjection[y], 2) })),
      }
    }

    // Calculate CAGR for historical EV sales
    const salesHist = regionData.EV_sales?.historical || []
    if (salesHist.length >= 2) {
      const first = salesHist[0]
      const last = salesHist[salesHist.length - 1]
      const nYears = last.year - first.year
      if (nYears > 0 && first.value > 0) {
        regionData.cagr = roundTo((Math.pow(last.value / first.value, 1 / nYears) - 1) * 100, 1)
      }
    }

    result.regions.push(regionData)
  }

  // Also include EV stock share for context
  result.description = 'Global EV Cars data from IEA Global EV Outlook 2025. Historical 2010-2024, STEPS projection to 2030.'
  result.source = 'IEA Global EV Data Explorer 2025'

  await writeJson(path.join(DATA_DIR, 'act2/ev-growth-by-region.json'), result)

  console.log(`  Processed ${rows.length} rows for ${regions.length} regions`)
  console.log(`  Year range: ${result.years[0]}-${result.years[result.years.length - 1]}`)

  return result
}

// Allow standalone execution
if (process.argv[1] && process.argv[1].includes('process-iev-growth')) {
  processIeaGrowth().catch(err => { console.error('Failed:', err); process.exit(1) })
}
