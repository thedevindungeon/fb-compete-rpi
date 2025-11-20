'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { saveTeamRPI } from '@/lib/supabase-client'
import type { TeamData, TeamRPIResult } from '@/lib/types'
import {
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
} from 'lucide-react'
import { toast } from 'sonner'

type RPIGeneratorPanelProps = {
  supabaseUrl: string
  supabaseKey: string
  eventId: number | null
  sportId: number | null
  teams: TeamData[]
  rpiResults: TeamRPIResult[]
  onGenerate?: () => void
}

export function RPIGeneratorPanel({
  supabaseUrl,
  supabaseKey,
  eventId,
  sportId,
  teams,
  rpiResults,
  onGenerate,
}: RPIGeneratorPanelProps) {
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(
    new Set(teams.map((t) => t.id))
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter teams by search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return teams
    const query = searchQuery.toLowerCase()
    return teams.filter((team) => team.name.toLowerCase().includes(query))
  }, [teams, searchQuery])

  // Calculate teams active in last week
  const teamsActiveLastWeek = useMemo(() => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return teams.filter((team) =>
      team.games.some((game) => {
        if (!game.matchDate) return false
        const gameDate = new Date(game.matchDate)
        return gameDate >= oneWeekAgo
      })
    )
  }, [teams])

  const handleToggleTeam = useCallback((teamId: number) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        next.add(teamId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedTeamIds(new Set(filteredTeams.map((t) => t.id)))
  }, [filteredTeams])

  const handleSelectLastWeek = useCallback(() => {
    setSelectedTeamIds(new Set(teamsActiveLastWeek.map((t) => t.id)))
    toast.info(`Selected ${teamsActiveLastWeek.length} teams active in last week`)
  }, [teamsActiveLastWeek])

  const handleClearSelection = useCallback(() => {
    setSelectedTeamIds(new Set())
  }, [])

  const handleGenerateRPI = async () => {
    if (selectedTeamIds.size === 0) {
      toast.error('Please select at least one team')
      return
    }

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Supabase connection not configured')
      return
    }

    if (sportId === null) {
      toast.error('Sport ID not available for this event')
      return
    }

    setIsGenerating(true)
    setGenerationStatus('idle')
    setErrorMessage('')

    try {
      const result = await saveTeamRPI(
        supabaseUrl,
        supabaseKey,
        rpiResults,
        Array.from(selectedTeamIds),
        sportId
      )

      if (result.success) {
        setGenerationStatus('success')
        toast.success(
          `Generated RPI for ${result.insertedCount || selectedTeamIds.size} teams`
        )
        onGenerate?.()
      } else {
        setGenerationStatus('error')
        setErrorMessage(result.error || 'Failed to generate RPI')
        toast.error(result.error || 'Failed to generate RPI')
      }
    } catch (err) {
      setGenerationStatus('error')
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!eventId) {
    return null
  }

  return (
    <Card>
      <Accordion type="single" collapsible>
        <AccordionItem value="rpi-generator" className="border-none">
          <CardHeader className="pb-2">
            <AccordionTrigger className="hover:no-underline py-0">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                RPI Generator
              </CardTitle>
            </AccordionTrigger>
            <CardDescription className="text-xs pt-1">
              Generate and save RPI calculations to database
            </CardDescription>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-3 pt-0">
              {/* Selection Info */}
              <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {selectedTeamIds.size}
                  </span>{' '}
                  / {teams.length} teams selected
                </div>
                <Badge variant="secondary" className="text-xs">
                  {teamsActiveLastWeek.length} active last week
                </Badge>
              </div>

              {/* Helper Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                  disabled={isGenerating}
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectLastWeek}
                  className="h-7 text-xs"
                  disabled={isGenerating || teamsActiveLastWeek.length === 0}
                  title="Teams who played in the last 7 days"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-7 text-xs"
                  disabled={isGenerating}
                >
                  <Square className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>

              <Separator />

              {/* Search */}
              <div className="space-y-1">
                <Label htmlFor="team-search" className="text-xs">
                  Search Teams
                </Label>
                <Input
                  id="team-search"
                  type="text"
                  placeholder="Filter teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-xs"
                  disabled={isGenerating}
                />
              </div>

              {/* Team List */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">
                  Teams ({filteredTeams.length})
                </Label>
                <ScrollArea className="h-48 border rounded-md">
                  <div className="p-2 space-y-1">
                    {filteredTeams.map((team) => {
                      const isSelected = selectedTeamIds.has(team.id)
                      const isActiveLastWeek = teamsActiveLastWeek.some(
                        (t) => t.id === team.id
                      )
                      return (
                        <button
                          key={team.id}
                          onClick={() => handleToggleTeam(team.id)}
                          disabled={isGenerating}
                          className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted transition-colors text-left disabled:opacity-50"
                        >
                          <div className="flex-shrink-0">
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {team.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {team.games.length} games
                            </div>
                          </div>
                          {isActiveLastWeek && (
                            <Badge
                              variant="secondary"
                              className="text-xs h-4 px-1.5"
                            >
                              <Calendar className="h-2.5 w-2.5" />
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Generate Button */}
              <Button
                onClick={handleGenerateRPI}
                disabled={isGenerating || selectedTeamIds.size === 0}
                className="w-full h-8 text-xs"
                variant={generationStatus === 'success' ? 'default' : 'default'}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Generating RPI...
                  </>
                ) : generationStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Generated Successfully
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Generate RPI for {selectedTeamIds.size} Team
                    {selectedTeamIds.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>

              {/* Status Messages */}
              {generationStatus === 'error' && errorMessage && (
                <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950 rounded-md">
                  <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <strong>Error:</strong> {errorMessage}
                  </div>
                </div>
              )}

              {generationStatus === 'success' && (
                <div className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    RPI values saved to database. Previous values deactivated.
                  </div>
                </div>
              )}

              <div className="flex items-start gap-1.5 text-xs text-blue-600 dark:text-blue-400 p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <strong>Note:</strong> This will save new RPI values and mark
                  previous entries as inactive for selected teams.
                </div>
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

