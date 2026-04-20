<script setup>
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import CarbonRacePanel from './CarbonRacePanel.vue'
import GridCleanlinessChart from './GridCleanlinessChart.vue'
import EmissionReductionChart from './EmissionReductionChart.vue'
import { Leaf, Zap } from 'lucide-vue-next'
import { useI18n } from '@/i18n/useI18n'

const { t } = useI18n()
</script>

<template>
  <div class="act4-section">
    <div class="section-inner">
      <!-- Insight -->
      <InsightCard>
        <template #icon><Leaf :size="20" /></template>
        <template #title>{{ t('act4.insightTitle') }}</template>
        <span v-html="t('act4.insightBody')"></span>
      </InsightCard>

      <!-- Narrative -->
      <NarrativeSection>
        <p v-html="t('act4.narrativeP1')"></p>
        <p v-html="t('act4.narrativeP2')"></p>
      </NarrativeSection>

      <!-- Carbon Race -->
      <div class="chart-section">
        <div class="chart-title-row">
          <h2 class="chart-title">{{ t('act4.carbonRaceTitle') }}</h2>
          <DataSourceBadge source-key="dataSource.act4" />
        </div>
        <p class="chart-desc">{{ t('act4.carbonRaceDesc') }}</p>
        <ChartContainer :min-height="400">
          <template #default>
            <CarbonRacePanel />
          </template>
        </ChartContainer>
      </div>

      <!-- Two-column: Grid + Emission Reduction -->
      <div class="two-column">
        <div class="chart-section">
          <h2 class="chart-title">
            <Zap :size="18" style="vertical-align: middle; margin-right: 4px;" />
            {{ t('act4.gridChartTitle') }}
          </h2>
          <p class="chart-desc">{{ t('act4.gridChartDesc') }}</p>
          <ChartContainer :min-height="380">
            <template #default>
              <GridCleanlinessChart />
            </template>
          </ChartContainer>
        </div>

        <div class="chart-section">
          <h2 class="chart-title">{{ t('act4.emissionChartTitle') }}</h2>
          <p class="chart-desc">{{ t('act4.emissionChartDesc') }}</p>
          <ChartContainer :min-height="380">
            <template #default>
              <EmissionReductionChart />
            </template>
          </ChartContainer>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.act4-section {
  padding: var(--space-6) 0;
}

.chart-section {
  margin-bottom: var(--space-6);
}

.chart-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.chart-title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
  display: flex;
  align-items: center;
}

.chart-desc {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.two-column {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .two-column {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
