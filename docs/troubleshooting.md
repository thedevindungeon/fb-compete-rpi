# Troubleshooting

Common issues and solutions for the RPI Calculator.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Data Loading](#data-loading)
- [Supabase Connection](#supabase-connection)
- [RPI Calculations](#rpi-calculations)
- [Database Admin](#database-admin)
- [Scripts & Tools](#scripts--tools)
- [Performance](#performance)
- [Export Issues](#export-issues)

---

## Installation & Setup

### "Command not found: bun"

**Cause**: Bun is not installed

**Solution**:
```bash
curl -fsSL https://bun.sh/install | bash
```

Then restart your terminal.

### "Cannot find module '@/...' or its corresponding type declarations"

**Cause**: Dependencies not installed

**Solution**:
```bash
bun install
```

If still failing:
```bash
rm -rf node_modules bun.lock
bun install
```

### TypeScript Errors on Startup

**Cause**: Old build cache

**Solution**:
```bash
rm -rf .next
bun dev
```

---

## Data Loading

### No Data Appears After Loading

**Possible Causes**:

#### 1. Minimum Games Not Met

Teams with fewer than the minimum games are filtered out.

**Solution**: 
- Check "Min Games" setting in Coefficients panel
- Lower the value if you have few games
- Default is 3-6 depending on sport

#### 2. Empty Dataset

**Solution**: 
- Verify data source has matches
- Check browser console for errors
- Try loading sample data to confirm UI works

#### 3. JavaScript Error

**Solution**:
- Open browser DevTools (F12)
- Check Console tab for errors
- Report any errors to development team

### Sample Data Loads But Not Supabase Data

**Possible Causes**:

#### 1. RLS Policies Too Restrictive

**Solution**:
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'match';

-- Allow SELECT for testing (development only!)
ALTER POLICY "policy_name" ON fb_compete.match TO anon USING (true);
```

#### 2. Wrong Schema/Table Names

**Solution**: Verify table structure matches expectations:
```sql
\dt fb_compete.*
```

Should show:
- `fb_compete.match`
- `fb_compete.match_team`
- `fb_compete.match_game`
- `fb_compete.match_game_team`
- `fb_compete.sports`

### "Failed to load event data"

**Causes**:
- Event has no matches
- Matches have no games
- Games have no scores
- Foreign key references broken

**Solution**:
```sql
-- Check event structure
SELECT 
  COUNT(DISTINCT m.id) as matches,
  COUNT(DISTINCT mg.id) as games,
  COUNT(DISTINCT mgt.id) as team_games
FROM fb_compete.match m
LEFT JOIN fb_compete.match_game mg ON m.id = mg.match_id
LEFT JOIN fb_compete.match_game_team mgt ON mg.id = mgt.match_game_id
WHERE m.event_id = YOUR_EVENT_ID;
```

If counts are 0, the event has no data.

---

## Supabase Connection

### "Invalid Supabase URL"

**Causes**:
- URL missing `https://`
- URL has typo
- Wrong project URL

**Solution**:
1. Go to Supabase Dashboard
2. **Settings** → **API**
3. Copy **Project URL** exactly
4. Must include `https://`
5. Format: `https://xxxxx.supabase.co`

### "Invalid API Key"

**Causes**:
- Using wrong key (service role instead of anon)
- Key has typo
- Key expired/revoked

**Solution**:
1. Go to Supabase Dashboard
2. **Settings** → **API**
3. Copy **anon public** key (not service_role)
4. Key starts with `eyJ...`
5. Very long string (~300+ characters)

### Connection Works But No Events Show

**Causes**:

#### 1. No Events in Database

**Solution**:
```sql
SELECT COUNT(*) FROM public.events;
```

If 0, you need to create events.

#### 2. RLS Policy Blocks SELECT

**Solution**:
```sql
-- Allow anon to read events (development)
CREATE POLICY "Allow anon to read events"
ON public.events
FOR SELECT
TO anon
USING (true);
```

#### 3. Events Not Published

**Solution**: Check if events have `published = true` or similar field.

### "No sport detected" for Event

**Causes**:
- Event missing from `compete_event_details`
- `sport_id` is NULL
- `sport_id` references non-existent sport

**Solution**:
```sql
-- Check sport assignment
SELECT e.id, e.name, ced.sport_id, s.display_name
FROM public.events e
LEFT JOIN fb_compete.compete_event_details ced ON e.id = ced.event_id
LEFT JOIN fb_compete.sports s ON ced.sport_id = s.id
WHERE e.id = YOUR_EVENT_ID;

-- If NULL, assign a sport
INSERT INTO fb_compete.compete_event_details (event_id, sport_id)
VALUES (YOUR_EVENT_ID, 5); -- 5 = Basketball
```

---

## RPI Calculations

### RPI Values Seem Wrong

**Possible Causes**:

#### 1. Incorrect Coefficients

**Solution**: Click **Reset** (↻) button to restore sport-specific defaults.

#### 2. Minimum Games Filter

Teams below minimum games don't appear.

**Solution**: Lower "Min Games" value in Coefficients panel.

#### 3. Missing Opponent Data

OCLWP/OOCLWP require opponent data.

**Solution**: Ensure all teams in matches are in the dataset.

#### 4. Point Differential Issue

Check DIFF coefficient and scores.

**Solution**: 
- Set DIFF coefficient to 0 to exclude point differential
- Verify scores are realistic (not 0-0 or extreme values)

### All RPI Values the Same

**Causes**:
- All teams have identical records
- No games played
- Coefficient error

**Solution**:
- Check data has varied wins/losses
- Verify games have different outcomes
- Check coefficients sum properly

### Negative RPI Values

**Cause**: This shouldn't happen with proper implementation

**Solution**: Report as bug with:
- Dataset used
- Coefficient settings
- Browser console errors

### Sort Not Working

**Causes**:
- JavaScript error
- Table rendering issue

**Solution**:
1. Try clicking column header again
2. Refresh page
3. Check browser console for errors

---

## Database Admin

### Cannot Access Admin Interface

**Causes**:

#### 1. Not Connected to Supabase

**Solution**: Connect to Supabase first from main page.

#### 2. Wrong URL

**Solution**: Use the "Admin" button in Supabase modal, don't type URL manually.

#### 3. Credentials Not Passed

**Solution**: Admin button automatically passes credentials. If accessing directly, include:
```
/admin/database?url=YOUR_URL&key=YOUR_KEY
```

### "Failed to fetch" in Admin

**Causes**:
- RLS policies block SELECT
- Wrong schema/table name
- Connection lost

**Solution**:
```sql
-- Allow SELECT for admin tables
CREATE POLICY "Allow anon to read events"
ON public.events FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon to read teams"
ON fb_compete.teams FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon to read sports"
ON fb_compete.sports FOR SELECT TO anon USING (true);
```

### "Failed to save" in Admin

**Causes**:
- RLS policies block INSERT/UPDATE
- Missing required fields
- Type mismatch
- Foreign key constraint

**Solution**:
```sql
-- Allow INSERT for admin (development only!)
CREATE POLICY "Allow anon to insert events"
ON public.events FOR INSERT TO anon WITH CHECK (true);

-- Allow UPDATE
CREATE POLICY "Allow anon to update events"
ON public.events FOR UPDATE TO anon USING (true) WITH CHECK (true);
```

### "Failed to delete" in Admin

**Causes**:
- RLS policies block DELETE
- Foreign key constraint (record referenced elsewhere)

**Solution**:
```sql
-- Allow DELETE (development only!)
CREATE POLICY "Allow anon to delete events"
ON public.events FOR DELETE TO anon USING (true);

-- Check foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'YOUR_TABLE';
```

Delete referencing records first, then try again.

---

## Scripts & Tools

### "Missing SUPABASE_URL or SUPABASE_ANON_KEY"

**Solution**: Set environment variables:
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key

npm run analyze-sports
```

Or inline:
```bash
SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run analyze-sports
```

### Script Says "Cannot detect sport"

**Expected**: Generic event names can't be auto-detected.

**Solutions**:

#### Option 1: Add Keywords
```sql
UPDATE public.events 
SET name = 'Basketball Tournament 2024' 
WHERE name = 'Tournament 2024';
```

#### Option 2: Use Interactive Fixer
```bash
npm run fix-sports:interactive
```

#### Option 3: Manual SQL
```sql
UPDATE fb_compete.compete_event_details 
SET sport_id = 5 
WHERE event_id = 123;
```

### Script Can't Update Database

**Cause**: Anon key is read-only (RLS policies)

**Solutions**:

#### Option 1: Use Supabase Studio (Recommended)
1. Open: http://127.0.0.1:54323
2. Go to SQL Editor
3. Run SQL directly

#### Option 2: Update RLS Policies (Development Only!)
```sql
CREATE POLICY "Allow anon updates"
ON fb_compete.compete_event_details
FOR UPDATE TO anon
USING (true) WITH CHECK (true);
```

---

## Performance

### Slow Calculations

**Expected**: For very large datasets (1000+ teams)

**Solutions**:
- Calculations should still complete in <1 second
- If slower, check browser performance
- Close other browser tabs
- Disable browser extensions

### Table Rendering Slow

**Expected**: For 500+ teams

**Solutions**:
- Export to CSV for analysis
- Filter by top N teams
- Future: Virtual scrolling will be added

### Export Takes Long Time

**Expected**: For very large datasets

**Solutions**:
- Be patient, it will complete
- Check browser downloads folder
- Try exporting smaller subset

### Page Freezes

**Causes**:
- JavaScript error
- Memory issue
- Too much data

**Solutions**:
1. Refresh page
2. Try smaller dataset
3. Check browser console
4. Report issue with dataset size

---

## Export Issues

### CSV Download Not Starting

**Causes**:
- Browser blocking downloads
- JavaScript error
- No data to export

**Solutions**:
1. Check browser download settings
2. Allow downloads for localhost
3. Check browser console for errors
4. Verify data is loaded

### CSV File Empty or Corrupt

**Causes**:
- No teams met minimum games requirement
- Data export error

**Solutions**:
1. Lower minimum games requirement
2. Verify data is visible in table
3. Try exporting again
4. Check browser console

### JSON Export Format Wrong

**Cause**: Unlikely, format is standardized

**Solution**: Report issue with example of expected format.

---

## Common Error Messages

### "Minimum games requirement not met"

**Meaning**: Team doesn't have enough games to be ranked.

**Solution**: Lower "Min Games" in Coefficients panel.

### "Failed to calculate OCLWP"

**Meaning**: Team's opponents have no data.

**Solution**: Ensure all opponents are in the dataset.

### "Circular reference detected"

**Meaning**: Data structure issue (shouldn't happen).

**Solution**: Report as bug with dataset.

### "Invalid coefficient value"

**Meaning**: Coefficient is out of valid range.

**Solution**: Use values between 0.0 and 1.0.

---

## Still Having Issues?

### Debugging Steps

1. **Check Browser Console** (F12 → Console)
2. **Try Sample Data** (to isolate data vs. code issue)
3. **Clear Cache** (Cmd/Ctrl + Shift + R)
4. **Try Different Browser**
5. **Check Network Tab** (for Supabase connection issues)

### Reporting Issues

Include:
- **What you were doing** (step-by-step)
- **What you expected**
- **What actually happened**
- **Error messages** (from browser console)
- **Browser & version**
- **Dataset size** (number of teams/games)
- **Screenshots** (if applicable)

### Contact

Reach out to the development team with:
- Issue description
- Relevant logs/screenshots
- Steps to reproduce

---

## Preventive Measures

### Before Running Scripts
- ✅ Backup database
- ✅ Test with `analyze-` commands first
- ✅ Commit code changes
- ✅ Verify credentials

### Before Connecting to Production
- ✅ Test with development database first
- ✅ Verify RLS policies
- ✅ Check data format
- ✅ Have rollback plan

### Regular Maintenance
- ✅ Clean up old RPI calculations (automatic)
- ✅ Verify sport IDs are correct
- ✅ Check for orphaned records
- ✅ Monitor database size

---

**Last Updated**: 2025-01-19  
**For More Help**: See [Getting Started](getting-started.md) or other documentation sections

