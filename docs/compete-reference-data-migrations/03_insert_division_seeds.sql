-- Migration: Insert Division Seeds Reference Data
-- Moves static division seed data from TypeScript seeds to SQL migration
--
-- Previously: scripts/seed/helpers.ts lines 939-1105
-- Now: SQL migration for consistency and deployment
--
-- Tables: fb_compete.division_seeds

BEGIN;

-- ============================================================================
-- Step 1: Create unique constraint if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'division_seeds_name_key' 
    AND conrelid = 'fb_compete.division_seeds'::regclass
  ) THEN
    ALTER TABLE fb_compete.division_seeds 
      ADD CONSTRAINT division_seeds_name_key UNIQUE (name);
  END IF;
END $$;

-- ============================================================================
-- Step 2: Insert division seed reference data
-- ============================================================================

-- Age-based divisions (U format)
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
  ('20U', 'Ages 20 and under')
ON CONFLICT (name) DO NOTHING;

-- Grade-based divisions
INSERT INTO fb_compete.division_seeds (name, description) VALUES
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

-- Other divisions
INSERT INTO fb_compete.division_seeds (name, description) VALUES
  ('Junior Varsity', 'Junior varsity level'),
  ('Adults', 'Adult division')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Step 3: Verification
-- ============================================================================

DO $$
DECLARE
  seed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO seed_count FROM fb_compete.division_seeds;
  
  RAISE NOTICE '✅ Division seeds migration complete';
  RAISE NOTICE '   Total division seeds: %', seed_count;
  
  IF seed_count < 30 THEN
    RAISE WARNING '⚠️ Expected at least 30 division seeds, found %', seed_count;
  END IF;
END $$;

-- Display summary by category
SELECT 
  CASE
    WHEN name LIKE '%U' THEN 'Age-Based (U)'
    WHEN name LIKE '%Grade' THEN 'Grade-Based'
    WHEN name IN ('Kindergarten', 'Junior Varsity', 'Adults') THEN 'Other'
    ELSE 'Unknown'
  END as category,
  COUNT(*) as count
FROM fb_compete.division_seeds
GROUP BY category
ORDER BY category;

-- Show sample data
SELECT id, name, description
FROM fb_compete.division_seeds
ORDER BY 
  CASE 
    WHEN name = 'Kindergarten' THEN 0
    WHEN name LIKE '%U' THEN CAST(REPLACE(name, 'U', '') AS INTEGER)
    WHEN name LIKE '1st%' THEN 1
    WHEN name LIKE '2nd%' THEN 2
    WHEN name LIKE '3rd%' THEN 3
    WHEN name LIKE '%th Grade' THEN CAST(REGEXP_REPLACE(name, '[^0-9]', '', 'g') AS INTEGER)
    WHEN name = 'Junior Varsity' THEN 97
    WHEN name = 'Adults' THEN 99
    ELSE 98
  END
LIMIT 10;

COMMIT;

