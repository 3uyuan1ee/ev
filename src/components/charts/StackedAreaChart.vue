<script setup>
import { computed } from 'vue'
import EChartsWrapper from './EChartsWrapper.vue'
import colorConfig from '@/data/shared/color-config.json'
import { useI18n } from '@/i18n/useI18n'

const { t } = useI18n()

const props = defineProps({
  allSeries: { type: Array, required: true },
  powertrainLabels: { type: Array, default: () => ['ICEV', 'BEV'] },
  breakevenYear: { type: Number, default: null },
  selectedYear: { type: Number, default: -1 },
  height: { type: String, default: '450px' },
})

const emit = defineEmits(['yearClick'])

const { powertrainColors, thresholdLines } = colorConfig

const option = computed(() => {
  if (!props.allSeries.length) return {}

  const firstData = props.allSeries[0]?.data?.yearlyData || []
  const years = firstData.map(d => t('chart.xAxisYearFormat', { year: d.year }))

  const series = []
  const legendNames = []

  props.allSeries.forEach(({ powertrain, data }, index) => {
    const yearlyData = data?.yearlyData || []
    const label = props.powertrainLabels[index] || powertrain.toUpperCase()
    const pt = powertrain.toLowerCase()
    const lineColor = powertrainColors[pt] || powertrainColors.icev
    const costColors = colorConfig.costComponentColors[pt] || colorConfig.costComponentColors.icev

    // Cumulative cost line for this powertrain
    series.push({
      name: label,
      type: 'line',
      data: yearlyData.map(d => d.cumulative),
      lineStyle: { width: 2.5, color: lineColor },
      itemStyle: { color: lineColor },
      showSymbol: false,
      z: 10,
    })
    legendNames.push(label)
  })

  // Add breakeven line (between first two powertrains)
  const breakevenColor = thresholdLines.breakeven
  const markLine = props.breakevenYear !== null ? {
    silent: true,
    symbol: 'none',
    data: [{
      xAxis: props.breakevenYear,
      lineStyle: { color: breakevenColor, type: 'dashed', width: 2 },
      label: {
        formatter: t('chart.breakevenMarker', { year: props.breakevenYear.toFixed(1) }),
        color: breakevenColor,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'JetBrains Mono',
      },
    }],
  } : {}

  return {
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        const lines = [`<b>${params[0].axisValue}</b>`]
        params.forEach(p => {
          if (p.value !== undefined) {
            lines.push(`${p.marker} ${p.seriesName}: <b>${t('chart.tooltipTotalCost', { value: p.value.toLocaleString() })}</b>`)
          }
        })
        return lines.join('<br/>')
      },
    },
    legend: {
      data: legendNames,
      bottom: 0,
    },
    grid: {
      top: 24,
      right: 24,
      bottom: 48,
      left: 60,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: years,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: val => t('chart.yAxisDollarKFormat', { value: (val / 1000).toFixed(0) }),
      },
    },
    series: series.map((s, i) => i === 0 && markLine.silent !== undefined ? { ...s, markLine } : s),
  }
})
</script>

<template>
  <EChartsWrapper :option="option" :height="height" />
</template>
