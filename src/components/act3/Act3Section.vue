<script setup>
import { usePolicyTimeline } from '@/composables/act3/usePolicyTimeline'
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import TimelinePlayer from '@/components/common/TimelinePlayer.vue'
import PolicyHeatmap from './PolicyHeatmap.vue'
import PolicyTimeline from './PolicyTimeline.vue'
import PolicySandbox from './PolicySandbox.vue'
import PolicySensitivityChart from './PolicySensitivityChart.vue'
import { Globe, FlaskConical } from 'lucide-vue-next'

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
        <template #title>政策不是锦上添花，而是关键推手</template>
        回归分析显示，充电站数量、燃油价格和监管力度是 EV 渗透率最强的预测因子。
        当充电基础设施从零增长到中国 2025 年的 430 万个充电桩，模型预测市场渗透率可提升 <strong class="highlight-number">20+ 个百分点</strong>。
      </InsightCard>

      <!-- Narrative -->
      <NarrativeSection>
        <p>
          25 个国家，16 年的数据告诉我们：没有单一政策"银弹"能够推动电动化。
          挪威用<strong>高额免税</strong>领跑，中国用<strong>补贴+基建双驱动</strong>弯道超车，
          而巴西和印度仍在等待价格拐点。
        </p>
        <p>
          以下沙盘让你扮演"政策制定者"：调节补贴、油价、电价、监管力度等 6 个旋钮，
          看看回归模型如何预测 EV 市场渗透率的变化。
        </p>
      </NarrativeSection>

      <!-- Global Ranking Heatmap with Timeline -->
      <div class="chart-section">
        <h2 class="chart-title">Global EV Market Share Ranking</h2>
        <p class="chart-desc">25 countries ranked by EV market share — click a bar to see country details</p>

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
            Policy Sandbox
          </h2>
          <p class="chart-desc">Adjust 6 policy parameters — see predicted EV market share in real-time</p>
          <PolicySandbox />
        </div>

        <div class="chart-section">
          <h2 class="chart-title">Sensitivity Analysis</h2>
          <p class="chart-desc">Which factor has the largest impact on EV adoption?</p>
          <PolicySensitivityChart />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.act3-section {
  padding: var(--space-10) 0;
}

.chart-section {
  margin-bottom: var(--space-8);
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
