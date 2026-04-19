import XLSX from 'xlsx'
import { datasetPath, dataPath, writeJson, roundTo } from '../lib/utils.js'

const RELEVANT_PARAMETERS = [
  'EV sales', 'EV stock', 'EV stock share', 'EV sales share',
  'Oil displacement', 'Battery demand', 'Electricity demand', 'EV charging points',
]

export async function processIeaExplorer() {
  console.log('\n📊 Processing EV Data Explorer 2025.xlsx...')
  const workbook = XLSX.readFile(datasetPath('EV Data Explorer 2025.xlsx'))
  const sheetName = workbook.SheetNames[0] // GEVO_EV_2025
  const sheet = workbook.Sheets[sheetName]
  const allRows = XLSX.utils.sheet_to_json(sheet, { defval: null })

  console.log(`  Total rows in main sheet: ${allRows.length}`)

  // The data is in LONG format: each row has region_country, category, parameter, mode, powertrain, year, unit, value
  const filtered = allRows.filter(r =>
    r.parameter && RELEVANT_PARAMETERS.some(p => r.parameter === p || r.parameter.startsWith(p))
  )
  console.log(`  Filtered to ${filtered.length} relevant parameter rows`)

  // === Output 1: iea-ev-sales-by-country.json ===
  // Pivot: group by (region_country, parameter, mode, powertrain, category, unit) -> { year: value }
  const pivotMap = {}
  for (const row of filtered) {
    const key = `${row.region_country}|${row.parameter}|${row.mode || ''}|${row.powertrain || ''}|${row.category}|${row.unit || ''}`
    if (!pivotMap[key]) {
      pivotMap[key] = {
        regionCountry: row.region_country,
        parameter: row.parameter,
        mode: row.mode || '',
        powertrain: row.powertrain || '',
        category: row.category,
        unit: row.unit || '',
        yearlyData: {},
      }
    }
    const yr = Number(row.year)
    const val = row.value
    if (val !== null && val !== undefined && yr >= 2010 && yr <= 2035) {
      pivotMap[key].yearlyData[yr] = typeof val === 'number' ? val : parseFloat(val) || 0
    }
  }

  const records = Object.values(pivotMap)
  const parameters = [...new Set(records.map(r => r.parameter))].sort()
  const modes = [...new Set(records.map(r => r.mode))].filter(Boolean).sort()

  await writeJson(dataPath('shared', 'iea-ev-sales-by-country.json'), {
    parameters, modes, data: records,
  })

  // === Output 2: battery-demand.json ===
  const batteryRows = filtered.filter(r =>
    r.parameter && r.parameter.toLowerCase().includes('battery demand') &&
    r.mode === 'Cars' && (r.powertrain === 'EV' || r.powertrain === undefined)
  )

  const bdByRegion = {}
  for (const row of batteryRows) {
    const region = row.region_country
    const cat = row.category
    if (cat !== 'Historical' && cat !== 'Projection-STEPS') continue
    const yr = Number(row.year)
    const val = typeof row.value === 'number' ? row.value : parseFloat(row.value) || 0
    if (yr < 2010 || yr > 2030 || val === 0) continue

    if (!bdByRegion[region]) bdByRegion[region] = {}
    if (!bdByRegion[region][yr]) bdByRegion[region][yr] = 0
    bdByRegion[region][yr] += val
  }

  const batteryDemand = { global: [], byRegion: [], yearRange: [2010, 2030] }
  const focusRegions = ['World', 'China', 'Europe', 'United States', 'USA']

  for (const [region, yearlyObj] of Object.entries(bdByRegion)) {
    const data = Object.entries(yearlyObj)
      .map(([yr, val]) => ({ year: Number(yr), demandGwh: roundTo(val, 1) }))
      .sort((a, b) => a.year - b.year)

    if (region === 'World') {
      batteryDemand.global = data
    } else if (focusRegions.includes(region)) {
      batteryDemand.byRegion.push({ region, data })
    }
  }

  if (batteryDemand.global.length > 0 && batteryDemand.byRegion.length >= 2) {
    const majorMaps = batteryDemand.byRegion.map(r => new Map(r.data.map(d => [d.year, d.demandGwh])))
    const worldMap = new Map(batteryDemand.global.map(d => [d.year, d.demandGwh]))
    const rowData = []
    for (const [yr, worldVal] of worldMap) {
      const majorSum = majorMaps.reduce((s, rm) => s + (rm.get(yr) || 0), 0)
      rowData.push({ year: yr, demandGwh: roundTo(Math.max(worldVal - majorSum, 0), 1) })
    }
    batteryDemand.byRegion.push({ region: 'Rest of World', data: rowData })
  }

  await writeJson(dataPath('act2', 'battery-demand.json'), batteryDemand)

  // === Output 3: global-ev-emission-reduction.json ===
  // Only use "Oil displacement, million lge" parameter (absolute volume, not share)
  const oilRows = filtered.filter(r =>
    r.parameter && r.parameter.includes('Oil displacement') &&
    r.parameter.includes('million lge') &&
    r.mode === 'Cars'
  )

  const oilByRegion = {}
  for (const row of oilRows) {
    const region = row.region_country
    const cat = row.category
    const pt = row.powertrain || 'EV'
    if (cat !== 'Historical' && cat !== 'Projection-STEPS') continue
    // Only take the EV aggregate (not BEV/PHEV separately)
    if (pt !== 'EV') continue
    const yr = Number(row.year)
    const val = typeof row.value === 'number' ? row.value : parseFloat(row.value) || 0
    if (yr < 2010 || yr > 2035 || val === 0) continue

    if (!oilByRegion[region]) oilByRegion[region] = { historical: {}, projected: {} }
    const store = cat === 'Historical' ? oilByRegion[region].historical : oilByRegion[region].projected
    store[yr] = val  // No sum needed — EV row is already the aggregate
  }

  const emissionReduction = {
    parameter: 'Oil displacement', unit: 'million lge',
    yearRange: [2010, 2035], regions: [], globalTotal: [], projectedTotal: [],
  }

  for (const [region, data] of Object.entries(oilByRegion)) {
    const hist = Object.entries(data.historical)
      .map(([yr, val]) => ({ year: Number(yr), value: roundTo(val, 0) }))
      .sort((a, b) => a.year - b.year)
    if (region === 'World') {
      emissionReduction.globalTotal = hist
      const proj = Object.entries(data.projected)
        .map(([yr, val]) => ({ year: Number(yr), value: roundTo(val, 0), isProjection: true }))
        .sort((a, b) => a.year - b.year)
      emissionReduction.projectedTotal = proj
    } else if (focusRegions.includes(region)) {
      emissionReduction.regions.push({ region, data: hist })
    }
  }

  const worldMap = new Map(emissionReduction.globalTotal.map(d => [d.year, d.value]))
  for (const region of emissionReduction.regions) {
    for (const d of region.data) {
      const worldVal = worldMap.get(d.year) || 1
      d.percentage = roundTo((d.value / worldVal) * 100, 1)
    }
  }

  await writeJson(dataPath('act4', 'global-ev-emission-reduction.json'), emissionReduction)

  return { records }
}
