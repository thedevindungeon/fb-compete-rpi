'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RPICoefficientsPanel } from '@/components/rpi-coefficients-panel'
import { TeamResultsTable } from '@/components/team-results-table'
import { TeamResultsChart } from '@/components/team-results-chart'
import { ViewToggle } from '@/components/view-toggle'
import { SampleDataPanel } from '@/components/sample-data-panel'
import { SupabaseConnectionPanel } from '@/components/supabase-connection-panel'
import { DataUploadPanel } from '@/components/data-upload-panel'
import { MetadataSection } from '@/components/metadata-section'
import { ExportButtons } from '@/components/export-buttons'
import { PageHeader } from '@/components/page-header'
import { RPIGeneratorPanel } from '@/components/rpi-generator-panel'
import { useRPICalculation } from '@/hooks/use-rpi-calculation'
import { useRPIData } from '@/hooks/use-rpi-data'
import { DEFAULT_COEFFICIENTS } from '@/lib/types'
import { exportResultsToCSV } from '@/lib/csv-export'
import { getGridLayout } from '@/lib/layout-utils'
import { Calculator, Database } from 'lucide-react'
import { toast } from 'sonner'
import { Pagination } from '@/components/ui/pagination'
import { ERDView } from '@/components/erd-view'
import { FormulasView } from '@/components/formulas-view'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ITEMS_PER_PAGE = 25

export default function Home() {
  const [coefficientsOverride, setCoefficientsOverride] = useState<typeof DEFAULT_COEFFICIENTS | null>(null)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [metadataExpanded, setMetadataExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'calculator' | 'erd' | 'formulas'>('calculator')

  const {
    teams,
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
    handleSupabaseFiltersChange,
    handleUploadDataLoaded,
    handleTeamSelect,
    handleExportDataset,
  } = useRPIData()

  // Use sport-specific coefficients unless overridden by user
  const activeCoefficients = coefficientsOverride || sportConfig.defaultCoefficients

  const { data: results, isLoading } = useRPICalculation(teams, activeCoefficients)

  // Pagination logic
  const totalPages = useMemo(() => {
    if (!results || results.length === 0) return 1
    return Math.ceil(results.length / ITEMS_PER_PAGE)
  }, [results])

  const paginatedResults = useMemo(() => {
    if (!results || results.length === 0) return []
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return results.slice(startIndex, endIndex)
  }, [results, currentPage])

  // Reset to page 1 when results change
  useEffect(() => {
    if (results && results.length > 0 && currentPage > Math.ceil(results.length / ITEMS_PER_PAGE)) {
      setCurrentPage(1)
    }
  }, [results, currentPage])

  const handleTeamSelectWithCoeffs = useCallback((teamId: number | undefined) => {
    const newCoeffs = handleTeamSelect(teamId, results)
    if (newCoeffs) {
      setCoefficientsOverride(newCoeffs)
      if (teamId) {
        const team = results?.find(r => r.teamId === teamId)
        toast.info(team ? `Coefficients adjusted for ${team.teamName}` : 'Coefficients adjusted')
    } else {
        toast.info('Coefficients reset')
    }
  }
  }, [handleTeamSelect, results])

  const handleExportCSV = useCallback(() => {
    if (!results || results.length === 0) {
      toast.error('No results to export')
      return
    }
    exportResultsToCSV(results)
    toast.success('Results exported')
  }, [results])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-3 px-3 max-w-[1920px]">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-3 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('calculator')}
            className={cn(
              "h-8 px-3 text-xs rounded-none border-b-2 border-transparent",
              activeTab === 'calculator'
                ? "border-primary text-foreground font-semibold bg-background"
                : "text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted/60"
            )}
          >
            <Calculator className="h-3.5 w-3.5 mr-1.5" />
            Calculator
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('erd')}
            className={cn(
              "h-8 px-3 text-xs rounded-none border-b-2 border-transparent",
              activeTab === 'erd'
                ? "border-primary text-foreground font-semibold bg-background"
                : "text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted/60"
            )}
          >
            <Database className="h-3.5 w-3.5 mr-1.5" />
            ERD
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('formulas')}
            className={cn(
              "h-8 px-3 text-xs rounded-none border-b-2 border-transparent",
              activeTab === 'formulas'
                ? "border-primary text-foreground font-semibold bg-background"
                : "text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted/60"
            )}
          >
            <Calculator className="h-3.5 w-3.5 mr-1.5" />
            Formulas
          </Button>
        </div>

        {activeTab === 'erd' ? (
          <div className="h-[calc(100vh-120px)]">
            <ERDView />
          </div>
        ) : activeTab === 'formulas' ? (
          <div className="h-[calc(100vh-120px)]">
            <FormulasView />
          </div>
        ) : (
          <>
            <PageHeader
              teamCount={results?.length || 0}
              dataSource={dataSource}
              sportConfig={dataSource === 'supabase' ? sportConfig : undefined}
              leftPanelOpen={leftPanelOpen}
              rightPanelOpen={rightPanelOpen}
              onToggleLeftPanel={() => setLeftPanelOpen(!leftPanelOpen)}
              onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
            />

            <motion.div 
          className={`grid grid-cols-1 gap-3 ${getGridLayout(leftPanelOpen, rightPanelOpen)}`}
          layout
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Left: Data Source Panels - Compact */}
          <AnimatePresence>
            {leftPanelOpen && (
              <motion.div
                key="left-panel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="xl:col-span-1 space-y-2"
              >
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
              onMetadataChange={handleSupabaseMetadataChange}
              externalFilters={supabaseFilters}
              onFiltersChangeRequest={handleSupabaseFiltersChange}
            />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center: Results Table - Takes most space */}
          <motion.div 
            className="xl:col-span-1"
            layout
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {results && results.length > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {results.length} teams
                      {totalPages > 1 && (
                        <span className="ml-1">
                          (showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, results.length)})
                        </span>
                      )}
                    </div>
                    <ViewToggle view={viewMode} onViewChange={setViewMode} />
                  </div>
                  <ExportButtons
                    onExportJSON={handleExportDataset}
                    onExportCSV={handleExportCSV}
                      disabled={teams.length === 0}
                  />
                </div>
                {viewMode === 'table' ? (
                <TeamResultsTable 
                    results={paginatedResults} 
                  selectedTeamId={selectedTeamId}
                    onTeamSelect={handleTeamSelectWithCoeffs}
                    startRank={(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    sportConfig={dataSource === 'supabase' ? sportConfig : undefined}
                  />
                ) : (
                  <TeamResultsChart
                    results={paginatedResults}
                    allResults={results}
                    selectedTeamId={selectedTeamId}
                    onTeamSelect={handleTeamSelectWithCoeffs}
                  />
                        )}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    className="pt-2"
                  />
                )}
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
          </motion.div>

          {/* Right: Coefficients Panel + Metadata Filters */}
          <AnimatePresence>
            {rightPanelOpen && (
              <motion.div
                key="right-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="xl:col-span-1 space-y-2"
              >
            <RPICoefficientsPanel
              coefficients={activeCoefficients}
              onCoefficientsChange={setCoefficientsOverride}
              sportConfig={sportConfig}
            />
                
                {dataSource === 'supabase' && supabaseMetadata && (
                  <MetadataSection
                    metadata={supabaseMetadata}
                    filters={supabaseFilters}
                    expanded={metadataExpanded}
                    onExpandedChange={setMetadataExpanded}
                    onFiltersChange={handleSupabaseFiltersChange}
                  />
                )}

                {dataSource === 'supabase' && supabaseUrl && supabaseKey && supabaseEventId && results && (
                  <RPIGeneratorPanel
                    supabaseUrl={supabaseUrl}
                    supabaseKey={supabaseKey}
                    eventId={supabaseEventId}
                    sportId={supabaseSportId}
                    teams={teams}
                    rpiResults={results}
                    onGenerate={() => {
                      // Optional: Could trigger a refresh or show additional feedback
                      toast.success('RPI generation complete')
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

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
          </>
        )}
      </div>
    </div>
  )
}
