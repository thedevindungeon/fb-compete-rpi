-- Migration: Enhance existing sports table with RPI configuration
-- This migration adds RPI-specific columns to the existing sports table in fb_compete schema
-- Designed to be run on the compete repo which already has a basic sports table
-- 
-- Prerequisites: 
--   - fb_compete.sports table exists with (id, name, created_at, updated_at)
--   - fb_compete.compete_event_details table exists

BEGIN;

-- ============================================================================
-- 1. Add display columns
-- ============================================================================

ALTER TABLE fb_compete.sports 
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS icon VARCHAR(10),
  ADD COLUMN IF NOT EXISTS slug VARCHAR(50),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ============================================================================
-- 2. Add RPI Configuration columns
-- ============================================================================

ALTER TABLE fb_compete.sports
  ADD COLUMN IF NOT EXISTS default_clwp_coeff DECIMAL(4,3) DEFAULT 0.250,
  ADD COLUMN IF NOT EXISTS default_oclwp_coeff DECIMAL(4,3) DEFAULT 0.500,
  ADD COLUMN IF NOT EXISTS default_ooclwp_coeff DECIMAL(4,3) DEFAULT 0.250,
  ADD COLUMN IF NOT EXISTS default_diff_coeff DECIMAL(4,3) DEFAULT 0.100,
  ADD COLUMN IF NOT EXISTS default_domination_coeff DECIMAL(4,3) DEFAULT 1.000,
  ADD COLUMN IF NOT EXISTS default_clgw_step DECIMAL(4,3) DEFAULT 0.050,
  ADD COLUMN IF NOT EXISTS default_clgl_step DECIMAL(4,3) DEFAULT 0.100,
  ADD COLUMN IF NOT EXISTS default_min_games INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS default_diff_interval INTEGER DEFAULT 10;

-- ============================================================================
-- 3. Add Scoring Terminology columns
-- ============================================================================

ALTER TABLE fb_compete.sports
  ADD COLUMN IF NOT EXISTS points_term VARCHAR(20) DEFAULT 'points',
  ADD COLUMN IF NOT EXISTS score_term VARCHAR(20) DEFAULT 'score';

-- ============================================================================
-- 4. Add Display Configuration columns
-- ============================================================================

ALTER TABLE fb_compete.sports
  ADD COLUMN IF NOT EXISTS show_diff BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_domination BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- 5. Add unique constraint on slug
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_sports_slug_unique 
  ON fb_compete.sports(slug) 
  WHERE slug IS NOT NULL;

-- ============================================================================
-- 6. Create performance indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sports_is_active ON fb_compete.sports(is_active);
CREATE INDEX IF NOT EXISTS idx_sports_sort_order ON fb_compete.sports(sort_order);

-- ============================================================================
-- 7. Add column comments for documentation
-- ============================================================================

COMMENT ON TABLE fb_compete.sports IS 'Reference table for sport types and their RPI configurations';
COMMENT ON COLUMN fb_compete.sports.display_name IS 'User-facing display name';
COMMENT ON COLUMN fb_compete.sports.icon IS 'Emoji icon for UI display';
COMMENT ON COLUMN fb_compete.sports.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN fb_compete.sports.default_clwp_coeff IS 'Cumulative Winning Percentage coefficient (NCAA standard: 0.25)';
COMMENT ON COLUMN fb_compete.sports.default_oclwp_coeff IS 'Opponents Cumulative Winning Percentage coefficient (NCAA standard: 0.50)';
COMMENT ON COLUMN fb_compete.sports.default_ooclwp_coeff IS 'Opponents Opponents Cumulative Winning Percentage coefficient (NCAA standard: 0.25)';
COMMENT ON COLUMN fb_compete.sports.default_diff_coeff IS 'Point differential coefficient';
COMMENT ON COLUMN fb_compete.sports.default_domination_coeff IS 'Domination penalty coefficient (< 1.0 = penalty)';
COMMENT ON COLUMN fb_compete.sports.points_term IS 'Term for points (e.g., "runs", "goals", "points")';
COMMENT ON COLUMN fb_compete.sports.score_term IS 'Term for score (e.g., "runs", "score")';
COMMENT ON COLUMN fb_compete.sports.show_diff IS 'Whether to show point differential in UI';
COMMENT ON COLUMN fb_compete.sports.show_domination IS 'Whether to show domination indicator in UI';

-- ============================================================================
-- 8. Add foreign key constraint to compete_event_details (if not exists)
-- ============================================================================

DO $$
BEGIN
  -- Validate and clean any invalid sport_ids before adding FK
  UPDATE fb_compete.compete_event_details
  SET sport_id = NULL
  WHERE sport_id IS NOT NULL 
    AND sport_id NOT IN (SELECT id FROM fb_compete.sports);
    
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_compete_event_details_sport_id'
    AND table_schema = 'fb_compete'
    AND table_name = 'compete_event_details'
  ) THEN
    ALTER TABLE fb_compete.compete_event_details
    ADD CONSTRAINT fk_compete_event_details_sport_id
    FOREIGN KEY (sport_id) REFERENCES fb_compete.sports(id)
    ON DELETE RESTRICT;
  END IF;
END $$;

COMMENT ON CONSTRAINT fk_compete_event_details_sport_id 
ON fb_compete.compete_event_details IS 'Links event to sport configuration for RPI calculations';

-- ============================================================================
-- 9. Create or replace trigger function for updating timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION fb_compete.update_sports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it exists
DROP TRIGGER IF EXISTS trigger_sports_updated_at ON fb_compete.sports;
CREATE TRIGGER trigger_sports_updated_at
  BEFORE UPDATE ON fb_compete.sports
  FOR EACH ROW
  EXECUTE FUNCTION fb_compete.update_sports_updated_at();

-- ============================================================================
-- 10. Create view for easy querying
-- ============================================================================

CREATE OR REPLACE VIEW fb_compete.v_events_with_sport AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.event_start_local_at,
  e.event_end_local_at,
  ced.sport_id,
  s.name as sport_name,
  s.display_name as sport_display_name,
  s.icon as sport_icon,
  s.slug as sport_slug,
  -- RPI coefficients
  s.default_clwp_coeff,
  s.default_oclwp_coeff,
  s.default_ooclwp_coeff,
  s.default_diff_coeff,
  s.default_domination_coeff,
  s.default_clgw_step,
  s.default_clgl_step,
  s.default_min_games,
  s.default_diff_interval,
  -- Terminology
  s.points_term,
  s.score_term,
  -- Display
  s.show_diff,
  s.show_domination,
  -- Metadata
  s.description as sport_description,
  s.is_active as sport_is_active
FROM public.events e
LEFT JOIN fb_compete.compete_event_details ced ON e.id = ced.event_id
LEFT JOIN fb_compete.sports s ON ced.sport_id = s.id;

COMMENT ON VIEW fb_compete.v_events_with_sport IS 'Denormalized view of events with their sport configuration for RPI calculations';

-- ============================================================================
-- 11. Grant appropriate permissions
-- ============================================================================

GRANT SELECT ON fb_compete.sports TO anon, authenticated;
GRANT SELECT ON fb_compete.v_events_with_sport TO anon, authenticated;

-- ============================================================================
-- 12. Verification
-- ============================================================================

DO $$
DECLARE
  sport_count INTEGER;
  configured_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sport_count FROM fb_compete.sports;
  SELECT COUNT(*) INTO configured_count 
  FROM fb_compete.sports 
  WHERE display_name IS NOT NULL;
  
  RAISE NOTICE '✅ Sports table enhanced with RPI configuration columns';
  RAISE NOTICE '   Total sports in table: %', sport_count;
  RAISE NOTICE '   Sports with RPI config: %', configured_count;
  RAISE NOTICE '   ⚠️  Run next migration to populate RPI configuration data';
END $$;

COMMIT;

