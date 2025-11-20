import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { exportTeamDataToJSON } from '@/lib/data-export'
import { calculateSuggestedCoefficients } from '@/lib/coefficient-suggestions'
import { DEFAULT_COEFFICIENTS } from '@/lib/types'
import { SAMPLE_TEAMS } from '@/lib/sample-data'
import { getSportConfig } from '@/lib/sport-config'
import type { TeamData, RPICoefficients, TeamRPIResult } from '@/lib/types'
import type { MatchDataMetadata, MatchFilterOptions } from '@/lib/supabase-client'

type DataSource = 'sample' | 'supabase' | 'upload' | 'none'

export function useRPIData() {
  const [teams, setTeams] = useState<TeamData[]>(SAMPLE_TEAMS)
  const [dataSource, setDataSource] = useState<DataSource>('sample')
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>()
  const [supabaseMetadata, setSupabaseMetadata] = useState<MatchDataMetadata | null>(null)
  const [supabaseFilters, setSupabaseFilters] = useState<MatchFilterOptions>({})
  const [supabaseUrl, setSupabaseUrl] = useState<string>('')
  const [supabaseKey, setSupabaseKey] = useState<string>('')
  const [supabaseEventId, setSupabaseEventId] = useState<number | null>(null)
  const [supabaseSportId, setSupabaseSportId] = useState<number | null>(null)

  const handleLoadSampleData = useCallback((sampleTeams: TeamData[], sportId?: number) => {
    setTeams(sampleTeams)
    setDataSource('sample')
    // Clear Supabase-specific state when loading sample data
    setSupabaseMetadata(null)
    setSupabaseUrl('')
    setSupabaseKey('')
    setSupabaseEventId(null)
    // Set sport ID if provided (for generated datasets with sport selection)
    setSupabaseSportId(sportId || null)
    toast.success(`Loaded ${sampleTeams.length} teams`)
  }, [])

  const handleReset = useCallback(() => {
    setTeams([])
    setDataSource('none')
    setSelectedTeamId(undefined)
    // Clear Supabase-specific state on reset
    setSupabaseMetadata(null)
    setSupabaseFilters({})
    setSupabaseUrl('')
    setSupabaseKey('')
    setSupabaseEventId(null)
    setSupabaseSportId(null)
    toast.info('Data reset')
  }, [])

  const handleSupabaseDataLoaded = useCallback((
    supabaseTeams: TeamData[], 
    url?: string, 
    key?: string, 
    eventId?: number,
    sportId?: number | null
  ) => {
    if (supabaseTeams.length > 0) {
      setTeams([...supabaseTeams])
      setDataSource('supabase')
      if (url) setSupabaseUrl(url)
      if (key) setSupabaseKey(key)
      if (eventId) setSupabaseEventId(eventId)
      if (sportId !== undefined) setSupabaseSportId(sportId)
      toast.success(`Loaded ${supabaseTeams.length} teams from Supabase`)
    } else {
      toast.warning('No teams found')
    }
  }, [])

  const handleSupabaseMetadataChange = useCallback((metadata: MatchDataMetadata | null, filters: MatchFilterOptions) => {
    setSupabaseMetadata(metadata)
    setSupabaseFilters(filters)
    if (!metadata) {
      setDataSource('none')
    }
  }, [])

  const handleUploadDataLoaded = useCallback((uploadedTeams: TeamData[]) => {
    if (uploadedTeams.length > 0) {
      setTeams([...uploadedTeams])
      setDataSource('upload')
      // Clear Supabase-specific state when uploading data
      setSupabaseMetadata(null)
      setSupabaseUrl('')
      setSupabaseKey('')
      setSupabaseEventId(null)
      setSupabaseSportId(null)
      toast.success(`Loaded ${uploadedTeams.length} teams from file`)
    }
  }, [])

  const handleTeamSelect = useCallback((teamId: number | undefined, results?: TeamRPIResult[]) => {
    setSelectedTeamId(teamId)
    
    if (teamId && results) {
      const selectedTeam = results.find(r => r.teamId === teamId)
      if (selectedTeam) {
        const suggestedCoeffs = calculateSuggestedCoefficients(selectedTeam)
        return suggestedCoeffs
      }
    }
    return DEFAULT_COEFFICIENTS
  }, [])

  const handleExportDataset = useCallback(() => {
    if (teams.length === 0) {
      toast.error('No data to export')
      return
    }
    exportTeamDataToJSON(teams)
    toast.success('Dataset exported')
  }, [teams])

  // Get sport configuration based on current sport_id
  const sportConfig = useMemo(() => getSportConfig(supabaseSportId), [supabaseSportId])

  return {
    teams,
    setTeams,
    dataSource,
    selectedTeamId,
    supabaseMetadata,
    supabaseFilters,
    supabaseUrl,
    supabaseKey,
    supabaseEventId,
    supabaseSportId,
    sportConfig,
    handleLoadSampleData,
    handleReset,
    handleSupabaseDataLoaded,
    handleSupabaseMetadataChange,
    handleSupabaseFiltersChange: setSupabaseFilters,
    handleUploadDataLoaded,
    handleTeamSelect,
    handleExportDataset,
  }
}

