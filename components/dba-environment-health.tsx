'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Database,
  Activity,
  Server,
  Clock,
  HardDrive,
  Users,
  Table as TableIcon,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Gauge,
  Zap,
  Network,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type HealthData = {
  connection: {
    status: 'connected' | 'disconnected' | 'error'
    url: string
    environment: 'local' | 'staging' | 'production'
    latency?: number
    timestamp: string
  }
  database: {
    version: string
    size: string
    uptime: string
    maxConnections: number
    activeConnections: number
  }
  tables: {
    name: string
    schema: string
    rowCount: number
    size: string
    lastModified?: string
  }[]
  performance: {
    queryTime: number
    indexEfficiency: number
    cacheHitRate: number
  }
  insights: {
    type: 'info' | 'warning' | 'error'
    message: string
  }[]
}

type Props = {
  supabaseUrl: string
  supabaseKey: string
  onRefresh?: () => void
}

export default function DBAEnvironmentHealth({
  supabaseUrl,
  supabaseKey,
  onRefresh,
}: Props) {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchHealth()
  }, [supabaseUrl, supabaseKey])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 10000) // 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/health', {
        headers: {
          'x-supabase-url': supabaseUrl,
          'x-supabase-key': supabaseKey,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch health data')

      const data = await response.json()
      setHealth(data)
      onRefresh?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data')
    } finally {
      setLoading(false)
    }
  }

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'local':
        return 'bg-blue-500'
      case 'staging':
        return 'bg-yellow-500'
      case 'production':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getLatencyColor = (latency?: number) => {
    if (!latency) return 'text-muted-foreground'
    if (latency < 50) return 'text-green-500'
    if (latency < 150) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatBytes = (bytes: string) => {
    return bytes // Already formatted from API
  }

  const getHealthScore = () => {
    if (!health) return 0
    let score = 100

    // Connection health
    if (health.connection.status !== 'connected') score -= 30
    if (health.connection.latency && health.connection.latency > 200) score -= 10

    // Database health
    const connUsage = (health.database.activeConnections / health.database.maxConnections) * 100
    if (connUsage > 80) score -= 15
    if (connUsage > 90) score -= 20

    // Performance
    if (health.performance.cacheHitRate < 0.8) score -= 10
    if (health.performance.queryTime > 100) score -= 10

    // Insights
    const errors = health.insights.filter(i => i.type === 'error').length
    const warnings = health.insights.filter(i => i.type === 'warning').length
    score -= errors * 10
    score -= warnings * 5

    return Math.max(0, Math.min(100, score))
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Health Check Failed</h3>
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchHealth} className="mt-2 h-7">
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <h3 className="font-semibold text-sm">Environment Health</h3>
                {health && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${getHealthScoreColor(getHealthScore())}`}
                  >
                    <Gauge className="h-3 w-3 mr-1" />
                    {getHealthScore()}/100
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    setAutoRefresh(!autoRefresh)
                  }}
                  className={`h-6 px-2 ${autoRefresh ? 'text-blue-500' : ''}`}
                  title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                >
                  <Zap className={`h-3 w-3 ${autoRefresh ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    fetchHealth()
                  }}
                  disabled={loading}
                  className="h-6 px-2"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Quick Stats (Always Visible) */}
          {health && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-2">
              <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
                {getStatusIcon(health.connection.status)}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</p>
                  <p className="text-xs font-medium truncate capitalize">{health.connection.status}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
                <Server className={`h-4 w-4 ${getEnvironmentColor(health.connection.environment)} text-white rounded-sm p-0.5`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Env</p>
                  <p className="text-xs font-medium truncate capitalize">{health.connection.environment}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
                <Network className={`h-4 w-4 ${getLatencyColor(health.connection.latency)}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Latency</p>
                  <p className={`text-xs font-medium truncate ${getLatencyColor(health.connection.latency)}`}>
                    {health.connection.latency ? `${health.connection.latency}ms` : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
                <Users className="h-4 w-4 text-purple-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Connections</p>
                  <p className="text-xs font-medium truncate">
                    {health.database.activeConnections}/{health.database.maxConnections}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
                <HardDrive className="h-4 w-4 text-orange-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">DB Size</p>
                  <p className="text-xs font-medium truncate">{health.database.size}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
                <Clock className="h-4 w-4 text-teal-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Uptime</p>
                  <p className="text-xs font-medium truncate">{health.database.uptime}</p>
                </div>
              </div>
            </div>
          )}

          {/* Expanded Details */}
          <CollapsibleContent>
            {health && (
              <div className="space-y-3 mt-3 pt-3 border-t">
                {/* Performance Metrics */}
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-muted/30 border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Avg Query Time</p>
                      <p className={`text-sm font-semibold ${health.performance.queryTime > 100 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {health.performance.queryTime.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted/30 border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Cache Hit Rate</p>
                      <p className={`text-sm font-semibold ${health.performance.cacheHitRate < 0.8 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {(health.performance.cacheHitRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted/30 border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Index Efficiency</p>
                      <p className={`text-sm font-semibold ${health.performance.indexEfficiency < 0.7 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {(health.performance.indexEfficiency * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tables Overview */}
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <TableIcon className="h-3.5 w-3.5" />
                    Tables Overview
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {health.tables.length} tables
                    </Badge>
                  </h4>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {health.tables.map((table, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 rounded bg-muted/30 border text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Database className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {table.schema}.{table.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Badge variant="secondary" className="text-[10px]">
                            {table.rowCount.toLocaleString()} rows
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{table.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights & Warnings */}
                {health.insights.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Insights & Recommendations
                    </h4>
                    <div className="space-y-1">
                      {health.insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 p-2 rounded border text-xs ${
                            insight.type === 'error'
                              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                              : insight.type === 'warning'
                              ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {insight.type === 'error' ? (
                            <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : insight.type === 'warning' ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                          )}
                          <p className="flex-1">{insight.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connection Details */}
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    Connection Details
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between p-1.5 rounded bg-muted/30">
                      <span className="text-muted-foreground">URL</span>
                      <span className="font-mono">{health.connection.url.split('//')[1]?.split('.')[0]}</span>
                    </div>
                    <div className="flex justify-between p-1.5 rounded bg-muted/30">
                      <span className="text-muted-foreground">PostgreSQL Version</span>
                      <span className="font-mono">{health.database.version}</span>
                    </div>
                    <div className="flex justify-between p-1.5 rounded bg-muted/30">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="font-mono">{new Date(health.connection.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}

