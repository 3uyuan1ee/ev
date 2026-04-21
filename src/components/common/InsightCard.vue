<script setup>
defineProps({
  citation: { type: String, default: '' },
})

import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
</script>

<template>
  <div class="insight-card">
    <div class="insight-icon">
      <slot name="icon" />
    </div>
    <div class="insight-content">
      <div class="insight-title-row">
        <h3 class="insight-title">
          <slot name="title" />
        </h3>
        <span v-if="citation" class="insight-citation">{{ citation }}</span>
      </div>
      <div class="insight-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.insight-card {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-accent);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.insight-icon {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
  color: var(--color-accent);
}

.insight-content {
  flex: 1;
  min-width: 0;
}

.insight-title-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-2);
}

.insight-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.4;
  color: var(--color-text-primary);
  margin: 0;
}

.insight-citation {
  font-size: var(--font-size-micro);
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.02em;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(142, 141, 186, 0.1);
  color: var(--color-info);
  white-space: nowrap;
}

.insight-body {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: 1.75;
}

/* Stat number styling for highlight-number inside body */
.insight-body :deep(.highlight-number) {
  font-family: var(--font-mono);
  font-size: var(--font-size-stat);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-stat);
  color: var(--color-accent);
  display: inline;
  line-height: 1;
  vertical-align: baseline;
}

/* Citation link styling */
.insight-body :deep(.cite) {
  color: var(--color-info);
  text-decoration: none;
  border-bottom: 1px solid var(--color-info);
  transition: opacity var(--duration-micro) ease;
}

.insight-body :deep(.cite:hover) {
  opacity: 0.8;
}

@media (max-width: 479px) {
  .insight-card {
    flex-direction: column;
    gap: var(--space-3);
  }

  .insight-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }
}
</style>
