<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/i18n/useI18n'

const props = defineProps({
  /** i18n key prefix, e.g. 'dataSource.act1' */
  sourceKey: { type: String, required: true },
})

const { t } = useI18n()
const isOpen = ref(false)

const sourceTitle = computed(() => t(`${props.sourceKey}.title`))
const sourceList = computed(() => {
  const raw = t(`${props.sourceKey}.sources`)
  if (!raw || raw === `${props.sourceKey}.sources`) return []
  return raw.split('||')
})
const methodology = computed(() => t(`${props.sourceKey}.methodology`))
const limitations = computed(() => {
  const raw = t(`${props.sourceKey}.limitations`)
  if (!raw || raw === `${props.sourceKey}.limitations`) return ''
  return raw
})

function toggle() {
  isOpen.value = !isOpen.value
}
function close() {
  isOpen.value = false
}
</script>

<template>
  <span class="ds-badge" @click.stop="toggle" :title="sourceTitle">
    <span class="ds-badge-icon">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM8 3.5c.69 0 1.25.56 1.25 1.25v3.5a1.25 1.25 0 01-2.5 0v-3.5C6.75 4.06 7.31 3.5 8 3.5z"/>
      </svg>
    </span>
    <span class="ds-badge-label">{{ t('dataSource.label') }}</span>

    <Teleport to="body">
      <Transition name="ds-fade">
        <div v-if="isOpen" class="ds-overlay" @click.self="close">
          <div class="ds-popup">
            <div class="ds-popup-header">
              <h4 class="ds-popup-title">{{ sourceTitle }}</h4>
              <button class="ds-popup-close" @click="close" aria-label="Close">&times;</button>
            </div>
            <div class="ds-popup-body">
              <div class="ds-section">
                <h5>{{ t('dataSource.sourcesLabel') }}</h5>
                <ul>
                  <li v-for="(src, idx) in sourceList" :key="idx">{{ src }}</li>
                </ul>
              </div>
              <div v-if="methodology && methodology !== `${sourceKey}.methodology`" class="ds-section">
                <h5>{{ t('dataSource.methodologyLabel') }}</h5>
                <p>{{ methodology }}</p>
              </div>
              <div v-if="limitations" class="ds-section">
                <h5>{{ t('dataSource.limitationsLabel') }}</h5>
                <p>{{ limitations }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<style scoped>
.ds-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(142, 141, 186, 0.12);
  color: var(--color-mauve);
  font-size: var(--font-size-micro);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  user-select: none;
  transition: background var(--duration-micro) ease-out;
  vertical-align: middle;
  line-height: 1.4;
}

.ds-badge:hover {
  background: rgba(142, 141, 186, 0.22);
}

.ds-badge-icon {
  display: flex;
  align-items: center;
  line-height: 1;
}

.ds-badge-label {
  letter-spacing: 0.02em;
}

.ds-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.ds-popup {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card-hover);
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.ds-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.ds-popup-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.ds-popup-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0 var(--space-1);
  line-height: 1;
}

.ds-popup-close:hover {
  color: var(--color-text-primary);
}

.ds-popup-body {
  padding: var(--space-5);
}

.ds-section {
  margin-bottom: var(--space-4);
}

.ds-section:last-child {
  margin-bottom: 0;
}

.ds-section h5 {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-mauve);
  margin: 0 0 var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ds-section ul {
  margin: 0;
  padding-left: var(--space-4);
}

.ds-section li {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: var(--line-height-small);
  margin-bottom: var(--space-1);
}

.ds-section p {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: var(--line-height-small);
  margin: 0;
}

/* Transition */
.ds-fade-enter-active,
.ds-fade-leave-active {
  transition: opacity var(--duration-data) ease-out;
}

.ds-fade-enter-from,
.ds-fade-leave-to {
  opacity: 0;
}

/* Dark mode */
[data-theme="dark"] .ds-badge {
  background: rgba(168, 167, 208, 0.15);
  color: #A8A7D0;
}

[data-theme="dark"] .ds-badge:hover {
  background: rgba(168, 167, 208, 0.25);
}

[data-theme="dark"] .ds-popup {
  background: #2A2830;
  border-color: #4A4550;
}

[data-theme="dark"] .ds-popup-header {
  border-color: #4A4550;
}

[data-theme="dark"] .ds-popup-title {
  color: #EAE7DC;
}

[data-theme="dark"] .ds-section li,
[data-theme="dark"] .ds-section p {
  color: #B0A8A0;
}
</style>
