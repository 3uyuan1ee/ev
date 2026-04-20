<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const sentinelRef = ref(null)
const progress = ref(0)

function onScroll() {
  if (!sentinelRef.value) return
  const rect = sentinelRef.value.getBoundingClientRect()
  const vh = window.innerHeight
  // progress 0 → 1 as sentinel top goes from bottom-of-viewport to past-top
  const raw = 1 - rect.top / vh
  progress.value = Math.max(0, Math.min(1, raw))
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <!-- Sentinel: 100vh scroll space to drive the reveal animation -->
  <div ref="sentinelRef" class="end-sentinel" />

  <!-- Fixed cover that slides up into view -->
  <div class="end-cover" :style="{ opacity: progress, pointerEvents: progress < 0.05 ? 'none' : 'auto' }">
    <div class="end-dark" />
    <div
      class="end-content"
      :style="{ transform: `translateY(${(1 - progress) * 80}px)` }"
    >
      <div class="end-label">Epilogue</div>
      <h2 class="end-title">The Road Ahead</h2>
      <p class="end-body">
        电动化不是一个简单的"好与坏"的故事。
        它关乎经济账能否算清、电池能否跌破成本线、政策能否精准发力、电网能否跟上步伐。
      </p>
      <p class="end-body">
        数据给出了方向，但每个国家、每个人都在选择自己的路径。
      </p>

      <div class="end-divider" />

      <div class="end-credits">
        <p class="credit-line">The EV Crossroads — An Interactive Data Documentary</p>
        <p class="credit-line">Vue 3 + ECharts + D3.js | Data as of April 2026</p>
      </div>

      <div class="end-scroll-top" @click="window.scrollTo({ top: 0, behavior: 'smooth' })">
        &#8593; Back to the beginning
      </div>
    </div>
  </div>
</template>

<style scoped>
.end-sentinel {
  height: 100vh;
  pointer-events: none;
}

.end-cover {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 90;
  will-change: opacity;
}

.end-dark {
  position: absolute;
  inset: 0;
  background: #1a1918;
  z-index: 0;
}

.end-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 640px;
  padding: var(--space-10) var(--space-6);
  will-change: transform;
}

.end-label {
  font-size: var(--font-size-caption);
  color: var(--color-coral);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-weight: 600;
  margin-bottom: var(--space-3);
}

.end-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: var(--space-8);
  letter-spacing: 0.02em;
}

.end-body {
  font-size: var(--font-size-body);
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.8;
  font-weight: 300;
  margin-bottom: var(--space-5);
}

.end-divider {
  width: 40px;
  height: 1px;
  background: var(--color-coral);
  margin: var(--space-8) auto;
}

.end-credits {
  margin-bottom: var(--space-8);
}

.credit-line {
  font-size: var(--font-size-caption);
  color: rgba(255, 255, 255, 0.25);
  margin: 4px 0;
}

.end-scroll-top {
  display: inline-block;
  font-size: var(--font-size-caption);
  color: var(--color-coral);
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  margin-top: var(--space-4);
}

.end-scroll-top:hover {
  opacity: 1;
}
</style>
