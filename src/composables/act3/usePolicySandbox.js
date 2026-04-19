import { reactive, computed } from 'vue'
import modelData from '@/data/act3/policy-sandbox-model.json'

const { model } = modelData

// Build feature config map
const featureMap = {}
model.features.forEach(f => {
  featureMap[f.name] = f
})

// Reactive slider values — initialized to dataset defaults
const sliderValues = reactive({})
model.features.forEach(f => {
  sliderValues[f.name] = f.range.default
})

/**
 * Transform a raw value according to the feature's transform type.
 */
function transformValue(featureName, rawValue) {
  const feature = featureMap[featureName]
  if (feature.transform === 'log') {
    return Math.log(Math.max(rawValue, 1)) // avoid log(0)
  }
  return rawValue
}

/**
 * Predicted EV market share using the linear model:
 * share = intercept + Σ(coefficient × transform(value))
 */
const predictedShare = computed(() => {
  let sum = model.intercept
  model.features.forEach(f => {
    const raw = sliderValues[f.name]
    const transformed = transformValue(f.name, raw)
    sum += f.coefficient * transformed
  })
  return Math.max(0, sum) // clamp to 0
})

/**
 * Default prediction at dataset means (for comparison).
 */
const defaultShare = computed(() => {
  let sum = model.intercept
  model.features.forEach(f => {
    const transformed = transformValue(f.name, f.range.default)
    sum += f.coefficient * transformed
  })
  return Math.max(0, sum)
})

/**
 * Feature importance: absolute contribution change when slider moves from min to max.
 * This shows which factor has the largest impact on EV adoption.
 */
const featureImportance = computed(() => {
  const list = model.features.map(f => {
    const minContrib = f.coefficient * transformValue(f.name, f.range.min)
    const maxContrib = f.coefficient * transformValue(f.name, f.range.max)
    const delta = maxContrib - minContrib
    return {
      name: f.name,
      label: f.label,
      coefficient: f.coefficient,
      impact: delta, // positive = increases share, negative = decreases
      absImpact: Math.abs(delta)
    }
  })
  return list.sort((a, b) => b.absImpact - a.absImpact)
})

/**
 * Sensitivity data for the butterfly chart:
 * For each feature, show how the predicted share changes when only that feature
 * moves from min to max (holding others at default).
 */
const sensitivityData = computed(() => {
  return model.features.map(f => {
    // Compute share with this feature at min
    let sumMin = model.intercept
    model.features.forEach(other => {
      const raw = other.name === f.name ? other.range.min : sliderValues[other.name]
      const transformed = transformValue(other.name, raw)
      sumMin += other.coefficient * transformed
    })

    // Compute share with this feature at max
    let sumMax = model.intercept
    model.features.forEach(other => {
      const raw = other.name === f.name ? other.range.max : sliderValues[other.name]
      const transformed = transformValue(other.name, raw)
      sumMax += other.coefficient * transformed
    })

    return {
      name: f.name,
      label: f.label,
      atMin: Math.max(0, sumMin),
      atMax: Math.max(0, sumMax),
      delta: Math.max(0, sumMax) - Math.max(0, sumMin),
      unit: getUnit(f.name)
    }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
})

function getUnit(featureName) {
  const units = {
    ev_subsidy_usd: 'USD',
    charging_stations: 'stations',
    fuel_price_usd_per_liter: 'USD/L',
    electricity_price_usd_per_kwh: 'USD/kWh',
    emission_regulation_score: 'score',
    gdp_per_capita: 'USD'
  }
  return units[featureName] || ''
}

function resetToDefaults() {
  model.features.forEach(f => {
    sliderValues[f.name] = f.range.default
  })
}

export function usePolicySandbox() {
  return {
    model,
    featureMap,
    sliderValues,
    predictedShare,
    defaultShare,
    featureImportance,
    sensitivityData,
    resetToDefaults
  }
}
