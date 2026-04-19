<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import batteryPriceTrend from '@/data/act2/battery-price-trend.json'
import colorConfig from '@/data/shared/color-config.json'
import { useChartTheme } from '@/composables/useChartTheme'

const { themeConfig, chartPalette } = useChartTheme()

const option = computed(() => {
  const actualYears = batteryPriceTrend.actual.map(d => d.year)
  const actualPrices = batteryPriceTrend.actual.map(d => d.priceUsdPerKwh)

  const predictedStart = batteryPriceTrend.actual[batteryPriceTrend.actual.length - 1]
  const predictedYears = batteryPriceTrend.predicted.data.map(d => d.year)
  const predictedPrices = batteryPriceTrend.predicted.data.map(d => d.priceUsdPerKwh)
  const confidenceUpper = batteryPriceTrend.predicted.data.map(d => d.confidenceUpper)
  const confidenceLower = batteryPriceTrend.predicted.data.map(d => d.confidenceLower)

  // Connect actual to predicted
  const connectedPredicted = [predictedStart.priceUsdPerKwh, ...predictedPrices]
  const connectedYears = [...predictedYears]
  const connectedUpper = [predictedStart.priceUsdPerKwh, ...confidenceUpper]
  const connectedLower = [predictedStart.priceUsdPerKwh, ...confidenceLower]

  const primaryColor = chartPalette.value[0]
  const thresholdColor = colorConfig.thresholdLines.battery100

  // Milestone annotations
  const milestoneData = batteryPriceTrend.milestones.map(m => ({
    coord: [m.year, batteryPriceTrend.actual.find(a => a.year === m.year)?.priceUsdPerKwh || 0],
    value: m.label,
    itemStyle: { color: colorConfig.thresholdLines.breakeven },
  }))

  return {
    ...themeConfig.value,
    tooltip: {
      ...themeConfig.value.tooltip,
      trigger: 'axis',
      formatter(params) {
        const year = params[0]?.axisValue
        let html = `<b>${year}</b><br/>`
        params.forEach(p => {
          if (p.value !== undefined && p.value !== null && p.seriesName !== 'Confidence Band') {
            html += `${p.marker} ${p.seriesName}: <b>$${Math.round(p.value)}/kWh</b><br/>`
          }
        })
        return html
      },
    },
    legend: {
      ...themeConfig.value.legend,
      data: ['Actual', 'Predicted', '$100 Threshold'],
      bottom: 0,
    },
    grid: {
      top: 24,
      right: 24,
      bottom: 60,
      left: 60,
    },
    xAxis: {
      ...themeConfig.value.xAxis,
      type: 'category',
      data: [...new Set([...actualYears, ...connectedYears])],
      boundaryGap: false,
      axisLabel: { ...themeConfig.value.xAxis.axisLabel, formatter: v => v.toString() },
    },
    yAxis: {
      ...themeConfig.value.yAxis,
      type: 'value',
      max: 1200,
      axisLabel: { ...themeConfig.value.yAxis.axisLabel, formatter: v => `$${v}` },
    },
    series: [
      // Actual line
      {
        name: 'Actual',
        type: 'line',
        data: actualPrices,
        lineStyle: { width: 3, color: primaryColor },
        itemStyle: { color: primaryColor },
        showSymbol: true,
        symbolSize: 6,
        z: 10,
        markPoint: {
          data: milestoneData.slice(0, 3),
          symbol: 'pin',
          symbolSize: 40,
          label: { fontSize: 8, show: true, formatter: '{b}', width: 80, overflow: 'break' },
        },
      },
      // Predicted line (dashed)
      {
        name: 'Predicted',
        type: 'line',
        data: connectedPredicted.map((v, i) => ({
          value: v,
          xAxis: i === 0 ? actualYears[actualYears.length - 1] : connectedYears[i - 1],
        })),
        lineStyle: { width: 2, type: 'dashed', color: primaryColor, opacity: 0.7 },
        itemStyle: { color: primaryColor },
        showSymbol: false,
      },
      // Confidence band
      {
        name: 'Confidence Band',
        type: 'line',
        data: connectedUpper,
        lineStyle: { opacity: 0 },
        areaStyle: { color: 'rgba(142, 141, 186, 0.1)' },
        showSymbol: false,
        z: 1,
      },
      // Lower confidence
      {
        name: 'Lower',
        type: 'line',
        data: connectedLower,
        lineStyle: { opacity: 0 },
        areaStyle: { color: 'rgba(142, 141, 186, 0.1)' },
        showSymbol: false,
        z: 1,
      },
      // $100 threshold
      {
        name: '$100 Threshold',
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{
            yAxis: 100,
            lineStyle: { color: thresholdColor, type: 'dashed', width: 2 },
            label: { formatter: '$100/kWh Parity', color: thresholdColor, fontSize: 11, fontWeight: 600 },
          }],
        },
        data: [],
      },
    ],
  }
})
</script>

<template>
  <EChartsWrapper :option="option" height="400px" />
</template>
