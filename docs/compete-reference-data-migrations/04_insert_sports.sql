-- Migration: Insert Sports Reference Data
-- Moves static sports data from TypeScript seeds to SQL migration
--
-- Previously: scripts/seed/helpers.ts lines 1108-1158
-- Now: SQL migration for consistency and deployment
--
-- Note: This is the BASE sports data. For RPI configuration, run the
-- RPI integration migrations after this one.
--
-- Tables: fb_compete.sports

BEGIN;

-- ============================================================================
-- Step 1: Create unique constraint if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sports_name_key' 
    AND conrelid = 'fb_compete.sports'::regclass
  ) THEN
    ALTER TABLE fb_compete.sports 
      ADD CONSTRAINT sports_name_key UNIQUE (name);
  END IF;
END $$;

-- ============================================================================
-- Step 2: Insert sports reference data
-- ============================================================================

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

-- ============================================================================
-- Step 3: Verification
-- ============================================================================

DO $$
DECLARE
  sport_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sport_count FROM fb_compete.sports;
  
  RAISE NOTICE '✅ Sports migration complete';
  RAISE NOTICE '   Total sports: %', sport_count;
  
  IF sport_count < 8 THEN
    RAISE WARNING '⚠️ Expected at least 8 sports, found %', sport_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  For RPI configuration, run the RPI integration migrations:';
  RAISE NOTICE '   - 01_add_rpi_config_to_sports.sql';
  RAISE NOTICE '   - 02_populate_rpi_config.sql';
  RAISE NOTICE '   Location: ~/fastbreak/rpi/migrations-integration/';
END $$;

-- Display summary
SELECT id, name, created_at
FROM fb_compete.sports
ORDER BY name;

COMMIT;

