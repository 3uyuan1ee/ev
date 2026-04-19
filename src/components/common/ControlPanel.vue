<script setup>
import { ref } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, default: 'Parameters' },
  collapsible: { type: Boolean, default: false },
  defaultOpen: { type: Boolean, default: true },
})

const isOpen = ref(props.defaultOpen)
</script>

<template>
  <div class="control-panel" :class="{ collapsed: !isOpen && collapsible }">
    <div
      v-if="collapsible"
      class="panel-header"
      @click="isOpen = !isOpen"
    >
      <span class="panel-title">{{ title }}</span>
      <component :is="isOpen ? ChevronUp : ChevronDown" :size="16" />
    </div>
    <div class="panel-body" v-show="isOpen">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color var(--duration-micro) ease-out;
}

.panel-header:hover {
  color: var(--color-text-primary);
}

.panel-title {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
}

.panel-body {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (max-width: 767px) {
  .panel-body {
    padding: var(--space-3);
  }
}
</style>
