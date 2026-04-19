<script setup>
import { computed } from 'vue'
import tcoModelParams from '@/data/act1/tco-model-params.json'
import colorConfig from '@/data/shared/color-config.json'
import SelectControl from '@/components/common/SelectControl.vue'
import SliderControl from '@/components/common/SliderControl.vue'
import ToggleControl from '@/components/common/ToggleControl.vue'
import ControlPanel from '@/components/common/ControlPanel.vue'

const props = defineProps({
  controls: { type: Object, required: true },
})

const emit = defineEmits([
  'update:vehicleType', 'update:powertrainPair', 'update:condition',
  'update:city', 'update:annualMileage', 'update:chargingStrategy',
  'update:ownershipYears', 'update:subsidy',
])

const vehicleOptions = computed(() =>
  tcoModelParams.vehicleTypes.map(v => ({ value: v.id, label: v.label }))
)

const cityOptions = computed(() =>
  tcoModelParams.cities.map(c => ({ value: c.name, label: `${c.name}, ${c.state}` }))
)

const conditionOptions = [
  { value: 'new', label: 'New', color: colorConfig.actColors.act1.primary },
  { value: 'used_3yr', label: 'Used 3yr', color: colorConfig.powertrainColors.bev },
  { value: 'used_6yr', label: 'Used 6yr', color: colorConfig.actColors.act2.primary },
]

const chargingOptions = computed(() =>
  tcoModelParams.chargingStrategies.map(s => ({ value: s.id, label: s.label }))
)

const powertrainOptions = [
  { value: 'icev', label: 'ICEV', color: colorConfig.powertrainColors.icev },
  { value: 'hev', label: 'HEV', color: colorConfig.powertrainColors.hev },
  { value: 'phev', label: 'PHEV', color: colorConfig.powertrainColors.phev },
  { value: 'bev', label: 'BEV', color: colorConfig.powertrainColors.bev },
]
</script>

<template>
  <ControlPanel title="TCO Parameters" :collapsible="true" :default-open="true">
    <SelectControl
      label="Vehicle Type"
      :model-value="controls.vehicleType"
      :options="vehicleOptions"
      @update:model-value="emit('update:vehicleType', $event)"
    />

    <ToggleControl
      :model-value="controls.powertrainPair"
      :options="powertrainOptions"
      :multiple="true"
      @update:model-value="emit('update:powertrainPair', $event)"
    />

    <div class="control-row">
      <span class="control-label">Condition</span>
      <ToggleControl
        :model-value="[controls.condition]"
        :options="conditionOptions"
        @update:model-value="emit('update:condition', $event[0])"
      />
    </div>

    <SelectControl
      label="City"
      :model-value="controls.city"
      :options="cityOptions"
      @update:model-value="emit('update:city', $event)"
    />

    <SliderControl
      label="Annual Mileage"
      :model-value="controls.annualMileage"
      :min="10000"
      :max="25000"
      :step="1000"
      unit="km/yr"
      :format-value="v => `${(v / 1000).toFixed(0)}k km/yr`"
      @update:model-value="emit('update:annualMileage', $event)"
    />

    <SelectControl
      label="Charging Strategy"
      :model-value="controls.chargingStrategy"
      :options="chargingOptions"
      @update:model-value="emit('update:chargingStrategy', $event)"
    />

    <SliderControl
      label="Ownership Period"
      :model-value="controls.ownershipYears"
      :min="1"
      :max="15"
      :step="1"
      unit="years"
      :format-value="v => `${v} yr${v > 1 ? 's' : ''}`"
      @update:model-value="emit('update:ownershipYears', $event)"
    />

    <SliderControl
      label="EV Subsidy"
      :model-value="controls.subsidy || 7500"
      :min="0"
      :max="10000"
      :step="500"
      unit="USD"
      :format-value="v => `$${v.toLocaleString()}`"
      @update:model-value="emit('update:subsidy', $event)"
    />
  </ControlPanel>
</template>

<style scoped>
.control-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.control-label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}
</style>
