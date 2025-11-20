'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MatchFilterOptions, MatchDataMetadata } from '@/lib/supabase-client'

type MatchFiltersPanelProps = {
  filters: MatchFilterOptions
  onFiltersChange: (filters: MatchFilterOptions) => void
  metadata: MatchDataMetadata | null
  disabled?: boolean
}

export function MatchFiltersPanel({
  filters,
  onFiltersChange,
  metadata,
  disabled = false,
}: MatchFiltersPanelProps) {
  const hasActiveFilters = 
    (filters.status && filters.status !== 'all') ||
    filters.poolId !== undefined ||
    filters.includeUnpublished === true

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : (status as MatchFilterOptions['status']),
    })
  }

  const handlePoolChange = (poolId: string) => {
    onFiltersChange({
      ...filters,
      poolId: poolId === 'all' ? undefined : poolId,
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      status: undefined,
      poolId: undefined,
      includeUnpublished: false,
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={disabled}
              title="Clear filters"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Status Filter */}
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed Only</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="to_be_played">To Be Played</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {metadata?.statusBreakdown && (
            <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
              {metadata.statusBreakdown.completed > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {metadata.statusBreakdown.completed} completed
                </Badge>
              )}
              {metadata.statusBreakdown.in_progress > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {metadata.statusBreakdown.in_progress} in progress
                </Badge>
              )}
              {metadata.statusBreakdown.to_be_played > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {metadata.statusBreakdown.to_be_played} scheduled
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Pool Filter */}
        {metadata?.pools && metadata.pools.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">Pool</Label>
            <Select
              value={filters.poolId || 'all'}
              onValueChange={handlePoolChange}
              disabled={disabled}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pools</SelectItem>
                {metadata.pools.map((pool) => (
                  <SelectItem key={pool.id} value={pool.id}>
                    {pool.name} ({pool.matchCount} matches)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 text-xs text-primary pt-1 border-t">
            <Filter className="h-3 w-3" />
            <span>Filters active</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

