'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { HelpCircle, RotateCcw, ChevronDown, ChevronUp, Settings, TrendingUp, Target, BarChart3 } from 'lucide-react'
import { DEFAULT_COEFFICIENTS } from '@/lib/types'
import { toast } from 'sonner'
import type { RPICoefficients } from '@/lib/types'
import type { SportConfig } from '@/lib/sport-config'

type RPICoefficientsPanelProps = {
  coefficients: RPICoefficients
  onCoefficientsChange: (coefficients: RPICoefficients) => void
  sportConfig?: SportConfig
}

export function RPICoefficientsPanel({
  coefficients,
  onCoefficientsChange,
  sportConfig,
}: RPICoefficientsPanelProps) {
  const [weightsExpanded, setWeightsExpanded] = useState(true)
  const [adjustmentsExpanded, setAdjustmentsExpanded] = useState(false)
  const [advancedExpanded, setAdvancedExpanded] = useState(false)

  const handleChange = (key: keyof RPICoefficients, value: string) => {
    const numValue = parseFloat(value) || 0
    onCoefficientsChange({
      ...coefficients,
      [key]: numValue,
    })
  }

  const handleReset = () => {
    const defaultCoeffs = sportConfig?.defaultCoefficients || DEFAULT_COEFFICIENTS
    onCoefficientsChange(defaultCoeffs)
    const sportName = sportConfig?.displayName || 'default'
    toast.success('Reset', {
      description: `${sportName} defaults restored`,
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
      <Label htmlFor={htmlFor} className="flex-1 text-xs">{children}</Label>
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Coefficients</CardTitle>
            {sportConfig && sportConfig.name !== 'unknown' && (
              <Badge variant="secondary" className="text-xs h-4 px-1 py-0 gap-0.5">
                <span>{sportConfig.icon}</span>
                <span className="text-xs">{sportConfig.displayName}</span>
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 h-6 w-6 p-0"
            title={sportConfig ? `Reset to ${sportConfig.displayName} defaults` : 'Reset to defaults'}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {/* Quick Settings */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="space-y-0.5">
            <CoefficientLabel 
              htmlFor="minGames"
              tooltip="Minimum games required to be ranked"
            >
              Min Games
            </CoefficientLabel>
            <Input
              id="minGames"
              type="number"
              value={coefficients.minGames}
              onChange={(e) => handleChange('minGames', e.target.value)}
              step="1"
              min="0"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-0.5">
            <CoefficientLabel 
              htmlFor="diffCoeff"
              tooltip="Point differential weight"
            >
              DIFF
            </CoefficientLabel>
            <Input
              id="diffCoeff"
              type="number"
              value={coefficients.diffCoeff}
              onChange={(e) => handleChange('diffCoeff', e.target.value)}
              step="0.01"
              min="0"
              className="h-7 text-xs"
            />
          </div>
          </div>

        {/* RPI Weights - Collapsible */}
        <Collapsible open={weightsExpanded} onOpenChange={setWeightsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-7 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                RPI Weights
              </span>
              {weightsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 pt-1">
            <div className="space-y-1">
              <CoefficientLabel 
                htmlFor="clwpCoeff"
                tooltip="Team's own win percentage weight"
              >
                CLWP
              </CoefficientLabel>
              <Input
                id="clwpCoeff"
                type="number"
                value={coefficients.clwpCoeff}
                onChange={(e) => handleChange('clwpCoeff', e.target.value)}
                step="0.01"
                min="0"
                max="1"
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
            <CoefficientLabel 
              htmlFor="oclwpCoeff"
                tooltip="Opponent strength weight"
            >
                OCLWP
            </CoefficientLabel>
            <Input
              id="oclwpCoeff"
              type="number"
              value={coefficients.oclwpCoeff}
              onChange={(e) => handleChange('oclwpCoeff', e.target.value)}
              step="0.01"
              min="0"
              max="1"
                className="h-7 text-xs"
            />
          </div>
            <div className="space-y-1">
            <CoefficientLabel 
              htmlFor="ooclwpCoeff"
                tooltip="Opponent's opponent strength weight"
            >
                OOCLWP
            </CoefficientLabel>
            <Input
              id="ooclwpCoeff"
              type="number"
              value={coefficients.ooclwpCoeff}
              onChange={(e) => handleChange('ooclwpCoeff', e.target.value)}
              step="0.01"
              min="0"
              max="1"
                className="h-7 text-xs"
            />
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Competitive Level Adjustments - Collapsible */}
        <Collapsible open={adjustmentsExpanded} onOpenChange={setAdjustmentsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-7 text-xs hover:bg-purple-50 dark:hover:bg-purple-950/30">
              <span className="flex items-center gap-1.5">
                <Target className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                Level Adjustments
              </span>
              {adjustmentsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 pt-1">
            <div className="space-y-1">
            <CoefficientLabel 
              htmlFor="clgwStep"
                tooltip="Win adjustment per level difference"
            >
                CLGW Step
            </CoefficientLabel>
            <Input
              id="clgwStep"
              type="number"
              value={coefficients.clgwStep}
              onChange={(e) => handleChange('clgwStep', e.target.value)}
              step="0.01"
              min="0"
                className="h-7 text-xs"
            />
          </div>
            <div className="space-y-1">
            <CoefficientLabel 
              htmlFor="clglStep"
                tooltip="Loss adjustment per level difference"
            >
                CLGL Step
            </CoefficientLabel>
            <Input
              id="clglStep"
              type="number"
              value={coefficients.clglStep}
              onChange={(e) => handleChange('clglStep', e.target.value)}
              step="0.01"
              min="0"
                className="h-7 text-xs"
            />
          </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Advanced - Collapsible */}
        <Collapsible open={advancedExpanded} onOpenChange={setAdvancedExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between h-7 text-xs hover:bg-amber-50 dark:hover:bg-amber-950/30">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                Advanced
              </span>
              {advancedExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 pt-1">
            <div className="space-y-1">
            <CoefficientLabel 
                htmlFor="dominationCoeff"
                tooltip="Multiplier for 8+ win streaks"
            >
                Domination
            </CoefficientLabel>
            <Input
                id="dominationCoeff"
              type="number"
                value={coefficients.dominationCoeff}
                onChange={(e) => handleChange('dominationCoeff', e.target.value)}
              step="0.01"
              min="0"
                max="1"
                className="h-7 text-xs"
            />
          </div>
            <div className="space-y-1">
              <CoefficientLabel 
                htmlFor="diffInterval"
                tooltip="DIFF value cap interval"
              >
                Diff Interval
              </CoefficientLabel>
              <Input
                id="diffInterval"
                type="number"
                value={coefficients.diffInterval}
                onChange={(e) => handleChange('diffInterval', e.target.value)}
                step="1"
                className="h-7 text-xs"
              />
        </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

