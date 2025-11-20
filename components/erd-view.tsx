'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database, FileText, Table, Key, Link2, ArrowRight } from 'lucide-react'

type Entity = {
  name: string
  type: 'application' | 'database' | 'calculated'
  fields: Array<{
    name: string
    type: string
    isKey?: boolean
    isOptional?: boolean
    description?: string
  }>
  position: { x: number; y: number }
  color: string
}

type Relationship = {
  from: string
  to: string
  type: 'one-to-many' | 'many-to-many' | 'transforms-to'
  label?: string
}

const ENTITIES: Entity[] = [
  {
    name: 'TeamData',
    type: 'application',
    color: 'border-blue-400',
    position: { x: 100, y: 50 },
    fields: [
      { name: 'id', type: 'number', isKey: true },
      { name: 'name', type: 'string' },
      { name: 'competitiveLevel', type: 'number' },
      { name: 'games', type: 'GameData[]', description: 'Array of games played' },
    ],
  },
  {
    name: 'GameData',
    type: 'application',
    color: 'border-blue-400',
    position: { x: 100, y: 280 },
    fields: [
      { name: 'opponentId', type: 'number', description: 'References TeamData.id' },
      { name: 'teamScore', type: 'number' },
      { name: 'opponentScore', type: 'number' },
      { name: 'isWin', type: 'boolean' },
      { name: 'isTie', type: 'boolean', isOptional: true },
      { name: 'competitiveLevelDiff', type: 'number', description: 'opponentLevel - teamLevel' },
    ],
  },
  {
    name: 'TeamRPIResult',
    type: 'calculated',
    color: 'border-purple-400',
    position: { x: 100, y: 510 },
    fields: [
      { name: 'teamId', type: 'number', isKey: true },
      { name: 'teamName', type: 'string' },
      { name: 'games', type: 'number' },
      { name: 'wins', type: 'number' },
      { name: 'losses', type: 'number' },
      { name: 'ties', type: 'number' },
      { name: 'wp', type: 'number', description: 'Winning Percentage' },
      { name: 'clwp', type: 'number', description: 'Competitive Level WP' },
      { name: 'oclwp', type: 'number', description: 'Opponent CLWP' },
      { name: 'ooclwp', type: 'number', description: "Opponent's Opponent CLWP" },
      { name: 'diff', type: 'number', description: 'Points Differential' },
      { name: 'rpi', type: 'number', description: 'Final RPI Score' },
    ],
  },
  {
    name: 'RPICoefficients',
    type: 'application',
    color: 'border-green-400',
    position: { x: 100, y: 740 },
    fields: [
      { name: 'clwpCoeff', type: 'number', description: 'Default: 0.9' },
      { name: 'oclwpCoeff', type: 'number', description: 'Default: 0.1' },
      { name: 'ooclwpCoeff', type: 'number', description: 'Default: 0.1' },
      { name: 'diffCoeff', type: 'number', description: 'Default: 0.1' },
      { name: 'dominationCoeff', type: 'number', description: 'Default: 0.9' },
      { name: 'clgwStep', type: 'number', description: 'Default: 0.05' },
      { name: 'clglStep', type: 'number', description: 'Default: 0.1' },
      { name: 'minGames', type: 'number', description: 'Default: 3' },
      { name: 'diffInterval', type: 'number', description: 'Default: 15' },
    ],
  },
  {
    name: 'match',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 500, y: 50 },
    fields: [
      { name: 'id', type: 'bigint', isKey: true },
      { name: 'event_id', type: 'bigint' },
      { name: 'published', type: 'boolean' },
      { name: 'config', type: 'jsonb' },
      { name: 'status', type: 'text' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
  {
    name: 'match_team',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 500, y: 280 },
    fields: [
      { name: 'match_id', type: 'bigint', isKey: true, description: 'FK → match.id' },
      { name: 'team_id', type: 'bigint', isKey: true, description: 'FK → teams.id' },
      { name: 'event_id', type: 'bigint' },
      { name: 'definition', type: 'text', description: 'home/away' },
      { name: 'win_count', type: 'smallint' },
      { name: 'loss_count', type: 'smallint' },
    ],
  },
  {
    name: 'match_game',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 500, y: 510 },
    fields: [
      { name: 'id', type: 'bigint', isKey: true },
      { name: 'match_id', type: 'bigint', description: 'FK → match.id' },
      { name: 'event_id', type: 'bigint' },
      { name: 'config', type: 'jsonb' },
      { name: 'status', type: 'text' },
    ],
  },
  {
    name: 'match_game_team',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 500, y: 740 },
    fields: [
      { name: 'id', type: 'bigint', isKey: true },
      { name: 'match_game_id', type: 'bigint', description: 'FK → match_game.id' },
      { name: 'team_id', type: 'bigint', description: 'FK → teams.id' },
      { name: 'score', type: 'smallint' },
      { name: 'team_result', type: 'text', isOptional: true },
      { name: 'definition', type: 'text' },
    ],
  },
  {
    name: 'teams',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 500, y: 970 },
    fields: [
      { name: 'id', type: 'bigint', isKey: true },
      { name: 'name', type: 'text' },
      { name: 'competitive_level_id', type: 'bigint', isOptional: true },
    ],
  },
  {
    name: 'sports',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 900, y: 50 },
    fields: [
      { name: 'id', type: 'integer', isKey: true },
      { name: 'name', type: 'varchar(50)' },
      { name: 'display_name', type: 'varchar(100)' },
      { name: 'icon', type: 'varchar(10)' },
      { name: 'slug', type: 'varchar(50)' },
      { name: 'default_clwp_coeff', type: 'decimal(4,3)' },
      { name: 'default_oclwp_coeff', type: 'decimal(4,3)' },
      { name: 'default_ooclwp_coeff', type: 'decimal(4,3)' },
    ],
  },
  {
    name: 'compete_event_details',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 900, y: 280 },
    fields: [
      { name: 'event_id', type: 'bigint', isKey: true },
      { name: 'sport_id', type: 'integer', description: 'FK → sports.id' },
    ],
  },
  {
    name: 'team_rpi',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 900, y: 510 },
    fields: [
      { name: 'id', type: 'bigserial', isKey: true },
      { name: 'team_id', type: 'bigint', description: 'FK → teams.id' },
      { name: 'sport_id', type: 'bigint' },
      { name: 'value', type: 'numeric(10,6)' },
      { name: 'generated_at', type: 'timestamptz' },
      { name: 'active', type: 'boolean' },
    ],
  },
  {
    name: 'rpi_calculation_runs',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 900, y: 740 },
    fields: [
      { name: 'id', type: 'bigserial', isKey: true },
      { name: 'event_id', type: 'bigint', description: 'FK → events.id' },
      { name: 'sport_id', type: 'integer', description: 'FK → sports.id' },
      { name: 'calculated_at', type: 'timestamptz' },
      { name: 'clwp_coeff', type: 'decimal(4,3)' },
      { name: 'oclwp_coeff', type: 'decimal(4,3)' },
      { name: 'ooclwp_coeff', type: 'decimal(4,3)' },
      { name: 'total_teams', type: 'integer' },
      { name: 'total_matches', type: 'integer' },
    ],
  },
  {
    name: 'rpi_results',
    type: 'database',
    color: 'border-emerald-400',
    position: { x: 900, y: 970 },
    fields: [
      { name: 'run_id', type: 'bigint', isKey: true, description: 'FK → rpi_calculation_runs.id' },
      { name: 'team_id', type: 'bigint', isKey: true, description: 'FK → teams.id' },
      { name: 'rank', type: 'smallint' },
      { name: 'rpi', type: 'decimal(6,4)' },
      { name: 'wp', type: 'decimal(5,4)' },
      { name: 'owp', type: 'decimal(5,4)' },
      { name: 'oowp', type: 'decimal(5,4)' },
      { name: 'wins', type: 'smallint' },
      { name: 'losses', type: 'smallint' },
      { name: 'ties', type: 'smallint' },
    ],
  },
]

const RELATIONSHIPS: Relationship[] = [
  // Application Layer
  { from: 'TeamData', to: 'GameData', type: 'one-to-many', label: 'has many' },
  { from: 'GameData', to: 'TeamData', type: 'one-to-many', label: 'opponentId →' },
  { from: 'TeamData', to: 'TeamRPIResult', type: 'transforms-to', label: 'calculateRPI()' },
  { from: 'RPICoefficients', to: 'TeamRPIResult', type: 'transforms-to', label: 'used in' },
  
  // Database - Match Structure
  { from: 'match', to: 'match_team', type: 'one-to-many', label: 'has many' },
  { from: 'match', to: 'match_game', type: 'one-to-many', label: 'has many' },
  { from: 'match_game', to: 'match_game_team', type: 'one-to-many', label: 'has many' },
  { from: 'teams', to: 'match_team', type: 'one-to-many', label: 'participates in' },
  { from: 'teams', to: 'match_game_team', type: 'one-to-many', label: 'participates in' },
  
  // Database - Sports & RPI Configuration
  { from: 'sports', to: 'compete_event_details', type: 'one-to-many', label: 'configures' },
  { from: 'sports', to: 'rpi_calculation_runs', type: 'one-to-many', label: 'defines coeff' },
  { from: 'sports', to: 'team_rpi', type: 'one-to-many', label: 'categorizes' },
  
  // Database - RPI History & Results
  { from: 'rpi_calculation_runs', to: 'rpi_results', type: 'one-to-many', label: 'contains' },
  { from: 'teams', to: 'rpi_results', type: 'one-to-many', label: 'has results' },
  { from: 'teams', to: 'team_rpi', type: 'one-to-many', label: 'has RPI' },
  
  // Transformation
  { from: 'match', to: 'TeamData', type: 'transforms-to', label: 'Supabase →' },
  { from: 'TeamRPIResult', to: 'rpi_results', type: 'transforms-to', label: 'saves to' },
]

const getEntityColor = (type: Entity['type']) => {
  switch (type) {
    case 'application':
      return 'border-blue-400'
    case 'database':
      return 'border-emerald-400'
    case 'calculated':
      return 'border-purple-400'
  }
}

const getEntityIcon = (type: Entity['type']) => {
  switch (type) {
    case 'application':
      return <FileText className="h-4 w-4 text-blue-600" />
    case 'database':
      return <Database className="h-4 w-4 text-emerald-600" />
    case 'calculated':
      return <Table className="h-4 w-4 text-purple-600" />
  }
}

export function ERDView() {
  const entityWidth = 280
  const entityHeight = 180
  const spacing = 50

  const [dimensions, setDimensions] = useState({ width: 1500, height: 1200 })

  useEffect(() => {
    const updateDimensions = () => {
      const width = Math.max(1500, window.innerWidth - 80)
      const maxEntityY = Math.max(...ENTITIES.map(e => e.position.y))
      const minHeight = maxEntityY + 250
      const height = Math.max(minHeight, window.innerHeight - 200)
      setDimensions({ width, height })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Three-column layout for better readability
  const adjustedEntities = ENTITIES.map((entity, index) => {
    const col = Math.floor(index / 5)
    const row = index % 5
    return {
      ...entity,
      position: {
        x: 100 + (col * 350),
        y: 50 + (row * 220)
      }
    }
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            Entity Relationship Diagram
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            RPI Calculator Data Structure
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-6 min-w-full min-h-full">
            <svg
              width={dimensions.width}
              height={dimensions.height}
              className="w-full h-full"
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Relationships */}
              {RELATIONSHIPS.map((rel, idx) => {
                const fromEntity = adjustedEntities.find((e) => e.name === rel.from)
                const toEntity = adjustedEntities.find((e) => e.name === rel.to)
                if (!fromEntity || !toEntity) return null

                const fromX = fromEntity.position.x + entityWidth / 2
                const fromY = fromEntity.position.y + entityHeight / 2
                const toX = toEntity.position.x + entityWidth / 2
                const toY = toEntity.position.y + entityHeight / 2

                const dx = toX - fromX
                const dy = toY - fromY
                const distance = Math.sqrt(dx * dx + dy * dy)
                const angle = Math.atan2(dy, dx)

                const arrowX = toX - Math.cos(angle) * (entityHeight / 2 + 8)
                const arrowY = toY - Math.sin(angle) * (entityHeight / 2 + 8)

                let strokeColor = '#6b7280'
                let strokeDash = 'none'
                let strokeWidth = 2
                if (rel.type === 'transforms-to') {
                  strokeColor = '#8b5cf6'
                  strokeDash = '5,5'
                  strokeWidth = 2.5
                } else {
                  strokeColor = '#3b82f6'
                  strokeWidth = 2
                }

                const midX = (fromX + toX) / 2
                const midY = (fromY + toY) / 2
                
                // Determine if this is a horizontal or vertical connection
                const isHorizontal = Math.abs(fromX - toX) > Math.abs(fromY - toY)
                
                // Calculate label position outside entities
                let labelX = midX
                let labelY = midY
                let labelBgX = midX - 45
                let labelBgY = midY - 12

                if (isHorizontal) {
                  // Horizontal connection - place label above the line
                  labelY = fromY < toY ? midY - 35 : midY + 35
                  labelBgY = labelY - 10
                } else {
                  // Vertical connection - place label to the right of the line
                  labelX = fromX < toX ? midX + 35 : midX - 35
                  labelBgX = labelX - 45
                }

                // Adjust for entities to ensure labels don't overlap cards
                const fromRect = {
                  x: fromEntity.position.x,
                  y: fromEntity.position.y,
                  width: entityWidth,
                  height: entityHeight
                }
                const toRect = {
                  x: toEntity.position.x,
                  y: toEntity.position.y,
                  width: entityWidth,
                  height: entityHeight
                }

                if (fromEntity && toEntity) {
                  // Ensure label doesn't overlap source entity
                  if (labelX >= fromRect.x && labelX <= fromRect.x + fromRect.width &&
                      labelY >= fromRect.y && labelY <= fromRect.y + fromRect.height) {
                    labelY = fromRect.y - 25
                    labelBgY = labelY - 10
                  }

                  // Ensure label doesn't overlap target entity
                  if (labelX >= toRect.x && labelX <= toRect.x + toRect.width &&
                      labelY >= toRect.y && labelY <= toRect.y + toRect.height) {
                    labelY = toRect.y + toRect.height + 25
                    labelBgY = labelY - 10
                  }
                }

                return (
                  <g key={`rel-${idx}`}>
                    {/* Connection line */}
                    <line
                      x1={fromX}
                      y1={fromY}
                      x2={toX}
                      y2={toY}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      markerEnd={`url(#arrow-${rel.type})`}
                    />
                    {rel.label && (
                      <g>
                        {/* Background box with better contrast */}
                        <rect
                          x={labelBgX}
                          y={labelBgY}
                          width={90}
                          height={22}
                          fill="hsl(var(--background))"
                          rx="8"
                          stroke={strokeColor}
                          strokeWidth="1.5"
                          opacity="1"
                          className="drop-shadow-sm"
                        />
                        {/* Label text - slightly larger and bolder */}
                        <text
                          x={labelX}
                          y={labelY}
                          fill={strokeColor}
                          fontSize="11"
                          fontWeight="700"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {rel.label}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {/* Arrow definitions */}
              <defs>
                <marker
                  id="arrow-one-to-many"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
                <marker
                  id="arrow-transforms-to"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#8b5cf6" />
                </marker>
              </defs>

              {/* Entities */}
              {adjustedEntities.map((entity) => (
                <g key={entity.name}>
                  {/* Entity card */}
                  <foreignObject
                    x={entity.position.x}
                    y={entity.position.y}
                    width={entityWidth}
                    height={entityHeight}
                  >
                    <div className={`w-full h-full p-4 border-2 rounded-lg shadow-sm ${getEntityColor(entity.type)} bg-card text-card-foreground`}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${getEntityColor(entity.type).replace('border', 'bg').replace('-400', '-100')}`}>
                            {getEntityIcon(entity.type)}
                          </div>
                          <span className="font-semibold text-sm">{entity.name}</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {entity.type}
                        </span>
                      </div>

                      {/* Fields */}
                      <div className="space-y-2">
                        {entity.fields.map((field, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 flex-1">
                              {field.isKey && <Key className="h-3 w-3 text-amber-600" />}
                              <span className={field.isKey ? 'font-bold text-amber-600' : 'font-medium'}>
                                {field.name}
                                {field.isOptional && <span className="text-muted-foreground ml-1">?</span>}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-muted-foreground">{field.type}</span>
                              {field.description && (
                                <span className="text-xs text-muted-foreground/70 max-w-[100px] truncate">
                                  {field.description}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              ))}
            </svg>

            {/* Simple Legend */}
            <div className="mt-8 p-4 border rounded-lg bg-muted/20">
              <h3 className="text-sm font-semibold mb-3">Legend</h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Application</span>
                  </div>
                  <div className="text-muted-foreground text-[10px] ml-5">TypeScript interfaces</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                    <span>Database</span>
                  </div>
                  <div className="text-muted-foreground text-[10px] ml-5">Supabase tables</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>Calculated</span>
                  </div>
                  <div className="text-muted-foreground text-[10px] ml-5">RPI results</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-blue-500" />
                  <span>Solid line: One-to-Many</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-purple-500" />
                  <span>Dashed line: Transformation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3 text-amber-600" />
                  <span>Key: Primary/Foreign Key</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

