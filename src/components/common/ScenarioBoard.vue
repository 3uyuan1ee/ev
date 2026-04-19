<script setup>
import { computed } from 'vue'
import { useScenarioStore } from '@/composables/useScenarioStore'
import { X, Trash2, ChevronRight, ChevronLeft } from 'lucide-vue-next'

const { state, scenarioCount, canAdd, removeScenario, clearAll, closeBoard } = useScenarioStore()

const formattedTime = (ts) => {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// Group scenario params for display
function formatParams(scenario) {
  const parts = []
  if (scenario.act === 1) {
    parts.push(`${scenario.vehicleType || ''} / ${scenario.city || ''}`)
    parts.push(`Mileage: ${(scenario.annualMileage || 0).toLocaleString()} mi`)
  } else if (scenario.act === 3) {
    if (scenario.params) {
      Object.entries(scenario.params).forEach(([k, v]) => {
        parts.push(`${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
      })
    }
  } else if (scenario.act === 4) {
    parts.push(`${scenario.vehicle || ''} / ${scenario.grid || ''}`)
    parts.push(`Crossover: ${scenario.crossoverYear || 'N/A'}`)
  }
  return parts
}
</script>

<template>
  <Transition name="slide">
    <aside v-if="state.isOpen" class="scenario-board">
      <div class="board-header">
        <h3 class="board-title">Saved Scenarios</h3>
        <button class="close-btn" @click="closeBoard">
          <ChevronRight :size="18" />
        </button>
      </div>

      <div v-if="scenarioCount === 0" class="board-empty">
        <p>No scenarios saved yet.</p>
        <p class="text-caption">Use the "Save" button in any act to add scenarios for comparison.</p>
      </div>

      <div v-else class="board-list">
        <div
          v-for="scenario in state.scenarios"
          :key="scenario.id"
          class="scenario-card"
        >
          <div class="card-header">
            <span class="card-act-badge" :class="`act-${scenario.act}`">
              Act {{ scenario.act }}
            </span>
            <span class="card-time">{{ formattedTime(scenario.timestamp) }}</span>
            <button class="card-remove" @click="removeScenario(scenario.id)">
              <X :size="14" />
            </button>
          </div>
          <div class="card-label">{{ scenario.label || 'Unnamed Scenario' }}</div>
          <div class="card-params">
            <span v-for="(part, i) in formatParams(scenario)" :key="i" class="param-line">
              {{ part }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="scenarioCount > 0" class="board-footer">
        <button class="clear-btn" @click="clearAll">
          <Trash2 :size="14" />
          Clear All
        </button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.scenario-board {
  position: fixed;
  top: 60px;
  right: 0;
  width: 300px;
  height: calc(100vh - 60px);
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border);
  box-shadow: -4px 0 16px rgba(58, 54, 48, 0.1);
  z-index: var(--z-overlay, 100);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.board-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--color-bg-secondary);
}

.board-empty {
  padding: var(--space-6) var(--space-4);
  text-align: center;
  color: var(--color-text-secondary);
}

.board-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.scenario-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.card-act-badge {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-bold);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  color: white;
}

.card-act-badge.act-1 { background: var(--color-act1); }
.card-act-badge.act-2 { background: var(--color-act2); }
.card-act-badge.act-3 { background: var(--color-act3); }
.card-act-badge.act-4 { background: var(--color-act4); }

.card-time {
  font-size: var(--font-size-caption);
  color: var(--color-text-tertiary);
  flex: 1;
}

.card-remove {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.card-remove:hover {
  background: rgba(232, 90, 79, 0.1);
  color: var(--color-error);
}

.card-label {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.card-params {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.param-line {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
}

.board-footer {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: all 0.15s;
}

.clear-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

/* Transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

@media (max-width: 768px) {
  .scenario-board {
    width: 100%;
  }
}
</style>
