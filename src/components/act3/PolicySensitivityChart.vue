<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import { usePolicySandbox } from '@/composables/act3/usePolicySandbox'
import colorConfig from '@/data/shared/color-config.json'

const { sensitivityData } = usePolicySandbox()
const { themeConfig } = useChartTheme()

const positiveColor = colorConfig.chartPalette[0]  // #8E8DBA (Mauve = positive/success)
const negativeColor = colorConfig.powertrainColors.icev  // #E85A4F (Crimson = negative/danger)
const zeroLineColor = colorConfig.regionColors.Other     // #9B9590

const chartOption = computed(() => {
  const data = sensitivityData.value
  if (!data.length) return {}

  const labels = data.map(d => d.label)
  const deltas = data.map(d => d.delta)
  const maxAbs = Math.max(...deltas.map(Math.abs), 1)

  // Positive deltas = Mauve, negative = Crimson
  const colors = deltas.map(d =>
    d >= 0 ? positiveColor : negativeColor
  )

  return {
    ...themeConfig.value,
    title: {
      text: 'Policy Sensitivity Analysis',
      subtext: 'Impact on EV market share when each factor moves from min to max',
      left: 'center',
      ...themeConfig.value.title
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params) {
        const d = data[params[0].dataIndex]
        if (!d) return ''
        const direction = d.delta >= 0 ? 'increases' : 'decreases'
        return `<strong>${d.label}</strong><br/>
          At min: ${d.atMin.toFixed(1)}%<br/>
          At max: ${d.atMax.toFixed(1)}%<br/>
          Impact: <strong>${direction} by ${Math.abs(d.delta).toFixed(1)}pp</strong>`
      }
    },
    grid: {
      left: 160,
      right: 40,
      top: 60,
      bottom: 30
    },
    xAxis: {
      type: 'value',
      name: 'Impact (percentage points)',
      max: Math.ceil(maxAbs) + 2,
      min: -Math.ceil(maxAbs) - 2,
      axisLabel: {
        formatter: v => `${v > 0 ? '+' : ''}${v}pp`
      }
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        fontSize: 11,
        width: 140,
        overflow: 'truncate'
      }
    },
    series: [{
      type: 'bar',
      data: deltas.map((v, i) => ({
        value: v,
        itemStyle: {
          color: colors[i],
          borderRadius: v >= 0
            ? [0, 4, 4, 0]
            : [4, 0, 0, 4]
        }
      })),
      barMaxWidth: 20,
      label: {
        show: true,
        position: 'right',
        formatter(p) {
          const v = p.value
          return `${v >= 0 ? '+' : ''}${v.toFixed(1)}pp`
        },
        fontSize: 10
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: zeroLineColor, type: 'dashed' },
        data: [{ xAxis: 0 }]
      }
    }],
    animationDuration: 600
  }
})
</script>

<template>
  <div class="sensitivity-chart">
    <EChartsWrapper :option="chartOption" />
  </div>
</template>

<style scoped>
.sensitivity-chart {
  height: 320px;
}
</style>
