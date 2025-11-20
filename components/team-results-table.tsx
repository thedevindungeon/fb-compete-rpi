'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TeamRPIResult } from '@/lib/types'
import type { SportConfig } from '@/lib/sport-config'

type TeamResultsTableProps = {
  results: TeamRPIResult[]
  selectedTeamId?: number
  onTeamSelect?: (teamId: number | undefined) => void
  startRank?: number // Starting rank for pagination (1-based)
  sportConfig?: SportConfig
}

type SortField = keyof TeamRPIResult
type SortDirection = 'asc' | 'desc'

export function TeamResultsTable({ 
  results, 
  selectedTeamId,
  onTeamSelect,
  startRank = 1,
  sportConfig
}: TeamResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('rpi')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    return 0
  })

  const formatNumber = (num: number) => {
    return num.toFixed(4)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Rankings</CardTitle>
          <Badge variant="secondary" className="gap-1 text-xs h-5">
            {sortField} {sortDirection === 'asc' ? '↑' : '↓'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)] w-full">
          <div className="relative">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card border-b shadow-sm">
                  <TableRow>
                    <TableHead className="w-12 bg-card sticky left-0 z-20">Rank</TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors bg-card"
                      onClick={() => handleSort('teamName')}
                    >
                      <div className="flex items-center gap-1.5">
                        Team
                        {sortField === 'teamName' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn(
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right bg-card",
                        sortField === 'games' && "bg-muted/30 font-semibold"
                      )}
                      onClick={() => handleSort('games')}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        G
                        {sortField === 'games' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn(
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right bg-card",
                        sortField === 'wins' && "bg-muted/30 font-semibold"
                      )}
                      onClick={() => handleSort('wins')}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        W
                        {sortField === 'wins' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn(
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right bg-card",
                        sortField === 'losses' && "bg-muted/30 font-semibold"
                      )}
                      onClick={() => handleSort('losses')}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        L
                        {sortField === 'losses' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn(
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right bg-card",
                        sortField === 'wp' && "bg-muted/30 font-semibold"
                      )}
                      onClick={() => handleSort('wp')}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        WP
                        {sortField === 'wp' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn(
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right bg-card",
                        sortField === 'clwp' && "bg-muted/30 font-semibold"
                      )}
                      onClick={() => handleSort('clwp')}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        CLWP
                        {sortField === 'clwp' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn(
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right bg-card",
                        sortField === 'oclwp' && "bg-muted/30 font-semibold"
                      )}
                      onClick={() => handleSort('oclwp')}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        OCLWP
                        {sortField === 'oclwp' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className={cn(
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right bg-card",
                        sortField === 'ooclwp' && "bg-muted/30 font-semibold"
                      )}
                      onClick={() => handleSort('ooclwp')}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        OOCLWP
                        {sortField === 'ooclwp' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                    {sportConfig?.tableColumns.showDiff !== false && (
                      <TableHead 
                        className={cn(
                          "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right bg-card",
                          sortField === 'diff' && "bg-muted/30 font-semibold"
                        )}
                        onClick={() => handleSort('diff')}
                      >
                        <div className="flex items-center gap-1.5 justify-end">
                          DIFF
                          {sortField === 'diff' && (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" />
                            )
                          )}
                        </div>
                      </TableHead>
                    )}
                    <TableHead 
                      className={cn(
                        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-right font-bold bg-card",
                        sortField === 'rpi' && "bg-muted/30"
                      )}
                      onClick={() => handleSort('rpi')}
                    >
                      <div className="flex items-center gap-1.5 justify-end">
                        RPI
                        {sortField === 'rpi' && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((result, index) => {
                    const isSelected = selectedTeamId === result.teamId
                    const rank = startRank + index
                    return (
                    <TableRow
                      key={result.teamId}
                      className={cn(
                        "transition-colors hover:bg-muted/30 cursor-pointer",
                        rank <= 3 && 'bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary',
                        isSelected && 'bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary font-semibold'
                      )}
                      onClick={() => onTeamSelect?.(isSelected ? undefined : result.teamId)}
                    >
                      <TableCell className="font-medium w-12 sticky left-0 z-10 bg-background">
                        {rank <= 3 ? (
                          <Badge variant="default" className="w-8 justify-center">
                            {rank}
                          </Badge>
                        ) : (
                          rank
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{result.teamName}</TableCell>
                      <TableCell className="text-right">{result.games}</TableCell>
                      <TableCell className="text-right">{result.wins}</TableCell>
                      <TableCell className="text-right">{result.losses}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(result.wp)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(result.clwp)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(result.oclwp)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(result.ooclwp)}</TableCell>
                      {sportConfig?.tableColumns.showDiff !== false && (
                        <TableCell className="text-right font-mono text-sm">{formatNumber(result.diff)}</TableCell>
                      )}
                      <TableCell className="text-right font-bold font-mono text-base text-primary bg-primary/5 dark:bg-primary/10">
                        {formatNumber(result.rpi)}
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

