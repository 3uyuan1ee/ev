<script setup>
import { computed } from 'vue'
import tcoModelParams from '@/data/act1/tco-model-params.json'
import colorConfig from '@/data/shared/color-config.json'
import SelectControl from '@/components/common/SelectControl.vue'
import SliderControl from '@/components/common/SliderControl.vue'
import ToggleControl from '@/components/common/ToggleControl.vue'
import ControlPanel from '@/components/common/ControlPanel.vue'
import { useI18n } from '@/i18n/useI18n'

const { t } = useI18n()

const props = defineProps({
  controls: { type: Object, required: true },
})

const vehicleLabelMap = {
  subcompact_sedan: 'act1.vehicleSubcompactSedan',
  midsize_sedan: 'act1.vehicleMidsizeSedan',
  compact_suv: 'act1.vehicleCompactSuv',
  midsize_suv: 'act1.vehicleMidsizeSuv',
  pickup_truck: 'act1.vehiclePickupTruck',
}

const vehicleOptions = computed(() =>
  tcoModelParams.vehicleTypes.map(v => ({ value: v.id, label: t(vehicleLabelMap[v.id] || v.label) }))
)

const conditionOptions = computed(() => [
  { value: 'new', label: t('act1.conditionNew'), color: colorConfig.actColors.act1.primary },
  { value: 'used_3yr', label: t('act1.conditionUsed3yr'), color: colorConfig.powertrainColors.bev },
  { value: 'used_6yr', label: t('act1.conditionUsed6yr'), color: colorConfig.actColors.act2.primary },
])

const chargingLabelMap = {
  no_public: 'act1.chargingNoPublic',
  rare_public: 'act1.chargingRarePublic',
  occasional: 'act1.chargingOccasional',
  frequent_public: 'act1.chargingFrequentPublic',
  all_public: 'act1.chargingAllPublic',
}

const chargingOptions = computed(() =>
  tcoModelParams.chargingStrategies.map(s => ({ value: s.id, label: t(chargingLabelMap[s.id] || s.label) }))
)

const powertrainOptions = [
  { value: 'icev', label: 'ICEV', color: colorConfig.powertrainColors.icev },
  { value: 'hev', label: 'HEV', color: colorConfig.powertrainColors.hev },
  { value: 'phev', label: 'PHEV', color: colorConfig.powertrainColors.phev },
  { value: 'bev', label: 'BEV', color: colorConfig.powertrainColors.bev },
]
</script>

<template>
  <ControlPanel :title="t('act1.controlsTitle')" :collapsible="true" :default-open="true">
    <SelectControl
      :label="t('act1.vehicleTypeLabel')"
      :model-value="controls.vehicleType"
      :options="vehicleOptions"
      @update:model-value="controls.vehicleType = $event"
    />

    <ToggleControl
      :model-value="controls.powertrains"
      :options="powertrainOptions"
      :multiple="true"
      @update:model-value="controls.powertrains = $event"
    />

    <div class="control-row">
      <span class="control-label">{{ t('act1.conditionLabel') }}</span>
      <ToggleControl
        :model-value="[controls.condition]"
        :options="conditionOptions"
        @update:model-value="controls.condition = $event[0]"
      />
    </div>

    <SliderControl
      :label="t('act1.annualMileageLabel')"
      :model-value="controls.annualMileage"
      :min="10000"
      :max="25000"
      :step="1000"
      :unit="t('act1.annualMileageUnit')"
      :format-value="v => t('act1.annualMileageFormat', { value: (v / 1000).toFixed(0) })"
      @update:model-value="controls.annualMileage = $event"
    />

    <SelectControl
      :label="t('act1.chargingStrategyLabel')"
      :model-value="controls.chargingStrategy"
      :options="chargingOptions"
      @update:model-value="controls.chargingStrategy = $event"
    />

    <SliderControl
      :label="t('act1.ownershipPeriodLabel')"
      :model-value="controls.ownershipYears"
      :min="1"
      :max="15"
      :step="1"
      :unit="t('act1.ownershipPeriodUnit')"
      :format-value="v => t('act1.ownershipPeriodFormat', { value: v, plural: v > 1 ? 's' : '' })"
      @update:model-value="controls.ownershipYears = $event"
    />

    <SliderControl
      :label="t('act1.evSubsidyLabel')"
      :model-value="controls.subsidy || 7500"
      :min="0"
      :max="10000"
      :step="500"
      :unit="t('act1.evSubsidyUnit')"
      :format-value="v => t('act1.evSubsidyFormat', { value: v.toLocaleString() })"
      @update:model-value="controls.subsidy = $event"
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
