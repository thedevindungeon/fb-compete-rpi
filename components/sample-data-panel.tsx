'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SAMPLE_TEAMS, getSampleTeamsDescription } from '@/lib/sample-data'
import { generateLargeDataset, getDatasetInfo } from '@/lib/generate-large-dataset'
import type { TeamData } from '@/lib/types'

type SampleDataPanelProps = {
  onLoadSampleData: (teams: TeamData[]) => void
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

  const handleGenerateLargeDataset = () => {
    setIsGenerating(true)
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const teams = generateLargeDataset({
          teamCount: parseInt(teamCount) || 100,
          gamesPerTeam: parseInt(gamesPerTeam) || 50,
        })
        const info = getDatasetInfo(teams)
        console.log('Generated dataset:', info)
        onLoadSampleData(teams)
      } catch (error) {
        console.error('Failed to generate dataset:', error)
      } finally {
        setIsGenerating(false)
      }
    }, 0)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sample Data</CardTitle>
        <CardDescription className="text-xs">
          Load pre-configured test data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
            Generate Large Dataset
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
                  Games
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

