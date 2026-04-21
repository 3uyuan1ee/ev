<script setup>
defineProps({
  question: { type: String, required: true },
  options: { type: Array, required: true },
  selectedId: { type: Number, default: null },
  getLabel: { type: Function, required: true },
})

defineEmits(['select'])
</script>

<template>
  <div class="survey-question">
    <p class="question-text">{{ question }}</p>
    <div class="options-list">
      <button
        v-for="option in options"
        :key="option.id"
        :class="['option-btn', { selected: selectedId === option.id }]"
        @click="$emit('select', option.id)"
      >
        <span class="option-radio">
          <span v-if="selectedId === option.id" class="radio-dot" />
        </span>
        <span class="option-label">{{ getLabel(option) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.question-text {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  margin-bottom: var(--space-4);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.option-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.option-btn.selected {
  background: rgba(233, 128, 116, 0.12);
  border-color: var(--color-coral);
  color: rgba(255, 255, 255, 0.95);
}

.option-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease;
}

.option-btn.selected .option-radio {
  border-color: var(--color-coral);
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-coral);
}

.option-label {
  line-height: 1.4;
}
</style>
