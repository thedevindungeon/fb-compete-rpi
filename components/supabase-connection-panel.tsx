'use client'

import { useState, useRef, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { TeamData } from '@/lib/types'
import {
  testSupabaseConnection,
  exploreDatabase,
  getEventPreview,
  type EventInfo,
  type DatabaseInfo,
} from '@/lib/supabase-explorer'
import { 
  fetchTeamDataFromSupabase,
  fetchTeamDataFromSupabaseWithMetadata,
  type MatchDataMetadata,
  type MatchFilterOptions
} from '@/lib/supabase-client'
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
  Maximize2,
  Plug,
  Search,
  Filter,
  X,
} from 'lucide-react'
import { parseSupabaseConfig, validateSupabaseConfig } from '@/lib/supabase-config-parser'
import { getSportConfig } from '@/lib/sport-config'
import { useSupabaseConnection } from '@/contexts/supabase-connection-context'

type SupabaseConnectionPanelProps = {
  onDataLoaded: (teams: TeamData[], url?: string, key?: string, eventId?: number, sportId?: number | null) => void
  onMetadataChange?: (metadata: MatchDataMetadata | null, filters: MatchFilterOptions) => void
  externalFilters?: MatchFilterOptions
  onFiltersChangeRequest?: (filters: MatchFilterOptions) => void
  isLoading?: boolean
  error?: Error | null
}

type ConnectionStep = 'connect' | 'explore' | 'select' | 'preview' | 'loading'

const STORAGE_KEY = 'supabase-connection-state'

type StoredConnectionState = {
  url: string
  key: string
  timestamp: number
}

export function SupabaseConnectionPanel({
  onDataLoaded,
  onMetadataChange,
  externalFilters,
  onFiltersChangeRequest,
  isLoading,
  error,
}: SupabaseConnectionPanelProps) {
  const connectionContext = useSupabaseConnection()
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
  const [dataMetadata, setDataMetadata] = useState<MatchDataMetadata | null>(null)
  const [matchFilters, setMatchFilters] = useState<MatchFilterOptions>(externalFilters || {})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasRestoredConnection, setHasRestoredConnection] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSportFilter, setSelectedSportFilter] = useState<number | 'all'>('all')

  // Load saved connection from localStorage on mount
  useEffect(() => {
    const restoreConnection = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) return

        const state: StoredConnectionState = JSON.parse(stored)
        
        // Check if connection is less than 7 days old
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - state.timestamp > sevenDays) {
          localStorage.removeItem(STORAGE_KEY)
          return
        }

        setSupabaseUrl(state.url)
        setSupabaseKey(state.key)
        setIsConnecting(true)

        // Auto-connect with saved credentials
        const testResult = await testSupabaseConnection(state.url, state.key)
        if (!testResult.success) {
          // Connection failed, clear saved state
          localStorage.removeItem(STORAGE_KEY)
          setIsConnecting(false)
          return
        }

        // Explore database
        const dbInfo = await exploreDatabase(state.url, state.key)
        if (!dbInfo.connected) {
          localStorage.removeItem(STORAGE_KEY)
          setIsConnecting(false)
          return
        }

        setDatabaseInfo(dbInfo)
        setStep('explore')
        setHasRestoredConnection(true)
      } catch (err) {
        // If restoration fails, just clear the stored state
        localStorage.removeItem(STORAGE_KEY)
      } finally {
        setIsConnecting(false)
      }
    }

    restoreConnection()
  }, [])

  // Save connection to localStorage and context when successfully connected
  const saveConnection = (url: string, key: string, eventId?: number, eventName?: string) => {
    const state: StoredConnectionState = {
      url,
      key,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    
    // Also update context for app-wide availability
    connectionContext.setConnection(url, key, eventId ?? null, eventName ?? null)
  }

  // Clear saved connection
  const clearSavedConnection = () => {
    localStorage.removeItem(STORAGE_KEY)
    connectionContext.clearConnection()
  }

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
      
      // Save successful connection
      saveConnection(supabaseUrl, supabaseKey)
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
    
    // Update context with event selection
    connectionContext.updateEvent(event.id, event.name)

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

  const handleLoadEventWithFilters = async (filters?: MatchFilterOptions) => {
    if (!selectedEvent || !supabaseUrl || !supabaseKey) return

    const filtersToUse = filters || matchFilters
    setStep('loading')
    try {
      const result = await fetchTeamDataFromSupabaseWithMetadata(
        supabaseUrl,
        supabaseKey,
        selectedEvent.id,
        filtersToUse
      )
      setDataMetadata(result.metadata)
      setMatchFilters(filtersToUse)
      onDataLoaded(result.teams, supabaseUrl, supabaseKey, selectedEvent.id, selectedEvent.sport_id)
      onMetadataChange?.(result.metadata, filtersToUse)
      // Stay on preview step to show metadata, user can reset when done
      setStep('preview')
    } catch (err) {
      setConnectionError(err instanceof Error ? err.message : 'Failed to load data')
      setStep('preview')
    }
  }

  const handleLoadEvent = async () => {
    await handleLoadEventWithFilters()
  }

  // Handle external filter changes - trigger reload
  useEffect(() => {
    if (externalFilters && selectedEvent && supabaseUrl && supabaseKey) {
      const filtersChanged = JSON.stringify(externalFilters) !== JSON.stringify(matchFilters)
      if (filtersChanged) {
        setMatchFilters(externalFilters)
        handleLoadEventWithFilters(externalFilters)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalFilters, selectedEvent, supabaseUrl, supabaseKey])

  const handleDisconnect = () => {
    setStep('connect')
    setSupabaseUrl('')
    setSupabaseKey('')
    setDatabaseInfo(null)
    setSelectedEvent(null)
    setEventPreview(null)
    setConnectionError(null)
    setDataMetadata(null)
    setMatchFilters({})
    setSearchQuery('')
    setSelectedSportFilter('all')
    clearSavedConnection()
    onMetadataChange?.(null, {})
  }

  const handleReset = () => {
    setStep('connect')
    setDatabaseInfo(null)
    setSelectedEvent(null)
    setEventPreview(null)
    setConnectionError(null)
    setDataMetadata(null)
    setMatchFilters({})
    setSearchQuery('')
    setSelectedSportFilter('all')
    onMetadataChange?.(null, {})
  }

  // Filter events based on search and sport
  const filteredEvents = databaseInfo?.events.filter((event) => {
    const matchesSearch = !searchQuery || 
      event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.id.toString().includes(searchQuery)
    
    const matchesSport = selectedSportFilter === 'all' || 
      event.sport_id === selectedSportFilter
    
    return matchesSearch && matchesSport
  }) || []

  // Get unique sports from events
  const availableSports = Array.from(
    new Set(databaseInfo?.events.map(e => e.sport_id).filter(Boolean))
  ).sort((a, b) => (a || 0) - (b || 0))

  const detectEnvironment = (url: string): 'local' | 'production' => {
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0')) {
      return 'local'
    }
    return 'production'
  }

  const getEnvironmentBadge = (url: string) => {
    const env = detectEnvironment(url)
    if (env === 'local') {
      return (
        <Badge variant="secondary" className="text-xs">
          🏠 Local
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">
        🌐 Production
      </Badge>
    )
  }

  const getProjectName = (url: string) => {
    try {
      const hostname = url.split('//')[1]?.split('.')[0]
      return hostname || 'Unknown'
    } catch {
      return 'Unknown'
    }
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

  // Reusable content component
  const ConnectionContent = () => (
    <div className="space-y-4">
              {/* Step 1: Connect */}
              {step === 'connect' && (
        <div className="space-y-4 max-w-2xl mx-auto">
                  {/* Config File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Setup (Optional)</Label>
                    <div
              className="border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer hover:border-primary hover:bg-accent/50"
                      onClick={() => fileInputRef.current?.click()}
                    >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                Upload Config File
              </p>
              <p className="text-xs text-muted-foreground">
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
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <strong>Error:</strong> {configUploadError}
                        </div>
                      </div>
                    )}
                    {(supabaseUrl || supabaseKey) && !configUploadError && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>Config loaded successfully</span>
                      </div>
                    )}
                  </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl" className="text-sm font-medium">
                Supabase URL
              </Label>
              <Input
                id="supabaseUrl"
                type="url"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="h-9"
                disabled={isConnecting}
              />
              {supabaseUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Environment: {getEnvironmentBadge(supabaseUrl)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabaseKey" className="text-sm font-medium">
                Anon Key
              </Label>
              <Input
                id="supabaseKey"
                type="password"
                placeholder="sb_publishable_..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="h-9"
                disabled={isConnecting}
              />
            </div>
          </div>

                  <Button
                    onClick={handleConnect}
                    disabled={!supabaseUrl || !supabaseKey || isConnecting}
            size="lg"
            className="w-full"
                  >
                    {isConnecting ? (
                      <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                <Database className="h-4 w-4 mr-2" />
                Connect & Explore Database
                      </>
                    )}
                  </Button>

                  {(connectionError || error) && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950 rounded-md">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                <strong>Connection Error:</strong> {connectionError || error?.message}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Explore Events */}
              {step === 'explore' && databaseInfo && (
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-green-900 dark:text-green-100 flex items-center gap-2 flex-wrap mb-1">
                    <span>Connected to Supabase</span>
                    {getEnvironmentBadge(supabaseUrl)}
                    {hasRestoredConnection && (
                      <Badge variant="secondary" className="text-xs">
                        Restored
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-green-700/80 dark:text-green-300/80">
                    <span className="font-mono">{getProjectName(supabaseUrl)}</span>
                    <span>•</span>
                    <span>{databaseInfo.events.length} events available</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const url = `/admin/events?url=${encodeURIComponent(supabaseUrl)}&key=${encodeURIComponent(supabaseKey)}`
                    window.open(url, '_blank')
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 flex-shrink-0 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  <Database className="h-3.5 w-3.5 mr-2" />
                  Admin
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="h-8 flex-shrink-0 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Change
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="h-8 flex-shrink-0 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <XCircle className="h-3.5 w-3.5 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Select an Event</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose an event to load match data and calculate RPI rankings
                </p>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 h-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <Select
                  value={selectedSportFilter.toString()}
                  onValueChange={(value) => setSelectedSportFilter(value === 'all' ? 'all' : parseInt(value))}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5" />
                      <SelectValue placeholder="All Sports" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {availableSports.map((sportId) => {
                      const config = getSportConfig(sportId!)
                      return (
                        <SelectItem key={sportId} value={sportId!.toString()}>
                          <span className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span>{config.name}</span>
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Results count */}
              {(searchQuery || selectedSportFilter !== 'all') && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Showing {filteredEvents.length} of {databaseInfo.events.length} events
                  </span>
                  {(searchQuery || selectedSportFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedSportFilter('all')
                      }}
                      className="h-6 text-xs"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {filteredEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground p-6 bg-muted rounded-lg text-center">
                {databaseInfo.events.length === 0 ? (
                  <>
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No events found</p>
                    <p className="text-xs mt-1">Your database doesn't contain any events yet</p>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No events match your filters</p>
                    <p className="text-xs mt-1">Try adjusting your search or filter criteria</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 max-h-[55vh] overflow-y-auto pr-2">
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventSelect(event)}
                    className="w-full text-left p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-accent/50 transition-all group hover:shadow-md"
                  >
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate mb-1" title={`Event ID: ${event.id}`}>
                            {event.name || `Event #${event.id}`}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {event.sport_id ? (
                              <Badge variant="outline" className="text-xs font-medium px-1.5 py-0 h-5" title={`Sport ID: ${event.sport_id}`}>
                                {getSportConfig(event.sport_id).icon} {getSportConfig(event.sport_id).name}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5" title="No sport_id in database">
                                🏆 Unknown
                              </Badge>
                            )}
                            {!event.published && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                                Draft
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t text-xs">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className="truncate">{event.start_date ? formatDate(event.start_date) : 'N/A'}</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            <span>{event.match_count !== undefined ? event.match_count : 'N/A'}</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{event.team_count !== undefined ? event.team_count : 'N/A'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
                  </div>
                </div>
              )}

              {/* Step 3: Preview Event */}
              {step === 'preview' && selectedEvent && (
        <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setStep('explore')}
              variant="outline"
                      size="sm"
              className="h-8"
                    >
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Events
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReset}
                        variant="ghost"
                        size="sm"
                        className="h-8"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Change Event
                      </Button>
                      <Button
                        onClick={handleDisconnect}
                        variant="outline"
                        size="sm"
                        className="h-8 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                    </div>
                  </div>

                  {isLoadingPreview ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : eventPreview ? (
            <div className="space-y-4">
              {/* Event Summary Card */}
              <div className="p-4 bg-gradient-to-br from-muted to-muted/50 rounded-lg border-2 border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base">
                        {eventPreview.event?.name || `Event #${selectedEvent.id}`}
                      </h3>
                      {selectedEvent.sport_id && (
                        <Badge variant="outline">
                          {getSportConfig(selectedEvent.sport_id).icon} {getSportConfig(selectedEvent.sport_id).name}
                        </Badge>
                      )}
                    </div>
                    {selectedEvent.start_date && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedEvent.start_date)}
                      </div>
                    )}
                  </div>
                        </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-background rounded-md">
                    <Trophy className="h-8 w-8 text-amber-500" />
                          <div>
                      <div className="text-2xl font-bold">{eventPreview.matchCount}</div>
                      <div className="text-xs text-muted-foreground">Matches</div>
                    </div>
                          </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-md">
                    <Users className="h-8 w-8 text-blue-500" />
                          <div>
                      <div className="text-2xl font-bold">{eventPreview.teams.length}</div>
                      <div className="text-xs text-muted-foreground">Teams</div>
                    </div>
                          </div>
                        </div>
                      </div>

                      {eventPreview.error && (
                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <strong>Error:</strong> {eventPreview.error}
                          </div>
                        </div>
                      )}

              {/* Teams List */}
                      {eventPreview.teams.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Participating Teams ({eventPreview.teams.length})</Label>
                  <div className="max-h-48 overflow-y-auto p-3 bg-muted/50 rounded-lg border">
                    <div className="grid grid-cols-2 gap-2">
                      {eventPreview.teams.slice(0, 20).map((team) => (
                        <div key={team.id} className="text-sm px-2 py-1 bg-background rounded">
                                {team.name}
                              </div>
                            ))}
                    </div>
                    {eventPreview.teams.length > 20 && (
                      <div className="text-sm text-muted-foreground text-center mt-3 pt-3 border-t">
                        +{eventPreview.teams.length - 20} more teams
                              </div>
                            )}
                          </div>
                        </div>
                      )}

              {/* Load Data Button */}
              <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleLoadEvent}
                          disabled={isLoading || eventPreview.matchCount === 0}
                  size="lg"
                  className="flex-1"
                        >
                          {isLoading ? (
                            <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading Data...
                            </>
                          ) : (
                            <>
                      <Database className="h-4 w-4 mr-2" />
                      {dataMetadata ? 'Reload Event Data' : 'Load Event Data'}
                            </>
                          )}
                        </Button>
                        {dataMetadata && (
                          <Button
                            onClick={handleLoadEvent}
                            disabled={isLoading}
                            variant="outline"
                    size="lg"
                            title="Refresh data"
                          >
                    <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

              {/* Data Quality Warnings */}
                      {dataMetadata && dataMetadata.warnings.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Data Quality Warnings ({dataMetadata.warnings.length})
                          </Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                            {dataMetadata.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

              {/* Success Message */}
              {dataMetadata && dataMetadata.warnings.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Data loaded successfully with no warnings!</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Step 4: Loading */}
              {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <p className="text-base font-medium">Loading event data...</p>
            <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Supabase
          </CardTitle>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
              >
                {databaseInfo ? (
                  <>
                    <Search className="h-3 w-3 mr-1.5" />
                    Explore
                  </>
                ) : (
                  <>
                    <Plug className="h-3 w-3 mr-1.5" />
                    Connect
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="!max-w-[95vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col sm:!max-w-[95vw]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {step === 'connect' ? 'Connect to Supabase' : 
                   step === 'explore' ? 'Select Event' : 
                   step === 'preview' ? 'Event Preview' : 
                   'Supabase Connection'}
                </DialogTitle>
                <DialogDescription>
                  {step === 'connect' ? 'Enter your Supabase credentials to connect to your database' : 
                   step === 'explore' ? `Found ${databaseInfo?.events.length || 0} events in your database - select one to continue` : 
                   step === 'preview' ? 'Review event details and load the data for RPI calculation' : 
                   'Connect to your Supabase database and explore available events'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto mt-4 px-1">
                <ConnectionContent />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Summary View - Always visible */}
        {!databaseInfo && !selectedEvent && (
          <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md text-center">
            <p>No connection established</p>
            <p className="mt-1">Click Connect to get started</p>
          </div>
        )}

        {databaseInfo && !selectedEvent && (
          <div className="space-y-2">
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-medium">Connected to database</span>
                </div>
                {hasRestoredConnection && (
                  <Badge variant="secondary" className="text-xs h-4 px-1.5 py-0">
                    Auto-connected
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{getProjectName(supabaseUrl)}</span>
                {getEnvironmentBadge(supabaseUrl)}
              </div>
            </div>
            <div className="text-xs p-2 bg-muted rounded-md">
              <div className="font-medium mb-1">Available Events</div>
              <div className="text-muted-foreground">
                {databaseInfo.events.length === 0 ? (
                  'No events found'
                ) : (
                  `${databaseInfo.events.length} event${databaseInfo.events.length !== 1 ? 's' : ''} available`
                )}
              </div>
            </div>
          </div>
        )}

        {selectedEvent && eventPreview && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950 rounded-md">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Event selected</span>
            </div>
            <div className="space-y-1.5 p-2.5 bg-muted rounded-md">
              <div className="font-medium text-xs flex items-center gap-1.5">
                {eventPreview.event?.name || `Event #${selectedEvent.id}`}
                {selectedEvent.sport_id && (
                  <Badge variant="outline" className="text-xs h-4 px-1 py-0">
                    {getSportConfig(selectedEvent.sport_id).icon}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  <span>{eventPreview.matchCount} matches</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{eventPreview.teams.length} teams</span>
                </div>
              </div>
              {selectedEvent.start_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(selectedEvent.start_date)}</span>
                </div>
              )}
            </div>
            {dataMetadata && (
              <div className="text-xs p-2 bg-blue-50 dark:bg-blue-950 rounded-md">
                <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-medium">Data loaded successfully</span>
                </div>
                {dataMetadata.warnings.length > 0 && (
                  <div className="mt-1 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {dataMetadata.warnings.length} warning{dataMetadata.warnings.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isConnecting && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted rounded-md">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Connecting to database...</span>
          </div>
        )}

        {(connectionError || error) && (
          <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950 rounded-md">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <strong>Error:</strong> {connectionError || error?.message}
            </div>
                </div>
              )}
            </CardContent>
    </Card>
  )
}
