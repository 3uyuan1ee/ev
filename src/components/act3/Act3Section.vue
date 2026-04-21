<script setup>
import { usePolicyTimeline } from '@/composables/act3/usePolicyTimeline'
import { useI18n } from '@/i18n/useI18n'
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import CollapsibleSection from '@/components/common/CollapsibleSection.vue'
import DataSourceBadge from '@/components/common/DataSourceBadge.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import TimelinePlayer from '@/components/common/TimelinePlayer.vue'
import PolicyHeatmap from './PolicyHeatmap.vue'
import PolicyTimeline from './PolicyTimeline.vue'
import PolicySandbox from './PolicySandbox.vue'
import PolicySensitivityChart from './PolicySensitivityChart.vue'
import { Globe, FlaskConical, Mountain, Battery } from 'lucide-vue-next'

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
  <div class="act3-section">
    <div class="section-inner">
      <!-- Insight Card (always visible) -->
      <InsightCard :citation="t('act3.insightCitation')">
        <template #icon><Globe :size="20" /></template>
        <template #title>{{ t('act3.insightTitle') }}</template>
        <span v-html="t('act3.insightBody')" />
      </InsightCard>

      <!-- Global Ranking Heatmap with Timeline (always visible - the signature chart) -->
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
      <NarrativeSection class="act3-bridge">
        <p v-html="t('act3.narrativeP1')" />
        <p v-html="t('act3.bridgeP')" />
      </NarrativeSection>

      <!-- Fold 1: Policy Sandbox (default OPEN) -->
      <CollapsibleSection
        :title="t('collapsible.chapter3Fold1Title')"
        :default-open="true"
        class="fold-sandbox"
      >
        <template #summary>{{ t('collapsible.chapter3Fold1Summary') }}</template>
        <template #icon><FlaskConical :size="18" /></template>

        <NarrativeSection>
          <p v-html="t('act3.narrativeP2')" />
        </NarrativeSection>

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
      </CollapsibleSection>

      <!-- Fold 2: Mineral bottleneck (default CLOSED) -->
      <CollapsibleSection
        :title="t('collapsible.chapter3Fold2Title')"
        :default-open="false"
        class="fold-mineral"
      >
        <template #summary>{{ t('collapsible.chapter3Fold2Summary') }}</template>
        <template #icon><Mountain :size="18" /></template>

        <NarrativeSection>
          <p v-html="t('act3.narrativeP3')" />
        </NarrativeSection>

        <div class="mineral-content">
          <DataSourceBadge source-key="dataSource.act3" />
          <div class="mineral-notes">
            <h4>{{ t('act3.mineralSourceTitle') }}</h4>
            <p v-html="t('act3.mineralBody')" />
            <ul>
              <li v-for="item in t('act3.mineralImplications').split('|')" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </CollapsibleSection>

      <!-- Fold 3: Grid capacity (default CLOSED) -->
      <CollapsibleSection
        :title="t('collapsible.chapter3Fold3Title')"
        :default-open="false"
        class="fold-grid"
      >
        <template #summary>{{ t('collapsible.chapter3Fold3Summary') }}</template>
        <template #icon><Battery :size="18" /></template>

        <div class="grid-content">
          <h4>{{ t('act3.gridTitle') }}</h4>
          <p>{{ t('act3.gridIntro') }}</p>
          <ul>
            <li v-for="(item, idx) in t('act3.gridSolutions').split('|')" :key="idx" v-html="item" />
          </ul>
          <div class="source-note">
            <p v-for="(ref, idx) in t('act3.gridSources').split('|')" :key="idx">{{ idx + 1 }}. {{ ref }}</p>
          </div>
        </div>
      </CollapsibleSection>
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

.act3-bridge {
  margin-bottom: var(--space-6);
}

.fold-sandbox,
.fold-mineral,
.fold-grid {
  margin-bottom: var(--space-5);
}

.two-column {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
}

.mineral-content,
.grid-content {
  padding: var(--space-4);
}

.mineral-notes h4,
.grid-content h4 {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: var(--space-3) 0 var(--space-2);
}

.mineral-notes p,
.grid-content p {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-2);
}

.mineral-notes ul,
.grid-content ul {
  padding-left: var(--space-5);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.7;
}

.mineral-notes li,
.grid-content li {
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
