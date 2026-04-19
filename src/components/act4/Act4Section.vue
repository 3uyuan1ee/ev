<script setup>
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import CarbonRacePanel from './CarbonRacePanel.vue'
import GridCleanlinessChart from './GridCleanlinessChart.vue'
import EmissionReductionChart from './EmissionReductionChart.vue'
import { Leaf, Zap } from 'lucide-vue-next'
</script>

<template>
  <div class="act4-section">
    <div class="section-inner">
      <!-- Insight -->
      <InsightCard>
        <template #icon><Leaf :size="20" /></template>
        <template #title>电动车的"碳债"在 2-3 年内就能还清</template>
        虽然电池制造过程产生额外碳排放（约 5-6.5 吨 CO₂），
        但得益于更低的年度运行排放，<strong class="highlight-number">BEV 在 2-3 年内即可追平 ICEV</strong>。
        在清洁电网地区（如挪威、法国），这一优势更为显著。
      </InsightCard>

      <!-- Narrative -->
      <NarrativeSection>
        <p>
          "电动车不也是用电吗？电从哪来？"这是一个关键问题。
          全生命周期碳排放分析表明，即便在以煤炭发电为主的中国和印度，
          电动车的碳排放仍<strong>低于同级别燃油车</strong>——只是优势幅度不同。
        </p>
        <p>
          在挪威（98% 清洁电力），电动车的碳优势高达 <strong>96.6%</strong>；
          而在印度（25% 清洁电力），这一数字降至 <strong>18.2%</strong>。
          电网的清洁程度，直接决定了电动车的环保"投资回报率"。
        </p>
      </NarrativeSection>

      <!-- Carbon Race -->
      <div class="chart-section">
        <h2 class="chart-title">Carbon Race: BEV vs ICEV</h2>
        <p class="chart-desc">Cumulative lifecycle CO₂ emissions — watch the crossover point</p>
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
            Grid Cleanliness & EV Carbon Advantage
          </h2>
          <p class="chart-desc">EV carbon advantage by country — driven by grid CO₂ intensity</p>
          <ChartContainer :min-height="380">
            <template #default>
              <GridCleanlinessChart />
            </template>
          </ChartContainer>
        </div>

        <div class="chart-section">
          <h2 class="chart-title">Global Oil Displacement by EVs</h2>
          <p class="chart-desc">Million liters of gasoline equivalent saved, by region (2010-2024)</p>
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
