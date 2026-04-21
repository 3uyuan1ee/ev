import XLSX from 'xlsx'
import { datasetPath, dataPath, writeJson, roundTo } from '../lib/utils.js'

export async function processPaperData() {
  console.log('\n📊 Processing Paper data...')
  
  const xlsxPath = datasetPath('Paper data.xlsx')
  let workbook
  try {
    const fs = await import('fs/promises')
    await fs.access(xlsxPath)
    workbook = XLSX.readFile(xlsxPath)
    console.log(`  Sheets: ${workbook.SheetNames.join(', ')}`)
  } catch {
    console.log('  Paper data.xlsx not found, using fallback data')
    return { batteryPrice: getFallbackBatteryPrice(), classSummary: getFallbackClassSummary() }
  }

  // === Battery Price sheet ===
  const batteryResult = extractBatteryPrice(workbook, workbook.SheetNames)

  // === Class Summary sheet ===
  const classResult = extractClassSummary(workbook, workbook.SheetNames)

  return { batteryPrice: batteryResult.actual, classSummary: classResult }
}

function extractBatteryPrice(workbook, sheetNames) {
  // Try common sheet names for battery price
  const batterySheetName = sheetNames.find(n =>
    n.toLowerCase().includes('battery price') || n.toLowerCase().includes('battery price')
  )

  if (!batterySheetName) {
    console.log('  ⚠ Battery Price sheet not found, using hardcoded fallback data')
    return { actual: getFallbackBatteryPrice() }
  }

  const sheet = workbook.Sheets[batterySheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  // Try to find year and price columns
  const actual = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    // Look for rows where first or second column looks like a year (2010-2025)
    for (let col = 0; col < Math.min(row.length, 5); col++) {
      const val = row[col]
      if (typeof val === 'number' && val >= 2010 && val <= 2025) {
        const year = val
        // Price is typically in the next or previous numeric column
        for (let priceCol = 0; priceCol < Math.min(row.length, 5); priceCol++) {
          if (priceCol === col) continue
          const price = row[priceCol]
          if (typeof price === 'number' && price > 50 && price < 2000) {
            actual.push({ year, priceUsdPerKwh: price })
            break
          }
        }
        break
      }
    }
  }

  // Deduplicate by year (take first occurrence)
  const seen = new Set()
  const deduped = actual.filter(a => {
    if (seen.has(a.year)) return false
    seen.add(a.year)
    return true
  })

  if (deduped.length < 5) {
    console.log('  ⚠ Could not extract enough battery price data, using fallback')
    return { actual: getFallbackBatteryPrice() }
  }

  deduped.sort((a, b) => a.year - b.year)
  console.log(`  Extracted ${deduped.length} battery price data points: ${deduped[0].year}–${deduped[deduped.length - 1].year}`)
  return { actual: deduped }
}

function extractClassSummary(workbook, sheetNames) {
  const classSheetName = sheetNames.find(n =>
    n.toLowerCase().includes('class') || n.toLowerCase().includes('class')
  )

  if (!classSheetName) {
    console.log('  ⚠ Class Summary sheet not found, using hardcoded fallback data')
    return getFallbackClassSummary()
  }

  const sheet = workbook.Sheets[classSheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

  // Try to extract year + class percentages
  const data = []
  const classLabels = ['A00', 'A0', 'A', 'B', 'C']

  for (const row of rows) {
    // Find year-like value
    let yearIdx = -1
    for (let i = 0; i < row.length; i++) {
      if (typeof row[i] === 'number' && row[i] >= 2015 && row[i] <= 2025) {
        yearIdx = i
        break
      }
    }
    if (yearIdx < 0) continue

    const year = row[yearIdx]
    const segments = {}
    let segIdx = 0
    for (let i = 0; i < row.length && segIdx < classLabels.length; i++) {
      if (i === yearIdx) continue
      const val = row[i]
      if (typeof val === 'number' && val >= 0 && val <= 1) {
        segments[classLabels[segIdx]] = val
        segIdx++
      }
    }

    if (Object.keys(segments).length >= 3) {
      data.push({ year, segments })
    }
  }

  if (data.length < 3) {
    console.log('  ⚠ Could not extract enough class summary data, using fallback')
    return getFallbackClassSummary()
  }

  data.sort((a, b) => a.year - b.year)
  console.log(`  Extracted ${data.length} class summary data points: ${data[0].year}–${data[data.length - 1].year}`)
  return data
}

function getFallbackBatteryPrice() {
  return [
    { year: 2010, priceUsdPerKwh: 1160 },
    { year: 2011, priceUsdPerKwh: 899 },
    { year: 2012, priceUsdPerKwh: 707 },
    { year: 2013, priceUsdPerKwh: 650 },
    { year: 2014, priceUsdPerKwh: 577 },
    { year: 2015, priceUsdPerKwh: 373 },
    { year: 2016, priceUsdPerKwh: 288 },
    { year: 2017, priceUsdPerKwh: 214 },
    { year: 2018, priceUsdPerKwh: 176 },
    { year: 2019, priceUsdPerKwh: 156 },
  ]
}

function getFallbackClassSummary() {
  return [
    { year: 2016, segments: { A00: 0.511, A0: 0.241, A: 0.177, B: 0.015, C: 0.056 } },
    { year: 2017, segments: { A00: 0.578, A0: 0.079, A: 0.270, B: 0.044, C: 0.029 } },
    { year: 2018, segments: { A00: 0.380, A0: 0.137, A: 0.365, B: 0.077, C: 0.041 } },
    { year: 2019, segments: { A00: 0.175, A0: 0.114, A: 0.533, B: 0.152, C: 0.026 } },
    { year: 2020, segments: { A00: 0.100, A0: 0.050, A: 0.570, B: 0.230, C: 0.050 } },
    { year: 2021, segments: { A00: 0.050, A0: 0.020, A: 0.600, B: 0.250, C: 0.080 } },
    { year: 2022, segments: { A00: 0.020, A0: 0.010, A: 0.550, B: 0.300, C: 0.120 } },
    { year: 2023, segments: { A00: 0.015, A0: 0.005, A: 0.500, B: 0.350, C: 0.130 } },
  ]
}
