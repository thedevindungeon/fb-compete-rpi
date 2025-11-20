# RPI Rollback Migrations

## Overview

This directory contains scripts for rolling back RPI functionality from your database.

**⚠️ WARNING:** Rollback operations are DESTRUCTIVE and will delete data. Always backup your database before running rollback scripts.

## Available Rollback Scripts

### rollback_all_rpi.sql
**Purpose:** Complete removal of all RPI functionality

**What it does:**
1. Drops RPI calculation history tables (`rpi_calculation_runs`, `rpi_results`)
2. Drops `team_rpi` table
3. Drops RPI-related views and functions
4. Drops RPI-related triggers
5. Removes indexes
6. **OPTIONAL:** Removes RPI columns from sports table (commented out by default)
7. **OPTIONAL:** Removes sports data (commented out by default)
8. **OPTIONAL:** Drops sports table entirely (commented out by default)

**Safety levels:**
- **Default (safe):** Removes only RPI-specific tables and views. Keeps sports table and data intact.
- **Level 1 (uncomment):** Also removes RPI columns from sports table
- **Level 2 (uncomment):** Also truncates sports data
- **Level 3 (uncomment):** Drops sports table entirely

---

## How to Use

### Full Safe Rollback (Recommended)

Removes RPI tables but keeps sports table with RPI columns:

```bash
psql -d your_database -f rollback_all_rpi.sql
```

This will remove:
- ✅ `rpi_calculation_runs` table
- ✅ `rpi_results` table
- ✅ `team_rpi` table
- ✅ All RPI views
- ✅ All RPI functions
- ✅ All RPI triggers

This will **keep**:
- ✅ `sports` table
- ✅ Sports data (8 sports)
- ✅ RPI columns in sports table

### Aggressive Rollback (Remove Columns)

To also remove RPI columns from sports table:

1. Edit `rollback_all_rpi.sql`
2. Uncomment "Step 4" section
3. Run the script

This will **additionally** remove:
- ❌ `display_name`, `icon`, `slug` columns
- ❌ All `default_*` coefficient columns
- ❌ `points_term`, `score_term` columns
- ❌ `show_diff`, `show_domination` columns

Sports table will revert to basic structure (id, name, created_at, updated_at).

### Nuclear Rollback (Remove Everything)

To completely remove all sports-related data:

1. Edit `rollback_all_rpi.sql`
2. Uncomment "Step 4", "Step 5", and "Step 6" sections
3. Run the script

This will **completely remove**:
- ❌ Sports table
- ❌ All sports data
- ❌ Sports sequence
- ❌ All dependent objects

---

## Rollback by Migration

If you want to rollback specific migrations only:

### Rollback Migration 03/04 (Calculation History)

```sql
-- Drop calculation history only
DROP TRIGGER IF EXISTS trigger_auto_cleanup_rpi ON fb_compete.rpi_calculation_runs CASCADE;
DROP FUNCTION IF EXISTS fb_compete.auto_cleanup_old_calculations() CASCADE;
DROP FUNCTION IF EXISTS fb_compete.cleanup_old_rpi_calculations(BIGINT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS fb_compete.compare_rpi_runs(BIGINT, BIGINT) CASCADE;
DROP VIEW IF EXISTS fb_compete.v_rpi_history CASCADE;
DROP VIEW IF EXISTS fb_compete.v_latest_rpi_by_event CASCADE;
DROP TABLE IF EXISTS fb_compete.rpi_results CASCADE;
DROP TABLE IF EXISTS fb_compete.rpi_calculation_runs CASCADE;
```

### Rollback Migration 02/03 (Team RPI)

```sql
-- Drop team_rpi table only
DROP TRIGGER IF EXISTS team_rpi_updated_at ON fb_compete.team_rpi CASCADE;
DROP FUNCTION IF EXISTS fb_compete.update_team_rpi_updated_at() CASCADE;
DROP TABLE IF EXISTS fb_compete.team_rpi CASCADE;
```

### Rollback Migration 01 (Sports RPI Config)

**⚠️ WARNING:** This is destructive to sports configuration

```sql
-- Remove RPI configuration from sports
DROP VIEW IF EXISTS fb_compete.v_events_with_sport CASCADE;
DROP TRIGGER IF EXISTS trigger_sports_updated_at ON fb_compete.sports CASCADE;
DROP FUNCTION IF EXISTS fb_compete.update_sports_updated_at() CASCADE;

-- Remove columns (DESTRUCTIVE)
ALTER TABLE fb_compete.sports 
  DROP COLUMN IF EXISTS display_name CASCADE,
  DROP COLUMN IF EXISTS icon CASCADE,
  DROP COLUMN IF EXISTS slug CASCADE,
  DROP COLUMN IF EXISTS default_clwp_coeff CASCADE,
  DROP COLUMN IF EXISTS default_oclwp_coeff CASCADE,
  DROP COLUMN IF EXISTS default_ooclwp_coeff CASCADE;
  -- ... etc
```

---

## Pre-Rollback Checklist

Before running any rollback:

1. ✅ **Backup your database**
   ```bash
   pg_dump -d your_database -f backup_before_rollback.sql
   ```

2. ✅ **Verify what will be deleted**
   ```sql
   -- Check RPI data that will be lost
   SELECT COUNT(*) FROM fb_compete.team_rpi;
   SELECT COUNT(*) FROM fb_compete.rpi_calculation_runs;
   SELECT COUNT(*) FROM fb_compete.rpi_results;
   ```

3. ✅ **Notify stakeholders** if this is production

4. ✅ **Stop any services** using RPI functionality

5. ✅ **Test on staging first** before production

---

## Post-Rollback Verification

After rollback, verify the state:

```sql
-- Check what was removed
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'fb_compete' 
  AND table_name IN ('team_rpi', 'rpi_calculation_runs', 'rpi_results');
-- Should return 0 rows

-- Check what remains
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'fb_compete' 
  AND table_name = 'sports';
-- Should return 1 row (if you kept sports table)

-- Check sports columns (if you kept table)
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'fb_compete' 
  AND table_name = 'sports'
ORDER BY ordinal_position;
```

---

## Recovery After Rollback

If you need to restore RPI functionality after rollback:

### Option 1: Re-run Migrations

```bash
# For standalone
cd ~/fastbreak/rpi/migrations-clean
psql -d your_database -f 01_create_sports_table.sql
psql -d your_database -f 02_create_team_rpi_table.sql
psql -d your_database -f 03_create_rpi_calculation_history.sql

# For compete integration
cd ~/fastbreak/rpi/migrations-integration
psql -d your_database -f 01_add_rpi_config_to_sports.sql
psql -d your_database -f 02_populate_rpi_config.sql
psql -d your_database -f 03_create_team_rpi_table.sql
psql -d your_database -f 04_create_rpi_calculation_history.sql
```

### Option 2: Restore from Backup

```bash
# Restore entire database
psql -d your_database -f backup_before_rollback.sql

# Or restore specific tables only
pg_restore -d your_database -t team_rpi backup_before_rollback.sql
```

---

## Common Rollback Scenarios

### Scenario 1: Testing Migration, Need to Start Over

**Goal:** Clean slate to test migrations again

**Solution:**
```bash
psql -d your_database -f rollback_all_rpi.sql
# Then re-run migrations
```

### Scenario 2: Bug in RPI Calculation History

**Goal:** Remove calculation history but keep base RPI functionality

**Solution:**
```sql
-- Drop only calculation history
DROP TABLE IF EXISTS fb_compete.rpi_results CASCADE;
DROP TABLE IF EXISTS fb_compete.rpi_calculation_runs CASCADE;
DROP VIEW IF EXISTS fb_compete.v_rpi_history CASCADE;
DROP VIEW IF EXISTS fb_compete.v_latest_rpi_by_event CASCADE;

-- Keep: sports table, team_rpi table
```

### Scenario 3: Moving from Standalone to Compete Integration

**Goal:** Remove standalone RPI, prepare for compete integration

**Solution:**
1. Backup RPI data (if you want to preserve it)
2. Run safe rollback
3. Run integration migrations instead

### Scenario 4: Abandoning RPI Feature Entirely

**Goal:** Complete removal of all RPI functionality

**Solution:**
1. Backup database
2. Edit `rollback_all_rpi.sql` and uncomment all optional sections
3. Run script
4. Verify all RPI objects are gone

---

## Troubleshooting

### Error: cannot drop table because other objects depend on it

**Cause:** Other tables/views have foreign keys or dependencies

**Solution:** Use `CASCADE` option:
```sql
DROP TABLE fb_compete.team_rpi CASCADE;
```

### Error: column is being used by foreign key

**Cause:** Trying to drop column that has FK constraints

**Solution:** Drop constraints first:
```sql
ALTER TABLE fb_compete.compete_event_details 
  DROP CONSTRAINT IF EXISTS fk_compete_event_details_sport_id;

-- Then drop column
ALTER TABLE fb_compete.sports DROP COLUMN id;
```

### Rollback completed but some objects still exist

**Cause:** Permissions issue or objects in different schema

**Solution:** Check schema:
```sql
-- Find all RPI-related objects
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename LIKE '%rpi%';

-- Drop with explicit schema
DROP TABLE IF EXISTS fb_compete.team_rpi CASCADE;
```

---

## Safety Best Practices

1. **Always backup before rollback**
2. **Test on staging environment first**
3. **Run verification queries before and after**
4. **Use transactions** (BEGIN/COMMIT/ROLLBACK)
5. **Document the rollback** (why, when, what was lost)
6. **Notify team members** before production rollback
7. **Have recovery plan ready**

---

## Impact Assessment

Before rollback, assess impact:

| What Gets Deleted | Data Loss | Impact | Recoverable? |
|-------------------|-----------|--------|--------------|
| `rpi_calculation_runs` | Calculation history | Historical tracking lost | No |
| `rpi_results` | Team rankings over time | Trend analysis lost | No |
| `team_rpi` | RPI values | All RPI calculations lost | No |
| Sports RPI columns | Configuration data | Need to reconfigure | Yes (re-run migrations) |
| Sports rows | Sport data | All sports deleted | Yes (re-run migrations) |
| Sports table | Everything | Complete removal | Yes (re-run migrations) |

---

## Support

For questions about rollback:
1. Review this README thoroughly
2. Check main migration documentation
3. Test on staging environment first
4. Backup before attempting on production

---

## Changelog

### 2025-11-20
- Initial rollback script created
- Added safe defaults (keeps sports table)
- Added optional aggressive rollback sections
- Comprehensive documentation added

