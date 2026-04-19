import { computed } from 'vue'
import tcoModelParams from '@/data/act1/tco-model-params.json'

/**
 * TCO Calculator — computes year-by-year cumulative cost breakdown
 * and detects the breakeven point between two powertrains.
 */
export function useTcoCalculator(controls, getVehicleConfig, getCityConfig, getChargingStrategy, getSubsidy) {

  // Compute depreciation value for a given year
  function depreciatedValue(msrp, year, depreciation, condition) {
    let factor = 1.0
    if (condition === 'used_3yr') {
      factor = tcoModelParams.usedVehicleDepreciation.year3
    } else if (condition === 'used_6yr') {
      factor = tcoModelParams.usedVehicleDepreciation.year6
    }
    const purchasePrice = msrp * factor
    // Linear depreciation model: value(t) = purchasePrice * (intercept + slope * t)
    const valueAtYear = (t) => {
      const ratio = depreciation.intercept + depreciation.slope * t
      return Math.max(0, ratio) * purchasePrice
    }
    return { purchasePrice, valueAtYear }
  }

  // Scale annual costs by mileage ratio (base is 15000 km/yr)
  function mileageScale() {
    return controls.annualMileage / 15000
  }

  // Compute energy cost scaling based on city prices and charging strategy
  function energyCostScale(powertrain) {
    const city = getCityConfig()
    const strategy = getChargingStrategy()
    if (!city || !strategy) return 1

    if (powertrain === 'bev') {
      const homeCost = city.electricityPricePerKwh
      const publicCost = city.electricityPricePerKwh * strategy.publicCostMultiplier
      return (homeCost * strategy.homePercent + publicCost * strategy.publicPercent) / 100
    }
    return 1 // ICEV/HEV fuel cost is already in annual costs, scale by mileage
  }

  // Compute series for a single powertrain
  function computePowertrainSeries(powertrain) {
    const vehicle = getVehicleConfig()
    if (!vehicle) return { yearlyData: [], cumulativeTotal: [] }

    const dep = depreciatedValue(
      vehicle.msrp[powertrain],
      0,
      vehicle.depreciation[powertrain],
      controls.condition
    )
    const annualCosts = vehicle.annualCosts[powertrain]
    const scale = mileageScale()
    const subsidy = powertrain === 'bev' || powertrain === 'phev' ? getSubsidy() : 0
    const eScale = energyCostScale(powertrain)

    const years = []
    const purchasePrice = dep.purchasePrice - subsidy
    let cumulative = 0

    for (let y = 0; y <= controls.ownershipYears; y++) {
      const currentResaleValue = dep.valueAtYear(y)
      const depreciation = y === 0
        ? purchasePrice
        : dep.valueAtYear(y - 1) - currentResaleValue

      const fuel = annualCosts.fuel * scale * eScale
      const maintenance = (annualCosts.maintenance + annualCosts.repair) * scale
      const insurance = annualCosts.insurance
      const tax = annualCosts.tax

      const yearTotal = y === 0 ? purchasePrice : fuel + maintenance + insurance + tax + Math.max(0, depreciation)
      cumulative += y === 0 ? purchasePrice : (fuel + maintenance + insurance + tax)

      years.push({
        year: y,
        purchase: y === 0 ? purchasePrice : Math.max(0, depreciation),
        energy: y === 0 ? 0 : fuel,
        maintenance: y === 0 ? 0 : maintenance,
        insurance: y === 0 ? 0 : insurance,
        tax: y === 0 ? 0 : tax,
        cumulative,
      })
    }

    return { yearlyData: years }
  }

  // Reactive series for both powertrains
  const series1 = computed(() => computePowertrainSeries(controls.powertrainPair[0]))
  const series2 = computed(() => computePowertrainSeries(controls.powertrainPair[1]))

  // Detect breakeven year
  const breakevenYear = computed(() => {
    const s1 = series1.value.yearlyData
    const s2 = series2.value.yearlyData
    if (!s1.length || !s2.length) return null

    for (let i = 1; i < Math.min(s1.length, s2.length); i++) {
      const prev1 = s1[i - 1].cumulative
      const prev2 = s2[i - 1].cumulative
      const curr1 = s1[i].cumulative
      const curr2 = s2[i].cumulative

      // Check if lines cross
      if ((prev1 <= prev2 && curr1 >= curr2) || (prev1 >= prev2 && curr1 <= curr2)) {
        // Linear interpolation for exact crossing point
        const t = (prev2 - prev1) / ((curr1 - prev1) - (curr2 - prev2))
        return i - 1 + t
      }
    }
    return null // No crossing within ownership period
  })

  // Total savings at end of ownership
  const totalSavings = computed(() => {
    const s1 = series1.value.yearlyData
    const s2 = series2.value.yearlyData
    if (!s1.length || !s2.length) return 0
    const last1 = s1[s1.length - 1].cumulative
    const last2 = s2[s2.length - 1].cumulative
    return last1 - last2 // positive = series2 (typically BEV) is cheaper
  })

  return {
    series1,
    series2,
    breakevenYear,
    totalSavings,
  }
}
