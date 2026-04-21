<script setup>
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import CollapsibleSection from '@/components/common/CollapsibleSection.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import CarbonRacePanel from './CarbonRacePanel.vue'
import GridCleanlinessChart from './GridCleanlinessChart.vue'
import EmissionReductionChart from './EmissionReductionChart.vue'
import EnergyTransitionChart from './EnergyTransitionChart.vue'
import { Leaf, Zap, History, AlertTriangle } from 'lucide-vue-next'
import { useI18n } from '@/i18n/useI18n'

const { t } = useI18n()
</script>

<template>
  <div class="act4-section">
    <div class="section-inner">
      <!-- Insight Card (always visible) -->
      <InsightCard :citation="t('act4.insightCitation')">
        <template #icon><Leaf :size="20" /></template>
        <template #title>{{ t('act4.insightTitle') }}</template>
        <span v-html="t('act4.insightBody')" />
      </InsightCard>

      <!-- Carbon Race (always visible - the signature chart) -->
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

      <!-- Bridge: concluding paragraph -->
      <NarrativeSection class="act4-bridge">
        <p v-html="t('act4.narrativeP1')" />
        <p v-html="t('act4.narrativeP2')" />
        <p v-html="t('act4.bridgeP')" />
      </NarrativeSection>

      <!-- Fold 1: Grid cleanliness (default OPEN) -->
      <CollapsibleSection
        :title="t('collapsible.chapter4Fold1Title')"
        :default-open="true"
        class="fold-grid"
      >
        <template #summary>{{ t('collapsible.chapter4Fold1Summary') }}</template>
        <template #icon><Zap :size="18" /></template>

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
      </CollapsibleSection>

      <!-- Fold 2: Energy transition (default CLOSED) -->
      <CollapsibleSection
        :title="t('collapsible.chapter4Fold2Title')"
        :default-open="false"
        class="fold-energy"
      >
        <template #summary>{{ t('collapsible.chapter4Fold2Summary') }}</template>
        <template #icon><History :size="18" /></template>

        <div class="chart-section">
          <h2 class="chart-title">{{ t('act4.energyTransitionChartTitle') }}</h2>
          <p class="chart-desc">{{ t('act4.energyTransitionChartDesc') }}</p>
          <ChartContainer :min-height="380">
            <template #default>
              <EnergyTransitionChart />
            </template>
          </ChartContainer>
        </div>
      </CollapsibleSection>

      <!-- Fold 3: Embodied emissions challenge (default CLOSED) -->
      <CollapsibleSection
        :title="t('collapsible.chapter4Fold3Title')"
        :default-open="false"
        class="fold-embodied"
      >
        <template #summary>{{ t('collapsible.chapter4Fold3Summary') }}</template>
        <template #icon><AlertTriangle :size="18" /></template>

        <div class="embodied-content">
          <DataSourceBadge source-key="dataSource.act4" />
          <div class="embodied-notes">
            <h4>{{ t('act4.embodiedTitle') }}</h4>
            <p>{{ t('act4.embodiedIntro') }}</p>
            <ul>
              <li v-for="item in t('act4.embodiedFindings').split('|')" :key="item">{{ item }}</li>
            </ul>
            <p class="source-note">{{ t('act4.embodiedSource') }}</p>
          </div>
        </div>
      </CollapsibleSection>
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

.act4-bridge {
  margin-bottom: var(--space-6);
}

.fold-grid,
.fold-energy,
.fold-embodied {
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

.embodied-content {
  padding: var(--space-4);
}

.embodied-notes h4 {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: var(--space-3) 0 var(--space-2);
}

.embodied-notes p {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-2);
}

.embodied-notes ul {
  padding-left: var(--space-5);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.7;
}

.embodied-notes li {
  margin-bottom: var(--space-1);
}

.source-note {
  margin-top: var(--space-3);
  font-style: italic;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

@media (min-width: 1024px) {
  .two-column {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
