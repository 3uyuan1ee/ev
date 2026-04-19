<script setup>
const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true }, // [{ value, label }]
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="select-control">
    <label class="select-label">{{ label }}</label>
    <select
      class="select-input"
      :value="modelValue"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.select-control {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.select-label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.select-input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-size: var(--font-size-small);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: var(--space-8);
}

.select-input:focus {
  border-color: var(--color-info);
}
</style>
