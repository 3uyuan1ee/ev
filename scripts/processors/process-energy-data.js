#!/usr/bin/env node

/**
 * Environmental Data Processor
 * Processes OWID energy substitution, CO2 emissions, and lead petrol ban data.
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

function parseCsv(raw) {
  const lines = raw.replace(/^\uFEFF/, '').trim().split('\n')
  const header = lines[0].split(',').map(h => h.trim())
  return {
    header,
    rows: lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.trim())
      const obj = {}
      header.forEach((h, i) => { obj[h] = cols[i] })
      return obj
    })
  }
}

async function processEnergySubstitution() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/environment/owid_global_energy_substitution.csv'), 'utf-8')
  const { header, rows } = parseCsv(raw)

  // Filter World data
  const worldRows = rows.filter(r => r.Entity === 'World')

  const energyTypes = [
    'Traditional biomass', 'Modern biofuel', 'Solar', 'Wind', 'Hydro',
    'Nuclear', 'Natural gas', 'Oil', 'Coal', 'Other renewables'
  ]

  const data = worldRows.map(r => {
    const entry = { year: parseInt(r.Year) }
    for (const type of energyTypes) {
      const val = parseFloat(r[type])
      if (!isNaN(val)) entry[type.toLowerCase().replace(/\s+/g, '_')] = roundTo(val, 1)
    }
    return entry
  }).filter(d => !isNaN(d.year))

  return data
}

async function processLeadPetrolBan() {
  const raw = await fs.readFile(path.join(DATASET_DIR, 'data/environment/owid_lead_petrol_ban.csv'), 'utf-8')
  const { header, rows } = parseCsv(raw)

  // Find the ban column (long name)
  const banCol = header.find(h => h.includes('banned') || h.includes('leaded'))
  if (!banCol) {
    console.log('  ⚠ Could not find lead petrol ban column')
    return { totalCountries: 0, bans: [], distribution: [] }
  }

  const bans = []
  const seenCountries = new Set()

  for (const r of rows) {
    const entity = r.Entity
    const year = parseInt(r.Year)
    const banned = r[banCol] === 'Yes' || r[banCol] === 'True' || r[banCol] === '1'
    if (banned && !isNaN(year) && entity && !seenCountries.has(entity)) {
      seenCountries.add(entity)
      bans.push({ country: entity, year })
    }
  }

  // Compute distribution (decade buckets)
  const decadeCounts = {}
  for (const b of bans) {
    const decade = Math.floor(b.year / 10) * 10
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1
  }

  const distribution = Object.entries(decadeCounts)
    .map(([decade, count]) => ({ decade: parseInt(decade), count }))
    .sort((a, b) => a.decade - b.decade)

  return { totalCountries: bans.length, firstBan: bans[0], lastBan: bans[bans.length - 1], distribution, bans }
}

export async function processEnergyData() {
  console.log('\n🌍 Processing Environmental data...')

  const energySubstitution = await processEnergySubstitution()
  console.log(`  Energy substitution: ${energySubstitution.length} data points (${energySubstitution[0]?.year}-${energySubstitution[energySubstitution.length - 1]?.year})`)

  const leadPetrolBan = await processLeadPetrolBan()
  console.log(`  Lead petrol ban: ${leadPetrolBan.totalCountries} countries, ${leadPetrolBan.firstBan?.year}-${leadPetrolBan.lastBan?.year}`)

  const result = {
    energySubstitution,
    leadPetrolBan,
    description: 'Global energy mix evolution 1800-2024 and lead petrol ban timeline',
    source: 'Our World in Data / Vaclav Smil (2017)',
  }

  await writeJson(path.join(DATA_DIR, 'act4/energy-transition.json'), result)
  return result
}

if (process.argv[1] && process.argv[1].includes('process-energy-data')) {
  processEnergyData().catch(err => { console.error('Failed:', err); process.exit(1) })
}
