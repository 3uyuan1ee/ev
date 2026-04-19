<script setup>
import { computed } from 'vue'
import InsightCard from '@/components/common/InsightCard.vue'
import NarrativeSection from '@/components/common/NarrativeSection.vue'
import TcoDashboard from './TcoDashboard.vue'
import TcoControls from './TcoControls.vue'
import { useTcoControls } from '@/composables/act1/useTcoControls'
import { useTcoCalculator } from '@/composables/act1/useTcoCalculator'
import { Zap } from 'lucide-vue-next'

const {
  controls,
  getVehicleConfig,
  getCityConfig,
  getChargingStrategy,
  getSubsidy,
} = useTcoControls()

const {
  series1,
  series2,
  breakevenYear,
  totalSavings,
} = useTcoCalculator(
  controls,
  getVehicleConfig,
  getCityConfig,
  getChargingStrategy,
  getSubsidy,
)

const powertrainLabels = computed(() =>
  controls.powertrainPair.map(pt => pt.toUpperCase())
)
</script>

<template>
  <div class="act1-section">
    <div class="section-inner">
      <!-- Insight Card -->
      <InsightCard class="act1-insight">
        <template #icon><Zap :size="20" /></template>
        <template #title>二手电动车，才是真正的省钱之王</template>
        根据 Woody et al. (2026) 的研究，购买 3 年二手 Midsize SUV 的 BEV 版本，
        相比同款新车 ICEV，在 7 年持有期内可节省约 <strong class="highlight-number">$13,000</strong>。
        <template #detail>查看 TCO 计算器验证这个结论</template>
      </InsightCard>

      <!-- Narrative -->
      <NarrativeSection class="act1-narrative">
        <p>
          大多数人购车时只看标价。但<strong>总拥有成本（TCO）</strong>才是真正的决策依据——
          它包含了折旧、能源、维护、保险、税费等多个维度的累积开支。
        </p>
        <p>
          电动车虽然在购买时可能更贵，但<strong>能源成本远低于燃油车</strong>。
          当你把时间线拉长到 5-7 年，电费节省累积的效果会非常明显。
          用下方的计算器，输入你的实际使用条件，看看电动化和燃油化的成本曲线何时交汇。
        </p>
      </NarrativeSection>

      <!-- TCO Calculator -->
      <div class="tco-layout">
        <aside class="tco-controls-panel">
          <TcoControls :controls="controls" />
        </aside>
        <main class="tco-chart-panel">
          <TcoDashboard
            :series1="series1"
            :series2="series2"
            :breakeven-year="breakevenYear"
            :total-savings="totalSavings"
            :powertrain-labels="powertrainLabels"
          />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.act1-section {
  padding: var(--space-10) 0;
}

.act1-insight {
  margin-bottom: var(--space-6);
}

.act1-narrative {
  margin-bottom: var(--space-8);
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
