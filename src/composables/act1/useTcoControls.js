import { reactive } from 'vue'
import tcoModelParams from '@/data/act1/tco-model-params.json'

/**
 * TCO Controls — reactive state for all TCO calculator inputs
 */
export function useTcoControls() {
  const controls = reactive({
    vehicleType: 'midsize_suv',
    powertrains: ['icev', 'bev'],    // selected powertrains to compare
    condition: 'used_3yr',           // new / used_3yr / used_6yr
    annualMileage: 15000,            // km/yr (range: 10000–25000)
    chargingStrategy: 'occasional',  // affects BEV/PHEV energy cost
    ownershipYears: 7,               // range: 1–15
    subsidy: null,                   // null = auto-fill default
  })

  // Derived: get vehicle config
  function getVehicleConfig() {
    return tcoModelParams.vehicleTypes.find(v => v.id === controls.vehicleType)
  }

  // Derived: get charging strategy
  function getChargingStrategy() {
    return tcoModelParams.chargingStrategies.find(s => s.id === controls.chargingStrategy)
  }

  // Auto-fill subsidy
  function getSubsidy() {
    if (controls.subsidy !== null) return controls.subsidy
    return 7500
  }

  return {
    controls,
    getVehicleConfig,
    getChargingStrategy,
    getSubsidy,
  }
}
