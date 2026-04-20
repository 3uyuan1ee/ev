<script setup>
import { computed, ref } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import brandCompetition from '@/data/act2/brand-competition.json'
import colorConfig from '@/data/shared/color-config.json'
import { useChartTheme } from '@/composables/useChartTheme'
import { useI18n } from '@/i18n/useI18n'

const { themeConfig, chartPalette } = useChartTheme()
const { t } = useI18n()

const props = defineProps({
  height: { type: String, default: '400px' },
})

const selectedCountry = ref('China')
const selectedVehicleType = ref('Car')

const brandColors = colorConfig.brandColors || {}

const filteredData = computed(() => {
  return brandCompetition.data.filter(
    d => d.country === selectedCountry.value && d.vehicleType === selectedVehicleType.value
  )
})

const brandVehicleLabelMap = {
  Car: 'act2.brandVehicleCar',
  SUV: 'act2.brandVehicleSuv',
  Truck: 'act2.brandVehicleTruck',
  Bus: 'act2.brandVehicleBus',
}

const countryOptions = computed(() => brandCompetition.countries.map(c => ({ value: c, label: c })))
const vehicleTypeOptions = computed(() => brandCompetition.vehicleTypes.map(v => ({ value: v, label: t(brandVehicleLabelMap[v] || v) })))

const option = computed(() => {
  const textColor = themeConfig.value.textStyle.color
  const fallbackColor = chartPalette.value[0]

  const data = filteredData.value.map(d => ({
    value: [d.salesUnits, d.avgPriceUsd, d.batteryCapacityKwh],
    name: d.brand,
    itemStyle: {
      color: brandColors[d.brand] || fallbackColor,
    },
  }))

  return {
    ...themeConfig.value,
    tooltip: {
      ...themeConfig.value.tooltip,
      formatter(params) {
        const d = filteredData.value[params.dataIndex]
        if (!d) return ''
        return `<b>${d.brand}</b><br/>
          ${t('chart.brandTooltipSales', { value: (d.salesUnits / 1e6).toFixed(1) })}<br/>
          ${t('chart.brandTooltipAvgPrice', { value: d.avgPriceUsd.toLocaleString() })}<br/>
          ${t('chart.brandTooltipBattery', { value: d.batteryCapacityKwh })}<br/>
          ${t('chart.brandTooltipRange', { value: d.rangeKm })}`
      },
    },
    grid: {
      top: 24,
      right: 24,
      bottom: 48,
      left: 70,
    },
    xAxis: {
      ...themeConfig.value.xAxis,
      name: t('chart.brandXAxisName'),
      nameLocation: 'middle',
      nameGap: 30,
      type: 'value',
      axisLabel: { ...themeConfig.value.xAxis.axisLabel, formatter: v => `${(v / 1e6).toFixed(0)}M` },
    },
    yAxis: {
      ...themeConfig.value.yAxis,
      name: t('chart.brandYAxisName'),
      nameLocation: 'middle',
      nameGap: 50,
      type: 'value',
      axisLabel: { ...themeConfig.value.yAxis.axisLabel, formatter: v => `$${(v / 1000).toFixed(0)}k` },
    },
    series: [{
      type: 'scatter',
      data: data.map(d => ({
        ...d,
        symbolSize: Math.max(12, d.value[2] / 4),
      })),
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
      },
      label: {
        show: true,
        formatter: p => p.name,
        position: 'right',
        fontSize: 10,
        color: textColor,
      },
    }],
  }
})
</script>

<template>
  <div>
    <div class="bubble-controls">
      <select
        v-model="selectedCountry"
        class="bubble-select"
      >
        <option v-for="c in countryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
      <select
        v-model="selectedVehicleType"
        class="bubble-select"
      >
        <option v-for="v in vehicleTypeOptions" :key="v.value" :value="v.value">{{ v.label }}</option>
      </select>
    </div>
    <EChartsWrapper :option="option" :height="height" />
  </div>
</template>

<style scoped>
.bubble-controls {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.bubble-select {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  font-size: var(--font-size-small);
}
</style>
