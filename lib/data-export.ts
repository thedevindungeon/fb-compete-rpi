import type { TeamData } from './types'

/**
 * Export TeamData array to JSON file for download
 * This creates a complete dataset that can be uploaded later for client-side RPI calculations
 */
export function exportTeamDataToJSON(teams: TeamData[], filename?: string): void {
  const jsonContent = JSON.stringify(teams, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `rpi-dataset-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parse uploaded JSON file and validate it as TeamData[]
 */
export function parseTeamDataFromJSON(jsonContent: string): TeamData[] {
  try {
    const parsed = JSON.parse(jsonContent)
    
    if (!Array.isArray(parsed)) {
      throw new Error('JSON must be an array of teams')
    }

    // Basic validation
    const teams: TeamData[] = parsed.map((team, index) => {
      if (!team || typeof team !== 'object') {
        throw new Error(`Team at index ${index} is not a valid object`)
      }

      if (typeof team.id !== 'number' || typeof team.name !== 'string') {
        throw new Error(`Team at index ${index} missing required fields: id (number) and name (string)`)
      }

      if (!Array.isArray(team.games)) {
        throw new Error(`Team at index ${index} missing games array`)
      }

      // Validate games
      const games = team.games.map((game: unknown, gameIndex: number) => {
        if (!game || typeof game !== 'object') {
          throw new Error(`Team ${team.id} game at index ${gameIndex} is not a valid object`)
        }

        const g = game as Partial<TeamData['games'][0]>
        if (
          typeof g.opponentId !== 'number' ||
          typeof g.teamScore !== 'number' ||
          typeof g.opponentScore !== 'number' ||
          typeof g.isWin !== 'boolean'
        ) {
          throw new Error(
            `Team ${team.id} game at index ${gameIndex} missing required fields: opponentId, teamScore, opponentScore, isWin`
          )
        }

        return {
          opponentId: g.opponentId,
          teamScore: g.teamScore,
          opponentScore: g.opponentScore,
          isWin: g.isWin,
          isTie: g.isTie ?? false,
          competitiveLevelDiff: g.competitiveLevelDiff ?? 0,
        }
      })

      return {
        id: team.id,
        name: team.name,
        games,
        competitiveLevel: typeof team.competitiveLevel === 'number' ? team.competitiveLevel : 5,
      }
    })

    return teams
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to parse JSON file')
  }
}

/**
 * Get dataset statistics for display
 */
export function getDatasetStats(teams: TeamData[]): {
  teamCount: number
  totalGames: number
  totalRecords: number
  fileSizeEstimate: string
} {
  const teamCount = teams.length
  const totalGames = teams.reduce((sum, team) => sum + team.games.length, 0)
  // Each game appears twice (once for each team), so total records = totalGames
  const totalRecords = totalGames
  const estimatedSize = JSON.stringify(teams).length
  const fileSizeEstimate = formatFileSize(estimatedSize)

  return {
    teamCount,
    totalGames,
    totalRecords,
    fileSizeEstimate,
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

