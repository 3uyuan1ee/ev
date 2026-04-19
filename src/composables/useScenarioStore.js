import { reactive, computed } from 'vue'

const state = reactive({
  scenarios: [],
  maxScenarios: 4,
  isOpen: false
})

let nextId = 1

export function useScenarioStore() {
  const scenarioCount = computed(() => state.scenarios.length)
  const canAdd = computed(() => state.scenarios.length < state.maxScenarios)

  function addScenario(scenario) {
    if (!canAdd.value) return false
    state.scenarios.push({
      id: nextId++,
      timestamp: Date.now(),
      ...scenario
    })
    return true
  }

  function removeScenario(id) {
    const idx = state.scenarios.findIndex(s => s.id === id)
    if (idx !== -1) {
      state.scenarios.splice(idx, 1)
    }
  }

  function clearAll() {
    state.scenarios.splice(0, state.scenarios.length)
  }

  function toggleBoard() {
    state.isOpen = !state.isOpen
  }

  function openBoard() {
    state.isOpen = true
  }

  function closeBoard() {
    state.isOpen = false
  }

  return {
    state,
    scenarioCount,
    canAdd,
    addScenario,
    removeScenario,
    clearAll,
    toggleBoard,
    openBoard,
    closeBoard
  }
}
