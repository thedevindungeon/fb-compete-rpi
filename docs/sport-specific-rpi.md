# Sport-Specific RPI Configuration

This document explains the sport-specific RPI calculation features implemented in the RPI Calculator.

## Overview

The RPI Calculator now supports sport-specific configurations that adjust:
- Default RPI coefficients optimized for each sport
- Table column visibility (e.g., showing/hiding DIFF or Domination columns)
- Scoring terminology (points, runs, goals, etc.)
- Visual indicators with sport icons

## Supported Sports

| Sport ID | Name | Icon | Key Differences |
|----------|------|------|-----------------|
| 1 | Baseball | ⚾ | Lower DIFF impact (runs less indicative), requires more games (min 5) |
| 2 | Soccer | ⚽ | Moderate DIFF impact, higher domination penalty for defensive strategy |
| 3 | Football | 🏈 | Higher DIFF impact (point differential important), fewer min games (3) |
| 4 | Volleyball | 🏐 | Lower DIFF impact (set-based), minimal domination penalty, hides domination column |
| 5 | Basketball | 🏀 | Moderate DIFF impact, standard domination penalty |
| 6 | Hockey | 🏒 | Standard coefficients, penalty for defensive streaks |
| 7 | Lacrosse | 🥍 | Similar to soccer with moderate goal differential impact |
| 8 | Pickleball | 🏓 | Lower DIFF impact, more games required (6), hides domination column |

## Coefficient Variations by Sport

### Baseball
- **CLWP Weight**: 0.9 (high emphasis on opponent strength)
- **DIFF Coefficient**: 0.08 (low - run differential less indicative)
- **Domination Coefficient**: 0.92 (slight penalty)
- **Min Games**: 5
- **DIFF Interval**: 5 runs

### Football
- **CLWP Weight**: 0.85 (balanced)
- **OCLWP Weight**: 0.15 (higher than most)
- **DIFF Coefficient**: 0.15 (highest - point differential very important)
- **Min Games**: 3 (fewer games in season)
- **DIFF Interval**: 14 points (touchdown + PAT)

### Volleyball
- **CLWP Weight**: 0.92 (very high)
- **DIFF Coefficient**: 0.06 (lowest - set-based scoring)
- **Domination Coefficient**: 0.95 (minimal penalty)
- **Table**: Hides domination column
- **DIFF Interval**: 5 points per set

### Soccer/Hockey
- **Domination Coefficient**: 0.88 (higher penalty - defense matters)
- **DIFF Coefficient**: 0.10-0.12 (moderate - goals are significant)
- **DIFF Interval**: 2-3 goals

## UI Features

### 1. Sport Badge in Header
When viewing Supabase data, the page header displays the sport icon and name next to "RPI Calculator".

### 2. Sport Icons in Event Selection
When browsing events in the Supabase connection panel, each event shows its associated sport icon.

### 3. Dynamic Table Columns
The rankings table automatically adjusts based on sport:
- **Volleyball & Pickleball**: Hide domination-related columns (less relevant for these sports)
- **All others**: Show full breakdown including DIFF and domination metrics

### 4. Auto-Reset to Sport Defaults
When you click "Reset to Defaults" in the RPI Coefficients Panel, it resets to the sport-specific defaults (if a sport is detected), not the generic defaults.

### 5. Coefficient Override
Users can still manually override coefficients. The system uses:
1. User-overridden coefficients (if set)
2. Sport-specific defaults (if sport detected from Supabase)
3. Generic defaults (for sample data or unknown sports)

## Implementation Files

- **`lib/sport-config.ts`**: Core sport configuration definitions
- **`hooks/use-rpi-data.ts`**: Exposes `sportConfig` based on current `sportId`
- **`components/page-header.tsx`**: Displays sport badge
- **`components/rpi-coefficients-panel.tsx`**: Uses sport-specific defaults
- **`components/team-results-table.tsx`**: Conditionally shows/hides columns
- **`components/supabase-connection-panel.tsx`**: Shows sport icons in event list
- **`app/page.tsx`**: Orchestrates sport-aware RPI calculation

## Adding New Sports

To add a new sport:

1. Add the sport to the database `fb_compete.sports` table
2. Add configuration to `SPORT_CONFIGS` in `lib/sport-config.ts`:
   ```typescript
   9: {
     id: 9,
     name: 'new_sport',
     displayName: 'New Sport',
     icon: '🎾',
     defaultCoefficients: { /* ... */ },
     scoringTerminology: {
       points: 'points',
       score: 'score',
     },
     tableColumns: {
       showDiff: true,
       showDomination: true,
     },
   }
   ```
3. The UI will automatically recognize and use the new sport configuration

## Future Enhancements

- [ ] Use `scoringTerminology` in UI labels (e.g., "Goals Differential" for soccer)
- [ ] Add sport-specific tooltips explaining coefficient rationale
- [ ] Historical sport performance analysis
- [ ] Sport-specific domination bonus calculations
- [ ] Comparative RPI across sports (normalization)

