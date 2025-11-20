import type { TeamData, GameData } from './types'

/**
 * Team name generators for more realistic data
 */
const TEAM_NAME_PREFIXES = [
  'Eagles', 'Hawks', 'Falcons', 'Panthers', 'Warriors', 'Tigers', 'Lions', 'Bears',
  'Wolves', 'Sharks', 'Dolphins', 'Rangers', 'Royals', 'Giants', 'Titans', 'Knights',
  'Dragons', 'Phoenix', 'Thunder', 'Lightning', 'Storm', 'Blaze', 'Fire', 'Ice',
  'Mustangs', 'Broncos', 'Stallions', 'Cobras', 'Vipers', 'Rattlers', 'Scorpions',
]

const TEAM_NAME_SUFFIXES = [
  'Elite', 'Premier', 'Pro', 'Select', 'Academy', 'Club', 'United', 'Dynasty',
  'Legends', 'Champions', 'Rising', 'Force', 'Power', 'Pride', 'Spirit', 'Soul',
  'Black', 'White', 'Red', 'Blue', 'Gold', 'Silver', 'Bronze', 'Crimson', 'Navy',
  'Maroon', 'Turquoise', 'Copper', 'Platinum', 'Emerald', 'Sapphire',
]

const TEAM_NAME_MODIFIERS = [
  'North', 'South', 'East', 'West', 'Central', 'United', 'FC', 'SC', 'BC',
]

/**
 * Generate a realistic team name
 */
function generateTeamName(index: number, poolIndex?: number): string {
  const prefix = TEAM_NAME_PREFIXES[Math.floor(Math.random() * TEAM_NAME_PREFIXES.length)]
  const suffix = TEAM_NAME_SUFFIXES[Math.floor(Math.random() * TEAM_NAME_SUFFIXES.length)]
  
  // Sometimes add a modifier
  let name = `${prefix} ${suffix}`
  if (Math.random() > 0.7) {
    const modifier = TEAM_NAME_MODIFIERS[Math.floor(Math.random() * TEAM_NAME_MODIFIERS.length)]
    name = `${prefix} ${modifier} ${suffix}`
  }
  
  // Add pool identifier if provided
  if (poolIndex !== undefined) {
    name = `${name} (Pool ${String.fromCharCode(65 + poolIndex)})`
  }
  
  return name
}

/**
 * Generate competitive levels with realistic distribution
 * Higher levels are less common (pyramid structure)
 */
function generateCompetitiveLevel(index: number, teamCount: number): number {
  // Create a pyramid distribution: more teams at lower levels
  const rand = Math.random()
  
  if (rand < 0.05) return 10 // Top 5% - Elite
  if (rand < 0.15) return 9  // Next 10% - Premier
  if (rand < 0.30) return 8  // Next 15% - Pro
  if (rand < 0.50) return 7  // Next 20% - Select
  if (rand < 0.70) return 6  // Next 20% - Academy
  if (rand < 0.85) return 5  // Next 15% - Club
  if (rand < 0.95) return 4  // Next 10% - Division
  return 3 // Bottom 5% - Recreational
}

/**
 * Generate realistic scores based on competitive levels
 */
function generateScores(
  teamLevel: number,
  opponentLevel: number,
  includeTies: boolean = true
): { teamScore: number; opponentScore: number; isTie: boolean } {
  const levelDiff = teamLevel - opponentLevel
  
  // Base scores: higher level = higher base score
  const teamBase = 50 + teamLevel * 5 + Math.random() * 20
  const opponentBase = 50 + opponentLevel * 5 + Math.random() * 20
  
  // Adjust based on level difference
  const teamAdjustment = levelDiff * 3 + (Math.random() - 0.5) * 15
  const opponentAdjustment = -levelDiff * 3 + (Math.random() - 0.5) * 15
  
  let teamScore = Math.max(0, Math.floor(teamBase + teamAdjustment))
  let opponentScore = Math.max(0, Math.floor(opponentBase + opponentAdjustment))
  
  // Ensure reasonable score range (basketball-like: 30-120)
  teamScore = Math.max(30, Math.min(120, teamScore))
  opponentScore = Math.max(30, Math.min(120, opponentScore))
  
  // Handle ties (5% chance if enabled)
  const isTie = includeTies && Math.random() < 0.05 && Math.abs(teamScore - opponentScore) <= 2
  if (isTie) {
    const tieScore = Math.floor((teamScore + opponentScore) / 2)
    teamScore = tieScore
    opponentScore = tieScore
  } else if (teamScore === opponentScore) {
    // Break exact ties (unless we want a tie)
    if (Math.random() > 0.5) {
      teamScore += 1
    } else {
      opponentScore += 1
    }
  }
  
  return { teamScore, opponentScore, isTie }
}

export type GenerateDatasetOptions = {
  teamCount?: number
  gamesPerTeam?: number
  competitiveLevels?: number[]
  usePools?: boolean
  poolCount?: number
  includeTies?: boolean
  roundRobinStyle?: boolean
  completionRate?: number // 0-1, percentage of games that are completed
}

/**
 * Generate a comprehensive dataset for testing RPI calculations
 * This creates data similar to what Supabase provides, with pools, realistic names, etc.
 * Optimized for large datasets (10k+ games) using efficient data structures and chunked processing.
 */
export function generateLargeDataset(options?: GenerateDatasetOptions): TeamData[] {
  const {
    teamCount = 100,
    gamesPerTeam = 50,
    competitiveLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    usePools = true,
    poolCount,
    includeTies = true,
    roundRobinStyle = true,
    completionRate = 0.85, // 85% of games completed
  } = options || {}

  // Calculate pool count if not provided
  const actualPoolCount = poolCount || Math.max(1, Math.floor(Math.sqrt(teamCount / 4)))
  const teamsPerPool = Math.ceil(teamCount / actualPoolCount)

  const teams: TeamData[] = []
  const teamMap = new Map<number, { level: number; poolIndex: number }>()
  
  // Use Maps for O(1) lookups instead of array.find() which is O(n)
  const teamOpponentsMap = new Map<number, Set<number>>() // teamId -> Set of opponentIds
  const gamePairsSet = new Set<string>() // "teamId-opponentId" for quick duplicate checking

  // Initialize maps
  for (let i = 1; i <= teamCount; i++) {
    teamOpponentsMap.set(i, new Set())
  }

  // Generate teams with realistic names and competitive levels
  for (let i = 1; i <= teamCount; i++) {
    const poolIndex = usePools ? Math.floor((i - 1) / teamsPerPool) : 0
    const competitiveLevel = generateCompetitiveLevel(i, teamCount)
    
    teamMap.set(i, { level: competitiveLevel, poolIndex })
    
    teams.push({
      id: i,
      name: generateTeamName(i, usePools ? poolIndex : undefined),
      games: [],
      competitiveLevel,
    })
  }

  // Helper function to add a game (bidirectional)
  const addGame = (teamId: number, opponentId: number, teamScore: number, opponentScore: number, isTie: boolean) => {
    const teamInfo = teamMap.get(teamId)!
    const opponentInfo = teamMap.get(opponentId)!
    const competitiveLevelDiff = opponentInfo.level - teamInfo.level
    const isWin = teamScore > opponentScore

    // Add game to team
    teams[teamId - 1].games.push({
      opponentId,
      teamScore,
      opponentScore,
      isWin,
      isTie,
      competitiveLevelDiff,
    })
    teamOpponentsMap.get(teamId)!.add(opponentId)

    // Add reverse game to opponent
    teams[opponentId - 1].games.push({
      opponentId: teamId,
      teamScore: opponentScore,
      opponentScore: teamScore,
      isWin: !isWin && !isTie,
      isTie,
      competitiveLevelDiff: -competitiveLevelDiff,
    })
    teamOpponentsMap.get(opponentId)!.add(teamId)

    // Track pair
    const pairKey = [teamId, opponentId].sort().join('-')
    gamePairsSet.add(pairKey)
  }

  // Generate games
  if (roundRobinStyle && usePools) {
    // Round-robin within pools
    for (let poolIdx = 0; poolIdx < actualPoolCount; poolIdx++) {
      const poolStart = poolIdx * teamsPerPool + 1
      const poolEnd = Math.min((poolIdx + 1) * teamsPerPool, teamCount)
      const poolTeams = Array.from({ length: poolEnd - poolStart + 1 }, (_, i) => poolStart + i)

      // Round-robin within pool
      for (let i = 0; i < poolTeams.length; i++) {
        for (let j = i + 1; j < poolTeams.length; j++) {
          const teamId = poolTeams[i]
          const opponentId = poolTeams[j]
          
          // Skip if team already has enough games (O(1) check)
          if (teams[teamId - 1].games.length >= gamesPerTeam) continue
          if (teams[opponentId - 1].games.length >= gamesPerTeam) continue

          const teamInfo = teamMap.get(teamId)!
          const opponentInfo = teamMap.get(opponentId)!

          // Only add completed games based on completion rate
          if (Math.random() <= completionRate) {
            const { teamScore, opponentScore, isTie } = generateScores(
              teamInfo.level,
              opponentInfo.level,
              includeTies
            )
            addGame(teamId, opponentId, teamScore, opponentScore, isTie)
          }
        }
      }
    }

    // Add cross-pool games to reach gamesPerTeam target
    // Use a more efficient approach: pre-calculate available opponents
    const availableOpponents = new Map<number, number[]>() // teamId -> array of potential opponents
    
    for (let i = 1; i <= teamCount; i++) {
      const currentGames = teams[i - 1].games.length
      const neededGames = gamesPerTeam - currentGames

      if (neededGames > 0) {
        // Pre-calculate available opponents (not already played, not self)
        const playedOpponents = teamOpponentsMap.get(i)!
        const available: number[] = []
        
        for (let j = 1; j <= teamCount; j++) {
          if (j !== i && !playedOpponents.has(j) && teams[j - 1].games.length < gamesPerTeam) {
            available.push(j)
          }
        }
        
        // Shuffle for randomness
        for (let k = available.length - 1; k > 0; k--) {
          const j = Math.floor(Math.random() * (k + 1));
          [available[k], available[j]] = [available[j], available[k]]
        }
        
        // Take only what we need
        const opponents = available.slice(0, Math.min(neededGames, available.length))
        
        const teamInfo = teamMap.get(i)!
        for (const opponentId of opponents) {
          if (Math.random() <= completionRate) {
            const opponentInfo = teamMap.get(opponentId)!
            const { teamScore, opponentScore, isTie } = generateScores(
              teamInfo.level,
              opponentInfo.level,
              includeTies
            )
            addGame(i, opponentId, teamScore, opponentScore, isTie)
          }
        }
      }
    }
  } else {
    // Random pairing approach - optimized
    // Pre-calculate all possible pairs to avoid random searching
    const allPossiblePairs: Array<[number, number]> = []
    for (let i = 1; i <= teamCount; i++) {
      for (let j = i + 1; j <= teamCount; j++) {
        allPossiblePairs.push([i, j])
      }
    }
    
    // Shuffle pairs once
    for (let i = allPossiblePairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPossiblePairs[i], allPossiblePairs[j]] = [allPossiblePairs[j], allPossiblePairs[i]]
    }
    
    // Process pairs until teams have enough games
    for (const [teamId, opponentId] of allPossiblePairs) {
      // Check if both teams need games (O(1) checks)
      if (teams[teamId - 1].games.length >= gamesPerTeam) continue
      if (teams[opponentId - 1].games.length >= gamesPerTeam) continue
      
      // Check if pair already exists (O(1) check)
      const pairKey = [teamId, opponentId].sort().join('-')
      if (gamePairsSet.has(pairKey)) continue

      const teamInfo = teamMap.get(teamId)!
      const opponentInfo = teamMap.get(opponentId)!

      // Only add completed games based on completion rate
      if (Math.random() <= completionRate) {
        const { teamScore, opponentScore, isTie } = generateScores(
          teamInfo.level,
          opponentInfo.level,
          includeTies
        )
        addGame(teamId, opponentId, teamScore, opponentScore, isTie)
      }
    }
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
  competitiveLevelDistribution: Record<number, number>
  tiesCount: number
  winRateByLevel: Record<number, { wins: number; games: number; rate: number }>
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

  // Competitive level distribution
  const levelDistribution: Record<number, number> = {}
  teams.forEach((team) => {
    levelDistribution[team.competitiveLevel] = (levelDistribution[team.competitiveLevel] || 0) + 1
  })

  // Count ties
  const tiesCount = teams.reduce((sum, team) => {
    return sum + team.games.filter(g => g.isTie).length
  }, 0) / 2 // Divide by 2 since each tie is counted twice

  // Win rate by competitive level
  const winRateByLevel: Record<number, { wins: number; games: number; rate: number }> = {}
  teams.forEach((team) => {
    if (!winRateByLevel[team.competitiveLevel]) {
      winRateByLevel[team.competitiveLevel] = { wins: 0, games: 0, rate: 0 }
    }
    const stats = winRateByLevel[team.competitiveLevel]
    team.games.forEach((game) => {
      stats.games++
      if (game.isWin) stats.wins++
    })
  })
  
  // Calculate rates
  Object.keys(winRateByLevel).forEach((level) => {
    const stats = winRateByLevel[parseInt(level)]
    stats.rate = stats.games > 0 ? stats.wins / stats.games : 0
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
    competitiveLevelDistribution: levelDistribution,
    tiesCount: Math.round(tiesCount),
    winRateByLevel,
  }
}
