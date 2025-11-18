import type { TeamData, GameData } from './types'
import { getSupabaseClient } from './supabase-client-singleton'

export async function fetchTeamDataFromSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  eventId: number
): Promise<TeamData[]> {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey)

  // Fetch matches and related data
  const { data: matches, error: matchError } = await supabase
    .schema('fb_compete')
    .from('match')
    .select(
      `
      id,
      config,
      match_team!inner(
        team_id,
        definition
      ),
      match_game!inner(
        id,
        match_game_team!inner(
          team_id,
          score,
          definition
        )
      )
    `
    )
    .eq('event_id', eventId)
    .eq('published', true)

  if (matchError) {
    throw new Error(`Failed to fetch match data: ${matchError.message}`)
  }

  if (!matches || matches.length === 0) {
    return []
  }

  // Fetch team names
  const teamIds = new Set<number>()
  matches.forEach((match) => {
    const matchTeams = match.match_team as Array<{ team_id?: number }> | undefined
    matchTeams?.forEach((mt) => {
      if (mt.team_id) teamIds.add(mt.team_id)
    })
  })

  // Teams table is in fb_compete schema - fetch competitive level too
  const { data: teams, error: teamError } = await supabase
    .schema('fb_compete')
    .from('teams')
    .select('id, name, competitive_level_id')
    .in('id', Array.from(teamIds))

  if (teamError) {
    throw new Error(`Failed to fetch team data: ${teamError.message}`)
  }

  const teamMap = new Map<number, { name: string; competitiveLevel: number }>()
  teams?.forEach((team) => {
    // Map competitive_level_id to competitiveLevel (use power_rank if available, otherwise use ID or default to 5)
    const competitiveLevel = (team.competitive_level_id as number) || 5
    teamMap.set(team.id as number, {
      name: team.name as string,
      competitiveLevel,
    })
  })

  // Transform data into TeamData format
  const teamGamesMap = new Map<number, GameData[]>()

  type MatchTeam = { team_id?: number; definition?: string }
  type GameTeam = { team_id?: number; score?: number; definition?: string }
  type MatchGame = { id?: string; match_game_team?: GameTeam[] }
  type Match = { match_team?: MatchTeam[]; match_game?: MatchGame[] }

  matches.forEach((match) => {
    const matchData = match as Match
    const matchTeams = matchData.match_team || []
    const matchGames = matchData.match_game || []

    // Get team IDs from match
    const team1Id = matchTeams[0]?.team_id
    const team2Id = matchTeams[1]?.team_id

    if (!team1Id || !team2Id) return

    // Get competitive levels for both teams
    const team1Data = teamMap.get(team1Id)
    const team2Data = teamMap.get(team2Id)
    const team1Level = team1Data?.competitiveLevel || 5
    const team2Level = team2Data?.competitiveLevel || 5

    // Calculate competitive level difference (positive means opponent is stronger)
    const competitiveLevelDiff = team2Level - team1Level

    // Calculate scores from match games
    matchGames.forEach((game) => {
      const gameTeams = game.match_game_team || []
      const team1Score = gameTeams.find((gt) => gt.team_id === team1Id)?.score || 0
      const team2Score = gameTeams.find((gt) => gt.team_id === team2Id)?.score || 0

      // Add game for team 1
      if (!teamGamesMap.has(team1Id)) {
        teamGamesMap.set(team1Id, [])
      }
      teamGamesMap.get(team1Id)!.push({
        opponentId: team2Id,
        teamScore: team1Score,
        opponentScore: team2Score,
        isWin: team1Score > team2Score,
        isTie: team1Score === team2Score,
        competitiveLevelDiff, // Calculate based on actual competitive levels
      })

      // Add game for team 2 (opposite competitive level diff)
      if (!teamGamesMap.has(team2Id)) {
        teamGamesMap.set(team2Id, [])
      }
      teamGamesMap.get(team2Id)!.push({
        opponentId: team1Id,
        teamScore: team2Score,
        opponentScore: team1Score,
        isWin: team2Score > team1Score,
        isTie: team1Score === team2Score,
        competitiveLevelDiff: -competitiveLevelDiff, // Opposite for team 2
      })
    })
  })

  // Build TeamData array
  const teamDataArray: TeamData[] = []
  teamGamesMap.forEach((games, teamId) => {
    const teamInfo = teamMap.get(teamId)
    teamDataArray.push({
      id: teamId,
      name: teamInfo?.name || `Team ${teamId}`,
      games,
      competitiveLevel: teamInfo?.competitiveLevel || 5,
    })
  })

  return teamDataArray
}

