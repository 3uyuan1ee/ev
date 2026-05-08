<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import { useI18n } from '@/i18n/useI18n'
import evGrowthData from '@/data/act2/ev-growth-by-region.json'

const { themeConfig } = useChartTheme()
const { t, locale } = useI18n()

const isZh = computed(() => locale.value === 'zh')

const regionLabels = {
  China: () => isZh.value ? '中国' : 'China',
  Europe: () => isZh.value ? '欧洲' : 'Europe',
  India: () => isZh.value ? '印度' : 'India',
  'Rest of the world': () => isZh.value ? '其他' : 'Rest of World',
}

const regionColors = {
  'China': '#E85A4F',
  'Europe': '#8E8DBA',
  'India': '#D8C3A5',
  'Rest of the world': '#9B9590',
}

const displayRegions = ['China', 'Europe', 'India', 'Rest of the world']

// Build year list from historical data (start from 2nd year to have YoY)
const histYears = evGrowthData.regions
  .find(r => r.region === 'China')
  .EV_sales.historical.map(d => d.year)
const yoyYears = histYears.slice(1) // need prev year for calc

// Calculate YoY growth rates per region
const regionYoY = displayRegions.map(regionName => {
  const region = evGrowthData.regions.find(r => r.region === regionName)
  if (!region) return { name: regionName, data: yoyYears.map(() => null) }

  const hist = region.EV_sales.historical
  const salesByYear = new Map(hist.map(d => [d.year, d.value]))

  const data = yoyYears.map(year => {
    const curr = salesByYear.get(year)
    const prev = salesByYear.get(year - 1)
    if (curr == null || prev == null || prev === 0) return null
    return Math.round(((curr - prev) / prev) * 1000) / 10
  })

  return { name: regionName, data }
})

const option = computed(() => ({
  ...themeConfig.value,
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#D8C3A5',
    borderWidth: 1,
    textStyle: { color: '#3A3630', fontSize: 12 },
    formatter(params) {
      const year = params[0].axisValue
      const rows = params
        .filter(p => p.value != null)
        .sort((a, b) => b.value - a.value)
        .map(p => {
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>`
          return `${dot}${p.seriesName}: <b>${p.value.toFixed(1)}%</b>`
        }).join('<br/>')
      return `<b>${year}</b><br/>${rows}`
    },
  },
  legend: {
    top: 0,
    right: 0,
    textStyle: { color: '#9B9590', fontSize: 11 },
    itemWidth: 12,
    itemHeight: 12,
    itemGap: 16,
  },
  grid: {
    left: 55,
    right: 20,
    top: 40,
    bottom: 35,
  },
  xAxis: {
    type: 'category',
    data: yoyYears.map(String),
    axisLabel: { color: '#9B9590', fontSize: 11 },
    axisLine: { lineStyle: { color: '#D8C3A5' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#9B9590',
      fontSize: 11,
      formatter: '{value}%',
    },
    splitLine: { lineStyle: { color: 'rgba(216,195,165,0.3)' } },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: regionYoY.map(r => ({
    name: regionLabels[r.name]?.() || r.name,
    type: 'line',
    data: r.data,
    smooth: 0.3,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 2.5,
      color: regionColors[r.name],
    },
    itemStyle: {
      color: regionColors[r.name],
    },
    emphasis: {
      focus: 'series',
    },
  })),
}))
</script>

<template>
  <EChartsWrapper :option="option" />
</template>
