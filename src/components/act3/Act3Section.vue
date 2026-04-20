<script setup>
import { usePolicyTimeline } from '@/composables/act3/usePolicyTimeline'
import { useI18n } from '@/i18n/useI18n'
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import TimelinePlayer from '@/components/common/TimelinePlayer.vue'
import PolicyHeatmap from './PolicyHeatmap.vue'
import PolicyTimeline from './PolicyTimeline.vue'
import PolicySandbox from './PolicySandbox.vue'
import PolicySensitivityChart from './PolicySensitivityChart.vue'
import { Globe, FlaskConical } from 'lucide-vue-next'

const { t } = useI18n()

const {
  selectedYear, isPlaying, playSpeed, selectedCountry,
  minYear, maxYear, yearData, countryTimeline,
  togglePlayback, selectCountry
} = usePolicyTimeline()

function onSpeedChange(speed) {
  // Speed change handled via timeline composable
}

function onCountrySelect(country) {
  selectCountry(country)
}

function closeTimeline() {
  selectCountry(null) // toggle off
}
</script>

<template>
  <div class="act3-section">
    <div class="section-inner">
      <!-- Insight -->
      <InsightCard>
        <template #icon><Globe :size="20" /></template>
        <template #title>{{ t('act3.insightTitle') }}</template>
        <span v-html="t('act3.insightBody')" />
      </InsightCard>

      <!-- Narrative -->
      <NarrativeSection>
        <p v-html="t('act3.narrativeP1')" />
        <p v-html="t('act3.narrativeP2')" />
        <p v-html="t('act3.narrativeP3')" />
      </NarrativeSection>

      <!-- Global Ranking Heatmap with Timeline -->
      <div class="chart-section">
        <div class="chart-title-row">
          <h2 class="chart-title">{{ t('act3.heatmapChartTitle') }}</h2>
          <DataSourceBadge source-key="dataSource.act3" />
        </div>
        <p class="chart-desc">{{ t('act3.heatmapChartDesc') }}</p>

        <TimelinePlayer
          v-model="selectedYear"
          :min="minYear"
          :max="maxYear"
          :is-playing="isPlaying"
          :speed="playSpeed"
          label="Year"
          @play="togglePlayback"
          @pause="togglePlayback"
          @speed-change="onSpeedChange"
        />

        <ChartContainer :min-height="500">
          <template #default>
            <PolicyHeatmap
              :year-data="yearData"
              :selected-country="selectedCountry"
              @select-country="onCountrySelect"
            />
          </template>
        </ChartContainer>

        <!-- Country Drill-down -->
        <PolicyTimeline
          v-if="countryTimeline"
          :timeline="countryTimeline"
          @close="closeTimeline"
        />
      </div>

      <!-- Two-column: Sandbox + Sensitivity -->
      <div class="two-column">
        <div class="chart-section">
          <h2 class="chart-title">
            <FlaskConical :size="18" style="vertical-align: middle; margin-right: 4px;" />
            {{ t('act3.sandboxChartTitle') }}
          </h2>
          <p class="chart-desc">{{ t('act3.sandboxChartDesc') }}</p>
          <PolicySandbox />
        </div>

        <div class="chart-section">
          <h2 class="chart-title">{{ t('act3.sensitivityChartTitle') }}</h2>
          <p class="chart-desc">{{ t('act3.sensitivityChartDesc') }}</p>
          <PolicySensitivityChart />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.act3-section {
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
