<script setup>
import { computed } from 'vue'
import EChartsWrapper from './EChartsWrapper.vue'
import colorConfig from '@/data/shared/color-config.json'

const props = defineProps({
  series1: { type: Object, required: true },
  series2: { type: Object, required: true },
  powertrainLabels: { type: Array, default: () => ['ICEV', 'BEV'] },
  breakevenYear: { type: Number, default: null },
  selectedYear: { type: Number, default: -1 },
  height: { type: String, default: '450px' },
})

const emit = defineEmits(['yearClick'])

// Resolve cost component colors from color-config, with fallback for unsupported powertrains
const { costComponentColors, powertrainColors, thresholdLines } = colorConfig

const costColors = {
  icev: costComponentColors.icev,
  bev: costComponentColors.bev,
  // Fallback: reuse icev cost component palette for hev/phev
  hev: costComponentColors.icev,
  phev: costComponentColors.icev,
}

const option = computed(() => {
  const s1 = props.series1.yearlyData || []
  const s2 = props.series2.yearlyData || []
  const years = s1.map(d => `Year ${d.year}`)
  const pt1 = props.powertrainLabels[0]?.toLowerCase() || 'icev'
  const pt2 = props.powertrainLabels[1]?.toLowerCase() || 'bev'
  const c1 = costColors[pt1] || costColors.icev
  const c2 = costColors[pt2] || costColors.bev

  // Resolve cumulative line colors from powertrainColors
  const lineColor1 = powertrainColors[pt1] || powertrainColors.icev
  const lineColor2 = powertrainColors[pt2] || powertrainColors.bev

  // Resolve breakeven line color from thresholdLines
  const breakevenColor = thresholdLines.breakeven

  const series = [
    // Series 1 (e.g., ICEV) cost components stacked
    { name: `${props.powertrainLabels[0]} Purchase`, type: 'line', stack: 's1', areaStyle: { color: c1.purchase }, lineStyle: { width: 0 }, showSymbol: false, data: s1.map(d => d.purchase) },
    { name: `${props.powertrainLabels[0]} Energy`, type: 'line', stack: 's1', areaStyle: { color: c1.energy }, lineStyle: { width: 0 }, showSymbol: false, data: s1.map(d => d.energy) },
    { name: `${props.powertrainLabels[0]} Maintenance`, type: 'line', stack: 's1', areaStyle: { color: c1.maintenance }, lineStyle: { width: 0 }, showSymbol: false, data: s1.map(d => d.maintenance) },
    { name: `${props.powertrainLabels[0]} Insurance`, type: 'line', stack: 's1', areaStyle: { color: c1.insurance }, lineStyle: { width: 0 }, showSymbol: false, data: s1.map(d => d.insurance) },
    { name: `${props.powertrainLabels[0]} Tax`, type: 'line', stack: 's1', areaStyle: { color: c1.tax }, lineStyle: { width: 0 }, showSymbol: false, data: s1.map(d => d.tax) },
    // Cumulative line for series 1
    { name: props.powertrainLabels[0], type: 'line', data: s1.map(d => d.cumulative), lineStyle: { width: 2.5, color: lineColor1 }, itemStyle: { color: lineColor1 }, showSymbol: false, z: 10 },
    // Series 2 cost components stacked
    { name: `${props.powertrainLabels[1]} Purchase`, type: 'line', stack: 's2', areaStyle: { color: c2.purchase }, lineStyle: { width: 0 }, showSymbol: false, data: s2.map(d => d.purchase) },
    { name: `${props.powertrainLabels[1]} Energy`, type: 'line', stack: 's2', areaStyle: { color: c2.energy }, lineStyle: { width: 0 }, showSymbol: false, data: s2.map(d => d.energy) },
    { name: `${props.powertrainLabels[1]} Maintenance`, type: 'line', stack: 's2', areaStyle: { color: c2.maintenance }, lineStyle: { width: 0 }, showSymbol: false, data: s2.map(d => d.maintenance) },
    { name: `${props.powertrainLabels[1]} Insurance`, type: 'line', stack: 's2', areaStyle: { color: c2.insurance }, lineStyle: { width: 0 }, showSymbol: false, data: s2.map(d => d.insurance) },
    { name: `${props.powertrainLabels[1]} Tax`, type: 'line', stack: 's2', areaStyle: { color: c2.tax }, lineStyle: { width: 0 }, showSymbol: false, data: s2.map(d => d.tax) },
    // Cumulative line for series 2
    { name: props.powertrainLabels[1], type: 'line', data: s2.map(d => d.cumulative), lineStyle: { width: 2.5, color: lineColor2 }, itemStyle: { color: lineColor2 }, showSymbol: false, z: 10 },
  ]

  // Add breakeven line
  const markLine = props.breakevenYear !== null ? {
    silent: true,
    symbol: 'none',
    data: [{
      xAxis: props.breakevenYear,
      lineStyle: { color: breakevenColor, type: 'dashed', width: 2 },
      label: {
        formatter: `Breakeven: Year ${props.breakevenYear.toFixed(1)}`,
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
        const cumulative = params.filter(p => !p.seriesName.includes('Purchase') && !p.seriesName.includes('Energy') && !p.seriesName.includes('Maintenance') && !p.seriesName.includes('Insurance') && !p.seriesName.includes('Tax') || p.seriesIndex === 5 || p.seriesIndex === 11)
        const lines = [`<b>${params[0].axisValue}</b>`]
        params.forEach(p => {
          if (p.value !== undefined && p.value !== 0) {
            lines.push(`${p.marker} ${p.seriesName}: <b>$${p.value.toLocaleString()}</b>`)
          }
        })
        return lines.join('<br/>')
      },
    },
    legend: {
      data: [props.powertrainLabels[0], props.powertrainLabels[1]],
      bottom: 0,
      selected: Object.fromEntries(series.map(s => [s.name, !s.name.includes('Purchase') && !s.name.includes('Energy') && !s.name.includes('Maintenance') && !s.name.includes('Insurance') && !s.name.includes('Tax')])),
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
        formatter: val => `$${(val / 1000).toFixed(0)}k`,
      },
    },
    series,
    // Apply markLine to first cumulative series
    ...(props.breakevenYear !== null ? {
      series: series.map((s, i) => i === 5 ? { ...s, markLine } : s),
    } : {}),
  }
})
</script>

<template>
  <EChartsWrapper :option="option" :height="height" />
</template>
