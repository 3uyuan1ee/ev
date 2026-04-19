<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import colorConfig from '@/data/shared/color-config.json'

const props = defineProps({
  timeline: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const { themeConfig } = useChartTheme()

const chartOption = computed(() => {
  if (!props.timeline) return {}

  const yd = props.timeline.yearlyData
  const years = yd.map(d => d.year)
  const shares = yd.map(d => d.evMarketShare)
  const subsidies = yd.map(d => d.evSubsidyUsd)
  const stations = yd.map(d => d.chargingStations)
  const regulation = yd.map(d => d.emissionRegulationScore)

  const palette = colorConfig.chartPalette
  const marketShareColor = palette[0]   // #8E8DBA (Mauve)
  const subsidyColor = palette[0]       // #8E8DBA (Mauve)
  const regulationColor = palette[1]    // #E98074 (Coral)

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['Market Share %', 'Subsidy (USD)', 'Regulation Score'],
      top: 0,
      ...themeConfig.value.legend
    },
    grid: {
      left: 60,
      right: 60,
      top: 50,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: { rotate: 0 }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Market Share %',
        position: 'left',
        axisLabel: { formatter: '{value}%' }
      },
      {
        type: 'value',
        name: 'Regulation Score',
        position: 'right',
        max: 100
      }
    ],
    series: [
      {
        name: 'Market Share %',
        type: 'bar',
        data: shares,
        itemStyle: {
          color: marketShareColor,
          borderRadius: [3, 3, 0, 0]
        },
        barMaxWidth: 20
      },
      {
        name: 'Subsidy (USD)',
        type: 'line',
        data: subsidies,
        yAxisIndex: 0,
        lineStyle: { color: subsidyColor, type: 'dashed' },
        itemStyle: { color: subsidyColor },
        symbol: 'circle',
        symbolSize: 4,
        tooltip: {
          valueFormatter: v => `$${v?.toLocaleString() || 0}`
        }
      },
      {
        name: 'Regulation Score',
        type: 'line',
        data: regulation,
        yAxisIndex: 1,
        lineStyle: { color: regulationColor },
        itemStyle: { color: regulationColor },
        symbol: 'diamond',
        symbolSize: 5
      }
    ],
    animationDuration: 500
  }
})
</script>

<template>
  <div class="country-detail" v-if="timeline">
    <div class="detail-header">
      <div>
        <h3 class="detail-title">{{ timeline.country }}</h3>
        <span class="detail-region">{{ timeline.region }}</span>
      </div>
      <button class="close-btn" @click="emit('close')">&times;</button>
    </div>
    <div class="detail-chart">
      <EChartsWrapper :option="chartOption" />
    </div>
  </div>
</template>

<style scoped>
.country-detail {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.detail-title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.detail-region {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

.detail-chart {
  height: 320px;
  padding: var(--space-2);
}
</style>
