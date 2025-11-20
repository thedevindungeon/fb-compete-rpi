# Generate Dataset - Sport Selection Feature

## Overview

Added sport selection to the "Generate Dataset" feature in the Sample Data Panel, allowing users to generate synthetic datasets with sport-specific RPI calculations.

## Changes Made

### 1. Updated `components/sample-data-panel.tsx`

**New Features**:
- Added sport selector dropdown with all 8 sports
- Shows sport icon + name for each option
- Defaults to Basketball (ID: 5)
- Passes selected sport ID to the data loading callback

**UI Layout**:
```
Generate Dataset
├── Teams: [100]          Games/Team: [50]
├── Sport: [🏀 Basketball ▼]  ← NEW!
└── Advanced Options
    ├── Use Pools/Groups
    ├── Round-Robin Style
    ├── Include Ties
    └── Completion Rate: 85%
```

**Code Changes**:
- Imported `Select` components and `SPORT_CONFIGS`
- Added `selectedSport` state (default: '5' for Basketball)
- Added sport selector UI between Teams/Games and Advanced Options
- Updated `onLoadSampleData` callback to pass `sportId`

### 2. Updated `hooks/use-rpi-data.ts`

**Changes**:
- Modified `handleLoadSampleData` to accept optional `sportId` parameter
- When `sportId` is provided, it's stored in `supabaseSportId` state
- This allows generated datasets to use sport-specific RPI coefficients

**Key Logic**:
```typescript
handleLoadSampleData(sampleTeams: TeamData[], sportId?: number) {
  // ... load teams ...
  setSupabaseSportId(sportId || null) // Store sport if provided
}
```

## How It Works

### User Flow

1. **Open "Generate Dataset"** in Sample Data Panel
2. **Select Sport** from dropdown:
   - ⚾ Baseball
   - ⚽ Soccer
   - 🏈 Football
   - 🏐 Volleyball
   - 🏀 Basketball (default)
   - 🏒 Hockey
   - 🥍 Lacrosse
   - 🏓 Pickleball
3. **Configure dataset** (teams, games, options)
4. **Click "Generate"**
5. **Sport badge appears** in Coefficients Panel and Page Header
6. **Sport-specific RPI coefficients** are automatically applied

### Example: Generate Baseball Dataset

1. Select "⚾ Baseball" from dropdown
2. Set Teams: 50, Games/Team: 30
3. Click "Generate (1500 games)"
4. Result:
   - Header shows: `🧮 RPI Calculator [⚾ Baseball]`
   - Coefficients Panel shows: `Coefficients [⚾ Baseball]`
   - RPI calculated with NCAA 25-50-25 formula for baseball
   - Lower DIFF coefficient (0.05) applied
   - Schedule strength emphasized (50% OWP weight)

### Example: Generate Volleyball Dataset

1. Select "🏐 Volleyball" from dropdown
2. Set Teams: 100, Games/Team: 40
3. Click "Generate (4000 games)"
4. Result:
   - Header shows: `🧮 RPI Calculator [🏐 Volleyball]`
   - Coefficients Panel shows: `Coefficients [🏐 Volleyball]`
   - RPI calculated with NCAA 25-50-25 formula
   - Very low DIFF coefficient (0.03) - set-based scoring
   - DIFF column hidden in table (less relevant)

## Benefits

### 1. Realistic Testing
- Test sport-specific RPI calculations without needing real data
- Validate NCAA formulas for each sport
- Compare coefficient impacts across sports

### 2. Demo & Training
- Show clients how RPI works for their specific sport
- Demonstrate formula differences (e.g., Baseball vs Basketball)
- Generate sample data for presentations

### 3. Development
- Test UI with different sports without connecting to Supabase
- Validate table column visibility rules
- Test sport-specific coefficient defaults

### 4. User Experience
- Users can explore how RPI works for their sport
- No need to set up Supabase connection for initial exploration
- Immediate feedback on sport-specific calculations

## Technical Details

### State Flow

```
User selects sport (e.g., Soccer, ID: 2)
  ↓
Generate button clicked
  ↓
generateLargeDataset() creates teams
  ↓
onLoadSampleData(teams, 2) called
  ↓
handleLoadSampleData(teams, 2)
  ↓
setSupabaseSportId(2)
  ↓
sportConfig = getSportConfig(2) // Returns Soccer config
  ↓
UI updates with Soccer badge and coefficients
  ↓
RPI calculation uses Soccer NCAA 25-50-25 formula
```

### Sport Persistence

The selected sport persists for the generated dataset:
- Sport badge shows in header and coefficients panel
- Sport-specific coefficients applied
- Sport-specific table columns shown/hidden
- Remains active until reset or new data loaded

### Clearing Sport

Sport selection is cleared when:
- User clicks "Reset"
- User loads different sample data (default 10 teams)
- User uploads JSON file
- User loads Supabase data (replaces with Supabase sport)

## UI Screenshots (Conceptual)

### Before Generation
```
┌─────────────────────────────────────────┐
│ Generate Dataset                    ▼   │
├─────────────────────────────────────────┤
│ Teams: [100]    Games/Team: [50]        │
│ Sport: [🏀 Basketball ▼]                │
│ ─────────────────────────────────────   │
│ Advanced Options                        │
│   □ Use Pools/Groups                    │
│   □ Round-Robin Style                   │
│ [Generate (5000 games)]                 │
└─────────────────────────────────────────┘
```

### After Generation (Baseball Selected)
```
┌─────────────────────────────────────────┐
│ 🧮 RPI Calculator  [⚾ Baseball]        │
└─────────────────────────────────────────┘

Coefficients Panel:
┌─────────────────────────────────────────┐
│ ⚙️ Coefficients  [⚾ Baseball]    [↻]   │
├─────────────────────────────────────────┤
│ CLWP: 0.25  ← NCAA Standard              │
│ OCLWP: 0.50 ← Schedule matters most!     │
│ OOCLWP: 0.25                             │
│ DIFF: 0.05  ← Lower for baseball         │
└─────────────────────────────────────────┘
```

## Future Enhancements

Potential improvements:
- [ ] Remember last selected sport in localStorage
- [ ] Add "Quick Generate" buttons for each sport
- [ ] Show sport-specific game score ranges in generation
- [ ] Add sport-specific team name generation
- [ ] Generate sport-appropriate competitive levels

## Testing

To test the feature:
1. Start dev server: `bun run dev`
2. Open Sample Data Panel
3. Click "Generate Dataset" to expand
4. Change sport dropdown and observe:
   - Sport icon + name displayed
   - Generate button updates
5. Click "Generate"
6. Verify sport badge appears in:
   - Page header (next to "RPI Calculator")
   - Coefficients panel header
7. Verify coefficients match sport-specific defaults
8. Verify RPI calculations use correct formula

## Notes

- **Default Sport**: Basketball (ID: 5) is the default to match the original custom 90-10-10 formula
- **Backward Compatible**: Existing "Load Sample" button still works and clears sport (shows "Unknown Sport" config)
- **Performance**: Sport selection doesn't impact generation speed
- **Data Format**: Generated data structure unchanged, only RPI calculation differs

