import { dataPath, writeJson, roundTo } from '../lib/utils.js'

/**
 * Fit exponential decay model: price = a * exp(-b * (year - year0))
 * Via log-linearization: ln(price) = ln(a) - b * (year - year0)
 */
export async function buildBatteryTrend(paperData) {
  console.log('\n📈 Building battery price trend with exponential prediction...')
  const actual = paperData.batteryPrice

  if (!actual || actual.length === 0) {
    console.log('  ⚠ No actual battery price data available')
    return
  }

  const year0 = actual[0].year

  // Log-linear regression: ln(price) = ln(a) - b * t, where t = year - year0
  const points = actual.map(a => ({
    t: a.year - year0,
    lnPrice: Math.log(Math.max(a.priceUsdPerKwh, 0.01)),
  }))

  const n = points.length
  const sumT = points.reduce((s, p) => s + p.t, 0)
  const sumLnY = points.reduce((s, p) => s + p.lnPrice, 0)
  const sumT2 = points.reduce((s, p) => s + p.t * p.t, 0)
  const sumTLnY = points.reduce((s, p) => s + p.t * p.lnPrice, 0)

  // Solve: ln(a) = intercept, b = slope (negative)
  const denom = n * sumT2 - sumT * sumT
  const slope = (n * sumTLnY - sumT * sumLnY) / denom  // this is -b
  const intercept = (sumLnY - slope * sumT) / n          // this is ln(a)

  const a = Math.exp(intercept)
  const b = -slope  // b should be positive (decay rate)

  // Compute R-squared
  const meanLnY = sumLnY / n
  let ssTot = 0, ssRes = 0
  for (const p of points) {
    const predicted = intercept + slope * p.t
    ssTot += (p.lnPrice - meanLnY) ** 2
    ssRes += (p.lnPrice - predicted) ** 2
  }
  const r2 = 1 - ssRes / ssTot

  // Standard error for confidence interval
  const se = Math.sqrt(ssRes / (n - 2))
  const t95 = 2.306 // t-value for 95% CI with ~8 df

  // Generate predicted values with confidence band
  const lastActualYear = actual[actual.length - 1].year
  const predicted = []
  for (let yr = Math.max(lastActualYear + 1, 2020); yr <= 2030; yr++) {
    const t = yr - year0
    const price = a * Math.exp(-b * t)
    const lnPriceLow = intercept + slope * t - t95 * se
    const lnPriceHigh = intercept + slope * t + t95 * se
    predicted.push({
      year: yr,
      priceUsdPerKwh: roundTo(price, 2),
      confidenceLower: roundTo(Math.exp(lnPriceLow), 2),
      confidenceUpper: roundTo(Math.exp(lnPriceHigh), 2),
    })
  }

  const result = {
    actual: actual.map(a => ({ year: a.year, priceUsdPerKwh: a.priceUsdPerKwh })),
    predicted: {
      model: 'exponential_decay',
      parameters: { a: roundTo(a, 4), b: roundTo(b, 6) },
      r2: roundTo(r2, 4),
      data: predicted,
    },
    milestones: [
      { year: 2010, label: '$1,160/kWh — Battery more expensive than gold' },
      { year: 2015, label: '$373 — Model S era, cost halved' },
      { year: 2020, label: '~$130 — Chinese A00-class achieves price parity' },
      { year: 2024, label: '~$55 — Approaching $100 cost parity threshold' },
      { year: 2030, label: '~$15 — Battery no longer the cost bottleneck' },
    ],
    thresholds: [
      { value: 100, label: 'Cost parity threshold ($100/kWh)' },
    ],
  }

  await writeJson(dataPath('act2', 'battery-price-trend.json'), result)
  console.log(`  Model: price = ${roundTo(a, 2)} × exp(-${roundTo(b, 4)} × t), R² = ${roundTo(r2, 4)}`)
  console.log(`  2030 prediction: $${roundTo(predicted[predicted.length - 1].priceUsdPerKwh, 2)}/kWh`)
}
