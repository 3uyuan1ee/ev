<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import batteryPriceTrend from '@/data/act2/battery-price-trend.json'
import colorConfig from '@/data/shared/color-config.json'
import { useChartTheme } from '@/composables/useChartTheme'
import { useI18n } from '@/i18n/useI18n'

const { themeConfig, chartPalette } = useChartTheme()
const { t } = useI18n()

const option = computed(() => {
  const actualYears = batteryPriceTrend.actual.map(d => d.year)
  const actualPrices = batteryPriceTrend.actual.map(d => d.priceUsdPerKwh)

  const lastActual = batteryPriceTrend.actual[batteryPriceTrend.actual.length - 1]
  const predictedData = batteryPriceTrend.predicted.data

  // X-axis: merge actual + predicted years
  const allYears = [...actualYears]
  for (const d of predictedData) {
    if (!allYears.includes(d.year)) allYears.push(d.year)
  }

  // Build category-indexed arrays: value at matching year position, null elsewhere
  // Predicted line: starts from last actual year (connection point) through predicted years
  const predictedLineData = allYears.map(yr => {
    if (yr === lastActual.year) return lastActual.priceUsdPerKwh
    const pd = predictedData.find(d => d.year === yr)
    return pd ? pd.priceUsdPerKwh : null
  })

  // Upper confidence band
  const upperBandData = allYears.map(yr => {
    if (yr === lastActual.year) return lastActual.priceUsdPerKwh
    const pd = predictedData.find(d => d.year === yr)
    return pd ? pd.confidenceUpper : null
  })

  // Lower confidence band
  const lowerBandData = allYears.map(yr => {
    if (yr === lastActual.year) return lastActual.priceUsdPerKwh
    const pd = predictedData.find(d => d.year === yr)
    return pd ? pd.confidenceLower : null
  })

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
          if (p.value !== undefined && p.value !== null && p.seriesName !== t('chart.batteryConfidenceBand')) {
            html += `${p.marker} ${t('chart.batteryTooltipFormat', { seriesName: p.seriesName, value: Math.round(p.value) })}<br/>`
          }
        })
        return html
      },
    },
    legend: {
      ...themeConfig.value.legend,
      data: [t('chart.batteryActual'), t('chart.batteryPredicted'), t('chart.battery100Threshold')],
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
      data: allYears,
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
        name: t('chart.batteryActual'),
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
        name: t('chart.batteryPredicted'),
        type: 'line',
        data: predictedLineData,
        lineStyle: { width: 2, type: 'dashed', color: primaryColor, opacity: 0.7 },
        itemStyle: { color: primaryColor },
        showSymbol: false,
        connectNulls: true,
      },
      // Confidence band upper
      {
        name: t('chart.batteryConfidenceBand'),
        type: 'line',
        data: upperBandData,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: primaryColor,
          opacity: 0.08
        },
        showSymbol: false,
        z: 1,
        connectNulls: true,
      },
      // Lower confidence bound
      {
        name: '_lower',
        type: 'line',
        data: lowerBandData,
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: primaryColor,
          opacity: 0.08
        },
        showSymbol: false,
        z: 1,
        connectNulls: true,
      },
      // $100 threshold
      {
        name: t('chart.battery100Threshold'),
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{
            yAxis: 100,
            lineStyle: { color: thresholdColor, type: 'dashed', width: 2 },
            label: { formatter: t('chart.battery100Parity'), color: thresholdColor, fontSize: 11, fontWeight: 600 },
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
