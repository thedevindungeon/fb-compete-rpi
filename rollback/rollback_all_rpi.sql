-- Rollback: Remove ALL RPI functionality from database
-- WARNING: This is DESTRUCTIVE and will delete all RPI data
-- Use with caution!

BEGIN;

-- ============================================================================
-- Step 1: Drop calculation history (reverse of migration 03/04)
-- ============================================================================

RAISE NOTICE 'Removing RPI calculation history...';

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_auto_cleanup_rpi ON fb_compete.rpi_calculation_runs CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS fb_compete.auto_cleanup_old_calculations() CASCADE;
DROP FUNCTION IF EXISTS fb_compete.cleanup_old_rpi_calculations(BIGINT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS fb_compete.compare_rpi_runs(BIGINT, BIGINT) CASCADE;

-- Drop views
DROP VIEW IF EXISTS fb_compete.v_rpi_history CASCADE;
DROP VIEW IF EXISTS fb_compete.v_latest_rpi_by_event CASCADE;

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS fb_compete.rpi_results CASCADE;
DROP TABLE IF EXISTS fb_compete.rpi_calculation_runs CASCADE;

RAISE NOTICE '✅ RPI calculation history removed';

-- ============================================================================
-- Step 2: Drop team_rpi table (reverse of migration 02/03)
-- ============================================================================

RAISE NOTICE 'Removing team_rpi table...';

-- Drop trigger
DROP TRIGGER IF EXISTS team_rpi_updated_at ON fb_compete.team_rpi CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS fb_compete.update_team_rpi_updated_at() CASCADE;

-- Drop table
DROP TABLE IF EXISTS fb_compete.team_rpi CASCADE;

RAISE NOTICE '✅ team_rpi table removed';

-- ============================================================================
-- Step 3: Remove RPI configuration from sports table (reverse of migration 01/02)
-- ============================================================================

RAISE NOTICE 'Removing RPI configuration from sports table...';

-- Drop view that depends on sports RPI columns
DROP VIEW IF EXISTS fb_compete.v_events_with_sport CASCADE;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_sports_updated_at ON fb_compete.sports CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS fb_compete.update_sports_updated_at() CASCADE;

-- Remove foreign key constraint from compete_event_details
ALTER TABLE fb_compete.compete_event_details 
  DROP CONSTRAINT IF EXISTS fk_compete_event_details_sport_id CASCADE;

-- Drop indexes
DROP INDEX IF EXISTS fb_compete.idx_sports_slug CASCADE;
DROP INDEX IF EXISTS fb_compete.idx_sports_slug_unique CASCADE;
DROP INDEX IF EXISTS fb_compete.idx_sports_is_active CASCADE;
DROP INDEX IF EXISTS fb_compete.idx_sports_sort_order CASCADE;

-- ============================================================================
-- Step 4: OPTIONAL - Remove RPI columns from sports table
-- ============================================================================

-- UNCOMMENT THE FOLLOWING IF YOU WANT TO REMOVE ALL RPI COLUMNS
-- WARNING: This will delete the column data permanently

/*
RAISE NOTICE 'Removing RPI columns from sports table...';

ALTER TABLE fb_compete.sports 
  DROP COLUMN IF EXISTS display_name CASCADE,
  DROP COLUMN IF EXISTS icon CASCADE,
  DROP COLUMN IF EXISTS slug CASCADE,
  DROP COLUMN IF EXISTS description CASCADE,
  DROP COLUMN IF EXISTS is_active CASCADE,
  DROP COLUMN IF EXISTS sort_order CASCADE,
  DROP COLUMN IF EXISTS default_clwp_coeff CASCADE,
  DROP COLUMN IF EXISTS default_oclwp_coeff CASCADE,
  DROP COLUMN IF EXISTS default_ooclwp_coeff CASCADE,
  DROP COLUMN IF EXISTS default_diff_coeff CASCADE,
  DROP COLUMN IF EXISTS default_domination_coeff CASCADE,
  DROP COLUMN IF EXISTS default_clgw_step CASCADE,
  DROP COLUMN IF EXISTS default_clgl_step CASCADE,
  DROP COLUMN IF EXISTS default_min_games CASCADE,
  DROP COLUMN IF EXISTS default_diff_interval CASCADE,
  DROP COLUMN IF EXISTS points_term CASCADE,
  DROP COLUMN IF EXISTS score_term CASCADE,
  DROP COLUMN IF EXISTS show_diff CASCADE,
  DROP COLUMN IF EXISTS show_domination CASCADE;

RAISE NOTICE '✅ RPI columns removed from sports table';
*/

-- ============================================================================
-- Step 5: OPTIONAL - Remove sports data
-- ============================================================================

-- UNCOMMENT IF YOU WANT TO DELETE ALL SPORT ROWS
-- WARNING: This will delete all sports data

/*
RAISE NOTICE 'Removing sports data...';
TRUNCATE TABLE fb_compete.sports CASCADE;
RAISE NOTICE '✅ Sports data removed';
*/

-- ============================================================================
-- Step 6: OPTIONAL - Drop sports table entirely
-- ============================================================================

-- UNCOMMENT IF YOU WANT TO COMPLETELY REMOVE THE SPORTS TABLE
-- WARNING: This is the most destructive option

/*
RAISE NOTICE 'Dropping sports table...';
DROP TABLE IF EXISTS fb_compete.sports CASCADE;
DROP SEQUENCE IF EXISTS fb_compete.sports_id_seq CASCADE;
RAISE NOTICE '✅ Sports table dropped';
*/

-- ============================================================================
-- Verification
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '=== Rollback Complete ===';
RAISE NOTICE 'RPI tables and views removed successfully';
RAISE NOTICE '';
RAISE NOTICE 'Sports table status:';

DO $$
DECLARE
  sports_exists BOOLEAN;
  has_rpi_columns BOOLEAN;
  sport_count INTEGER;
BEGIN
  -- Check if sports table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'fb_compete' 
    AND table_name = 'sports'
  ) INTO sports_exists;
  
  IF sports_exists THEN
    -- Check if RPI columns still exist
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'fb_compete' 
      AND table_name = 'sports' 
      AND column_name = 'default_clwp_coeff'
    ) INTO has_rpi_columns;
    
    SELECT COUNT(*) INTO sport_count FROM fb_compete.sports;
    
    RAISE NOTICE '  Sports table: EXISTS';
    RAISE NOTICE '  RPI columns: %', CASE WHEN has_rpi_columns THEN 'PRESENT (not removed)' ELSE 'REMOVED' END;
    RAISE NOTICE '  Sport rows: %', sport_count;
  ELSE
    RAISE NOTICE '  Sports table: DROPPED';
  END IF;
END $$;

RAISE NOTICE '';
RAISE NOTICE 'To remove RPI columns/data, uncomment sections in this script';
RAISE NOTICE '';

COMMIT;

