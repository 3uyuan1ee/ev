<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  formatValue: { type: Function, default: null },
  tooltip: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const showTooltip = ref(false)

const displayValue = computed(() => {
  if (props.formatValue) return props.formatValue(props.modelValue)
  return props.modelValue.toLocaleString() + (props.unit ? ` ${props.unit}` : '')
})
</script>

<template>
  <div class="slider-control">
    <div class="slider-header">
      <div class="slider-label-row">
        <label class="slider-label">{{ label }}</label>
        <span
          v-if="tooltip"
          class="info-icon"
          @mouseenter="showTooltip = true"
          @mouseleave="showTooltip = false"
          @focus="showTooltip = true"
          @blur="showTooltip = false"
          tabindex="0"
          role="button"
          :aria-label="label"
        >&#9432;</span>
      </div>
      <span class="slider-value">{{ displayValue }}</span>
    </div>
    <Transition name="tooltip">
      <div v-if="showTooltip && tooltip" class="slider-tooltip">
        {{ tooltip }}
      </div>
    </Transition>
    <input
      type="range"
      class="slider-input"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="emit('update:modelValue', Number($event.target.value))"
    />
    <div class="slider-range">
      <span class="range-min">{{ formatValue ? formatValue(min) : min }}</span>
      <span class="range-max">{{ formatValue ? formatValue(max) : max }}</span>
    </div>
  </div>
</template>

<style scoped>
.slider-control {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-label-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.slider-label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  line-height: 1;
  color: var(--color-text-tertiary);
  cursor: help;
  border-radius: 50%;
  transition: color 0.15s;
  flex-shrink: 0;
}

.info-icon:hover,
.info-icon:focus {
  color: var(--color-info);
  outline: none;
}

.slider-tooltip {
  font-size: var(--font-size-caption);
  line-height: 1.6;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-1);
}

.tooltip-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.tooltip-leave-active {
  transition: all 0.15s ease;
}
.tooltip-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.tooltip-leave-to {
  opacity: 0;
}

.slider-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.slider-input {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  outline: none;
  cursor: pointer;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-info);
  border: 2px solid var(--color-bg-primary);
  box-shadow: 0 1px 3px rgba(58, 54, 48, 0.2);
  cursor: pointer;
  transition: transform var(--duration-micro) ease-out;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-info);
  border: 2px solid var(--color-bg-primary);
  box-shadow: 0 1px 3px rgba(58, 54, 48, 0.2);
  cursor: pointer;
}

.slider-range {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-caption);
  color: var(--color-text-tertiary);
}
</style>
