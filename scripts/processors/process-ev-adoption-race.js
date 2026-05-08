import { readJson, writeJson, dataPath } from '../lib/utils.js'

const COUNTRIES = [
  { name: 'Norway', label: 'NO' },
  { name: 'Sweden', label: 'SE' },
  { name: 'Denmark', label: 'DK' },
  { name: 'China', label: 'CN' },
  { name: 'Netherlands', label: 'NL' },
  { name: 'United Kingdom', label: 'UK' },
  { name: 'France', label: 'FR' },
  { name: 'Germany', label: 'DE' },
  { name: 'USA', label: 'US' },
  { name: 'World', label: 'World' },
]

export async function processEvAdoptionRace() {
  const source = await readJson(dataPath('shared', 'iea-ev-sales-by-country.json'))

  const series = COUNTRIES.map(({ name, label }) => {
    const entry = source.data.find(
      d => d.regionCountry === name
        && d.parameter === 'EV sales share'
        && d.mode === 'Cars'
        && d.powertrain === 'EV'
        && d.category === 'Historical',
    )

    if (!entry) {
      console.warn(`  ⚠ No EV sales share data for ${name}`)
      return null
    }

    const yearly = entry.yearlyData
    const years = Object.keys(yearly).sort()
    return {
      country: name,
      label,
      data: years.map(y => ({ year: Number(y), share: yearly[y] })),
    }
  }).filter(Boolean)

  const allYears = [...new Set(series.flatMap(s => s.data.map(d => d.year)))].sort()

  await writeJson(dataPath('act2', 'ev-adoption-race.json'), {
    countries: series.map(s => ({ country: s.country, label: s.label })),
    years: allYears,
    series,
  })
}
