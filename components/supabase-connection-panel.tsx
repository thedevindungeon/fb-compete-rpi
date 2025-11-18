'use client'

import { useState, useRef } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { TeamData } from '@/lib/types'
import {
  testSupabaseConnection,
  exploreDatabase,
  getEventPreview,
  type EventInfo,
  type DatabaseInfo,
} from '@/lib/supabase-explorer'
import { fetchTeamDataFromSupabase } from '@/lib/supabase-client'
import {
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Calendar,
  Users,
  Trophy,
  AlertCircle,
  RefreshCw,
  Upload,
} from 'lucide-react'
import { parseSupabaseConfig, validateSupabaseConfig } from '@/lib/supabase-config-parser'

type SupabaseConnectionPanelProps = {
  onDataLoaded: (teams: TeamData[]) => void
  isLoading?: boolean
  error?: Error | null
}

type ConnectionStep = 'connect' | 'explore' | 'select' | 'preview' | 'loading'

export function SupabaseConnectionPanel({
  onDataLoaded,
  isLoading,
  error,
}: SupabaseConnectionPanelProps) {
  const [step, setStep] = useState<ConnectionStep>('connect')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseKey, setSupabaseKey] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventInfo | null>(null)
  const [eventPreview, setEventPreview] = useState<{
    event: EventInfo | null
    teams: Array<{ id: number; name: string }>
    matchCount: number
    error?: string
  } | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [configUploadError, setConfigUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleConnect = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setConnectionError('Please enter both URL and anon key')
      return
    }

    setIsConnecting(true)
    setConnectionError(null)

    try {
      // Test connection
      const testResult = await testSupabaseConnection(supabaseUrl, supabaseKey)
      
      if (!testResult.success) {
        setConnectionError(testResult.error || 'Failed to connect')
        setIsConnecting(false)
        return
      }

      // Explore database
      const dbInfo = await exploreDatabase(supabaseUrl, supabaseKey)
      
      if (!dbInfo.connected) {
        setConnectionError(dbInfo.error || 'Failed to explore database')
        setIsConnecting(false)
        return
      }

      setDatabaseInfo(dbInfo)
      setStep('explore')
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleEventSelect = async (event: EventInfo) => {
    setSelectedEvent(event)
    setStep('preview')
    setIsLoadingPreview(true)

    try {
      const preview = await getEventPreview(supabaseUrl, supabaseKey, event.id)
      setEventPreview(preview)
    } catch (err) {
      setEventPreview({
        event: null,
        teams: [],
        matchCount: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleLoadEvent = async () => {
    if (!selectedEvent || !supabaseUrl || !supabaseKey) return

    setStep('loading')
    try {
      const teams = await fetchTeamDataFromSupabase(
        supabaseUrl,
        supabaseKey,
        selectedEvent.id
      )
      onDataLoaded(teams)
      setStep('connect') // Reset for next time
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to load data')
      setStep('preview')
    }
  }

  const handleReset = () => {
    setStep('connect')
    setDatabaseInfo(null)
    setSelectedEvent(null)
    setEventPreview(null)
    setConnectionError(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const handleConfigFileUpload = async (file: File) => {
    setConfigUploadError(null)
    
    try {
      const content = await file.text()
      const config = parseSupabaseConfig(content)
      
      if (!config) {
        setConfigUploadError('Could not parse config file. Expected JSON or environment variable format.')
        return
      }

      const validation = validateSupabaseConfig(config)
      if (!validation.valid) {
        setConfigUploadError(validation.error || 'Invalid configuration')
        return
      }

      setSupabaseUrl(config.url)
      setSupabaseKey(config.anonKey)
      setConfigUploadError(null)
    } catch (err) {
      setConfigUploadError(err instanceof Error ? err.message : 'Failed to read config file')
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleConfigFileUpload(file)
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card>
      <Accordion type="single" collapsible>
        <AccordionItem value="supabase" className="border-none">
          <CardHeader className="pb-3">
            <AccordionTrigger className="hover:no-underline py-0">
              <div className="flex flex-col items-start">
                <CardTitle className="text-base">Supabase Connection</CardTitle>
                <CardDescription className="text-xs">
                  Connect and explore your database
                </CardDescription>
              </div>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-3 pt-0">
              {/* Step 1: Connect */}
              {step === 'connect' && (
                <div className="space-y-2.5">
                  {/* Config File Upload */}
                  <div className="space-y-1">
                    <Label className="text-xs">Upload Config File (Optional)</Label>
                    <div
                      className="border-2 border-dashed rounded-lg p-2.5 text-center transition-colors cursor-pointer relative"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground mb-1">
                        Click to upload config file
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Supports JSON, .env, or text formats
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.env,.txt,application/json,text/plain"
                        onChange={handleFileInputChange}
                        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                        aria-label="Upload Supabase config file"
                      />
                    </div>
                    {configUploadError && (
                      <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950 rounded-md">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <strong>Error:</strong> {configUploadError}
                        </div>
                      </div>
                    )}
                    {(supabaseUrl || supabaseKey) && !configUploadError && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950 rounded-md">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Config loaded successfully</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <Label htmlFor="supabaseUrl" className="text-xs">
                      Supabase URL
                    </Label>
                    <Input
                      id="supabaseUrl"
                      type="url"
                      placeholder="https://your-project.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="h-7 text-xs"
                      disabled={isConnecting}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="supabaseKey" className="text-xs">
                      Anon Key
                    </Label>
                    <Input
                      id="supabaseKey"
                      type="password"
                      placeholder="eyJhbGc..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="h-7 text-xs"
                      disabled={isConnecting}
                    />
                  </div>

                  <Button
                    onClick={handleConnect}
                    disabled={!supabaseUrl || !supabaseKey || isConnecting}
                    size="sm"
                    className="w-full h-7 text-xs"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Database className="h-3 w-3 mr-1.5" />
                        Connect & Explore
                      </>
                    )}
                  </Button>

                  {(connectionError || error) && (
                    <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950 rounded-md">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <strong>Error:</strong> {connectionError || error?.message}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Explore Events */}
              {step === 'explore' && databaseInfo && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected successfully</span>
                    </div>
                    <Button
                      onClick={handleReset}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Available Events</Label>
                    {databaseInfo.events.length === 0 ? (
                      <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
                        No events found in the database
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {databaseInfo.events.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventSelect(event)}
                            className="w-full text-left p-2.5 rounded-md border border-muted hover:border-primary hover:bg-muted/50 transition-colors space-y-1"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs truncate">
                                  {event.name || `Event #${event.id}`}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(event.start_date)}
                                  </span>
                                  {event.match_count !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Trophy className="h-3 w-3" />
                                      {event.match_count} matches
                                    </span>
                                  )}
                                  {event.team_count !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {event.team_count} teams
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                            </div>
                            {!event.published && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Draft
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Preview Event */}
              {step === 'preview' && selectedEvent && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setStep('explore')}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                    >
                      ← Back to Events
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  <Separator />

                  {isLoadingPreview ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : eventPreview ? (
                    <div className="space-y-2.5">
                      <div className="p-2.5 bg-muted rounded-md space-y-1.5">
                        <div className="font-medium text-xs">
                          {eventPreview.event?.name || `Event #${selectedEvent.id}`}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>
                            <strong>Matches:</strong> {eventPreview.matchCount}
                          </div>
                          <div>
                            <strong>Teams:</strong> {eventPreview.teams.length}
                          </div>
                        </div>
                      </div>

                      {eventPreview.error && (
                        <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950 rounded-md">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <strong>Error:</strong> {eventPreview.error}
                          </div>
                        </div>
                      )}

                      {eventPreview.teams.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Teams ({eventPreview.teams.length})</Label>
                          <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-muted rounded-md">
                            {eventPreview.teams.slice(0, 10).map((team) => (
                              <div key={team.id} className="text-xs text-muted-foreground">
                                {team.name}
                              </div>
                            ))}
                            {eventPreview.teams.length > 10 && (
                              <div className="text-xs text-muted-foreground italic">
                                +{eventPreview.teams.length - 10} more teams
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleLoadEvent}
                        disabled={isLoading || eventPreview.matchCount === 0}
                        size="sm"
                        className="w-full h-7 text-xs"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Trophy className="h-3 w-3 mr-1.5" />
                            Load Event Data
                          </>
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Step 4: Loading */}
              {step === 'loading' && (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading event data...</p>
                </div>
              )}
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
