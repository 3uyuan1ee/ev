import { computed } from 'vue'
import { useTheme } from './useTheme'
import colorConfig from '@/data/shared/color-config.json'

/**
 * ECharts theme config — reactive to dark/light mode
 * Uses the five-color palette: Mauve, Coral, Crimson, Wheat, Sand
 */
export function useChartTheme() {
  const { isDark } = useTheme()

  const chartPalette = computed(() => {
    if (isDark.value) {
      return [
        '#A8A7D0', '#F09A8E', '#F07568', '#E8D4B8', '#D5D0C5',
        '#9493BE', '#E88A7E', '#DA6860', '#D4C4A2', '#C4BFB5',
      ]
    }
    return colorConfig.chartPalette
  })

  const themeConfig = computed(() => {
    const dark = isDark.value

    return {
      color: chartPalette.value,
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
        color: dark ? '#B0A8A0' : '#6B6560',
      },
      title: {
        textStyle: {
          color: dark ? '#EAE7DC' : '#3A3630',
          fontSize: 16,
          fontWeight: 600,
        },
        subtextStyle: {
          color: dark ? '#B0A8A0' : '#6B6560',
        },
      },
      legend: {
        textStyle: {
          color: dark ? '#B0A8A0' : '#6B6560',
          fontSize: 12,
        },
      },
      tooltip: {
        backgroundColor: dark ? '#33303A' : '#FFFFFF',
        borderColor: dark ? '#4A4550' : '#D8C3A5',
        borderWidth: 1,
        textStyle: {
          color: dark ? '#EAE7DC' : '#3A3630',
          fontSize: 13,
        },
        extraCssText: `border-radius: 8px; box-shadow: ${dark
          ? '0 4px 16px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(58,54,48,0.12)'
        };`,
      },
      grid: {
        containLabel: false,
      },
      xAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: dark ? '#B0A8A0' : '#6B6560',
          fontSize: 11,
        },
        splitLine: { show: false },
      },
      yAxis: {
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: dark ? '#B0A8A0' : '#6B6560',
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: dark ? 'rgba(234,231,220,0.08)' : 'rgba(58,54,48,0.06)',
            type: 'dashed',
          },
        },
      },
    }
  })

  return {
    isDark,
    themeConfig,
    chartPalette,
  }
}
