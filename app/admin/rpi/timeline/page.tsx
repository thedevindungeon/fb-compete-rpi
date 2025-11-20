'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  BarChart3,
  LineChart,
  Activity,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

type RPIRecord = {
  id: number
  team_id: number
  sport_id: number
  value: number
  generated_at: string
  active: boolean
  created_at: string
  updated_at: string
}

type TeamInfo = {
  id: number
  name: string
  city?: string
  state?: string
}

type EventInfo = {
  event_id: number
  event_name: string
  sport_id: number
}

type TimelineEntry = {
  date: string
  records: RPIRecord[]
  stats: {
    avg: number
    max: number
    min: number
    count: number
  }
}

export default function RPITimelinePage() {
  const searchParams = useSearchParams()
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  
  // Data states
  const [rpiData, setRpiData] = useState<RPIRecord[]>([])
  const [teams, setTeams] = useState<TeamInfo[]>([])
  const [events, setEvents] = useState<EventInfo[]>([])
  
  // Filter states
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d')
  const [showInactive, setShowInactive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'timeline' | 'comparison'>('timeline')

  // Load credentials
  useEffect(() => {
    const urlParam = searchParams.get('url')
    const keyParam = searchParams.get('key')

    if (urlParam && keyParam) {
      setSupabaseUrl(urlParam)
      setSupabaseKey(keyParam)
    } else {
      try {
        const stored = localStorage.getItem('supabase-connection-state-v2')
        if (stored) {
          const parsed = JSON.parse(stored)
          setSupabaseUrl(parsed.url)
          setSupabaseKey(parsed.key)
        }
      } catch {}
    }
  }, [searchParams])

  // Fetch all data
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      fetchAllData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseUrl, supabaseKey])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch RPI data
      const rpiResponse = await fetch('/api/admin/rpi?limit=10000&offset=0&orderBy=generated_at&orderDirection=desc', {
        headers: {
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
      })

      if (!rpiResponse.ok) throw new Error('Failed to fetch RPI data')
      const rpiResult = await rpiResponse.json()
      setRpiData(rpiResult.data || [])

      // Fetch teams
      const teamsResponse = await fetch('/api/admin/teams?limit=10000&offset=0&orderBy=id&orderDirection=asc', {
        headers: {
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
      })

      if (teamsResponse.ok) {
        const teamsResult = await teamsResponse.json()
        setTeams(teamsResult.data || [])
      }

      // Fetch events
      const eventsResponse = await fetch('/api/admin/events?limit=10000&offset=0&orderBy=event_id&orderDirection=desc', {
        headers: {
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
      })

      if (eventsResponse.ok) {
        const eventsResult = await eventsResponse.json()
        setEvents(eventsResult.data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Filter and process data
  const filteredData = useMemo(() => {
    let filtered = [...rpiData]

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (dateRange) {
        case '7d':
          cutoff.setDate(now.getDate() - 7)
          break
        case '30d':
          cutoff.setDate(now.getDate() - 30)
          break
        case '90d':
          cutoff.setDate(now.getDate() - 90)
          break
      }
      
      filtered = filtered.filter(item => new Date(item.generated_at) >= cutoff)
    }

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(item => item.sport_id === parseInt(selectedSport))
    }

    // Team filter
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(item => item.team_id === parseInt(selectedTeam))
    }

    // Event filter (by sport_id from events)
    if (selectedEvent !== 'all') {
      const event = events.find(e => e.event_id === parseInt(selectedEvent))
      if (event) {
        filtered = filtered.filter(item => item.sport_id === event.sport_id)
      }
    }

    // Active filter
    if (!showInactive) {
      filtered = filtered.filter(item => item.active)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const team = teams.find(t => t.id === item.team_id)
        return (
          item.team_id.toString().includes(searchQuery) ||
          team?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    return filtered
  }, [rpiData, dateRange, selectedSport, selectedTeam, selectedEvent, showInactive, searchQuery, teams, events])

  // Group by date for timeline
  const timeline = useMemo(() => {
    const grouped = new Map<string, RPIRecord[]>()

    filteredData.forEach(record => {
      const date = new Date(record.generated_at).toLocaleDateString()
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)!.push(record)
    })

    const entries: TimelineEntry[] = []
    grouped.forEach((records, date) => {
      const values = records.map(r => r.value)
      entries.push({
        date,
        records,
        stats: {
          avg: values.reduce((sum, v) => sum + v, 0) / values.length,
          max: Math.max(...values),
          min: Math.min(...values),
          count: records.length,
        },
      })
    })

    // Sort by date descending
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [filteredData])

  // Team comparison data
  const teamComparison = useMemo(() => {
    if (selectedTeam === 'all') return null

    const teamRecords = filteredData
      .filter(r => r.team_id === parseInt(selectedTeam))
      .sort((a, b) => new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime())

    if (teamRecords.length < 2) return null

    const first = teamRecords[0]
    const last = teamRecords[teamRecords.length - 1]
    const change = last.value - first.value
    const percentChange = (change / first.value) * 100

    return {
      team: teams.find(t => t.id === parseInt(selectedTeam)),
      records: teamRecords,
      first,
      last,
      change,
      percentChange,
      trend: change >= 0 ? 'up' : 'down',
    }
  }, [filteredData, selectedTeam, teams])

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Team ID', 'Team Name', 'Sport ID', 'RPI Value', 'Active', 'Generated At']
    const rows = filteredData.map(record => {
      const team = teams.find(t => t.id === record.team_id)
      return [
        new Date(record.generated_at).toLocaleDateString(),
        record.team_id,
        team?.name || 'Unknown',
        record.sport_id,
        record.value.toFixed(6),
        record.active ? 'Yes' : 'No',
        new Date(record.generated_at).toISOString(),
      ]
    })

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rpi-timeline-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (filteredData.length === 0) {
      return { avg: 0, max: 0, min: 0, count: 0, range: 0 }
    }

    const values = filteredData.map(r => r.value)
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    return {
      avg,
      max,
      min,
      count: filteredData.length,
      range: max - min,
    }
  }, [filteredData])

  const environment = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')
    ? 'local'
    : supabaseUrl.includes('staging')
    ? 'staging'
    : 'production'

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">No Database Connection</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please connect to Supabase first
                </p>
                <Link href="/admin/events">
                  <Button size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to DBA Page
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/rpi?url=${encodeURIComponent(supabaseUrl)}&key=${encodeURIComponent(supabaseKey)}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to RPI
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              RPI Historical Timeline
            </h1>
            <p className="text-xs text-muted-foreground">
              Track RPI changes over time with custom filters
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {supabaseUrl.split('//')[1]?.split('.')[0]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {environment.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Custom Reporting
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
                className="h-7 text-xs"
              >
                <Download className="h-3 w-3 mr-1.5" />
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchAllData}
                disabled={loading}
                className="h-7 text-xs"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date Range */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Date Range</Label>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sport Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sport</Label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Sports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {[...new Set(rpiData.map(r => r.sport_id))].map(sportId => (
                    <SelectItem key={sportId} value={sportId.toString()}>
                      Sport {sportId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.slice(0, 100).map(team => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name || `Team ${team.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.slice(0, 50).map(event => (
                    <SelectItem key={event.event_id} value={event.event_id.toString()}>
                      {event.event_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by team ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Show Inactive Toggle */}
            <Button
              size="sm"
              variant={showInactive ? 'default' : 'outline'}
              onClick={() => setShowInactive(!showInactive)}
              className="h-8 text-xs"
            >
              {showInactive ? 'All Records' : 'Active Only'}
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border rounded-lg p-0.5">
              <Button
                size="sm"
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                onClick={() => setViewMode('timeline')}
                className="h-7 text-xs px-2"
              >
                <LineChart className="h-3 w-3 mr-1" />
                Timeline
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'comparison' ? 'default' : 'ghost'}
                onClick={() => setViewMode('comparison')}
                className="h-7 text-xs px-2"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Comparison
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Records</p>
            <p className="text-2xl font-bold">{overallStats.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg RPI</p>
            <p className="text-2xl font-bold">{overallStats.avg.toFixed(4)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Max RPI</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {overallStats.max.toFixed(4)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Min RPI</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overallStats.min.toFixed(4)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Range</p>
            <p className="text-2xl font-bold">{overallStats.range.toFixed(4)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No RPI data found for the selected filters</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'timeline' ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Historical Timeline ({timeline.length} dates)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-4">
                    {timeline.map((entry, idx) => (
                      <div key={entry.date} className="relative">
                        {/* Timeline connector */}
                        {idx !== timeline.length - 1 && (
                          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                        )}

                        <div className="flex gap-4">
                          {/* Date badge */}
                          <div className="shrink-0 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs z-10">
                              {new Date(entry.date).getDate()}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 text-center">
                              {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                          </div>

                          {/* Entry content */}
                          <Card className="flex-1">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-sm mb-1">
                                    {new Date(entry.date).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    {entry.stats.count} RPI calculations
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground mb-0.5">Avg RPI</p>
                                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    {entry.stats.avg.toFixed(4)}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="text-center p-2 bg-muted/50 rounded">
                                  <p className="text-[10px] text-muted-foreground mb-0.5">Max</p>
                                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    {entry.stats.max.toFixed(4)}
                                  </p>
                                </div>
                                <div className="text-center p-2 bg-muted/50 rounded">
                                  <p className="text-[10px] text-muted-foreground mb-0.5">Min</p>
                                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                    {entry.stats.min.toFixed(4)}
                                  </p>
                                </div>
                                <div className="text-center p-2 bg-muted/50 rounded">
                                  <p className="text-[10px] text-muted-foreground mb-0.5">Range</p>
                                  <p className="text-sm font-semibold">
                                    {(entry.stats.max - entry.stats.min).toFixed(4)}
                                  </p>
                                </div>
                              </div>

                              {/* Top teams for this date */}
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                  Top 5 Teams:
                                </p>
                                {entry.records
                                  .sort((a, b) => b.value - a.value)
                                  .slice(0, 5)
                                  .map((record, idx) => {
                                    const team = teams.find(t => t.id === record.team_id)
                                    return (
                                      <div
                                        key={record.id}
                                        className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-muted/50"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="w-4 text-center font-bold text-muted-foreground">
                                            {idx + 1}
                                          </span>
                                          <span className="font-medium">
                                            {team?.name || `Team ${record.team_id}`}
                                          </span>
                                          {!record.active && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                                              Inactive
                                            </Badge>
                                          )}
                                        </div>
                                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                          {record.value.toFixed(4)}
                                        </span>
                                      </div>
                                    )
                                  })}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Team Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTeam === 'all' ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Select a team to view comparison data</p>
                  </div>
                ) : !teamComparison ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Not enough data for comparison (need at least 2 records)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Team header */}
                    <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h3 className="text-lg font-bold mb-1">
                          {teamComparison.team?.name || `Team ${selectedTeam}`}
                        </h3>
                        {teamComparison.team?.city && teamComparison.team?.state && (
                          <p className="text-xs text-muted-foreground">
                            {teamComparison.team.city}, {teamComparison.team.state}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {teamComparison.records.length} RPI calculations tracked
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                          {teamComparison.trend === 'up' ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-500" />
                          )}
                          <span
                            className={`text-2xl font-bold ${
                              teamComparison.trend === 'up'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {teamComparison.change >= 0 ? '+' : ''}
                            {teamComparison.change.toFixed(4)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {teamComparison.percentChange >= 0 ? '+' : ''}
                          {teamComparison.percentChange.toFixed(2)}% change
                        </p>
                      </div>
                    </div>

                    {/* Comparison cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground mb-2">First Record</p>
                          <p className="text-2xl font-bold mb-1">
                            {teamComparison.first.value.toFixed(4)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(teamComparison.first.generated_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground mb-2">Latest Record</p>
                          <p className="text-2xl font-bold mb-1">
                            {teamComparison.last.value.toFixed(4)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(teamComparison.last.generated_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    {/* Historical records */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Historical Records</h4>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {teamComparison.records.map((record, idx) => {
                            const prevRecord = teamComparison.records[idx - 1]
                            const change = prevRecord ? record.value - prevRecord.value : 0

                            return (
                              <div
                                key={record.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div>
                                  <p className="text-sm font-medium">
                                    {new Date(record.generated_at).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(record.generated_at).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold font-mono">
                                    {record.value.toFixed(4)}
                                  </p>
                                  {prevRecord && (
                                    <div className="flex items-center gap-1 justify-end text-xs">
                                      {change >= 0 ? (
                                        <>
                                          <TrendingUp className="h-3 w-3 text-green-500" />
                                          <span className="text-green-600 dark:text-green-400">
                                            +{change.toFixed(4)}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <TrendingDown className="h-3 w-3 text-red-500" />
                                          <span className="text-red-600 dark:text-red-400">
                                            {change.toFixed(4)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

