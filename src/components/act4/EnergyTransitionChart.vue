<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import energyData from '@/data/act4/energy-transition.json'
import { useI18n } from '@/i18n/useI18n'

const { themeConfig } = useChartTheme()
const { locale } = useI18n()

// Energy source colors — warm palette matching the project design system
const sourceColors = {
  traditional_biomass: '#D8C3A5',  // Wheat — oldest
  coal: '#6B6560',                 // Dark neutral
  oil: '#E85A4F',                  // Crimson
  natural_gas: '#E98074',          // Coral
  nuclear: '#8E8DBA',              // Mauve
  hydro: '#7A79A8',                // Lighter mauve
  wind: '#A8A7D0',                 // Soft lavender
  solar: '#E8D4B8',               // Light wheat/gold
  other_renewables: '#9B9590',    // Sand
}

const sourceLabels = {
  en: {
    traditional_biomass: 'Traditional Biomass',
    coal: 'Coal',
    oil: 'Oil',
    natural_gas: 'Natural Gas',
    nuclear: 'Nuclear',
    hydro: 'Hydro',
    wind: 'Wind',
    solar: 'Solar',
    other_renewables: 'Other Renewables',
  },
  zh: {
    traditional_biomass: '传统生物质',
    coal: '煤炭',
    oil: '石油',
    natural_gas: '天然气',
    nuclear: '核能',
    hydro: '水电',
    wind: '风能',
    solar: '太阳能',
    other_renewables: '其他可再生',
  },
}

// Focus on the modern era (1965-2024) for readability
// but also include key historical markers
const modernData = energyData.energySubstitution.filter(d => d.year >= 1965)

// Compute total for each year to normalize to percentages
function computePercentageData() {
  const sources = Object.keys(sourceColors)
  return modernData.map(d => {
    const total = sources.reduce((sum, s) => sum + (d[s] || 0), 0)
    const entry = { year: d.year }
    sources.forEach(s => {
      entry[s] = total > 0 ? ((d[s] || 0) / total * 100) : 0
    })
    return entry
  })
}

const percentageData = computePercentageData()

const chartOption = computed(() => {
  const labels = sourceLabels[locale.value] || sourceLabels.en
  const sources = Object.keys(sourceColors)
  const years = percentageData.map(d => d.year)

  const series = sources.map(key => ({
    name: labels[key],
    type: 'line',
    stack: 'total',
    areaStyle: {
      color: sourceColors[key],
      opacity: 0.7,
    },
    lineStyle: {
      color: sourceColors[key],
      width: 0.5,
    },
    itemStyle: {
      color: sourceColors[key],
    },
    symbol: 'none',
    emphasis: {
      focus: 'series',
    },
    data: percentageData.map(d => Math.round(d[key] * 10) / 10),
  }))

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        const year = params[0]?.axisValue
        let html = `<strong>${year}</strong><br/>`
        params.forEach(p => {
          if (p.value > 0.1) {
            html += `${p.marker} ${p.seriesName}: <strong>${p.value.toFixed(1)}%</strong><br/>`
          }
        })
        return html
      },
    },
    legend: {
      data: sources.map(s => labels[s]),
      top: 0,
      type: 'scroll',
      ...themeConfig.value.legend,
    },
    grid: {
      left: 50,
      right: 24,
      top: 50,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: years,
      axisLabel: {
        ...themeConfig.value.xAxis.axisLabel,
        formatter: (val) => {
          const show = [1965, 1975, 1985, 1995, 2005, 2015, 2024]
          return show.includes(Number(val)) ? val : ''
        },
      },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        ...themeConfig.value.yAxis.axisLabel,
        formatter: '{value}%',
      },
    },
    series,
    animationDuration: 800,
  }
})

// Lead petrol ban chart — bar chart overlay as a second chart
const leadBanData = energyData.leadPetrolBan
const leadBanChartOption = computed(() => {
  const decades = leadBanData.distribution.map(d => {
    const start = d.decade
    return `${start}-${start + 9}`
  })
  const counts = leadBanData.distribution.map(d => d.count)

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        const p = params[0]
        return `<strong>${p.axisValue}</strong><br/>${p.marker} ${locale.value === 'zh' ? '禁用国家数' : 'Countries banning leaded petrol'}: <strong>${p.value}</strong>`
      },
    },
    grid: {
      left: 50,
      right: 24,
      top: 30,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: decades,
      axisLabel: themeConfig.value.xAxis.axisLabel,
    },
    yAxis: {
      type: 'value',
      name: locale.value === 'zh' ? '国家数' : 'Countries',
      axisLabel: themeConfig.value.yAxis.axisLabel,
      splitLine: themeConfig.value.yAxis.splitLine,
    },
    series: [{
      type: 'bar',
      data: counts,
      itemStyle: {
        color: '#E98074',
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        position: 'top',
        color: themeConfig.value.isDark ? '#B0A8A0' : '#6B6560',
        fontSize: 11,
      },
    }],
    animationDuration: 600,
  }
})
</script>

<template>
  <div class="energy-transition-chart">
    <div class="chart-block">
      <h4 class="chart-block-title">
        {{ locale === 'zh' ? '全球能源结构演变 (1965–2024)' : 'Global Energy Mix Evolution (1965–2024)' }}
      </h4>
      <EChartsWrapper :option="chartOption" style="height: 360px;" />
    </div>
    <div class="chart-block">
      <h4 class="chart-block-title">
        {{ locale === 'zh' ? '含铅汽油禁用：历史先例' : 'Leaded Petrol Ban: A Historical Precedent' }}
      </h4>
      <p class="chart-block-desc">
        {{ locale === 'zh'
          ? `${leadBanData.totalCountries} 个国家用了约 35 年完成含铅汽油淘汰。全球能源转型能否复制这一速度？`
          : `${leadBanData.totalCountries} countries phased out leaded petrol over ~35 years. Can the energy transition replicate this pace?`
        }}
      </p>
      <EChartsWrapper :option="leadBanChartOption" style="height: 260px;" />
    </div>
  </div>
</template>

<style scoped>
.energy-transition-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.chart-block-title {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.chart-block-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
  line-height: 1.6;
}
</style>
