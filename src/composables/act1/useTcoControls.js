import { reactive } from 'vue'
import tcoModelParams from '@/data/act1/tco-model-params.json'

/**
 * TCO Controls — reactive state for all TCO calculator inputs
 * Default values from Design.md 4.1.1
 */
export function useTcoControls() {
  const controls = reactive({
    vehicleType: 'midsize_suv',
    powertrainPair: ['icev', 'bev'],  // which two powertrains to compare
    condition: 'used_3yr',            // new / used_3yr / used_6yr
    city: 'Seattle',
    annualMileage: 15000,             // km/yr (range: 10000–25000)
    chargingStrategy: 'occasional',
    ownershipYears: 7,                // range: 1–15
    subsidy: null,                    // null = auto-fill from city/country
  })

  // Derived: get vehicle config
  function getVehicleConfig() {
    return tcoModelParams.vehicleTypes.find(v => v.id === controls.vehicleType)
  }

  // Derived: get city config
  function getCityConfig() {
    return tcoModelParams.cities.find(c => c.name === controls.city)
  }

  // Derived: get charging strategy
  function getChargingStrategy() {
    return tcoModelParams.chargingStrategies.find(s => s.id === controls.chargingStrategy)
  }

  // Auto-fill subsidy based on city or country
  function getSubsidy() {
    if (controls.subsidy !== null) return controls.subsidy
    // Default US federal tax credit for eligible EVs
    return 7500
  }

  return {
    controls,
    getVehicleConfig,
    getCityConfig,
    getChargingStrategy,
    getSubsidy,
  }
}
