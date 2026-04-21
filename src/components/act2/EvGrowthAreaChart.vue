<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import evGrowthData from '@/data/act2/ev-growth-by-region.json'
import { useI18n } from '@/i18n/useI18n'

const { themeConfig } = useChartTheme()
const { t } = useI18n()

// Single unified x-axis: all years 2010-2030
const allYears = [
  2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019,
  2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
]

// Use regions that have data (exclude World and US which is empty)
const displayRegions = evGrowthData.regions.filter(
  r => r.region !== 'World' && r.region !== 'United States' && r.EV_sales.historical.length > 0
)

const regionColors = {
  'China': '#E85A4F',
  'Europe': '#8E8DBA',
  'India': '#D8C3A5',
  'Norway': '#7A79A8',
  'Rest of the world': '#9B9590',
}

function formatValue(val) {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M'
  if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K'
  return val.toString()
}

/**
 * Build data array for a region: 2010-2030
 * - 2010-2024: historical values
 * - 2024-2030: linear interpolation from last historical to projection endpoint
 * - null for years with no data (before first historical or if no projection)
 */
function buildSeriesData(region) {
  const hist = region.EV_sales.historical
  const proj = region.EV_sales.projection

  // Map historical values by year
  const histMap = new Map(hist.map(d => [d.year, d.value]))
  // Get projection 2030 value
  const proj2030 = proj.find(d => d.year === 2030)?.value ?? null
  const lastHistYear = hist.length > 0 ? hist[hist.length - 1].year : null
  const lastHistValue = hist.length > 0 ? hist[hist.length - 1].value : null

  return allYears.map(year => {
    if (histMap.has(year)) return histMap.get(year)
    if (year > lastHistYear && proj2030 !== null && lastHistValue !== null) {
      // Linear interpolation between last historical and 2030 projection
      const fraction = (year - lastHistYear) / (2030 - lastHistYear)
      return Math.round(lastHistValue + fraction * (proj2030 - lastHistValue))
    }
    return null
  })
}

const chartOption = computed(() => {
  // Stacked area series for each region
  const series = displayRegions.map(r => {
    const color = regionColors[r.region] || '#9B9590'
    const data = buildSeriesData(r)
    const hasProjection = r.EV_sales.projection?.length > 0

    return {
      name: r.region,
      type: 'line',
      stack: 'total',
      areaStyle: { color, opacity: 0.35 },
      lineStyle: {
        color,
        width: 2,
        // Dashed for projection years (2025+)
        // ECharts doesn't support per-segment lineStyle in area stacks easily,
        // so we use visualMap or a markLine separator instead
      },
      itemStyle: { color },
      symbol: 'circle',
      symbolSize: (val, params) => {
        const yearIdx = params.dataIndex
        // Show dots only for historical data (index 0-14 = 2010-2024)
        return yearIdx <= 14 ? 3 : 0
      },
      emphasis: { focus: 'series' },
      connectNulls: false,
      data,
      // Use dashed line styling for projection segment via rich lineStyle
      // We overlay a dashed line on top for each region's projection portion
    }
  })

  // Add dashed overlay lines for projection portion (2024-2030)
  const projectionOverlays = displayRegions
    .filter(r => r.EV_sales.projection?.length > 0)
    .map(r => {
      const color = regionColors[r.region] || '#9B9590'
      const data = allYears.map((year, idx) => {
        if (idx < 14) return null // before 2024
        return buildSeriesData(r)[idx]
      })
      return {
        name: r.region + ' (STEPS)',
        type: 'line',
        stack: 'total_overlay',
        areaStyle: { color, opacity: 0.05 },
        lineStyle: { color, width: 2, type: 'dashed', opacity: 0.6 },
        itemStyle: { color, opacity: 0.5 },
        symbol: 'none',
        connectNulls: false,
        data,
      }
    })

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        // Filter to only show non-STEPS series (real data) + STEPS if in projection zone
        const year = params[0]?.axisValue
        const isProjection = Number(year) > 2024

        let html = `<strong>${year}</strong>`
        if (isProjection) {
          html += ` <span style="color:#9B9590;font-size:11px">IEA STEPS</span>`
        }
        html += '<br/>'

        let total = 0
        // Only show main series (not STEPS overlay)
        const mainParams = params.filter(p => !p.seriesName.includes('(STEPS)'))
        mainParams.forEach(p => {
          if (p.value !== undefined && p.value !== null) {
            html += `${p.marker} ${p.seriesName}: <strong>${formatValue(p.value)}</strong><br/>`
            total += p.value
          }
        })
        if (total > 0) html += `<br/><strong>${t('chart.evGrowthTotal')}: ${formatValue(total)}</strong>`
        return html
      },
    },
    legend: {
      data: displayRegions.map(r => r.region),
      top: 0,
      ...themeConfig.value.legend,
    },
    grid: {
      left: 70,
      right: 24,
      top: 50,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: allYears.map(String),
      axisLabel: {
        ...themeConfig.value.xAxis.axisLabel,
        formatter: (val) => {
          const show = [2010, 2014, 2018, 2024, 2030]
          return show.includes(Number(val)) ? val : ''
        },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: t('chart.evGrowthUnit'),
      axisLabel: {
        ...themeConfig.value.yAxis.axisLabel,
        formatter: formatValue,
      },
    },
    series: [
      ...series,
      ...projectionOverlays,
      // Vertical separator at 2024
      {
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: themeConfig.value.isDark ? 'rgba(234,231,220,0.3)' : 'rgba(58,54,48,0.2)',
            type: 'dashed',
            width: 1,
          },
          label: {
            show: true,
            position: 'insideStartTop',
            formatter: 'IEA STEPS →',
            fontSize: 10,
            color: themeConfig.value.isDark ? '#B0A8A0' : '#9B9590',
          },
          data: [{ xAxis: '2024' }],
        },
        data: [],
      },
    ],
    animationDuration: 800,
  }
})
</script>

<template>
  <div class="ev-growth-chart">
    <EChartsWrapper :option="chartOption" style="height: 400px;" />
  </div>
</template>

<style scoped>
.ev-growth-chart {
  height: 400px;
}
</style>
