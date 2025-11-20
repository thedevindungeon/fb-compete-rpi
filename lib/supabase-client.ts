import type { TeamData, GameData, TeamRPIResult } from './types'
import { getSupabaseClient } from './supabase-client-singleton'

export type MatchFilterOptions = {
  status?: 'all' | 'to_be_played' | 'in_progress' | 'completed' | 'cancelled'
  poolId?: string | null
  includeUnpublished?: boolean
}

export type MatchDataMetadata = {
  totalMatches: number
  matchesWithScores: number
  matchesWithoutScores: number
  totalGames: number
  teamsWithCompetitiveLevel: number
  teamsWithoutCompetitiveLevel: number
  warnings: string[]
  pools?: Array<{ id: string; name: string; matchCount: number }>
  statusBreakdown?: {
    to_be_played: number
    in_progress: number
    completed: number
    cancelled: number
  }
}

export type FetchTeamDataResult = {
  teams: TeamData[]
  metadata: MatchDataMetadata
}

/**
 * Fetches team data from Supabase for RPI calculations
 * 
 * Data Flow (per matching-rpi-integration.md):
 * 1. Fetch matches (published only)
 * 2. Extract team IDs from match_team
 * 3. Fetch team metadata (name, competitive_level_id)
 * 4. Transform match_game_team scores into GameData
 * 5. Calculate competitive level differences
 * 6. Build TeamData array with all games
 * 
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase anon key
 * @param eventId - Event ID to fetch matches for
 * @returns TeamData array with metadata about data quality
 */
export async function fetchTeamDataFromSupabase(
  supabaseUrl: string,
  supabaseKey: string,
  eventId: number,
  filters?: MatchFilterOptions
): Promise<TeamData[]> {
  const result = await fetchTeamDataFromSupabaseWithMetadata(
    supabaseUrl,
    supabaseKey,
    eventId,
    filters
  )
  return result.teams
}

/**
 * Fetches team data with metadata about data quality
 * 
 * @param filters - Optional filters for matches (status, pool, etc.)
 */
export async function fetchTeamDataFromSupabaseWithMetadata(
  supabaseUrl: string,
  supabaseKey: string,
  eventId: number,
  filters?: MatchFilterOptions
): Promise<FetchTeamDataResult> {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey)
  const metadata: MatchDataMetadata = {
    totalMatches: 0,
    matchesWithScores: 0,
    matchesWithoutScores: 0,
    totalGames: 0,
    teamsWithCompetitiveLevel: 0,
    teamsWithoutCompetitiveLevel: 0,
    warnings: [],
    statusBreakdown: {
      to_be_played: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    },
  }

  // Build base query
  let matchQuery = supabase
    .schema('fb_compete')
    .from('match')
    .select(
      `
      id,
      config,
      status,
      created_at,
      match_team!inner(
        team_id,
        definition
      ),
      match_game!inner(
        id,
        status,
        match_game_team!inner(
          team_id,
          score,
          definition
        )
      ),
      competition_pool_match(
        competition_pool_id
      )
    `
    )
    .eq('event_id', eventId)

  // Apply published filter (default: only published)
  if (!filters?.includeUnpublished) {
    matchQuery = matchQuery.eq('published', true)
  }

  // Apply status filter
  if (filters?.status && filters.status !== 'all') {
    matchQuery = matchQuery.eq('status', filters.status)
  }

  // Apply pool filter if specified
  if (filters?.poolId) {
    // First get match IDs for this pool
    const { data: poolMatches } = await supabase
      .schema('fb_compete')
      .from('competition_pool_match')
      .select('match_id')
      .eq('competition_pool_id', filters.poolId)
      .eq('published', true)

    if (poolMatches && poolMatches.length > 0) {
      const matchIds = poolMatches.map((pm) => pm.match_id)
      matchQuery = matchQuery.in('id', matchIds)
    } else {
      // No matches in this pool
      metadata.warnings.push(`No matches found in selected pool`)
      return { teams: [], metadata }
    }
  }

  const { data: matches, error: matchError } = await matchQuery

  if (matchError) {
    throw new Error(
      `Failed to fetch match data: ${matchError.message}. ` +
      `Ensure the event_id exists and matches are published.`
    )
  }

  if (!matches || matches.length === 0) {
    metadata.warnings.push('No published matches found for this event')
    return { teams: [], metadata }
  }

  metadata.totalMatches = matches.length

  // Calculate status breakdown
  matches.forEach((match: any) => {
    const status = match.status as string
    if (status && metadata.statusBreakdown) {
      if (status in metadata.statusBreakdown) {
        metadata.statusBreakdown[status as keyof typeof metadata.statusBreakdown]++
      }
    }
  })

  // Fetch pool information if available
  const poolIds = new Set<string>()
  matches.forEach((match: any) => {
    const poolMatches = match.competition_pool_match || []
    poolMatches.forEach((pm: { competition_pool_id?: string }) => {
      if (pm.competition_pool_id) {
        poolIds.add(pm.competition_pool_id)
      }
    })
  })

  if (poolIds.size > 0) {
    const { data: pools } = await supabase
      .schema('fb_compete')
      .from('competition_pool')
      .select('id, name')
      .in('id', Array.from(poolIds))

    if (pools) {
      metadata.pools = pools.map((pool) => {
        const matchCount = matches.filter((m: any) => {
          const poolMatches = m.competition_pool_match || []
          return poolMatches.some((pm: { competition_pool_id?: string }) => 
            pm.competition_pool_id === pool.id
          )
        }).length
        return {
          id: pool.id as string,
          name: (pool.name as string) || `Pool ${pool.id}`,
          matchCount,
        }
      })
    }
  }

  // Extract unique team IDs from matches
  const teamIds = new Set<number>()
  matches.forEach((match) => {
    const matchTeams = match.match_team as Array<{ team_id?: number }> | undefined
    matchTeams?.forEach((mt) => {
      if (mt.team_id) teamIds.add(mt.team_id)
    })
  })

  if (teamIds.size === 0) {
    metadata.warnings.push('No teams found in matches')
    return { teams: [], metadata }
  }

  // Teams table is in fb_compete schema - fetch competitive level too
  // competitive_level_id is CRITICAL for RPI calculations (per documentation)
  const { data: teams, error: teamError } = await supabase
    .schema('fb_compete')
    .from('teams')
    .select('id, name, competitive_level_id')
    .in('id', Array.from(teamIds))

  if (teamError) {
    throw new Error(
      `Failed to fetch team data: ${teamError.message}. ` +
      `Ensure teams exist in fb_compete.teams table.`
    )
  }

  const teamMap = new Map<number, { name: string; competitiveLevel: number }>()
  teams?.forEach((team) => {
    // Map competitive_level_id to competitiveLevel
    // Defaults to 5 if missing (per documentation)
    const competitiveLevel = (team.competitive_level_id as number) || 5
    
    if (!team.competitive_level_id) {
      metadata.teamsWithoutCompetitiveLevel++
    } else {
      metadata.teamsWithCompetitiveLevel++
    }
    
    teamMap.set(team.id as number, {
      name: team.name as string,
      competitiveLevel,
    })
  })

  if (metadata.teamsWithoutCompetitiveLevel > 0) {
    metadata.warnings.push(
      `${metadata.teamsWithoutCompetitiveLevel} team(s) missing competitive_level_id (defaulting to 5)`
    )
  }

  // Transform data into TeamData format
  // Per documentation: scores come from match_game_team.score (not match_game)
  const teamGamesMap = new Map<number, GameData[]>()

  type MatchTeam = { team_id?: number; definition?: string }
  type GameTeam = { team_id?: number; score?: number | null; definition?: string }
  type MatchGame = { id?: string; status?: string; match_game_team?: GameTeam[] }
  type Match = { 
    id?: string
    status?: string
    created_at?: string
    match_team?: MatchTeam[]
    match_game?: MatchGame[]
  }

  let matchesWithScores = 0
  let matchesWithoutScores = 0

  matches.forEach((match) => {
    const matchData = match as Match
    const matchTeams = matchData.match_team || []
    const matchGames = matchData.match_game || []
    const matchDate = matchData.created_at // ISO timestamp from match.created_at

    // Get team IDs from match
    const team1Id = matchTeams[0]?.team_id
    const team2Id = matchTeams[1]?.team_id

    if (!team1Id || !team2Id) {
      metadata.warnings.push(`Match ${matchData.id || 'unknown'} missing team data`)
      return
    }

    // Get competitive levels for both teams
    const team1Data = teamMap.get(team1Id)
    const team2Data = teamMap.get(team2Id)
    const team1Level = team1Data?.competitiveLevel || 5
    const team2Level = team2Data?.competitiveLevel || 5

    // Calculate competitive level difference (positive means opponent is stronger)
    // Per documentation: competitiveLevelDiff = opponentLevel - teamLevel
    const competitiveLevelDiff = team2Level - team1Level

    // Process each game in the match
    // Scores are per-game (match_game_team.score)
    let matchHasScores = false
    matchGames.forEach((game) => {
      const gameTeams = game.match_game_team || []
      const team1Score = gameTeams.find((gt) => gt.team_id === team1Id)?.score ?? null
      const team2Score = gameTeams.find((gt) => gt.team_id === team2Id)?.score ?? null

      // Handle null scores (treated as 0-0 tie per documentation)
      const team1ScoreFinal = team1Score ?? 0
      const team2ScoreFinal = team2Score ?? 0

      if (team1Score !== null && team2Score !== null) {
        matchHasScores = true
      }

      metadata.totalGames++

      // Add game for team 1
      if (!teamGamesMap.has(team1Id)) {
        teamGamesMap.set(team1Id, [])
      }
      teamGamesMap.get(team1Id)!.push({
        opponentId: team2Id,
        teamScore: team1ScoreFinal,
        opponentScore: team2ScoreFinal,
        isWin: team1ScoreFinal > team2ScoreFinal,
        isTie: team1ScoreFinal === team2ScoreFinal,
        competitiveLevelDiff, // Used in CLWP adjustments
        matchDate, // ISO timestamp from match.created_at
      })

      // Add game for team 2 (opposite competitive level diff)
      if (!teamGamesMap.has(team2Id)) {
        teamGamesMap.set(team2Id, [])
      }
      teamGamesMap.get(team2Id)!.push({
        opponentId: team1Id,
        teamScore: team2ScoreFinal,
        opponentScore: team1ScoreFinal,
        isWin: team2ScoreFinal > team1ScoreFinal,
        isTie: team1ScoreFinal === team2ScoreFinal,
        competitiveLevelDiff: -competitiveLevelDiff, // Opposite for team 2
        matchDate, // ISO timestamp from match.created_at
      })
    })

    if (matchHasScores) {
      matchesWithScores++
    } else {
      matchesWithoutScores++
    }
  })

  metadata.matchesWithScores = matchesWithScores
  metadata.matchesWithoutScores = matchesWithoutScores

  if (matchesWithoutScores > 0) {
    metadata.warnings.push(
      `${matchesWithoutScores} match(es) have no scores (treated as 0-0 ties)`
    )
  }

  if (metadata.totalGames === 0) {
    metadata.warnings.push('No games found in matches')
    return { teams: [], metadata }
  }

  // Build TeamData array
  // Teams with no games will have RPI = 0 (per documentation)
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

  // Sort by team ID for consistent ordering
  teamDataArray.sort((a, b) => a.id - b.id)

  return {
    teams: teamDataArray,
    metadata,
  }
}

/**
 * Save RPI results to the team_rpi table in Supabase
 * 
 * This function:
 * 1. Filters results to only selected team IDs
 * 2. Deactivates all previous RPI entries for those teams (for this sport)
 * 3. Inserts new RPI entries with active=true
 * 
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase key with write permissions
 * @param rpiResults - Calculated RPI results for all teams
 * @param teamIds - Array of team IDs to save (subset of rpiResults)
 * @param sportId - Sport ID to associate with these RPI values
 * @returns Success status and optional error message
 */
export async function saveTeamRPI(
  supabaseUrl: string,
  supabaseKey: string,
  rpiResults: TeamRPIResult[],
  teamIds: number[],
  sportId: number
): Promise<{ success: boolean; error?: string; insertedCount?: number }> {
  try {
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey)

    // Filter results to only selected teams
    const selectedResults = rpiResults.filter((result) => 
      teamIds.includes(result.teamId)
    )

    if (selectedResults.length === 0) {
      return {
        success: false,
        error: 'No teams selected or no RPI results to save',
      }
    }

    // Step 1: Deactivate all previous RPI entries for selected teams (for this sport)
    const { error: updateError } = await supabase
      .schema('fb_compete')
      .from('team_rpi')
      .update({ active: false })
      .in('team_id', teamIds)
      .eq('sport_id', sportId)
      .eq('active', true)

    if (updateError) {
      return {
        success: false,
        error: `Failed to deactivate previous RPI entries: ${updateError.message}`,
      }
    }

    // Step 2: Insert new RPI entries
    const now = new Date().toISOString()
    const insertData = selectedResults.map((result) => ({
      team_id: result.teamId,
      sport_id: sportId,
      value: result.rpi,
      generated_at: now,
      active: true,
    }))

    const { error: insertError, count } = await supabase
      .schema('fb_compete')
      .from('team_rpi')
      .insert(insertData)
      .select('*')

    if (insertError) {
      return {
        success: false,
        error: `Failed to insert new RPI entries: ${insertError.message}`,
      }
    }

    return {
      success: true,
      insertedCount: count || selectedResults.length,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    }
  }
}

