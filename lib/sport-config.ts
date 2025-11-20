import type { RPICoefficients } from './types'

export type SportType = 
  | 'baseball' 
  | 'soccer' 
  | 'football' 
  | 'volleyball' 
  | 'basketball' 
  | 'hockey' 
  | 'lacrosse' 
  | 'pickle_ball'
  | 'unknown'

export type SportConfig = {
  id: number
  name: string
  displayName: string
  icon: string
  defaultCoefficients: RPICoefficients
  scoringTerminology: {
    points: string // "points", "runs", "goals"
    score: string // "score", "runs"
  }
  tableColumns: {
    showDiff: boolean // Show point differential
    showDomination: boolean // Show domination bonus indicator
  }
}

// Sport-specific RPI coefficient configurations
export const SPORT_CONFIGS: Record<number, SportConfig> = {
  1: {
    // Baseball - NCAA Standard 25-50-25
    id: 1,
    name: 'baseball',
    displayName: 'Baseball',
    icon: '⚾',
    defaultCoefficients: {
      clwpCoeff: 0.25, // WP weight (NCAA standard)
      oclwpCoeff: 0.50, // OWP weight (NCAA standard - opponents matter most!)
      ooclwpCoeff: 0.25, // OOWP weight (NCAA standard)
      diffCoeff: 0.05, // Lower impact for baseball (runs less indicative)
      dominationCoeff: 1.0, // No domination penalty for baseball
      clgwStep: 0.05,
      clglStep: 0.1,
      minGames: 5, // Baseball needs more games for accurate RPI
      diffInterval: 5, // Runs differential interval
    },
    scoringTerminology: {
      points: 'runs',
      score: 'runs',
    },
    tableColumns: {
      showDiff: true,
      showDomination: true,
    },
  },
  2: {
    // Soccer - NCAA Standard 25-50-25 with tie handling
    id: 2,
    name: 'soccer',
    displayName: 'Soccer',
    icon: '⚽',
    defaultCoefficients: {
      clwpCoeff: 0.25, // WP weight (NCAA standard)
      oclwpCoeff: 0.50, // OWP weight (NCAA standard)
      ooclwpCoeff: 0.25, // OOWP weight (NCAA standard)
      diffCoeff: 0.08, // Moderate impact (goals are significant, ties count as 0.5 wins)
      dominationCoeff: 1.0, // No domination penalty for soccer
      clgwStep: 0.05,
      clglStep: 0.1,
      minGames: 4,
      diffInterval: 3, // Goal differential interval
    },
    scoringTerminology: {
      points: 'goals',
      score: 'goals',
    },
    tableColumns: {
      showDiff: true,
      showDomination: true,
    },
  },
  3: {
    // Football - Modified for point differential importance
    id: 3,
    name: 'football',
    displayName: 'Football',
    icon: '🏈',
    defaultCoefficients: {
      clwpCoeff: 0.35, // Higher than NCAA standard for W/L record
      oclwpCoeff: 0.40, // Lower than NCAA standard
      ooclwpCoeff: 0.25, // NCAA standard
      diffCoeff: 0.15, // Highest impact (point differential very important in football)
      dominationCoeff: 0.9, // Slight penalty for blowouts
      clgwStep: 0.06,
      clglStep: 0.12,
      minGames: 3, // Fewer games in football season
      diffInterval: 14, // Touchdown + PAT intervals
    },
    scoringTerminology: {
      points: 'points',
      score: 'points',
    },
    tableColumns: {
      showDiff: true,
      showDomination: true,
    },
  },
  4: {
    // Volleyball - NCAA Standard 25-50-25
    id: 4,
    name: 'volleyball',
    displayName: 'Volleyball',
    icon: '🏐',
    defaultCoefficients: {
      clwpCoeff: 0.25, // WP weight (NCAA standard)
      oclwpCoeff: 0.50, // OWP weight (NCAA standard)
      ooclwpCoeff: 0.25, // OOWP weight (NCAA standard)
      diffCoeff: 0.03, // Lower impact (set-based scoring)
      dominationCoeff: 1.0, // No domination penalty
      clgwStep: 0.04,
      clglStep: 0.08,
      minGames: 5,
      diffInterval: 5, // Point differential in sets
    },
    scoringTerminology: {
      points: 'points',
      score: 'points',
    },
    tableColumns: {
      showDiff: true,
      showDomination: false, // Less relevant for volleyball
    },
  },
  5: {
    // Basketball - Custom 90-10-10 with adjustments
    id: 5,
    name: 'basketball',
    displayName: 'Basketball',
    icon: '🏀',
    defaultCoefficients: {
      clwpCoeff: 0.90, // Custom weight - your record matters most
      oclwpCoeff: 0.10, // Opponent strength secondary
      ooclwpCoeff: 0.10, // Opponent's opponent strength tertiary
      diffCoeff: 0.10, // Moderate impact for point differential
      dominationCoeff: 0.9, // Penalty for 8+ game win streaks
      clgwStep: 0.05,
      clglStep: 0.1,
      minGames: 4,
      diffInterval: 10, // ~10 point intervals
    },
    scoringTerminology: {
      points: 'points',
      score: 'points',
    },
    tableColumns: {
      showDiff: true,
      showDomination: true,
    },
  },
  6: {
    // Hockey - Similar to Soccer with tie handling
    id: 6,
    name: 'hockey',
    displayName: 'Hockey',
    icon: '🏒',
    defaultCoefficients: {
      clwpCoeff: 0.25, // WP weight (similar to NCAA standard)
      oclwpCoeff: 0.50, // OWP weight (similar to NCAA standard)
      ooclwpCoeff: 0.25, // OOWP weight (similar to NCAA standard)
      diffCoeff: 0.08, // Moderate impact (goals matter, ties possible)
      dominationCoeff: 1.0, // No domination penalty
      clgwStep: 0.05,
      clglStep: 0.1,
      minGames: 4,
      diffInterval: 2, // Goal differential
    },
    scoringTerminology: {
      points: 'goals',
      score: 'goals',
    },
    tableColumns: {
      showDiff: true,
      showDomination: true,
    },
  },
  7: {
    // Lacrosse - Hybrid approach (balanced W/L and schedule)
    id: 7,
    name: 'lacrosse',
    displayName: 'Lacrosse',
    icon: '🥍',
    defaultCoefficients: {
      clwpCoeff: 0.30, // Balanced between custom and NCAA standard
      oclwpCoeff: 0.45, // Strong opponent schedule emphasis
      ooclwpCoeff: 0.25, // NCAA standard
      diffCoeff: 0.10, // Moderate impact (goals are significant)
      dominationCoeff: 1.0, // No domination penalty
      clgwStep: 0.05,
      clglStep: 0.1,
      minGames: 4,
      diffInterval: 3, // Goal differential
    },
    scoringTerminology: {
      points: 'goals',
      score: 'goals',
    },
    tableColumns: {
      showDiff: true,
      showDomination: true,
    },
  },
  8: {
    // Pickleball - Similar to Volleyball NCAA standard
    id: 8,
    name: 'pickle_ball',
    displayName: 'Pickleball',
    icon: '🏓',
    defaultCoefficients: {
      clwpCoeff: 0.25, // WP weight (NCAA standard like volleyball)
      oclwpCoeff: 0.50, // OWP weight (NCAA standard like volleyball)
      ooclwpCoeff: 0.25, // OOWP weight (NCAA standard like volleyball)
      diffCoeff: 0.02, // Lowest impact (game-based scoring)
      dominationCoeff: 1.0, // No domination penalty
      clgwStep: 0.04,
      clglStep: 0.08,
      minGames: 6, // More games typical in pickleball
      diffInterval: 5,
    },
    scoringTerminology: {
      points: 'points',
      score: 'points',
    },
    tableColumns: {
      showDiff: true,
      showDomination: false,
    },
  },
}

// Default configuration for unknown sports
export const DEFAULT_SPORT_CONFIG: SportConfig = {
  id: 0,
  name: 'unknown',
  displayName: 'Unknown Sport',
  icon: '🏆',
  defaultCoefficients: {
    clwpCoeff: 0.9,
    oclwpCoeff: 0.1,
    ooclwpCoeff: 0.1,
    diffCoeff: 0.1,
    dominationCoeff: 0.9,
    clgwStep: 0.05,
    clglStep: 0.1,
    minGames: 3,
    diffInterval: 15,
  },
  scoringTerminology: {
    points: 'points',
    score: 'score',
  },
  tableColumns: {
    showDiff: true,
    showDomination: true,
  },
}

export function getSportConfig(sportId: number | null | undefined): SportConfig {
  if (!sportId) return DEFAULT_SPORT_CONFIG
  return SPORT_CONFIGS[sportId] || DEFAULT_SPORT_CONFIG
}

export function getSportName(sportId: number | null | undefined): string {
  const config = getSportConfig(sportId)
  return config.displayName
}

export function getSportIcon(sportId: number | null | undefined): string {
  const config = getSportConfig(sportId)
  return config.icon
}

/**
 * Get sport type from sport ID
 */
export function getSportType(sportId: number | null | undefined): SportType {
  if (!sportId) return 'unknown'
  const sportIdMap: Record<number, SportType> = {
    1: 'baseball',
    2: 'soccer',
    3: 'football',
    4: 'volleyball',
    5: 'basketball',
    6: 'hockey',
    7: 'lacrosse',
    8: 'pickle_ball',
  }
  return sportIdMap[sportId] || 'unknown'
}

