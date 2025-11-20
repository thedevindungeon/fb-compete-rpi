# Seed vs Migration Redundancy - Quick Summary

## Problem Found

❌ **Static reference data is being inserted in TypeScript seed scripts instead of SQL migrations**

This causes:
- Production deployments to fail (seeds don't run automatically)
- Inconsistent data between environments
- Maintenance burden (same data in two places)
- Schema mismatches (seeds insert columns that don't exist in migrations)

## What's Redundant

| Data Type | Rows | Current Location | Should Be In |
|-----------|------|------------------|--------------|
| Age Groups | 17 | `scripts/seed/helpers.ts` | SQL Migration |
| Competitive Levels | 5 | `scripts/seed/helpers.ts` | SQL Migration |
| Division Seeds | 30 | `scripts/seed/helpers.ts` | SQL Migration |
| Sports | 8 | `scripts/seed/helpers.ts` | SQL Migration |
| Constraint Catalog | Varies | `scripts/seed/helpers.ts` | SQL Migration |

## Solution

### 1. Move to Migrations

Create 5 new migration files to insert static data:
- `01_insert_age_groups.sql` ✅ Created (see docs/compete-reference-data-migrations/)
- `02_insert_competitive_levels.sql` ✅ Created
- `03_insert_division_seeds.sql` ✅ Created
- `04_insert_sports.sql` ✅ Created
- `05_insert_constraint_catalog.sql` (template ready)

### 2. Update Seeds

Remove static data insertions from `scripts/seed/helpers.ts`:
- Delete lines 859-1185 from `insertStaticData()` function
- Keep only dynamic/test data (events, teams, registrations)

### 3. Fix Schema Mismatches

Seeds try to insert columns that don't exist:
- `age_groups.grade` ❌ Not in migration
- `competitive_levels.short_name` ❌ Not in migration
- `competitive_levels.description` ❌ Not in migration

New migrations add these columns first, then insert data.

## Quick Start

```bash
# 1. Copy migration files
cp ~/fastbreak/rpi/docs/compete-reference-data-migrations/*.sql \
   ~/fastbreak/fb-amateur-compete/supabase/migrations/

# 2. Update timestamps (use current date/time)
cd ~/fastbreak/fb-amateur-compete/supabase/migrations
for f in 0*.sql; do
  mv "$f" "$(date +%Y%m%d%H%M%S)_${f}"
done

# 3. Test locally
cd ~/fastbreak/fb-amateur-compete
supabase db reset

# 4. Verify data exists
psql -h localhost -p 54322 -U postgres -d postgres -c "
  SELECT 
    (SELECT COUNT(*) FROM fb_compete.age_groups) as age_groups,
    (SELECT COUNT(*) FROM fb_compete.competitive_levels) as comp_levels,
    (SELECT COUNT(*) FROM fb_compete.division_seeds) as div_seeds,
    (SELECT COUNT(*) FROM fb_compete.sports) as sports;
"

# Expected: 17, 5, 30, 8

# 5. Update seed scripts
# Edit scripts/seed/helpers.ts
# Remove static data insertions from insertStaticData()

# 6. Test again
supabase db reset
npm run seed:base-data  # Should work without inserting reference data

# 7. Deploy
supabase link --project-ref YOUR_STAGING_REF
supabase db push
```

## Rule of Thumb

### ✅ IN MIGRATIONS
Static data that's the same in all environments:
- Reference data (age groups, competitive levels, etc.)
- Lookup tables
- Default configurations
- System roles

### ✅ IN SEEDS
Dynamic data that varies per environment:
- Test users
- Test events/teams/registrations
- Sample data for development
- Environment-specific configurations

## Files Created

📁 **Documentation:**
- `docs/compete-seed-migration-redundancy-analysis.md` - Full analysis
- `docs/SEED_VS_MIGRATION_SUMMARY.md` - This file
- `docs/compete-reference-data-migrations/README.md` - Migration guide

📄 **Example Migrations:**
- `docs/compete-reference-data-migrations/01_insert_age_groups.sql`
- `docs/compete-reference-data-migrations/02_insert_competitive_levels.sql`
- `docs/compete-reference-data-migrations/03_insert_division_seeds.sql`
- `docs/compete-reference-data-migrations/04_insert_sports.sql`

## Next Steps

1. ✅ **Review** the analysis document
2. ⏳ **Copy** migration files to compete repo
3. ⏳ **Test** on local database
4. ⏳ **Update** seed scripts to remove redundancy
5. ⏳ **Test** on staging
6. ⏳ **Deploy** to production

## Benefits

✅ **Consistency** - Reference data always present after `db reset`  
✅ **Performance** - SQL faster than TypeScript  
✅ **Maintainability** - Single source of truth  
✅ **Deployment** - Works with `supabase db push`  
✅ **Safety** - Uses `ON CONFLICT DO NOTHING` (idempotent)

## Questions?

See the full analysis: `docs/compete-seed-migration-redundancy-analysis.md`

---

**Status:** 🟢 Analysis Complete, Ready for Implementation  
**Priority:** 🔴 High  
**Effort:** 2-3 hours  
**Risk:** 🟢 Low (safe, idempotent migrations)

**Last Updated:** 2025-11-20

