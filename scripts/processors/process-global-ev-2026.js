import Papa from 'papaparse'
import fs from 'fs'
import { datasetPath, dataPath, writeJson, roundTo } from '../lib/utils.js'
import { getCountryInfo } from '../lib/country-normalizer.js'

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = Papa.parse(content, { header: true, skipEmptyLines: true, dynamicTyping: true })
  return result.data
}

export async function processGlobalEv2026() {
  console.log('\n📊 Processing global_ev_market_2026.csv (synthetic/forecast data)...')
  const rows = parseCsv(datasetPath('data/market_sales/global_ev_market_2026.csv'))

  // Mark all data as synthetic — this CSV contains 2026 projections, not observed data
  for (const r of rows) r._isSynthetic = true

  const vehicleTypes = [...new Set(rows.map(r => r.vehicle_type))].sort()
  const countries = [...new Set(rows.map(r => r.country))].sort()
  const brands = [...new Set(rows.map(r => r.ev_brand))].sort()

  // === Output 1: brand-competition.json ===
  // Aggregate by (country, brand, vehicleType) — reduces 5000 rows to ~400
  const aggMap = {}
  for (const r of rows) {
    const key = `${r.country}|${r.ev_brand}|${r.vehicle_type}`
    if (!aggMap[key]) {
      aggMap[key] = {
        country: r.country,
        brand: r.ev_brand,
        vehicleType: r.vehicle_type,
        salesUnits: 0, count: 0,
        prices: [], batteries: [], ranges: [], energies: [],
        co2Reductions: [], chargingStationsList: [],
        govtIncentives: r.govt_incentives === 'Yes',
        marketAdoptionRates: [],
      }
    }
    const a = aggMap[key]
    a.salesUnits += r.ev_sales_units || 0
    a.count++
    a.prices.push(r.avg_ev_price_usd)
    a.batteries.push(r.battery_capacity_kwh)
    a.ranges.push(r.vehicle_range_km)
    a.energies.push(r.energy_consumption_kwh)
    a.co2Reductions.push(r.co2_reduction_mt)
    a.chargingStationsList.push(r.charging_stations)
    a.marketAdoptionRates.push(r.market_adoption_rate)
  }

  const data = Object.values(aggMap).map(a => ({
    country: a.country,
    brand: a.brand,
    vehicleType: a.vehicleType,
    salesUnits: a.salesUnits,
    avgPriceUsd: roundTo(a.prices.reduce((s, v) => s + v, 0) / a.prices.length, 0),
    batteryCapacityKwh: roundTo(a.batteries.reduce((s, v) => s + v, 0) / a.batteries.length, 0),
    rangeKm: roundTo(a.ranges.reduce((s, v) => s + v, 0) / a.ranges.length, 0),
    energyConsumptionKwh: roundTo(a.energies.reduce((s, v) => s + v, 0) / a.energies.length, 1),
    chargingStations: roundTo(a.chargingStationsList.reduce((s, v) => s + v, 0) / a.chargingStationsList.length, 0),
    govtIncentives: a.govtIncentives,
    marketAdoptionRate: roundTo(a.marketAdoptionRates.reduce((s, v) => s + v, 0) / a.marketAdoptionRates.length, 1),
    co2ReductionMt: roundTo(a.co2Reductions.reduce((s, v) => s + v, 0) / a.co2Reductions.length, 1),
  }))

  // Global aggregation: group by brand + vehicleType across all countries
  const brandTypeMap = {}
  for (const r of rows) {
    const key = `${r.ev_brand}|${r.vehicle_type}`
    if (!brandTypeMap[key]) brandTypeMap[key] = { brand: r.ev_brand, vehicleType: r.vehicle_type, sales: [], prices: [], batteries: [] }
    brandTypeMap[key].sales.push(r.ev_sales_units)
    brandTypeMap[key].prices.push(r.avg_ev_price_usd)
    brandTypeMap[key].batteries.push(r.battery_capacity_kwh)
  }

  const globalAggregation = Object.values(brandTypeMap).map(g => {
    const totalSales = g.sales.reduce((a, b) => a + b, 0)
    // Sales-weighted average price (C3 fix: simple average misrepresents market)
    const weightedPrice = totalSales > 0
      ? g.sales.reduce((s, sales, i) => s + sales * g.prices[i], 0) / totalSales
      : g.prices.reduce((a, b) => a + b, 0) / g.prices.length
    return {
      brand: g.brand,
      vehicleType: g.vehicleType,
      totalSales,
      avgPriceUsd: roundTo(weightedPrice, 0),
      avgBatteryKwh: roundTo(g.batteries.reduce((a, b) => a + b, 0) / g.batteries.length, 1),
      countryCount: g.sales.length,
      isSynthetic: true,
    }
  })

  await writeJson(dataPath('act2', 'brand-competition.json'), {
    vehicleTypes, countries, brands, data, globalAggregation,
    isSynthetic: true,
    sourceNote: 'Data from global_ev_market_2026.csv — synthetic/forecast projections, not observed market data.',
  })

  // === Output 2: grid-cleanliness-comparison.json (semi-auto) ===
  const countryAgg = {}
  for (const r of rows) {
    if (!countryAgg[r.country]) {
      countryAgg[r.country] = { co2: [], energy: [], price: [] }
    }
    countryAgg[r.country].co2.push(r.co2_reduction_mt)
    countryAgg[r.country].energy.push(r.energy_consumption_kwh)
    countryAgg[r.country].price.push(r.avg_ev_price_usd)
  }

  // Grid CO2 intensity (kg CO2/kWh) - sourced from Ember Global Electricity Review 2025, Table: CO2 intensity of electricity generation
  // https://ember-climate.org/publications/global-electricity-review-2025/
  const gridCO2Map = {
    'Australia': 0.58, 'Canada': 0.13, 'China': 0.54, 'France': 0.06,
    'Germany': 0.35, 'India': 0.72, 'Japan': 0.47, 'Norway': 0.03,
    'United Kingdom': 0.23, 'United States': 0.39,
  }

  // Comparison basis: country-specific ICEV fuel consumption
  // ICEV efficiency varies by country due to fleet composition (m6 fix):
  //   US: large SUVs/trucks dominant → ~9.5 L/100km
  //   Canada: similar to US → ~9.0 L/100km
  //   Australia: large sedans/SUVs → ~8.5 L/100km
  //   Europe/Japan: compact dominant → ~6.5 L/100km
  //   China: mix → ~7.0 L/100km
  //   India: small cars dominant → ~5.5 L/100km
  //   Norway: high EV share, remaining ICE ~7.0 L/100km
  // Source: IEA Global Fuel Economy Initiative 2024; ICCT country profiles
  const ICEV_FUEL_MAP = {
    'United States': 9.5, 'Canada': 9.0, 'Australia': 8.5,
    'Germany': 6.5, 'France': 6.5, 'United Kingdom': 6.5,
    'Japan': 6.5, 'China': 7.0, 'India': 5.5, 'Norway': 7.0,
  }
  const FUEL_CO2_PER_LITER = 2.31  // kg CO₂ per liter gasoline (IPCC AR6)

  const countriesOutput = Object.entries(countryAgg).map(([country, agg]) => {
    const info = getCountryInfo(country)
    const avgCo2 = roundTo(agg.co2.reduce((a, b) => a + b, 0) / agg.co2.length, 1)
    const avgEnergy = roundTo(agg.energy.reduce((a, b) => a + b, 0) / agg.energy.length, 1)
    const gridCO2 = gridCO2Map[country] || 0.45
    const icevLiters = ICEV_FUEL_MAP[country] || 7.0
    const icevEmissionsPer100km = FUEL_CO2_PER_LITER * icevLiters
    const bevEmissionsPer100km = gridCO2 * avgEnergy
    const evCarbonAdvantage = roundTo((1 - bevEmissionsPer100km / icevEmissionsPer100km) * 100, 1)

    return {
      country,
      iso3: info ? info.iso3 : '',
      gridCO2PerKwh: gridCO2,
      icevLitersPer100km: icevLiters,
      avgEnergyConsumptionKwh: avgEnergy,
      co2ReductionMt: avgCo2,
      evCarbonAdvantage,
    }
  })

  const globalAvgCO2 = roundTo(countriesOutput.reduce((s, c) => s + c.gridCO2PerKwh, 0) / countriesOutput.length, 2)
  const globalAvgAdvantage = roundTo(countriesOutput.reduce((s, c) => s + c.evCarbonAdvantage, 0) / countriesOutput.length, 1)

  await writeJson(dataPath('act4', 'grid-cleanliness-comparison.json'), {
    countries: countriesOutput,
    globalAverage: { gridCO2PerKwh: globalAvgCO2, evCarbonAdvantage: globalAvgAdvantage },
    methodologyNote: 'EV carbon advantage = (1 - BEV_op_emissions / ICEV_op_emissions) × 100%. ICEV fuel consumption varies by country fleet composition (US ~9.5 L/100km, Europe ~6.5, India ~5.5). BEV = gridCO₂ × avgEnergy. Operational emissions only (excludes manufacturing). Data is synthetic/forecast.',
  })

  return { rows }
}
