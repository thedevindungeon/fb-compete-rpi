'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  Zap,
} from 'lucide-react'

type QuickStats = {
  totalEvents: number
  totalTeams: number
  totalMatches: number
  totalSports: number
  recentRPIRuns: number
  avgTeamsPerEvent: number
  avgMatchesPerEvent: number
}

type Props = {
  supabaseUrl: string
  supabaseKey: string
}

export default function DBAQuickStats({ supabaseUrl, supabaseKey }: Props) {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [supabaseUrl, supabaseKey])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/quick-stats', {
        headers: {
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch quick stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="h-12 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Events</p>
              <p className="text-xl font-bold">{stats.totalEvents.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded bg-green-100 dark:bg-green-900">
              <Users className="h-4 w-4 text-green-600 dark:text-green-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Teams</p>
              <p className="text-xl font-bold">{stats.totalTeams.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 dark:border-purple-800">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-900">
              <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Matches</p>
              <p className="text-xl font-bold">{stats.totalMatches.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 dark:border-orange-800">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded bg-orange-100 dark:bg-orange-900">
              <Zap className="h-4 w-4 text-orange-600 dark:text-orange-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sports</p>
              <p className="text-xl font-bold">{stats.totalSports}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-teal-200 dark:border-teal-800">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded bg-teal-100 dark:bg-teal-900">
              <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Teams</p>
              <p className="text-xl font-bold">{stats.avgTeamsPerEvent.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-pink-200 dark:border-pink-800">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded bg-pink-100 dark:bg-pink-900">
              <TrendingUp className="h-4 w-4 text-pink-600 dark:text-pink-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">RPI Runs</p>
              <p className="text-xl font-bold">{stats.recentRPIRuns.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

