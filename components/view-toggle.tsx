'use client'

import { Button } from '@/components/ui/button'
import { Table2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewMode = 'table' | 'chart'

type ViewToggleProps = {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-muted/30 rounded-md border border-border/40', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('table')}
        className={cn(
          'h-7 text-xs px-3 transition-all',
          view === 'table' 
            ? 'bg-background text-foreground shadow-md border border-border/60 font-semibold' 
            : 'text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted/60'
        )}
      >
        <Table2 className={cn('h-3.5 w-3.5 mr-1.5', view === 'table' ? 'text-foreground' : 'text-muted-foreground/60')} />
        Table
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('chart')}
        className={cn(
          'h-7 text-xs px-3 transition-all',
          view === 'chart' 
            ? 'bg-background text-foreground shadow-md border border-border/60 font-semibold' 
            : 'text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted/60'
        )}
      >
        <BarChart3 className={cn('h-3.5 w-3.5 mr-1.5', view === 'chart' ? 'text-foreground' : 'text-muted-foreground/60')} />
        Chart
      </Button>
    </div>
  )
}

