import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const url = request.headers.get('x-supabase-url')
    const key = request.headers.get('x-supabase-key')

    if (!url || !key) {
      return NextResponse.json(
        { error: 'Supabase credentials required' },
        { status: 400 }
      )
    }

    const supabase = createClient(url, key)

    // Fetch all stats in parallel using proper schema syntax
    const [eventsResult, teamsResult, matchesResult, sportsResult, rpiRunsResult] =
      await Promise.all([
        // Total events
        supabase
          .schema('fb_compete')
          .from('compete_event_details')
          .select('*', { count: 'exact', head: true }),

        // Total teams
        supabase
          .schema('fb_compete')
          .from('compete_teams')
          .select('*', { count: 'exact', head: true }),

        // Total matches
        supabase
          .schema('fb_compete')
          .from('compete_team_results')
          .select('*', { count: 'exact', head: true }),

        // Total sports
        supabase
          .schema('fb_compete')
          .from('sports')
          .select('*', { count: 'exact', head: true }),

        // Recent RPI calculation runs (if table exists)
        supabase
          .schema('fb_compete')
          .from('rpi_calculation_runs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      ])

    const totalEvents = eventsResult.count || 0
    const totalTeams = teamsResult.count || 0
    const totalMatches = matchesResult.count || 0
    const totalSports = sportsResult.count || 0
    const recentRPIRuns = rpiRunsResult.count || 0

    // Calculate averages
    const avgTeamsPerEvent = totalEvents > 0 ? totalTeams / totalEvents : 0
    const avgMatchesPerEvent = totalEvents > 0 ? totalMatches / totalEvents : 0

    return NextResponse.json({
      totalEvents,
      totalTeams,
      totalMatches,
      totalSports,
      recentRPIRuns,
      avgTeamsPerEvent,
      avgMatchesPerEvent,
    })
  } catch (error) {
    console.error('Quick stats error:', error)
    return NextResponse.json(
      {
        totalEvents: 0,
        totalTeams: 0,
        totalMatches: 0,
        totalSports: 0,
        recentRPIRuns: 0,
        avgTeamsPerEvent: 0,
        avgMatchesPerEvent: 0,
      },
      { status: 200 }
    )
  }
}

