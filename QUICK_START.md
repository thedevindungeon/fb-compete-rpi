# RPI Migrations - Quick Start Guide

## TL;DR

**Standalone RPI?** → Use `migrations-clean/` (3 files)
**Integrate into compete?** → Use `migrations-integration/` (4 files)

---

## Standalone RPI (Clean Migrations)

```bash
cd ~/fastbreak/rpi/migrations-clean

# Run in order
psql -d your_db -f 01_create_sports_table.sql
psql -d your_db -f 02_create_team_rpi_table.sql
psql -d your_db -f 03_create_rpi_calculation_history.sql

# Verify
psql -d your_db -c "SELECT COUNT(*) FROM fb_compete.sports;"
# Expected: 8
```

**What you get:**
- Sports table with 8 sports (⚾⚽🏈🏐🏀🏒🥍🏓)
- RPI configuration (NCAA-compliant coefficients)
- team_rpi table (historical RPI storage)
- Calculation history tracking
- 3 views for easy querying

---

## Compete Integration

```bash
# Step 1: Copy to compete repo
cd ~/fastbreak/fb-amateur-compete/supabase/migrations
TIMESTAMP=$(date +%Y%m%d%H%M%S)

cp ~/fastbreak/rpi/migrations-integration/01_add_rpi_config_to_sports.sql \
   ${TIMESTAMP}01_add_rpi_config_to_sports.sql

cp ~/fastbreak/rpi/migrations-integration/02_populate_rpi_config.sql \
   ${TIMESTAMP}02_populate_rpi_config.sql

cp ~/fastbreak/rpi/migrations-integration/03_create_team_rpi_table.sql \
   ${TIMESTAMP}03_create_team_rpi_table.sql

cp ~/fastbreak/rpi/migrations-integration/04_create_rpi_calculation_history.sql \
   ${TIMESTAMP}04_create_rpi_calculation_history.sql

# Step 2: Run migrations
supabase db push
# or
supabase db reset

# Step 3: Verify
supabase db exec "SELECT COUNT(*) FROM fb_compete.sports WHERE display_name IS NOT NULL;"
# Expected: 8
```

**What you get:**
- Existing sports table enhanced with RPI columns
- 8 sports populated with RPI config
- team_rpi table
- Calculation history
- All views and functions

---

## Rollback

```bash
cd ~/fastbreak/rpi/rollback

# Safe rollback (keeps sports table)
psql -d your_db -f rollback_all_rpi.sql

# Aggressive rollback (removes RPI columns)
# Edit rollback_all_rpi.sql and uncomment Step 4
psql -d your_db -f rollback_all_rpi.sql
```

---

## File Structure

```
rpi/
├── migrations-clean/          ← Use for standalone
│   ├── 01_create_sports_table.sql
│   ├── 02_create_team_rpi_table.sql
│   └── 03_create_rpi_calculation_history.sql
│
├── migrations-integration/    ← Use for compete
│   ├── 01_add_rpi_config_to_sports.sql
│   ├── 02_populate_rpi_config.sql
│   ├── 03_create_team_rpi_table.sql
│   └── 04_create_rpi_calculation_history.sql
│
└── rollback/                  ← Use to undo
    └── rollback_all_rpi.sql
```

---

## Quick Verification

### After Standalone Migrations
```sql
-- Check sports
SELECT id, display_name, icon FROM fb_compete.sports ORDER BY id;

-- Check tables exist
\d fb_compete.team_rpi
\d fb_compete.rpi_calculation_runs
\d fb_compete.rpi_results

-- Check views
\dv fb_compete.v_*
```

### After Integration Migrations
```sql
-- Check sports enhanced
\d fb_compete.sports
-- Should show: default_clwp_coeff, default_oclwp_coeff, etc.

-- Check sports populated
SELECT id, display_name, icon, 
       CONCAT(default_clwp_coeff, '-', default_oclwp_coeff, '-', default_ooclwp_coeff) as formula
FROM fb_compete.sports;
-- Should return 8 rows

-- Check view works
SELECT * FROM fb_compete.v_events_with_sport LIMIT 5;
```

---

## Troubleshooting

### Error: relation does not exist
**Problem:** Missing prerequisite tables
**Solution:** Ensure base compete schema is migrated first

### Error: column already exists
**Problem:** Migration partially run before
**Solution:** Safe to continue - migrations are idempotent

### Error: permission denied
**Problem:** Insufficient database permissions
**Solution:**
```sql
GRANT USAGE ON SCHEMA fb_compete TO your_role;
GRANT ALL ON ALL TABLES IN SCHEMA fb_compete TO your_role;
```

---

## Need More Info?

- **Full documentation:** See READMEs in each migration directory
- **Technical details:** See `MIGRATION_PACKAGING.md`
- **Complete summary:** See `MIGRATION_SUMMARY.md`
- **Original analysis:** See `docs/migration-analysis.md`

---

## Safety Checklist

Before running migrations:

- [ ] Backup your database
- [ ] Test on staging first
- [ ] Read the README in the migration directory you're using
- [ ] Verify prerequisites exist (teams, events tables)
- [ ] Ensure you have database permissions

Before rollback:

- [ ] **BACKUP YOUR DATABASE**
- [ ] Understand what will be deleted
- [ ] Test on staging first
- [ ] Read `rollback/README.md`

---

## Common Scenarios

### Starting fresh with RPI
→ Use `migrations-clean/`

### Adding RPI to existing compete database
→ Use `migrations-integration/`

### Testing migrations (need to reset)
→ Use `rollback/rollback_all_rpi.sql`, then re-run

### Something went wrong
→ Use `rollback/rollback_all_rpi.sql`, restore backup, try again

---

## Support

Questions? Check:
1. README in the migration directory you're using
2. `MIGRATION_SUMMARY.md` for overview
3. `MIGRATION_PACKAGING.md` for technical details

---

**Last Updated:** 2025-11-20

