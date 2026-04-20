<script setup>
import { computed, ref, watch } from 'vue'
import StackedAreaChart from '@/components/charts/StackedAreaChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import { useI18n } from '@/i18n/useI18n'

const { t } = useI18n()

const props = defineProps({
  allSeries: { type: Array, required: true },
  breakevenYear: { type: Number, default: null },
  pt2LeadsFromStart: { type: Boolean, default: false },
  totalSavings: { type: Number, default: 0 },
  powertrainLabels: { type: Array, default: () => ['ICEV', 'BEV'] },
  cheapestLabel: { type: String, default: '' },
  mostExpensiveLabel: { type: String, default: '' },
  breakevenPt1Label: { type: String, default: '' },
  breakevenPt2Label: { type: String, default: '' },
})

const selectedYear = ref(7)

// Sync selectedYear with ownership period changes
watch(() => props.allSeries[0]?.data?.yearlyData?.length, (len, oldLen) => {
  if (!len) return
  const maxYear = len - 1
  // If data grew (user increased ownership years), auto-select the new max
  if (oldLen && len > oldLen) {
    selectedYear.value = maxYear
  }
  // If data shrank (user decreased ownership years), clamp to new max
  if (selectedYear.value >= len) {
    selectedYear.value = maxYear
  }
})

const savingsColor = computed(() => props.totalSavings > 0 ? 'var(--color-ev)' : 'var(--color-danger)')
</script>

<template>
  <div class="tco-dashboard">
    <!-- Summary stats -->
    <div class="tco-summary">
      <div v-if="breakevenYear !== null" class="summary-stat breakeven">
        <span class="stat-label">{{ t('chart.breakevenPoint') }}</span>
        <span class="stat-value" :style="{ color: 'var(--color-accent)' }">
          {{ t('chart.breakevenYearFormat', { year: breakevenYear.toFixed(1) }) }}
        </span>
        <span class="stat-detail">{{ t('chart.breakevenDetail', { pt2Label: breakevenPt2Label, pt1Label: breakevenPt1Label }) }}</span>
      </div>
      <div v-else-if="pt2LeadsFromStart" class="summary-stat no-breakeven">
        <span class="stat-label">{{ t('chart.breakevenNA') }}</span>
        <span class="stat-value" :style="{ color: 'var(--color-success)' }">&#10003;</span>
        <span class="stat-detail">{{ t('chart.breakevenCheaperFromStart', { label: breakevenPt1Label }) }}</span>
      </div>
      <div v-else class="summary-stat no-breakeven">
        <span class="stat-label">{{ t('chart.breakevenNA') }}</span>
        <span class="stat-value" style="color: var(--color-text-tertiary)">N/A</span>
        <span class="stat-detail">{{ t('chart.breakevenNADetail') }}</span>
      </div>

      <div class="summary-stat savings">
        <span class="stat-label">{{ t('chart.totalSavings') }}</span>
        <span class="stat-value" :style="{ color: savingsColor }">
          {{ totalSavings > 0 ? '+' : '' }}${{ Math.abs(Math.round(totalSavings)).toLocaleString() }}
        </span>
        <span class="stat-detail">
          {{ t('chart.savingsDetailMulti', { cheapest: cheapestLabel, mostExpensive: mostExpensiveLabel }) }}
        </span>
      </div>
    </div>

    <!-- Main chart: stacked area with N powertrain lines -->
    <div class="tco-main-chart">
      <ChartContainer :min-height="400">
        <template #default="{ width }">
          <StackedAreaChart
            :all-series="allSeries"
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
        <h3 class="donut-title">{{ t('chart.costComposition') }}</h3>
      </div>
      <ChartContainer :min-height="320">
        <template #default="{ width }">
          <DonutChart
            :all-series="allSeries"
            :powertrain-labels="powertrainLabels"
            :selected-year="selectedYear"
            :height="width < 480 ? '280px' : '350px'"
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

  .tco-donut {
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
</style>
