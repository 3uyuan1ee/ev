import Papa from 'papaparse'
import fs from 'fs'
import { datasetPath, dataPath, writeJson, roundTo } from '../lib/utils.js'
import { getCountryInfo, generateCountryRegionMap } from '../lib/country-normalizer.js'

// Parse CSV file
function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = Papa.parse(content, { header: true, skipEmptyLines: true, dynamicTyping: true })
  return result.data
}

export async function processEvVsPetrol() {
  console.log('\n📊 Processing global_ev_vs_petrol_comparison.csv...')
  const rows = parseCsv(datasetPath('data/market_sales/global_ev_vs_petrol_comparison.csv'))

  // Group by country
  const byCountry = {}
  for (const row of rows) {
    const country = row.country
    if (!byCountry[country]) byCountry[country] = []
    byCountry[country].push(row)
  }

  // === Output 1: country-region-map.json ===
  await writeJson(dataPath('shared', 'country-region-map.json'), generateCountryRegionMap())

  // === Output 2: tco-global-reference.json ===
  const tcoRef = { lastUpdated: 2025, countries: [] }
  for (const [country, countryRows] of Object.entries(byCountry)) {
    const info = getCountryInfo(country)
    // Take ICE rows (macro indicators are the same across powertrain types per country/year)
    const iceRows = countryRows.filter(r => r.powertrain_type === 'ICE')
    if (iceRows.length === 0) continue

    // Group by year
    const byYear = {}
    for (const r of iceRows) {
      const yr = r.year
      if (!byYear[yr]) byYear[yr] = []
      byYear[yr].push(r)
    }

    // Average across segments per year
    const yearlyData = []
    for (const [yr, yrRows] of Object.entries(byYear)) {
      const n = yrRows.length
      yearlyData.push({
        year: Number(yr),
        fuelPrice: roundTo(yrRows.reduce((s, r) => s + (r.fuel_price_usd_per_liter || 0), 0) / n, 4),
        electricityPrice: roundTo(yrRows.reduce((s, r) => s + (r.electricity_price_usd_per_kwh || 0), 0) / n, 6),
        evSubsidy: roundTo(yrRows.reduce((s, r) => s + (r.ev_subsidy_usd || 0), 0) / n, 0),
        evMarketShare: roundTo(yrRows.reduce((s, r) => s + (r.ev_market_share || 0), 0) / n, 4),
        chargingStations: roundTo(yrRows.reduce((s, r) => s + (r.charging_stations || 0), 0) / n, 0),
      })
    }

    yearlyData.sort((a, b) => a.year - b.year)
    const latest = yearlyData[yearlyData.length - 1]

    tcoRef.countries.push({
      country,
      region: info ? info.region : 'Other',
      iso3: info ? info.iso3 : '',
      latestFuelPricePerLiter: latest.fuelPrice,
      latestElectricityPricePerKwh: latest.electricityPrice,
      latestEvSubsidyUsd: latest.evSubsidy,
      latestYear: latest.year,
      yearlyData,
    })
  }
  await writeJson(dataPath('act1', 'tco-global-reference.json'), tcoRef)

  // === Output 3: policy-heatmap-timeseries.json ===
  const policyHeatmap = { countries: [], yearRange: [2010, 2025] }
  for (const [country, countryRows] of Object.entries(byCountry)) {
    const info = getCountryInfo(country)
    const iceRows = countryRows.filter(r => r.powertrain_type === 'ICE')
    if (iceRows.length === 0) continue

    const byYear = {}
    for (const r of iceRows) {
      if (!byYear[r.year]) byYear[r.year] = []
      byYear[r.year].push(r)
    }

    const yearlyData = []
    for (const [yr, yrRows] of Object.entries(byYear)) {
      const n = yrRows.length
      yearlyData.push({
        year: Number(yr),
        emissionRegulationScore: roundTo(yrRows.reduce((s, r) => s + (r.emission_regulation_score || 0), 0) / n, 4),
        evSubsidyUsd: roundTo(yrRows.reduce((s, r) => s + (r.ev_subsidy_usd || 0), 0) / n, 0),
        evMarketShare: roundTo(yrRows.reduce((s, r) => s + (r.ev_market_share || 0), 0) / n, 4),
        chargingStations: roundTo(yrRows.reduce((s, r) => s + (r.charging_stations || 0), 0) / n, 0),
        evSales: roundTo(yrRows.reduce((s, r) => s + (r.ev_sales || 0), 0) / n, 0),
        evGrowthRateYoy: roundTo(yrRows.reduce((s, r) => s + (r.ev_growth_rate_yoy || 0), 0) / n, 2),
        gdpPerCapita: roundTo(yrRows.reduce((s, r) => s + (r.gdp_per_capita || 0), 0) / n, 0),
        urbanPopulationPercent: roundTo(yrRows.reduce((s, r) => s + (r.urban_population_percent || 0), 0) / n, 1),
      })
    }
    yearlyData.sort((a, b) => a.year - b.year)

    policyHeatmap.countries.push({
      country,
      iso3: info ? info.iso3 : '',
      region: info ? info.region : 'Other',
      yearlyData,
    })
  }
  await writeJson(dataPath('act3', 'policy-heatmap-timeseries.json'), policyHeatmap)

  // Return parsed rows for downstream processors (regression model)
  return { rows, byCountry }
}
