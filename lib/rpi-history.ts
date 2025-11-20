import { getSupabaseClient } from './supabase-client-singleton'
import type { TeamData, RPICoefficients } from './types'

export type RPICalculationRun = {
  id: number
  event_id: number
  sport_id: number
  calculated_at: string
  data_as_of: string | null
  clwp_coeff: number
  oclwp_coeff: number
  ooclwp_coeff: number
  diff_coeff: number
  domination_coeff: number
  total_teams: number
  total_matches: number
  matches_with_scores: number
  calculation_duration_ms: number | null
  calculation_type: 'manual' | 'auto' | 'scheduled'
  notes: string | null
}

export type RPIResult = {
  run_id: number
  team_id: number
  rank: number
  rpi: number
  wp: number
  owp: number
  oowp: number
  wins: number
  losses: number
  ties: number
  point_diff: number | null
  domination_penalty: number | null
}

/**
 * Save RPI calculation to database for historical tracking
 */
export async function saveRPICalculation(
  supabaseUrl: string,
  supabaseKey: string,
  params: {
    eventId: number
    sportId: number
    coefficients: RPICoefficients
    teams: TeamData[]
    totalMatches: number
    matchesWithScores: number
    calculationDurationMs?: number
    calculationType?: 'manual' | 'auto' | 'scheduled'
    notes?: string
  }
): Promise<{ success: boolean; runId?: number; error?: string }> {
  const startTime = Date.now()
  
  try {
    const supabase = getSupabaseClient(supabaseUrl, supabaseKey)
    
    // 1. Insert calculation run metadata
    const { data: run, error: runError } = await supabase
      .schema('fb_compete')
      .from('rpi_calculation_runs')
      .insert({
        event_id: params.eventId,
        sport_id: params.sportId,
        clwp_coeff: params.coefficients.clwpCoeff,
        oclwp_coeff: params.coefficients.oclwpCoeff,
        ooclwp_coeff: params.coefficients.ooclwpCoeff,
        diff_coeff: params.coefficients.diffCoeff,
        domination_coeff: params.coefficients.dominationCoeff,
        total_teams: params.teams.length,
        total_matches: params.totalMatches,
        matches_with_scores: params.matchesWithScores,
        calculation_duration_ms: params.calculationDurationMs || (Date.now() - startTime),
        calculation_type: params.calculationType || 'manual',
        notes: params.notes,
      })
      .select('id')
      .single()
    
    if (runError || !run) {
      console.error('Error creating calculation run:', runError)
      return { success: false, error: runError?.message || 'Failed to create run' }
    }
    
    const runId = run.id
    
    // 2. Prepare results data (compact format)
    const results: Omit<RPIResult, 'run_id'>[] = params.teams.map((team, index) => ({
      team_id: team.id,
      rank: index + 1,
      rpi: team.rpi,
      wp: team.clwp,
      owp: team.oclwp,
      oowp: team.ooclwp,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties || 0,
      point_diff: team.pointDiff || null,
      domination_penalty: team.dominationPenalty || null,
    }))
    
    // 3. Batch insert results (efficient for large datasets)
    const BATCH_SIZE = 1000
    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE).map(r => ({
        run_id: runId,
        ...r,
      }))
      
      const { error: batchError } = await supabase
        .schema('fb_compete')
        .from('rpi_results')
        .insert(batch)
      
      if (batchError) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, batchError)
        return { success: false, error: batchError.message }
      }
    }
    
    console.log(`✅ Saved RPI calculation: run_id=${runId}, ${results.length} teams`)
    
    return { success: true, runId }
  } catch (error) {
    console.error('Error saving RPI calculation:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get calculation history for an event
 */
export async function getRPICalculationHistory(
  supabaseUrl: string,
  supabaseKey: string,
  eventId: number,
  limit: number = 20
): Promise<RPICalculationRun[]> {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey)
  
  const { data, error } = await supabase
    .schema('fb_compete')
    .from('rpi_calculation_runs')
    .select('*')
    .eq('event_id', eventId)
    .order('calculated_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching calculation history:', error)
    return []
  }
  
  return (data || []) as RPICalculationRun[]
}

/**
 * Get latest RPI results for an event
 */
export async function getLatestRPIResults(
  supabaseUrl: string,
  supabaseKey: string,
  eventId: number
): Promise<{
  run: RPICalculationRun | null
  results: (RPIResult & { team_name: string })[]
}> {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey)
  
  // Get latest run
  const { data: run, error: runError } = await supabase
    .schema('fb_compete')
    .from('rpi_calculation_runs')
    .select('*')
    .eq('event_id', eventId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single()
  
  if (runError || !run) {
    return { run: null, results: [] }
  }
  
  // Get results for this run
  const { data: results, error: resultsError } = await supabase
    .schema('fb_compete')
    .from('rpi_results')
    .select(`
      *,
      team:team_id (
        name
      )
    `)
    .eq('run_id', run.id)
    .order('rank')
  
  if (resultsError) {
    console.error('Error fetching results:', resultsError)
    return { run: run as RPICalculationRun, results: [] }
  }
  
  const formattedResults = (results || []).map((r: any) => ({
    run_id: r.run_id,
    team_id: r.team_id,
    rank: r.rank,
    rpi: r.rpi,
    wp: r.wp,
    owp: r.owp,
    oowp: r.oowp,
    wins: r.wins,
    losses: r.losses,
    ties: r.ties,
    point_diff: r.point_diff,
    domination_penalty: r.domination_penalty,
    team_name: r.team?.name || 'Unknown',
  }))
  
  return {
    run: run as RPICalculationRun,
    results: formattedResults,
  }
}

/**
 * Compare two RPI calculation runs
 */
export async function compareRPIRuns(
  supabaseUrl: string,
  supabaseKey: string,
  runId1: number,
  runId2: number
): Promise<Array<{
  team_id: number
  team_name: string
  run1_rank: number
  run1_rpi: number
  run2_rank: number
  run2_rpi: number
  rank_change: number
  rpi_change: number
}>> {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey)
  
  const { data, error } = await supabase
    .rpc('compare_rpi_runs', {
      p_run_id_1: runId1,
      p_run_id_2: runId2,
    })
  
  if (error) {
    console.error('Error comparing runs:', error)
    return []
  }
  
  return data || []
}

/**
 * Delete old calculations for an event
 */
export async function cleanupOldCalculations(
  supabaseUrl: string,
  supabaseKey: string,
  eventId: number,
  keepCount: number = 10
): Promise<number> {
  const supabase = getSupabaseClient(supabaseUrl, supabaseKey)
  
  const { data, error } = await supabase
    .rpc('cleanup_old_rpi_calculations', {
      p_event_id: eventId,
      p_keep_count: keepCount,
    })
  
  if (error) {
    console.error('Error cleaning up calculations:', error)
    return 0
  }
  
  return data || 0
}

