import { dataPath, writeJson, roundTo } from '../lib/utils.js'

/**
 * Build multiple linear regression model for Policy Sandbox.
 * Features: subsidy, log(charging+1), fuel_price, electricity_price, regulation_score, log(gdp+1)
 * Target: ev_market_share
 * Uses OLS: beta = (X^T X)^{-1} X^T y
 */
export async function buildPolicyModel(evVsPetrolRows) {
  console.log('\n📉 Building policy sandbox regression model...')

  // Prepare training data: average across segments per country-year, use ICE rows
  const byKey = {}
  for (const r of evVsPetrolRows) {
    if (r.powertrain_type !== 'ICE') continue
    const key = `${r.country}|${r.year}`
    if (!byKey[key]) byKey[key] = []
    byKey[key].push(r)
  }

  const trainingData = []
  for (const rows of Object.values(byKey)) {
    const n = rows.length
    const avg = {
      evSubsidyUsd: rows.reduce((s, r) => s + (r.ev_subsidy_usd || 0), 0) / n,
      chargingStations: rows.reduce((s, r) => s + (r.charging_stations || 0), 0) / n,
      fuelPrice: rows.reduce((s, r) => s + (r.fuel_price_usd_per_liter || 0), 0) / n,
      electricityPrice: rows.reduce((s, r) => s + (r.electricity_price_usd_per_kwh || 0), 0) / n,
      regulationScore: rows.reduce((s, r) => s + (r.emission_regulation_score || 0), 0) / n,
      gdpPerCapita: rows.reduce((s, r) => s + (r.gdp_per_capita || 0), 0) / n,
      evMarketShare: rows.reduce((s, r) => s + (r.ev_market_share || 0), 0) / n,
      country: rows[0].country,
      year: rows[0].year,
    }
    trainingData.push(avg)
  }

  console.log(`  Training samples: ${trainingData.length}`)

  // Feature definitions with transforms (name maps to trainingData property names)
  const features = [
    { name: 'evSubsidyUsd', label: 'Subsidy (USD)', transform: 'raw', rawName: 'ev_subsidy_usd' },
    { name: 'chargingStations', label: 'Charging Stations', transform: 'log', rawName: 'charging_stations' },
    { name: 'fuelPrice', label: 'Fuel Price (USD/L)', transform: 'raw', rawName: 'fuel_price_usd_per_liter' },
    { name: 'electricityPrice', label: 'Electricity Price (USD/kWh)', transform: 'raw', rawName: 'electricity_price_usd_per_kwh' },
    { name: 'regulationScore', label: 'Regulation Score', transform: 'raw', rawName: 'emission_regulation_score' },
    { name: 'gdpPerCapita', label: 'GDP per Capita (USD)', transform: 'log', rawName: 'gdp_per_capita' },
  ]

  // Build feature matrix X and target vector y
  const X = trainingData.map(d => {
    const row = [1] // intercept
    for (const f of features) {
      const rawVal = d[f.name]
      row.push(f.transform === 'log' ? Math.log(rawVal + 1) : rawVal)
    }
    return row
  })
  const y = trainingData.map(d => d.evMarketShare)

  // OLS: beta = (X^T X)^{-1} X^T y
  const XtX = matMul(transpose(X), X)
  const XtXinv = matInverse(XtX)
  const Xty = matVecMul(transpose(X), y)
  const beta = matVecMul(XtXinv, Xty)

  // Predictions
  const predicted = X.map(row => row.reduce((s, v, i) => s + v * beta[i], 0))

  // R-squared
  const meanY = y.reduce((s, v) => s + v, 0) / y.length
  const ssTot = y.reduce((s, v) => s + (v - meanY) ** 2, 0)
  const ssRes = y.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0)
  const r2 = 1 - ssRes / ssTot
  const rmse = Math.sqrt(ssRes / y.length)

  // Sensitivity analysis: drop each feature and measure R² drop
  const sensitivity = []
  for (let fi = 0; fi < features.length; fi++) {
    // Build X without this feature
    const Xreduced = X.map(row => {
      const newRow = [1]
      for (let j = 0; j < features.length; j++) {
        if (j !== fi) newRow.push(row[j + 1])
      }
      return newRow
    })

    try {
      const XtXr = matMul(transpose(Xreduced), Xreduced)
      const XtXinvR = matInverse(XtXr)
      const XtyR = matVecMul(transpose(Xreduced), y)
      const betaR = matVecMul(XtXinvR, XtyR)
      const predR = Xreduced.map(row => row.reduce((s, v, i) => s + v * betaR[i], 0))
      const ssResR = y.reduce((s, v, i) => s + (v - predR[i]) ** 2, 0)
      const r2R = 1 - ssResR / ssTot
      sensitivity.push({
        feature: features[fi].rawName,
        label: features[fi].label,
        partialR2: roundTo(r2 - r2R, 4),
        marginalEffect: roundTo(Math.abs(beta[fi + 1]), 6),
      })
    } catch {
      sensitivity.push({
        feature: features[fi].rawName,
        label: features[fi].label,
        partialR2: 0,
        marginalEffect: roundTo(Math.abs(beta[fi + 1]), 6),
      })
    }
  }
  sensitivity.sort((a, b) => b.partialR2 - a.partialR2)
  sensitivity.forEach((s, i) => s.importanceRank = i + 1)

  // Feature ranges for slider config
  const featureRanges = features.map((f, idx) => {
    const vals = trainingData.map(d => d[f.name])
    return {
      name: f.rawName,
      label: f.label,
      transform: f.transform,
      range: {
        min: roundTo(Math.min(...vals), 2),
        max: roundTo(Math.max(...vals), 2),
        default: roundTo(vals.reduce((s, v) => s + v, 0) / vals.length, 2),
        step: f.name === 'regulationScore' ? 1 : roundTo((Math.max(...vals) - Math.min(...vals)) / 100, 4),
      },
      coefficient: roundTo(beta[idx + 1], 8),
    }
  })

  // Actual vs predicted
  const actualVsPredicted = trainingData.map((d, i) => ({
    country: d.country,
    year: d.year,
    actualMarketShare: roundTo(d.evMarketShare, 4),
    predictedMarketShare: roundTo(predicted[i], 4),
    residual: roundTo(d.evMarketShare - predicted[i], 4),
  }))

  // Time projection (global average per year)
  const yearProjection = {}
  for (const d of actualVsPredicted) {
    if (!yearProjection[d.year]) yearProjection[d.year] = { actual: [], predicted: [] }
    yearProjection[d.year].actual.push(d.actualMarketShare)
    yearProjection[d.year].predicted.push(d.predictedMarketShare)
  }
  const timeProjection = Object.entries(yearProjection).map(([yr, v]) => ({
    year: Number(yr),
    globalAvgMarketShare: roundTo(v.actual.reduce((a, b) => a + b, 0) / v.actual.length, 4),
  })).sort((a, b) => a.year - b.year)

  const result = {
    model: {
      type: 'multiple_linear_regression',
      features: featureRanges,
      intercept: roundTo(beta[0], 8),
      r2: roundTo(r2, 4),
      rmse: roundTo(rmse, 4),
      n: trainingData.length,
    },
    actualVsPredicted,
    sensitivityAnalysis: sensitivity,
    timeProjection,
  }

  await writeJson(dataPath('act3', 'policy-sandbox-model.json'), result)
  console.log(`  R² = ${roundTo(r2, 4)}, RMSE = ${roundTo(rmse, 4)}, n = ${trainingData.length}`)
}

// === Simple matrix operations ===

function transpose(m) {
  if (m.length === 0) return []
  const rows = m.length, cols = m[0].length
  const result = Array.from({ length: cols }, () => Array(rows))
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      result[j][i] = m[i][j]
  return result
}

function matMul(a, b) {
  const m = a.length, n = b[0].length, p = b.length
  const result = Array.from({ length: m }, () => Array(n).fill(0))
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < p; k++)
        result[i][j] += a[i][k] * b[k][j]
  return result
}

function matVecMul(m, v) {
  return m.map(row => row.reduce((s, val, i) => s + val * v[i], 0))
}

function matInverse(m) {
  const n = m.length
  // Augment with identity
  const aug = m.map((row, i) => [...row.map(v => v), ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)])

  // Gauss-Jordan elimination
  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) maxRow = k
    }
    ;[aug[i], aug[maxRow]] = [aug[maxRow], aug[i]]

    const pivot = aug[i][i]
    if (Math.abs(pivot) < 1e-10) throw new Error('Singular matrix')
    for (let j = 0; j < 2 * n; j++) aug[i][j] /= pivot

    for (let k = 0; k < n; k++) {
      if (k === i) continue
      const factor = aug[k][i]
      for (let j = 0; j < 2 * n; j++) aug[k][j] -= factor * aug[i][j]
    }
  }

  return aug.map(row => row.slice(n))
}
