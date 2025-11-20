'use client'

import { Button } from '@/components/ui/button'
import { FileJson, FileSpreadsheet } from 'lucide-react'

type ExportButtonsProps = {
  onExportJSON: () => void
  onExportCSV: () => void
  disabled?: boolean
}

export function ExportButtons({ onExportJSON, onExportCSV, disabled }: ExportButtonsProps) {
  return (
    <div className="flex gap-1">
      <Button
        onClick={onExportJSON}
        variant="outline"
        size="sm"
        disabled={disabled}
        className="h-7 text-xs px-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:border-blue-800 dark:hover:text-blue-300"
        title="Export dataset as JSON"
      >
        <FileJson className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
      </Button>
      <Button 
        onClick={onExportCSV} 
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:border-emerald-800 dark:hover:text-emerald-300"
        title="Export results as CSV"
      >
        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      </Button>
    </div>
  )
}

