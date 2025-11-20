'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, TrendingUp, Users, Trophy, Target, Zap, Dribbble, Award, CircleDot, Volleyball } from 'lucide-react'

export function FormulasView() {
  return (
    <Card className="h-full flex flex-col shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4 border-b flex-shrink-0">
        <CardTitle className="text-sm flex items-center gap-2 font-bold">
          <div className="p-1 rounded-md bg-gradient-to-br from-blue-500 to-purple-500 shadow-sm">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          RPI Calculation Formulas
          <span className="text-xs font-medium text-muted-foreground/60 ml-auto">
            Sport-Specific Reference
          </span>
        </CardTitle>
      </CardHeader>

      <Tabs defaultValue="basketball" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 w-auto">
          <TabsTrigger value="basketball" className="text-xs">
            <Dribbble className="h-3 w-3 mr-1" />
            Basketball
          </TabsTrigger>
          <TabsTrigger value="baseball" className="text-xs">
            <CircleDot className="h-3 w-3 mr-1" />
            Baseball
          </TabsTrigger>
          <TabsTrigger value="soccer" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Soccer
          </TabsTrigger>
          <TabsTrigger value="volleyball" className="text-xs">
            <Volleyball className="h-3 w-3 mr-1" />
            Volleyball
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basketball" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <CardContent className="p-4 space-y-4 pb-8">
          {/* Overview */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-yellow-500/20">
                <Trophy className="h-3.5 w-3.5 text-yellow-600" />
              </div>
              Final RPI Formula
            </h2>
            
            {/* Mathematical Notation */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 rounded-lg border space-y-2 shadow-sm">
              <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                Scientific Notation
              </div>
              <div className="font-mono text-[11px] space-y-1.5 bg-white/50 dark:bg-black/20 p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">RPI<sub>base</sub> =</span>
                  <span className="text-muted-foreground">α·CLWP + β·OCLWP + γ·OOCLWP</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">RPI<sub>adj</sub> =</span>
                  <span className="text-muted-foreground">RPI<sub>base</sub> + δ·DIFF</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600 dark:text-blue-400">RPI<sub>final</sub> =</span>
                  <span className="text-muted-foreground">RPI<sub>adj</sub> · θ(W<sub>streak</sub>)</span>
                </div>
              </div>
              
              <div className="text-[9px] text-muted-foreground space-y-0.5 pl-2">
                <div>where: α=0.9, β=0.1, γ=0.1, δ=0.1, θ(x)={`{0.9 if x≥8, 1 otherwise}`}</div>
              </div>
            </div>

            {/* Plain English */}
            <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
              <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                Plain English
              </div>
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                Your rating is mostly about <strong>who you beat and lost to</strong> (90%), adjusted for <strong>how strong they were</strong>. We add a tiny bit for <strong>strength of schedule</strong> (10% + 10%) and <strong>winning margin</strong> (10%). If you win 8+ games in a row, we reduce your score by 10% to prevent gaming the system.
              </div>
            </div>

            {/* Coefficients with explanations */}
            <div className="mt-2 p-2 bg-muted/30 rounded-md border">
              <div className="font-semibold text-[11px] text-foreground mb-1.5 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Coefficient Values
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="grid grid-cols-[80px,1fr] gap-2 items-start">
                  <div className="font-mono text-foreground">α = 0.9</div>
                  <div className="text-muted-foreground">CLWP weight (your wins/losses)</div>
                </div>
                <div className="grid grid-cols-[80px,1fr] gap-2 items-start">
                  <div className="font-mono text-foreground">β = 0.1</div>
                  <div className="text-muted-foreground">OCLWP weight (opponent quality)</div>
                </div>
                <div className="grid grid-cols-[80px,1fr] gap-2 items-start">
                  <div className="font-mono text-foreground">γ = 0.1</div>
                  <div className="text-muted-foreground">OOCLWP weight (schedule context)</div>
                </div>
                <div className="grid grid-cols-[80px,1fr] gap-2 items-start">
                  <div className="font-mono text-foreground">δ = 0.1</div>
                  <div className="text-muted-foreground">DIFF weight (point margins)</div>
                </div>
                <div className="grid grid-cols-[80px,1fr] gap-2 items-start">
                  <div className="font-mono text-foreground">θ = 0.9</div>
                  <div className="text-muted-foreground">Domination penalty (8+ streak)</div>
                </div>
              </div>
            </div>
          </section>

          {/* CLWP */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-green-500/20">
                <Target className="h-3.5 w-3.5 text-green-600" />
              </div>
              CLWP (Competitive Level Winning %)
            </h2>
            
            <div className="space-y-2">
              {/* Scientific Explanation */}
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                  Mathematical Definition
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
                  <div className="font-mono bg-white/50 dark:bg-black/20 p-1.5 rounded">
                    CLWP = Σ w<sub>adj</sub> / (Σ w<sub>adj</sub> + Σ l<sub>adj</sub>)
                  </div>
                  <div className="text-[9px]">
                    A <strong>weighted winning percentage</strong> where each game outcome is adjusted by the competitive level differential (Δ<sub>CL</sub>) between teams. Uses asymmetric penalty coefficients: κ<sub>w</sub>=0.05 for wins, κ<sub>l</sub>=0.10 for losses.
                  </div>
                </div>
              </div>

              {/* Plain English */}
              <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                  Simple Explanation
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  Think of it like <strong>quality wins vs quality losses</strong>. Beat a Level 10 team when you're Level 8? That's worth <strong>1.10 wins</strong> (bonus!). Beat a Level 6? Only <strong>0.90 wins</strong> (expected). Lose to a stronger team? <strong>Less penalty</strong>. Lose to a weaker team? <strong>Bigger penalty</strong>. Then calculate your win percentage.
                </div>
              </div>

              {/* Adjustment Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded">
                  <div className="font-bold text-foreground mb-0.5 flex items-center justify-between">
                    <span>Win vs Stronger</span>
                    <span className="text-[9px] text-green-600">+Bonus</span>
                  </div>
                  <div className="font-mono text-muted-foreground">w = 1 + (Δ<sub>CL</sub> × 0.05)</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Upset victory bonus</div>
                </div>

                <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded">
                  <div className="font-bold text-foreground mb-0.5 flex items-center justify-between">
                    <span>Win vs Weaker</span>
                    <span className="text-[9px] text-orange-600">-Penalty</span>
                  </div>
                  <div className="font-mono text-muted-foreground">w = 1 - (Δ<sub>CL</sub> × 0.05)</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Expected win discount</div>
                </div>

                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                  <div className="font-bold text-foreground mb-0.5 flex items-center justify-between">
                    <span>Loss vs Stronger</span>
                    <span className="text-[9px] text-red-400">Reduced</span>
                  </div>
                  <div className="font-mono text-muted-foreground">l = 1 - (Δ<sub>CL</sub> × 0.1)</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Expected loss forgiveness</div>
                </div>

                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded">
                  <div className="font-bold text-foreground mb-0.5 flex items-center justify-between">
                    <span>Loss vs Weaker</span>
                    <span className="text-[9px] text-red-600">+Penalty</span>
                  </div>
                  <div className="font-mono text-muted-foreground">l = 1 + (Δ<sub>CL</sub> × 0.1)</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Upset loss punishment</div>
                </div>
              </div>

              {/* Example */}
              <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded">
                <div className="font-bold text-[11px] text-foreground mb-1">Example: Team A (Level 8)</div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span>• Beat Level 10 (Δ=2):</span>
                    <span className="font-mono">1 + (2×0.05) = <strong>1.10</strong> ✓</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Beat Level 6 (Δ=2):</span>
                    <span className="font-mono">1 - (2×0.05) = <strong>0.90</strong> ✓</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Lost to Level 9 (Δ=1):</span>
                    <span className="font-mono">1 - (1×0.1) = <strong>0.90</strong> ✗</span>
                  </div>
                  <div className="pt-1 border-t mt-1 font-semibold flex justify-between">
                    <span>CLWP =</span>
                    <span className="font-mono">2.00 / (2.00 + 0.90) = <strong className="text-foreground">0.689</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* OCLWP */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-purple-500/20">
                <Users className="h-3.5 w-3.5 text-purple-600" />
              </div>
              OCLWP (Opponent CLWP)
            </h2>
            
            <div className="space-y-2">
              {/* Scientific */}
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                  Formula
                </div>
                <div className="font-mono bg-white/50 dark:bg-black/20 p-1.5 rounded text-[10px]">
                  OCLWP = (1/n) Σ<sub>i=1</sub><sup>n</sup> CLWP<sub>opponent_i</sub>
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  Arithmetic mean of opponent CLWPs. Represents <strong>first-order schedule strength</strong> - how good are the teams you faced?
                </div>
              </div>

              {/* Plain English */}
              <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                  Simple Explanation
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong>Who did you play?</strong> Add up the quality (CLWP) of each team you faced, divide by how many teams. High OCLWP = you played tough opponents. Low OCLWP = you played weak opponents. It's your <strong>"strength of schedule"</strong> score.
                </div>
              </div>

              {/* Example */}
              <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded">
                <div className="font-bold text-[11px] text-foreground mb-1">Example: Team A's Schedule</div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between"><span>• Team B:</span> <span className="font-mono">CLWP = 0.750</span></div>
                  <div className="flex justify-between"><span>• Team C:</span> <span className="font-mono">CLWP = 0.600</span></div>
                  <div className="flex justify-between"><span>• Team D:</span> <span className="font-mono">CLWP = 0.800</span></div>
                  <div className="pt-1 border-t mt-1 font-semibold flex justify-between">
                    <span>OCLWP =</span>
                    <span className="font-mono">(0.750+0.600+0.800)/3 = <strong className="text-foreground">0.717</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* OOCLWP */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-indigo-500/20">
                <Users className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              OOCLWP (Opponent's Opponent CLWP)
            </h2>
            
            <div className="space-y-2">
              {/* Scientific */}
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                  Formula
                </div>
                <div className="font-mono bg-white/50 dark:bg-black/20 p-1.5 rounded text-[10px]">
                  OOCLWP = (1/m) Σ<sub>j=1</sub><sup>n</sup> Σ<sub>k∈O<sub>j</sub>\&#123;i&#125;</sub> CLWP<sub>k</sub>
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  Mean CLWP across all opponents' opponents (excluding self). Represents <strong>second-order schedule strength</strong> - measures the broader competitive ecosystem.
                </div>
              </div>

              {/* Plain English */}
              <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                  Simple Explanation
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong>Who did your opponents play?</strong> If your opponents beat lots of good teams (not including you), then your opponents are probably legitimately strong. This is a <strong>"reality check"</strong> on your schedule quality. Did you play actually good teams, or teams who just looked good?
                </div>
              </div>

              {/* Example */}
              <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded">
                <div className="font-bold text-[11px] text-foreground mb-1">Example: Team A's Network</div>
                <div className="text-[10px] text-muted-foreground space-y-1">
                  <div>Team A's opponents and who <em>they</em> played:</div>
                  <div className="pl-2 space-y-0.5 text-[9px]">
                    <div>• B played: D(0.600), E(0.700)</div>
                    <div>• C played: F(0.550), G(0.800)</div>
                  </div>
                  <div className="pt-1 border-t mt-1 font-semibold flex justify-between">
                    <span>OOCLWP =</span>
                    <span className="font-mono">(0.600+0.700+0.550+0.800)/4 = <strong className="text-foreground">0.663</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DIFF */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-orange-500/20">
                <TrendingUp className="h-3.5 w-3.5 text-orange-600" />
              </div>
              DIFF (Point Differential)
            </h2>
            
            <div className="space-y-2">
              {/* Scientific */}
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                  Formula
                </div>
                <div className="font-mono bg-white/50 dark:bg-black/20 p-1.5 rounded text-[10px] space-y-1">
                  <div>d<sub>game</sub> = (S<sub>team</sub> - S<sub>opp</sub>) / (S<sub>team</sub> + S<sub>opp</sub>)</div>
                  <div>DIFF = (1/n) Σ<sub>i=1</sub><sup>n</sup> d<sub>i</sub></div>
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  <strong>Normalized score margin</strong> using ratio of differences. Domain: [-1, 1]. Higher absolute values indicate dominant victories/defeats. Prevents score inflation by normalizing to total points.
                </div>
              </div>

              {/* Plain English */}
              <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                  Simple Explanation
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong>Did you blow teams out, or squeak by?</strong> For each game, calculate <code className="bg-black/10 px-1 rounded">(your score - their score) / total points</code>. A <strong>big win = higher number</strong>, close win = smaller. Average all your games. Positive = you outscore opponents, negative = they outscore you.
                </div>
              </div>

              {/* Example */}
              <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded">
                <div className="font-bold text-[11px] text-foreground mb-1">Example: Team A's Margins</div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between">
                    <span>• Won 80-60 (20pt margin):</span>
                    <span className="font-mono">20/140 = <strong>+0.143</strong></span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Won 90-70 (20pt margin):</span>
                    <span className="font-mono">20/160 = <strong>+0.125</strong></span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Lost 50-70 (20pt margin):</span>
                    <span className="font-mono">-20/120 = <strong>-0.167</strong></span>
                  </div>
                  <div className="pt-1 border-t mt-1 font-semibold flex justify-between">
                    <span>DIFF =</span>
                    <span className="font-mono">(0.143+0.125-0.167)/3 = <strong className="text-foreground">+0.034</strong></span>
                  </div>
                </div>
              </div>

              {/* Range explanation */}
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded">
                <div className="flex items-center justify-between text-[9px]">
                  <div><strong>-1.0</strong>: Lost every point</div>
                  <div><strong>0.0</strong>: Even margins</div>
                  <div><strong>+1.0</strong>: Won every point</div>
                </div>
              </div>
            </div>
          </section>

          {/* Domination Adjustment */}
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-red-500/20">
                <Zap className="h-3.5 w-3.5 text-red-600" />
              </div>
              Domination Penalty
            </h2>
            
            <div className="space-y-2">
              {/* Scientific */}
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                  Piecewise Function
                </div>
                <div className="font-mono bg-white/50 dark:bg-black/20 p-1.5 rounded text-[10px]">
                  RPI<sub>final</sub> = RPI<sub>adj</sub> · θ(W<sub>max</sub>)
                  <br />
                  where θ(w) = {`{ 0.9 if w ≥ 8, 1.0 otherwise }`}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">
                  <strong>Anti-gaming mechanism</strong>. Applies multiplicative penalty (θ=0.9) when maximum consecutive win streak W<sub>max</sub> exceeds threshold (8 games). Prevents rating inflation from selective scheduling.
                </div>
              </div>

              {/* Plain English */}
              <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900">
                <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                  Simple Explanation
                </div>
                <div className="text-[10px] text-muted-foreground leading-relaxed">
                  <strong>Stop the stat padders!</strong> Win 8+ games in a row? We knock <strong>10% off your rating</strong>. Why? Long win streaks might mean you're cherry-picking easy opponents or avoiding tough competition. This keeps ratings honest and rewards teams who play consistently strong schedules.
                </div>
              </div>

              {/* Example */}
              <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded">
                <div className="font-bold text-[11px] text-foreground mb-1">Example: 10-Game Win Streak</div>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div className="flex justify-between"><span>RPI with DIFF:</span> <span className="font-mono">0.850</span></div>
                  <div className="flex justify-between"><span>Streak detected:</span> <span className="font-mono">10 wins ≥ 8 threshold</span></div>
                  <div className="flex justify-between"><span>Penalty applied:</span> <span className="font-mono text-red-600">×0.9</span></div>
                  <div className="pt-1 border-t mt-1 font-semibold flex justify-between">
                    <span>Final RPI =</span>
                    <span className="font-mono">0.850 × 0.9 = <strong className="text-foreground">0.765</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Complete Example */}
          <section className="border-t pt-3">
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <div className="p-0.5 rounded bg-gradient-to-br from-blue-500 to-purple-500">
                <Calculator className="h-3.5 w-3.5 text-white" />
              </div>
              Complete Calculation
            </h2>
            
            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-3 rounded-lg border-2 border-blue-500/30 space-y-2">
              <div className="p-2 bg-background/80 rounded border">
                <div className="font-bold text-[11px] text-foreground mb-1">Given:</div>
                <div className="text-[10px] text-muted-foreground grid grid-cols-2 gap-x-3">
                  <div>• CLWP = 0.689</div>
                  <div>• OCLWP = 0.717</div>
                  <div>• OOCLWP = 0.663</div>
                  <div>• DIFF = 0.034</div>
                </div>
              </div>

              <div className="p-2 bg-background/80 rounded border">
                <div className="font-bold text-[11px] text-foreground mb-1">① Base RPI</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  (0.9×0.689) + (0.1×0.717) + (0.1×0.663) = <span className="font-bold text-foreground">0.758</span>
                </div>
              </div>

              <div className="p-2 bg-background/80 rounded border">
                <div className="font-bold text-[11px] text-foreground mb-1">② Add Differential</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  0.758 + (0.1×0.034) = <span className="font-bold text-foreground">0.761</span>
                </div>
              </div>

              <div className="p-2 bg-background/80 rounded border">
                <div className="font-bold text-[11px] text-foreground mb-1">③ Check Penalty</div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  No streak penalty → <span className="font-bold text-foreground">0.761</span>
                </div>
              </div>

              <div className="p-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 rounded-lg">
                <div className="text-sm font-bold text-foreground text-center">
                  Final RPI = 0.761 (76.1%)
                </div>
              </div>
            </div>
          </section>

          {/* Key Insights */}
          <section className="border-t pt-3">
            <h2 className="text-sm font-bold text-foreground mb-2">Design Rationale</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-muted/30 rounded border">
                <div className="font-bold text-[10px] text-foreground mb-0.5">CLWP: 90%</div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  Own performance is strongest quality indicator
                </p>
              </div>

              <div className="p-2 bg-muted/30 rounded border">
                <div className="font-bold text-[10px] text-foreground mb-0.5">OCLWP: 10%</div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  Schedule strength matters but shouldn't dominate
                </p>
              </div>

              <div className="p-2 bg-muted/30 rounded border">
                <div className="font-bold text-[10px] text-foreground mb-0.5">DIFF: 10%</div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  Margin adds nuance but W/L is primary
                </p>
              </div>

              <div className="p-2 bg-muted/30 rounded border">
                <div className="font-bold text-[10px] text-foreground mb-0.5">Penalty: -10%</div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  Prevents stat padding from 8+ win streaks
                </p>
              </div>
            </div>
          </section>
            </CardContent>
          </ScrollArea>
        </TabsContent>

        {/* Baseball Tab */}
        <TabsContent value="baseball" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <CardContent className="p-4 space-y-4 pb-8">
              <section>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <div className="p-0.5 rounded bg-yellow-500/20">
                    <Trophy className="h-3.5 w-3.5 text-yellow-600" />
                  </div>
                  NCAA Baseball RPI Formula
                </h2>
                
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 rounded-lg border space-y-2 shadow-sm">
                  <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                    Standard NCAA RPI
                  </div>
                  <div className="font-mono text-[11px] space-y-1.5 bg-white/50 dark:bg-black/20 p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">RPI =</span>
                      <span className="text-muted-foreground">(WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)</span>
                    </div>
                  </div>
                  
                  <div className="text-[9px] text-muted-foreground space-y-0.5 pl-2">
                    <div>WP = Winning Percentage (25% weight)</div>
                    <div>OWP = Opponents' Winning Percentage (50% weight)</div>
                    <div>OOWP = Opponents' Opponents' Winning Percentage (25% weight)</div>
                  </div>
                </div>

                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
                  <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                    Plain English
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    Baseball RPI weighs <strong>strength of schedule heavily</strong> (75% combined). Your opponents' records matter more than your own! Road wins get a 1.3× bonus, home wins get 0.7× penalty. This encourages teams to play tough road schedules.
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <div className="p-0.5 rounded bg-green-500/20">
                    <Target className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Baseball-Specific Adjustments
                </h2>

                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                    <div className="text-[10px] font-bold text-foreground mb-1">Home/Road Modifiers</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
                      <div className="flex justify-between items-center">
                        <span>• Road Win:</span>
                        <span className="font-mono text-green-600"><strong>1.3×</strong> value</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Home Win:</span>
                        <span className="font-mono text-orange-600"><strong>0.7×</strong> value</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Neutral Win:</span>
                        <span className="font-mono"><strong>1.0×</strong> value</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded">
                    <div className="font-bold text-[11px] text-foreground mb-1">Example Calculation</div>
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div>Team A: 30-10 record (WP = 0.750)</div>
                      <div>Opponents' combined: 500-400 (OWP = 0.556)</div>
                      <div>Opp's opponents: 8000-7000 (OOWP = 0.533)</div>
                      <div className="pt-1 border-t mt-1 font-semibold flex justify-between">
                        <span>RPI =</span>
                        <span className="font-mono">(0.750×0.25) + (0.556×0.50) + (0.533×0.25) = <strong className="text-foreground">0.599</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="border-t pt-3">
                <h2 className="text-sm font-bold text-foreground mb-2">Key Differences from Basketball</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/30 rounded border">
                    <div className="font-bold text-[10px] text-foreground mb-0.5">Schedule: 75%</div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      Baseball emphasizes who you play over record
                    </p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded border">
                    <div className="font-bold text-[10px] text-foreground mb-0.5">Home/Road</div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      Location matters: road wins worth 1.3× more
                    </p>
                  </div>
                </div>
              </section>
            </CardContent>
          </ScrollArea>
        </TabsContent>

        {/* Soccer Tab */}
        <TabsContent value="soccer" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <CardContent className="p-4 space-y-4 pb-8">
              <section>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <div className="p-0.5 rounded bg-yellow-500/20">
                    <Trophy className="h-3.5 w-3.5 text-yellow-600" />
                  </div>
                  NCAA Soccer RPI Formula
                </h2>
                
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 rounded-lg border space-y-2 shadow-sm">
                  <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                    Standard NCAA RPI
                  </div>
                  <div className="font-mono text-[11px] space-y-1.5 bg-white/50 dark:bg-black/20 p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">RPI =</span>
                      <span className="text-muted-foreground">(WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)</span>
                    </div>
                  </div>
                  
                  <div className="text-[9px] text-muted-foreground space-y-0.5 pl-2">
                    <div>WP = Winning Percentage with tie adjustment (25% weight)</div>
                    <div>OWP = Opponents' Winning Percentage (50% weight)</div>
                    <div>OOWP = Opponents' Opponents' Winning Percentage (25% weight)</div>
                  </div>
                </div>

                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
                  <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                    Plain English
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    Soccer RPI is similar to baseball but handles <strong>ties differently</strong>. A tie counts as 0.5 wins. Also uses the 1.4× road win bonus / 0.6× home win penalty system. Conference games may have additional modifiers.
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <div className="p-0.5 rounded bg-green-500/20">
                    <Target className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Soccer-Specific Features
                </h2>

                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                    <div className="text-[10px] font-bold text-foreground mb-1">Tie Handling</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
                      <div className="font-mono bg-white/50 dark:bg-black/20 p-1.5 rounded">
                        WP = (Wins + 0.5 × Ties) / Total Games
                      </div>
                      <div className="text-[9px]">
                        Ties are worth half a win when calculating winning percentage
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                    <div className="text-[10px] font-bold text-foreground mb-1">Home/Road Modifiers</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
                      <div className="flex justify-between items-center">
                        <span>• Road Win:</span>
                        <span className="font-mono text-green-600"><strong>1.4×</strong> value</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Home Win:</span>
                        <span className="font-mono text-orange-600"><strong>0.6×</strong> value</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Neutral:</span>
                        <span className="font-mono"><strong>1.0×</strong> value</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded">
                    <div className="font-bold text-[11px] text-foreground mb-1">Example Calculation</div>
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div>Team A: 15-3-2 (15W, 3L, 2T)</div>
                      <div>WP = (15 + 0.5×2) / 20 = 0.800</div>
                      <div>OWP = 0.520, OOWP = 0.510</div>
                      <div className="pt-1 border-t mt-1 font-semibold flex justify-between">
                        <span>RPI =</span>
                        <span className="font-mono">(0.800×0.25) + (0.520×0.50) + (0.510×0.25) = <strong className="text-foreground">0.588</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="border-t pt-3">
                <h2 className="text-sm font-bold text-foreground mb-2">Soccer-Specific Notes</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/30 rounded border">
                    <div className="font-bold text-[10px] text-foreground mb-0.5">Ties Count</div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      Unlike basketball, ties = 0.5 wins
                    </p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded border">
                    <div className="font-bold text-[10px] text-foreground mb-0.5">Road Bonus: 1.4×</div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      Highest road win bonus among NCAA sports
                    </p>
                  </div>
                </div>
              </section>
            </CardContent>
          </ScrollArea>
        </TabsContent>

        {/* Volleyball Tab */}
        <TabsContent value="volleyball" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <CardContent className="p-4 space-y-4 pb-8">
              <section>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <div className="p-0.5 rounded bg-yellow-500/20">
                    <Trophy className="h-3.5 w-3.5 text-yellow-600" />
                  </div>
                  NCAA Volleyball RPI Formula
                </h2>
                
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 rounded-lg border space-y-2 shadow-sm">
                  <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[9px]">MATH</span>
                    Standard NCAA RPI
                  </div>
                  <div className="font-mono text-[11px] space-y-1.5 bg-white/50 dark:bg-black/20 p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">RPI =</span>
                      <span className="text-muted-foreground">(WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)</span>
                    </div>
                  </div>
                  
                  <div className="text-[9px] text-muted-foreground space-y-0.5 pl-2">
                    <div>WP = Winning Percentage (25% weight)</div>
                    <div>OWP = Opponents' Winning Percentage (50% weight)</div>
                    <div>OOWP = Opponents' Opponents' Winning Percentage (25% weight)</div>
                  </div>
                </div>

                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-900">
                  <div className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-green-600 text-white rounded text-[9px]">ELI5</span>
                    Plain English
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    Volleyball uses the <strong>standard NCAA RPI formula</strong> with 25-50-25 weighting. Like baseball, road wins get a 1.3× bonus and home wins get 0.7× penalty. The formula emphasizes playing strong opponents.
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <div className="p-0.5 rounded bg-green-500/20">
                    <Target className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Volleyball-Specific Features
                </h2>

                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                    <div className="text-[10px] font-bold text-foreground mb-1">Match Location Modifiers</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1">
                      <div className="flex justify-between items-center">
                        <span>• Road Match Win:</span>
                        <span className="font-mono text-green-600"><strong>1.3×</strong> value</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Home Match Win:</span>
                        <span className="font-mono text-orange-600"><strong>0.7×</strong> value</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>• Neutral Site:</span>
                        <span className="font-mono"><strong>1.0×</strong> value</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded">
                    <div className="text-[10px] font-bold text-foreground mb-1">Set-Based Sport</div>
                    <div className="text-[10px] text-muted-foreground leading-relaxed">
                      While volleyball is played in sets, <strong>RPI only counts match wins/losses</strong>, not individual set scores. A 3-0 sweep counts the same as a 3-2 comeback victory.
                    </div>
                  </div>

                  <div className="p-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded">
                    <div className="font-bold text-[11px] text-foreground mb-1">Example Calculation</div>
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div>Team A: 25-5 record (WP = 0.833)</div>
                      <div>Opponents' combined: 400-350 (OWP = 0.533)</div>
                      <div>Opp's opponents: 7500-7000 (OOWP = 0.517)</div>
                      <div className="pt-1 border-t mt-1 font-semibold flex justify-between">
                        <span>RPI =</span>
                        <span className="font-mono">(0.833×0.25) + (0.533×0.50) + (0.517×0.25) = <strong className="text-foreground">0.604</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="border-t pt-3">
                <h2 className="text-sm font-bold text-foreground mb-2">Volleyball Notes</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/30 rounded border">
                    <div className="font-bold text-[10px] text-foreground mb-0.5">Match-Based</div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      Only match results count, not set scores
                    </p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded border">
                    <div className="font-bold text-[10px] text-foreground mb-0.5">Standard 25-50-25</div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      Uses classic NCAA RPI weighting
                    </p>
                  </div>
                </div>
              </section>
            </CardContent>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  )
}


