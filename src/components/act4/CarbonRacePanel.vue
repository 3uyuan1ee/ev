<script setup>
import { computed } from 'vue'
import EChartsWrapper from '@/components/charts/EChartsWrapper.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import colorConfig from '@/data/shared/color-config.json'
import { useCarbonRace } from '@/composables/act4/useCarbonRace'
import { useI18n } from '@/i18n/useI18n'

const { themeConfig } = useChartTheme()
const { t } = useI18n()

const powertrainColors = colorConfig.powertrainColors
const crossoverColor = '#8E8DBA'  // mauve from chartPalette[0]

const {
  profiles, presets, selectedVehicle, selectedPreset,
  vehicleProfile, gridPreset, raceData, crossoverYear, lifetimeSavings,
  MAX_YEARS, setVehicle, setPreset
} = useCarbonRace()

const chartOption = computed(() => {
  const data = raceData.value
  const co = crossoverYear.value

  const years = data.map(d => d.year)
  const bevSeries = data.map(d => d.bevCumulative)
  const icevSeries = data.map(d => d.icevCumulative)

  // Build crossover area data
  const markAreas = []
  if (co !== null) {
    markAreas.push([
      { xAxis: 0, yAxis: Math.min(...bevSeries.slice(0, Math.ceil(co) + 1).concat(icevSeries.slice(0, Math.ceil(co) + 1))) },
      { xAxis: co, yAxis: Math.max(...bevSeries.slice(0, Math.ceil(co) + 1).concat(icevSeries.slice(0, Math.ceil(co) + 1))) }
    ])
  }

  const icevColor = powertrainColors.icev  // '#E85A4F'
  const bevColor = powertrainColors.bev    // '#8E8DBA'

  return {
    ...themeConfig.value,
    tooltip: {
      trigger: 'axis',
      formatter(params) {
        let html = `<strong>${t('chart.carbonTooltipYear', { year: params[0].axisValue })}</strong><br/>`
        params.forEach(p => {
          html += `${p.marker} ${p.seriesName}: <strong>${p.value.toFixed(1)}t CO₂</strong><br/>`
        })
        if (params.length >= 2) {
          const diff = params[1].value - params[0].value
          const action = diff <= 0 ? t('chart.carbonTooltipSaves') : t('chart.carbonTooltipCosts')
          html += `<br/>BEV ${action}: <strong>${Math.abs(diff).toFixed(1)}t</strong>`
        }
        return html
      }
    },
    legend: {
      data: [t('chart.carbonLegendICEV'), t('chart.carbonLegendBEV')],
      top: 0,
      ...themeConfig.value.legend
    },
    grid: {
      left: 70,
      right: 30,
      top: 50,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: years,
      name: t('chart.carbonXAxisName'),
      axisLabel: {
        formatter: v => v === 0 ? t('chart.carbonXAxisPurchase') : t('chart.carbonXAxisYearFormat', { year: v })
      }
    },
    yAxis: {
      type: 'value',
      name: t('chart.carbonYAxisName'),
      axisLabel: {
        formatter: '{value}t'
      }
    },
    series: [
      {
        name: t('chart.carbonLegendICEV'),
        type: 'line',
        data: icevSeries,
        smooth: false,
        lineStyle: { width: 3, color: icevColor },
        itemStyle: { color: icevColor },
        symbol: 'circle',
        symbolSize: 5,
        areaStyle: {
          color: 'rgba(232, 90, 79, 0.08)'
        }
      },
      {
        name: t('chart.carbonLegendBEV'),
        type: 'line',
        data: bevSeries,
        smooth: false,
        lineStyle: { width: 3, color: bevColor },
        itemStyle: { color: bevColor },
        symbol: 'circle',
        symbolSize: 5,
        areaStyle: {
          color: 'rgba(142, 141, 186, 0.08)'
        },
        markLine: co !== null ? {
          symbol: 'none',
          lineStyle: { color: crossoverColor, type: 'dashed', width: 2 },
          label: {
            formatter: t('chart.carbonCrossoverMarker', { year: co }),
            position: 'insideEndTop',
            fontSize: 12,
            fontWeight: 'bold'
          },
          data: [{ xAxis: co }]
        } : undefined,
        markPoint: co !== null ? {
          data: [{
            coord: [Math.round(co), bevSeries[Math.round(co)] || 0],
            symbol: 'circle',
            symbolSize: 14,
            itemStyle: { color: crossoverColor, borderColor: '#fff', borderWidth: 2 },
            label: { show: false }
          }],
          animation: true
        } : undefined
      }
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut'
  }
})

const vehicleLabelMap = {
  compact: 'act4.raceVehicleCompact',
  midsize: 'act4.raceVehicleMidsize',
  suv: 'act4.raceVehicleSuv',
}

const gridPresetLabelMap = {
  'Norway (98% clean)': 'act4.gridPresetNorway',
  'France (90% clean)': 'act4.gridPresetFrance',
  'United Kingdom (55% clean)': 'act4.gridPresetUk',
  'United States (40% clean)': 'act4.gridPresetUs',
  'Germany (45% clean)': 'act4.gridPresetGermany',
  'Japan (35% clean)': 'act4.gridPresetJapan',
  'China (30% clean)': 'act4.gridPresetChina',
  'India (25% clean)': 'act4.gridPresetIndia',
  'Australia (30% clean)': 'act4.gridPresetAustralia',
}

const vehicleOptions = computed(() => profiles.map(p => ({ id: p.id, label: t(vehicleLabelMap[p.id] || p.label) })))
const presetOptions = computed(() => presets.map(p => ({ value: p.label, label: t(gridPresetLabelMap[p.label] || p.label) })))
</script>

<template>
  <div class="carbon-race">
    <!-- Controls -->
    <div class="race-controls">
      <div class="control-group">
        <label class="control-label">{{ t('act4.raceVehicleType') }}</label>
        <div class="btn-group">
          <button
            v-for="v in vehicleOptions"
            :key="v.id"
            class="btn-option"
            :class="{ active: selectedVehicle === v.id }"
            @click="setVehicle(v.id)"
          >
            {{ v.label }}
          </button>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">{{ t('act4.raceGridCleanliness') }}</label>
        <select class="preset-select" :value="selectedPreset" @change="setPreset($event.target.value)">
          <option v-for="opt in presetOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="race-stats">
      <div class="stat-card">
        <span class="stat-label">{{ t('act4.raceCrossoverYear') }}</span>
        <span class="stat-value stat-crossover">
          {{ crossoverYear !== null ? t('act4.raceCrossoverFormat', { year: crossoverYear }) : t('act4.raceCrossoverFallback') }}
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-label">{{ t('act4.raceGridCO2') }}</span>
        <span class="stat-value">{{ gridPreset.co2PerKwh }} kg/kWh</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">{{ t('act4.raceLifetimeSavings', { years: MAX_YEARS }) }}</span>
        <span class="stat-value" :class="{ positive: lifetimeSavings > 0, negative: lifetimeSavings < 0 }">
          {{ lifetimeSavings }}t CO₂
        </span>
      </div>
    </div>

    <!-- Chart -->
    <EChartsWrapper :option="chartOption" style="height: 380px;" />
  </div>
</template>

<style scoped>
.carbon-race {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.race-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.control-label {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.btn-group {
  display: flex;
  gap: 4px;
}

.btn-option {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-option:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-option.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.preset-select {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-small);
  cursor: pointer;
  min-width: 220px;
}

.race-stats {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  flex: 1;
  min-width: 120px;
}

.stat-label {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-text-primary);
}

.stat-crossover {
  color: var(--color-primary);
}

.stat-value.positive {
  color: var(--color-success);
}

.stat-value.negative {
  color: var(--color-error);
}
</style>
