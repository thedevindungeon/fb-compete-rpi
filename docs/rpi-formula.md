# RPI Formula Explained

Understanding how Rating Percentage Index (RPI) is calculated.

## What is RPI?

**Rating Percentage Index (RPI)** is a statistical measure used to rank sports teams based on:
1. **Winning percentage** - How often you win
2. **Strength of schedule** - Quality of opponents
3. **Point differential** - Margin of victory/defeat

Originally created by the NCAA for tournament selection, RPI provides a more nuanced ranking than simple win-loss records.

---

## Standard NCAA RPI (25-50-25)

The traditional NCAA formula uses three weighted components:

```
RPI = (0.25 × WP) + (0.50 × OWP) + (0.25 × OOWP)
```

Where:
- **WP** = Team's winning percentage (25%)
- **OWP** = Opponents' winning percentage (50%)
- **OOWP** = Opponents' opponents' winning percentage (25%)

**Key Insight**: Strength of schedule (OWP + OOWP = 75%) matters **3× more** than your own record!

### Why This Formula?

1. **Discourages weak scheduling** - Beating weak teams doesn't help much
2. **Rewards tough games** - Playing strong opponents boosts RPI even in losses
3. **Second-degree strength** - OOWP ensures your opponents also faced quality competition

### Used By

- ⚾ Baseball
- ⚽ Soccer  
- 🏐 Volleyball
- 🏒 Hockey
- 🏓 Pickleball

See: [NCAA Formula Compliance](ncaa-formula-compliance.md)

---

## Our Enhanced Implementation

We extend the NCAA formula with additional factors:

```
Base RPI = (CLWP_COEFF × CLWP) + (OCLWP_COEFF × OCLWP) + (OOCLWP_COEFF × OOCLWP)
RPI + DIFF = Base RPI + (DIFF_COEFF × DIFF)
Final RPI = (RPI + DIFF) × DOMINATION_COEFF
```

---

## Components Explained

### 1. CLWP (Competitive Level Winning Percentage)

Instead of simple winning percentage, we adjust for **competitive level differences**.

**How It Works**:
- Beating **stronger** opponent → Win value increases
- Losing to **stronger** opponent → Loss penalty decreases
- Beating **weaker** opponent → Win value decreases
- Losing to **weaker** opponent → Loss penalty increases

**Formula**:
```
levelDiff = opponent.level - team.level
adjustedWins += (levelDiff × CLGW_STEP)
adjustedLosses += (levelDiff × CLGL_STEP)
CLWP = adjustedWins / (adjustedWins + adjustedLosses)
```

**Example**:
- Team (Level 8) beats Team (Level 10):
  - Level difference: +2
  - Adjusted wins: 1 + (2 × 0.05) = 1.10
- Team (Level 8) loses to Team (Level 6):
  - Level difference: -2
  - Adjusted losses: 1 + (-2 × 0.1) = 1.20 (heavier penalty!)

**Default Steps**:
- `CLGW_STEP = 0.05` (5% per level for wins)
- `CLGL_STEP = 0.10` (10% per level for losses - double penalty!)

---

### 2. OCLWP (Opponent Competitive Level Winning Percentage)

Average CLWP of all opponents faced.

**Formula**:
```
OCLWP = Σ(opponent.CLWP) / numberOfOpponents
```

**What It Measures**: Strength of schedule, but using adjusted winning percentages (not raw W-L).

**Why It Matters**: Facing teams with high CLWP boosts your OCLWP, which increases your RPI even if you lose.

---

### 3. OOCLWP (Opponent's Opponent CLWP)

Average CLWP of all opponents that your opponents faced (excluding yourself).

**Formula**:
```
For each opponent:
  OOCLWP_contribution = Σ(opponent's opponent CLWP) / count
  (exclude yourself from opponent's opponents)
OOCLWP = average of all contributions
```

**What It Measures**: Second-degree schedule strength - ensures your opponents also played quality teams.

**Why It Matters**: Prevents "one strong opponent" from inflating your RPI. Your opponents must have tough schedules too.

---

### 4. DIFF (Points Differential)

Normalized score margin across all games.

**Formula**:
```
For each game:
  gameDIFF = (teamScore - oppScore) / (teamScore + oppScore)
DIFF = Σ(gameDIFF) / numberOfGames
```

**Range**: -1.0 (extreme losses) to +1.0 (extreme wins)

**Examples**:
- Win 100-50: (100-50)/(100+50) = +0.33
- Win 70-65: (70-65)/(70+65) = +0.04
- Lose 50-60: (50-60)/(50+60) = -0.09

**Coefficient**: Varies by sport (0.02 to 0.15)
- **Football**: 0.15 (highest - point spread matters)
- **Basketball**: 0.10
- **Baseball**: 0.05
- **Volleyball**: 0.03
- **Pickleball**: 0.02 (lowest - game-based)

**Why It Matters**: Winning by large margins indicates dominance. Losing close games shows competitiveness.

---

### 5. Domination Penalty

Applied when a team has **8+ consecutive wins**.

**Formula**:
```
if (consecutiveWins >= 8) {
  Final RPI = RPI × DOMINATION_COEFF
}
```

**Default**: `DOMINATION_COEFF = 0.9` (10% penalty)

**Why?** Prevents teams from gaming the system by:
- Scheduling weak opponents for long win streaks
- Avoiding tough competition
- Inflating RPI artificially

**Sports Using This**:
- 🏀 Basketball (0.9)
- 🏈 Football (0.9)
- ⚾ Baseball (0.92 - mild penalty)
- ⚽ Soccer (0.88 - defensive streaks)

**Sports NOT Using This**:
- 🏐 Volleyball (1.0 - no penalty)
- 🏓 Pickleball (1.0 - no penalty)

The NCAA 25-50-25 formula already heavily penalizes weak schedules, so domination penalty is unnecessary for those sports.

---

## Coefficient Defaults

### Generic (No Sport Specified)

```javascript
{
  clwpCoeff: 0.9,
  oclwpCoeff: 0.1,
  ooclwpCoeff: 0.1,
  diffCoeff: 0.1,
  dominationCoeff: 0.9,
  clgwStep: 0.05,
  clglStep: 0.1,
  minGames: 3,
  diffInterval: 15
}
```

### Sport-Specific Examples

**Baseball (NCAA 25-50-25)**:
```javascript
{
  clwpCoeff: 0.25,
  oclwpCoeff: 0.50,  // Schedule matters most!
  ooclwpCoeff: 0.25,
  diffCoeff: 0.05,   // Runs less indicative
  dominationCoeff: 0.92,
  minGames: 5
}
```

**Basketball (Custom 90-10-10)**:
```javascript
{
  clwpCoeff: 0.90,   // Your record matters most
  oclwpCoeff: 0.10,
  ooclwpCoeff: 0.10,
  diffCoeff: 0.10,
  dominationCoeff: 0.9,
  minGames: 4
}
```

**Football (Hybrid 35-40-25)**:
```javascript
{
  clwpCoeff: 0.35,
  oclwpCoeff: 0.40,
  ooclwpCoeff: 0.25,
  diffCoeff: 0.15,   // HIGHEST - point spread crucial!
  dominationCoeff: 0.9,
  minGames: 3        // Shorter seasons
}
```

See: [Sport-Specific RPI](sport-specific-rpi.md)

---

## Calculation Flow

### Step-by-Step Process

```
1. Calculate CLWP for each team
   ↓
2. Calculate OCLWP (avg opponent CLWP)
   ↓
3. Calculate OOCLWP (avg opponent's opponent CLWP)
   ↓
4. Calculate DIFF (normalized point differential)
   ↓
5. Compute Base RPI
   Base = (CLWP_COEFF × CLWP) + (OCLWP_COEFF × OCLWP) + (OOCLWP_COEFF × OOCLWP)
   ↓
6. Apply DIFF adjustment
   RPI_adj = Base + (DIFF_COEFF × DIFF)
   ↓
7. Apply Domination penalty (if 8+ consecutive wins)
   Final RPI = RPI_adj × DOMINATION_COEFF
   ↓
8. Sort teams by Final RPI (descending)
```

---

## Example Calculation

### Team: Panthers Elite

**Record**: 5-1 (5 wins, 1 loss)  
**Games**: 6 total  
**Competitive Level**: 8  

#### Step 1: Calculate CLWP

| Opponent | Level | Result | Level Diff | Adjustment |
|----------|-------|--------|------------|------------|
| Team A   | 9     | Win    | +1         | 1 + (1×0.05) = 1.05 |
| Team B   | 7     | Win    | -1         | 1 - (1×0.05) = 0.95 |
| Team C   | 10    | Loss   | +2         | 1 - (2×0.1) = 0.80 |
| Team D   | 8     | Win    | 0          | 1.00 |
| Team E   | 9     | Win    | +1         | 1.05 |
| Team F   | 6     | Win    | -2         | 0.90 |

**Adjusted Wins**: 1.05 + 0.95 + 1.00 + 1.05 + 0.90 = 4.95  
**Adjusted Losses**: 0.80  
**CLWP**: 4.95 / (4.95 + 0.80) = 0.861

#### Step 2: Calculate OCLWP

Assume opponents have these CLWPs:
- Team A: 0.75
- Team B: 0.65
- Team C: 0.80
- Team D: 0.70
- Team E: 0.78
- Team F: 0.60

**OCLWP**: (0.75 + 0.65 + 0.80 + 0.70 + 0.78 + 0.60) / 6 = 0.713

#### Step 3: Calculate OOCLWP

(Simplified - assume average): 0.680

#### Step 4: Calculate DIFF

| Game | Score  | DIFF Calculation        | Result |
|------|--------|-------------------------|--------|
| 1    | 85-78  | (85-78)/(85+78)        | +0.043 |
| 2    | 92-81  | (92-81)/(92+81)        | +0.064 |
| 3    | 75-88  | (75-88)/(75+88)        | -0.080 |
| 4    | 88-82  | (88-82)/(88+82)        | +0.035 |
| 5    | 90-79  | (90-79)/(90+79)        | +0.065 |
| 6    | 95-70  | (95-70)/(95+70)        | +0.152 |

**DIFF**: (0.043 + 0.064 - 0.080 + 0.035 + 0.065 + 0.152) / 6 = +0.047

#### Step 5: Base RPI (Using Basketball 90-10-10)

```
Base = (0.90 × 0.861) + (0.10 × 0.713) + (0.10 × 0.680)
     = 0.775 + 0.071 + 0.068
     = 0.914
```

#### Step 6: Apply DIFF

```
RPI_adj = 0.914 + (0.10 × 0.047)
        = 0.914 + 0.005
        = 0.919
```

#### Step 7: Domination Penalty

Assume 3 consecutive wins (not 8+), so no penalty.

**Final RPI**: 0.919

---

## Interpreting RPI Values

### Typical Ranges

- **0.900+**: Elite teams, very strong record and schedule
- **0.800-0.899**: Strong teams, good record and/or tough schedule
- **0.700-0.799**: Above average teams
- **0.600-0.699**: Average teams
- **0.500-0.599**: Below average teams
- **<0.500**: Weak teams, poor record and/or weak schedule

### What Makes RPI Go Up?

1. **Win games** (especially against tough opponents)
2. **Play strong opponents** (even losses can help if opponent is elite)
3. **Win by large margins** (DIFF boost)
4. **Your opponents win their games** (boosts OWP)

### What Makes RPI Go Down?

1. **Lose games** (especially to weak opponents)
2. **Play weak opponents** (low OWP)
3. **Lose by large margins** (negative DIFF)
4. **Long win streaks against weak competition** (domination penalty)

---

## Advantages Over Simple Win %

| Metric | Win % | RPI |
|--------|-------|-----|
| **Accounts for opponent quality** | ❌ | ✅ |
| **Penalizes weak schedules** | ❌ | ✅ |
| **Rewards close losses to strong teams** | ❌ | ✅ |
| **Considers margin of victory** | ❌ | ✅ (with DIFF) |
| **Prevents schedule gaming** | ❌ | ✅ (with domination) |
| **Simple to understand** | ✅ | ❌ |

---

## Common Misconceptions

### "Losing always hurts your RPI"

**FALSE**. A close loss to a top-ranked team can actually improve your RPI by:
- Boosting your OCLWP (you played a strong opponent)
- Minimal DIFF penalty (close game)
- Competitive level adjustment (expected to lose)

### "Domination penalty hurts good teams"

**FALSE**. The penalty only applies to **8+ consecutive wins**, which:
- Is rare for truly competitive schedules
- Indicates possible weak scheduling
- Only reduces RPI by 10%, not drastically

Good teams playing tough schedules rarely get 8-win streaks.

### "More games = better RPI"

**NOT ALWAYS**. More games only help if:
- You win them (obviously)
- Opponents are quality (boosts OWP)
- You win decisively (DIFF boost)

Playing many weak opponents can actually hurt your RPI.

---

## Customizing the Formula

### When to Adjust Coefficients

**Increase CLWP weight** if:
- Your own record should matter more
- Schedule strength is less reliable
- All teams play similar schedules

**Increase OCLWP weight** if:
- Schedule strength should dominate
- Wide variation in opponent quality
- Want NCAA-compliant formula

**Increase DIFF weight** if:
- Margin of victory is important
- Sport has high-scoring games (football, basketball)
- Want to reward dominant performances

**Decrease DIFF weight** if:
- Wins/losses matter more than margins
- Low-scoring sport (soccer, hockey)
- Set/game-based scoring (volleyball, pickleball)

### Testing Different Formulas

1. Generate dataset (same teams/games)
2. Save calculation with formula A
3. Adjust coefficients to formula B
4. Save calculation with formula B
5. Compare results

See: [RPI Historical Calculations](rpi-historical-calculations.md)

---

## Further Reading

- [NCAA Baseball RPI](https://www.ncaa.com/news/baseball/article/2019-05-30/college-baseball-rpi-explained)
- [NCAA Soccer RPI](https://www.ncaa.com/rankings/soccer-men/d1/ncaa-mens-soccer-rpi)
- [Sport-Specific RPI](sport-specific-rpi.md)
- [NCAA Formula Compliance](ncaa-formula-compliance.md)

