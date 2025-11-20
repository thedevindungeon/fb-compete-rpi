'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Legend
} from 'recharts'
import { TrendingUp, Target, Activity, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon } from 'lucide-react'
import type { TeamRPIResult } from '@/lib/types'

type TeamResultsChartProps = {
  results: TeamRPIResult[]
  allResults?: TeamRPIResult[] // Full dataset for distribution/performance charts
  selectedTeamId?: number
  onTeamSelect?: (teamId: number | undefined) => void
}

type ChartType = 'bar' | 'scatter' | 'radar' | 'distribution' | 'performance'

type Metric = 'rpi' | 'clwp' | 'oclwp' | 'wp' | 'diff'

const METRIC_COLORS: Record<Metric, string> = {
  rpi: '#3b82f6',
  clwp: '#10b981',
  oclwp: '#8b5cf6',
  wp: '#f59e0b',
  diff: '#ef4444',
}

const METRIC_LABELS: Record<Metric, string> = {
  rpi: 'RPI',
  clwp: 'CLWP',
  oclwp: 'OCLWP',
  wp: 'WP',
  diff: 'DIFF',
}

const CHART_TYPES = {
  bar: { label: 'Rankings', icon: TrendingUp },
  scatter: { label: 'Relationships', icon: ScatterChartIcon },
  radar: { label: 'Multi-Metric', icon: Target },
  distribution: { label: 'Distribution', icon: Activity },
  performance: { label: 'Performance', icon: PieChartIcon },
} as const

export function TeamResultsChart({
  results,
  allResults,
  selectedTeamId,
  onTeamSelect,
}: TeamResultsChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [metric, setMetric] = useState<Metric>('rpi')
  const [scatterX, setScatterX] = useState<Metric>('clwp')
  const [scatterY, setScatterY] = useState<Metric>('rpi')

  // Use allResults for distribution/performance charts, paginated results for others
  const dataForCharts = chartType === 'distribution' || chartType === 'performance' 
    ? (allResults || results) 
    : results

  const chartData = useMemo(() => {
    return results
      .slice(0, chartType === 'radar' ? 5 : results.length)
      .map((result, index) => ({
        rank: index + 1,
        team: result.teamName.length > 18 ? result.teamName.substring(0, 18) + '...' : result.teamName,
        teamName: result.teamName,
        teamId: result.teamId,
        rpi: Number(result.rpi.toFixed(4)),
        clwp: Number(result.clwp.toFixed(4)),
        oclwp: Number(result.oclwp.toFixed(4)),
        wp: Number(result.wp.toFixed(4)),
        diff: Number(result.diff.toFixed(4)),
        wins: result.wins,
        losses: result.losses,
        ties: result.ties,
        games: result.games,
        isSelected: selectedTeamId === result.teamId,
      }))
  }, [results, selectedTeamId, chartType])

  // Distribution data - RPI ranges (uses all results)
  const distributionData = useMemo(() => {
    const ranges = [
      { name: '0.0-0.2', min: 0, max: 0.2 },
      { name: '0.2-0.4', min: 0.2, max: 0.4 },
      { name: '0.4-0.6', min: 0.4, max: 0.6 },
      { name: '0.6-0.8', min: 0.6, max: 0.8 },
      { name: '0.8-1.0', min: 0.8, max: 1.0 },
    ]
    return ranges.map(range => ({
      name: range.name,
      count: dataForCharts.filter(r => r.rpi >= range.min && r.rpi < range.max).length,
    }))
  }, [dataForCharts])

  // Performance breakdown for selected team (uses all results for aggregate)
  const performanceData = useMemo(() => {
    if (!selectedTeamId) {
      // Aggregate all teams
      const totalWins = dataForCharts.reduce((sum, r) => sum + r.wins, 0)
      const totalLosses = dataForCharts.reduce((sum, r) => sum + r.losses, 0)
      const totalTies = dataForCharts.reduce((sum, r) => sum + r.ties, 0)
      return [
        { name: 'Wins', value: totalWins, color: '#10b981' },
        { name: 'Losses', value: totalLosses, color: '#ef4444' },
        { name: 'Ties', value: totalTies, color: '#f59e0b' },
      ]
    }
    const team = dataForCharts.find(r => r.teamId === selectedTeamId)
    if (!team) return []
    return [
      { name: 'Wins', value: team.wins, color: '#10b981' },
      { name: 'Losses', value: team.losses, color: '#ef4444' },
      { name: 'Ties', value: team.ties, color: '#f59e0b' },
    ]
  }, [dataForCharts, selectedTeamId])

  // Radar data for top teams
  const radarData = useMemo(() => {
    return chartData.slice(0, 5).map(team => ({
      team: team.teamName,
      teamName: team.teamName,
      teamId: team.teamId,
      RPI: team.rpi,
      CLWP: team.clwp,
      OCLWP: team.oclwp,
      WP: team.wp,
      DIFF: Math.max(0, team.diff + 0.5), // Normalize for radar (0-1 range)
      // Also include lowercase versions for tooltip compatibility
      rpi: team.rpi,
      clwp: team.clwp,
      oclwp: team.oclwp,
      wp: team.wp,
      diff: team.diff,
      wins: team.wins,
      losses: team.losses,
      ties: team.ties,
      rank: team.rank,
    }))
  }, [chartData])

  const handleClick = (data: any) => {
    if (onTeamSelect && data?.activePayload?.[0]?.payload) {
      const clickedTeamId = data.activePayload[0].payload.teamId
      onTeamSelect(clickedTeamId === selectedTeamId ? undefined : clickedTeamId)
    }
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 28)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 110, bottom: 5 }} onClick={handleClick}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" domain={[0, 'dataMax']} tick={{ fontSize: 11 }} label={{ value: METRIC_LABELS[metric], position: 'insideBottom', offset: -5, style: { fontSize: 11 } }} />
              <YAxis dataKey="team" type="category" width={105} tick={{ fontSize: 11 }} />
              <Tooltip content={renderTooltip} />
              <Bar dataKey={metric} fill={METRIC_COLORS[metric]} radius={[0, 4, 4, 0]} onClick={handleClick} style={{ cursor: 'pointer' }}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={METRIC_COLORS[metric]} opacity={entry.isSelected ? 1 : 0.6} stroke={entry.isSelected ? METRIC_COLORS[metric] : 'none'} strokeWidth={entry.isSelected ? 3 : 0} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} onClick={handleClick}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" dataKey={scatterX} name={METRIC_LABELS[scatterX]} tick={{ fontSize: 11 }} domain={[0, 1]} />
              <YAxis type="number" dataKey={scatterY} name={METRIC_LABELS[scatterY]} tick={{ fontSize: 11 }} domain={[0, 1]} />
              <ZAxis type="number" dataKey="games" range={[50, 400]} />
              <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Teams" data={chartData} fill={METRIC_COLORS[scatterY]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isSelected ? METRIC_COLORS[scatterY] : METRIC_COLORS[scatterX]} opacity={entry.isSelected ? 1 : 0.6} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="team" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 10 }} />
              <Radar name="RPI" dataKey="RPI" stroke={METRIC_COLORS.rpi} fill={METRIC_COLORS.rpi} fillOpacity={0.3} />
              <Radar name="CLWP" dataKey="CLWP" stroke={METRIC_COLORS.clwp} fill={METRIC_COLORS.clwp} fillOpacity={0.3} />
              <Radar name="OCLWP" dataKey="OCLWP" stroke={METRIC_COLORS.oclwp} fill={METRIC_COLORS.oclwp} fillOpacity={0.3} />
              <Radar name="WP" dataKey="WP" stroke={METRIC_COLORS.wp} fill={METRIC_COLORS.wp} fillOpacity={0.3} />
              <Tooltip content={renderTooltip} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        )

      case 'distribution':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={distributionData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                return (
                  <div className="bg-background border rounded-lg p-2 shadow-lg text-xs">
                    <p className="font-semibold">{payload[0].payload.name} RPI Range</p>
                    <p>Teams: {payload[0].value}</p>
                    <p>Percentage: {((payload[0].value as number / results.length) * 100).toFixed(1)}%</p>
                  </div>
                )
              }} />
              <Bar dataKey="count" fill={METRIC_COLORS.rpi} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'performance':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null
    const data = payload[0].payload
    
    // Handle both lowercase (chartData) and uppercase (radarData) property names
    const rpi = data.rpi ?? data.RPI
    const clwp = data.clwp ?? data.CLWP
    const oclwp = data.oclwp ?? data.OCLWP
    const wp = data.wp ?? data.WP
    const diff = data.diff ?? data.DIFF
    const teamName = data.teamName ?? data.team
    
    // Check if values exist and are numbers
    if (rpi === undefined || clwp === undefined || oclwp === undefined || wp === undefined || diff === undefined) {
      return null
    }
    
    return (
      <div className="bg-background border rounded-lg p-2 shadow-lg text-xs">
        <p className="font-semibold mb-1">{teamName}</p>
        {data.rank !== undefined && <p>Rank: {data.rank}</p>}
        <p>RPI: {typeof rpi === 'number' ? rpi.toFixed(4) : rpi}</p>
        <p>CLWP: {typeof clwp === 'number' ? clwp.toFixed(4) : clwp}</p>
        <p>OCLWP: {typeof oclwp === 'number' ? oclwp.toFixed(4) : oclwp}</p>
        <p>WP: {typeof wp === 'number' ? wp.toFixed(4) : wp}</p>
        <p>DIFF: {typeof diff === 'number' ? diff.toFixed(4) : diff}</p>
        {data.wins !== undefined && data.losses !== undefined && data.ties !== undefined && (
          <p>Record: {data.wins}-{data.losses}-{data.ties}</p>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Visualizations</CardTitle>
          <div className="flex gap-2">
            {chartType === 'bar' && (
              <Select value={metric} onValueChange={(value) => setMetric(value as Metric)}>
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METRIC_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {chartType === 'scatter' && (
              <>
                <Select value={scatterX} onValueChange={(value) => setScatterX(value as Metric)}>
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METRIC_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={scatterY} onValueChange={(value) => setScatterY(value as Metric)}>
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METRIC_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHART_TYPES).map(([key, { label, icon: Icon }]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-280px)] w-full">
          <div className="p-4">
            {renderChart()}
            {chartType === 'bar' && results.length > 25 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Showing top 25 teams. Switch to table view to see all {results.length} teams.
              </p>
            )}
            {chartType === 'scatter' && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Bubble size represents games played. Click points to select teams.
              </p>
            )}
            {chartType === 'radar' && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Comparing top 5 teams across all metrics. Overlapping areas show similar performance.
              </p>
            )}
            {chartType === 'distribution' && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Distribution of teams across RPI ranges. Helps identify competitive tiers.
              </p>
            )}
            {chartType === 'performance' && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {selectedTeamId ? 'Selected team performance breakdown' : 'Aggregate performance across all teams'}
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

