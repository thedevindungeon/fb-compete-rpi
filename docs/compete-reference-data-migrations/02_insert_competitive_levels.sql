-- Migration: Insert Competitive Levels Reference Data
-- Moves static competitive level data from TypeScript seeds to SQL migration
--
-- Previously: scripts/seed/helpers.ts lines 890-930
-- Now: SQL migration for consistency and deployment
--
-- Tables: fb_compete.competitive_levels

BEGIN;

-- ============================================================================
-- Step 1: Add missing columns (seeds insert them, but migration doesn't create them)
-- ============================================================================

ALTER TABLE fb_compete.competitive_levels 
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(10),
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN fb_compete.competitive_levels.short_name IS 'Abbreviated name for UI display (e.g., "A+", "A", "B")';
COMMENT ON COLUMN fb_compete.competitive_levels.description IS 'Detailed description of competitive level expectations';

-- ============================================================================
-- Step 2: Insert competitive level reference data
-- ============================================================================

INSERT INTO fb_compete.competitive_levels (name, short_name, description) VALUES
  (
    'Elite', 
    'A+', 
    'Top-tier teams with highly skilled athletes, extensive training, and national-level competition.'
  ),
  (
    'Strong', 
    'A', 
    'Strong teams with experienced players, regular training, and participation in regional tournaments.'
  ),
  (
    'Medium', 
    'A/B', 
    'Teams with developing skills, moderate training schedules, and local to regional competition.'
  ),
  (
    'Developing', 
    'B', 
    'Teams focusing on skill development, learning game fundamentals, and participating in local leagues.'
  ),
  (
    'Beginner', 
    'C', 
    'Entry-level teams emphasizing basic skills, enjoyment, and introductory competition.'
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Step 3: Create unique constraint if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'competitive_levels_name_key' 
    AND conrelid = 'fb_compete.competitive_levels'::regclass
  ) THEN
    ALTER TABLE fb_compete.competitive_levels 
      ADD CONSTRAINT competitive_levels_name_key UNIQUE (name);
  END IF;
END $$;

-- ============================================================================
-- Step 4: Verification
-- ============================================================================

DO $$
DECLARE
  level_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO level_count FROM fb_compete.competitive_levels;
  
  RAISE NOTICE '✅ Competitive levels migration complete';
  RAISE NOTICE '   Total competitive levels: %', level_count;
  
  IF level_count < 5 THEN
    RAISE WARNING '⚠️ Expected at least 5 competitive levels, found %', level_count;
  END IF;
END $$;

-- Display summary
SELECT id, name, short_name, LEFT(description, 50) || '...' as description_preview
FROM fb_compete.competitive_levels 
ORDER BY 
  CASE name
    WHEN 'Elite' THEN 1
    WHEN 'Strong' THEN 2
    WHEN 'Medium' THEN 3
    WHEN 'Developing' THEN 4
    WHEN 'Beginner' THEN 5
    ELSE 99
  END;

COMMIT;

