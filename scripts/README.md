# Database Maintenance Scripts

## Sport ID Fixer

These scripts help detect and fix incorrect `sport_id` values in the `fb_compete.compete_event_details` table by analyzing event names.

### Prerequisites

You need your Supabase credentials:
- `SUPABASE_URL`: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key

### Step 1: Analyze (Dry Run)

First, run the analysis script to see what needs to be fixed **without making any changes**:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
npm run analyze-sports
```

Or using bun:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
bun run analyze-sports
```

This will show you:
- ✅ Events with correct sport IDs
- ❌ Events with incorrect sport IDs (with proposed fixes)
- 🚫 Events missing from the compete_event_details table
- ❓ Events where the sport cannot be auto-detected

### Step 2: Fix (Updates Database)

Once you've reviewed the analysis and are ready to apply the fixes:

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_ANON_KEY=your-anon-key \
npm run fix-sports
```

⚠️ **Warning**: This script will modify your database! It will:
1. Show you what will be changed
2. Wait 5 seconds for you to cancel (Ctrl+C)
3. Update the `sport_id` values in `compete_event_details`

### How Sport Detection Works

The scripts analyze event names for sport-specific keywords:

| Sport | Keywords | Sport ID |
|-------|----------|----------|
| ⚾ Baseball | "baseball", "base ball" | 1 |
| ⚽ Soccer | "soccer", "futbol" | 2 |
| 🏈 Football | "football", "gridiron" | 3 |
| 🏐 Volleyball | "volleyball", "volley ball" | 4 |
| 🏀 Basketball | "basketball", "hoops" | 5 |
| 🏒 Hockey | "hockey" | 6 |
| 🥍 Lacrosse | "lacrosse", "lax" | 7 |
| 🏓 Pickleball | "pickleball", "pickle ball" | 8 |

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
```

### Manual Fixes

If an event cannot be auto-detected (no sport keywords in name), you'll need to manually update it:

```sql
-- Example: Set event 999 to Basketball
UPDATE fb_compete.compete_event_details 
SET sport_id = 5 
WHERE event_id = 999;
```

### Troubleshooting

**"Missing SUPABASE_URL or SUPABASE_ANON_KEY"**
- Make sure you're passing both environment variables
- Check that the URL includes `https://`
- Verify your anon key is correct

**"Error fetching events: ..."**
- Check your Supabase credentials
- Verify your RLS policies allow reading from the `events` table
- Ensure the `fb_compete.compete_event_details` table exists

**"Cannot detect sport for some events"**
- Add keywords to the event name (e.g., "Tournament 2024" → "Basketball Tournament 2024")
- Or manually update using the SQL provided in the analysis output

