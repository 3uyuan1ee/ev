import { useDark, useToggle } from '@vueuse/core'

/**
 * Theme composable — manages dark/light mode
 * Uses VueUse's useDark which persists to localStorage
 * Toggles data-theme attribute on <html> element
 */
export function useTheme() {
  const isDark = useDark({
    selector: 'html',
    attribute: 'data-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'ev-doc-theme',
  })

  const toggleTheme = useToggle(isDark)

  return {
    isDark,
    toggleTheme,
  }
}
