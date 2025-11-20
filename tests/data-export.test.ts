import { describe, it, expect } from 'vitest'
import {
  exportTeamDataToJSON,
  parseTeamDataFromJSON,
  getDatasetStats,
} from '@/lib/data-export'
import { generateLargeDataset, getDatasetInfo } from '@/lib/generate-large-dataset'
import type { TeamData } from '@/lib/types'

describe('Data Export/Import', () => {
  describe('parseTeamDataFromJSON', () => {
    it('should parse valid JSON array of teams', () => {
      const json = JSON.stringify([
        {
          id: 1,
          name: 'Team 1',
          games: [
            {
              opponentId: 2,
              teamScore: 10,
              opponentScore: 5,
              isWin: true,
              isTie: false,
              competitiveLevelDiff: 0,
            },
          ],
          competitiveLevel: 5,
        },
      ])

      const result = parseTeamDataFromJSON(json)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].name).toBe('Team 1')
      expect(result[0].games).toHaveLength(1)
    })

    it('should handle missing optional fields with defaults', () => {
      const json = JSON.stringify([
        {
          id: 1,
          name: 'Team 1',
          games: [
            {
              opponentId: 2,
              teamScore: 10,
              opponentScore: 5,
              isWin: true,
            },
          ],
        },
      ])

      const result = parseTeamDataFromJSON(json)
      expect(result[0].games[0].isTie).toBe(false)
      expect(result[0].games[0].competitiveLevelDiff).toBe(0)
      expect(result[0].competitiveLevel).toBe(5)
    })

    it('should throw error for invalid JSON', () => {
      expect(() => parseTeamDataFromJSON('invalid json')).toThrow()
    })

    it('should throw error for non-array JSON', () => {
      expect(() => parseTeamDataFromJSON('{"not": "array"}')).toThrow(
        'JSON must be an array of teams'
      )
    })

    it('should throw error for missing required fields', () => {
      const json = JSON.stringify([{ id: 1 }])
      expect(() => parseTeamDataFromJSON(json)).toThrow()
    })
  })

  describe('getDatasetStats', () => {
    it('should calculate correct statistics', () => {
      const teams: TeamData[] = [
        {
          id: 1,
          name: 'Team 1',
          games: [
            { opponentId: 2, teamScore: 10, opponentScore: 5, isWin: true, isTie: false, competitiveLevelDiff: 0 },
            { opponentId: 3, teamScore: 8, opponentScore: 12, isWin: false, isTie: false, competitiveLevelDiff: 0 },
          ],
          competitiveLevel: 5,
        },
        {
          id: 2,
          name: 'Team 2',
          games: [
            { opponentId: 1, teamScore: 5, opponentScore: 10, isWin: false, isTie: false, competitiveLevelDiff: 0 },
          ],
          competitiveLevel: 5,
        },
      ]

      const stats = getDatasetStats(teams)
      expect(stats.teamCount).toBe(2)
      expect(stats.totalGames).toBe(3)
      expect(stats.totalRecords).toBe(3)
      expect(stats.fileSizeEstimate).toMatch(/KB|B/)
    })
  })

  describe('generateLargeDataset', () => {
    it('should generate dataset with specified team count', () => {
      const teams = generateLargeDataset({ teamCount: 10, gamesPerTeam: 5 })
      expect(teams).toHaveLength(10)
      teams.forEach((team) => {
        expect(team.games.length).toBeGreaterThanOrEqual(5)
        expect(team.id).toBeGreaterThan(0)
        expect(team.name).toMatch(/^Team \d+$/)
      })
    })

    it('should generate valid game data', () => {
      const teams = generateLargeDataset({ teamCount: 5, gamesPerTeam: 3 })
      teams.forEach((team) => {
        team.games.forEach((game) => {
          expect(game.opponentId).toBeGreaterThan(0)
          expect(game.teamScore).toBeGreaterThanOrEqual(0)
          expect(game.opponentScore).toBeGreaterThanOrEqual(0)
          expect(typeof game.isWin).toBe('boolean')
          expect(typeof game.isTie).toBe('boolean')
          expect(typeof game.competitiveLevelDiff).toBe('number')
        })
      })
    })

    it('should generate large dataset efficiently', () => {
      const start = Date.now()
      const teams = generateLargeDataset({ teamCount: 100, gamesPerTeam: 50 })
      const duration = Date.now() - start

      expect(teams).toHaveLength(100)
      expect(teams.reduce((sum, t) => sum + t.games.length, 0)).toBeGreaterThanOrEqual(5000)
      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000)
    })
  })

  describe('getDatasetInfo', () => {
    it('should calculate correct lookup estimates', () => {
      const teams = generateLargeDataset({ teamCount: 50, gamesPerTeam: 20 })
      const info = getDatasetInfo(teams)

      expect(info.teamCount).toBe(50)
      expect(info.totalGames).toBeGreaterThanOrEqual(1000)
      expect(info.averageGamesPerTeam).toBeGreaterThan(0)
      expect(info.estimatedLookups).toBeGreaterThanOrEqual(2000)
    })
  })

  describe('Export/Import Roundtrip', () => {
    it('should maintain data integrity through export/import cycle', () => {
      const originalTeams = generateLargeDataset({ teamCount: 20, gamesPerTeam: 10 })
      const json = JSON.stringify(originalTeams)
      const importedTeams = parseTeamDataFromJSON(json)

      expect(importedTeams).toHaveLength(originalTeams.length)
      importedTeams.forEach((team, index) => {
        const original = originalTeams[index]
        expect(team.id).toBe(original.id)
        expect(team.name).toBe(original.name)
        expect(team.competitiveLevel).toBe(original.competitiveLevel)
        expect(team.games).toHaveLength(original.games.length)

        team.games.forEach((game, gameIndex) => {
          const originalGame = original.games[gameIndex]
          expect(game.opponentId).toBe(originalGame.opponentId)
          expect(game.teamScore).toBe(originalGame.teamScore)
          expect(game.opponentScore).toBe(originalGame.opponentScore)
          expect(game.isWin).toBe(originalGame.isWin)
          expect(game.isTie).toBe(originalGame.isTie)
          expect(game.competitiveLevelDiff).toBe(originalGame.competitiveLevelDiff)
        })
      })
    })
  })
})

