-- Migration: Insert Age Groups Reference Data
-- Moves static age group data from TypeScript seeds to SQL migration
--
-- Previously: scripts/seed/helpers.ts lines 859-881
-- Now: SQL migration for consistency and deployment
--
-- Tables: fb_compete.age_groups

BEGIN;

-- ============================================================================
-- Step 1: Add missing grade column (seeds insert it, but migration doesn't create it)
-- ============================================================================

ALTER TABLE fb_compete.age_groups 
  ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

COMMENT ON COLUMN fb_compete.age_groups.grade IS 'Grade level associated with age group (e.g., "Kindergarten", "1st Grade", "Adult")';

-- ============================================================================
-- Step 2: Insert age group reference data
-- ============================================================================

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

-- ============================================================================
-- Step 3: Create unique constraint if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'age_groups_name_key' 
    AND conrelid = 'fb_compete.age_groups'::regclass
  ) THEN
    ALTER TABLE fb_compete.age_groups 
      ADD CONSTRAINT age_groups_name_key UNIQUE (name);
  END IF;
END $$;

-- ============================================================================
-- Step 4: Verification
-- ============================================================================

DO $$
DECLARE
  age_group_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO age_group_count FROM fb_compete.age_groups;
  
  RAISE NOTICE '✅ Age groups migration complete';
  RAISE NOTICE '   Total age groups: %', age_group_count;
  
  IF age_group_count < 17 THEN
    RAISE WARNING '⚠️ Expected at least 17 age groups, found %', age_group_count;
  END IF;
END $$;

-- Display summary
SELECT id, name, grade 
FROM fb_compete.age_groups 
ORDER BY 
  CASE 
    WHEN name = 'Adults' THEN 999
    WHEN name LIKE '%U' THEN CAST(REPLACE(name, 'U', '') AS INTEGER)
    ELSE 0
  END;

COMMIT;

