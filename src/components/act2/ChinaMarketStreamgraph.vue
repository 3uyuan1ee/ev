<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import chinaMarketStructure from '@/data/act2/china-market-structure.json'
import colorConfig from '@/data/shared/color-config.json'
import { useChartTheme } from '@/composables/useChartTheme'

const { themeConfig, chartPalette } = useChartTheme()

const props = defineProps({
  height: { type: String, default: '350px' },
})

const svgRef = ref(null)
const selectedClass = ref(null)

const classes = chinaMarketStructure.classes
const colors = colorConfig.chartPalette.slice(0, 5)

const textColor = computed(() => themeConfig.value.textStyle.color)

const representativeModels = computed(() => {
  if (!selectedClass.value) return []
  return chinaMarketStructure.representativeModels[selectedClass.value] || []
})

onMounted(() => {
  renderStreamgraph()
})

function renderStreamgraph() {
  const container = svgRef.value
  if (!container) return

  const width = container.clientWidth
  const height = 350
  const margin = { top: 20, right: 20, bottom: 40, left: 50 }

  d3.select(container).selectAll('*').remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const years = chinaMarketStructure.years
  const stackData = years.map((year, yi) => {
    const row = { year }
    chinaMarketStructure.data[yi].segments && Object.entries(chinaMarketStructure.data[yi].segments).forEach(([key, val]) => {
      row[key] = val * 100
    })
    return row
  })

  const stack = d3.stack()
    .keys(classes)
    .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderInsideOut)

  const series = stack(stackData)

  const x = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([margin.left, width - margin.right])

  const y = d3.scaleLinear()
    .domain([
      d3.min(series, s => d3.min(s, d => d[0])),
      d3.max(series, s => d3.max(s, d => d[1])),
    ])
    .range([height - margin.bottom, margin.top])

  const area = d3.area()
    .x(d => x(d.data.year))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]))
    .curve(d3.curveBasis)

  const g = svg.append('g')

  g.selectAll('path')
    .data(series)
    .join('path')
    .attr('d', area)
    .attr('fill', (d, i) => colors[i])
    .attr('opacity', (d) => selectedClass.value ? (d.key === selectedClass.value ? 0.9 : 0.2) : 0.75)
    .attr('stroke', 'white')
    .attr('stroke-width', 0.5)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      if (!selectedClass.value) {
        d3.select(this).attr('opacity', 0.95)
      }
    })
    .on('mouseout', function() {
      if (!selectedClass.value) {
        d3.select(this).attr('opacity', 0.75)
      }
    })
    .on('click', function(event, d) {
      selectedClass.value = selectedClass.value === d.key ? null : d.key
      renderStreamgraph()
    })

  // X axis
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')))
    .call(g => g.select('.domain').remove())
    .call(g => g.selectAll('.tick line').remove())
    .selectAll('text')
    .attr('fill', textColor.value)
    .attr('font-size', '11px')

  // Legend
  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${height - 8})`)
    .selectAll('g')
    .data(classes)
    .join('g')
    .attr('transform', (d, i) => `translate(${i * 55}, 0)`)

  legend.append('rect')
    .attr('width', 12)
    .attr('height', 12)
    .attr('rx', 2)
    .attr('fill', (d, i) => colors[i])

  legend.append('text')
    .attr('x', 16)
    .attr('y', 10)
    .text(d => d)
    .attr('fill', textColor.value)
    .attr('font-size', '10px')
}

// Re-render on resize
const resizeObserver = new ResizeObserver(() => renderStreamgraph())
onMounted(() => {
  if (svgRef.value) resizeObserver.observe(svgRef.value)
})
</script>

<template>
  <div>
    <div ref="svgRef" :style="{ height }" class="streamgraph-container" />
    <div v-if="selectedClass" class="model-panel">
      <h4 class="model-title">{{ selectedClass }} Class Models</h4>
      <div class="model-list">
        <div v-for="model in representativeModels" :key="model.name" class="model-item">
          <span class="model-name">{{ model.name }}</span>
          <span class="model-price">{{ model.priceRangeCny }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.streamgraph-container {
  width: 100%;
  min-height: 300px;
  background: var(--color-bg-chart);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.model-panel {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.model-title {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.model-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.model-item {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-primary);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-caption);
}

.model-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.model-price {
  color: var(--color-text-secondary);
}
</style>
