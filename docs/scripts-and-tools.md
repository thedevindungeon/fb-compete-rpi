# Scripts & Tools

Maintenance scripts and utilities for the RPI Calculator.

## Overview

The `scripts/` directory contains tools for:
- **Sport ID Fixing** - Detect and fix incorrect sport assignments
- **Dataset Generation** - Create large synthetic datasets
- **Data Analysis** - Analyze sport distributions and patterns

---

## Sport ID Fixer

Detect and fix incorrect `sport_id` values in the `fb_compete.compete_event_details` table by analyzing event names.

### Quick Start

#### 1. Analyze (Dry Run - No Changes)

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
npm run analyze-sports
```

Or with Bun:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
bun run analyze-sports
```

**What It Does**:
- Scans all events
- Detects sport from event name keywords
- Shows what needs fixing
- **Does not modify database**

#### 2. Fix (Updates Database)

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
npm run fix-sports
```

⚠️ **Warning**: This modifies your database!
- Shows planned changes
- Waits 5 seconds for cancellation (Ctrl+C)
- Updates `sport_id` values

#### 3. Interactive Fixer (Manual Assignment)

```bash
npm run fix-sports:interactive
```

**What It Does**:
- Shows each event
- Asks you to select correct sport
- Applies all changes at once

**Use When**: Event names are generic and can't be auto-detected

---

### Sport Detection

The scripts detect sports from event name keywords:

| Sport | Keywords | ID |
|-------|----------|----| 
| ⚾ Baseball | baseball, base ball | 1 |
| ⚽ Soccer | soccer, futbol | 2 |
| 🏈 Football | football, gridiron | 3 |
| 🏐 Volleyball | volleyball, volley ball | 4 |
| 🏀 Basketball | basketball, hoops | 5 |
| 🏒 Hockey | hockey | 6 |
| 🥍 Lacrosse | lacrosse, lax | 7 |
| 🏓 Pickleball | pickleball, pickle ball | 8 |

### Example Output

```
═══════════════════════════════════════════════════════════════
📊 SPORT ID ANALYSIS REPORT
═══════════════════════════════════════════════════════════════

📈 Summary:
   ✅ Correct: 25
   ❌ Incorrect: 5
   ❓ Cannot detect: 2
   🚫 Missing from DB: 0
   📦 Total events: 32

═══════════════════════════════════════════════════════════════
❌ INCORRECT SPORT IDS (Need fixing):
═══════════════════════════════════════════════════════════════

Event ID: 127
  Name:     "Youth Basketball Tournament 31"
  Current:  ⚽ Soccer
  Should be: 🏀 Basketball
  SQL: UPDATE fb_compete.compete_event_details SET sport_id = 5 WHERE event_id = 127;

Event ID: 31
  Name:     "One Day Soccer Showcase"
  Current:  🏈 Football
  Should be: ⚽ Soccer
  SQL: UPDATE fb_compete.compete_event_details SET sport_id = 2 WHERE event_id = 31;

═══════════════════════════════════════════════════════════════
❓ CANNOT AUTO-DETECT (Manual review needed):
═══════════════════════════════════════════════════════════════

Event ID: 45
  Name:     "Youth Power Play 31"
  Current:  ⚾ Baseball
  → Cannot determine from name, needs manual verification
```

### Manual SQL Fixes

For events that can't be auto-detected:

```sql
-- Set event to Basketball
UPDATE fb_compete.compete_event_details 
SET sport_id = 5 
WHERE event_id = 999;

-- Verify
SELECT e.id, e.name, s.display_name, s.icon
FROM public.events e
JOIN fb_compete.compete_event_details ced ON e.id = ced.event_id
JOIN fb_compete.sports s ON ced.sport_id = s.id
WHERE e.id = 999;
```

### Available Scripts

| Command | File | Purpose |
|---------|------|---------|
| `npm run analyze-sports` | `analyze-sport-ids.ts` | Analyze sport ID correctness (dry run) |
| `npm run fix-sports` | `fix-sport-ids.ts` | Auto-fix incorrect sport IDs |
| `npm run fix-sports:interactive` | `interactive-sport-fixer.ts` | Manual sport assignment |
| `npm run analyze-sports:matches` | `detect-sport-from-matches.ts` | Detect sport from match scoring patterns |

---

## Dataset Generator

Create large synthetic datasets for testing and demonstration.

### Via UI (Recommended)

1. Open **Sample Data & Upload** panel
2. Click **"Generate Dataset"**
3. Configure:
   - **Teams**: 10-1000
   - **Games per Team**: 10-100
   - **Sport**: Select from dropdown
   - **Advanced Options**: Pools, round-robin, ties, completion rate
4. Click **"Generate"**

See: [Generate Dataset Guide](generate-dataset-sport-selection.md)

### Via Script

```bash
npm run generate-dataset
```

Edit `scripts/generate-large-dataset.ts` to customize:
- Number of teams
- Games per team
- Sport ID
- Scoring ranges
- Competitive levels

### Testing Large Datasets

```bash
npm run test-dataset
```

Runs performance tests on generated datasets:
- 100 teams, 50 games each
- 500 teams, 100 games each
- Measures calculation time
- Reports memory usage

---

## Database Maintenance

### Check Sport Distribution

```sql
-- Count events per sport
SELECT 
  s.id,
  s.display_name,
  s.icon,
  COUNT(ced.event_id) as event_count
FROM fb_compete.sports s
LEFT JOIN fb_compete.compete_event_details ced ON s.id = ced.sport_id
GROUP BY s.id, s.display_name, s.icon
ORDER BY event_count DESC;
```

### Find Events Missing Sport

```sql
-- Events without sport assigned
SELECT e.id, e.name
FROM public.events e
LEFT JOIN fb_compete.compete_event_details ced ON e.id = ced.event_id
WHERE ced.sport_id IS NULL;
```

### Update Sport for Multiple Events

```sql
-- Update all "Basketball Tournament" events
UPDATE fb_compete.compete_event_details ced
SET sport_id = 5
FROM public.events e
WHERE ced.event_id = e.id
  AND e.name ILIKE '%basketball%'
  AND ced.sport_id != 5;
```

---

## Troubleshooting Scripts

### "Missing SUPABASE_URL or SUPABASE_ANON_KEY"

**Solution**: Ensure both environment variables are set:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key

# Then run script
npm run analyze-sports
```

Or provide inline:

```bash
SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run analyze-sports
```

### "Error fetching events"

**Causes**:
- Invalid Supabase credentials
- RLS policies block SELECT
- Network connection issues
- Table doesn't exist

**Solution**:
1. Verify credentials in Supabase Dashboard
2. Check RLS policies allow SELECT on `events` table
3. Confirm `fb_compete.compete_event_details` exists
4. Test connection:
   ```bash
   curl "$SUPABASE_URL/rest/v1/events" \
     -H "apikey: $SUPABASE_ANON_KEY"
   ```

### "Cannot detect sport for event"

**Expected**: Generic event names can't be auto-detected

**Solutions**:

**Option 1**: Add sport keyword to event name
```sql
UPDATE public.events 
SET name = 'Basketball Tournament 2024' 
WHERE name = 'Tournament 2024';
```

**Option 2**: Use interactive fixer
```bash
npm run fix-sports:interactive
```

**Option 3**: Manual SQL update
```sql
UPDATE fb_compete.compete_event_details 
SET sport_id = 5 
WHERE event_id = 123;
```

### "Failed to update sport_id"

**Causes**:
- RLS policies block UPDATE
- Using anon key (read-only by default)
- Foreign key constraint violation

**Solution**:

**Use Supabase Studio** (Recommended):
1. Open: http://127.0.0.1:54323
2. Go to **SQL Editor**
3. Run SQL directly (bypasses RLS)

**Or update RLS policies**:
```sql
-- Allow updates from anon role (development only!)
CREATE POLICY "Allow anon updates on event details"
ON fb_compete.compete_event_details
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
```

⚠️ **Security**: Only do this in development!

---

## Adding New Scripts

### Create Script File

```typescript
// scripts/my-new-script.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  // Your logic here
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Success:', data)
}

main()
```

### Add to package.json

```json
{
  "scripts": {
    "my-script": "bun run scripts/my-new-script.ts"
  }
}
```

### Run It

```bash
npm run my-script
```

---

## Best Practices

### 1. Always Test First

Run analysis/dry-run commands before making changes:
```bash
npm run analyze-sports  # Before fix-sports
```

### 2. Backup Before Bulk Updates

```sql
-- Create backup table
CREATE TABLE fb_compete.compete_event_details_backup AS
SELECT * FROM fb_compete.compete_event_details;

-- Restore if needed
DELETE FROM fb_compete.compete_event_details;
INSERT INTO fb_compete.compete_event_details 
SELECT * FROM fb_compete.compete_event_details_backup;
```

### 3. Use Version Control

Commit before running scripts:
```bash
git add .
git commit -m "Before sport ID fix"
npm run fix-sports
git add .
git commit -m "After sport ID fix"
```

### 4. Document Manual Changes

Keep a log of manual SQL updates:
```sql
-- scripts/manual-updates.sql
-- 2025-01-19: Fixed event 31 sport
UPDATE fb_compete.compete_event_details SET sport_id = 2 WHERE event_id = 31;

-- 2025-01-19: Assigned sports to generic named events
UPDATE fb_compete.compete_event_details SET sport_id = 1 WHERE event_id IN (23, 45, 67);
```

### 5. Verify After Changes

```bash
# Run analysis again to confirm
npm run analyze-sports

# Should show fewer/no errors
```

---

## Future Enhancements

Planned improvements:

- [ ] Detect sport from match scoring patterns (partially implemented)
- [ ] Batch import from CSV
- [ ] Export event data with correct sports
- [ ] Validate sport assignments before tournaments
- [ ] Auto-suggest sports based on team names
- [ ] Historical sport change tracking

---

## Related Documentation

- [Database Admin Interface](database-admin-interface.md) - UI-based data management
- [Database Sports Structure](database-sports-structure.md) - Sport table schema
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

