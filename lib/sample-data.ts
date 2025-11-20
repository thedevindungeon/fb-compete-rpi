import type { TeamData } from './types'

export const SAMPLE_TEAMS: TeamData[] = [
  {
    id: 1,
    name: 'Panthers Elite',
    competitiveLevel: 8,
    games: [
      { opponentId: 2, teamScore: 75, opponentScore: 68, isWin: true, competitiveLevelDiff: 1 },
      { opponentId: 3, teamScore: 82, opponentScore: 71, isWin: true, competitiveLevelDiff: 0 },
      { opponentId: 4, teamScore: 79, opponentScore: 73, isWin: true, competitiveLevelDiff: -1 },
      { opponentId: 5, teamScore: 88, opponentScore: 81, isWin: true, competitiveLevelDiff: 2 },
      { opponentId: 6, teamScore: 71, opponentScore: 74, isWin: false, competitiveLevelDiff: 1 },
      { opponentId: 7, teamScore: 85, opponentScore: 79, isWin: true, competitiveLevelDiff: 0 },
    ],
  },
  {
    id: 2,
    name: 'Warriors Pro',
    competitiveLevel: 9,
    games: [
      { opponentId: 1, teamScore: 68, opponentScore: 75, isWin: false, competitiveLevelDiff: -1 },
      { opponentId: 3, teamScore: 91, opponentScore: 88, isWin: true, competitiveLevelDiff: 1 },
      { opponentId: 4, teamScore: 77, opponentScore: 72, isWin: true, competitiveLevelDiff: 0 },
      { opponentId: 5, teamScore: 85, opponentScore: 80, isWin: true, competitiveLevelDiff: 3 },
      { opponentId: 6, teamScore: 79, opponentScore: 81, isWin: false, competitiveLevelDiff: 2 },
    ],
  },
  {
    id: 3,
    name: 'Dragons United',
    competitiveLevel: 8,
    games: [
      { opponentId: 1, teamScore: 71, opponentScore: 82, isWin: false, competitiveLevelDiff: 0 },
      { opponentId: 2, teamScore: 88, opponentScore: 91, isWin: false, competitiveLevelDiff: -1 },
      { opponentId: 4, teamScore: 84, opponentScore: 76, isWin: true, competitiveLevelDiff: -1 },
      { opponentId: 5, teamScore: 90, opponentScore: 85, isWin: true, competitiveLevelDiff: 1 },
      { opponentId: 7, teamScore: 78, opponentScore: 81, isWin: false, competitiveLevelDiff: 0 },
    ],
  },
  {
    id: 4,
    name: 'Tigers Academy',
    competitiveLevel: 7,
    games: [
      { opponentId: 1, teamScore: 73, opponentScore: 79, isWin: false, competitiveLevelDiff: 1 },
      { opponentId: 2, teamScore: 72, opponentScore: 77, isWin: false, competitiveLevelDiff: 2 },
      { opponentId: 3, teamScore: 76, opponentScore: 84, isWin: false, competitiveLevelDiff: 1 },
      { opponentId: 5, teamScore: 81, opponentScore: 78, isWin: true, competitiveLevelDiff: 0 },
      { opponentId: 6, teamScore: 74, opponentScore: 77, isWin: false, competitiveLevelDiff: 3 },
      { opponentId: 7, teamScore: 80, opponentScore: 75, isWin: true, competitiveLevelDiff: -1 },
    ],
  },
  {
    id: 5,
    name: 'Eagles Select',
    competitiveLevel: 6,
    games: [
      { opponentId: 1, teamScore: 81, opponentScore: 88, isWin: false, competitiveLevelDiff: 2 },
      { opponentId: 2, teamScore: 80, opponentScore: 85, isWin: false, competitiveLevelDiff: 3 },
      { opponentId: 3, teamScore: 85, opponentScore: 90, isWin: false, competitiveLevelDiff: 2 },
      { opponentId: 4, teamScore: 78, opponentScore: 81, isWin: false, competitiveLevelDiff: 1 },
      { opponentId: 6, teamScore: 83, opponentScore: 79, isWin: true, competitiveLevelDiff: 4 },
      { opponentId: 7, teamScore: 76, opponentScore: 82, isWin: false, competitiveLevelDiff: 1 },
    ],
  },
  {
    id: 6,
    name: 'Hawks Division',
    competitiveLevel: 10,
    games: [
      { opponentId: 1, teamScore: 74, opponentScore: 71, isWin: true, competitiveLevelDiff: -2 },
      { opponentId: 2, teamScore: 81, opponentScore: 79, isWin: true, competitiveLevelDiff: -1 },
      { opponentId: 4, teamScore: 77, opponentScore: 74, isWin: true, competitiveLevelDiff: -3 },
      { opponentId: 5, teamScore: 79, opponentScore: 83, isWin: false, competitiveLevelDiff: -4 },
      { opponentId: 7, teamScore: 87, opponentScore: 84, isWin: true, competitiveLevelDiff: -2 },
    ],
  },
  {
    id: 7,
    name: 'Phoenix Rising',
    competitiveLevel: 8,
    games: [
      { opponentId: 1, teamScore: 79, opponentScore: 85, isWin: false, competitiveLevelDiff: 0 },
      { opponentId: 3, teamScore: 81, opponentScore: 78, isWin: true, competitiveLevelDiff: 0 },
      { opponentId: 4, teamScore: 75, opponentScore: 80, isWin: false, competitiveLevelDiff: -1 },
      { opponentId: 5, teamScore: 82, opponentScore: 76, isWin: true, competitiveLevelDiff: 2 },
      { opponentId: 6, teamScore: 84, opponentScore: 87, isWin: false, competitiveLevelDiff: 2 },
    ],
  },
  {
    id: 8,
    name: 'Falcons Premier',
    competitiveLevel: 9,
    games: [
      { opponentId: 9, teamScore: 92, opponentScore: 88, isWin: true, competitiveLevelDiff: 0 },
      { opponentId: 10, teamScore: 87, opponentScore: 82, isWin: true, competitiveLevelDiff: -1 },
      { opponentId: 1, teamScore: 94, opponentScore: 89, isWin: true, competitiveLevelDiff: -1 },
      { opponentId: 2, teamScore: 91, opponentScore: 86, isWin: true, competitiveLevelDiff: 0 },
      { opponentId: 3, teamScore: 88, opponentScore: 84, isWin: true, competitiveLevelDiff: -1 },
      { opponentId: 4, teamScore: 93, opponentScore: 79, isWin: true, competitiveLevelDiff: -2 },
      { opponentId: 5, teamScore: 90, opponentScore: 81, isWin: true, competitiveLevelDiff: -3 },
      { opponentId: 6, teamScore: 95, opponentScore: 88, isWin: true, competitiveLevelDiff: 1 },
      { opponentId: 7, teamScore: 89, opponentScore: 84, isWin: true, competitiveLevelDiff: -1 },
    ],
  },
  {
    id: 9,
    name: 'Sharks Elite',
    competitiveLevel: 9,
    games: [
      { opponentId: 8, teamScore: 88, opponentScore: 92, isWin: false, competitiveLevelDiff: 0 },
      { opponentId: 10, teamScore: 85, opponentScore: 81, isWin: true, competitiveLevelDiff: -1 },
      { opponentId: 2, teamScore: 79, opponentScore: 83, isWin: false, competitiveLevelDiff: 0 },
      { opponentId: 6, teamScore: 86, opponentScore: 89, isWin: false, competitiveLevelDiff: 1 },
    ],
  },
  {
    id: 10,
    name: 'Bulls Academy',
    competitiveLevel: 8,
    games: [
      { opponentId: 8, teamScore: 82, opponentScore: 87, isWin: false, competitiveLevelDiff: 1 },
      { opponentId: 9, teamScore: 81, opponentScore: 85, isWin: false, competitiveLevelDiff: 1 },
      { opponentId: 1, teamScore: 77, opponentScore: 80, isWin: false, competitiveLevelDiff: 0 },
      { opponentId: 3, teamScore: 79, opponentScore: 82, isWin: false, competitiveLevelDiff: 0 },
      { opponentId: 7, teamScore: 84, opponentScore: 81, isWin: true, competitiveLevelDiff: 0 },
    ],
  },
]

export function getSampleTeamsDescription(): string {
  return `
Sample data includes 10 basketball teams across different competitive levels (6-10).
Each team has played 4-9 games against other teams.
Competitive levels affect RPI calculations:
- Higher level = stronger competition
- Level differences are considered in win/loss adjustments
- Team 8 (Falcons Premier) has 9 consecutive wins for domination bonus testing
`.trim()
}

