<script setup>
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import CollapsibleSection from '@/components/common/CollapsibleSection.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import EvGrowthAreaChart from './EvGrowthAreaChart.vue'
import EvAdoptionRace from './EvAdoptionRace.vue'
import ChargingInfraChart from '@/components/act3/ChargingInfraChart.vue'
import { TrendingDown, Flag, Plug } from 'lucide-vue-next'
import { useI18n } from '@/i18n/useI18n'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'

const { t } = useI18n()
</script>

<template>
  <div class="act2-section">
    <div class="section-inner">
      <!-- Insight Card (always visible) -->
      <InsightCard class="act2-insight" :citation="t('act2.insightCitation')">
        <template #icon><TrendingDown :size="20" /></template>
        <template #title>{{ t('act2.insightTitle') }}</template>
        <span v-html="t('act2.insightBody')" />
      </InsightCard>

      <!-- EV Growth by Region (always visible - the signature chart) -->
      <div class="chart-section">
        <div class="chart-title-row">
          <h2 class="chart-title">{{ t('act2.evGrowthChartTitle') }}</h2>
          <DataSourceBadge source-key="dataSource.act2" />
        </div>
        <p class="chart-desc">{{ t('act2.evGrowthChartDesc') }}</p>
        <ChartContainer :min-height="400">
          <template #default>
            <EvGrowthAreaChart />
          </template>
        </ChartContainer>
      </div>

      <!-- Bridge paragraph to Chapter 3 -->
      <NarrativeSection class="act2-bridge">
        <p v-html="t('act2.narrativeP1')" />
        <p v-html="t('act2.bridgeP')" />
      </NarrativeSection>

      <!-- Fold 1: EV Adoption Race -->
      <CollapsibleSection
        :title="t('collapsible.chapter2Fold1Title')"
        :default-open="false"
        class="fold-race"
      >
        <template #summary>{{ t('collapsible.chapter2Fold1Summary') }}</template>
        <template #icon><Flag :size="18" /></template>

        <NarrativeSection>
          <p v-html="t('act2.narrativeP2')" />
        </NarrativeSection>

        <div class="chart-section">
          <h2 class="chart-title">{{ t('act2.raceChartTitle') }}</h2>
          <p class="chart-desc">{{ t('act2.raceChartDesc') }}</p>
          <ChartContainer :min-height="420">
            <template #default>
              <EvAdoptionRace />
            </template>
          </ChartContainer>
        </div>
      </CollapsibleSection>

      <!-- Fold 2: Charging infrastructure (default CLOSED) -->
      <CollapsibleSection
        :title="t('collapsible.chapter2Fold2Title')"
        :default-open="false"
        class="fold-charging"
      >
        <template #summary>{{ t('collapsible.chapter2Fold2Summary') }}</template>
        <template #icon><Plug :size="18" /></template>

        <div class="chart-section">
          <h2 class="chart-title">{{ t('chart.chargingInfraTitle') }}</h2>
          <p class="chart-desc">{{ t('chart.chargingInfraDesc') }}</p>
          <ChartContainer :min-height="380">
            <template #default>
              <ChargingInfraChart />
            </template>
          </ChartContainer>
        </div>
      </CollapsibleSection>
    </div>
  </div>
</template>

<style scoped>
.act2-section {
  padding: var(--space-6) 0;
}

.act2-insight {
  margin-bottom: var(--space-5);
}

.chart-section {
  margin-bottom: var(--space-5);
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

.act2-bridge {
  margin-bottom: var(--space-6);
}

.fold-race,
.fold-charging,
.fold-world {
  margin-bottom: var(--space-5);
}

.two-column {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

.chart-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-text-secondary);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.fold-note {
  padding: var(--space-4);
  color: var(--color-text-secondary);
  text-align: center;
}

@media (min-width: 1024px) {
  .two-column {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
