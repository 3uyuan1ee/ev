<script setup>
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
</script>

<template>
  <div class="insight-card">
    <div class="insight-icon">
      <slot name="icon" />
    </div>
    <div class="insight-content">
      <h3 class="insight-title">
        <slot name="title" />
      </h3>
      <p class="insight-body">
        <slot />
      </p>
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

.insight-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  line-height: 1.4;
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
}

.insight-body {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: var(--line-height-small);
}

@media (max-width: 479px) {
  .insight-card {
    flex-direction: column;
    gap: var(--space-3);
  }
}
</style>
