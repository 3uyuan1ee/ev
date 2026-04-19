import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

/**
 * Scroll animation composable — triggers CSS animation when element enters viewport
 * @param {Object} options
 * @param {number} options.threshold - Intersection ratio (default: 0.1)
 * @param {boolean} options.once - Trigger only once (default: true)
 */
export function useScrollAnimation(options = {}) {
  const { threshold = 0.1, once = true } = options

  function createAnimation() {
    const target = ref(null)
    const isVisible = ref(false)

    const { stop } = useIntersectionObserver(
      target,
      ([{ isIntersecting }]) => {
        if (isIntersecting) {
          isVisible.value = true
          if (once) stop()
        } else if (!once) {
          isVisible.value = false
        }
      },
      { threshold }
    )

    return { target, isVisible }
  }

  return { createAnimation }
}
