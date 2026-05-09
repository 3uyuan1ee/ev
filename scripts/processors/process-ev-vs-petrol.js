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

    // Group all rows by year (use all powertrain types for correct EV market share)
    const byYearAll = {}
    for (const r of countryRows) {
      const yr = r.year
      if (!byYearAll[yr]) byYearAll[yr] = []
      byYearAll[yr].push(r)
    }

    const yearlyData = []
    for (const [yr, yrRows] of Object.entries(byYearAll)) {
      const totalEvSales = yrRows.reduce((s, r) => s + (Number(r.ev_sales) || 0), 0)
      const totalVehicleSales = yrRows.reduce((s, r) => s + (Number(r.total_vehicle_sales) || 0), 0)
      const evMarketShare = totalVehicleSales > 0
        ? roundTo((totalEvSales / totalVehicleSales) * 100, 2) : 0
      // Macro indicators are same across segments — use ICE row as reference
      const iceRow = yrRows.find(r => r.powertrain_type === 'ICE') || yrRows[0]
      const n = yrRows.filter(r => r.powertrain_type === 'ICE').length || 1
      const iceRows = yrRows.filter(r => r.powertrain_type === 'ICE')

      yearlyData.push({
        year: Number(yr),
        fuelPrice: roundTo(iceRows.reduce((s, r) => s + (r.fuel_price_usd_per_liter || 0), 0) / n, 4),
        electricityPrice: roundTo(iceRows.reduce((s, r) => s + (r.electricity_price_usd_per_kwh || 0), 0) / n, 6),
        evSubsidy: roundTo(iceRows.reduce((s, r) => s + (r.ev_subsidy_usd || 0), 0) / n, 0),
        evMarketShare,
        chargingStations: roundTo(iceRows.reduce((s, r) => s + (r.charging_stations || 0), 0) / n, 0),
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
  // Load IEA EV sales share data to override synthetic CSV market share values
  let ieaSalesShare = {}
  const extrapolatedKeys = new Set() // track "country:year" pairs that were extrapolated
  try {
    const ieaData = JSON.parse(fs.readFileSync(dataPath('act2', 'ev-growth-by-region.json'), 'utf-8'))
    // Build lookup: country -> year -> share
    for (const region of (ieaData.regions || [])) {
      const shares = region.EV_sales_share?.historical || []
      for (const s of shares) {
        if (!ieaSalesShare[region.region]) ieaSalesShare[region.region] = {}
        ieaSalesShare[region.region][s.year] = s.value
      }
    }
    // Extrapolate IEA data to 2025 using 3-year moving average growth rate
    // (IEA historical data typically ends at 2024, but heatmap includes 2025 projections)
    for (const [country, yearMap] of Object.entries(ieaSalesShare)) {
      const years = Object.keys(yearMap).map(Number).sort()
      const lastYear = years[years.length - 1]
      // Extend to 2025 if not already present
      if (lastYear < 2025) {
        const lastValue = yearMap[lastYear]
        if (lastValue === undefined) continue

        // Calculate 3-year moving average growth rate from the last 3 available year-over-year changes
        const recentYears = years.slice(-4) // need 4 years to compute 3 YoY growth rates
        let growthRates = []
        for (let i = 1; i < recentYears.length; i++) {
          const prevVal = yearMap[recentYears[i - 1]]
          const currVal = yearMap[recentYears[i]]
          if (prevVal > 0 && currVal !== undefined) {
            growthRates.push((currVal - prevVal) / prevVal)
          }
        }
        // Fallback: if we have fewer than 3 growth rates, use whatever is available
        if (growthRates.length === 0) {
          // Zero-growth fallback (original behavior)
          yearMap[2025] = lastValue
          extrapolatedKeys.add(`${country}:2025`)
        } else {
          const avgGrowthRate = growthRates.reduce((s, r) => s + r, 0) / growthRates.length
          // Apply growth rate iteratively for each missing year up to 2025
          let projected = lastValue
          for (let yr = lastYear + 1; yr <= 2025; yr++) {
            projected = roundTo(projected * (1 + avgGrowthRate), 4)
            yearMap[yr] = projected
            extrapolatedKeys.add(`${country}:${yr}`)
          }
        }
      }
    }
    console.log(`  IEA sales share override loaded for ${Object.keys(ieaSalesShare).length} regions (with carry-forward to 2025)`)
  } catch (e) {
    console.log('  ⚠ Could not load IEA sales share data, using CSV values')
  }

  const policyHeatmap = { countries: [], yearRange: [2010, 2025] }
  for (const [country, countryRows] of Object.entries(byCountry)) {
    const info = getCountryInfo(country)

    const byYear = {}
    for (const r of countryRows) {
      if (!byYear[r.year]) byYear[r.year] = []
      byYear[r.year].push(r)
    }

    const yearlyData = []
    for (const [yr, yrRows] of Object.entries(byYear)) {
      const totalEvSales = yrRows.reduce((s, r) => s + (Number(r.ev_sales) || 0), 0)
      const totalVehicleSales = yrRows.reduce((s, r) => s + (Number(r.total_vehicle_sales) || 0), 0)
      const csvMarketShare = totalVehicleSales > 0
        ? roundTo((totalEvSales / totalVehicleSales) * 100, 2) : 0
      // Override with IEA data if available (more authoritative than synthetic CSV)
      const ieaShare = ieaSalesShare[country]?.[Number(yr)]
      const isExtrapolated = extrapolatedKeys.has(`${country}:${yr}`)
      const evMarketShare = ieaShare !== undefined ? ieaShare : csvMarketShare
      // Macro indicators from ICE rows (same across segments)
      const iceRows = yrRows.filter(r => r.powertrain_type === 'ICE')
      const n = iceRows.length || 1
      yearlyData.push({
        year: Number(yr),
        emissionRegulationScore: roundTo(iceRows.reduce((s, r) => s + (r.emission_regulation_score || 0), 0) / n, 4),
        evSubsidyUsd: roundTo(iceRows.reduce((s, r) => s + (r.ev_subsidy_usd || 0), 0) / n, 0),
        evMarketShare,
        ...(isExtrapolated ? { isExtrapolated: true } : {}),
        chargingStations: roundTo(iceRows.reduce((s, r) => s + (r.charging_stations || 0), 0) / n, 0),
        evSales: totalEvSales,
        evGrowthRateYoy: roundTo(iceRows.reduce((s, r) => s + (r.ev_growth_rate_yoy || 0), 0) / n, 2),
        gdpPerCapita: roundTo(iceRows.reduce((s, r) => s + (r.gdp_per_capita || 0), 0) / n, 0),
        urbanPopulationPercent: roundTo(iceRows.reduce((s, r) => s + (r.urban_population_percent || 0), 0) / n, 1),
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
