'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Database,
  TrendingUp,
  Trophy,
  BarChart3,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  Users,
  Target,
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
  deleted_at: string | null
}

export default function RPIResultsPage() {
  const searchParams = useSearchParams()
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [data, setData] = useState<RPIRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [selectedSport, setSelectedSport] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'rankings' | 'stats'>('rankings')

  // Load credentials
  useEffect(() => {
    const urlParam = searchParams.get('url')
    const keyParam = searchParams.get('key')

    if (urlParam && keyParam) {
      setSupabaseUrl(urlParam)
      setSupabaseKey(keyParam)
    } else {
      try {
        const stored = localStorage.getItem('supabase-connection-state')
        if (stored) {
          const parsed = JSON.parse(stored)
          setSupabaseUrl(parsed.url)
          setSupabaseKey(parsed.key)
        }
      } catch {}
    }
  }, [searchParams])

  // Fetch data
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseUrl, supabaseKey, activeOnly, selectedSport])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '1000',
        offset: '0',
        orderBy: 'value',
        orderDirection: 'desc',
      })

      const response = await fetch(`/api/admin/rpi?${params}`, {
        headers: {
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch data')

      const result = await response.json()
      setData(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Filter data
  const filteredData = data.filter(item => {
    if (activeOnly && !item.active) return false
    if (selectedSport !== 'all' && item.sport_id !== parseInt(selectedSport)) return false
    if (searchQuery && !item.team_id.toString().includes(searchQuery)) return false
    return true
  })

  // Calculate rankings
  const rankedData = [...filteredData]
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({ ...item, rank: index + 1 }))

  // Calculate statistics
  const stats = {
    total: filteredData.length,
    avgRPI: filteredData.length > 0
      ? filteredData.reduce((sum, item) => sum + item.value, 0) / filteredData.length
      : 0,
    maxRPI: filteredData.length > 0 ? Math.max(...filteredData.map(item => item.value)) : 0,
    minRPI: filteredData.length > 0 ? Math.min(...filteredData.map(item => item.value)) : 0,
    sports: [...new Set(filteredData.map(item => item.sport_id))].length,
  }

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
          <Link href={`/admin/events?url=${encodeURIComponent(supabaseUrl)}&key=${encodeURIComponent(supabaseKey)}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Team RPI Values
            </h1>
            <p className="text-xs text-muted-foreground">
              View and analyze RPI rankings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/rpi/timeline?url=${encodeURIComponent(supabaseUrl)}&key=${encodeURIComponent(supabaseKey)}`}>
            <Button size="sm" variant="outline">
              <Calendar className="h-3.5 w-3.5 mr-2" />
              Timeline
            </Button>
          </Link>
          <Badge variant="secondary" className="text-xs">
            {supabaseUrl.split('//')[1]?.split('.')[0]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {environment.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Teams</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Avg RPI</p>
                <p className="text-lg font-bold">{stats.avgRPI.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Trophy className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Max RPI</p>
                <p className="text-lg font-bold">{stats.maxRPI.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <BarChart3 className="h-4 w-4 text-orange-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Min RPI</p>
                <p className="text-lg font-bold">{stats.minRPI.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-purple-500 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Sports</p>
                <p className="text-lg font-bold">{stats.sports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Team ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={activeOnly ? 'active' : 'all'} onValueChange={(v) => setActiveOnly(v === 'active')}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="all">All Records</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedSport} onValueChange={setSelectedSport}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="All Sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {[...new Set(data.map(item => item.sport_id))].map(sportId => (
              <SelectItem key={sportId} value={sportId.toString()}>
                Sport {sportId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          className="h-8"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* View Modes */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border-b">
              <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
            <div className="border-b px-3 pt-3">
              <TabsList className="h-9">
                <TabsTrigger value="rankings" className="text-xs">
                  <Trophy className="h-3 w-3 mr-1.5" />
                  Rankings
                </TabsTrigger>
                <TabsTrigger value="table" className="text-xs">
                  <Database className="h-3 w-3 mr-1.5" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1.5" />
                  Statistics
                </TabsTrigger>
              </TabsList>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No RPI data found</p>
              </div>
            ) : (
              <>
                {/* Rankings View */}
                <TabsContent value="rankings" className="m-0">
                  <ScrollArea className="h-[calc(100vh-420px)]">
                    <div className="p-3 space-y-1">
                      {rankedData.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 text-white font-bold shrink-0">
                            #{item.rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">Team {item.team_id}</p>
                              {item.active && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Sport {item.sport_id} • Generated {new Date(item.generated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {item.value.toFixed(4)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">RPI</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Table View */}
                <TabsContent value="table" className="m-0">
                  <ScrollArea className="h-[calc(100vh-420px)]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead className="h-9 text-xs">ID</TableHead>
                          <TableHead className="h-9 text-xs">Team ID</TableHead>
                          <TableHead className="h-9 text-xs">Sport ID</TableHead>
                          <TableHead className="h-9 text-xs">RPI Value</TableHead>
                          <TableHead className="h-9 text-xs">Active</TableHead>
                          <TableHead className="h-9 text-xs">Generated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="py-2 text-xs">{item.id}</TableCell>
                            <TableCell className="py-2 text-xs font-medium">
                              Team {item.team_id}
                            </TableCell>
                            <TableCell className="py-2 text-xs">Sport {item.sport_id}</TableCell>
                            <TableCell className="py-2 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                              {item.value.toFixed(6)}
                            </TableCell>
                            <TableCell className="py-2 text-xs">
                              {item.active ? (
                                <Badge variant="secondary" className="text-[10px]">Active</Badge>
                              ) : (
                                <span className="text-muted-foreground">Inactive</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-xs text-muted-foreground">
                              {new Date(item.generated_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                {/* Statistics View */}
                <TabsContent value="stats" className="m-0 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          RPI Distribution
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Highest RPI</span>
                            <span className="font-mono font-semibold">{stats.maxRPI.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Average RPI</span>
                            <span className="font-mono font-semibold">{stats.avgRPI.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Lowest RPI</span>
                            <span className="font-mono font-semibold">{stats.minRPI.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Range</span>
                            <span className="font-mono font-semibold">
                              {(stats.maxRPI - stats.minRPI).toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Top 5 Teams
                        </h3>
                        <div className="space-y-2">
                          {rankedData.slice(0, 5).map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </div>
                              <span className="text-xs flex-1">Team {item.team_id}</span>
                              <span className="text-xs font-mono font-semibold">{item.value.toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Data Summary
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Records</span>
                            <span className="font-semibold">{data.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Active Records</span>
                            <span className="font-semibold">{data.filter(d => d.active).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Inactive Records</span>
                            <span className="font-semibold">{data.filter(d => !d.active).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sports Covered</span>
                            <span className="font-semibold">{stats.sports}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Latest Update
                        </h3>
                        <div className="space-y-2 text-xs">
                          {data.length > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Generated</span>
                                <span className="font-semibold">
                                  {new Date(Math.max(...data.map(d => new Date(d.generated_at).getTime()))).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Updated</span>
                                <span className="font-semibold">
                                  {new Date(Math.max(...data.map(d => new Date(d.updated_at).getTime()))).toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

