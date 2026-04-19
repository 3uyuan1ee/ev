import { ref, computed } from 'vue'
import carbonData from '@/data/act4/carbon-race-params.json'

const profiles = carbonData.vehicleProfiles
const presets = carbonData.gridCleanlinessPresets
const MAX_YEARS = 15

export function useCarbonRace() {
  const selectedVehicle = ref('midsize')
  const selectedPreset = ref('United States (40% clean)')
  const customCleanPercent = ref(40)

  const vehicleProfile = computed(() => {
    return profiles.find(p => p.id === selectedVehicle.value) || profiles[1]
  })

  const gridPreset = computed(() => {
    return presets.find(p => p.label === selectedPreset.value) || presets[3]
  })

  /**
   * The grid CO2 factor scales the BEV annual emissions.
   * US average: 0.39 kg CO2/kWh → baseline.
   * A cleaner grid reduces BEV emissions proportionally.
   */
  const gridCO2 = computed(() => {
    return gridPreset.value.co2PerKwh
  })

  /**
   * Compute year-by-year cumulative emissions for BEV vs ICEV.
   * BEV starts higher (battery manufacturing) but catches up.
   */
  const raceData = computed(() => {
    const vp = vehicleProfile.value
    const bevMfg = vp.bev.manufacturingEmissionsTonnes + vp.bev.batteryEmissionsTonnes
    const icevMfg = vp.icev.manufacturingEmissionsTonnes

    // Scale BEV annual emissions by grid cleanliness relative to US baseline (0.39)
    const usBaselineCO2 = 0.39
    const bevAnnualScaled = vp.bev.annualEmissionsTonnesPerYear * (gridCO2.value / usBaselineCO2)

    const years = []
    let bevCumulative = bevMfg
    let icevCumulative = icevMfg

    for (let y = 0; y <= MAX_YEARS; y++) {
      years.push({
        year: y,
        bevCumulative: Math.round(bevCumulative * 10) / 10,
        icevCumulative: Math.round(icevCumulative * 10) / 10,
        bevAnnual: y === 0 ? bevMfg : Math.round(bevAnnualScaled * 10) / 10,
        icevAnnual: y === 0 ? icevMfg : vp.icev.annualEmissionsTonnesPerYear
      })
      if (y > 0) {
        bevCumulative += bevAnnualScaled
        icevCumulative += vp.icev.annualEmissionsTonnesPerYear
      }
    }

    return years
  })

  /**
   * Crossover year: when BEV cumulative emissions become less than ICEV.
   */
  const crossoverYear = computed(() => {
    const data = raceData.value
    for (let i = 1; i < data.length; i++) {
      if (data[i].bevCumulative <= data[i].icevCumulative) {
        // Linear interpolation for fractional year
        const prev = data[i - 1]
        const curr = data[i]
        const bevGap = prev.bevCumulative - prev.icevCumulative
        const currGap = curr.bevCumulative - curr.icevCumulative
        if (bevGap === currGap) return i
        const fraction = bevGap / (bevGap - currGap)
        return Math.round((i - 1 + fraction) * 10) / 10
      }
    }
    return null // BEV never catches up in range
  })

  /**
   * Savings at end of ownership period.
   */
  const lifetimeSavings = computed(() => {
    const last = raceData.value[MAX_YEARS]
    if (!last) return 0
    return Math.round((last.icevCumulative - last.bevCumulative) * 10) / 10
  })

  function setVehicle(id) {
    selectedVehicle.value = id
  }

  function setPreset(label) {
    selectedPreset.value = label
    const p = presets.find(pr => pr.label === label)
    if (p) customCleanPercent.value = p.cleanPercent
  }

  return {
    profiles,
    presets,
    selectedVehicle,
    selectedPreset,
    customCleanPercent,
    vehicleProfile,
    gridPreset,
    gridCO2,
    raceData,
    crossoverYear,
    lifetimeSavings,
    MAX_YEARS,
    setVehicle,
    setPreset
  }
}
