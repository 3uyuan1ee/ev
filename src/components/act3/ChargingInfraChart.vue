<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import chargingData from '@/data/act3/charging-infrastructure.json'
import { useI18n } from '@/i18n/useI18n'

const { themeConfig } = useChartTheme()
const { t, locale } = useI18n()

const countryColors = {
  'China': '#E85A4F',
  'Norway': '#8E8DBA',
  'Sweden': '#7A79A8',
  'Netherlands': '#E98074',
  'Germany': '#D8C3A5',
}

function formatValue(val) {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M'
  if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K'
  return val.toString()
}

// Chart 1: China — total charger growth + charger/BEV ratio
const chinaOption = computed(() => {
  const china = chargingData.countries.find(c => c.country === 'China')
  if (!china) return {}

  const years = china.data.map(d => d.year)
  const totals = china.data.map(d => d.total)
  const dcCounts = china.data.map(d => d.dc || 0)
  const ratioData = china.data.map(d => {
    if (d.bevSales && d.bevSales > 0) {
      return +(d.total / d.bevSales * 100).toFixed(1)
    }
    return null
  })

  const color = '#E85A4F'

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        const year = params[0]?.axisValue
        let html = `<strong>${year}</strong><br/>`
        params.forEach(p => {
          if (p.value !== null && p.value !== undefined) {
            if (p.seriesName.includes('%') || p.seriesName.includes('比')) {
              html += `${p.marker} ${p.seriesName}: <strong>${p.value}%</strong><br/>`
            } else {
              html += `${p.marker} ${p.seriesName}: <strong>${formatValue(p.value)}</strong><br/>`
            }
          }
        })
        return html
      },
    },
    legend: {
      data: [
        t('chart.chargingInfraChargers'),
        'DC ' + t('chart.chargingInfraChargers'),
        t('chart.chargingInfraRatio'),
      ],
      top: 0,
      ...themeConfig.value.legend,
    },
    grid: { left: 70, right: 70, top: 50, bottom: 30 },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: themeConfig.value.xAxis.axisLabel,
    },
    yAxis: [
      {
        type: 'value',
        name: t('chart.chargingInfraChargers'),
        axisLabel: {
          ...themeConfig.value.yAxis.axisLabel,
          formatter: formatValue,
        },
        splitLine: themeConfig.value.yAxis.splitLine,
      },
      {
        type: 'value',
        name: t('chart.chargingInfraRatio'),
        axisLabel: {
          ...themeConfig.value.yAxis.axisLabel,
          formatter: '{value}%',
        },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: t('chart.chargingInfraChargers'),
        type: 'bar',
        data: totals,
        itemStyle: { color, borderRadius: [4, 4, 0, 0], opacity: 0.7 },
      },
      {
        name: 'DC ' + t('chart.chargingInfraChargers'),
        type: 'bar',
        data: dcCounts,
        itemStyle: { color: '#E98074', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: t('chart.chargingInfraRatio'),
        type: 'line',
        yAxisIndex: 1,
        data: ratioData,
        lineStyle: { color: '#8E8DBA', width: 2.5 },
        itemStyle: { color: '#8E8DBA' },
        symbol: 'circle',
        symbolSize: 5,
        connectNulls: true,
      },
    ],
    animationDuration: 800,
  }
})

// Chart 2: European countries (normalized: chargers per 1000 BEVs)
const euroOption = computed(() => {
  const euroCountries = chargingData.countries.filter(c => c.country !== 'China')
  const yearSet = new Set()
  euroCountries.forEach(c => c.data.forEach(d => yearSet.add(d.year)))
  const allYears = [...yearSet].sort((a, b) => a - b)

  const series = euroCountries.map(c => {
    const color = countryColors[c.country] || '#9B9590'
    const dataMap = {}
    c.data.forEach(d => {
      // Normalized: chargers per 1000 BEVs
      dataMap[d.year] = (d.bevSales && d.bevSales > 0)
        ? +(d.total / d.bevSales * 1000).toFixed(0)
        : null
    })

    return {
      name: c.country,
      type: 'line',
      lineStyle: { color, width: 2.5 },
      itemStyle: { color },
      symbol: 'circle',
      symbolSize: 5,
      emphasis: { focus: 'series' },
      data: allYears.map(y => dataMap[y] ?? null),
      connectNulls: true,
    }
  })

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        const year = params[0]?.axisValue
        let html = `<strong>${year}</strong><br/>`
        params.forEach(p => {
          if (p.value !== null && p.value !== undefined) {
            html += `${p.marker} ${p.seriesName}: <strong>${p.value}</strong><br/>`
          }
        })
        return html
      },
    },
    legend: {
      data: euroCountries.map(c => c.country),
      top: 0,
      ...themeConfig.value.legend,
    },
    grid: { left: 60, right: 24, top: 50, bottom: 30 },
    xAxis: {
      type: 'category',
      data: allYears,
      axisLabel: themeConfig.value.xAxis.axisLabel,
    },
    yAxis: {
      type: 'value',
      name: t('chart.chargingInfraPerBev'),
      axisLabel: themeConfig.value.yAxis.axisLabel,
      splitLine: themeConfig.value.yAxis.splitLine,
    },
    series,
    animationDuration: 800,
  }
})
</script>

<template>
  <div class="charging-infra-chart">
    <div class="chart-block">
      <h4 class="chart-block-title">{{ t('chart.chargingInfraChinaTitle') }}</h4>
      <p class="chart-block-desc">{{ t('chart.chargingInfraChinaDesc') }}</p>
      <EChartsWrapper :option="chinaOption" style="height: 360px;" />
    </div>
    <div class="chart-block">
      <h4 class="chart-block-title">{{ t('chart.chargingInfraEuroTitle') }}</h4>
      <p class="chart-block-desc">{{ t('chart.chargingInfraEuroDesc') }}</p>
      <EChartsWrapper :option="euroOption" style="height: 320px;" />
    </div>
  </div>
</template>

<style scoped>
.charging-infra-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.chart-block-title {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.chart-block-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
  line-height: 1.6;
}
</style>
