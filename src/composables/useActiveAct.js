import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Active Act tracker — detects which act section is currently in viewport
 * Uses IntersectionObserver for performance
 * @param {Object} options
 * @param {number} options.actCount - Number of acts (default: 4)
 * @param {number} options.threshold - Intersection ratio threshold (default: 0.3)
 */
export function useActiveAct(options = {}) {
  const { actCount = 4, threshold = 0.3 } = options
  const activeAct = ref(1)
  const actRefs = ref([])
  let observer = null

  function setRef(index) {
    return (el) => {
      if (el) actRefs.value[index] = el
    }
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = actRefs.value.indexOf(entry.target)
            if (index !== -1) {
              activeAct.value = index + 1
            }
          }
        }
      },
      { threshold }
    )

    actRefs.value.forEach((el) => {
      if (el) observer.observe(el)
    })
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  function scrollToAct(actNumber) {
    const el = actRefs.value[actNumber - 1]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return {
    activeAct,
    setRef,
    scrollToAct,
  }
}
