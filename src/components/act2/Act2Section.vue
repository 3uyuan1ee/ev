<script setup>
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import BatteryPriceChart from './BatteryPriceChart.vue'
import ChinaMarketStreamgraph from './ChinaMarketStreamgraph.vue'
import BrandBubbleChart from './BrandBubbleChart.vue'
import { TrendingDown, Zap } from 'lucide-vue-next'
import { useI18n } from '@/i18n/useI18n'

const { t } = useI18n()
</script>

<template>
  <div class="act2-section">
    <div class="section-inner">
      <!-- Insight -->
      <InsightCard>
        <template #icon><TrendingDown :size="20" /></template>
        <template #title>{{ t('act2.insightTitle') }}</template>
        <span v-html="t('act2.insightBody')" />
      </InsightCard>

      <!-- Narrative -->
      <NarrativeSection>
        <p v-html="t('act2.narrativeP1')" />
        <p v-html="t('act2.narrativeP2')" />
        <p v-html="t('act2.narrativeP3')" />
      </NarrativeSection>

      <!-- Battery Price Chart -->
      <div class="chart-section">
        <div class="chart-title-row">
          <h2 class="chart-title">{{ t('act2.batteryChartTitle') }}</h2>
          <DataSourceBadge source-key="dataSource.act2" />
        </div>
        <p class="chart-desc">{{ t('act2.batteryChartDesc') }}</p>
        <ChartContainer :min-height="380">
          <template #default>
            <BatteryPriceChart />
          </template>
        </ChartContainer>
      </div>

      <!-- Two-column: Streamgraph + Bubble -->
      <div class="two-column">
        <div class="chart-section">
          <h2 class="chart-title">{{ t('act2.chinaChartTitle') }}</h2>
          <p class="chart-desc">{{ t('act2.chinaChartDesc') }}</p>
          <ChartContainer :min-height="420">
            <template #default>
              <ChinaMarketStreamgraph />
            </template>
          </ChartContainer>
        </div>

        <div class="chart-section">
          <h2 class="chart-title">{{ t('act2.brandChartTitle') }}</h2>
          <p class="chart-desc">{{ t('act2.brandChartDesc') }}</p>
          <ChartContainer :min-height="350">
            <template #default>
              <BrandBubbleChart />
            </template>
          </ChartContainer>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.act2-section {
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
