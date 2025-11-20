'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SAMPLE_TEAMS, getSampleTeamsDescription } from '@/lib/sample-data'
import { generateLargeDataset, getDatasetInfo } from '@/lib/generate-large-dataset'
import { SPORT_CONFIGS, type SportConfig } from '@/lib/sport-config'
import type { TeamData } from '@/lib/types'

type SampleDataPanelProps = {
  onLoadSampleData: (teams: TeamData[], sportId?: number) => void
  onReset: () => void
  isActive: boolean
}

export function SampleDataPanel({
  onLoadSampleData,
  onReset,
  isActive,
}: SampleDataPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [teamCount, setTeamCount] = useState('100')
  const [gamesPerTeam, setGamesPerTeam] = useState('50')
  const [selectedSport, setSelectedSport] = useState('5') // Default to Basketball (id: 5)
  const [usePools, setUsePools] = useState(true)
  const [includeTies, setIncludeTies] = useState(true)
  const [roundRobinStyle, setRoundRobinStyle] = useState(true)
  const [completionRate, setCompletionRate] = useState('85')

  const handleGenerateLargeDataset = async () => {
    setIsGenerating(true)
    
    // For large datasets, use async processing to avoid blocking
    const totalGames = (parseInt(teamCount) || 100) * (parseInt(gamesPerTeam) || 50)
    const useAsync = totalGames > 5000 // Use async for 5k+ games
    
    try {
      let teams: TeamData[]
      
      if (useAsync) {
        // Use requestIdleCallback or setTimeout to yield to browser
        teams = await new Promise<TeamData[]>((resolve) => {
          // Yield to browser first
          requestAnimationFrame(() => {
            setTimeout(() => {
              try {
                const result = generateLargeDataset({
                  teamCount: parseInt(teamCount) || 100,
                  gamesPerTeam: parseInt(gamesPerTeam) || 50,
                  usePools,
                  includeTies,
                  roundRobinStyle,
                  completionRate: parseInt(completionRate) / 100 || 0.85,
                })
                resolve(result)
              } catch (error) {
                console.error('Failed to generate dataset:', error)
                throw error
              }
            }, 0)
          })
        })
      } else {
        // Small datasets can run synchronously
        teams = generateLargeDataset({
          teamCount: parseInt(teamCount) || 100,
          gamesPerTeam: parseInt(gamesPerTeam) || 50,
          usePools,
          includeTies,
          roundRobinStyle,
          completionRate: parseInt(completionRate) / 100 || 0.85,
        })
      }
      
      const info = getDatasetInfo(teams)
      console.log('Generated dataset:', info)
      const sportId = parseInt(selectedSport)
      onLoadSampleData(teams, sportId)
    } catch (error) {
      console.error('Failed to generate dataset:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Sample Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex gap-1.5">
          <Button
            onClick={() => onLoadSampleData(SAMPLE_TEAMS)}
            disabled={isActive}
            variant={isActive ? 'secondary' : 'default'}
            size="sm"
            className="flex-1 h-8 text-xs"
          >
            {isActive ? 'Active' : 'Load Sample'}
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            disabled={!isActive}
            className="h-8 text-xs"
          >
            Reset
          </Button>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Generate Dataset
          </summary>
          <div className="mt-2 space-y-2 pt-2 border-t">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-1">
                <Label htmlFor="teamCount" className="text-xs">
                  Teams
                </Label>
                <Input
                  id="teamCount"
                  type="number"
                  min="1"
                  max="1000"
                  value={teamCount}
                  onChange={(e) => setTeamCount(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gamesPerTeam" className="text-xs">
                  Games/Team
                </Label>
                <Input
                  id="gamesPerTeam"
                  type="number"
                  min="1"
                  max="200"
                  value={gamesPerTeam}
                  onChange={(e) => setGamesPerTeam(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* Sport Selection */}
            <div className="space-y-1">
              <Label htmlFor="sport" className="text-xs">
                Sport
              </Label>
              <Select
                value={selectedSport}
                onValueChange={setSelectedSport}
                disabled={isGenerating}
              >
                <SelectTrigger id="sport" className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SPORT_CONFIGS).map((sport) => (
                    <SelectItem 
                      key={sport.id} 
                      value={sport.id.toString()}
                      className="text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{sport.icon}</span>
                        <span>{sport.displayName}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Options */}
            <div className="space-y-2 pt-1 border-t">
              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                Advanced Options
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="usePools" className="text-xs cursor-pointer">
                  Use Pools/Groups
                </Label>
                <Switch
                  id="usePools"
                  checked={usePools}
                  onCheckedChange={setUsePools}
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="roundRobinStyle" className="text-xs cursor-pointer">
                  Round-Robin Style
                </Label>
                <Switch
                  id="roundRobinStyle"
                  checked={roundRobinStyle}
                  onCheckedChange={setRoundRobinStyle}
                  disabled={isGenerating || !usePools}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="includeTies" className="text-xs cursor-pointer">
                  Include Ties
                </Label>
                <Switch
                  id="includeTies"
                  checked={includeTies}
                  onCheckedChange={setIncludeTies}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="completionRate" className="text-xs">
                    Completion Rate
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {completionRate}%
                  </span>
                </div>
                <Input
                  id="completionRate"
                  type="number"
                  min="0"
                  max="100"
                  value={completionRate}
                  onChange={(e) => setCompletionRate(e.target.value)}
                  className="h-7 text-xs"
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">
                  % of games with completed scores
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerateLargeDataset}
              disabled={isGenerating || isActive}
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
            >
              {isGenerating
                ? 'Generating...'
                : `Generate (${(parseInt(teamCount) || 100) * (parseInt(gamesPerTeam) || 50)} games)`}
            </Button>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

