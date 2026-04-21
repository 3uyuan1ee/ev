<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/i18n/useI18n'
import SurveyWidget from '@/components/survey/SurveyWidget.vue'

const { t } = useI18n()
const sentinelRef = ref(null)
const progress = ref(0)
const showModal = ref(false)
const showDevModal = ref(false)

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
      <div class="end-label">Epilogue</div>

      <div class="end-links">
        <button class="end-link" @click="showModal = true">{{ t('app.endResearchTitle') }}</button>
        <span class="end-separator">·</span>
        <button class="end-link" @click="showDevModal = true">{{ t('app.endDevTitle') }}</button>
      </div>

      <!-- Survey Widget -->
      <div class="end-survey">
        <SurveyWidget />
      </div>
    </div>
  </div>

  <!-- Research Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-panel">
          <button class="modal-close" @click="showModal = false">&times;</button>

          <h2 class="modal-title">{{ t('app.endResearchTitle') }}</h2>

          <div class="modal-block">
            <h3 class="modal-subtitle">Research Question</h3>
            <p class="modal-text">{{ t('app.endResearchQuestion') }}</p>
          </div>

          <div class="modal-block">
            <h3 class="modal-subtitle">Design Decisions</h3>
            <p class="modal-text">{{ t('app.endResearchDesign') }}</p>
          </div>

          <div class="modal-block">
            <h3 class="modal-subtitle">Data Sources</h3>
            <div class="modal-text modal-sources">
              <template v-for="(line, idx) in t('app.endResearchSources').split('||')" :key="idx">
                <p v-if="line.startsWith('[')" class="source-ref">{{ line }}</p>
                <p v-else-if="line.trim()" class="source-dataset">{{ line }}</p>
              </template>
            </div>
          </div>

          <div class="modal-footer">
            <a class="end-github" href="https://github.com/3uyuan1ee" target="_blank" rel="noopener">@3uyuan1ee</a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Dev Notes Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showDevModal" class="modal-overlay" @click.self="showDevModal = false">
        <div class="modal-panel">
          <button class="modal-close" @click="showDevModal = false">&times;</button>

          <h2 class="modal-title">{{ t('app.endDevTitle') }}</h2>

          <div class="modal-block">
            <h3 class="modal-subtitle">{{ t('app.endDevOverview') }}</h3>
            <p class="modal-text">{{ t('app.endDevOverviewText') }}</p>
          </div>

          <div class="modal-block">
            <h3 class="modal-subtitle">{{ t('app.endDevTimeline') }}</h3>
            <div class="modal-text" v-html="t('app.endDevTimelineText')" />
          </div>

          <div class="modal-block">
            <h3 class="modal-subtitle">{{ t('app.endDevReflection') }}</h3>
            <p class="modal-text">{{ t('app.endDevReflectionText') }}</p>
          </div>

          <div class="modal-footer">
            <a class="end-github" href="https://github.com/3uyuan1ee" target="_blank" rel="noopener">@3uyuan1ee</a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.end-sentinel {
  height: 170vh;
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
  padding: var(--space-10) var(--space-6);
  will-change: transform;
}

.end-label {
  font-size: var(--font-size-caption);
  color: var(--color-coral);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-weight: 600;
  margin-bottom: var(--space-6);
}

.end-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
}

.end-link {
  font-size: var(--font-size-small);
  color: rgba(255, 255, 255, 0.5);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease;
  padding: 0;
}

.end-link:hover {
  color: var(--color-coral);
}

.end-separator {
  color: rgba(255, 255, 255, 0.2);
}

.end-github {
  font-size: var(--font-size-caption);
  color: var(--color-coral);
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.end-github:hover {
  opacity: 1;
}

.end-survey {
  margin-top: var(--space-8);
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--space-6);
  backdrop-filter: blur(4px);
}

.modal-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: var(--space-8) var(--space-6);
  position: relative;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
}

.modal-close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-4);
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-6);
}

.modal-block {
  margin-bottom: var(--space-5);
}

.modal-subtitle {
  font-size: var(--font-size-caption);
  color: var(--color-info);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.modal-text {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.modal-sources {
  font-size: var(--font-size-caption);
  color: var(--color-text-tertiary);
}

.source-dataset {
  margin-bottom: var(--space-1);
  line-height: 1.5;
}

.source-dataset:first-child {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-top: 0;
  margin-bottom: var(--space-2);
}

.source-ref {
  margin-bottom: var(--space-1);
  line-height: 1.5;
}

.source-ref:first-of-type {
  margin-top: var(--space-3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.modal-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  text-align: right;
}

/* Modal transition */
.modal-enter-active {
  transition: opacity 0.25s ease;
}

.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
