<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import { useI18n } from '@/i18n/useI18n'
import colorConfig from '@/data/shared/color-config.json'

const props = defineProps({
  yearData: { type: Array, required: true },
  selectedCountry: { type: String, default: null }
})

const emit = defineEmits(['select-country'])

const { themeConfig } = useChartTheme()
const { t } = useI18n()

const regionColors = colorConfig.regionColors

const chartOption = computed(() => {
  const data = props.yearData
    .slice()
    .sort((a, b) => a.evMarketShare - b.evMarketShare) // ascending for horizontal bars

  const categories = data.map(d => d.country)
  const values = data.map(d => d.evMarketShare)
  const maxVal = Math.max(...values, 1)

  return {
    ...themeConfig.value,
    title: {
      text: t('chart.heatmapTitle'),
      subtext: t('chart.heatmapSubtitle'),
      left: 'center',
      ...themeConfig.value.title
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params) {
        const d = params[0]
        const item = data[d.dataIndex]
        if (!item) return ''
        return `<strong>${item.country}</strong><br/>
          ${t('chart.heatmapTooltipMarketShare')} <strong>${item.evMarketShare.toFixed(2)}%</strong><br/>
          ${t('chart.heatmapTooltipEvSales')} ${item.evSales?.toLocaleString() || 'N/A'}<br/>
          ${t('chart.heatmapTooltipChargingStations')} ${item.chargingStations?.toLocaleString() || 'N/A'}<br/>
          ${t('chart.heatmapTooltipSubsidy')} $${item.evSubsidyUsd?.toLocaleString() || 0}<br/>
          ${t('chart.heatmapTooltipRegulationScore')} ${item.emissionRegulationScore?.toFixed(1) || 'N/A'}`
      }
    },
    grid: {
      left: 120,
      right: 40,
      top: 60,
      bottom: 30
    },
    xAxis: {
      type: 'value',
      name: t('chart.heatmapXAxisName'),
      max: Math.ceil(maxVal / 5) * 5 + 5,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    yAxis: {
      type: 'category',
      data: categories,
      inverse: false,
      axisLabel: {
        fontSize: 11,
        width: 100,
        overflow: 'truncate'
      }
    },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: {
          color: regionColors[data[i].region] || colorConfig.regionColors.Other,
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barMaxWidth: 22,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.3)'
        }
      },
      label: {
        show: true,
        position: 'right',
        formatter(p) {
          return p.value >= 1 ? `${p.value.toFixed(1)}%` : `${p.value.toFixed(2)}%`
        },
        fontSize: 10
      }
    }],
    animationDuration: 600,
    animationEasing: 'cubicOut'
  }
})

function handleChartClick(params) {
  if (params.componentType === 'series') {
    const country = props.yearData
      .slice()
      .sort((a, b) => a.evMarketShare - b.evMarketShare)[params.dataIndex]
    if (country) {
      emit('select-country', country.country)
    }
  }
}
</script>

<template>
  <EChartsWrapper
    :option="chartOption"
    @click="handleChartClick"
  />
</template>
