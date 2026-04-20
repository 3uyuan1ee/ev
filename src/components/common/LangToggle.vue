<script setup>
import { useI18n } from '@/i18n/useI18n'
import { Languages } from 'lucide-vue-next'

const { isZh, toggleLocale } = useI18n()
</script>

<template>
  <button
    class="lang-toggle"
    :aria-label="isZh ? 'Switch to English' : '切换到中文'"
    @click="toggleLocale()"
  >
    <Languages :size="18" />
    <span class="lang-label">{{ isZh ? 'EN' : '中' }}</span>
  </button>
</template>

<style scoped>
.lang-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  transition: all var(--duration-micro) ease-out;
  cursor: pointer;
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
}

.lang-toggle:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-secondary);
}
</style>
