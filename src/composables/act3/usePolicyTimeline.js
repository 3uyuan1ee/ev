import { ref, computed } from 'vue'
import heatmapData from '@/data/act3/policy-heatmap-timeseries.json'

const countries = heatmapData.countries

export function usePolicyTimeline() {
  const selectedYear = ref(2025)
  const isPlaying = ref(false)
  const playSpeed = ref(1) // seconds per year
  const selectedCountry = ref(null)

  const years = computed(() => {
    if (!countries.length) return []
    return countries[0].yearlyData.map(d => d.year)
  })

  const minYear = computed(() => years.value[0] || 2010)
  const maxYear = computed(() => years.value[years.value.length - 1] || 2025)

  /**
   * Get all countries' data for the selected year — used by the heatmap/ranking chart.
   */
  const yearData = computed(() => {
    return countries.map(c => {
      const yd = c.yearlyData.find(d => d.year === selectedYear.value)
      return {
        country: c.country,
        iso3: c.iso3,
        region: c.region,
        ...(yd || {})
      }
    }).filter(d => d.evMarketShare !== undefined)
      .sort((a, b) => b.evMarketShare - a.evMarketShare)
  })

  /**
   * Get a single country's full timeline — used for drill-down view.
   */
  const countryTimeline = computed(() => {
    if (!selectedCountry.value) return null
    const c = countries.find(c => c.country === selectedCountry.value)
    if (!c) return null
    return {
      country: c.country,
      iso3: c.iso3,
      region: c.region,
      yearlyData: c.yearlyData
    }
  })

  let playInterval = null

  function startPlayback() {
    stopPlayback()
    isPlaying.value = true
    playInterval = setInterval(() => {
      if (selectedYear.value >= maxYear.value) {
        selectedYear.value = minYear.value
      } else {
        selectedYear.value++
      }
    }, playSpeed.value * 1000)
  }

  function stopPlayback() {
    isPlaying.value = false
    if (playInterval) {
      clearInterval(playInterval)
      playInterval = null
    }
  }

  function togglePlayback() {
    if (isPlaying.value) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  function selectCountry(name) {
    selectedCountry.value = selectedCountry.value === name ? null : name
  }

  return {
    countries,
    selectedYear,
    isPlaying,
    playSpeed,
    selectedCountry,
    years,
    minYear,
    maxYear,
    yearData,
    countryTimeline,
    startPlayback,
    stopPlayback,
    togglePlayback,
    selectCountry
  }
}
