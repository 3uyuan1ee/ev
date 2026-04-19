<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import colorConfig from '@/data/shared/color-config.json'
import gridData from '@/data/act4/grid-cleanliness-comparison.json'

const { themeConfig } = useChartTheme()

const chartPalette = colorConfig.chartPalette

// Threshold colors derived from chartPalette indices:
//   >= 70% : chartPalette[0] '#8E8DBA' (mauve — best tier)
//   >= 50% : chartPalette[2] '#E85A4F' (coral)
//   >= 30% : chartPalette[1] '#E98074' (salmon)
//   <  30% : chartPalette[3] '#D8C3A5' (sand — lowest tier)
function barColor(value) {
  if (value >= 70) return chartPalette[0]
  if (value >= 50) return chartPalette[2]
  if (value >= 30) return chartPalette[1]
  return chartPalette[3]
}

const markLineColor = '#9B9590'

const chartOption = computed(() => {
  const sorted = [...gridData.countries].sort((a, b) => b.evCarbonAdvantage - a.evCarbonAdvantage)
  const categories = sorted.map(d => d.country)
  const advantages = sorted.map(d => d.evCarbonAdvantage)

  const globalAvg = gridData.globalAverage.evCarbonAdvantage

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params) {
        const idx = params[0].dataIndex
        const c = sorted[idx]
        return `<strong>${c.country}</strong><br/>
          EV Carbon Advantage: <strong>${c.evCarbonAdvantage}%</strong><br/>
          Grid CO₂: ${c.gridCO2PerKwh} kg/kWh<br/>
          Energy Use: ${c.avgEnergyConsumptionKwh} kWh/100km<br/>
          CO₂ Reduction: ${c.co2ReductionMt} Mt/year`
      }
    },
    grid: {
      left: 100,
      right: 60,
      top: 40,
      bottom: 30
    },
    xAxis: {
      type: 'value',
      name: 'EV Carbon Advantage (%)',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontSize: 11 }
    },
    series: [
      {
        type: 'bar',
        data: advantages.map((v) => ({
          value: v,
          itemStyle: {
            color: barColor(v),
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barMaxWidth: 20,
        label: {
          show: true,
          position: 'right',
          formatter: p => `${p.value}%`,
          fontSize: 10
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: markLineColor, type: 'dashed' },
          label: { formatter: `Global Avg: ${globalAvg}%`, position: 'insideEndTop' },
          data: [{ xAxis: globalAvg }]
        }
      }
    ],
    animationDuration: 600
  }
})
</script>

<template>
  <div class="grid-chart">
    <EChartsWrapper :option="chartOption" style="height: 380px;" />
  </div>
</template>

<style scoped>
.grid-chart {
  height: 380px;
}
</style>
