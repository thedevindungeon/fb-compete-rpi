import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { calculateAllTeamsRPI } from '@/lib/rpi-calculator'
import type { TeamData, RPICoefficients } from '@/lib/types'

// Create a stable hash for teams array to use in query key
function getTeamsHash(teams: TeamData[]): string {
  if (teams.length === 0) return 'empty'
  // Create a more robust hash using team IDs and game counts
  const teamIds = teams.map(t => t.id).sort().join(',')
  const totalGames = teams.reduce((sum, team) => sum + team.games.length, 0)
  // Use a simple hash of the IDs (first 50 chars to avoid huge keys)
  const idsHash = teamIds.length > 50 ? teamIds.substring(0, 50) + '...' : teamIds
  return `${teams.length}-${totalGames}-${idsHash}`
}

export function useRPICalculation(
  teams: TeamData[],
  coefficients: RPICoefficients
) {
  // Create stable query key based on teams hash and coefficients
  const queryKey = useMemo(() => {
    const teamsHash = getTeamsHash(teams)
    const coeffsHash = JSON.stringify(coefficients)
    return ['rpi-calculation', teamsHash, coeffsHash]
  }, [teams, coefficients])

  return useQuery({
    queryKey,
    queryFn: () => {
      if (teams.length === 0) {
        return []
      }
      return calculateAllTeamsRPI(teams, coefficients)
    },
    enabled: teams.length > 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

