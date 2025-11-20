# RPI Migrations - Quick Reference Guide

## 🎯 Quick Decision Tree

**Question:** Do you have an existing compete database with `fb_compete.sports`?

- **NO** → Use [`/migrations-clean`](#clean-migrations-new-installation) (3 files, run in order)
- **YES** → Use [`/migrations-integration`](#integration-migration-existing-database) (1 file, idempotent)

## 📁 Directory Structure

```
/migrations/                    ← OLD (keep for reference, has redundancies)
/migrations-clean/             ← NEW for standalone installations
/migrations-integration/       ← NEW for compete database integration
/docs/migration-analysis.md    ← Technical deep-dive
/MIGRATION_SUMMARY.md          ← Complete overview
```

## 🆕 Clean Migrations (New Installation)

**Location:** `/migrations-clean/`

**When:** Fresh database, no compete schema exists

**Files (run in order):**
```bash
1. 01_create_sports_table.sql             # Sports + RPI config + data
2. 02_create_team_rpi_table.sql          # Historical RPI values
3. 03_create_rpi_calculation_history.sql  # Advanced tracking
```

**Quick Start:**
```bash
psql -d your_db -f migrations-clean/01_create_sports_table.sql
psql -d your_db -f migrations-clean/02_create_team_rpi_table.sql
psql -d your_db -f migrations-clean/03_create_rpi_calculation_history.sql
```

**Creates:**
- `fb_compete.sports` (8 sports with full RPI config)
- `fb_compete.team_rpi` (historical values)
- `fb_compete.rpi_calculation_runs` (calculation metadata)
- `fb_compete.rpi_results` (detailed rankings)
- 2+ views for querying
- 4+ utility functions

**Note:** Foreign keys to external tables (teams, events) are commented out by default.

## 🔌 Integration Migration (Existing Database)

**Location:** `/migrations-integration/`

**When:** Compete database already exists with base schema

**File:**
```bash
compete_add_rpi_complete.sql    # Single comprehensive migration
```

**Quick Start:**
```bash
psql -d compete_db -f migrations-integration/compete_add_rpi_complete.sql
```

**Features:**
- ✅ Idempotent (safe to rerun)
- ✅ Non-destructive (preserves existing data)
- ✅ All foreign keys enabled
- ✅ Handles both INSERT and UPDATE cases
- ✅ Conditional view creation
- ✅ Inline verification

## 📊 What Gets Created

### Tables
| Table | Purpose | Records |
|-------|---------|---------|
| `fb_compete.sports` | Sport types + RPI config | 8 rows |
| `fb_compete.team_rpi` | Historical RPI values | Many (over time) |
| `fb_compete.rpi_calculation_runs` | Calculation metadata | Many (1 per run) |
| `fb_compete.rpi_results` | Detailed rankings | Many (teams × runs) |

### Views
- `v_latest_rpi_by_event` - Most recent RPI per event
- `v_rpi_history` - Historical trends with LAG
- `v_events_with_sport` - Events + sport config (conditional)

### Functions
- `compare_rpi_runs(id1, id2)` - Compare two runs
- `cleanup_old_rpi_calculations(event_id, keep_count)` - Data retention

## 🔍 Verification

After running migrations:

```sql
-- Check sports (should return 8)
SELECT COUNT(*) FROM fb_compete.sports;

-- List all RPI tables
\dt fb_compete.*rpi*

-- List all RPI views
\dv fb_compete.*rpi*

-- Check sports configuration
SELECT id, display_name, icon, 
       CONCAT(default_clwp_coeff, '-', default_oclwp_coeff, '-', default_ooclwp_coeff) as formula
FROM fb_compete.sports
ORDER BY id;
```

## 🎨 Sports Configured

| ID | Sport | Icon | Formula | Min Games |
|----|-------|------|---------|-----------|
| 1 | Baseball | ⚾ | 0.25-0.50-0.25 | 5 |
| 2 | Soccer | ⚽ | 0.25-0.50-0.25 | 4 |
| 3 | Football | 🏈 | 0.35-0.40-0.25 | 3 |
| 4 | Volleyball | 🏐 | 0.25-0.50-0.25 | 5 |
| 5 | Basketball | 🏀 | 0.90-0.10-0.10 | 4 |
| 6 | Hockey | 🏒 | 0.25-0.50-0.25 | 4 |
| 7 | Lacrosse | 🥍 | 0.30-0.45-0.25 | 4 |
| 8 | Pickleball | 🏓 | 0.25-0.50-0.25 | 6 |

## 🔗 Dependencies

Both migration sets require these external tables:

**Required for full functionality:**
- `fb_compete.teams` - Team information
- `public.events` - Event information

**Optional:**
- `fb_compete.compete_event_details` - For event/sport linking
- `users` - For audit trail fields

**In clean migrations:** Foreign keys are commented out  
**In integration:** Foreign keys are enabled

## 🔄 Enabling Foreign Keys (Clean Migrations)

After creating dependent tables, uncomment these:

**In `02_create_team_rpi_table.sql`:**
```sql
-- Uncomment this:
CONSTRAINT fk_team_rpi_team_id 
  FOREIGN KEY (team_id) REFERENCES fb_compete.teams(id) ON DELETE CASCADE
```

**In `03_create_rpi_calculation_history.sql`:**
```sql
-- Uncomment these:
CONSTRAINT fk_rpi_runs_event FOREIGN KEY (event_id) 
  REFERENCES public.events(id) ON DELETE CASCADE,
CONSTRAINT fk_rpi_runs_user FOREIGN KEY (calculated_by_user_id)
  REFERENCES users(id) ON DELETE SET NULL
```

## 📝 Usage Examples

### View Latest RPI Rankings
```sql
SELECT event_id, team_name, rank, rpi, wins, losses
FROM fb_compete.v_latest_rpi_by_event
WHERE event_id = 123
ORDER BY rank;
```

### Compare Two Calculation Runs
```sql
SELECT * FROM fb_compete.compare_rpi_runs(1001, 1002);
```

### Track Team's RPI History
```sql
SELECT calculated_at, rank, rpi, 
       rank - previous_rank as movement
FROM fb_compete.v_rpi_history
WHERE team_id = 456
ORDER BY calculated_at DESC;
```

### Cleanup Old Calculations
```sql
-- Keep only last 10 for event 123
SELECT fb_compete.cleanup_old_rpi_calculations(123, 10);
```

## 🚨 Rollback

**Clean Migrations:**
```sql
-- Run in reverse order
DROP TABLE fb_compete.rpi_results CASCADE;
DROP TABLE fb_compete.rpi_calculation_runs CASCADE;
DROP TABLE fb_compete.team_rpi CASCADE;
DROP TABLE fb_compete.sports CASCADE;
DROP SCHEMA fb_compete CASCADE;
```

**Integration Migration:**
```sql
-- Same as above, but DON'T drop sports table if compete needs it
-- Only drop RPI-specific tables/columns
```

See individual README files for complete rollback instructions.

## 📚 Documentation Links

- **[MIGRATION_SUMMARY.md](../MIGRATION_SUMMARY.md)** - Complete overview
- **[migration-analysis.md](./migration-analysis.md)** - Technical deep-dive
- **[migrations-clean/README.md](../migrations-clean/README.md)** - Clean migrations guide
- **[migrations-integration/README.md](../migrations-integration/README.md)** - Integration guide

## 🆚 Old vs New

| Aspect | Old `/migrations` | New `/migrations-clean` | New `/migrations-integration` |
|--------|------------------|------------------------|------------------------------|
| Files | 6 | 3 | 1 |
| Redundancy | Yes | No | No |
| Documentation | Minimal | Extensive | Extensive |
| Use Case | Unclear | New installs | Existing compete DB |
| Idempotent | Partial | Partial | Full |
| Foreign Keys | All enabled | Commented out | All enabled |

## ✅ Checklist

### Before Running Migrations

- [ ] Decided between clean vs integration
- [ ] Database backup created
- [ ] Dependencies verified (if any)
- [ ] Reviewed README for chosen migration set

### After Running Migrations

- [ ] Verification queries executed
- [ ] Row counts match expected
- [ ] Views accessible
- [ ] Functions callable
- [ ] Foreign keys enabled (if needed)

## 💡 Pro Tips

1. **Always backup first** - Migrations modify schema
2. **Read the README** - Each migration set has specific instructions
3. **Check verification** - Run the verification queries
4. **Enable FKs later** - For clean migrations, add FKs after dependent tables exist
5. **Auto-cleanup runs** - System keeps last 20 calculations per event automatically

## 🆘 Troubleshooting

**Problem:** Foreign key constraint fails  
**Solution:** Ensure dependent tables exist, or comment out the FK

**Problem:** View creation fails  
**Solution:** Check that referenced tables (events, compete_event_details) exist

**Problem:** Sports count ≠ 8  
**Solution:** Check for conflicts on id or name columns

**Problem:** Integration migration errors on rerun  
**Solution:** Should be safe - check specific error message

## 📞 Support

Questions? Check these in order:
1. This quick reference (you are here!)
2. Specific migration README in that directory
3. `/docs/migration-analysis.md` for technical details
4. `/MIGRATION_SUMMARY.md` for complete overview

---

**Last Updated:** 2025-01-19  
**Version:** 1.0

