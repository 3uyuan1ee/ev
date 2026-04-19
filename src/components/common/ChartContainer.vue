<script setup>
import { ref, onMounted } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const props = defineProps({
  title: { type: String, default: '' },
  minHeight: { type: Number, default: 300 },
  loading: { type: Boolean, default: false },
})

const containerRef = ref(null)
const width = ref(0)
const height = ref(0)

onMounted(() => {
  if (containerRef.value) {
    width.value = containerRef.value.clientWidth
    height.value = containerRef.value.clientHeight
  }
})

useResizeObserver(containerRef, ([entry]) => {
  width.value = entry.contentRect.width
  height.value = entry.contentRect.height
})

defineExpose({ width, height })
</script>

<template>
  <div
    ref="containerRef"
    class="chart-container"
    :style="{ minHeight: `${minHeight}px` }"
  >
    <!-- Skeleton loading -->
    <div v-if="loading" class="chart-skeleton">
      <div class="skeleton-line skeleton-long" />
      <div class="skeleton-line skeleton-medium" />
      <div class="skeleton-line skeleton-short" />
    </div>

    <!-- Chart content -->
    <slot v-else :width="width" :height="height" />

    <!-- Title overlay -->
    <div v-if="title && !loading" class="chart-title">{{ title }}</div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  position: relative;
  background: var(--color-bg-chart);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.chart-skeleton {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
  min-height: inherit;
  justify-content: center;
}

.skeleton-line {
  height: 12px;
  border-radius: var(--radius-sm);
  background: linear-gradient(90deg, var(--color-bg-card) 25%, var(--color-border) 50%, var(--color-bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-long {
  width: 80%;
}

.skeleton-medium {
  width: 60%;
}

.skeleton-short {
  width: 40%;
}

.chart-title {
  position: absolute;
  top: var(--space-3);
  left: var(--space-4);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}
</style>
