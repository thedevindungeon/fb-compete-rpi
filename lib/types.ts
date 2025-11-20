export type RPICoefficients = {
  clwpCoeff: number // 0.9 - CLWP Weight
  oclwpCoeff: number // 0.1 - OCLWP Weight
  ooclwpCoeff: number // 0.1 - OOCLWP Weight
  diffCoeff: number // 0.1 - Points Differential Coefficient
  dominationCoeff: number // 0.9 - Domination Coefficient
  clgwStep: number // 0.05 - Competitive Level Grade Win adjustment
  clglStep: number // 0.1 - Competitive Level Grade Loss adjustment
  minGames: number // 3 - Minimal Games Number
  diffInterval: number // 15 - Points Differential Interval
}

export type GameData = {
  opponentId: number
  teamScore: number
  opponentScore: number
  isWin: boolean
  isTie?: boolean
  competitiveLevelDiff: number // positive means opponent is stronger
  matchDate?: string // ISO timestamp from match.created_at
}

export type TeamData = {
  id: number
  name: string
  games: GameData[]
  competitiveLevel: number
}

export type TeamRPIResult = {
  teamId: number
  teamName: string
  games: number
  wins: number
  losses: number
  ties: number
  wp: number // Winning Percentage
  clwp: number // Competitive Level Winning Percentage
  oclwp: number // Opponent CLWP
  ooclwp: number // Opponent's Opponent CLWP
  diff: number // Points Differential
  rpi: number // Final RPI
}

export const DEFAULT_COEFFICIENTS: RPICoefficients = {
  clwpCoeff: 0.9,
  oclwpCoeff: 0.1,
  ooclwpCoeff: 0.1,
  diffCoeff: 0.1,
  dominationCoeff: 0.9,
  clgwStep: 0.05,
  clglStep: 0.1,
  minGames: 3,
  diffInterval: 15,
}

