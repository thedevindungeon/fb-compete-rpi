'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, Database, Upload as UploadIcon, PanelLeftClose, PanelRightClose } from 'lucide-react'
import type { SportConfig } from '@/lib/sport-config'

type PageHeaderProps = {
  teamCount: number
  dataSource: 'sample' | 'supabase' | 'upload' | 'none'
  sportConfig?: SportConfig
  leftPanelOpen: boolean
  rightPanelOpen: boolean
  onToggleLeftPanel: () => void
  onToggleRightPanel: () => void
}

export function PageHeader({
  teamCount,
  dataSource,
  sportConfig,
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
}: PageHeaderProps) {
  const DataSourceIcon = {
    sample: Calculator,
    supabase: Database,
    upload: UploadIcon,
    none: Calculator,
  }[dataSource]

  const iconColor = {
    sample: 'text-blue-600 dark:text-blue-400',
    supabase: 'text-emerald-600 dark:text-emerald-400',
    upload: 'text-purple-600 dark:text-purple-400',
    none: '',
  }[dataSource]

  return (
    <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold leading-tight">RPI Calculator</h1>
        {sportConfig && sportConfig.name !== 'unknown' && (
          <Badge variant="outline" className="gap-1 text-xs h-6 ml-2">
            <span>{sportConfig.icon}</span>
            <span>{sportConfig.displayName}</span>
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {teamCount > 0 && (
          <>
            <Badge variant="secondary" className="gap-1 text-xs h-6 bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="h-3 w-3" />
              {teamCount}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs h-6">
              <DataSourceIcon className={`h-3 w-3 ${iconColor}`} />
              {dataSource}
            </Badge>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleLeftPanel}
          className="h-7 w-7 p-0"
          title={leftPanelOpen ? 'Hide data panels' : 'Show data panels'}
        >
          {leftPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleRightPanel}
          className="h-7 w-7 p-0"
          title={rightPanelOpen ? 'Hide coefficients' : 'Show coefficients'}
        >
          {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

