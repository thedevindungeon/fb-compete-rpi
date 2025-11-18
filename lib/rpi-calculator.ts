import type { TeamData, RPICoefficients, TeamRPIResult } from './types'

export function applyCompetitiveLevelAdjustment(
  result: number,
  levelDiff: number,
  coeffs: RPICoefficients,
  isWin: boolean
): number {
  const absLevelDiff = Math.abs(levelDiff)
  const step = isWin ? coeffs.clgwStep : coeffs.clglStep

  if (levelDiff > 0) {
    // Opponent is stronger
    if (isWin) {
      // Beating stronger opponent increases win value
      return result + absLevelDiff * step
    } else {
      // Losing to stronger opponent decreases loss penalty
      return result - absLevelDiff * step
    }
  } else if (levelDiff < 0) {
    // Opponent is weaker
    if (isWin) {
      // Beating weaker opponent decreases win value
      return result - absLevelDiff * step
    } else {
      // Losing to weaker opponent increases loss penalty
      return result + absLevelDiff * step
    }
  }

  return result
}

export function calculateCLWP(
  team: TeamData,
  coeffs: RPICoefficients
): number {
  if (team.games.length === 0) return 0

  let adjustedWins = 0
  let adjustedLosses = 0

  for (const game of team.games) {
    if (game.isTie) {
      adjustedWins += 0.5
      adjustedLosses += 0.5
    } else if (game.isWin) {
      const adjustedWin = applyCompetitiveLevelAdjustment(
        1,
        game.competitiveLevelDiff,
        coeffs,
        true
      )
      adjustedWins += adjustedWin
    } else {
      const adjustedLoss = applyCompetitiveLevelAdjustment(
        1,
        game.competitiveLevelDiff,
        coeffs,
        false
      )
      adjustedLosses += adjustedLoss
    }
  }

  const totalGames = adjustedWins + adjustedLosses
  if (totalGames === 0) return 0

  return adjustedWins / totalGames
}

export function calculateOCLWP(
  team: TeamData,
  allTeams: TeamData[],
  coeffs: RPICoefficients
): number {
  if (team.games.length === 0) return 0

  const opponentIds = team.games.map((g) => g.opponentId)
  const uniqueOpponentIds = [...new Set(opponentIds)]

  let totalOppCLWP = 0
  let oppCount = 0

  for (const oppId of uniqueOpponentIds) {
    const opponent = allTeams.find((t) => t.id === oppId)
    if (opponent) {
      totalOppCLWP += calculateCLWP(opponent, coeffs)
      oppCount++
    }
  }

  if (oppCount === 0) return 0
  return totalOppCLWP / oppCount
}

export function calculateOOCLWP(
  team: TeamData,
  allTeams: TeamData[],
  coeffs: RPICoefficients
): number {
  if (team.games.length === 0) return 0

  const opponentIds = team.games.map((g) => g.opponentId)
  const uniqueOpponentIds = [...new Set(opponentIds)]

  let totalOppOppCLWP = 0
  let count = 0

  for (const oppId of uniqueOpponentIds) {
    const opponent = allTeams.find((t) => t.id === oppId)
    if (!opponent) continue

    // Get opponent's opponents, excluding the current team
    const oppOpponentIds = opponent.games
      .map((g) => g.opponentId)
      .filter((id) => id !== team.id)
    const uniqueOppOpponentIds = [...new Set(oppOpponentIds)]

    for (const oppOppId of uniqueOppOpponentIds) {
      const oppOpponent = allTeams.find((t) => t.id === oppOppId)
      if (oppOpponent) {
        totalOppOppCLWP += calculateCLWP(oppOpponent, coeffs)
        count++
      }
    }
  }

  if (count === 0) return 0
  return totalOppOppCLWP / count
}

export function calculateDIFF(
  team: TeamData,
  _coeffs: RPICoefficients
): number {
  if (team.games.length === 0) return 0

  let totalDiff = 0

  for (const game of team.games) {
    const totalPoints = game.teamScore + game.opponentScore
    if (totalPoints === 0) continue

    const gameDiff =
      (game.teamScore - game.opponentScore) / totalPoints
    totalDiff += gameDiff
  }

  return totalDiff / team.games.length
}

export function checkDominationBonus(team: TeamData): boolean {
  if (team.games.length < 8) return false

  let consecutiveWins = 0
  let maxConsecutiveWins = 0

  for (const game of team.games) {
    if (game.isWin && !game.isTie) {
      consecutiveWins++
      maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins)
    } else {
      consecutiveWins = 0
    }
  }

  return maxConsecutiveWins >= 8
}

export function calculateRPI(
  team: TeamData,
  allTeams: TeamData[],
  coeffs: RPICoefficients
): number {
  const clwp = calculateCLWP(team, coeffs)
  const oclwp = calculateOCLWP(team, allTeams, coeffs)
  const ooclwp = calculateOOCLWP(team, allTeams, coeffs)
  const diff = calculateDIFF(team, coeffs)

  // Base RPI calculation
  const baseRPI =
    coeffs.clwpCoeff * clwp +
    coeffs.oclwpCoeff * oclwp +
    coeffs.ooclwpCoeff * ooclwp

  // Apply differential
  const rpiWithDiff = baseRPI + coeffs.diffCoeff * diff

  // Apply domination bonus
  const hasDomination = checkDominationBonus(team)
  const finalRPI = hasDomination
    ? rpiWithDiff * coeffs.dominationCoeff
    : rpiWithDiff

  return finalRPI
}

export function calculateAllTeamsRPI(
  teams: TeamData[],
  coeffs: RPICoefficients
): TeamRPIResult[] {
  const results: TeamRPIResult[] = teams.map((team) => {
    const clwp = calculateCLWP(team, coeffs)
    const oclwp = calculateOCLWP(team, teams, coeffs)
    const ooclwp = calculateOOCLWP(team, teams, coeffs)
    const diff = calculateDIFF(team, coeffs)
    const rpi = calculateRPI(team, teams, coeffs)

    const wins = team.games.filter((g) => g.isWin && !g.isTie).length
    const losses = team.games.filter((g) => !g.isWin && !g.isTie).length
    const ties = team.games.filter((g) => g.isTie).length
    const totalGames = team.games.length
    const wp = totalGames > 0 ? (wins + ties * 0.5) / totalGames : 0

    return {
      teamId: team.id,
      teamName: team.name,
      games: totalGames,
      wins,
      losses,
      ties,
      wp,
      clwp,
      oclwp,
      ooclwp,
      diff,
      rpi,
    }
  })

  // Sort by RPI descending
  return results.sort((a, b) => b.rpi - a.rpi)
}

