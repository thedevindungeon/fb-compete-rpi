# Compete Reference Data Migrations

This directory contains **example migration files** to move static reference data from TypeScript seeds to SQL migrations in the compete repo.

## Purpose

These migrations fix the redundancy issue where static data (age groups, competitive levels, sports, etc.) is inserted via TypeScript seeders instead of SQL migrations.

## How to Use

1. Copy these files to `~/fastbreak/fb-amateur-compete/supabase/migrations/`
2. Update timestamps to be later than existing migrations
3. Review and customize as needed
4. Test on local database
5. Deploy via `supabase db push`

## Files

| File | Purpose | Tables Affected |
|------|---------|-----------------|
| `01_insert_age_groups.sql` | Adds grade column and inserts 17 age groups | `fb_compete.age_groups` |
| `02_insert_competitive_levels.sql` | Adds columns and inserts 5 competitive levels | `fb_compete.competitive_levels` |
| `03_insert_division_seeds.sql` | Inserts 30 division templates | `fb_compete.division_seeds` |
| `04_insert_sports.sql` | Inserts 8 sports | `fb_compete.sports` |
| `05_insert_constraint_catalog.sql` | Inserts constraint definitions | `fb_compete.constraint_catalog` |

## Testing

```bash
# Test locally
cd ~/fastbreak/fb-amateur-compete
supabase db reset

# Verify data
psql -h localhost -p 54322 -U postgres -d postgres << EOF
SELECT COUNT(*) as age_groups FROM fb_compete.age_groups;
SELECT COUNT(*) as competitive_levels FROM fb_compete.competitive_levels;
SELECT COUNT(*) as division_seeds FROM fb_compete.division_seeds;
SELECT COUNT(*) as sports FROM fb_compete.sports;
SELECT COUNT(*) as constraints FROM fb_compete.constraint_catalog;
EOF
```

Expected output:
```
age_groups: 17
competitive_levels: 5
division_seeds: 30
sports: 8
constraints: (varies - depends on CONSTRAINT_CATALOG)
```

## After Running Migrations

Update `scripts/seed/helpers.ts`:
1. Remove static data insertions from `insertStaticData()`
2. Keep only dynamic/test data (events, teams, etc.)
3. Optionally add validation to check reference data exists

## Related Documentation

- [Complete Analysis](../compete-seed-migration-redundancy-analysis.md)
- [RPI Integration Migrations](../../migrations-integration/)

---

**Created:** 2025-11-20  
**Status:** Ready for implementation

