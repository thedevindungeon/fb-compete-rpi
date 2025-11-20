'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Save, History, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { saveRPICalculation, getRPICalculationHistory } from '@/lib/rpi-history'
import type { TeamData, RPICoefficients } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

type SaveRPICalculationButtonProps = {
  eventId: number | null
  sportId: number | null
  supabaseUrl?: string
  supabaseKey?: string
  teams: TeamData[]
  coefficients: RPICoefficients
  totalMatches?: number
  matchesWithScores?: number
  disabled?: boolean
}

export function SaveRPICalculationButton({
  eventId,
  sportId,
  supabaseUrl,
  supabaseKey,
  teams,
  coefficients,
  totalMatches = 0,
  matchesWithScores = 0,
  disabled = false,
}: SaveRPICalculationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<{
    success: boolean
    message: string
    runId?: number
  } | null>(null)
  const [notes, setNotes] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const canSave = eventId && sportId && supabaseUrl && supabaseKey && teams.length > 0

  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    setSaveResult(null)

    try {
      const startTime = Date.now()
      
      const result = await saveRPICalculation(
        supabaseUrl!,
        supabaseKey!,
        {
          eventId: eventId!,
          sportId: sportId!,
          coefficients,
          teams,
          totalMatches,
          matchesWithScores,
          calculationDurationMs: Date.now() - startTime,
          calculationType: 'manual',
          notes: notes.trim() || undefined,
        }
      )

      if (result.success) {
        setSaveResult({
          success: true,
          message: `Calculation saved successfully! Run ID: ${result.runId}`,
          runId: result.runId,
        })
        setNotes('')
        // Refresh history
        loadHistory()
      } else {
        setSaveResult({
          success: false,
          message: result.error || 'Failed to save calculation',
        })
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const loadHistory = async () => {
    if (!canSave) return

    setLoadingHistory(true)
    try {
      const historyData = await getRPICalculationHistory(
        supabaseUrl!,
        supabaseKey!,
        eventId!,
        10
      )
      setHistory(historyData)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && canSave) {
      loadHistory()
    }
    if (!open) {
      setSaveResult(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !canSave}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Save Calculation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Save RPI Calculation
          </DialogTitle>
          <DialogDescription>
            Create a historical snapshot of the current RPI rankings for this event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current Calculation Info */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="font-medium text-sm">Current Calculation</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Teams:</span>{' '}
                <span className="font-medium">{teams.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Matches:</span>{' '}
                <span className="font-medium">{totalMatches}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Formula:</span>{' '}
                <span className="font-mono text-xs">
                  {coefficients.clwpCoeff.toFixed(2)}-
                  {coefficients.oclwpCoeff.toFixed(2)}-
                  {coefficients.ooclwpCoeff.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">With Scores:</span>{' '}
                <span className="font-medium">{matchesWithScores}</span>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm">
              Notes (Optional)
            </Label>
            <Input
              id="notes"
              placeholder="e.g., After tournament day 1, Updated coefficients for testing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSaving}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Add context about this calculation for future reference
            </p>
          </div>

          {/* Save Result */}
          {saveResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-md text-sm ${
                saveResult.success
                  ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
              }`}
            >
              {saveResult.success ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{saveResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !canSave}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Snapshot
                </>
              )}
            </Button>
          </div>

          {/* History Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-sm">Calculation History</div>
                <p className="text-xs text-muted-foreground">
                  Recent calculations for this event
                </p>
              </div>
              {loadingHistory && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6 bg-muted rounded-md">
                No previous calculations
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-md text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        Run #{run.id}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {run.notes || 'No notes'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <Badge variant="secondary" className="text-xs">
                        {run.total_teams} teams
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDate(run.calculated_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

