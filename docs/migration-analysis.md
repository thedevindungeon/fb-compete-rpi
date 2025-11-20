# RPI Migration Analysis

## Overview
This document analyzes the RPI-related migrations from the compete repo and outlines a strategy for packaging them in the standalone RPI repo.

## Compete Repo Migration Timeline

### Base Schema (20250818205934_compete-init-trimmed.sql)
- Creates `fb_compete.sports` table with minimal schema:
  - `id` (bigint)
  - `name` (varchar(64))
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
- Does NOT populate any sports data
- Creates sequence and grants permissions

### Audit Fields (20250912125034_add_audit_fields_and_triggers.sql)
- Adds `created_by_id` and `updated_by_id` to sports table
- Adds foreign keys to `users` table
- **NOT RPI-specific** - general audit functionality

### RLS Enablement (20250912182416_base_compete_rls.sql)
- Enables Row Level Security on sports table
- **NOT RPI-specific** - general security functionality

### RPI Table (20251119153441_create_team_rpi_table.sql)
- Creates `fb_compete.team_rpi` table
- Stores historical RPI values per team/sport/timestamp
- **RPI-SPECIFIC**

## RPI Repo Current Migrations

### 1. 20250119000000_create_team_rpi_table.sql
- **IDENTICAL** to compete repo's 20251119153441
- Creates `fb_compete.team_rpi` with:
  - Foreign key to `teams(id)`
  - Stores: value, generated_at, sport_id
  - Audit fields: created_at, updated_at, deleted_at, active
  - Indexes and trigger

### 2. 20250119100000_create_sports_table.sql
- **COMPREHENSIVE** sports table creation
- Creates table with ALL RPI configuration columns
- **INCLUDES** data population (INSERT 8 sports)
- Much more complete than compete repo's base schema
- Includes:
  - Display fields (display_name, icon, slug)
  - RPI coefficients (all default_* columns)
  - Terminology (points_term, score_term)
  - Display config (show_diff, show_domination)
  - Foreign key constraint to compete_event_details
  - Triggers and functions
  - View creation (v_events_with_sport)

### 3. 20250119100001_alter_sports_table_add_columns.sql
- **ALTERNATIVE APPROACH** - adds columns to existing table
- Assumes sports table already exists with basic schema
- Adds all RPI configuration columns
- **REDUNDANT** if migration #2 is used

### 4. 20250119100002_populate_sports_data.sql
- **UPDATES** existing sports rows (1-8)
- Assumes sports rows already exist with those IDs
- Sets display_name, icon, slug, RPI coefficients, etc.

### 5. 20250119100003_create_sports_view.sql
- Creates `v_events_with_sport` view
- **REDUNDANT** - already in migration #2

### 6. 20250119110000_create_rpi_calculation_history.sql
- **COMPREHENSIVE** RPI history tracking
- Creates:
  - `rpi_calculation_runs` (metadata)
  - `rpi_results` (compact rankings storage)
  - Views: `v_latest_rpi_by_event`, `v_rpi_history`
  - Functions: `compare_rpi_runs`, `cleanup_old_rpi_calculations`
  - Auto-cleanup trigger
- **NOT IN COMPETE REPO** - RPI-specific advanced feature

## Key Differences

### Compete Repo Approach
1. **Minimal base schema** - sports table created with just id, name, timestamps
2. **No data population** - sports must be added separately
3. **Simple RPI storage** - just team_rpi table
4. **No history tracking** - only current RPI values

### RPI Repo Approach
1. **Comprehensive schema** - sports table created with all RPI config
2. **Data pre-populated** - 8 sports inserted with full config
3. **Advanced RPI storage** - team_rpi + calculation history
4. **Full history tracking** - runs, results, comparisons, cleanup

## Conflicts and Redundancies

### Migration Structure Issues
- **#2 vs #3+#4+#5**: Two different approaches
  - Option A: Migration #2 does everything (CREATE + INSERT)
  - Option B: Migrations #3+#4+#5 (ALTER + UPDATE + VIEW)
- **#2 includes #5**: View is created in both migrations

### Dependency Problems
- Migrations assume different starting states:
  - #2: No sports table exists
  - #3: Sports table exists with basic schema
  - #4: Sports rows 1-8 already exist

## Recommended Solution

### Option 1: Clean Slate (Recommended)
Use for **new RPI installations** where no database exists.

**Keep migrations:**
1. `01_create_sports_table.sql` - Comprehensive (current #2)
2. `02_create_team_rpi_table.sql` - Team RPI storage (current #1)
3. `03_create_rpi_calculation_history.sql` - Advanced history (current #6)

**Remove migrations:**
- #3 (alter_sports_table) - redundant
- #4 (populate_sports_data) - redundant
- #5 (create_sports_view) - redundant

### Option 2: Integrate with Compete
Use for **integrating RPI into existing compete repo**.

**New migration files needed:**
1. `add_rpi_config_to_sports.sql` - Add columns to existing sports table
2. `populate_rpi_config.sql` - Update existing sports with RPI config
3. `create_rpi_calculation_history.sql` - Add history tracking

**Assumptions:**
- Sports table already exists (from compete-init)
- Sports rows may or may not exist
- Need to be non-destructive

## Migration Dependencies

```
For Clean Slate (RPI Repo):
├── 01_create_sports_table
│   └── Creates: sports table + data + view
├── 02_create_team_rpi_table
│   └── Depends: sports table (for sport_id FK)
└── 03_create_rpi_calculation_history
    └── Depends: sports, events, teams tables

For Compete Integration:
├── Base: compete-init (sports table exists)
├── add_rpi_config_to_sports
│   └── Alters existing sports table
├── populate_rpi_config
│   └── Updates existing sports rows
├── create_team_rpi_table
│   └── Depends: sports, teams tables
└── create_rpi_calculation_history
    └── Depends: sports, events, teams tables
```

## External Dependencies

Both approaches require these tables to exist:
- `public.events` - From base Supabase/compete schema
- `fb_compete.teams` - From compete schema
- `fb_compete.compete_event_details` - From compete schema
- `users` - From Supabase auth (optional, for audit fields)

## Recommendations

1. **For RPI Standalone Repo:**
   - Keep: migrations 2, 1, 6 (renumber to 1, 2, 3)
   - Remove: migrations 3, 4, 5
   - Add: Documentation about required external tables
   - Add: Optional migration for audit fields (if users table exists)

2. **For Compete Repo Integration:**
   - Create new migration: `20251120000000_add_rpi_complete.sql`
   - This should:
     - Check if sports table has RPI columns
     - Add columns if missing
     - Update sports rows with RPI config
     - Create team_rpi table
     - Create calculation history tables

3. **For Both:**
   - Document the schema differences
   - Provide rollback migrations
   - Add validation queries to confirm successful migration

## Next Steps

1. Create cleaned-up migration set for RPI repo
2. Create integration migration for compete repo
3. Add schema validation queries
4. Update documentation
5. Test migrations on clean database
6. Test migrations on compete database

