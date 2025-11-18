import { describe, it, expect } from 'vitest'
import {
  calculateCLWP,
  calculateOCLWP,
  calculateOOCLWP,
  calculateDIFF,
  checkDominationBonus,
  applyCompetitiveLevelAdjustment,
  calculateRPI,
  calculateAllTeamsRPI,
} from '@/lib/rpi-calculator'
import type { TeamData, RPICoefficients } from '@/lib/types'
import { DEFAULT_COEFFICIENTS } from '@/lib/types'

describe('RPI Calculator - Core Functions', () => {
  const defaultCoeffs: RPICoefficients = DEFAULT_COEFFICIENTS

  describe('applyCompetitiveLevelAdjustment', () => {
    it('should increase win value when beating stronger opponent', () => {
      const result = applyCompetitiveLevelAdjustment(
        1,
        3,
        defaultCoeffs,
        true
      )
      // 1 + (3 * 0.05) = 1.15
      expect(result).toBe(1.15)
    })

    it('should decrease loss value when losing to stronger opponent', () => {
      const result = applyCompetitiveLevelAdjustment(
        1,
        3,
        defaultCoeffs,
        false
      )
      // 1 - (3 * 0.1) = 0.7
      expect(result).toBe(0.7)
    })

    it('should decrease win value when beating weaker opponent', () => {
      const result = applyCompetitiveLevelAdjustment(
        1,
        -3,
        defaultCoeffs,
        true
      )
      // 1 - (3 * 0.05) = 0.85
      expect(result).toBe(0.85)
    })

    it('should increase loss value when losing to weaker opponent', () => {
      const result = applyCompetitiveLevelAdjustment(
        1,
        -3,
        defaultCoeffs,
        false
      )
      // 1 + (3 * 0.1) = 1.3
      expect(result).toBe(1.3)
    })

    it('should handle zero level difference', () => {
      const winResult = applyCompetitiveLevelAdjustment(
        1,
        0,
        defaultCoeffs,
        true
      )
      const lossResult = applyCompetitiveLevelAdjustment(
        1,
        0,
        defaultCoeffs,
        false
      )
      expect(winResult).toBe(1)
      expect(lossResult).toBe(1)
    })
  })

  describe('calculateCLWP', () => {
    it('should calculate basic winning percentage without level adjustments', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          { opponentId: 3, teamScore: 8, opponentScore: 12, isWin: false, competitiveLevelDiff: 0 },
          { opponentId: 4, teamScore: 15, opponentScore: 10, isWin: true, competitiveLevelDiff: 0 },
        ],
      }
      // 2 wins, 1 loss, all equal level: (2 * 1) / (2 * 1 + 1 * 1) = 2/3
      const clwp = calculateCLWP(team, defaultCoeffs)
      expect(clwp).toBeCloseTo(0.6667, 4)
    })

    it('should adjust wins when beating stronger opponents', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 2 },
        ],
      }
      // 1 win with +2 level diff: (1 + 2 * 0.05) / (1 + 2 * 0.05) = 1.1 / 1.1 = 1.0
      const clwp = calculateCLWP(team, defaultCoeffs)
      expect(clwp).toBe(1.0)
    })

    it('should adjust losses when losing to stronger opponents', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 2 },
        ],
      }
      // 1 loss with +2 level diff: 0 / (1 - 2 * 0.1) = 0 / 0.8 = 0
      const clwp = calculateCLWP(team, defaultCoeffs)
      expect(clwp).toBe(0)
    })

    it('should handle ties as 0.5', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 10, opponentScore: 10, isWin: false, isTie: true, competitiveLevelDiff: 0 },
          { opponentId: 3, teamScore: 10, opponentScore: 10, isWin: false, isTie: true, competitiveLevelDiff: 0 },
        ],
      }
      // 2 ties: (0.5 + 0.5) / (0.5 + 0.5 + 0.5 + 0.5) = 1 / 2 = 0.5
      const clwp = calculateCLWP(team, defaultCoeffs)
      expect(clwp).toBe(0.5)
    })

    it('should return 0 for team with no games', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [],
      }
      const clwp = calculateCLWP(team, defaultCoeffs)
      expect(clwp).toBe(0)
    })

    it('should return 1 for team with all wins', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          { opponentId: 3, teamScore: 15, opponentScore: 10, isWin: true, competitiveLevelDiff: 0 },
        ],
      }
      const clwp = calculateCLWP(team, defaultCoeffs)
      expect(clwp).toBe(1.0)
    })

    it('should return 0 for team with all losses', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          { opponentId: 3, teamScore: 8, opponentScore: 15, isWin: false, competitiveLevelDiff: 0 },
        ],
      }
      const clwp = calculateCLWP(team, defaultCoeffs)
      expect(clwp).toBe(0)
    })
  })

  describe('calculateDIFF', () => {
    it('should calculate average point differential', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          { opponentId: 3, teamScore: 6, opponentScore: 8, isWin: false, competitiveLevelDiff: 0 },
        ],
      }
      // Game 1: (10 - 5) / (10 + 5) = 5/15 = 0.333...
      // Game 2: (6 - 8) / (6 + 8) = -2/14 = -0.142857...
      // Average: (0.333... - 0.142857...) / 2 = 0.0952...
      const diff = calculateDIFF(team, defaultCoeffs)
      expect(diff).toBeCloseTo(0.0952, 3)
    })

    it('should return 0 for team with no games', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [],
      }
      const diff = calculateDIFF(team, defaultCoeffs)
      expect(diff).toBe(0)
    })

    it('should handle blowout wins', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 50, opponentScore: 10, isWin: true, competitiveLevelDiff: 0 },
        ],
      }
      // (50 - 10) / (50 + 10) = 40/60 = 0.6667
      const diff = calculateDIFF(team, defaultCoeffs)
      expect(diff).toBeCloseTo(0.6667, 4)
    })

    it('should handle blowout losses', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 10, opponentScore: 50, isWin: false, competitiveLevelDiff: 0 },
        ],
      }
      // (10 - 50) / (10 + 50) = -40/60 = -0.6667
      const diff = calculateDIFF(team, defaultCoeffs)
      expect(diff).toBeCloseTo(-0.6667, 4)
    })
  })

  describe('checkDominationBonus', () => {
    it('should return true for 8 consecutive wins', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: Array(8).fill(null).map((_, i) => ({
          opponentId: i + 2,
          teamScore: 10,
          opponentScore: 5,
          isWin: true,
          competitiveLevelDiff: 0,
        })),
      }
      expect(checkDominationBonus(team)).toBe(true)
    })

    it('should return false for 7 consecutive wins', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: Array(7).fill(null).map((_, i) => ({
          opponentId: i + 2,
          teamScore: 10,
          opponentScore: 5,
          isWin: true,
          competitiveLevelDiff: 0,
        })),
      }
      expect(checkDominationBonus(team)).toBe(false)
    })

    it('should return false if win streak is broken', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          ...Array(5).fill(null).map((_, i) => ({
            opponentId: i + 2,
            teamScore: 10,
            opponentScore: 5,
            isWin: true,
            competitiveLevelDiff: 0,
          })),
          { opponentId: 7, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ...Array(5).fill(null).map((_, i) => ({
            opponentId: i + 8,
            teamScore: 10,
            opponentScore: 5,
            isWin: true,
            competitiveLevelDiff: 0,
          })),
        ],
      }
      expect(checkDominationBonus(team)).toBe(false)
    })

    it('should return true for more than 8 consecutive wins', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: Array(12).fill(null).map((_, i) => ({
          opponentId: i + 2,
          teamScore: 10,
          opponentScore: 5,
          isWin: true,
          competitiveLevelDiff: 0,
        })),
      }
      expect(checkDominationBonus(team)).toBe(true)
    })
  })

  describe('calculateOCLWP', () => {
    it('should calculate average opponent CLWP', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team A',
          competitiveLevel: 5,
          games: [
            { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
            { opponentId: 3, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 2,
          name: 'Team B',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
            { opponentId: 3, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 3,
          name: 'Team C',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
            { opponentId: 2, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ],
        },
      ]
      // Team A plays Team B (CLWP = 0.5) and Team C (CLWP = 0)
      // OCLWP = (0.5 + 0) / 2 = 0.25
      const oclwp = calculateOCLWP(teams[0], teams, defaultCoeffs)
      expect(oclwp).toBe(0.25)
    })

    it('should return 0 for team with no games', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team A',
          competitiveLevel: 5,
          games: [],
        },
      ]
      const oclwp = calculateOCLWP(teams[0], teams, defaultCoeffs)
      expect(oclwp).toBe(0)
    })
  })

  describe('calculateOOCLWP', () => {
    it('should calculate average opponent opponent CLWP', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team A',
          competitiveLevel: 5,
          games: [
            { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 2,
          name: 'Team B',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
            { opponentId: 3, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 3,
          name: 'Team C',
          competitiveLevel: 5,
          games: [
            { opponentId: 2, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ],
        },
      ]
      // Team A plays Team B
      // Team B plays Team A and Team C
      // Team A's OOCLWP = Team C's CLWP (Team A is excluded from Team B's opponents)
      // Team C CLWP = 0
      const ooclwp = calculateOOCLWP(teams[0], teams, defaultCoeffs)
      expect(ooclwp).toBeCloseTo(0, 4)
    })

    it('should return 0 for team with no games', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team A',
          competitiveLevel: 5,
          games: [],
        },
      ]
      const ooclwp = calculateOOCLWP(teams[0], teams, defaultCoeffs)
      expect(ooclwp).toBe(0)
    })
  })

  describe('calculateRPI', () => {
    it('should combine all components with coefficients', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team A',
          competitiveLevel: 5,
          games: [
            { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
            { opponentId: 3, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 2,
          name: 'Team B',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 3,
          name: 'Team C',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ],
        },
      ]
      const rpi = calculateRPI(teams[0], teams, defaultCoeffs)
      // CLWP = 1.0
      // OCLWP = 0 (both opponents have 0 CLWP)
      // OOCLWP = 0
      // DIFF = (10-5)/(10+5) + (10-5)/(10+5) / 2 = (5/15 + 5/15) / 2 = 0.333...
      // Base RPI = 0.9 * 1.0 + 0.1 * 0 + 0.1 * 0 = 0.9
      // RPI with DIFF = (0.9 + 0.1 * 0.333...) * 1.0 = 0.933...
      expect(rpi).toBeGreaterThan(0.9)
      expect(rpi).toBeLessThan(1.0)
    })

    it('should apply domination bonus for 8+ win streak', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team A',
          competitiveLevel: 5,
          games: Array(8).fill(null).map((_, i) => ({
            opponentId: i + 2,
            teamScore: 10,
            opponentScore: 5,
            isWin: true,
            competitiveLevelDiff: 0,
          })),
        },
        ...Array(8).fill(null).map((_, i) => ({
          id: i + 2,
          name: `Team ${String.fromCharCode(66 + i)}`,
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ],
        })),
      ]
      const rpi = calculateRPI(teams[0], teams, defaultCoeffs)
      const rpiWithoutDomination = calculateRPI(teams[0], teams, { ...defaultCoeffs, dominationCoeff: 1.0 })
      // RPI with domination should be less than without (coefficient is 0.9)
      expect(rpi).toBeLessThan(rpiWithoutDomination)
    })
  })

  describe('calculateAllTeamsRPI', () => {
    it('should calculate RPI for all teams and sort by RPI descending', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team A',
          competitiveLevel: 5,
          games: [
            { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
            { opponentId: 3, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 2,
          name: 'Team B',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
            { opponentId: 3, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 3,
          name: 'Team C',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
            { opponentId: 2, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ],
        },
      ]
      const results = calculateAllTeamsRPI(teams, defaultCoeffs)
      
      expect(results).toHaveLength(3)
      expect(results[0].teamId).toBe(1) // Team A should be first
      expect(results[1].teamId).toBe(2) // Team B should be second
      expect(results[2].teamId).toBe(3) // Team C should be last
      expect(results[0].rpi).toBeGreaterThan(results[1].rpi)
      expect(results[1].rpi).toBeGreaterThan(results[2].rpi)
    })

    it('should include all stats in result', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team A',
          competitiveLevel: 5,
          games: [
            { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
            { opponentId: 3, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 2,
          name: 'Team B',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
          ],
        },
        {
          id: 3,
          name: 'Team C',
          competitiveLevel: 5,
          games: [
            { opponentId: 1, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
          ],
        },
      ]
      const results = calculateAllTeamsRPI(teams, defaultCoeffs)
      const teamA = results.find(r => r.teamId === 1)!
      
      expect(teamA.teamName).toBe('Team A')
      expect(teamA.games).toBe(2)
      expect(teamA.wins).toBe(1)
      expect(teamA.losses).toBe(1)
      expect(teamA.wp).toBe(0.5)
      expect(teamA.clwp).toBe(0.5)
      expect(teamA).toHaveProperty('oclwp')
      expect(teamA).toHaveProperty('ooclwp')
      expect(teamA).toHaveProperty('diff')
      expect(teamA).toHaveProperty('rpi')
    })
  })

  describe('Edge Cases', () => {
    it('should handle coefficients at extremes', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
        ],
      }
      const teams = [team, {
        id: 2,
        name: 'Team B',
        competitiveLevel: 5,
        games: [
          { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, competitiveLevelDiff: 0 },
        ],
      }]
      
      const zeroCoeffs: RPICoefficients = {
        ...defaultCoeffs,
        clwpCoeff: 0,
        oclwpCoeff: 0,
        ooclwpCoeff: 0,
        diffCoeff: 0,
      }
      const rpi = calculateRPI(team, teams, zeroCoeffs)
      expect(rpi).toBe(0)
    })

    it('should handle team with no opponents found', () => {
      const team: TeamData = {
        id: 1,
        name: 'Team A',
        competitiveLevel: 5,
        games: [
          { opponentId: 999, teamScore: 10, opponentScore: 5, isWin: true, competitiveLevelDiff: 0 },
        ],
      }
      const teams = [team]
      const oclwp = calculateOCLWP(team, teams, defaultCoeffs)
      expect(oclwp).toBe(0)
    })
  })
})

