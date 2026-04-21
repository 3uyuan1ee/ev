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
  console.log('\n📊 Processing global_ev_market_2026.csv...')
  const rows = parseCsv(datasetPath('data/market_sales/global_ev_market_2026.csv'))

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

  const globalAggregation = Object.values(brandTypeMap).map(g => ({
    brand: g.brand,
    vehicleType: g.vehicleType,
    totalSales: g.sales.reduce((a, b) => a + b, 0),
    avgPriceUsd: roundTo(g.prices.reduce((a, b) => a + b, 0) / g.prices.length, 0),
    avgBatteryKwh: roundTo(g.batteries.reduce((a, b) => a + b, 0) / g.batteries.length, 1),
    countryCount: g.sales.length,
  }))

  await writeJson(dataPath('act2', 'brand-competition.json'), {
    vehicleTypes, countries, brands, data, globalAggregation,
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

  // Grid CO2 intensity (kg CO2/kWh) - sourced from IEA/Ember 2024 data
  const gridCO2Map = {
    'Australia': 0.58, 'Canada': 0.13, 'China': 0.54, 'France': 0.06,
    'Germany': 0.35, 'India': 0.72, 'Japan': 0.47, 'Norway': 0.03,
    'United Kingdom': 0.23, 'United States': 0.39,
  }

  const countriesOutput = Object.entries(countryAgg).map(([country, agg]) => {
    const info = getCountryInfo(country)
    const avgCo2 = roundTo(agg.co2.reduce((a, b) => a + b, 0) / agg.co2.length, 1)
    const avgEnergy = roundTo(agg.energy.reduce((a, b) => a + b, 0) / agg.energy.length, 1)
    const gridCO2 = gridCO2Map[country] || 0.45
    // ICEV emits ~2.3 kg CO2/L, average consumption ~7L/100km
    // EV emits gridCO2 * energyConsumption kWh/100km
    const icevEmissionsPer100km = 2.3 * 7 // ~16.1 kg
    const bevEmissionsPer100km = gridCO2 * avgEnergy
    const evCarbonAdvantage = roundTo((1 - bevEmissionsPer100km / icevEmissionsPer100km) * 100, 1)

    return {
      country,
      iso3: info ? info.iso3 : '',
      gridCO2PerKwh: gridCO2,
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
  })

  return { rows }
}
