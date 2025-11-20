import { getSupabaseClient } from './supabase-client-singleton'

export type EventInfo = {
  id: number
  name: string | null
  start_date: string | null
  end_date: string | null
  published: boolean | null
  sport_id?: number | null
  match_count?: number
  team_count?: number
}

export type DatabaseInfo = {
  connected: boolean
  events: EventInfo[]
  error?: string
}

/**
 * Test connection to Supabase with just URL and anon key
 */
export async function testSupabaseConnection(
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey)
    
    // Try a simple query to test connection - try events table first
    const { error: eventsError } = await supabase.from('events').select('id').limit(1)
    
    if (eventsError) {
      // If events table doesn't exist or has RLS issues, try a simpler test
      // Just check if we can connect to the API
      return { success: false, error: eventsError.message }
    }
    
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Explore database and list available events
 */
export async function exploreDatabase(
  supabaseUrl: string,
  supabaseKey: string
): Promise<DatabaseInfo> {
  try {
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey)

    // Fetch events - we'll get sport_id separately from compete_event_details
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, name, event_start_local_at, event_end_local_at')
      .order('event_start_local_at', { ascending: false })

    if (eventsError) {
      return {
        connected: false,
        events: [],
        error: `Failed to fetch events: ${eventsError.message}`,
      }
    }

    // Fetch sport_id for all events from compete_event_details
    const eventIds = events?.map(e => e.id) || []
    const { data: eventDetails, error: detailsError } = await supabase
      .schema('fb_compete')
      .from('compete_event_details')
      .select('event_id, sport_id')
      .in('event_id', eventIds)
    
    // Debug logging
    if (detailsError) {
      console.warn('Error fetching event details:', detailsError)
    }
    
    const sportIdMap = new Map<number, number | null>()
    eventDetails?.forEach((detail: any) => {
      sportIdMap.set(detail.event_id, detail.sport_id)
    })
    
    // Debug: Log all sport_id mappings in a table
    if (eventDetails && eventDetails.length > 0) {
      console.table(eventDetails.map((d: any) => ({
        event_id: d.event_id,
        sport_id: d.sport_id,
      })))
    }

    // For each event, get match and team counts
    const eventsWithStats: EventInfo[] = await Promise.all(
      (events || []).map(async (event) => {
        // Get match count
        const { count: matchCount } = await supabase
          .schema('fb_compete')
          .from('match')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('published', true)

        // Get unique team count from matches
        const { data: matches } = await supabase
          .schema('fb_compete')
          .from('match')
          .select('match_team!inner(team_id)')
          .eq('event_id', event.id)
          .eq('published', true)

        const teamIds = new Set<number>()
        matches?.forEach((match: any) => {
          const matchTeams = match.match_team || []
          matchTeams.forEach((mt: { team_id?: number }) => {
            if (mt.team_id) teamIds.add(mt.team_id)
          })
        })

        return {
          id: event.id,
          name: event.name,
          start_date: event.event_start_local_at ? new Date(event.event_start_local_at).toISOString() : null,
          end_date: event.event_end_local_at ? new Date(event.event_end_local_at).toISOString() : null,
          published: true, // Assume published if we can see it (RLS handles visibility)
          sport_id: sportIdMap.get(event.id) || null,
          match_count: matchCount || 0,
          team_count: teamIds.size,
        }
      })
    )

    // Debug: Log final event-to-sport mapping
    console.group('📊 Event Sport Mapping')
    console.table(eventsWithStats.map(e => ({
      id: e.id,
      name: e.name,
      sport_id: e.sport_id,
      matches: e.match_count,
      teams: e.team_count,
    })))
    console.groupEnd()

    return {
      connected: true,
      events: eventsWithStats,
    }
  } catch (err) {
    return {
      connected: false,
      events: [],
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get preview of event data (teams, matches, etc.)
 */
export async function getEventPreview(
  supabaseUrl: string,
  supabaseKey: string,
  eventId: number
): Promise<{
  event: EventInfo | null
  teams: Array<{ id: number; name: string }>
  matchCount: number
  error?: string
}> {
  try {
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey)

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, name, event_start_local_at, event_end_local_at')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return {
        event: null,
        teams: [],
        matchCount: 0,
        error: `Event not found: ${eventError?.message || 'Unknown error'}`,
      }
    }

    // Get sport_id from compete_event_details
    const { data: eventDetails } = await supabase
      .schema('fb_compete')
      .from('compete_event_details')
      .select('sport_id')
      .eq('event_id', eventId)
      .single()
    
    const sportId = eventDetails?.sport_id as number | null

    // Get matches
    const { data: matches, error: matchError } = await supabase
      .schema('fb_compete')
      .from('match')
      .select('match_team!inner(team_id)')
      .eq('event_id', eventId)
      .eq('published', true)

    if (matchError) {
      return {
        event: {
          id: eventData.id,
          name: eventData.name,
          start_date: eventData.event_start_local_at ? new Date(eventData.event_start_local_at).toISOString() : null,
          end_date: eventData.event_end_local_at ? new Date(eventData.event_end_local_at).toISOString() : null,
          published: true,
          sport_id: sportId,
        },
        teams: [],
        matchCount: 0,
        error: `Failed to fetch matches: ${matchError.message}`,
      }
    }

    // Get unique team IDs
    const teamIds = new Set<number>()
    matches?.forEach((match: any) => {
      const matchTeams = match.match_team || []
      matchTeams.forEach((mt: { team_id?: number }) => {
        if (mt.team_id) teamIds.add(mt.team_id)
      })
    })

    // Get team names - teams table is in fb_compete schema
    const { data: teams, error: teamError } = await supabase
      .schema('fb_compete')
      .from('teams')
      .select('id, name')
      .in('id', Array.from(teamIds))

    if (teamError) {
      return {
        event: {
          id: eventData.id,
          name: eventData.name,
          start_date: eventData.event_start_local_at ? new Date(eventData.event_start_local_at).toISOString() : null,
          end_date: eventData.event_end_local_at ? new Date(eventData.event_end_local_at).toISOString() : null,
          published: true,
          sport_id: sportId,
        },
        teams: [],
        matchCount: matches?.length || 0,
        error: `Failed to fetch teams: ${teamError.message}`,
      }
    }

    return {
      event: {
        id: eventData.id,
        name: eventData.name,
        start_date: eventData.event_start_local_at ? new Date(eventData.event_start_local_at).toISOString() : null,
        end_date: eventData.event_end_local_at ? new Date(eventData.event_end_local_at).toISOString() : null,
        published: true,
        sport_id: sportId,
        match_count: matches?.length || 0,
        team_count: teamIds.size,
      },
      teams: (teams || []).map((t) => ({
        id: t.id as number,
        name: t.name as string,
      })),
      matchCount: matches?.length || 0,
    }
  } catch (err) {
    return {
      event: null,
      teams: [],
      matchCount: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

