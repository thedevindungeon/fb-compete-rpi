import type { TeamData, GameData } from './types'

/**
 * Generate a large dataset for testing RPI calculations with many teams and games
 * This simulates a scenario with 10k+ record lookups
 */
export function generateLargeDataset(options?: {
  teamCount?: number
  gamesPerTeam?: number
  competitiveLevels?: number[]
}): TeamData[] {
  const {
    teamCount = 100,
    gamesPerTeam = 50,
    competitiveLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  } = options || {}

  const teams: TeamData[] = []

  // Generate teams
  for (let i = 1; i <= teamCount; i++) {
    const competitiveLevel =
      competitiveLevels[Math.floor(Math.random() * competitiveLevels.length)]
    const games: GameData[] = []

    // Generate games for this team
    // Each team plays against other teams
    const opponents = new Set<number>()
    while (opponents.size < gamesPerTeam) {
      const opponentId = Math.floor(Math.random() * teamCount) + 1
      if (opponentId !== i) {
        opponents.add(opponentId)
      }
    }

    opponents.forEach((opponentId) => {
      // Get opponent's competitive level (simulate)
      const opponentLevel =
        competitiveLevels[Math.floor(Math.random() * competitiveLevels.length)]
      const competitiveLevelDiff = opponentLevel - competitiveLevel

      // Generate scores (higher level teams tend to score more)
      const teamBaseScore = 50 + competitiveLevel * 5 + Math.random() * 30
      const opponentBaseScore = 50 + opponentLevel * 5 + Math.random() * 30

      // Add some randomness
      let teamScore = Math.max(0, Math.floor(teamBaseScore + (Math.random() - 0.5) * 20))
      let opponentScore = Math.max(0, Math.floor(opponentBaseScore + (Math.random() - 0.5) * 20))

      // Ensure different scores (no exact ties for simplicity)
      if (teamScore === opponentScore) {
        if (Math.random() > 0.5) {
          teamScore = teamScore + 1
        } else {
          opponentScore = opponentScore + 1
        }
      }

      const isWin = teamScore > opponentScore
      const isTie = false // Simplified for large datasets

      games.push({
        opponentId,
        teamScore,
        opponentScore,
        isWin,
        isTie,
        competitiveLevelDiff,
      })
    })

    teams.push({
      id: i,
      name: `Team ${i.toString().padStart(3, '0')}`,
      games,
      competitiveLevel,
    })
  }

  return teams
}

/**
 * Get statistics about a generated dataset
 */
export function getDatasetInfo(teams: TeamData[]): {
  teamCount: number
  totalGames: number
  uniqueOpponentPairs: number
  averageGamesPerTeam: number
  estimatedLookups: number
} {
  const teamCount = teams.length
  const totalGames = teams.reduce((sum, team) => sum + team.games.length, 0)
  const averageGamesPerTeam = totalGames / teamCount

  // Count unique opponent pairs
  const pairs = new Set<string>()
  teams.forEach((team) => {
    team.games.forEach((game) => {
      const pair = [team.id, game.opponentId].sort().join('-')
      pairs.add(pair)
    })
  })

  // Estimate lookups: for OCLWP, we need to look up each opponent
  // For OOCLWP, we need to look up each opponent's opponents
  // Rough estimate: totalGames * 2 (for OCLWP and OOCLWP calculations)
  const estimatedLookups = totalGames * 2

  return {
    teamCount,
    totalGames,
    uniqueOpponentPairs: pairs.size,
    averageGamesPerTeam: Math.round(averageGamesPerTeam * 100) / 100,
    estimatedLookups,
  }
}

