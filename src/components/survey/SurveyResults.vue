<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'

const props = defineProps({
  survey: { type: Object, required: true },
  getLabel: { type: Function, required: true },
  getQuestion: { type: Function, required: true },
})

const { chartPalette } = useChartTheme()

const option = computed(() => {
  const total = props.survey.totalVotes || 1
  const colors = chartPalette.value

  const pieData = props.survey.options.map((opt, i) => ({
    value: opt.voteCount,
    name: props.getLabel(opt),
    itemStyle: { color: colors[i % colors.length] },
  }))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(26, 25, 24, 0.92)',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      textStyle: { color: '#EAE7DC', fontSize: 13 },
      extraCssText: 'border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);',
      formatter(params) {
        return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params.color};margin-right:6px;vertical-align:middle;"></span>`
          + `<span style="vertical-align:middle;">${params.name}</span>`
          + `<br/><span style="font-size:16px;font-weight:600;margin-left:14px;">${params.value}</span>`
          + `<span style="color:rgba(234,231,220,0.5);margin-left:6px;">${((params.value / total) * 100).toFixed(0)}%</span>`
      },
    },
    graphic: [{
      type: 'text',
      left: 'center',
      top: '36%',
      style: {
        text: `${total}`,
        fill: 'rgba(234,231,220,0.9)',
        fontSize: 20,
        fontWeight: 700,
        fontFamily: "'Inter', system-ui, sans-serif",
        textAlign: 'center',
      },
    }, {
      type: 'text',
      left: 'center',
      top: '45%',
      style: {
        text: 'votes',
        fill: 'rgba(234,231,220,0.35)',
        fontSize: 11,
        fontFamily: "'Inter', system-ui, sans-serif",
        textAlign: 'center',
      },
    }],
    legend: {
      show: true,
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 8,
      textStyle: {
        color: 'rgba(234,231,220,0.55)',
        fontSize: 10,
      },
      icon: 'circle',
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scaleSize: 4,
        itemStyle: {
          shadowBlur: 16,
          shadowColor: 'rgba(0,0,0,0.3)',
        },
      },
      itemStyle: {
        borderRadius: 4,
        borderColor: '#1a1918',
        borderWidth: 2,
      },
      data: pieData,
      animationType: 'scale',
      animationEasing: 'cubicOut',
    }],
  }
})
</script>

<template>
  <div class="survey-results">
    <p class="results-question">{{ getQuestion(survey) }}</p>
    <EChartsWrapper :option="option" height="280px" />
  </div>
</template>

<style scoped>
.survey-results {
  width: 100%;
  min-width: 200px;
}

.results-question {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: var(--space-2);
  text-align: center;
  line-height: 1.4;
}
</style>
