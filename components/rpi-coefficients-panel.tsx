'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { HelpCircle, RotateCcw } from 'lucide-react'
import { DEFAULT_COEFFICIENTS } from '@/lib/types'
import { toast } from 'sonner'
import type { RPICoefficients } from '@/lib/types'

type RPICoefficientsPanelProps = {
  coefficients: RPICoefficients
  onCoefficientsChange: (coefficients: RPICoefficients) => void
}

export function RPICoefficientsPanel({
  coefficients,
  onCoefficientsChange,
}: RPICoefficientsPanelProps) {
  const handleChange = (key: keyof RPICoefficients, value: string) => {
    const numValue = parseFloat(value) || 0
    onCoefficientsChange({
      ...coefficients,
      [key]: numValue,
    })
  }

  const handleReset = () => {
    onCoefficientsChange(DEFAULT_COEFFICIENTS)
    toast.success('Coefficients reset', {
      description: 'All coefficients restored to default values',
    })
  }

  const CoefficientLabel = ({ 
    htmlFor, 
    children, 
    tooltip 
  }: { 
    htmlFor: string
    children: React.ReactNode
    tooltip: string 
  }) => (
    <div className="flex items-center gap-1">
      <Label htmlFor={htmlFor} className="flex-1">{children}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">RPI Coefficients</CardTitle>
            <CardDescription className="text-xs">
              Adjust to affect rankings
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 h-7 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <CoefficientLabel 
              htmlFor="diffInterval"
              tooltip="If set to 15, DIFF value will be capped at the interval [-15:15] to prevent extreme score differentials from skewing results."
            >
              <span className="text-xs">Diff Interval</span>
            </CoefficientLabel>
            <Input
              id="diffInterval"
              type="number"
              value={coefficients.diffInterval}
              onChange={(e) => handleChange('diffInterval', e.target.value)}
              step="1"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>

          <div className="space-y-1">
            <CoefficientLabel 
              htmlFor="minGames"
              tooltip="Minimum number of games required for a team to be ranked. Prevents teams with few games from appearing at the top of standings."
            >
              <span className="text-xs">Min Games</span>
            </CoefficientLabel>
            <Input
              id="minGames"
              type="number"
              value={coefficients.minGames}
              onChange={(e) => handleChange('minGames', e.target.value)}
              step="1"
              min="0"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">RPI Coefficients</h3>
          
          <div className="space-y-1.5">
            <CoefficientLabel 
              htmlFor="clwpCoeff"
              tooltip="Weight for team's own Competitive Level Winning Percentage. Higher values emphasize wins/losses more heavily in the final RPI calculation."
            >
              <span className="text-xs">CLWP</span>
            </CoefficientLabel>
            <Input
              id="clwpCoeff"
              type="number"
              value={coefficients.clwpCoeff}
              onChange={(e) => handleChange('clwpCoeff', e.target.value)}
              step="0.01"
              min="0"
              max="1"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <CoefficientLabel 
              htmlFor="oclwpCoeff"
              tooltip="Weight for Opponent Competitive Level Winning Percentage. Higher values reward teams for playing against stronger opponents."
            >
              <span className="text-xs">OCLWP</span>
            </CoefficientLabel>
            <Input
              id="oclwpCoeff"
              type="number"
              value={coefficients.oclwpCoeff}
              onChange={(e) => handleChange('oclwpCoeff', e.target.value)}
              step="0.01"
              min="0"
              max="1"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <CoefficientLabel 
              htmlFor="ooclwpCoeff"
              tooltip="Weight for Opponent's Opponent CLWP. This provides a second-degree measure of schedule strength by considering the quality of opponents' opponents."
            >
              <span className="text-xs">OOCLWP</span>
            </CoefficientLabel>
            <Input
              id="ooclwpCoeff"
              type="number"
              value={coefficients.ooclwpCoeff}
              onChange={(e) => handleChange('ooclwpCoeff', e.target.value)}
              step="0.01"
              min="0"
              max="1"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <CoefficientLabel 
              htmlFor="dominationCoeff"
              tooltip="Multiplier applied when a team has 8+ consecutive wins. Values < 1.0 prevent over-rewarding win streaks. Default: 0.9"
            >
              <span className="text-xs">Domination</span>
            </CoefficientLabel>
            <Input
              id="dominationCoeff"
              type="number"
              value={coefficients.dominationCoeff}
              onChange={(e) => handleChange('dominationCoeff', e.target.value)}
              step="0.01"
              min="0"
              max="1"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <CoefficientLabel 
              htmlFor="clgwStep"
              tooltip="Adjustment amount per competitive level difference for wins. Beating a stronger team increases win value; beating a weaker team decreases it."
            >
              <span className="text-xs">CLGW Step</span>
            </CoefficientLabel>
            <Input
              id="clgwStep"
              type="number"
              value={coefficients.clgwStep}
              onChange={(e) => handleChange('clgwStep', e.target.value)}
              step="0.01"
              min="0"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <CoefficientLabel 
              htmlFor="clglStep"
              tooltip="Adjustment amount per competitive level difference for losses. Losing to a stronger team reduces loss penalty; losing to a weaker team increases it."
            >
              <span className="text-xs">CLGL Step</span>
            </CoefficientLabel>
            <Input
              id="clglStep"
              type="number"
              value={coefficients.clglStep}
              onChange={(e) => handleChange('clglStep', e.target.value)}
              step="0.01"
              min="0"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <CoefficientLabel 
              htmlFor="diffCoeff"
              tooltip="Weight for point differentials. Higher values emphasize margin of victory/defeat. Measures how dominant teams are in their wins and losses."
            >
              <span className="text-xs">DIFF Coeff</span>
            </CoefficientLabel>
            <Input
              id="diffCoeff"
              type="number"
              value={coefficients.diffCoeff}
              onChange={(e) => handleChange('diffCoeff', e.target.value)}
              step="0.01"
              min="0"
              className="h-7 text-xs transition-all focus:ring-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

