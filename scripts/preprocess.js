#!/usr/bin/env node

/**
 * Data Preprocessing Pipeline
 * Transforms raw dataset files into clean JSON for Vue components.
 * Usage: node scripts/preprocess.js
 */

import { processEvVsPetrol } from './processors/process-ev-vs-petrol.js'
import { processGlobalEv2026 } from './processors/process-global-ev-2026.js'
import { processWaPopulation } from './processors/process-wa-population.js'
import { processIeaExplorer } from './processors/process-iea-explorer.js'
import { processPaperData } from './processors/process-paper-data.js'
import { buildBatteryTrend } from './processors/build-battery-trend.js'
import { buildBatteryTrendV2 } from './processors/build-battery-trend-v2.js'
import { processIeaGrowth } from './processors/process-iev-growth.js'
import { processChargingInfrastructure } from './processors/process-charging-data.js'
import { processEnergyData } from './processors/process-energy-data.js'
import { buildPolicyModel } from './processors/build-policy-model.js'
import { writeJson, dataPath } from './lib/utils.js'

async function main() {
  const startTime = Date.now()
  console.log('🔄 EV Data Preprocessing Pipeline')
  console.log('===================================\n')

  try {
    // Step 2: CSV processors (parallel-safe, but run sequentially for clarity)
    const evVsPetrolResult = await processEvVsPetrol()
    const globalEv2026Result = await processGlobalEv2026()
    await processWaPopulation()

    // Step 3: XLSX processors
    const ieaResult = await processIeaExplorer()
    const paperResult = await processPaperData()

    // Output china-market-structure.json from paper data
    if (paperResult.classSummary) {
      const classLabels = ['A00', 'A0', 'A', 'B', 'C']
      const years = paperResult.classSummary.map(d => d.year)
      await writeJson(dataPath('act2', 'china-market-structure.json'), {
        classes: classLabels,
        years,
        data: paperResult.classSummary,
        representativeModels: {
          'A00': [{ name: 'Wuling Hongguang MINIEV', priceRangeCny: '3-5万' }],
          'A0': [{ name: 'Chery eQ1', priceRangeCny: '6-8万' }],
          'A': [{ name: 'BYD Qin Plus EV', priceRangeCny: '12-17万' }],
          'B': [{ name: 'Tesla Model 3', priceRangeCny: '23-33万' }, { name: 'BYD Han EV', priceRangeCny: '21-29万' }],
          'C': [{ name: 'NIO ET7', priceRangeCny: '45-53万' }, { name: 'BYD Seal', priceRangeCny: '21-29万' }],
        },
      })
    }

    // Step 4: Derived data
    await buildBatteryTrend(paperResult)
    await buildBatteryTrendV2()  // Triple model fitting with OWID 1991-2024 data
    await processIeaGrowth()
    await processChargingInfrastructure()
    await processEnergyData()
    await buildPolicyModel(evVsPetrolResult.rows)

    // Done
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n✅ Preprocessing complete in ${elapsed}s`)
    console.log('===================================')

  } catch (err) {
    console.error('\n❌ Preprocessing failed:')
    console.error(err)
    process.exit(1)
  }
}

main()
