<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import colorConfig from '@/data/shared/color-config.json'
import emissionData from '@/data/act4/global-ev-emission-reduction.json'

const { themeConfig } = useChartTheme()

const regionColors = colorConfig.regionColors

// Map dataset region names to colorConfig region keys
const regionColorMap = {
  'China': regionColors['Asia-Pacific'],      // '#E85A4F'
  'USA': regionColors['North America'],       // '#E98074'
  'Europe': regionColors['Europe']            // '#8E8DBA'
}

const defaultRegionColor = regionColors['Other']  // '#9B9590'
const globalTotalColor = '#3A3630'              // dark brown (text-primary)

const chartOption = computed(() => {
  const regions = emissionData.regions

  // Get all unique years
  const allYears = new Set()
  regions.forEach(r => r.data.forEach(d => allYears.add(d.year)))
  const years = [...allYears].sort((a, b) => a - b)

  // Build series data for each region
  const series = regions.map(r => {
    const color = regionColorMap[r.region] || defaultRegionColor
    return {
      name: r.region,
      type: 'line',
      stack: 'total',
      areaStyle: {
        color,
        opacity: 0.3
      },
      lineStyle: {
        color,
        width: 2
      },
      itemStyle: {
        color
      },
      symbol: 'circle',
      symbolSize: 4,
      data: years.map(y => {
        const d = r.data.find(dd => dd.year === y)
        return d ? d.value : 0
      })
    }
  })

  // Add global total line
  const globalTotal = emissionData.globalTotal
  series.push({
    name: 'Global Total',
    type: 'line',
    data: years.map(y => {
      const d = globalTotal.find(dd => dd.year === y)
      return d ? d.value : null
    }),
    lineStyle: { color: globalTotalColor, width: 3, type: 'dashed' },
    itemStyle: { color: globalTotalColor },
    symbol: 'diamond',
    symbolSize: 6
  })

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        let html = `<strong>${params[0].axisValue}</strong><br/>`
        params.forEach(p => {
          if (p.value !== null && p.value !== undefined) {
            html += `${p.marker} ${p.seriesName}: <strong>${p.value.toLocaleString()}M lge</strong><br/>`
          }
        })
        return html
      }
    },
    legend: {
      data: [...regions.map(r => r.region), 'Global Total'],
      top: 0,
      ...themeConfig.value.legend
    },
    grid: {
      left: 70,
      right: 30,
      top: 50,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: { rotate: 0 }
    },
    yAxis: {
      type: 'value',
      name: 'Oil Displaced (M lge)',
      axisLabel: {
        formatter: v => v >= 1000 ? `${(v / 1000).toFixed(0)}B` : `${v}M`
      }
    },
    series,
    animationDuration: 800
  }
})
</script>

<template>
  <div class="emission-chart">
    <EChartsWrapper :option="chartOption" style="height: 380px;" />
  </div>
</template>

<style scoped>
.emission-chart {
  height: 380px;
}
</style>
