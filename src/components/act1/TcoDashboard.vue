<script setup>
import { computed, ref } from 'vue'
import StackedAreaChart from '@/components/charts/StackedAreaChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import { Zap, Fuel } from 'lucide-vue-next'

const props = defineProps({
  series1: { type: Object, required: true },
  series2: { type: Object, required: true },
  breakevenYear: { type: Number, default: null },
  totalSavings: { type: Number, default: 0 },
  powertrainLabels: { type: Array, default: () => ['ICEV', 'BEV'] },
})

const selectedYear = ref(7)

// Powertrain labels for display
const pt1Label = computed(() => props.powertrainLabels[0] || 'ICEV')
const pt2Label = computed(() => props.powertrainLabels[1] || 'BEV')

const savingsColor = computed(() => props.totalSavings > 0 ? 'var(--color-ev)' : 'var(--color-danger)')
</script>

<template>
  <div class="tco-dashboard">
    <!-- Summary stats -->
    <div class="tco-summary">
      <div v-if="breakevenYear !== null" class="summary-stat breakeven">
        <span class="stat-label">Breakeven Point</span>
        <span class="stat-value" :style="{ color: 'var(--color-accent)' }">
          Year {{ breakevenYear.toFixed(1) }}
        </span>
        <span class="stat-detail">BEV total cost catches up to ICEV</span>
      </div>
      <div v-else class="summary-stat no-breakeven">
        <span class="stat-label">Breakeven</span>
        <span class="stat-value" style="color: var(--color-text-tertiary)">N/A</span>
        <span class="stat-detail">No crossing within ownership period</span>
      </div>

      <div class="summary-stat savings">
        <span class="stat-label">Total Savings</span>
        <span class="stat-value" :style="{ color: savingsColor }">
          {{ totalSavings > 0 ? '+' : '' }}${{ Math.abs(Math.round(totalSavings)).toLocaleString() }}
        </span>
        <span class="stat-detail">
          {{ totalSavings > 0 ? pt2Label : pt1Label }} saves more over the ownership period
        </span>
      </div>
    </div>

    <!-- Main chart: stacked area -->
    <div class="tco-main-chart">
      <ChartContainer :min-height="400">
        <template #default="{ width }">
          <StackedAreaChart
            :series1="series1"
            :series2="series2"
            :powertrain-labels="powertrainLabels"
            :breakeven-year="breakevenYear"
            :selected-year="selectedYear"
            :height="width < 480 ? '350px' : '450px'"
            @year-click="selectedYear = $event"
          />
        </template>
      </ChartContainer>
    </div>

    <!-- Donut chart: cost composition -->
    <div class="tco-donut">
      <div class="donut-header">
        <h3 class="donut-title">Cost Composition</h3>
        <div class="donut-year-selector">
          <button
            v-for="y in [3, 5, 7, 10]"
            :key="y"
            class="year-btn"
            :class="{ active: selectedYear === y }"
            @click="selectedYear = y"
          >
            {{ y }}yr
          </button>
        </div>
      </div>
      <ChartContainer :min-height="260">
        <template #default>
          <DonutChart
            :series1="series1"
            :series2="series2"
            :powertrain-labels="powertrainLabels"
            :selected-year="selectedYear"
            height="260px"
          />
        </template>
      </ChartContainer>
    </div>
  </div>
</template>

<style scoped>
.tco-dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 768px) {
  .tco-dashboard {
    grid-template-columns: 1fr 1fr;
  }

  .tco-main-chart {
    grid-column: 1 / -1;
  }
}

.tco-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  grid-column: 1 / -1;
}

.summary-stat {
  padding: var(--space-4);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.stat-label {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
}

.stat-detail {
  font-size: var(--font-size-caption);
  color: var(--color-text-tertiary);
}

.donut-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.donut-title {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.donut-year-selector {
  display: flex;
  gap: var(--space-1);
}

.year-btn {
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-micro) ease-out;
}

.year-btn:hover {
  background: var(--color-bg-card);
  border-color: var(--color-border);
}

.year-btn.active {
  background: var(--color-info);
  color: var(--color-bg-primary);
  border-color: transparent;
}
</style>
