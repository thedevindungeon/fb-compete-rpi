# Historical RPI Calculations

## Overview

The RPI calculation history system provides **compact, professional storage** of RPI rankings over time, enabling trend analysis and historical comparisons.

## Database Schema

### Design Principles

✅ **Compact**: Minimal data types (SMALLINT for ranks, DECIMAL(6,4) for scores)  
✅ **Professional**: Foreign keys, indexes, audit trails  
✅ **Historical**: Track all calculations with coefficients used  
✅ **Efficient**: Composite primary keys, batch inserts, auto-cleanup  

### Tables

#### 1. `rpi_calculation_runs` - Calculation Metadata

Stores metadata about each RPI calculation run.

```sql
CREATE TABLE fb_compete.rpi_calculation_runs (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  sport_id INTEGER NOT NULL,
  
  -- When & What
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  data_as_of TIMESTAMPTZ,
  
  -- Coefficients used (for historical accuracy)
  clwp_coeff DECIMAL(4,3),
  oclwp_coeff DECIMAL(4,3),
  ooclwp_coeff DECIMAL(4,3),
  diff_coeff DECIMAL(4,3),
  domination_coeff DECIMAL(4,3),
  
  -- Statistics
  total_teams INTEGER,
  total_matches INTEGER,
  matches_with_scores INTEGER,
  calculation_duration_ms INTEGER,
  
  -- Context
  calculation_type VARCHAR(20), -- 'manual', 'auto', 'scheduled'
  notes TEXT
);
```

**Indexes**:
- `idx_rpi_runs_event_id` - Find all runs for an event
- `idx_rpi_runs_calculated_at` - Latest calculations
- `idx_rpi_runs_event_date` - Event + date composite

#### 2. `rpi_results` - Compact Rankings Storage

Stores actual team rankings. **Ultra-compact** design:

```sql
CREATE TABLE fb_compete.rpi_results (
  run_id BIGINT,
  team_id BIGINT,
  
  -- Core RPI
  rank SMALLINT,              -- 1-999 (2 bytes)
  rpi DECIMAL(6,4),           -- 0.0000-9.9999 (compact)
  
  -- Components
  wp DECIMAL(5,4),            -- 0.0000-1.0000
  owp DECIMAL(5,4),
  oowp DECIMAL(5,4),
  
  -- Record
  wins SMALLINT,              -- 0-999 (2 bytes)
  losses SMALLINT,
  ties SMALLINT DEFAULT 0,
  
  -- Optional metrics
  point_diff INTEGER,
  domination_penalty DECIMAL(4,3),
  
  PRIMARY KEY (run_id, team_id) -- No separate ID = space efficient
);
```

**Space Efficiency**:
- No separate `id` column (composite PK)
- SMALLINT for counts (2 bytes vs 4/8)
- Precise DECIMAL sizing
- NULL for optional fields

**Indexes**:
- `idx_rpi_results_rank` - Rankings by run
- `idx_rpi_results_team` - Team history
- `idx_rpi_results_rpi` - Sort by RPI score

### Views

#### `v_latest_rpi_by_event`

Shows the most recent RPI calculation for each event.

```sql
SELECT * FROM fb_compete.v_latest_rpi_by_event
WHERE event_id = 31
ORDER BY rank;
```

Returns: Latest rankings with team names, sport info, all metrics.

#### `v_rpi_history`

Complete history with trend analysis (includes previous rank/RPI).

```sql
SELECT * FROM fb_compete.v_rpi_history
WHERE team_id = 123
ORDER BY calculated_at DESC;
```

Shows: How a team's rank/RPI changed over time.

### Functions

#### `compare_rpi_runs(run_id_1, run_id_2)`

Compare two calculation runs to see changes:

```sql
SELECT * FROM fb_compete.compare_rpi_runs(101, 102);
```

Returns:
- Team name
- Rank in both runs
- RPI in both runs
- Rank change (+/- positions)
- RPI change (decimal)

#### `cleanup_old_rpi_calculations(event_id, keep_count)`

Delete old calculations, keeping N most recent:

```sql
SELECT fb_compete.cleanup_old_rpi_calculations(31, 10);
-- Keeps last 10 calculations for event 31
```

**Auto-cleanup**: Trigger automatically keeps last 20 per event.

## TypeScript API

### Save Calculation

```typescript
import { saveRPICalculation } from '@/lib/rpi-history'

const result = await saveRPICalculation(
  supabaseUrl,
  supabaseKey,
  {
    eventId: 31,
    sportId: 5,
    coefficients: {
      clwpCoeff: 0.9,
      oclwpCoeff: 0.1,
      ooclwpCoeff: 0.1,
      diffCoeff: 0.1,
      dominationCoeff: 0.9,
      // ... other coefficients
    },
    teams: calculatedTeams, // TeamData[]
    totalMatches: 100,
    matchesWithScores: 95,
    calculationType: 'manual',
    notes: 'After day 1 of tournament',
  }
)

if (result.success) {
  console.log('Saved! Run ID:', result.runId)
}
```

### Get History

```typescript
import { getRPICalculationHistory } from '@/lib/rpi-history'

const history = await getRPICalculationHistory(
  supabaseUrl,
  supabaseKey,
  eventId,
  10 // last 10 calculations
)

history.forEach(run => {
  console.log(`Run #${run.id}: ${run.total_teams} teams, ${run.notes}`)
})
```

### Get Latest Results

```typescript
import { getLatestRPIResults } from '@/lib/rpi-history'

const { run, results } = await getLatestRPIResults(
  supabaseUrl,
  supabaseKey,
  eventId
)

console.log('Latest calculation:', run?.calculated_at)
results.forEach(r => {
  console.log(`${r.rank}. ${r.team_name} - RPI: ${r.rpi}`)
})
```

### Compare Runs

```typescript
import { compareRPIRuns } from '@/lib/rpi-history'

const comparison = await compareRPIRuns(
  supabaseUrl,
  supabaseKey,
  runId1,
  runId2
)

comparison.forEach(c => {
  console.log(`${c.team_name}: ${c.run1_rank} → ${c.run2_rank} (${c.rank_change > 0 ? '+' : ''}${c.rank_change})`)
})
```

## UI Component

```typescript
import { SaveRPICalculationButton } from '@/components/save-rpi-calculation-button'

<SaveRPICalculationButton
  eventId={eventId}
  sportId={sportId}
  supabaseUrl={supabaseUrl}
  supabaseKey={supabaseKey}
  teams={calculatedTeams}
  coefficients={coefficients}
  totalMatches={100}
  matchesWithScores={95}
/>
```

Features:
- Modal dialog with history
- Optional notes field
- Shows recent calculations
- Success/error feedback
- Disabled when no data

## Data Retention

### Automatic Cleanup

A trigger automatically keeps the last **20 calculations** per event:

```sql
CREATE TRIGGER trigger_auto_cleanup_rpi
  AFTER INSERT ON rpi_calculation_runs
  FOR EACH ROW
  EXECUTE FUNCTION auto_cleanup_old_calculations();
```

### Manual Cleanup

```sql
-- Keep only last 5 for event 31
SELECT fb_compete.cleanup_old_rpi_calculations(31, 5);
```

### Custom Retention Policy

Modify the trigger or create a scheduled job:

```sql
-- Keep last 100 calculations
CREATE OR REPLACE FUNCTION auto_cleanup_old_calculations()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM cleanup_old_rpi_calculations(NEW.event_id, 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Storage Estimates

### Per Calculation Run

**Metadata** (`rpi_calculation_runs`): ~200 bytes per run

**Results** (`rpi_results`): ~50 bytes per team per run

Example: 100 teams, 20 calculations saved:
- Metadata: 200 bytes × 20 = 4 KB
- Results: 50 bytes × 100 teams × 20 runs = 100 KB
- **Total**: ~104 KB

### Large Scale

1,000 teams, 100 calculations:
- Metadata: 20 KB
- Results: 5 MB
- **Total**: ~5 MB (very compact!)

## Use Cases

### 1. Daily Tournament Updates

```typescript
// Save after each day
await saveRPICalculation(url, key, {
  eventId,
  sportId,
  coefficients,
  teams,
  totalMatches,
  matchesWithScores,
  calculationType: 'manual',
  notes: `End of Day ${dayNumber}`,
})
```

### 2. Coefficient Testing

```typescript
// Test different formulas
const formulas = [
  { name: 'NCAA', clwp: 0.25, oclwp: 0.50, ooclwp: 0.25 },
  { name: 'Custom', clwp: 0.90, oclwp: 0.10, ooclwp: 0.10 },
]

for (const formula of formulas) {
  await saveRPICalculation(url, key, {
    // ... params
    coefficients: formula,
    notes: `Testing ${formula.name} formula`,
  })
}

// Compare results
const comparison = await compareRPIRuns(url, key, runId1, runId2)
```

### 3. Scheduled Calculations

```typescript
// Cron job every 6 hours
await saveRPICalculation(url, key, {
  // ... params
  calculationType: 'scheduled',
  notes: `Auto-calculation at ${new Date().toISOString()}`,
})
```

### 4. Trend Analysis

```sql
-- See how team 123's rank changed
SELECT 
  calculated_at,
  rank,
  rpi,
  rank - LAG(rank) OVER (ORDER BY calculated_at) as rank_change
FROM fb_compete.v_rpi_history
WHERE team_id = 123
  AND event_id = 31
ORDER BY calculated_at;
```

## Performance Optimization

### Batch Inserts

The save function uses batches of 1000 teams:

```typescript
const BATCH_SIZE = 1000
for (let i = 0; i < results.length; i += BATCH_SIZE) {
  const batch = results.slice(i, i + BATCH_SIZE)
  await supabase.from('rpi_results').insert(batch)
}
```

### Indexes

All common queries are indexed:
- Event lookups
- Date sorting
- Rank ordering
- Team history

### Composite Primary Key

No separate `id` column = 8 bytes saved per row.

100,000 rows = 800 KB saved!

## Best Practices

1. **Add Notes**: Context helps future analysis
2. **Regular Cleanup**: Don't keep unlimited history
3. **Batch Operations**: For large tournaments
4. **Monitor Storage**: Check table sizes periodically
5. **Use Views**: Easier than complex joins

## Monitoring

```sql
-- Check storage usage
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'fb_compete'
  AND tablename LIKE 'rpi_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Count calculations per event
SELECT 
  event_id,
  COUNT(*) as calculation_count,
  MAX(calculated_at) as latest,
  MIN(calculated_at) as oldest
FROM fb_compete.rpi_calculation_runs
GROUP BY event_id
ORDER BY calculation_count DESC;
```

## Troubleshooting

### Too Many Calculations

```sql
-- Clean up aggressively
SELECT fb_compete.cleanup_old_rpi_calculations(event_id, 5);
```

### Missing Data

```sql
-- Check if run exists
SELECT * FROM fb_compete.rpi_calculation_runs WHERE id = 123;

-- Check results count
SELECT COUNT(*) FROM fb_compete.rpi_results WHERE run_id = 123;
```

### Slow Queries

```sql
-- Add index if needed
CREATE INDEX idx_custom ON fb_compete.rpi_results(run_id, rpi DESC);
```

---

**Result**: Professional, compact, historical RPI tracking system ready for production use! 🎉

