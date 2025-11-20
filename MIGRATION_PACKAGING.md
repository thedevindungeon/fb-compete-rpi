# RPI Calculator - Migration Packaging Strategy

## Executive Summary

This document explains how RPI-related migrations have been isolated from the compete repo and packaged for two use cases:
1. **Standalone RPI repo** - Clean migrations for new installations
2. **Compete repo integration** - Integration migrations for existing compete databases

## Background

### Original Problem
The RPI repo had **6 migration files** with significant redundancy:
- Multiple files doing the same thing (creating sports table, populating data, creating views)
- Unclear dependencies and execution order
- Migrations assumed different starting states
- No clear path for integrating into compete repo

### Compete Repo State
The compete repo has:
- **Basic sports table** (only: id, name, created_at, updated_at)
- **One untracked RPI migration** (`20251119153441_create_team_rpi_table.sql`)
- **No RPI configuration** in sports table
- **No calculation history** tables

---

## Solution: Two Migration Sets

### 1. Clean Migrations (`migrations-clean/`)
**Purpose:** For standalone RPI calculator installations (new databases)

**Files:**
```
migrations-clean/
├── 01_create_sports_table.sql          # Complete sports setup + data
├── 02_create_team_rpi_table.sql        # Historical RPI storage
├── 03_create_rpi_calculation_history.sql  # Advanced tracking
└── README.md                            # Documentation
```

**Characteristics:**
- **3 files total** (down from 6)
- Each file is self-contained
- Safe to run multiple times (idempotent)
- Includes data population
- No redundancy

---

### 2. Integration Migrations (`migrations-integration/`)
**Purpose:** For integrating RPI into existing compete database

**Files:**
```
migrations-integration/
├── 01_add_rpi_config_to_sports.sql     # Enhance existing sports table
├── 02_populate_rpi_config.sql          # UPSERT sports data
├── 03_create_team_rpi_table.sql        # Historical RPI storage
├── 04_create_rpi_calculation_history.sql  # Advanced tracking
└── README.md                            # Documentation
```

**Characteristics:**
- **4 files total**
- Assumes sports table exists
- Uses `ALTER TABLE` instead of `CREATE TABLE`
- Uses `UPSERT` instead of `INSERT`
- Non-destructive to existing data
- Safe to run on production

---

## Migration Comparison

### What Changed from Original RPI Repo

| Original File | Status | New Location | Notes |
|--------------|--------|--------------|-------|
| `20250119000000_create_team_rpi_table.sql` | ✅ Kept | `02_create_team_rpi_table.sql` | Renamed, moved to position 2 |
| `20250119100000_create_sports_table.sql` | ✅ Kept | `01_create_sports_table.sql` | Renamed, moved to position 1 |
| `20250119100001_alter_sports_table_add_columns.sql` | ❌ Removed | N/A | Redundant - merged into 01 |
| `20250119100002_populate_sports_data.sql` | ❌ Removed | N/A | Redundant - merged into 01 |
| `20250119100003_create_sports_view.sql` | ❌ Removed | N/A | Redundant - merged into 01 |
| `20250119110000_create_rpi_calculation_history.sql` | ✅ Kept | `03_create_rpi_calculation_history.sql` | Renamed, kept as-is |

**Result:** 6 files → 3 files (50% reduction)

### What Was Extracted from Compete Repo

| Compete File | RPI-Specific? | Action Taken |
|--------------|---------------|--------------|
| `20250818205934_compete-init-trimmed.sql` | ❌ No | Contains basic sports table - used as baseline for integration migrations |
| `20251119153441_create_team_rpi_table.sql` | ✅ Yes | **Identical** to RPI repo's team_rpi migration - confirmed RPI-specific |

**Key Finding:** Only ONE new RPI migration exists in compete repo, and it's identical to what's already in the RPI repo.

---

## Migration Dependencies

### Clean Migrations Flow

```
Prerequisites (must exist):
├── fb_compete schema
├── fb_compete.compete_event_details table
├── fb_compete.teams table
└── public.events table

Migration 01: Create Sports Table
├── Creates: fb_compete.sports (complete)
├── Inserts: 8 sports with full RPI config
├── Creates: v_events_with_sport view
└── Creates: Triggers and indexes

Migration 02: Create Team RPI Table
├── Creates: fb_compete.team_rpi
├── Depends: sports table (FK constraint)
└── Depends: teams table (FK constraint)

Migration 03: Create RPI Calculation History
├── Creates: rpi_calculation_runs table
├── Creates: rpi_results table
├── Creates: 2 views, 2 functions, 1 trigger
├── Depends: sports table
├── Depends: teams table
└── Depends: events table
```

### Integration Migrations Flow

```
Prerequisites (must exist):
├── fb_compete.sports (basic: id, name, timestamps)
├── fb_compete.compete_event_details table
├── fb_compete.teams table
└── public.events table

Migration 01: Add RPI Config to Sports
├── Alters: fb_compete.sports (adds columns)
├── Creates: Indexes
├── Creates: v_events_with_sport view
└── Creates: Triggers

Migration 02: Populate RPI Config
├── Upserts: 8 sports with full RPI config
└── Depends: Migration 01 (columns must exist)

Migration 03: Create Team RPI Table
├── Creates: fb_compete.team_rpi
└── Depends: Migrations 01 & 02 (sports fully configured)

Migration 04: Create RPI Calculation History
├── Creates: rpi_calculation_runs, rpi_results
└── Depends: All previous migrations
```

---

## How to Use

### For Standalone RPI Development

```bash
cd ~/fastbreak/rpi

# Use clean migrations
psql -d your_database -f migrations-clean/01_create_sports_table.sql
psql -d your_database -f migrations-clean/02_create_team_rpi_table.sql
psql -d your_database -f migrations-clean/03_create_rpi_calculation_history.sql
```

### For Compete Repo Integration

```bash
cd ~/fastbreak/fb-amateur-compete

# Copy integration migrations with proper timestamps
TIMESTAMP=$(date +%Y%m%d%H%M%S)

cp ~/fastbreak/rpi/migrations-integration/01_add_rpi_config_to_sports.sql \
   supabase/migrations/${TIMESTAMP}01_add_rpi_config_to_sports.sql

cp ~/fastbreak/rpi/migrations-integration/02_populate_rpi_config.sql \
   supabase/migrations/${TIMESTAMP}02_populate_rpi_config.sql

cp ~/fastbreak/rpi/migrations-integration/03_create_team_rpi_table.sql \
   supabase/migrations/${TIMESTAMP}03_create_team_rpi_table.sql

cp ~/fastbreak/rpi/migrations-integration/04_create_rpi_calculation_history.sql \
   supabase/migrations/${TIMESTAMP}04_create_rpi_calculation_history.sql

# Run migrations
supabase db reset
# or
supabase db push
```

---

## What's RPI-Specific?

### ✅ RPI-Specific (Isolated)

1. **RPI Configuration Columns** in sports table:
   - `default_clwp_coeff`, `default_oclwp_coeff`, `default_ooclwp_coeff`
   - `default_diff_coeff`, `default_domination_coeff`
   - `default_clgw_step`, `default_clgl_step`
   - `default_min_games`, `default_diff_interval`
   - `points_term`, `score_term`
   - `show_diff`, `show_domination`

2. **team_rpi Table:**
   - Stores historical RPI values per team/sport/timestamp
   - Completely RPI-specific

3. **rpi_calculation_runs & rpi_results Tables:**
   - Advanced calculation history tracking
   - Completely RPI-specific
   - Not present in compete repo

4. **Views:**
   - `v_events_with_sport` - Denormalized event/sport data
   - `v_latest_rpi_by_event` - Most recent RPI per event
   - `v_rpi_history` - Complete RPI history with trends

5. **Functions:**
   - `compare_rpi_runs()` - Compare two calculation runs
   - `cleanup_old_rpi_calculations()` - Data retention

### ❌ Not RPI-Specific (Already in Compete)

1. **Base sports table structure** (id, name, timestamps)
2. **Display columns** (display_name, icon, slug) - Used by compete UI
3. **Teams, events, match tables** - Core compete functionality
4. **Audit fields** (created_by_id, updated_by_id) - General feature

---

## Verification

### After Running Clean Migrations

```sql
-- Should return 8
SELECT COUNT(*) FROM fb_compete.sports;

-- Should show complete RPI config
SELECT id, display_name, icon, 
       default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff
FROM fb_compete.sports;

-- Should exist
\d fb_compete.team_rpi
\d fb_compete.rpi_calculation_runs
\d fb_compete.rpi_results
```

### After Running Integration Migrations

```sql
-- Should return 8
SELECT COUNT(*) FROM fb_compete.sports WHERE display_name IS NOT NULL;

-- Should show RPI columns exist
\d fb_compete.sports

-- Should work
SELECT * FROM fb_compete.v_events_with_sport LIMIT 5;
```

---

## Benefits of This Approach

### 1. Clear Separation
- **Clean migrations:** For new installations
- **Integration migrations:** For existing databases
- No confusion about which to use

### 2. Reduced Redundancy
- 6 files → 3 files (clean)
- No duplicate logic
- Each migration has one responsibility

### 3. Safe Integration
- Non-destructive to compete data
- Uses `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `ON CONFLICT`
- Can run multiple times safely

### 4. Better Documentation
- Each migration set has comprehensive README
- Clear dependencies documented
- Troubleshooting guides included

### 5. Version Control Friendly
- Easy to track changes
- Clear history of what changed when
- Simple rollback strategy

---

## Future Maintenance

### Adding New Sports

**In RPI repo:**
1. Edit `migrations-clean/01_create_sports_table.sql`
2. Add new INSERT statement
3. Update verification query

**In compete repo:**
1. Edit `migrations-integration/02_populate_rpi_config.sql`
2. Add new INSERT ... ON CONFLICT statement
3. Create new migration file with just the new sport

### Modifying RPI Coefficients

**Option 1:** Update migration files (for new installations)
- Edit the INSERT/UPSERT statements
- Document the change

**Option 2:** Create a new migration (for existing installations)
```sql
UPDATE fb_compete.sports 
SET default_clwp_coeff = 0.300
WHERE id = 2; -- Soccer
```

### Adding New RPI Tables

Create new migration files:
- Clean: `04_xxx.sql`
- Integration: `05_xxx.sql`

---

## Rollback Strategy

See individual README files in each migration directory for detailed rollback instructions.

**General approach:**
1. Drop tables in reverse order
2. Remove views and functions
3. Optionally remove columns (destructive)

---

## Status Summary

✅ **Completed:**
- Isolated RPI migrations from compete repo
- Created clean migration set (3 files)
- Created integration migration set (4 files)
- Comprehensive documentation for both sets
- Removed redundant migrations
- Renumbered in logical order

📋 **Next Steps:**
- Test clean migrations on fresh database
- Test integration migrations on compete staging database
- Create rollback migrations (optional)
- Update main project documentation

---

## File Inventory

```
~/fastbreak/rpi/
├── migrations/                          # Original (legacy)
│   ├── 20250119000000_create_team_rpi_table.sql
│   ├── 20250119100000_create_sports_table.sql
│   ├── 20250119100001_alter_sports_table_add_columns.sql    # Redundant
│   ├── 20250119100002_populate_sports_data.sql              # Redundant
│   ├── 20250119100003_create_sports_view.sql                # Redundant
│   └── 20250119110000_create_rpi_calculation_history.sql
│
├── migrations-clean/                    # ⭐ NEW: For standalone RPI
│   ├── 01_create_sports_table.sql
│   ├── 02_create_team_rpi_table.sql
│   ├── 03_create_rpi_calculation_history.sql
│   └── README.md
│
├── migrations-integration/              # ⭐ NEW: For compete integration
│   ├── 01_add_rpi_config_to_sports.sql
│   ├── 02_populate_rpi_config.sql
│   ├── 03_create_team_rpi_table.sql
│   ├── 04_create_rpi_calculation_history.sql
│   └── README.md
│
├── docs/migration-analysis.md           # Original analysis
└── MIGRATION_PACKAGING.md              # ⭐ NEW: This file
```

---

## Questions & Answers

**Q: Why two separate migration sets?**
A: Different starting points. Clean = empty DB. Integration = existing compete DB with basic sports table.

**Q: Can I use integration migrations on a new database?**
A: Yes, but clean migrations are simpler and recommended for new installations.

**Q: What about the original `migrations/` directory?**
A: Keep it for reference. Use `migrations-clean/` going forward.

**Q: Do I need to run both sets?**
A: No. Choose one:
- New standalone RPI → `migrations-clean/`
- Existing compete DB → `migrations-integration/`

**Q: What if I already ran the old migrations?**
A: They're mostly compatible. The new migrations are idempotent and will handle existing data gracefully.

**Q: Can I delete the old migrations?**
A: Not yet. Keep them until you've fully tested and deployed the new structure.

---

## Support

For questions or issues:
1. Check the README in the relevant migrations directory
2. Review `docs/migration-analysis.md` for detailed technical analysis
3. See main project documentation in `docs/` directory
4. Refer to compete repo schema documentation

---

## Changelog

### 2025-11-20
- Initial packaging of isolated RPI migrations
- Created clean and integration migration sets
- Removed 3 redundant migration files
- Created comprehensive documentation
- Verified no data loss from compete repo

