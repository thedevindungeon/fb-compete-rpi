'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseTeamDataFromJSON, getDatasetStats } from '@/lib/data-export'
import type { TeamData } from '@/lib/types'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'

type DataUploadPanelProps = {
  onDataLoaded: (teams: TeamData[]) => void
  currentTeams?: TeamData[]
}

export function DataUploadPanel({
  onDataLoaded,
  currentTeams = [],
}: DataUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      setError('Please upload a JSON file')
      setSuccess(null)
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const text = await file.text()
      const teams = parseTeamDataFromJSON(text)
      
      if (teams.length === 0) {
        throw new Error('Dataset is empty')
      }

      const stats = getDatasetStats(teams)
      onDataLoaded(teams)
      setSuccess(
        `Loaded ${stats.teamCount} teams with ${stats.totalGames} games (${stats.fileSizeEstimate})`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setSuccess(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const currentStats = currentTeams.length > 0 ? getDatasetStats(currentTeams) : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Upload Dataset</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div
          className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer relative ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            // Only trigger if clicking the div itself, not the button
            if (e.target === e.currentTarget || (e.target as HTMLElement).closest('p')) {
              fileInputRef.current?.click()
            }
          }}
        >
          <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1.5" />
          <p className="text-xs text-muted-foreground mb-1.5">
            Drop or click
          </p>
          <Button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (fileInputRef.current) {
                fileInputRef.current.click()
              }
            }}
            disabled={isProcessing}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            type="button"
          >
            {isProcessing ? 'Processing...' : 'Select File'}
          </Button>
          <input
            id="file-upload-input"
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileInputChange}
            style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
            aria-label="Upload JSON dataset file"
          />
        </div>

        {error && (
          <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-950 rounded-md">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950 rounded-md">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">{success}</div>
          </div>
        )}

        {currentStats && (
          <div className="p-2 bg-muted rounded-md">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Current Dataset</span>
            </div>
            <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-2 gap-y-0.5">
              <div>Teams: {currentStats.teamCount}</div>
              <div>Games: {currentStats.totalGames}</div>
              <div className="col-span-2">Records: {currentStats.totalRecords.toLocaleString()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

