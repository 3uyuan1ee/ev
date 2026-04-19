// Unified country-to-region mapping across all datasets
// Resolves naming inconsistencies (e.g., "APAC" vs "Asia" → "Asia-Pacific")

const COUNTRY_MAP = [
  // ev_vs_petrol countries (25)
  { name: 'Australia', iso3: 'AUS', region: 'Oceania', datasets: ['ev_vs_petrol', 'global_ev_2026'] },
  { name: 'Belgium', iso3: 'BEL', region: 'Europe', datasets: ['ev_vs_petrol'] },
  { name: 'Brazil', iso3: 'BRA', region: 'South America', datasets: ['ev_vs_petrol'] },
  { name: 'Canada', iso3: 'CAN', region: 'North America', datasets: ['ev_vs_petrol', 'global_ev_2026'] },
  { name: 'China', iso3: 'CHN', region: 'Asia-Pacific', datasets: ['ev_vs_petrol', 'global_ev_2026', 'iea'] },
  { name: 'France', iso3: 'FRA', region: 'Europe', datasets: ['ev_vs_petrol', 'global_ev_2026'] },
  { name: 'Germany', iso3: 'DEU', region: 'Europe', datasets: ['ev_vs_petrol', 'global_ev_2026'] },
  { name: 'India', iso3: 'IND', region: 'Asia-Pacific', datasets: ['ev_vs_petrol', 'global_ev_2026'] },
  { name: 'Indonesia', iso3: 'IDN', region: 'Asia-Pacific', datasets: ['ev_vs_petrol'] },
  { name: 'Japan', iso3: 'JPN', region: 'Asia-Pacific', datasets: ['ev_vs_petrol', 'global_ev_2026'] },
  { name: 'Mexico', iso3: 'MEX', region: 'North America', datasets: ['ev_vs_petrol'] },
  { name: 'Netherlands', iso3: 'NLD', region: 'Europe', datasets: ['ev_vs_petrol'] },
  { name: 'Norway', iso3: 'NOR', region: 'Europe', datasets: ['ev_vs_petrol', 'global_ev_2026'] },
  { name: 'South Korea', iso3: 'KOR', region: 'Asia-Pacific', datasets: ['ev_vs_petrol'] },
  { name: 'Sweden', iso3: 'SWE', region: 'Europe', datasets: ['ev_vs_petrol'] },
  { name: 'Thailand', iso3: 'THA', region: 'Asia-Pacific', datasets: ['ev_vs_petrol'] },
  { name: 'United Arab Emirates', iso3: 'ARE', region: 'Middle East', datasets: ['ev_vs_petrol'] },
  { name: 'United Kingdom', iso3: 'GBR', region: 'Europe', datasets: ['ev_vs_petrol', 'global_ev_2026'] },
  { name: 'United States', iso3: 'USA', region: 'North America', datasets: ['ev_vs_petrol', 'global_ev_2026', 'iea'] },
  // Additional global_ev_2026 countries
  // (all already covered above)
]

const COUNTRY_BY_NAME = Object.fromEntries(COUNTRY_MAP.map(c => [c.name, c]))

export function getCountryInfo(name) {
  // Try exact match first
  if (COUNTRY_BY_NAME[name]) return COUNTRY_BY_NAME[name]

  // Common aliases
  const aliases = {
    'USA': 'United States',
    'US': 'United States',
    'UK': 'United Kingdom',
    'South Korea': 'South Korea',
    'Korea': 'South Korea',
    'UAE': 'United Arab Emirates',
  }
  const resolved = aliases[name]
  if (resolved && COUNTRY_BY_NAME[resolved]) return COUNTRY_BY_NAME[resolved]

  return null
}

export function getUnifiedRegion(countryName) {
  const info = getCountryInfo(countryName)
  return info ? info.region : 'Other'
}

export function generateCountryRegionMap() {
  return { countries: COUNTRY_MAP }
}
