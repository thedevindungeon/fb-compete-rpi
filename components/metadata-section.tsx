'use client'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { MatchFiltersPanel } from '@/components/match-filters-panel'
import { MatchBreakdownVisualization } from '@/components/match-breakdown-visualization'
import { Settings2, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react'
import type { MatchDataMetadata, MatchFilterOptions } from '@/lib/supabase-client'

type MetadataSectionProps = {
  metadata: MatchDataMetadata
  filters: MatchFilterOptions
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onFiltersChange: (filters: MatchFilterOptions) => void
}

export function MetadataSection({
  metadata,
  filters,
  expanded,
  onExpandedChange,
  onFiltersChange,
}: MetadataSectionProps) {
  return (
    <Collapsible open={expanded} onOpenChange={onExpandedChange}>
      <div>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between h-7 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Metadata & Filters
            </span>
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <MatchFiltersPanel
            filters={filters}
            onFiltersChange={onFiltersChange}
            metadata={metadata}
            disabled={false}
          />
          {metadata.statusBreakdown && (
            <MatchBreakdownVisualization metadata={metadata} />
          )}
          <div className="grid grid-cols-2 gap-2 text-xs p-2 bg-muted rounded-md">
            <div><strong>M:</strong> {metadata.totalMatches}</div>
            <div><strong>G:</strong> {metadata.totalGames}</div>
            <div><strong>Scored:</strong> {metadata.matchesWithScores}</div>
            <div><strong>T:</strong> {metadata.teamsWithCompetitiveLevel + metadata.teamsWithoutCompetitiveLevel}</div>
            {metadata.teamsWithoutCompetitiveLevel > 0 && (
              <div className="col-span-2 text-amber-600 dark:text-amber-400 text-xs">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                {metadata.teamsWithoutCompetitiveLevel} missing levels
              </div>
            )}
          </div>
          {metadata.warnings.length > 0 && (
            <div className="space-y-1 p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
              {metadata.warnings.map((warning, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

