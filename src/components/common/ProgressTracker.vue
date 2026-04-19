<script setup>
import { computed } from 'vue'
import { DollarSign, Zap, Scale, Leaf } from 'lucide-vue-next'

const props = defineProps({
  activeAct: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['navigate'])

const acts = [
  { id: 1, label: '成本', icon: DollarSign, color: 'act-1' },
  { id: 2, label: '产业', icon: Zap, color: 'act-2' },
  { id: 3, label: '政策', icon: Scale, color: 'act-3' },
  { id: 4, label: '环保', icon: Leaf, color: 'act-4' },
]

const progressPercent = computed(() => {
  return ((props.activeAct - 1) / 3) * 100
})
</script>

<template>
  <nav class="progress-tracker" aria-label="Document progress">
    <div class="tracker-inner">
      <button
        v-for="act in acts"
        :key="act.id"
        class="act-btn"
        :class="[
          act.color,
          { active: activeAct === act.id },
          { visited: activeAct > act.id },
        ]"
        :aria-label="`Navigate to Act ${act.id}: ${act.label}`"
        @click="emit('navigate', act.id)"
      >
        <component :is="act.icon" :size="16" class="act-icon" />
        <span class="act-label">{{ act.label }}</span>
      </button>
    </div>
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>
  </nav>
</template>

<style scoped>
.progress-tracker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-progress);
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(12px);
  background: rgba(234, 231, 220, 0.9);
}

[data-theme="dark"] .progress-tracker {
  background: rgba(42, 40, 48, 0.9);
}

.tracker-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-2) var(--space-4);
}

.act-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  transition: all var(--duration-micro) ease-out;
  cursor: pointer;
  border: 1px solid transparent;
}

.act-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.act-btn.active {
  color: var(--color-bg-primary);
  border-color: transparent;
}

.act-btn.active.act-1 {
  background: var(--gradient-act1);
}

.act-btn.active.act-2 {
  background: var(--gradient-act2);
}

.act-btn.active.act-3 {
  background: var(--gradient-act3);
}

.act-btn.active.act-4 {
  background: var(--gradient-act4);
}

.act-btn.visited {
  color: var(--color-text-primary);
  opacity: 0.7;
}

.act-icon {
  flex-shrink: 0;
}

.progress-bar {
  height: 2px;
  background: var(--color-border);
}

.progress-fill {
  height: 100%;
  background: var(--color-info);
  transition: width var(--duration-content) ease-out;
}

@media (max-width: 479px) {
  .act-label {
    display: none;
  }

  .act-btn {
    padding: var(--space-2);
  }
}
</style>
