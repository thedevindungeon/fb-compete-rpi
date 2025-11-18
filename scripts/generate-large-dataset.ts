import { writeFileSync } from 'fs'
import { join } from 'path'
import { generateLargeDataset, getDatasetInfo } from '../lib/generate-large-dataset'
import { getDatasetStats } from '../lib/data-export'

/**
 * Generate a large dataset for testing RPI calculations
 * Usage: npx tsx scripts/generate-large-dataset.ts [teamCount] [gamesPerTeam]
 */
function main() {
  const teamCount = parseInt(process.argv[2]) || 200
  const gamesPerTeam = parseInt(process.argv[3]) || 100

  console.log(`Generating dataset: ${teamCount} teams × ${gamesPerTeam} games per team...`)
  const startTime = Date.now()

  const teams = generateLargeDataset({ teamCount, gamesPerTeam })
  const generationTime = Date.now() - startTime

  const info = getDatasetInfo(teams)
  const stats = getDatasetStats(teams)

  console.log('\nDataset Generated:')
  console.log(`  Teams: ${info.teamCount}`)
  console.log(`  Total Games: ${info.totalGames.toLocaleString()}`)
  console.log(`  Unique Opponent Pairs: ${info.uniqueOpponentPairs.toLocaleString()}`)
  console.log(`  Average Games per Team: ${info.averageGamesPerTeam}`)
  console.log(`  Estimated Lookups: ${info.estimatedLookups.toLocaleString()}`)
  console.log(`  File Size: ${stats.fileSizeEstimate}`)
  console.log(`  Generation Time: ${generationTime}ms`)

  // Save to file
  const filename = `rpi-dataset-${teamCount}teams-${gamesPerTeam}games-${new Date().toISOString().split('T')[0]}.json`
  const filepath = join(process.cwd(), 'public', filename)
  
  const jsonContent = JSON.stringify(teams, null, 2)
  writeFileSync(filepath, jsonContent, 'utf-8')

  console.log(`\nDataset saved to: ${filepath}`)
  console.log(`\nYou can now upload this file using the Upload Dataset panel in the app.`)
}

main()

