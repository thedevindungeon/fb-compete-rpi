import { describe, it, expect } from 'vitest'
import { getSportConfig, getSportName, getSportIcon, SPORT_CONFIGS, DEFAULT_SPORT_CONFIG } from '@/lib/sport-config'

describe('Sport Configuration', () => {
  describe('getSportConfig', () => {
    it('should return correct config for valid sport IDs', () => {
      const baseballConfig = getSportConfig(1)
      expect(baseballConfig.name).toBe('baseball')
      expect(baseballConfig.displayName).toBe('Baseball')
      expect(baseballConfig.icon).toBe('⚾')
      expect(baseballConfig.defaultCoefficients.minGames).toBe(5)
    })

    it('should return default config for invalid sport ID', () => {
      const config = getSportConfig(999)
      expect(config).toEqual(DEFAULT_SPORT_CONFIG)
      expect(config.name).toBe('unknown')
    })

    it('should return default config for null sport ID', () => {
      const config = getSportConfig(null)
      expect(config).toEqual(DEFAULT_SPORT_CONFIG)
    })

    it('should return default config for undefined sport ID', () => {
      const config = getSportConfig(undefined)
      expect(config).toEqual(DEFAULT_SPORT_CONFIG)
    })
  })

  describe('Sport-specific coefficients', () => {
    it('baseball should have lower diff coefficient', () => {
      const baseball = getSportConfig(1)
      const football = getSportConfig(3)
      expect(baseball.defaultCoefficients.diffCoeff).toBeLessThan(
        football.defaultCoefficients.diffCoeff
      )
    })

    it('football should have highest diff coefficient', () => {
      const football = getSportConfig(3)
      const allConfigs = Object.values(SPORT_CONFIGS)
      const maxDiffCoeff = Math.max(...allConfigs.map(c => c.defaultCoefficients.diffCoeff))
      expect(football.defaultCoefficients.diffCoeff).toBe(maxDiffCoeff)
    })

    it('volleyball and pickleball should hide domination column', () => {
      const volleyball = getSportConfig(4)
      const pickleball = getSportConfig(8)
      expect(volleyball.tableColumns.showDomination).toBe(false)
      expect(pickleball.tableColumns.showDomination).toBe(false)
    })

    it('all configs should have showDiff enabled by default', () => {
      const allConfigs = Object.values(SPORT_CONFIGS)
      allConfigs.forEach(config => {
        expect(config.tableColumns.showDiff).toBe(true)
      })
    })
  })

  describe('Scoring terminology', () => {
    it('baseball should use "runs"', () => {
      const baseball = getSportConfig(1)
      expect(baseball.scoringTerminology.points).toBe('runs')
      expect(baseball.scoringTerminology.score).toBe('runs')
    })

    it('soccer should use "goals"', () => {
      const soccer = getSportConfig(2)
      expect(soccer.scoringTerminology.points).toBe('goals')
    })

    it('basketball should use "points"', () => {
      const basketball = getSportConfig(5)
      expect(basketball.scoringTerminology.points).toBe('points')
    })
  })

  describe('getSportName', () => {
    it('should return display name for valid sport', () => {
      expect(getSportName(1)).toBe('Baseball')
      expect(getSportName(2)).toBe('Soccer')
      expect(getSportName(5)).toBe('Basketball')
    })

    it('should return "Unknown Sport" for invalid ID', () => {
      expect(getSportName(999)).toBe('Unknown Sport')
      expect(getSportName(null)).toBe('Unknown Sport')
      expect(getSportName(undefined)).toBe('Unknown Sport')
    })
  })

  describe('getSportIcon', () => {
    it('should return icon for valid sport', () => {
      expect(getSportIcon(1)).toBe('⚾')
      expect(getSportIcon(2)).toBe('⚽')
      expect(getSportIcon(3)).toBe('🏈')
    })

    it('should return default icon for invalid ID', () => {
      expect(getSportIcon(999)).toBe('🏆')
      expect(getSportIcon(null)).toBe('🏆')
    })
  })

  describe('All sports coverage', () => {
    it('should have configs for all 8 sports', () => {
      const sportIds = [1, 2, 3, 4, 5, 6, 7, 8]
      sportIds.forEach(id => {
        const config = getSportConfig(id)
        expect(config.id).toBe(id)
        expect(config.name).not.toBe('unknown')
      })
    })

    it('each sport should have unique ID', () => {
      const allConfigs = Object.values(SPORT_CONFIGS)
      const ids = allConfigs.map(c => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('each sport should have unique name', () => {
      const allConfigs = Object.values(SPORT_CONFIGS)
      const names = allConfigs.map(c => c.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })
  })

  describe('Coefficient validation', () => {
    it('all configs should have valid coefficient ranges', () => {
      const allConfigs = Object.values(SPORT_CONFIGS)
      allConfigs.forEach(config => {
        const coeffs = config.defaultCoefficients
        
        // Check coefficient sums roughly equal 1 (with some tolerance for adjustments)
        const sum = coeffs.clwpCoeff + coeffs.oclwpCoeff + coeffs.ooclwpCoeff
        expect(sum).toBeGreaterThanOrEqual(0.9)
        expect(sum).toBeLessThanOrEqual(1.2)
        
        // Check positive values
        expect(coeffs.diffCoeff).toBeGreaterThan(0)
        expect(coeffs.dominationCoeff).toBeGreaterThan(0)
        expect(coeffs.minGames).toBeGreaterThan(0)
        expect(coeffs.diffInterval).toBeGreaterThan(0)
      })
    })

    it('football should have fewer minimum games', () => {
      const football = getSportConfig(3)
      const baseball = getSportConfig(1)
      expect(football.defaultCoefficients.minGames).toBeLessThan(
        baseball.defaultCoefficients.minGames
      )
    })

    it('pickleball should require most games', () => {
      const pickleball = getSportConfig(8)
      const allConfigs = Object.values(SPORT_CONFIGS)
      const maxMinGames = Math.max(...allConfigs.map(c => c.defaultCoefficients.minGames))
      expect(pickleball.defaultCoefficients.minGames).toBe(maxMinGames)
    })
  })
})

