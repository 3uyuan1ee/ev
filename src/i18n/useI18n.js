import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import zh from './locales/zh.json'
import en from './locales/en.json'

const messages = { zh, en }

// Module-level singleton (same pattern as useTheme.js)
const locale = useStorage('ev-doc-locale', 'zh')

function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

export function useI18n() {
  /**
   * Translate a key, with optional {param} interpolation.
   * Fallback chain: current locale -> zh -> key string itself.
   */
  function t(key, params = {}) {
    let text = resolve(messages[locale.value], key)
      ?? resolve(messages['zh'], key)
      ?? key
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    })
    return text
  }

  const toggleLocale = () => {
    locale.value = locale.value === 'zh' ? 'en' : 'zh'
  }

  const isZh = computed(() => locale.value === 'zh')

  return { locale, isZh, t, toggleLocale }
}
