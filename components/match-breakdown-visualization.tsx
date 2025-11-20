'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BarChart3, CheckCircle2, Clock, Play, XCircle } from 'lucide-react'
import type { MatchDataMetadata } from '@/lib/supabase-client'

type MatchBreakdownVisualizationProps = {
  metadata: MatchDataMetadata
}

export function MatchBreakdownVisualization({
  metadata,
}: MatchBreakdownVisualizationProps) {
  if (!metadata.statusBreakdown) {
    return null
  }

  const { statusBreakdown, totalMatches } = metadata
  const total = totalMatches || 1

  const statusItems = [
    {
      key: 'completed' as const,
      label: 'Completed',
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-950',
      count: statusBreakdown.completed,
    },
    {
      key: 'in_progress' as const,
      label: 'In Progress',
      icon: Play,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-950',
      count: statusBreakdown.in_progress,
    },
    {
      key: 'to_be_played' as const,
      label: 'Scheduled',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-950',
      count: statusBreakdown.to_be_played,
    },
    {
      key: 'cancelled' as const,
      label: 'Cancelled',
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-950',
      count: statusBreakdown.cancelled,
    },
  ].filter((item) => item.count > 0)

  if (statusItems.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Match Status Breakdown</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Distribution of matches by status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusItems.map((item) => {
          const percentage = (item.count / total) * 100
          const Icon = item.icon

          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {item.count}
                  </Badge>
                  <span className="text-muted-foreground w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          )
        })}

        {metadata.pools && metadata.pools.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Competition Pools
            </div>
            <div className="space-y-1.5">
              {metadata.pools.map((pool) => {
                const poolPercentage = (pool.matchCount / total) * 100
                return (
                  <div key={pool.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate">{pool.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {pool.matchCount} matches
                        </Badge>
                        <span className="text-muted-foreground w-12 text-right">
                          {poolPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={poolPercentage} className="h-1" />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

