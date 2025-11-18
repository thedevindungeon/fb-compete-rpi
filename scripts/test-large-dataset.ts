import { readFileSync } from 'fs'
import { join } from 'path'
import { parseTeamDataFromJSON, getDatasetStats } from '../lib/data-export'
import { calculateAllTeamsRPI } from '../lib/rpi-calculator'
import { DEFAULT_COEFFICIENTS } from '../lib/types'

/**
 * Test loading and calculating RPI for a large dataset
 * Usage: npx tsx scripts/test-large-dataset.ts [filename]
 */
function main() {
  const filename = process.argv[2] || 'rpi-dataset-200teams-100games-2025-11-18.json'
  const filepath = join(process.cwd(), 'public', filename)

  console.log(`Loading dataset from: ${filepath}`)
  const loadStart = Date.now()

  try {
    const fileContent = readFileSync(filepath, 'utf-8')
    const teams = parseTeamDataFromJSON(fileContent)
    const loadTime = Date.now() - loadStart

    const stats = getDatasetStats(teams)
    console.log('\nDataset Loaded:')
    console.log(`  Teams: ${stats.teamCount}`)
    console.log(`  Total Games: ${stats.totalGames.toLocaleString()}`)
    console.log(`  File Size: ${stats.fileSizeEstimate}`)
    console.log(`  Load Time: ${loadTime}ms`)

    console.log('\nCalculating RPI for all teams...')
    const calcStart = Date.now()

    const results = calculateAllTeamsRPI(teams, DEFAULT_COEFFICIENTS)
    const calcTime = Date.now() - calcStart

    console.log(`\nRPI Calculation Complete:`)
    console.log(`  Teams Processed: ${results.length}`)
    console.log(`  Calculation Time: ${calcTime}ms`)
    console.log(`  Average Time per Team: ${(calcTime / results.length).toFixed(2)}ms`)

    console.log('\nTop 10 Teams by RPI:')
    results.slice(0, 10).forEach((result, index) => {
      console.log(
        `  ${index + 1}. ${result.teamName.padEnd(15)} RPI: ${result.rpi.toFixed(4)} (${result.wins}-${result.losses}-${result.ties})`
      )
    })

    console.log('\n✅ Large dataset test successful!')
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()

