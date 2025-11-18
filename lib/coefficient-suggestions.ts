import type { TeamRPIResult, RPICoefficients } from './types'
import { DEFAULT_COEFFICIENTS } from './types'

/**
 * Calculate suggested coefficients based on a selected team's performance
 * This helps optimize coefficients to better reflect that team's strengths
 */
export function calculateSuggestedCoefficients(
  selectedTeam: TeamRPIResult
): RPICoefficients {
  const suggestions = { ...DEFAULT_COEFFICIENTS }

  // If team has high CLWP, suggest increasing CLWP coefficient
  if (selectedTeam.clwp > 0.7) {
    suggestions.clwpCoeff = Math.min(0.95, DEFAULT_COEFFICIENTS.clwpCoeff + 0.05)
  } else if (selectedTeam.clwp < 0.3) {
    suggestions.clwpCoeff = Math.max(0.5, DEFAULT_COEFFICIENTS.clwpCoeff - 0.05)
  }

  // If team has high OCLWP (strong schedule), suggest increasing OCLWP coefficient
  if (selectedTeam.oclwp > 0.6) {
    suggestions.oclwpCoeff = Math.min(0.2, DEFAULT_COEFFICIENTS.oclwpCoeff + 0.05)
  }

  // If team has high OOCLWP (opponents played strong schedules), suggest increasing OOCLWP
  if (selectedTeam.ooclwp > 0.6) {
    suggestions.ooclwpCoeff = Math.min(0.2, DEFAULT_COEFFICIENTS.ooclwpCoeff + 0.05)
  }

  // If team has high point differential, suggest increasing DIFF coefficient
  if (selectedTeam.diff > 0.05) {
    suggestions.diffCoeff = Math.min(0.2, DEFAULT_COEFFICIENTS.diffCoeff + 0.05)
  } else if (selectedTeam.diff < -0.05) {
    suggestions.diffCoeff = Math.max(0.05, DEFAULT_COEFFICIENTS.diffCoeff - 0.03)
  }

  // If team has many wins, suggest adjusting domination coefficient
  if (selectedTeam.wins >= 8) {
    suggestions.dominationCoeff = Math.min(0.95, DEFAULT_COEFFICIENTS.dominationCoeff + 0.05)
  }

  // If team has few games, suggest lowering min games threshold
  if (selectedTeam.games < 5) {
    suggestions.minGames = Math.max(1, DEFAULT_COEFFICIENTS.minGames - 1)
  }

  // Calculate win percentage to adjust CLGW/CLGL steps
  const winRate = selectedTeam.games > 0 ? selectedTeam.wins / selectedTeam.games : 0
  if (winRate > 0.7) {
    // Strong team - increase CLGW step to reward wins more
    suggestions.clgwStep = Math.min(0.1, DEFAULT_COEFFICIENTS.clgwStep + 0.02)
  } else if (winRate < 0.3) {
    // Weak team - decrease CLGL step to reduce loss penalty
    suggestions.clglStep = Math.max(0.05, DEFAULT_COEFFICIENTS.clglStep - 0.02)
  }

  return suggestions
}

