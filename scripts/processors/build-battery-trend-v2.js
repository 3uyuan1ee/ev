#!/usr/bin/env node

/**
 * Battery Price Trend Processor — Triple Model Fitting v2
 *
 * Merges OWID historical cell prices (1991-2024), then fits three models:
 *   1. Exponential Decay:         P(t) = a * exp(-b * t)
 *   2. Bounded Exponential:       P(t) = floor + a * exp(-b * t)
 *   3. Experience Curve:          P(x) = a * x^b  (x = cumulative EV stock)
 *
 * Quality-first: proper R², AIC, analytical confidence intervals.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DATASET_DIR = path.join(ROOT, 'dataset')
const DATA_DIR = path.join(ROOT, 'src/data')

function roundTo(num, decimals = 2) {
  const factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`  ✓ ${path.relative(ROOT, filePath)}`)
}

function computeGoodness(actual, predicted, numParams) {
  const n = actual.length
  const mean = actual.reduce((s, v) => s + v, 0) / n
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    ssTot += (actual[i] - mean) ** 2
    ssRes += (actual[i] - predicted[i]) ** 2
  }
  const r2 = 1 - ssRes / ssTot
  const aic = n * Math.log(ssRes / n) + 2 * numParams
  return { r2: roundTo(r2, 6), aic: roundTo(aic, 2) }
}

// ─── Model 1: Exponential Decay ───
function fitExponentialDecay(data) {
  const year0 = data[0].year
  const pts = data.map(d => ({ t: d.year - year0, lnP: Math.log(Math.max(d.price, 0.01)) }))
  const n = pts.length
  const sumT = pts.reduce((s, p) => s + p.t, 0)
  const sumLnP = pts.reduce((s, p) => s + p.lnP, 0)
  const sumT2 = pts.reduce((s, p) => s + p.t * p.t, 0)
  const sumTLnP = pts.reduce((s, p) => s + p.t * p.lnP, 0)
  const denom = n * sumT2 - sumT * sumT
  const slope = (n * sumTLnP - sumT * sumLnP) / denom
  const intercept = (sumLnP - slope * sumT) / n
  const a = Math.exp(intercept)
  const b = -slope

  const predictions = data.map(d => a * Math.exp(-b * (d.year - year0)))
  const residuals = data.map((d, i) => d.price - predictions[i])
  const { r2, aic } = computeGoodness(data.map(d => d.price), predictions, 2)

  const se = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / (n - 2))
  const t95 = 2.042 // t-value for 95% CI with ~30 df

  return {
    name: 'Exponential Decay',
    description: 'P(t) = a × exp(-b × t) — classical exponential decline',
    formula: `P(t) = ${roundTo(a, 0)} × exp(-${roundTo(b, 4)} × t)`,
    parameters: { a: roundTo(a, 4), b: roundTo(b, 6), year0 },
    predict: (year) => a * Math.exp(-b * (year - year0)),
    predictCI: (year) => {
      const t = year - year0
      const lnP = intercept + slope * t
      return {
        lower: Math.exp(lnP - t95 * se),
        upper: Math.exp(lnP + t95 * se),
      }
    },
    r2, aic, residuals,
  }
}

// ─── Model 2: Bounded Exponential (floor + exp decay) ───
// Nonlinear least squares via Levenberg-Marquardt
function fitBoundedExponential(data, floorPrice = 50) {
  const year0 = data[0].year
  const L = floorPrice

  // Initial guesses
  let a = data[0].price - L
  let b = 0.1
  const maxIter = 1000
  const lambda0 = 0.001
  let lambda = lambda0

  for (let iter = 0; iter < maxIter; iter++) {
    let JtJ = [[0, 0], [0, 0]]
    let JtR = [0, 0]
    let ssRes = 0

    for (const d of data) {
      const t = d.year - year0
      const expTerm = Math.exp(-b * t)
      const pred = L + a * expTerm
      const residual = d.price - pred
      const da = expTerm
      const db = -a * t * expTerm

      JtJ[0][0] += da * da + lambda
      JtJ[0][1] += da * db
      JtJ[1][0] += db * da
      JtJ[1][1] += db * db + lambda
      JtR[0] += da * residual
      JtR[1] += db * residual
      ssRes += residual * residual
    }

    const det = JtJ[0][0] * JtJ[1][1] - JtJ[0][1] * JtJ[1][0]
    if (Math.abs(det) < 1e-20) { lambda *= 10; continue }

    const daStep = (JtJ[1][1] * JtR[0] - JtJ[0][1] * JtR[1]) / det
    const dbStep = (JtJ[0][0] * JtR[1] - JtJ[1][0] * JtR[0]) / det

    // Trial step
    const aTrial = a + daStep
    const bTrial = b + dbStep

    // Compute trial SS
    let trialSS = 0
    for (const d of data) {
      const pred = L + aTrial * Math.exp(-bTrial * (d.year - year0))
      trialSS += (d.price - pred) ** 2
    }

    if (trialSS < ssRes) {
      a = aTrial
      b = bTrial
      lambda = Math.max(lambda * 0.1, 1e-10)
    } else {
      lambda *= 10
    }

    if (Math.abs(daStep) < 1e-12 && Math.abs(dbStep) < 1e-12) break
    if (b < 0) b = 0.001
  }

  const predict = (year) => L + a * Math.exp(-b * (year - year0))
  const predictions = data.map(d => predict(d.year))
  const residuals = data.map((d, i) => d.price - predictions[i])
  const { r2, aic } = computeGoodness(data.map(d => d.price), predictions, 3)

  const residSd = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / (data.length - 3))

  return {
    name: 'Bounded Exponential',
    description: `P(t) = ${L} + a × exp(-b × t) — price cannot fall below material cost floor ($${L}/kWh)`,
    formula: `P(t) = $${L} + ${roundTo(a, 0)} × exp(-${roundTo(b, 4)} × t)`,
    parameters: { a: roundTo(a, 4), b: roundTo(b, 6), floor: L, year0 },
    predict,
    predictCI: (year) => ({
      lower: Math.max(predict(year) - 2 * residSd, L),
      upper: predict(year) + 2 * residSd,
    }),
    r2, aic, residuals,
  }
}

// ─── Model 3: Experience Curve ───
// P(x) = a * x^b where x = cumulative global EV stock
function fitExperienceCurve(priceData, evStockData) {
  // Build cumulative EV stock lookup
  const stockByYear = new Map()
  for (const d of evStockData) {
    stockByYear.set(d.year, d.stock)
  }

  // Filter price data to years where we have stock data
  const paired = priceData
    .map(d => ({ year: d.year, price: d.price, stock: stockByYear.get(d.year) }))
    .filter(d => d.stock && d.stock > 0)

  if (paired.length < 5) {
    console.log('  ⚠ Not enough paired data for Experience Curve, using 2010+ only')
    // Fallback: use log-linear model on post-2010 data
    return null
  }

  const n = paired.length
  const sumLnX = paired.reduce((s, p) => s + Math.log(p.stock), 0)
  const sumLnY = paired.reduce((s, p) => s + Math.log(p.price), 0)
  const sumLnX2 = paired.reduce((s, p) => s + Math.log(p.stock) ** 2, 0)
  const sumLnXLnY = paired.reduce((s, p) => s + Math.log(p.stock) * Math.log(p.price), 0)

  const denom = n * sumLnX2 - sumLnX * sumLnX
  const b = (n * sumLnXLnY - sumLnX * sumLnY) / denom  // should be negative (price drops with scale)
  const lnA = (sumLnY - b * sumLnX) / n
  const a = Math.exp(lnA)

  // Experience rate: each doubling of production reduces price by (1-2^b)*100 %
  const doublingRate = roundTo((1 - Math.pow(2, b)) * 100, 1)

  const predictFromStock = (stock) => a * Math.pow(stock, b)

  // For year-based prediction, need stock lookup
  const predict = (year) => {
    const stock = stockByYear.get(year)
    if (stock) return predictFromStock(stock)
    // Extrapolate: estimate future stock from last known growth rate
    const lastYear = Math.max(...Array.from(stockByYear.keys()))
    const lastStock = stockByYear.get(lastYear)
    // Use ~25% annual growth for extrapolation
    const growthRate = 0.25
    const estStock = lastStock * Math.pow(1 + growthRate, year - lastYear)
    return predictFromStock(estStock)
  }

  const predictions = paired.map(p => predictFromStock(p.stock))
  const residuals = paired.map((p, i) => p.price - predictions[i])
  const { r2, aic } = computeGoodness(paired.map(p => p.price), predictions, 2)

  const residSd = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / (n - 2))

  return {
    name: 'Experience Curve',
    description: `P(x) = a × x^b — price vs cumulative production (Wright's Law), ${doublingRate}% cost reduction per doubling`,
    formula: `P(x) = ${roundTo(a, 2)} × x^(${roundTo(b, 4)}), doubling rate: ${doublingRate}%`,
    parameters: { a: roundTo(a, 4), b: roundTo(b, 6), doublingRate, yearStart: paired[0].year },
    predict,
    predictCI: (year) => {
      const p = predict(year)
      return { lower: Math.max(p - 2 * residSd, 1), upper: p + 2 * residSd }
    },
    r2, aic, residuals,
    pairedDataPoints: paired.length,
  }
}

// ─── Load EV stock data from IEA CSV ───
async function loadEvStockData() {
  const csvPath = path.join(DATASET_DIR, 'data/global_ev_outlook/GEVO_EV_2025_main.csv')
  const raw = await fs.readFile(csvPath, 'utf-8')
  // Remove BOM if present
  const lines = raw.replace(/^\uFEFF/, '').trim().split('\n')
  const header = lines[0].split(',')

  const regionIdx = header.indexOf('region_country')
  const categoryIdx = header.indexOf('category')
  const paramIdx = header.indexOf('parameter')
  const modeIdx = header.indexOf('mode')
  const powertrainIdx = header.indexOf('powertrain')
  const yearIdx = header.indexOf('year')
  const valueIdx = header.indexOf('value')

  // Extract World total EV stock (all modes, all powertrains)
  const stockByYear = new Map()
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols[regionIdx] !== 'World') continue
    if (cols[paramIdx] !== 'EV stock') continue
    if (cols[categoryIdx] !== 'Historical') continue
    if (cols[modeIdx] !== 'EV') continue  // aggregate
    if (cols[powertrainIdx] !== 'EV') continue  // aggregate

    const year = parseInt(cols[yearIdx])
    const value = parseFloat(cols[valueIdx])
    if (!isNaN(year) && !isNaN(value)) {
      stockByYear.set(year, stockByYear.get(year) ? stockByYear.get(year) + value : value)
    }
  }

  // If no aggregate found, sum all modes
  if (stockByYear.size === 0) {
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols[regionIdx] !== 'World') continue
      if (cols[paramIdx] !== 'EV stock') continue
      if (cols[categoryIdx] !== 'Historical') continue

      const year = parseInt(cols[yearIdx])
      const value = parseFloat(cols[valueIdx])
      if (!isNaN(year) && !isNaN(value)) {
        stockByYear.set(year, stockByYear.get(year) ? stockByYear.get(year) + value : value)
      }
    }
  }

  return Array.from(stockByYear.entries())
    .map(([year, stock]) => ({ year, stock: Math.round(stock) }))
    .sort((a, b) => a.year - b.year)
}

// ─── Main ───
export async function buildBatteryTrendV2() {
  console.log('\n📈 Battery Price Trend — Triple Model Fitting v2')
  console.log('==================================================\n')

  // 1. Read OWID data
  const owidPath = path.join(DATASET_DIR, 'data/battery/owid_lithium_ion_battery_cell_price.csv')
  const owidRaw = await fs.readFile(owidPath, 'utf-8')
  const owidData = owidRaw.trim().split('\n').slice(1).map(line => {
    const cols = line.split(',')
    return { year: parseInt(cols[2]), price: parseFloat(cols[3]) }
  }).filter(d => !isNaN(d.year) && !isNaN(d.price) && d.price > 0)

  console.log(`  OWID data: ${owidData.length} points (${owidData[0].year}-${owidData[owidData.length - 1].year})`)

  // Deduplicate and sort
  const seen = new Map()
  for (const d of owidData) seen.set(d.year, d.price)
  const data = Array.from(seen.entries())
    .map(([year, price]) => ({ year, price }))
    .sort((a, b) => a.year - b.year)

  // 2. Load EV stock for Experience Curve
  const evStock = await loadEvStockData()
  console.log(`  EV stock data: ${evStock.length} points (${evStock[0]?.year}-${evStock[evStock.length - 1]?.year})`)

  // 3. Fit models
  console.log('\n  Fitting models...')

  const expModel = fitExponentialDecay(data)
  console.log(`  [1] ${expModel.name}: R²=${expModel.r2}, AIC=${expModel.aic}`)
  console.log(`      ${expModel.formula}`)

  const boundedModel = fitBoundedExponential(data, 50)
  console.log(`  [2] ${boundedModel.name}: R²=${boundedModel.r2}, AIC=${boundedModel.aic}`)
  console.log(`      ${boundedModel.formula}`)

  const expCurveModel = fitExperienceCurve(data, evStock)
  if (expCurveModel) {
    console.log(`  [3] ${expCurveModel.name}: R²=${expCurveModel.r2}, AIC=${expCurveModel.aic}`)
    console.log(`      ${expCurveModel.formula}`)
    console.log(`      Data points matched: ${expCurveModel.pairedDataPoints}`)
  } else {
    console.log(`  [3] Experience Curve: INSUFFICIENT DATA`)
  }

  // 4. Generate predictions to 2035
  const lastYear = data[data.length - 1].year
  const futureYears = []
  for (let yr = lastYear + 1; yr <= 2035; yr++) futureYears.push(yr)

  const buildPredictions = (model) => futureYears.map(year => {
    const ci = model.predictCI(year)
    return {
      year,
      priceUsdPerKwh: roundTo(model.predict(year), 2),
      confidenceLower: roundTo(Math.max(ci.lower, 0), 2),
      confidenceUpper: roundTo(ci.upper, 2),
    }
  })

  const expPredictions = buildPredictions(expModel)
  const boundedPredictions = buildPredictions(boundedModel)
  const expCurvePredictions = expCurveModel ? buildPredictions(expCurveModel) : []

  // 5. Build output
  const result = {
    actual: data.map(d => ({ year: d.year, priceUsdPerKwh: roundTo(d.price, 2) })),
    evStockForContext: evStock,
    models: {
      exponential_decay: {
        label: expModel.name,
        description: expModel.description,
        parameters: expModel.parameters,
        r2: expModel.r2,
        aic: expModel.aic,
        data: expPredictions,
      },
      bounded_exponential: {
        label: boundedModel.name,
        description: boundedModel.description,
        parameters: boundedModel.parameters,
        r2: boundedModel.r2,
        aic: boundedModel.aic,
        data: boundedPredictions,
      },
      ...(expCurveModel ? {
        experience_curve: {
          label: expCurveModel.name,
          description: expCurveModel.description,
          parameters: expCurveModel.parameters,
          r2: expCurveModel.r2,
          aic: expCurveModel.aic,
          data: expCurvePredictions,
        }
      } : {}),
    },
    // Backward compat: default model
    predicted: {
      model: 'exponential_decay',
      parameters: expModel.parameters,
      r2: expModel.r2,
      data: expPredictions,
    },
    anomalyYears: [2022],
    milestones: [
      { year: 1991, label: '$9,210/kWh — Lithium-ion era begins' },
      { year: 2010, label: '$1,160/kWh — First modern EVs (Nissan Leaf)' },
      { year: 2015, label: '$373 — Tesla Model S era, cost halved' },
      { year: 2020, label: '$140 — Chinese A00-class achieves price parity' },
      { year: 2024, label: '$78 — Below $100 cost parity threshold' },
    ],
    thresholds: [
      { value: 100, label: 'Cost parity threshold ($100/kWh)' },
      { value: 50, label: 'Material cost floor estimate ($50/kWh)' },
    ],
  }

  await writeJson(path.join(DATA_DIR, 'act2/battery-price-trend.json'), result)

  console.log('\n  ─── Model Comparison ───')
  console.log(`  Exponential:        R²=${expModel.r2}, AIC=${expModel.aic}, 2030: $${roundTo(expModel.predict(2030), 2)}/kWh`)
  console.log(`  Bounded Exponential: R²=${boundedModel.r2}, AIC=${boundedModel.aic}, 2030: $${roundTo(boundedModel.predict(2030), 2)}/kWh`)
  if (expCurveModel) {
    console.log(`  Experience Curve:    R²=${expCurveModel.r2}, AIC=${expCurveModel.aic}, 2030: $${roundTo(expCurveModel.predict(2030), 2)}/kWh`)
  }
  console.log('\n  ✅ Battery trend processing complete\n')
}

// Allow standalone execution
if (process.argv[1] && process.argv[1].includes('build-battery-trend-v2')) {
  buildBatteryTrendV2().catch(err => { console.error('Failed:', err); process.exit(1) })
}
