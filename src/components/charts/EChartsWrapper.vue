<script setup>
import { computed, ref, watch, onMounted, shallowRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart, ScatterChart, MapChart, EffectScatterChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DataZoomComponent, ToolboxComponent,
  MarkLineComponent, MarkPointComponent, GeoComponent,
  VisualMapComponent, GraphicComponent,
} from 'echarts/components'
import { useChartTheme } from '@/composables/useChartTheme'

// Register ECharts components
use([
  CanvasRenderer, LineChart, BarChart, PieChart, ScatterChart,
  MapChart, EffectScatterChart,
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DataZoomComponent, ToolboxComponent,
  MarkLineComponent, MarkPointComponent, GeoComponent,
  VisualMapComponent, GraphicComponent,
])

const props = defineProps({
  option: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  height: { type: String, default: '400px' },
})

const { isDark, themeConfig } = useChartTheme()
const chartRef = ref(null)

const mergedOption = computed(() => {
  return {
    ...themeConfig.value,
    ...props.option,
    // Merge nested objects
    tooltip: { ...themeConfig.value.tooltip, ...props.option.tooltip },
    legend: { ...themeConfig.value.legend, ...props.option.legend },
    xAxis: props.option.xAxis
      ? Array.isArray(props.option.xAxis)
        ? props.option.xAxis.map(ax => ({ ...themeConfig.value.xAxis, ...ax }))
        : { ...themeConfig.value.xAxis, ...props.option.xAxis }
      : themeConfig.value.xAxis,
    yAxis: props.option.yAxis
      ? Array.isArray(props.option.yAxis)
        ? props.option.yAxis.map(ax => ({ ...themeConfig.value.yAxis, ...ax }))
        : { ...themeConfig.value.yAxis, ...props.option.yAxis }
      : themeConfig.value.yAxis,
  }
})

defineExpose({ chartRef })
</script>

<template>
  <VChart
    ref="chartRef"
    class="echarts-wrapper"
    :option="mergedOption"
    :loading="loading"
    autoresize
    :style="{ height }"
  />
</template>

<style scoped>
.echarts-wrapper {
  width: 100%;
  min-height: 300px;
}
</style>
