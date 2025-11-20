# RPI Calculator - Integration Migrations

## Overview

This directory contains migrations for **integrating RPI functionality into an existing compete database**.

These migrations are designed to be run on the **fb-amateur-compete** repo which already has:
- Basic `fb_compete.sports` table (id, name, created_at, updated_at)
- Full compete schema (events, teams, match data)
- May or may not have existing sports rows

## Migration Files

### 01_add_rpi_config_to_sports.sql
**Purpose:** Enhances the existing sports table by adding RPI configuration columns.

**What it does:**
- Adds display columns (display_name, icon, slug, description, etc.)
- Adds RPI coefficient columns (default_clwp_coeff, default_oclwp_coeff, etc.)
- Adds scoring terminology columns (points_term, score_term)
- Adds display configuration (show_diff, show_domination)
- Creates indexes for performance
- Adds foreign key from compete_event_details to sports
- Creates the `v_events_with_sport` view
- Creates trigger for auto-updating timestamps

**Assumes:**
- `fb_compete.sports` table exists with basic structure
- `fb_compete.compete_event_details` table exists
- `public.events` table exists

**Safe to run multiple times:** Yes (uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`)

---

### 02_populate_rpi_config.sql
**Purpose:** Populates sports rows with complete RPI configuration data.

**What it does:**
- Uses `INSERT ... ON CONFLICT DO UPDATE` (UPSERT)
- Handles both scenarios:
  - Sports rows don't exist → Creates them
  - Sports rows exist → Updates them with RPI config
- Populates all 8 sports with:
  - Display info (name, icon, slug)
  - RPI coefficients (custom per sport)
  - Minimum game requirements
  - Point differential intervals
  - Scoring terminology

**Sports Configured:**
1. Baseball (⚾) - NCAA 25-50-25
2. Soccer (⚽) - NCAA 25-50-25 with ties
3. Football (🏈) - Custom 35-40-25
4. Volleyball (🏐) - NCAA 25-50-25
5. Basketball (🏀) - Custom 90-10-10
6. Hockey (🏒) - Similar to Soccer
7. Lacrosse (🥍) - Hybrid 30-45-25
8. Pickleball (🏓) - Similar to Volleyball

**Safe to run multiple times:** Yes (uses `ON CONFLICT` to update existing rows)

---

### 03_create_team_rpi_table.sql
**Purpose:** Creates the table for storing historical RPI values.

**Identical to:** `migrations-clean/02_create_team_rpi_table.sql`

**Creates:**
- `fb_compete.team_rpi` table
- Indexes and triggers
- Foreign keys to teams and sports

**Dependencies:**
- Requires migrations 01 and 02 to be run first
- Requires `fb_compete.teams` table

---

### 04_create_rpi_calculation_history.sql
**Purpose:** Creates advanced RPI calculation history tracking.

**Identical to:** `migrations-clean/03_create_rpi_calculation_history.sql`

**Creates:**
- `rpi_calculation_runs` table
- `rpi_results` table
- Views for querying history
- Utility functions
- Auto-cleanup trigger

**Dependencies:**
- Requires migrations 01, 02, and 03 to be run first

---

## Migration Order

**CRITICAL:** Run migrations in numeric order:

```bash
# In the compete repo: fb-amateur-compete/supabase/migrations/

# 1. Add RPI columns to existing sports table
psql -f 01_add_rpi_config_to_sports.sql

# 2. Populate sports with RPI configuration
psql -f 02_populate_rpi_config.sql

# 3. Create team RPI storage
psql -f 03_create_team_rpi_table.sql

# 4. Create calculation history tracking
psql -f 04_create_rpi_calculation_history.sql
```

**OR** if using Supabase CLI:

```bash
# Copy to compete migrations folder with proper timestamp
cd ~/fastbreak/fb-amateur-compete/supabase/migrations/

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Copy files
cp ~/fastbreak/rpi/migrations-integration/01_add_rpi_config_to_sports.sql \
   ${TIMESTAMP}_01_add_rpi_config_to_sports.sql

cp ~/fastbreak/rpi/migrations-integration/02_populate_rpi_config.sql \
   ${TIMESTAMP}_02_populate_rpi_config.sql

cp ~/fastbreak/rpi/migrations-integration/03_create_team_rpi_table.sql \
   ${TIMESTAMP}_03_create_team_rpi_table.sql

cp ~/fastbreak/rpi/migrations-integration/04_create_rpi_calculation_history.sql \
   ${TIMESTAMP}_04_create_rpi_calculation_history.sql

# Run migrations
supabase db reset  # or
supabase db push
```

---

## Pre-Migration State

### What Exists in Compete Repo

From `20250818205934_compete-init-trimmed.sql`:

```sql
CREATE TABLE IF NOT EXISTS "fb_compete"."sports" (
    "id" bigint NOT NULL,
    "name" character varying(64) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);
```

**No sports rows exist by default** - they must be created manually or through migrations.

### What Gets Added

After running integration migrations:

```sql
-- New columns added:
display_name VARCHAR(100)
icon VARCHAR(10)
slug VARCHAR(50)
description TEXT
is_active BOOLEAN
sort_order INTEGER

-- RPI configuration columns:
default_clwp_coeff DECIMAL(4,3)
default_oclwp_coeff DECIMAL(4,3)
default_ooclwp_coeff DECIMAL(4,3)
default_diff_coeff DECIMAL(4,3)
default_domination_coeff DECIMAL(4,3)
default_clgw_step DECIMAL(4,3)
default_clgl_step DECIMAL(4,3)
default_min_games INTEGER
default_diff_interval INTEGER

-- Terminology columns:
points_term VARCHAR(20)
score_term VARCHAR(20)

-- Display configuration:
show_diff BOOLEAN
show_domination BOOLEAN
```

---

## Comparison with Clean Migrations

| Aspect | Clean Migrations | Integration Migrations |
|--------|------------------|------------------------|
| **Target** | New/standalone database | Existing compete database |
| **Sports Table** | Creates from scratch | Enhances existing table |
| **Sports Data** | Inserts with `ON CONFLICT DO NOTHING` | Upserts with `ON CONFLICT DO UPDATE` |
| **Files** | 3 files | 4 files |
| **Migration 1** | Create + populate sports | Add columns only |
| **Migration 2** | Create team_rpi | Populate sports data |
| **Migration 3** | Create history | Create team_rpi |
| **Migration 4** | N/A | Create history |

---

## Verification Queries

After running all migrations:

```sql
-- 1. Verify RPI columns were added
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'fb_compete' 
  AND table_name = 'sports' 
  AND column_name LIKE 'default_%';
-- Expected: 9 rows

-- 2. Verify sports are configured
SELECT id, display_name, icon, slug,
       CONCAT(default_clwp_coeff, '-', default_oclwp_coeff, '-', default_ooclwp_coeff) as formula
FROM fb_compete.sports
ORDER BY sort_order;
-- Expected: 8 rows with complete data

-- 3. Verify view exists
SELECT event_id, sport_display_name, sport_icon, default_clwp_coeff
FROM fb_compete.v_events_with_sport
WHERE sport_id IS NOT NULL
LIMIT 5;

-- 4. Verify team_rpi table exists
\d fb_compete.team_rpi

-- 5. Verify history tables exist
\d fb_compete.rpi_calculation_runs
\d fb_compete.rpi_results
```

---

## Rollback

To rollback these migrations:

```sql
-- Rollback 04: Drop history tables
DROP TRIGGER IF EXISTS trigger_auto_cleanup_rpi ON fb_compete.rpi_calculation_runs;
DROP FUNCTION IF EXISTS fb_compete.auto_cleanup_old_calculations();
DROP FUNCTION IF EXISTS fb_compete.cleanup_old_rpi_calculations(BIGINT, INTEGER);
DROP FUNCTION IF EXISTS fb_compete.compare_rpi_runs(BIGINT, BIGINT);
DROP VIEW IF EXISTS fb_compete.v_rpi_history;
DROP VIEW IF EXISTS fb_compete.v_latest_rpi_by_event;
DROP TABLE IF EXISTS fb_compete.rpi_results;
DROP TABLE IF EXISTS fb_compete.rpi_calculation_runs;

-- Rollback 03: Drop team_rpi
DROP TRIGGER IF EXISTS team_rpi_updated_at ON fb_compete.team_rpi;
DROP FUNCTION IF EXISTS fb_compete.update_team_rpi_updated_at();
DROP TABLE IF EXISTS fb_compete.team_rpi;

-- Rollback 02: Clear sports data (optional - depends on if you want to keep sports)
-- TRUNCATE fb_compete.sports;  -- Only if you want to remove sport data

-- Rollback 01: Remove RPI columns (WARNING: destructive)
-- ALTER TABLE fb_compete.sports DROP COLUMN IF EXISTS display_name;
-- ALTER TABLE fb_compete.sports DROP COLUMN IF EXISTS icon;
-- ... etc for all added columns
```

**Note:** Full rollback of migration 01 is destructive. Consider carefully before removing columns.

---

## Integration with Compete Repo

### File Placement

Copy these migrations to the compete repo:

```bash
# Source: ~/fastbreak/rpi/migrations-integration/
# Target: ~/fastbreak/fb-amateur-compete/supabase/migrations/

# Use proper timestamp (later than existing migrations)
# Current latest: 20251119153441_create_team_rpi_table.sql
# Suggested: 20251120000000_xx_xxx.sql or later
```

### Git Workflow

In compete repo:

```bash
cd ~/fastbreak/fb-amateur-compete

# Copy migrations
cp ~/fastbreak/rpi/migrations-integration/*.sql supabase/migrations/

# Rename with timestamps
# ... (see Migration Order section above)

# Add to git
git add supabase/migrations/20251120*

# Commit
git commit -m "feat: Add RPI calculator integration migrations

- Add RPI configuration columns to sports table
- Populate sports with NCAA-compliant RPI coefficients
- Create team_rpi table for historical tracking
- Create rpi_calculation_runs and rpi_results for advanced history
- Add views for easy querying (v_events_with_sport, v_latest_rpi_by_event, v_rpi_history)

Integrates standalone RPI calculator functionality into compete database."
```

---

## Troubleshooting

### Error: column already exists
**Cause:** Migration 01 has already been run partially
**Solution:** Safe to continue - migration uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`

### Error: duplicate key value violates unique constraint "sports_pkey"
**Cause:** Sports rows already exist with those IDs
**Solution:** This is expected and handled by `ON CONFLICT DO UPDATE` in migration 02

### Foreign key violation when updating compete_event_details
**Cause:** Some events have invalid sport_ids
**Solution:** Migration 01 handles this automatically by setting invalid sport_ids to NULL

### View creation fails
**Cause:** Required tables don't exist
**Solution:** Ensure base compete schema is fully migrated before running these migrations

---

## Testing

After integration, test:

1. **Query sports with RPI config:**
```sql
SELECT * FROM fb_compete.sports WHERE id = 2; -- Soccer
-- Should show icon, slug, coefficients
```

2. **Insert a test RPI value:**
```sql
INSERT INTO fb_compete.team_rpi (team_id, sport_id, value)
VALUES (1, 2, 0.6543);
-- Should succeed if team 1 exists
```

3. **Create a test calculation run:**
```sql
INSERT INTO fb_compete.rpi_calculation_runs 
  (event_id, sport_id, clwp_coeff, oclwp_coeff, ooclwp_coeff, 
   diff_coeff, domination_coeff, total_teams, total_matches, matches_with_scores)
VALUES (1, 2, 0.25, 0.50, 0.25, 0.08, 1.0, 10, 20, 20)
RETURNING id;
-- Should succeed if event 1 exists
```

---

## Next Steps

After running these migrations in compete repo:

1. **Deploy to staging** - Test RPI calculations with real event data
2. **Update API routes** - Ensure RPI endpoints use new tables
3. **Update frontend** - Point to compete database instead of standalone
4. **Test calculations** - Verify RPI values match expected results
5. **Monitor performance** - Check query speed with indexes
6. **Set up backups** - Ensure RPI history is included in backups

---

## Support

For questions:
- Check main RPI repo: `~/fastbreak/rpi/docs/`
- Review compete integration docs
- See database schema documentation
