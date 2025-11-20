# Compete Repo: Seed vs Migration Redundancy Analysis

**Date:** 2025-11-20  
**Repo:** fb-amateur-compete (pre-dev branch)  
**Issue:** Static reference data being inserted in seed scripts instead of migrations

---

## Executive Summary

**Problem:** The compete repo has significant redundancy between TypeScript seed scripts and SQL migrations. Static reference data (age groups, competitive levels, sports, division seeds, constraint catalog) is being inserted via TypeScript seeders instead of SQL migrations.

**Impact:**
- 🔴 **Data inconsistency** - Reference data may not exist after `db reset` without running seeds
- 🔴 **Deployment issues** - Production deployments don't run seed scripts
- 🔴 **Maintenance burden** - Must maintain same data in two places
- 🔴 **Testing fragility** - Tests may fail if seeds aren't run
- 🟡 **Performance** - TypeScript insertions slower than SQL migrations

**Recommendation:** Move all static reference data from seed scripts to migrations.

---

##  What's Redundant

### 1. Age Groups
**Location:** `scripts/seed/helpers.ts` lines 859-881  
**Action:** INSERT into `fb_compete.age_groups`  
**Data:** 17 age groups (5U through 20U, Adults)

**Seed Code:**
```typescript
await supabase.schema("fb_compete").from("age_groups").insert([
  { name: "5U", grade: "Pre-K" },
  { name: "6U", grade: "Kindergarten" },
  // ... 15 more rows
  { name: "Adults", grade: "Adult" },
]);
```

**Migration Status:**
- ✅ Table created in `20250818205934_compete-init-trimmed.sql`
- ❌ NO data inserted in any migration
- ❌ grade column NOT in migration (only id, name, created_at)

---

### 2. Competitive Levels
**Location:** `scripts/seed/helpers.ts` lines 890-930  
**Action:** INSERT into `fb_compete.competitive_levels`  
**Data:** 5 levels (Elite, Strong, Medium, Developing, Beginner)

**Seed Code:**
```typescript
await supabase.schema("fb_compete").from("competitive_levels").insert([
  { name: "Elite", short_name: "A+", description: "Top-tier teams..." },
  { name: "Strong", short_name: "A", description: "Strong teams..." },
  { name: "Medium", short_name: "A/B", description: "Teams with developing..." },
  { name: "Developing", short_name: "B", description: "Teams focusing on..." },
  { name: "Beginner", short_name: "C", description: "Entry-level teams..." },
]);
```

**Migration Status:**
- ✅ Table created in `20250818205934_compete-init-trimmed.sql`
- ❌ NO data inserted in any migration
- ❌ short_name and description columns NOT in migration (only id, name)

---

### 3. Division Seeds
**Location:** `scripts/seed/helpers.ts` lines 939-1105  
**Action:** INSERT into `fb_compete.division_seeds`  
**Data:** 30 division templates (5U-20U, grade levels, JV, Adults)

**Seed Code:**
```typescript
const divSeeds = [
  { name: "5U", description: "Ages 5 and under", created_at: "2025-08-14..." },
  { name: "6U", description: "Ages 6 and under", created_at: "2025-08-14..." },
  // ... 28 more rows
  { name: "12th Grade", description: "12th grade level", created_at: "2025-08-14..." },
];

await supabase.schema("fb_compete").from("division_seeds").insert(divSeeds);
```

**Migration Status:**
- ✅ Table created in `20250818205934_compete-init-trimmed.sql`
- ❌ NO data inserted in any migration

---

### 4. Sports
**Location:** `scripts/seed/helpers.ts` lines 1108-1158  
**Action:** INSERT into `fb_compete.sports`  
**Data:** 8 sports (baseball, soccer, football, volleyball, basketball, hockey, lacrosse, pickle_ball)

**Seed Code:**
```typescript
await supabase.schema("fb_compete").from("sports").insert([
  { name: "baseball", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { name: "soccer", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  // ... 6 more sports
  { name: "pickle_ball", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]);
```

**Migration Status:**
- ✅ Table created in `20250818205934_compete-init-trimmed.sql`
- ❌ NO data inserted in any migration
- ❌ RPI configuration columns don't exist (see RPI migration analysis)

---

### 5. Constraint Catalog
**Location:** `scripts/seed/helpers.ts` lines 1162-1176  
**Action:** INSERT into `fb_compete.constraint_catalog`  
**Data:** Scheduling constraint definitions from `CONSTRAINT_CATALOG` constant

**Seed Code:**
```typescript
const constraintCatalogData = CONSTRAINT_CATALOG.map((constraint) => ({
  key: constraint.key,
  label: constraint.name,
  type: constraint.category,
}));

await supabase.schema("fb_compete").from("constraint_catalog").insert(constraintCatalogData);
```

**Migration Status:**
- ✅ Table created in `20251003122709_constraint_catalog.sql`
- ❌ NO data inserted in migration

---

## Schema Mismatches

### Age Groups
| Column | In Migration? | In Seed? | Issue |
|--------|---------------|----------|-------|
| id | ✅ Yes | ✅ Yes | OK |
| name | ✅ Yes | ✅ Yes | OK |
| created_at | ✅ Yes | ✅ Yes | OK |
| **grade** | ❌ **NO** | ✅ **YES** | **MISMATCH** |

**Problem:** Seed inserts `grade` column but migration doesn't create it!

---

### Competitive Levels
| Column | In Migration? | In Seed? | Issue |
|--------|---------------|----------|-------|
| id | ✅ Yes | ✅ Yes | OK |
| name | ✅ Yes | ✅ Yes | OK |
| **short_name** | ❌ **NO** | ✅ **YES** | **MISMATCH** |
| **description** | ❌ **NO** | ✅ **YES** | **MISMATCH** |

**Problem:** Seed inserts columns that don't exist in schema!

---

## Why This is a Problem

### 1. Production Deployment Failure
```bash
# What happens in production:
supabase db push   # ✅ Migrations run
# Seeds DON'T run automatically
# Result: Empty reference tables! 🔴
```

### 2. Test Environment Issues
```bash
# Developer workflow:
supabase db reset      # ✅ Runs migrations
npm run seed           # ❓ May or may not run
# Result: Flaky tests if seeds skipped
```

### 3. Schema Inconsistency
```typescript
// Seed tries to insert:
{ name: "5U", grade: "Pre-K" }

// But migration only has:
CREATE TABLE age_groups (
  id bigint,
  name varchar(20),
  created_at timestamp
  -- NO grade column!
);

// Result: INSERT FAILS! 🔴
```

### 4. Data Duplication
- Same data maintained in two places
- Easy to get out of sync
- Hard to track what's "source of truth"

---

## Recommended Solution

### Step 1: Create Reference Data Migrations

Create new migration files to insert all static data:

```bash
cd ~/fastbreak/fb-amateur-compete/supabase/migrations

# Create new migrations
touch 20251120120000_insert_age_groups.sql
touch 20251120120001_insert_competitive_levels.sql
touch 20251120120002_insert_division_seeds.sql
touch 20251120120003_insert_sports.sql
touch 20251120120004_insert_constraint_catalog.sql
```

---

### Step 2: Migration Content

#### 20251120120000_insert_age_groups.sql
```sql
-- Add missing grade column first
ALTER TABLE fb_compete.age_groups 
  ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- Insert age groups
INSERT INTO fb_compete.age_groups (name, grade) VALUES
  ('5U', 'Pre-K'),
  ('6U', 'Kindergarten'),
  ('7U', '1st Grade'),
  ('8U', '2nd Grade'),
  ('9U', '3rd Grade'),
  ('10U', '4th Grade'),
  ('11U', '5th Grade'),
  ('12U', '6th Grade'),
  ('13U', '7th Grade'),
  ('14U', '8th Grade'),
  ('15U', '9th Grade'),
  ('16U', '10th Grade'),
  ('17U', '11th Grade'),
  ('18U', '12th Grade'),
  ('19U', 'College'),
  ('20U', 'College'),
  ('Adults', 'Adult')
ON CONFLICT (name) DO NOTHING;
```

#### 20251120120001_insert_competitive_levels.sql
```sql
-- Add missing columns
ALTER TABLE fb_compete.competitive_levels 
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(10),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Insert competitive levels
INSERT INTO fb_compete.competitive_levels (name, short_name, description) VALUES
  ('Elite', 'A+', 'Top-tier teams with highly skilled athletes, extensive training, and national-level competition.'),
  ('Strong', 'A', 'Strong teams with experienced players, regular training, and participation in regional tournaments.'),
  ('Medium', 'A/B', 'Teams with developing skills, moderate training schedules, and local to regional competition.'),
  ('Developing', 'B', 'Teams focusing on skill development, learning game fundamentals, and participating in local leagues.'),
  ('Beginner', 'C', 'Entry-level teams emphasizing basic skills, enjoyment, and introductory competition.')
ON CONFLICT (name) DO NOTHING;
```

#### 20251120120002_insert_division_seeds.sql
```sql
INSERT INTO fb_compete.division_seeds (name, description) VALUES
  ('5U', 'Ages 5 and under'),
  ('6U', 'Ages 6 and under'),
  ('7U', 'Ages 7 and under'),
  ('8U', 'Ages 8 and under'),
  ('9U', 'Ages 9 and under'),
  ('10U', 'Ages 10 and under'),
  ('11U', 'Ages 11 and under'),
  ('12U', 'Ages 12 and under'),
  ('13U', 'Ages 13 and under'),
  ('14U', 'Ages 14 and under'),
  ('15U', 'Ages 15 and under'),
  ('16U', 'Ages 16 and under'),
  ('17U', 'Ages 17 and under'),
  ('18U', 'Ages 18 and under'),
  ('19U', 'Ages 19 and under'),
  ('20U', 'Ages 20 and under'),
  ('Junior Varsity', 'Junior varsity level'),
  ('Adults', 'Adult division'),
  ('Kindergarten', 'Kindergarten grade level'),
  ('1st Grade', '1st grade level'),
  ('2nd Grade', '2nd grade level'),
  ('3rd Grade', '3rd grade level'),
  ('4th Grade', '4th grade level'),
  ('5th Grade', '5th grade level'),
  ('6th Grade', '6th grade level'),
  ('7th Grade', '7th grade level'),
  ('8th Grade', '8th grade level'),
  ('9th Grade', '9th grade level'),
  ('10th Grade', '10th grade level'),
  ('11th Grade', '11th grade level'),
  ('12th Grade', '12th grade level')
ON CONFLICT (name) DO NOTHING;
```

#### 20251120120003_insert_sports.sql
```sql
INSERT INTO fb_compete.sports (name) VALUES
  ('baseball'),
  ('soccer'),
  ('football'),
  ('volleyball'),
  ('basketball'),
  ('hockey'),
  ('lacrosse'),
  ('pickle_ball')
ON CONFLICT (name) DO NOTHING;

-- Note: RPI configuration columns should be added via RPI integration migrations
-- See: ~/fastbreak/rpi/migrations-integration/
```

#### 20251120120004_insert_constraint_catalog.sql
```sql
-- Insert constraint catalog data
-- Data comes from src/utils/competition-layer/constraints.utils.ts

INSERT INTO fb_compete.constraint_catalog (key, label, type) VALUES
  -- Add actual constraint catalog data here
  -- This should match CONSTRAINT_CATALOG from your codebase
  ('example_constraint', 'Example Constraint', 'timing')
ON CONFLICT (key) DO NOTHING;

-- TODO: Extract actual constraint data from CONSTRAINT_CATALOG constant
```

---

### Step 3: Update Seed Scripts

Remove redundant insertions from `scripts/seed/helpers.ts`:

```typescript
export async function insertStaticData() {
  const supabase = getAppServiceRoleClient();

  try {
    // ❌ REMOVE THESE - Now in migrations:
    // - Age groups insertion (lines 859-881)
    // - Competitive levels insertion (lines 890-930)
    // - Division seeds insertion (lines 939-1105)
    // - Sports insertion (lines 1108-1158)
    // - Constraint catalog insertion (lines 1162-1176)

    console.log('✅ Static data now managed by migrations');
    console.log('   Run: supabase db reset');
    
    // Keep only DYNAMIC/TEST data here
    // (events, teams, registrations, etc.)
    
  } catch (error) {
    console.error("Error during static data seeding:", error);
    throw error;
  }
}
```

---

### Step 4: Update Seed Scripts to Remove Insertions

Create a new seed helper that VALIDATES instead of INSERTS:

```typescript
export async function validateStaticData() {
  const supabase = getAppServiceRoleClient();

  const { data: ageGroups } = await supabase
    .schema("fb_compete")
    .from("age_groups")
    .select("count");
  
  if (!ageGroups || ageGroups[0].count < 17) {
    throw new Error('❌ Age groups not seeded! Run: supabase db reset');
  }

  const { data: competitiveLevels } = await supabase
    .schema("fb_compete")
    .from("competitive_levels")
    .select("count");
  
  if (!competitiveLevels || competitiveLevels[0].count < 5) {
    throw new Error('❌ Competitive levels not seeded! Run: supabase db reset');
  }

  const { data: sports } = await supabase
    .schema("fb_compete")
    .from("sports")
    .select("count");
  
  if (!sports || sports[0].count < 8) {
    throw new Error('❌ Sports not seeded! Run: supabase db reset');
  }

  console.log('✅ All static reference data validated');
}
```

---

## Migration Strategy

### For Existing Databases

```sql
-- Run these in order:
-- 1. Add missing columns (ALTER TABLE)
-- 2. Insert data with ON CONFLICT DO NOTHING (safe)
-- 3. Verify data exists
```

### For New Databases

```bash
# Just run migrations - data will be there
supabase db reset
```

---

## What Should Stay in Seeds vs Migrations

### ✅ IN MIGRATIONS (SQL)
**Rule:** Static reference data that never changes per environment

- ✅ Age groups (5U, 6U, etc.)
- ✅ Competitive levels (Elite, Strong, etc.)
- ✅ Division seeds (templates)
- ✅ Sports (baseball, soccer, etc.)
- ✅ Constraint catalog (scheduling rules)
- ✅ Default RPI coefficients
- ✅ System roles/permissions
- ✅ Lookup tables
- ✅ Enum-like data

### ✅ IN SEEDS (TypeScript)
**Rule:** Dynamic/test data that varies per environment

- ✅ Test users
- ✅ Test organizations
- ✅ Test events
- ✅ Test teams
- ✅ Test registrations
- ✅ Test matches
- ✅ Sample rosters
- ✅ Dev/staging-only data

---

## Benefits of This Approach

### 1. Consistency
✅ Reference data always present after `db reset`  
✅ Same data in dev, staging, production  
✅ No "forgot to run seeds" errors

### 2. Performance
✅ SQL INSERT faster than TypeScript  
✅ All data loaded in one migration  
✅ No multiple round-trips

### 3. Maintainability
✅ Single source of truth (SQL file)  
✅ Version controlled with schema  
✅ Easy to audit changes

### 4. Deployment
✅ Works with `supabase db push`  
✅ No separate seed step needed  
✅ Idempotent (safe to re-run)

---

## Implementation Checklist

- [ ] Create 5 new migration files
- [ ] Add missing columns (grade, short_name, description)
- [ ] Insert all reference data with `ON CONFLICT DO NOTHING`
- [ ] Test migrations on clean database
- [ ] Update seed scripts to remove redundant insertions
- [ ] Add validation helper (optional)
- [ ] Update documentation
- [ ] Test on staging
- [ ] Deploy to production

---

## File Locations

**Seed Script:**
- `~/fastbreak/fb-amateur-compete/scripts/seed/helpers.ts`
  - Lines 855-1185: `insertStaticData()` function

**Migrations:**
- `~/fastbreak/fb-amateur-compete/supabase/migrations/`
  - `20250818205934_compete-init-trimmed.sql` - Creates tables (no data)
  - `20251003122709_constraint_catalog.sql` - Creates constraint_catalog table (no data)

**New Migrations Needed:**
- `20251120120000_insert_age_groups.sql`
- `20251120120001_insert_competitive_levels.sql`
- `20251120120002_insert_division_seeds.sql`
- `20251120120003_insert_sports.sql`
- `20251120120004_insert_constraint_catalog.sql`

---

## Related Issues

### RPI Integration
The sports table needs RPI configuration columns. See:
- `~/fastbreak/rpi/migrations-integration/01_add_rpi_config_to_sports.sql`
- `~/fastbreak/rpi/migrations-integration/02_populate_rpi_config.sql`

These should be run AFTER the base sports migration.

---

## Testing Plan

### 1. Test on Clean Database
```bash
# Drop everything
supabase db reset

# Verify reference data exists
psql -c "SELECT COUNT(*) FROM fb_compete.age_groups;"
# Expected: 17

psql -c "SELECT COUNT(*) FROM fb_compete.competitive_levels;"
# Expected: 5

psql -c "SELECT COUNT(*) FROM fb_compete.sports;"
# Expected: 8
```

### 2. Test Seed Scripts
```bash
# Seeds should only create dynamic data
npm run seed:static-data

# Should NOT insert age groups, sports, etc.
# Should validate they exist
```

### 3. Test Production Deploy
```bash
# On staging
supabase link --project-ref staging-ref
supabase db push

# Verify reference data
# Run app tests
```

---

## Rollback Plan

If migrations cause issues:

```sql
-- Rollback reference data (if needed)
TRUNCATE TABLE fb_compete.age_groups CASCADE;
TRUNCATE TABLE fb_compete.competitive_levels CASCADE;
TRUNCATE TABLE fb_compete.division_seeds CASCADE;
TRUNCATE TABLE fb_compete.sports CASCADE;
TRUNCATE TABLE fb_compete.constraint_catalog CASCADE;

-- Then re-run seed script
-- npm run seed:static-data
```

---

## Next Steps

1. **Review this analysis** with team
2. **Create migration files** (5 files)
3. **Test locally** on clean database
4. **Update seed scripts** to remove redundant inserts
5. **Test on staging** environment
6. **Deploy to production** (via `supabase db push`)
7. **Monitor** for issues
8. **Update docs** with new workflow

---

## Questions?

- **Q: What if we need different data per environment?**  
  A: Use environment-specific seed scripts for that. Migrations should only have data that's the same everywhere.

- **Q: What about future sports additions?**  
  A: Add new migration: `20251201000000_add_cricket_sport.sql`

- **Q: Can we still use seeds for development?**  
  A: Yes! Seeds are perfect for test users, events, registrations, etc. Just not static reference data.

---

**Status:** 🟡 Pending Implementation  
**Priority:** 🔴 High - Blocks production deployment  
**Effort:** 2-3 hours  
**Risk:** Low (using ON CONFLICT DO NOTHING makes it safe)

