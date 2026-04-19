<script setup>
import { computed } from 'vue'
import EChartsWrapper from './EChartsWrapper.vue'
import colorConfig from '@/data/shared/color-config.json'
import { useChartTheme } from '@/composables/useChartTheme'

const { themeConfig } = useChartTheme()

const props = defineProps({
  series1: { type: Object, required: true }, // yearlyData for inner ring
  series2: { type: Object, required: true }, // yearlyData for outer ring
  powertrainLabels: { type: Array, default: () => ['ICEV', 'BEV'] },
  selectedYear: { type: Number, default: 7 },
  height: { type: String, default: '300px' },
})

const option = computed(() => {
  const idx = Math.min(props.selectedYear, (props.series1.yearlyData?.length || 1) - 1)
  const d1 = props.series1.yearlyData?.[idx] || {}
  const d2 = props.series2.yearlyData?.[idx] || {}

  const components = ['energy', 'maintenance', 'insurance', 'tax']
  const labels = ['Energy', 'Maintenance', 'Insurance', 'Tax']

  const icevColors = colorConfig.costComponentColors.icev
  const bevColors = colorConfig.costComponentColors.bev

  const textColor = themeConfig.value.textStyle.color

  const innerData = components.map((key, i) => ({
    value: d1[key] || 0,
    name: labels[i],
    itemStyle: {
      color: icevColors[key],
    },
  }))

  const outerData = components.map((key, i) => ({
    value: d2[key] || 0,
    name: labels[i],
    itemStyle: {
      color: bevColors[key],
    },
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ${c} ({d}%)',
    },
    series: [
      {
        name: props.powertrainLabels[0],
        type: 'pie',
        radius: ['20%', '40%'],
        center: ['50%', '50%'],
        data: innerData,
        label: { show: false },
        emphasis: {
          label: { show: true, fontWeight: 'bold', fontSize: 12 },
        },
      },
      {
        name: props.powertrainLabels[1],
        type: 'pie',
        radius: ['48%', '68%'],
        center: ['50%', '50%'],
        data: outerData,
        label: { show: false },
        emphasis: {
          label: { show: true, fontWeight: 'bold', fontSize: 12 },
        },
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '42%',
        style: {
          text: `Year ${idx}`,
          fontSize: 12,
          fontFamily: 'JetBrains Mono',
          fill: textColor,
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '50%',
        style: {
          text: `${props.powertrainLabels[0]} / ${props.powertrainLabels[1]}`,
          fontSize: 10,
          fill: textColor,
        },
      },
    ],
  }
})
</script>

<template>
  <EChartsWrapper :option="option" :height="height" />
</template>
