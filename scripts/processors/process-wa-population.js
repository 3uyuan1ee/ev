import fs from 'fs'
import readline from 'readline'
import { datasetPath, dataPath, writeJson, roundTo } from '../lib/utils.js'

function parsePoint(str) {
  if (!str) return null
  const match = str.match(/POINT\s*\(\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*\)/)
  if (!match) return null
  return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) }
}

export async function processWaPopulation() {
  console.log('\n📊 Processing us_wa_ev_population_data.csv (streaming)...')

  const filePath = datasetPath('data/market_sales/us_wa_ev_population_data.csv')

  // Accumulators
  const countyYearMake = {}  // county -> year -> make -> { total, bev, phev, rangeSum }
  const countyGeo = {}       // county -> { lats, lons }
  const makeTotals = {}      // make -> { total, bev, phev, rangeSum }
  const yearTotals = {}      // year -> { total, bev }
  let totalVehicles = 0

  const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  let header = null
  let lineNum = 0

  for await (const line of rl) {
    lineNum++
    if (lineNum === 1) {
      header = line.split(',')
      continue
    }

    // Simple CSV parse (handle quoted fields with commas)
    const fields = parseCsvLine(line, header.length)
    if (fields.length < 17) continue

    const county = fields[1]?.trim()
    const state = fields[3]?.trim()
    const modelYear = parseInt(fields[5])
    const make = fields[6]?.trim()
    const evType = fields[8]?.trim()
    const range = parseFloat(fields[10]) || 0
    const location = fields[15]?.trim()

    // Filter WA state only
    if (state !== 'WA') continue

    const isBev = evType?.includes('BEV')
    totalVehicles++

    // Accumulate county-year-make
    if (!countyYearMake[county]) countyYearMake[county] = {}
    if (!countyYearMake[county][modelYear]) countyYearMake[county][modelYear] = {}
    if (!countyYearMake[county][modelYear][make]) {
      countyYearMake[county][modelYear][make] = { total: 0, bev: 0, phev: 0, rangeSum: 0 }
    }
    const cym = countyYearMake[county][modelYear][make]
    cym.total++
    if (isBev) cym.bev++
    else cym.phev++
    cym.rangeSum += range

    // County geo
    const point = parsePoint(location)
    if (point) {
      if (!countyGeo[county]) countyGeo[county] = { lats: [], lons: [] }
      countyGeo[county].lats.push(point.lat)
      countyGeo[county].lons.push(point.lon)
    }

    // Make totals
    if (!makeTotals[make]) makeTotals[make] = { total: 0, bev: 0, phev: 0, rangeSum: 0 }
    makeTotals[make].total++
    if (isBev) makeTotals[make].bev++
    else makeTotals[make].phev++
    makeTotals[make].rangeSum += range

    // Year totals
    if (!yearTotals[modelYear]) yearTotals[modelYear] = { total: 0, bev: 0 }
    yearTotals[modelYear].total++
    if (isBev) yearTotals[modelYear].bev++
  }

  // === Compute centroids ===
  const centroids = {}
  for (const [county, geo] of Object.entries(countyGeo)) {
    centroids[county] = {
      lat: roundTo(geo.lats.reduce((a, b) => a + b, 0) / geo.lats.length, 4),
      lon: roundTo(geo.lons.reduce((a, b) => a + b, 0) / geo.lons.length, 4),
    }
  }

  // === Build countyYearStats ===
  const countyYearStats = []
  for (const [county, years] of Object.entries(countyYearMake)) {
    for (const [year, makes] of Object.entries(years)) {
      let total = 0, bevCount = 0, phevCount = 0, rangeSum = 0
      const makeList = []
      for (const [make, m] of Object.entries(makes)) {
        total += m.total
        bevCount += m.bev
        phevCount += m.phev
        rangeSum += m.rangeSum
        makeList.push({ make, count: m.total })
      }
      makeList.sort((a, b) => b.count - a.count)
      countyYearStats.push({
        county,
        year: Number(year),
        total,
        bevCount,
        phevCount,
        topMakes: makeList.slice(0, 3),
        avgRange: roundTo(rangeSum / total, 0),
        centerLat: centroids[county]?.lat || 0,
        centerLon: centroids[county]?.lon || 0,
      })
    }
  }

  // === Build countyGeo ===
  const countyGeoOutput = []
  for (const [county, years] of Object.entries(countyYearMake)) {
    let total = 0, bevCount = 0
    const makeList = []
    for (const makes of Object.values(years)) {
      for (const [make, m] of Object.entries(makes)) {
        total += m.total
        bevCount += m.bev
        makeList.push({ make, count: m.total })
      }
    }
    makeList.sort((a, b) => b.count - a.count)
    countyGeoOutput.push({
      county,
      totalRegistrations: total,
      bevRatio: roundTo(bevCount / total, 4),
      dominantMake: makeList[0]?.make || '',
      centerLat: centroids[county]?.lat || 0,
      centerLon: centroids[county]?.lon || 0,
    })
  }

  // === Build yearlyTotals ===
  const yearlyTotals = Object.entries(yearTotals)
    .map(([year, t]) => ({ year: Number(year), total: t.total, bevCount: t.bev, phevCount: t.total - t.bev }))
    .sort((a, b) => a.year - b.year)

  // === Build makeDistribution ===
  const makeDistribution = Object.entries(makeTotals)
    .map(([make, t]) => ({
      make,
      count: t.total,
      bevCount: t.bev,
      phevCount: t.phev,
      avgRange: roundTo(t.rangeSum / t.total, 0),
    }))
    .sort((a, b) => b.count - a.count)

  // === Top makes ===
  const topMakes = makeDistribution.slice(0, 10).map(m => ({ make: m.make, count: m.count }))
  const yearRange = [Math.min(...Object.keys(yearTotals).map(Number)), Math.max(...Object.keys(yearTotals).map(Number))]

  await writeJson(dataPath('act1', 'wa-ev-registration.json'), {
    summary: { totalVehicles, bevCount: makeDistribution.reduce((s, m) => s + m.bevCount, 0), phevCount: makeDistribution.reduce((s, m) => s + m.phevCount, 0), countyCount: Object.keys(countyYearMake).length, yearRange, topMakes },
    countyYearStats,
    countyGeo: countyGeoOutput,
    yearlyTotals,
    makeDistribution,
  })

  // === Build heatmap timeseries ===
  const allYears = Object.keys(yearTotals).map(Number).filter(y => y >= 2010).sort((a, b) => a - b)
  const frames = {}

  // Cumulative registration per county per year
  for (const yr of allYears) {
    frames[yr] = []
    for (const [county, years] of Object.entries(countyYearMake)) {
      // Sum registrations up to and including this year
      let cumulative = 0, bevCumulative = 0
      for (const [y, makes] of Object.entries(years)) {
        if (Number(y) <= yr) {
          for (const m of Object.values(makes)) {
            cumulative += m.total
            bevCumulative += m.bev
          }
        }
      }
      if (cumulative > 0) {
        frames[yr].push({
          county,
          registrations: cumulative,
          bevRatio: roundTo(bevCumulative / cumulative, 4),
          centerLat: centroids[county]?.lat || 0,
          centerLon: centroids[county]?.lon || 0,
        })
      }
    }
  }

  await writeJson(dataPath('act1', 'wa-ev-heatmap-timeseries.json'), { years: allYears, frames })

  console.log(`  Processed ${totalVehicles.toLocaleString()} vehicles across ${Object.keys(countyYearMake).length} counties`)
}

// Simple CSV line parser that handles quoted fields
function parseCsvLine(line, expectedFields) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
