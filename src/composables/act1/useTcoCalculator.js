import { computed } from 'vue'
import tcoModelParams from '@/data/act1/tco-model-params.json'

/**
 * TCO Calculator — computes year-by-year cumulative cost breakdown
 * Supports N powertrains selected by the user.
 */
export function useTcoCalculator(controls, getVehicleConfig, getChargingStrategy, getSubsidy) {

  /**
   * Exponential depreciation: value = (1 - annualRate)^t * purchasePrice
   * This produces a realistic front-loaded depreciation curve.
   * `depreciation.slope` stores the annual depreciation rate (e.g., -0.15 → 15%/year).
   * `depreciation.intercept` is kept at 1.0 for backward compat but not used.
   */
  function depreciatedValue(msrp, depreciation, condition) {
    let factor = 1.0
    if (condition === 'used_3yr') {
      factor = tcoModelParams.usedVehicleDepreciation.year3
    } else if (condition === 'used_6yr') {
      factor = tcoModelParams.usedVehicleDepreciation.year6
    }
    const purchasePrice = msrp * factor
    // annualRate: e.g. slope = -0.15 → rate = 0.15 (15% annual loss)
    const annualRate = Math.abs(depreciation.slope)
    const valueAtYear = (t) => {
      return purchasePrice * Math.pow(1 - annualRate, t)
    }
    return { purchasePrice, valueAtYear }
  }

  function mileageScale() {
    return controls.annualMileage / 15000
  }

  // BEV/PHEV energy cost is scaled by charging strategy (home vs public mix)
  function energyCostScale(powertrain) {
    const strategy = getChargingStrategy()
    if (!strategy) return 1

    if (powertrain === 'bev' || powertrain === 'phev') {
      // Use a representative electricity price ($0.15/kWh as US average)
      const baseElecPrice = 0.15
      const homeCost = baseElecPrice
      const publicCost = baseElecPrice * strategy.publicCostMultiplier
      const blended = (homeCost * strategy.homePercent + publicCost * strategy.publicPercent) / 100
      // Normalize: "no public" (100% home at 0.15) = 1.0 scale factor
      return blended / baseElecPrice
    }
    return 1
  }

  function computePowertrainSeries(powertrain) {
    const vehicle = getVehicleConfig()
    if (!vehicle) return { yearlyData: [] }
    if (!vehicle.msrp[powertrain]) return { yearlyData: [] }

    const dep = depreciatedValue(
      vehicle.msrp[powertrain],
      vehicle.depreciation[powertrain],
      controls.condition
    )
    const annualCosts = vehicle.annualCosts[powertrain]
    const scale = mileageScale()
    const subsidy = (powertrain === 'bev' || powertrain === 'phev') ? getSubsidy() : 0
    const eScale = energyCostScale(powertrain)

    const years = []
    const purchasePrice = dep.purchasePrice - subsidy
    let cumulative = 0

    for (let y = 0; y <= controls.ownershipYears; y++) {
      const currentResaleValue = dep.valueAtYear(y)
      const depreciation = y === 0
        ? purchasePrice
        : dep.valueAtYear(y - 1) - currentResaleValue

      // Age-adjusted annual costs:
      // - Insurance decreases ~3%/year as car ages (lower declared value)
      // - Maintenance+repair increase ~5%/year (wear and aging)
      // - Fuel stays flat (consumption doesn't change much)
      const ageFactor = y === 0 ? 1 : y
      const fuel = annualCosts.fuel * scale * eScale
      const maintenance = (annualCosts.maintenance + annualCosts.repair) * scale * Math.pow(1.05, ageFactor - 1)
      const insurance = annualCosts.insurance * Math.pow(0.97, ageFactor - 1)
      const tax = annualCosts.tax

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

  // Compute all selected powertrain series dynamically
  const allSeries = computed(() => {
    return controls.powertrains.map(pt => ({
      powertrain: pt,
      data: computePowertrainSeries(pt),
    }))
  })

  // Rank all series by final cumulative cost (ascending = cheapest first)
  const rankedSeries = computed(() => {
    return [...allSeries.value]
      .filter(s => s.data.yearlyData.length > 0)
      .sort((a, b) => {
        const lastA = a.data.yearlyData[a.data.yearlyData.length - 1].cumulative
        const lastB = b.data.yearlyData[b.data.yearlyData.length - 1].cumulative
        return lastA - lastB
      })
  })

  // Cheapest powertrain data
  const cheapestSeries = computed(() => rankedSeries.value[0] || null)
  // Most expensive powertrain data
  const mostExpensiveSeries = computed(() => rankedSeries.value[rankedSeries.value.length - 1] || null)

  // Detect breakeven year between cheapest and 2nd-cheapest powertrains
  const breakevenYear = computed(() => {
    const ranked = rankedSeries.value
    if (ranked.length < 2) return null
    const s1 = ranked[0].data.yearlyData
    const s2 = ranked[1].data.yearlyData
    if (!s1.length || !s2.length) return null

    for (let i = 1; i < Math.min(s1.length, s2.length); i++) {
      const prev1 = s1[i - 1].cumulative
      const prev2 = s2[i - 1].cumulative
      const curr1 = s1[i].cumulative
      const curr2 = s2[i].cumulative

      if ((prev1 <= prev2 && curr1 >= curr2) || (prev1 >= prev2 && curr1 <= curr2)) {
        const t = (prev2 - prev1) / ((curr1 - prev1) - (curr2 - prev2))
        return i - 1 + t
      }
    }
    return null
  })

  // Whether the cheapest leads from year 0
  const pt2LeadsFromStart = computed(() => {
    const ranked = rankedSeries.value
    if (ranked.length < 2) return false
    const s1 = ranked[0].data.yearlyData
    const s2 = ranked[1].data.yearlyData
    if (!s1.length || !s2.length) return false
    return s1[0].cumulative < s2[0].cumulative
  })

  // Total savings: cheapest vs most expensive
  const totalSavings = computed(() => {
    const cheap = cheapestSeries.value
    const expensive = mostExpensiveSeries.value
    if (!cheap || !expensive || cheap === expensive) return 0
    const lastCheap = cheap.data.yearlyData[cheap.data.yearlyData.length - 1].cumulative
    const lastExpensive = expensive.data.yearlyData[expensive.data.yearlyData.length - 1].cumulative
    return lastExpensive - lastCheap
  })

  // Labels for the cheapest and most expensive powertrains
  const cheapestLabel = computed(() => cheapestSeries.value?.powertrain?.toUpperCase() || '')
  const mostExpensiveLabel = computed(() => mostExpensiveSeries.value?.powertrain?.toUpperCase() || '')

  // Breakeven pair labels (cheapest vs 2nd-cheapest)
  const breakevenPt1Label = computed(() => rankedSeries.value[0]?.powertrain?.toUpperCase() || '')
  const breakevenPt2Label = computed(() => rankedSeries.value[1]?.powertrain?.toUpperCase() || '')

  return {
    allSeries,
    breakevenYear,
    pt2LeadsFromStart,
    totalSavings,
    cheapestLabel,
    mostExpensiveLabel,
    breakevenPt1Label,
    breakevenPt2Label,
  }
}
