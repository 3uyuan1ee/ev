<script setup>
import { computed } from 'vue'
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import CollapsibleSection from '@/components/common/CollapsibleSection.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import BatteryPriceChart from '@/components/act2/BatteryPriceChart.vue'
import TcoDashboard from './TcoDashboard.vue'
import TcoControls from './TcoControls.vue'
import { useTcoControls } from '@/composables/act1/useTcoControls'
import { useTcoCalculator } from '@/composables/act1/useTcoCalculator'
import { useI18n } from '@/i18n/useI18n'
import { Zap, Calculator, Layers } from 'lucide-vue-next'

const { t } = useI18n()

const {
  controls,
  getVehicleConfig,
  getChargingStrategy,
  getSubsidy,
} = useTcoControls()

const {
  allSeries,
  breakevenYear,
  pt2LeadsFromStart,
  totalSavings,
  cheapestLabel,
  mostExpensiveLabel,
  breakevenPt1Label,
  breakevenPt2Label,
} = useTcoCalculator(
  controls,
  getVehicleConfig,
  getChargingStrategy,
  getSubsidy,
)

const powertrainLabels = computed(() =>
  controls.powertrains.map(pt => pt.toUpperCase())
)
</script>

<template>
  <div class="act1-section">
    <div class="section-inner">
      <!-- Insight Card (always visible) -->
      <InsightCard class="act1-insight" :citation="t('act1.insightCitation')">
        <template #icon><Zap :size="20" /></template>
        <template #title>{{ t('act1.insightTitle') }}</template>
        <span v-html="t('act1.insightBody')" />
      </InsightCard>

      <!-- Battery Price Chart (always visible - the signature chart) -->
      <div class="chart-section">
        <div class="chart-title-row">
          <h2 class="chart-title">{{ t('act1.batteryChartTitle') }}</h2>
        </div>
        <p class="chart-desc">{{ t('act1.batteryChartDesc') }}</p>
        <ChartContainer :min-height="400">
          <template #default>
            <BatteryPriceChart />
          </template>
        </ChartContainer>
      </div>

      <!-- Bridge paragraph to Chapter 2 -->
      <NarrativeSection class="act1-bridge">
        <p v-html="t('act1.narrativeP1')" />
        <p v-html="t('act1.bridgeP')" />
      </NarrativeSection>

      <!-- Fold 1: TCO Calculator (default OPEN) -->
      <CollapsibleSection
        :title="t('collapsible.chapter1Fold1Title')"
        :default-open="false"
        class="fold-tco"
      >
        <template #summary>{{ t('collapsible.chapter1Fold1Summary') }}</template>
        <template #icon><Calculator :size="18" /></template>

        <NarrativeSection>
          <p v-html="t('act1.narrativeP2')" />
        </NarrativeSection>

        <div class="section-header-row">
          <DataSourceBadge source-key="dataSource.act1" />
        </div>
        <div class="tco-layout">
          <aside class="tco-controls-panel">
            <TcoControls :controls="controls" />
          </aside>
          <main class="tco-chart-panel">
            <TcoDashboard
              :all-series="allSeries"
              :breakeven-year="breakevenYear"
              :pt2-leads-from-start="pt2LeadsFromStart"
              :total-savings="totalSavings"
              :powertrain-labels="powertrainLabels"
              :cheapest-label="cheapestLabel"
              :most-expensive-label="mostExpensiveLabel"
              :breakeven-pt1-label="breakevenPt1Label"
              :breakeven-pt2-label="breakevenPt2Label"
            />
          </main>
        </div>
      </CollapsibleSection>
    </div>
  </div>
</template>

<style scoped>
.act1-section {
  padding: var(--space-6) 0;
}

.act1-insight {
  margin-bottom: var(--space-5);
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

.act1-bridge {
  margin-bottom: var(--space-6);
}

.fold-tco,
.fold-class {
  margin-bottom: var(--space-5);
}

.section-header-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-3);
}

.tco-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .tco-layout {
    grid-template-columns: 280px 1fr;
  }
}

@media (min-width: 1400px) {
  .tco-layout {
    grid-template-columns: 320px 1fr;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tco-layout {
    grid-template-columns: 1fr;
  }

  .tco-controls-panel {
    order: -1;
  }
}
</style>
