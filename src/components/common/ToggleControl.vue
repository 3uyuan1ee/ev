<script setup>
const props = defineProps({
  modelValue: { type: Array, required: true }, // array of selected values
  options: { type: Array, required: true }, // [{ value, label, color }]
  multiple: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

function isSelected(value) {
  return props.modelValue.includes(value)
}

function toggle(value) {
  if (props.multiple) {
    const newVal = isSelected(value)
      ? props.modelValue.filter(v => v !== value)
      : [...props.modelValue, value]
    if (newVal.length > 0) {
      emit('update:modelValue', newVal)
    }
  } else {
    emit('update:modelValue', [value])
  }
}
</script>

<template>
  <div class="toggle-control">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="toggle-btn"
      :class="{ active: isSelected(opt.value) }"
      :style="{ '--btn-color': opt.color || 'var(--color-info)' }"
      @click="toggle(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.toggle-control {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.toggle-btn {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all var(--duration-micro) ease-out;
}

.toggle-btn:hover {
  border-color: var(--color-text-secondary);
  color: var(--color-text-primary);
}

.toggle-btn.active {
  background: var(--btn-color);
  color: var(--color-bg-primary);
  border-color: transparent;
}
</style>
