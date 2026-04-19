<script setup>
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import ChartContainer from '@/components/common/ChartContainer.vue'
import BatteryPriceChart from './BatteryPriceChart.vue'
import ChinaMarketStreamgraph from './ChinaMarketStreamgraph.vue'
import BrandBubbleChart from './BrandBubbleChart.vue'
import { TrendingDown, Zap } from 'lucide-vue-next'
</script>

<template>
  <div class="act2-section">
    <div class="section-inner">
      <!-- Insight -->
      <InsightCard>
        <template #icon><TrendingDown :size="20" /></template>
        <template #title>电池成本 15 年降了 90%，但这只是开始</template>
        从 2010 年的 $1,160/kWh 到 2025 年的约 $83/kWh，电池成本呈指数级下降。
        预计到 2030 年将降至 <strong class="highlight-number">$26/kWh</strong>，届时电池将不再是电动车的成本瓶颈。
      </InsightCard>

      <!-- Narrative -->
      <NarrativeSection>
        <p>
          电池是电动车最昂贵的单一组件，占据整车成本的 30-40%。
          电池成本的变化轨迹，直接决定了电动车何时能与燃油车在<strong>购置价格</strong>上实现平价。
        </p>
        <p>
          中国市场的变化尤为引人注目：曾经以低价微型车（A00级）为主的市场，
          如今已转向<strong>中高端主流车型</strong>（A级和B级），折射出电动车从"代步工具"到"品质出行"的转型。
        </p>
      </NarrativeSection>

      <!-- Battery Price Chart -->
      <div class="chart-section">
        <h2 class="chart-title">Battery Pack Price Trend</h2>
        <p class="chart-desc">2010-2030: actual prices vs exponential decay prediction (R²=0.96)</p>
        <ChartContainer :min-height="380">
          <template #default>
            <BatteryPriceChart />
          </template>
        </ChartContainer>
      </div>

      <!-- Two-column: Streamgraph + Bubble -->
      <div class="two-column">
        <div class="chart-section">
          <h2 class="chart-title">China EV Market Structure</h2>
          <p class="chart-desc">Vehicle class share evolution, 2016-2023 (click to explore)</p>
          <ChartContainer :min-height="350">
            <template #default>
              <ChinaMarketStreamgraph />
            </template>
          </ChartContainer>
        </div>

        <div class="chart-section">
          <h2 class="chart-title">Brand Competition</h2>
          <p class="chart-desc">10 brands across 10 countries — bubble size = battery capacity</p>
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
