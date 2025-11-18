'use client'

import { useState } from 'react'
import { RPICoefficientsPanel } from '@/components/rpi-coefficients-panel'
import { TeamResultsTable } from '@/components/team-results-table'
import { SampleDataPanel } from '@/components/sample-data-panel'
import { SupabaseConnectionPanel } from '@/components/supabase-connection-panel'
import { DataUploadPanel } from '@/components/data-upload-panel'
import { useRPICalculation } from '@/hooks/use-rpi-calculation'
import { Button } from '@/components/ui/button'
import { DEFAULT_COEFFICIENTS } from '@/lib/types'
import { SAMPLE_TEAMS } from '@/lib/sample-data'
import { exportTeamDataToJSON } from '@/lib/data-export'
import { calculateSuggestedCoefficients } from '@/lib/coefficient-suggestions'
import { Download, Calculator, TrendingUp, Database, Upload as UploadIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import type { TeamData, RPICoefficients } from '@/lib/types'

export default function Home() {
  const [teams, setTeams] = useState<TeamData[]>(SAMPLE_TEAMS)
  const [coefficients, setCoefficients] = useState<RPICoefficients>(DEFAULT_COEFFICIENTS)
  const [dataSource, setDataSource] = useState<'sample' | 'supabase' | 'upload' | 'none'>('sample')
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>()

  const { data: results, isLoading } = useRPICalculation(teams, coefficients)

  const handleLoadSampleData = (sampleTeams: TeamData[]) => {
    setTeams(sampleTeams)
    setDataSource('sample')
    toast.success(`Loaded ${sampleTeams.length} teams`, {
      description: 'Sample data loaded successfully',
    })
  }

  const handleReset = () => {
    setTeams([])
    setDataSource('none')
    setSelectedTeamId(undefined)
    toast.info('Data reset', {
      description: 'All team data has been cleared',
    })
  }

  const handleTeamSelect = (teamId: number | undefined) => {
    setSelectedTeamId(teamId)
    
    if (teamId && results) {
      const selectedTeam = results.find(r => r.teamId === teamId)
      if (selectedTeam) {
        const suggestedCoeffs = calculateSuggestedCoefficients(selectedTeam)
        setCoefficients(suggestedCoeffs)
        toast.info(`Coefficients adjusted for ${selectedTeam.teamName}`, {
          description: 'Values optimized based on team performance',
        })
      }
    } else {
      setCoefficients(DEFAULT_COEFFICIENTS)
      toast.info('Coefficients reset', {
        description: 'Restored to default values',
      })
    }
  }

  const handleSupabaseDataLoaded = (supabaseTeams: TeamData[]) => {
    if (supabaseTeams.length > 0) {
      // Create a new array reference to ensure React Query detects the change
      setTeams([...supabaseTeams])
      setDataSource('supabase')
      toast.success(`Loaded ${supabaseTeams.length} teams from Supabase`, {
        description: 'RPI calculation will start automatically',
      })
    } else {
      toast.warning('No teams found', {
        description: 'The selected event has no team data',
      })
    }
  }

  const handleUploadDataLoaded = (uploadedTeams: TeamData[]) => {
    if (uploadedTeams.length > 0) {
      // Create a new array reference to ensure React Query detects the change
      setTeams([...uploadedTeams])
      setDataSource('upload')
      toast.success(`Loaded ${uploadedTeams.length} teams from file`, {
        description: 'RPI calculation will start automatically',
      })
    }
  }

  const handleExportDataset = () => {
    if (teams.length === 0) {
      toast.error('No data to export', {
        description: 'Please load team data first',
      })
      return
    }
    exportTeamDataToJSON(teams)
    toast.success('Dataset exported', {
      description: 'JSON file downloaded successfully',
    })
  }

  const exportToCSV = () => {
    if (!results || results.length === 0) {
      toast.error('No results to export', {
        description: 'Please load data and calculate RPI first',
      })
      return
    }

    const headers = [
      'Rank',
      'Team',
      'Games',
      'Wins',
      'Losses',
      'Ties',
      'WP',
      'CLWP',
      'OCLWP',
      'OOCLWP',
      'DIFF',
      'RPI',
    ]

    const rows = results.map((result, index) => [
      index + 1,
      result.teamName,
      result.games,
      result.wins,
      result.losses,
      result.ties,
      result.wp.toFixed(4),
      result.clwp.toFixed(4),
      result.oclwp.toFixed(4),
      result.ooclwp.toFixed(4),
      result.diff.toFixed(4),
      result.rpi.toFixed(4),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rpi-results-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Results exported', {
      description: 'CSV file downloaded successfully',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 px-4 max-w-[1920px]">
        {/* Compact Header */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold leading-tight">RPI Calculator</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rating Percentage Index for sports tournaments
              </p>
            </div>
          </div>
          {teams.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <TrendingUp className="h-3 w-3" />
                {results?.length || 0} teams
              </Badge>
              <Badge variant="outline" className="gap-1.5 text-xs">
                {dataSource === 'sample' && <Calculator className="h-3 w-3" />}
                {dataSource === 'supabase' && <Database className="h-3 w-3" />}
                {dataSource === 'upload' && <UploadIcon className="h-3 w-3" />}
                {dataSource}
              </Badge>
            </div>
          )}
        </div>

        {/* Main Content Grid - Optimized for space */}
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr_400px] gap-4 mb-4">
          {/* Left: Data Source Panels - Compact */}
          <div className="xl:col-span-1 space-y-3">
            <SampleDataPanel
              onLoadSampleData={handleLoadSampleData}
              onReset={handleReset}
              isActive={dataSource === 'sample'}
            />
            <DataUploadPanel
              onDataLoaded={handleUploadDataLoaded}
              currentTeams={teams}
            />
            <SupabaseConnectionPanel
              onDataLoaded={handleSupabaseDataLoaded}
            />
          </div>

          {/* Center: Results Table - Takes most space */}
          <div className="xl:col-span-1">
            {results && results.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {results.length} teams
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      onClick={handleExportDataset}
                      variant="outline"
                      size="sm"
                      disabled={teams.length === 0}
                      className="h-8 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1.5" />
                      JSON
                    </Button>
                    <Button 
                      onClick={exportToCSV} 
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1.5" />
                      CSV
                    </Button>
                  </div>
                </div>
                <TeamResultsTable 
                  results={results} 
                  selectedTeamId={selectedTeamId}
                  onTeamSelect={handleTeamSelect}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/20">
                <div className="text-center p-8">
                  <Calculator className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm font-medium mb-1">No data loaded</p>
                  <p className="text-xs text-muted-foreground">
                    Load sample data or upload a file to get started
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Coefficients Panel - Compact */}
          <div className="xl:col-span-1">
            <RPICoefficientsPanel
              coefficients={coefficients}
              onCoefficientsChange={setCoefficients}
            />
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8 space-y-2">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm">Calculating RPI...</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Processing {teams.length} teams
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
