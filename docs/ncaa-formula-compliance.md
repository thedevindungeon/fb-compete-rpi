# NCAA RPI Formula Compliance

## Overview

The RPI Calculator now implements **NCAA-compliant formulas** for applicable sports, based on official NCAA RPI calculations used for tournament selection.

## Formula Summary by Sport

### NCAA Standard Formula (25-50-25)

Used by: **Baseball, Soccer, Volleyball, Hockey, Pickleball**

```
RPI = (WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)
```

Where:
- **WP** = Winning Percentage (25% weight)
- **OWP** = Opponents' Winning Percentage (50% weight)
- **OOWP** = Opponents' Opponents' Winning Percentage (25% weight)

**Key Insight**: Strength of schedule matters more than your own record (75% vs 25%)!

### Custom Basketball Formula (90-10-10)

Used by: **Basketball**

```
RPI = (CLWP × 0.90) + (OCLWP × 0.10) + (OOCLWP × 0.10) + adjustments
```

Where:
- **CLWP** = Cumulative Level-Adjusted Winning Percentage (90% weight)
- **OCLWP** = Opponents' CLWP (10% weight)
- **OOCLWP** = Opponents' Opponents' CLWP (10% weight)
- **Adjustments** = Point differential + domination penalty

**Key Insight**: Your record matters most, with adjustments for margin of victory and avoiding win streaks that could indicate gaming the system.

### Hybrid Football Formula (35-40-25)

Used by: **Football**

```
RPI = (WP × 0.35) + (OWP × 0.40) + (OOWP × 0.25) + (DIFF × 0.15)
```

**Key Insight**: Balanced approach with strong emphasis on point differential (15%) due to the importance of margin in football.

### Hybrid Lacrosse Formula (30-45-25)

Used by: **Lacrosse**

```
RPI = (WP × 0.30) + (OWP × 0.45) + (OOWP × 0.25) + (DIFF × 0.10)
```

**Key Insight**: Slightly more emphasis on your record than NCAA standard, but still heavily weighted toward schedule strength.

---

## Detailed Sport Configurations

### ⚾ Baseball (NCAA Standard 25-50-25)

**Formula**: `RPI = (WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)`

**Official NCAA Implementation**:
- 25% your winning percentage
- 50% opponents' winning percentage
- 25% opponents' opponents' winning percentage
- Road wins: 1.3× multiplier
- Home wins: 0.7× multiplier
- Neutral site: 1.0× multiplier

**Our Implementation**:
```javascript
{
  clwpCoeff: 0.25,    // WP weight
  oclwpCoeff: 0.50,   // OWP weight (highest!)
  ooclwpCoeff: 0.25,  // OOWP weight
  diffCoeff: 0.05,    // Low impact (runs less indicative)
  dominationCoeff: 1.0, // No penalty
  minGames: 5
}
```

**Why**: Baseball teams are evaluated heavily on strength of schedule. Playing tough opponents matters more than winning percentage.

---

### ⚽ Soccer (NCAA Standard 25-50-25)

**Formula**: `RPI = (WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)`

**Official NCAA Implementation**:
- Same as baseball: 25-50-25 split
- **Tie handling**: Ties count as 0.5 wins
- Road bonus: 1.4× multiplier
- Home penalty: 0.6× multiplier
- Conference games may have additional modifiers

**Our Implementation**:
```javascript
{
  clwpCoeff: 0.25,
  oclwpCoeff: 0.50,
  ooclwpCoeff: 0.25,
  diffCoeff: 0.08,    // Moderate (goals matter)
  dominationCoeff: 1.0,
  minGames: 4
}
```

**Why**: Similar to baseball, but with tie handling and slightly higher differential impact for goals.

---

### 🏐 Volleyball (NCAA Standard 25-50-25)

**Formula**: `RPI = (WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)`

**Official NCAA Implementation**:
- Standard NCAA formula
- Road wins: 1.3× multiplier
- Home wins: 0.7× multiplier
- Set-based scoring (match results, not set scores)

**Our Implementation**:
```javascript
{
  clwpCoeff: 0.25,
  oclwpCoeff: 0.50,
  ooclwpCoeff: 0.25,
  diffCoeff: 0.03,    // Very low (set-based)
  dominationCoeff: 1.0,
  minGames: 5,
  tableColumns: {
    showDiff: true,
    showDomination: false  // Not relevant for volleyball
  }
}
```

**Why**: Match wins matter, not point differentials within sets.

---

### 🏒 Hockey (Similar to NCAA Standard)

**Formula**: `RPI = (WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)`

**Implementation**:
```javascript
{
  clwpCoeff: 0.25,
  oclwpCoeff: 0.50,
  ooclwpCoeff: 0.25,
  diffCoeff: 0.08,    // Moderate (goals matter, ties possible)
  dominationCoeff: 1.0,
  minGames: 4
}
```

**Why**: Similar to soccer with tie handling.

---

### 🏓 Pickleball (Similar to Volleyball)

**Formula**: `RPI = (WP × 0.25) + (OWP × 0.50) + (OOWP × 0.25)`

**Implementation**:
```javascript
{
  clwpCoeff: 0.25,
  oclwpCoeff: 0.50,
  ooclwpCoeff: 0.25,
  diffCoeff: 0.02,    // Lowest (game-based scoring)
  dominationCoeff: 1.0,
  minGames: 6,
  tableColumns: {
    showDiff: true,
    showDomination: false
  }
}
```

**Why**: Game-based like volleyball, more matches needed for statistical significance.

---

### 🏀 Basketball (Custom 90-10-10)

**Formula**: 
```
RPI_base = (CLWP × 0.90) + (OCLWP × 0.10) + (OOCLWP × 0.10)
RPI_adj = RPI_base + (DIFF × 0.10)
RPI_final = RPI_adj × dominationPenalty
```

**Implementation**:
```javascript
{
  clwpCoeff: 0.90,    // Your record is king
  oclwpCoeff: 0.10,
  ooclwpCoeff: 0.10,
  diffCoeff: 0.10,    // Moderate point differential impact
  dominationCoeff: 0.9, // 10% penalty for 8+ win streaks
  minGames: 4
}
```

**Why**: Custom formula that emphasizes win-loss record while still accounting for strength of schedule. Point differential matters in basketball. Domination penalty prevents system gaming.

---

### 🏈 Football (Hybrid 35-40-25)

**Formula**: 
```
RPI = (WP × 0.35) + (OWP × 0.40) + (OOWP × 0.25) + (DIFF × 0.15)
```

**Implementation**:
```javascript
{
  clwpCoeff: 0.35,    // Higher than NCAA standard
  oclwpCoeff: 0.40,   // Lower than NCAA standard
  ooclwpCoeff: 0.25,
  diffCoeff: 0.15,    // HIGHEST - point differential very important!
  dominationCoeff: 0.9,
  minGames: 3,        // Fewer games in season
  diffInterval: 14    // Touchdown + PAT
}
```

**Why**: Point differential is crucial in football. Winning by 3 TDs vs 1 TD matters. Shorter seasons require lower minimum games.

---

### 🥍 Lacrosse (Hybrid 30-45-25)

**Formula**: 
```
RPI = (WP × 0.30) + (OWP × 0.45) + (OOWP × 0.25) + (DIFF × 0.10)
```

**Implementation**:
```javascript
{
  clwpCoeff: 0.30,    // Balanced
  oclwpCoeff: 0.45,   // Strong schedule emphasis
  ooclwpCoeff: 0.25,
  diffCoeff: 0.10,    // Moderate goal differential
  dominationCoeff: 1.0,
  minGames: 4
}
```

**Why**: Balanced approach between custom and NCAA standard, with moderate goal differential impact.

---

## Coefficient Sum Rules

### NCAA Standard Sports (Baseball, Soccer, Volleyball, Hockey, Pickleball)
```
clwpCoeff + oclwpCoeff + ooclwpCoeff = 0.25 + 0.50 + 0.25 = 1.00
```
The three coefficients sum to exactly 1.0, representing the full RPI before adjustments.

### Custom/Hybrid Sports (Basketball, Football, Lacrosse)
```
Basketball: 0.90 + 0.10 + 0.10 = 1.10 (allows for adjustments)
Football:   0.35 + 0.40 + 0.25 = 1.00
Lacrosse:   0.30 + 0.45 + 0.25 = 1.00
```

For custom formulas, the sum may exceed 1.0 to allow room for differential and domination adjustments.

---

## Point Differential Impact by Sport

Ranked from highest to lowest:

1. **Football**: 0.15 (highest - point spread matters most)
2. **Basketball**: 0.10 (moderate - margin of victory significant)
3. **Lacrosse**: 0.10 (moderate - goals significant)
4. **Soccer**: 0.08 (moderate - goals matter but lower scoring)
5. **Hockey**: 0.08 (moderate - goals matter, ties possible)
6. **Baseball**: 0.05 (low - runs less indicative of dominance)
7. **Volleyball**: 0.03 (very low - set-based, not point-based)
8. **Pickleball**: 0.02 (lowest - game-based, not point-based)

---

## Domination Penalty

Only applied to **Basketball** and **Football**:

```javascript
if (consecutiveWins >= 8) {
  RPI_final = RPI_adjusted × 0.9  // 10% penalty
}
```

**Purpose**: Prevent teams from gaming the system by scheduling easy opponents for long win streaks.

**Not Applied To**: NCAA standard sports (Baseball, Soccer, Volleyball, etc.) where the 25-50-25 formula already heavily emphasizes schedule strength.

---

## Home/Road Adjustments

While the formulas show home/road multipliers in the documentation, our current implementation does not include location-based adjustments. This could be added in a future enhancement by:

1. Adding `isHome`, `isAway`, `isNeutral` to `GameData`
2. Applying multipliers to wins:
   - Road wins: × 1.3 (Baseball, Volleyball) or × 1.4 (Soccer)
   - Home wins: × 0.7 (Baseball, Volleyball) or × 0.6 (Soccer)
   - Neutral: × 1.0

---

## References

- [NCAA Baseball RPI Explanation](https://www.ncaa.com/news/baseball/article/2019-05-30/college-baseball-rpi-explained)
- [NCAA Soccer RPI Methodology](https://www.ncaa.com/rankings/soccer-men/d1/ncaa-mens-soccer-rpi)
- [NCAA Volleyball RPI](https://www.ncaa.com/rankings/volleyball-women/d1/ncaa-womens-volleyball-rpi)

---

## Testing

All formulas are validated in `tests/sport-config.test.ts`:

✅ Coefficient sums within valid ranges  
✅ Sport-specific differential impacts  
✅ Correct table column visibility  
✅ Domination penalties applied correctly  
✅ Minimum games requirements per sport  

Run tests: `bun test tests/sport-config.test.ts`

