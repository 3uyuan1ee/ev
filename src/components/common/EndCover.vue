<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/i18n/useI18n'

const { t } = useI18n()
const sentinelRef = ref(null)
const progress = ref(0)

function onScroll() {
  if (!sentinelRef.value) return
  const rect = sentinelRef.value.getBoundingClientRect()
  const vh = window.innerHeight
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
      <div class="end-label">{{ t('app.endLabel') }}</div>
      <h2 class="end-title">{{ t('app.endTitle') }}</h2>
      <p class="end-body">{{ t('app.endBody1') }}</p>
      <p class="end-body">{{ t('app.endBody2') }}</p>

      <div class="end-divider" />

      <div class="research-section">
        <h3 class="research-heading">{{ t('app.endResearchTitle') }}</h3>
        <p class="research-text">{{ t('app.endResearchQuestion') }}</p>
        <p class="research-text">{{ t('app.endResearchDesign') }}</p>
        <p class="research-text research-sources">{{ t('app.endResearchSources') }}</p>
      </div>

      <div class="end-divider" />

      <a
        class="end-github"
        href="https://github.com/3uyuan1ee"
        target="_blank"
        rel="noopener"
      >
        @3uyuan1ee
      </a>
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

/* Research section */
.research-section {
  text-align: left;
  margin-bottom: var(--space-4);
}

.research-heading {
  font-size: var(--font-size-caption);
  color: var(--color-coral);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 600;
  margin-bottom: var(--space-4);
}

.research-text {
  font-size: var(--font-size-small);
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.7;
  margin-bottom: var(--space-3);
}

.research-sources {
  font-size: var(--font-size-caption);
  color: rgba(255, 255, 255, 0.35);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--space-3);
}

/* GitHub link */
.end-github {
  display: inline-block;
  font-size: var(--font-size-caption);
  color: var(--color-coral);
  cursor: pointer;
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  letter-spacing: 0.05em;
}

.end-github:hover {
  opacity: 1;
}
</style>
