<script setup>
import { computed } from 'vue'
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import TcoDashboard from './TcoDashboard.vue'
import TcoControls from './TcoControls.vue'
import { useTcoControls } from '@/composables/act1/useTcoControls'
import { useTcoCalculator } from '@/composables/act1/useTcoCalculator'
import { useI18n } from '@/i18n/useI18n'
import { Zap } from 'lucide-vue-next'

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
      <!-- Insight Card -->
      <InsightCard class="act1-insight" pdf-url="/woody-2026.pdf">
        <template #icon><Zap :size="20" /></template>
        <template #title>{{ t('act1.insightTitle') }}</template>
        <span v-html="t('act1.insightBody')" />
      </InsightCard>

      <!-- Narrative -->
      <NarrativeSection class="act1-narrative">
        <p v-html="t('act1.narrativeP1')" />
        <p v-html="t('act1.narrativeP2')" />
      </NarrativeSection>

      <!-- TCO Calculator -->
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

.act1-narrative {
  margin-bottom: var(--space-6);
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

/* On tablet, controls collapse to top horizontal bar */
@media (min-width: 768px) and (max-width: 1023px) {
  .tco-layout {
    grid-template-columns: 1fr;
  }

  .tco-controls-panel {
    order: -1;
  }
}
</style>
