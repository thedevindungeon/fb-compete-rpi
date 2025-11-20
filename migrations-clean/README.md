# RPI Calculator - Clean Migrations

## Overview

This directory contains the **clean, minimal set of migrations** for setting up RPI calculation functionality in a **new/standalone database**.

These migrations are designed for the **standalone RPI calculator** application and assume you're starting from scratch (no existing compete database).

## Migration Files

### 01_create_sports_table.sql
**Purpose:** Creates the sports reference table with full RPI configuration and populates it with 8 sports.

**Creates:**
- `fb_compete.sports` table with all RPI configuration columns
- Indexes for performance (slug, is_active, sort_order)
- Foreign key constraint from `compete_event_details` to `sports`
- Trigger for auto-updating `updated_at` timestamp
- View: `v_events_with_sport` for easy querying
- **Pre-populates 8 sports:** Baseball, Soccer, Football, Volleyball, Basketball, Hockey, Lacrosse, Pickleball

**Dependencies:**
- Requires `fb_compete` schema to exist
- Requires `fb_compete.compete_event_details` table to exist (for FK constraint)
- Requires `public.events` table to exist (for view)

**RPI Configuration Included:**
- NCAA-standard coefficients (25-50-25 formula variations)
- Sport-specific point differential settings
- Domination penalty coefficients
- Display terminology (runs, goals, points)
- Minimum games requirements

---

### 02_create_team_rpi_table.sql
**Purpose:** Creates the table for storing historical RPI values for teams.

**Creates:**
- `fb_compete.team_rpi` table
- Stores: team_id, sport_id, RPI value, generated_at timestamp
- Indexes for efficient querying
- Trigger for auto-updating `updated_at` timestamp
- Unique constraint: (team_id, sport_id, generated_at)

**Dependencies:**
- Requires `fb_compete.teams` table to exist (FK constraint)
- Requires `fb_compete.sports` table to exist (from migration 01)

**Use Case:**
- Store RPI snapshots at any point in time
- Track RPI changes over the course of an event
- Historical analysis and trending

---

### 03_create_rpi_calculation_history.sql
**Purpose:** Creates advanced tables for tracking complete RPI calculation runs with full metadata.

**Creates:**
- `rpi_calculation_runs` table: Metadata for each calculation (coefficients used, stats, timing)
- `rpi_results` table: Compact storage of team rankings for each run
- Views:
  - `v_latest_rpi_by_event`: Shows most recent RPI for each event
  - `v_rpi_history`: Complete history with trend analysis
- Functions:
  - `compare_rpi_runs()`: Compare two calculation runs
  - `cleanup_old_rpi_calculations()`: Data retention management
- Trigger: Auto-cleanup (keeps last 20 calculations per event)

**Dependencies:**
- Requires `fb_compete.sports` table (from migration 01)
- Requires `fb_compete.teams` table
- Requires `public.events` table

**Use Case:**
- Track how RPI changes as matches are added
- Compare different coefficient settings
- Historical snapshots for reporting
- Performance tracking (calculation duration)
- Data retention management

---

## Migration Order

**CRITICAL:** Run migrations in numeric order:

```bash
# 1. Create sports table and populate data
psql -f 01_create_sports_table.sql

# 2. Create team RPI storage
psql -f 02_create_team_rpi_table.sql

# 3. Create calculation history tracking
psql -f 03_create_rpi_calculation_history.sql
```

## External Dependencies

These migrations assume the following tables already exist in your database:

### Required Tables

| Table | Schema | Description | Created By |
|-------|--------|-------------|------------|
| `events` | `public` | Base events table from Supabase/compete | Base schema |
| `teams` | `fb_compete` | Teams participating in events | Compete schema |
| `compete_event_details` | `fb_compete` | Event-specific configuration | Compete schema |

### Optional Tables

| Table | Schema | Description | Impact if Missing |
|-------|--------|-------------|-------------------|
| `users` | `public` | Supabase auth users | Audit trail features won't work |

---

## What's Different from Original Migrations?

### ❌ Removed (Redundant Files)
- `20250119100001_alter_sports_table_add_columns.sql` - Redundant (migration 01 handles this)
- `20250119100002_populate_sports_data.sql` - Redundant (migration 01 handles this)
- `20250119100003_create_sports_view.sql` - Redundant (migration 01 handles this)

### ✅ Kept (Essential Files)
- `01_create_sports_table.sql` - Complete sports setup (previously 20250119100000)
- `02_create_team_rpi_table.sql` - RPI storage (previously 20250119000000)
- `03_create_rpi_calculation_history.sql` - Advanced history (previously 20250119110000)

### 🎯 Why This is Better
1. **No redundancy** - Each migration does one thing
2. **Idempotent** - Safe to run multiple times (`IF NOT EXISTS`, `ON CONFLICT`)
3. **Clear dependencies** - Obvious what needs to run first
4. **Self-contained** - Migration 01 handles sports completely
5. **Verifiable** - Each migration includes verification queries

---

## Verification Queries

After running all migrations, verify successful installation:

```sql
-- 1. Verify sports table exists with 8 sports
SELECT COUNT(*) as sport_count FROM fb_compete.sports;
-- Expected: 8

-- 2. Verify sports have RPI configuration
SELECT id, display_name, icon, 
       CONCAT(default_clwp_coeff, '-', default_oclwp_coeff, '-', default_ooclwp_coeff) as formula
FROM fb_compete.sports
ORDER BY sort_order;
-- Expected: 8 rows with icons and formulas

-- 3. Verify team_rpi table exists
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'fb_compete' 
  AND table_name = 'team_rpi';
-- Expected: 1

-- 4. Verify calculation history tables exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'fb_compete' 
  AND table_name IN ('rpi_calculation_runs', 'rpi_results');
-- Expected: 2

-- 5. Verify views exist
SELECT COUNT(*) FROM information_schema.views 
WHERE table_schema = 'fb_compete' 
  AND table_name IN ('v_events_with_sport', 'v_latest_rpi_by_event', 'v_rpi_history');
-- Expected: 3
```

---

## Rollback

See the `../rollback/` directory for rollback migrations if you need to undo these changes.

---

## Next Steps

After running these migrations:

1. **Test the RPI Calculator UI** - Verify you can select sports and calculate RPI
2. **Verify Sports Display** - Check that icons and names show correctly
3. **Test Calculation History** - Run RPI calculations and verify history is saved
4. **Check Data Retention** - Verify auto-cleanup trigger works after 20+ calculations

---

## Troubleshooting

### Error: relation "fb_compete.teams" does not exist
**Solution:** You need to run the compete schema migrations first. The RPI calculator requires base compete tables.

### Error: relation "public.events" does not exist
**Solution:** You need the base Supabase/events table. This is part of the core compete schema.

### Error: permission denied for schema fb_compete
**Solution:** Grant schema permissions:
```sql
GRANT USAGE ON SCHEMA fb_compete TO YOUR_ROLE;
GRANT ALL ON ALL TABLES IN SCHEMA fb_compete TO YOUR_ROLE;
```

### Sports table is empty after migration 01
**Check:** Look for error messages in the migration output. The INSERT statements may have failed.
**Solution:** Manually run the INSERT statements from migration 01.

---

## Support

For questions or issues:
1. Check the main project README
2. Review `/docs/rpi-formula.md` for RPI calculation details
3. See `/docs/database-sports-structure.md` for schema documentation
