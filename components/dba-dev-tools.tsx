'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Code2,
  Copy,
  CheckCircle2,
  Terminal,
  FileJson,
  Database,
  Key,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type Props = {
  supabaseUrl: string
  supabaseKey: string
  environment: 'local' | 'staging' | 'production'
}

export default function DBADevTools({ supabaseUrl, supabaseKey, environment }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(label)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const getEnvColor = () => {
    switch (environment) {
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

  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'unknown'
  const isLocal = environment === 'local'
  const port = isLocal ? supabaseUrl.match(/:(\d+)/)?.[1] : null

  const quickCommands = [
    {
      label: 'Connect via psql',
      command: isLocal
        ? `psql postgresql://postgres:postgres@127.0.0.1:${port || '54322'}/postgres`
        : `psql "postgresql://postgres:[password]@db.${projectRef}.supabase.co:5432/postgres"`,
      description: 'Direct database connection',
    },
    {
      label: 'Reset Local DB',
      command: 'supabase db reset',
      description: 'Reset and re-run migrations',
    },
    {
      label: 'Generate TypeScript Types',
      command: 'supabase gen types typescript --local > types/supabase.ts',
      description: 'Update TypeScript types from schema',
    },
    {
      label: 'View Logs',
      command: isLocal ? 'supabase logs' : 'supabase logs --project-ref ' + projectRef,
      description: 'View database logs',
    },
  ]

  const envVars = [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      value: supabaseUrl,
      public: true,
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      value: supabaseKey.substring(0, 20) + '...',
      public: true,
      full: supabaseKey,
    },
  ]

  const apiEndpoints = [
    { path: '/api/admin/health', method: 'GET', description: 'Health check' },
    { path: '/api/admin/quick-stats', method: 'GET', description: 'Quick statistics' },
    { path: '/api/admin/:table', method: 'GET', description: 'Fetch table data' },
    { path: '/api/admin/:table', method: 'POST', description: 'Create record' },
    { path: '/api/admin/:table', method: 'PUT', description: 'Update record' },
    { path: '/api/admin/:table', method: 'DELETE', description: 'Delete record' },
  ]

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-purple-200 dark:border-purple-800">
        <CardContent className="p-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-sm">Developer Tools</h3>
                <Badge variant="outline" className={`text-xs ${getEnvColor()} text-white`}>
                  {environment.toUpperCase()}
                </Badge>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="space-y-3 mt-3 pt-3 border-t">
              {/* Connection Info */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Connection Details
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/30 border">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Project Ref</p>
                      <code className="text-xs font-mono">{projectRef}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => copyToClipboard(projectRef, 'project-ref')}
                    >
                      {copiedItem === 'project-ref' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  {isLocal && port && (
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/30 border">
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Local Port</p>
                        <code className="text-xs font-mono">{port}</code>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Environment Variables */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  Environment Variables
                </h4>
                <div className="space-y-1.5">
                  {envVars.map((env) => (
                    <div key={env.key} className="flex items-center gap-2 p-2 rounded bg-muted/30 border">
                      <FileJson className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{env.key}</p>
                        <code className="text-[10px] font-mono block truncate">
                          {env.value}
                        </code>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={() => copyToClipboard(env.full || env.value, env.key)}
                      >
                        {copiedItem === env.key ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Commands */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  Quick Commands
                </h4>
                <div className="space-y-1.5">
                  {quickCommands.map((cmd, idx) => (
                    <div key={idx} className="p-2 rounded bg-muted/30 border">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{cmd.label}</p>
                          <p className="text-[10px] text-muted-foreground">{cmd.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 flex-shrink-0"
                          onClick={() => copyToClipboard(cmd.command, `cmd-${idx}`)}
                        >
                          {copiedItem === `cmd-${idx}` ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <code className="text-[10px] font-mono block p-1.5 rounded bg-black/5 dark:bg-white/5 overflow-x-auto">
                        {cmd.command}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Endpoints */}
              <div>
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  API Endpoints
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {apiEndpoints.length} routes
                  </Badge>
                </h4>
                <div className="space-y-1">
                  {apiEndpoints.map((endpoint, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 rounded bg-muted/30 border text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Badge
                          variant="secondary"
                          className={`text-[9px] px-1.5 py-0 ${
                            endpoint.method === 'GET'
                              ? 'bg-blue-500 text-white'
                              : endpoint.method === 'POST'
                              ? 'bg-green-500 text-white'
                              : endpoint.method === 'PUT'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="font-mono text-[10px] truncate">{endpoint.path}</code>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                        {endpoint.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Useful Links */}
              {!isLocal && (
                <div>
                  <h4 className="text-xs font-semibold mb-2">Useful Links</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        window.open(`https://supabase.com/dashboard/project/${projectRef}`, '_blank')
                      }
                    >
                      Dashboard
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        window.open(
                          `https://supabase.com/dashboard/project/${projectRef}/editor`,
                          '_blank'
                        )
                      }
                    >
                      SQL Editor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        window.open(
                          `https://supabase.com/dashboard/project/${projectRef}/logs/postgres-logs`,
                          '_blank'
                        )
                      }
                    >
                      Logs
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}

