<script setup>
import { usePolicyTimeline } from '@/composables/act3/usePolicyTimeline'
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import TimelinePlayer from '@/components/common/TimelinePlayer.vue'
import EvGrowthAreaChart from './EvGrowthAreaChart.vue'
import PolicyHeatmap from '@/components/act3/PolicyHeatmap.vue'
import PolicyTimeline from '@/components/act3/PolicyTimeline.vue'
import { TrendingDown, Globe } from 'lucide-vue-next'
import { useI18n } from '@/i18n/useI18n'

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
  selectCountry(null)
}
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

      <!-- Global EV Market Share Ranking with Timeline (from old Act 3) -->
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

      <!-- Bridge paragraph to Chapter 4 -->
      <NarrativeSection class="act2-bridge">
        <p v-html="t('act2.narrativeP1')" />
        <p v-html="t('act2.bridgeP')" />
      </NarrativeSection>
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
</style>
