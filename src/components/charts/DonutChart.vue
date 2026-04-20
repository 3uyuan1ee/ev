<script setup>
import { computed } from 'vue'
import EChartsWrapper from './EChartsWrapper.vue'
import colorConfig from '@/data/shared/color-config.json'
import { useChartTheme } from '@/composables/useChartTheme'
import { useI18n } from '@/i18n/useI18n'

const { themeConfig } = useChartTheme()
const { t } = useI18n()

const props = defineProps({
  allSeries: { type: Array, required: true },
  powertrainLabels: { type: Array, default: () => ['ICEV', 'BEV'] },
  selectedYear: { type: Number, default: 7 },
  height: { type: String, default: '300px' },
})

const componentColors = colorConfig.costComponents

const option = computed(() => {
  const textColor = themeConfig.value.textStyle.color
  const count = props.allSeries.length
  if (count === 0) return {}

  const componentKeys = ['purchase', 'energy', 'maintenance', 'insurance', 'tax']
  const componentLabels = [
    t('chart.donutPurchase'), t('chart.donutEnergy'),
    t('chart.donutMaintenance'), t('chart.donutInsurance'), t('chart.donutTax'),
  ]

  const seriesList = []

  props.allSeries.forEach(({ powertrain, data }, index) => {
    const yearlyData = data?.yearlyData || []
    const idx = Math.min(props.selectedYear, yearlyData.length - 1)
    const label = props.powertrainLabels[index] || powertrain.toUpperCase()

    // Accumulate costs
    const accum = { purchase: yearlyData[0]?.purchase || 0, energy: 0, maintenance: 0, insurance: 0, tax: 0 }
    for (let y = 1; y <= idx; y++) {
      const d = yearlyData[y]
      if (d) {
        accum.energy += d.energy || 0
        accum.maintenance += d.maintenance || 0
        accum.insurance += d.insurance || 0
        accum.tax += d.tax || 0
      }
    }

    const pieData = componentKeys.map((key, i) => ({
      value: accum[key],
      name: componentLabels[i],
      itemStyle: { color: componentColors[key] },
    }))

    // Distribute pies horizontally
    const centerX = ((index + 0.5) / count) * 100
    const maxR = count <= 2 ? 35 : count === 3 ? 30 : 25
    const minR = count <= 2 ? 20 : count === 3 ? 17 : 14

    seriesList.push({
      name: label,
      type: 'pie',
      radius: [`${minR}%`, `${maxR}%`],
      center: [`${centerX}%`, '55%'],
      data: pieData,
      label: { show: false },
      emphasis: {
        label: { show: true, fontWeight: 'bold', fontSize: 11 },
      },
    })

    // Separate transparent pie in the hole just for the center label
    seriesList.push({
      type: 'pie',
      radius: [0, `${minR}%`],
      center: [`${centerX}%`, '55%'],
      silent: true,
      animation: false,
      data: [{
        value: 1,
        name: label,
        itemStyle: { color: 'transparent' },
        label: {
          show: true,
          position: 'inside',
          formatter: () => label,
          fontSize: 14,
          fontWeight: 'bold',
          color: textColor,
        },
      }],
    })
  })

  return {
    tooltip: {
      trigger: 'item',
      formatter(params) {
        return t('chart.donutTooltipFormat', {
          seriesName: params.seriesName,
          name: params.name,
          value: params.value.toLocaleString(),
          percent: params.percent,
        })
      },
    },
    legend: {
      data: componentLabels,
      bottom: 0,
      textStyle: { color: textColor, fontSize: 11 },
    },
    series: seriesList,
  }
})
</script>

<template>
  <EChartsWrapper :option="option" :height="height" />
</template>
