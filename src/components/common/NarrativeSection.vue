<script setup>
import { useScrollAnimation } from '@/composables/useScrollAnimation'

const { createAnimation } = useScrollAnimation({ threshold: 0.1 })
const { target, isVisible } = createAnimation()
</script>

<template>
  <div
    ref="target"
    class="narrative-section"
    :class="{ visible: isVisible }"
  >
    <slot />
  </div>
</template>

<style scoped>
.narrative-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity var(--duration-entrance) var(--ease-out),
              transform var(--duration-entrance) var(--ease-out);
}

.narrative-section.visible {
  opacity: 1;
  transform: translateY(0);
}

.narrative-section :deep(p) {
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
  max-width: 680px;
}

.narrative-section :deep(p:last-child) {
  margin-bottom: 0;
}

.narrative-section :deep(strong) {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.narrative-section :deep(.highlight-number) {
  font-family: var(--font-mono);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent);
}
</style>
