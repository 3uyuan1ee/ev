<script setup>
import { computed, toRefs } from 'vue'
import { usePolicySandbox } from '@/composables/act3/usePolicySandbox'
import { useI18n } from '@/i18n/useI18n'
import SliderControl from '@/components/common/SliderControl.vue'

const { sliderValues, predictedShare, defaultShare, featureImportance, model, resetToDefaults } = usePolicySandbox()
const { t } = useI18n()

// Map data-file feature names to i18n keys
const featureLabelMap = {
  ev_subsidy_usd: 'act3.featureEvSubsidy',
  charging_stations: 'act3.featureChargingStations',
  fuel_price_usd_per_liter: 'act3.featureFuelPrice',
  electricity_price_usd_per_kwh: 'act3.featureElectricityPrice',
  emission_regulation_score: 'act3.featureRegulationScore',
  gdp_per_capita: 'act3.featureGdpPerCapita'
}

// Map feature names to tooltip i18n keys
const featureTooltipMap = {
  ev_subsidy_usd: 'act3.featureTooltipEvSubsidy',
  charging_stations: 'act3.featureTooltipChargingStations',
  fuel_price_usd_per_liter: 'act3.featureTooltipFuelPrice',
  electricity_price_usd_per_kwh: 'act3.featureTooltipElectricityPrice',
  emission_regulation_score: 'act3.featureTooltipRegulationScore',
  gdp_per_capita: 'act3.featureTooltipGdpPerCapita'
}

function featureLabel(name) {
  return featureLabelMap[name] ? t(featureLabelMap[name]) : name
}

function featureTooltip(name) {
  return featureTooltipMap[name] ? t(featureTooltipMap[name]) : ''
}

const shareDiff = computed(() => {
  const diff = predictedShare.value - defaultShare.value
  return diff
})

const sharePercent = computed(() => {
  return Math.max(0, predictedShare.value).toFixed(1)
})

// Format slider display values
function formatValue(name, val) {
  const formatters = {
    ev_subsidy_usd: v => `$${Math.round(v).toLocaleString()}`,
    charging_stations: v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : Math.round(v).toLocaleString(),
    fuel_price_usd_per_liter: v => `$${v.toFixed(2)}`,
    electricity_price_usd_per_kwh: v => `$${v.toFixed(3)}`,
    emission_regulation_score: v => v.toFixed(0),
    gdp_per_capita: v => `$${Math.round(v).toLocaleString()}`
  }
  return (formatters[name] || (v => v))(val)
}

const sliderConfigs = computed(() => {
  return model.features.map(f => ({
    name: f.name,
    label: featureLabel(f.name),
    min: f.range.min,
    max: f.range.max,
    step: f.range.step,
    value: sliderValues[f.name],
    formattedValue: formatValue(f.name, sliderValues[f.name])
  }))
})

// Top 3 features for quick summary
const topFeatures = computed(() => featureImportance.value.slice(0, 3))
</script>

<template>
  <div class="sandbox">
    <!-- Predicted Share Display -->
    <div class="prediction-display">
      <div class="prediction-main">
        <span class="prediction-label">{{ t('act3.sandboxPredictedLabel') }}</span>
        <div class="prediction-value">
          <span class="prediction-number">{{ sharePercent }}%</span>
          <span
            class="prediction-diff"
            :class="{ positive: shareDiff >= 0, negative: shareDiff < 0 }"
          >
            {{ t('act3.sandboxDiffFormat', { sign: shareDiff >= 0 ? '+' : '', diff: shareDiff.toFixed(1) }) }}
          </span>
        </div>
      </div>
      <div class="prediction-meta">
        <span class="meta-item">
          {{ t('act3.sandboxModelMeta', { r2: model.r2, n: model.n }) }}
        </span>
      </div>
    </div>

    <!-- Key Drivers -->
    <div class="drivers-summary">
      <span class="drivers-title">{{ t('act3.sandboxTopDrivers') }}:</span>
      <span
        v-for="feat in topFeatures"
        :key="feat.name"
        class="driver-badge"
      >
        {{ featureLabel(feat.name) }}
        <span class="driver-direction">{{ feat.impact >= 0 ? '↑' : '↓' }}</span>
      </span>
    </div>

    <!-- Sliders -->
    <div class="sliders-grid">
      <div v-for="cfg in sliderConfigs" :key="cfg.name" class="slider-item">
        <SliderControl
          :label="cfg.label"
          :min="cfg.min"
          :max="cfg.max"
          :step="cfg.step"
          :tooltip="featureTooltip(cfg.name)"
          v-model="sliderValues[cfg.name]"
        >
          <template #display>{{ cfg.formattedValue }}</template>
        </SliderControl>
      </div>
    </div>

    <!-- Reset -->
    <button class="reset-btn" @click="resetToDefaults">
      {{ t('act3.sandboxResetButton') }}
    </button>
  </div>
</template>

<style scoped>
.sandbox {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.prediction-display {
  padding: var(--space-4) var(--space-5);
  background: linear-gradient(135deg, rgba(142, 141, 186, 0.1), rgba(142, 141, 186, 0.08));
  border: 1px solid rgba(142, 141, 186, 0.2);
  border-radius: var(--radius-lg);
  text-align: center;
}

.prediction-label {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.prediction-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-3);
}

.prediction-number {
  font-size: 2.5rem;
  font-weight: var(--font-weight-extrabold);
  font-family: var(--font-mono);
  color: var(--color-primary);
  line-height: 1.2;
}

.prediction-diff {
  font-size: var(--font-size-small);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
}

.prediction-diff.positive {
  color: var(--color-success);
}

.prediction-diff.negative {
  color: var(--color-error);
}

.prediction-meta {
  margin-top: var(--space-1);
}

.meta-item {
  font-size: var(--font-size-caption);
  color: var(--color-text-tertiary);
}

.drivers-summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.drivers-title {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.driver-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 99px;
  font-size: var(--font-size-small);
  color: var(--color-text-primary);
}

.driver-direction {
  font-weight: var(--font-weight-bold);
}

.sliders-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
}

@media (min-width: 768px) {
  .sliders-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.slider-item {
  min-width: 0;
}

.reset-btn {
  align-self: center;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: all 0.15s;
}

.reset-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
