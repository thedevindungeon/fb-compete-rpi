-- Migration: Enhance sports table with professional structure
-- Adds icon, RPI configuration, and display settings

BEGIN;

-- ============================================================================
-- 1. Add new columns to sports table
-- ============================================================================

-- Display columns
ALTER TABLE fb_compete.sports 
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS icon VARCHAR(10),
  ADD COLUMN IF NOT EXISTS slug VARCHAR(50),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- RPI Configuration columns
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

-- Scoring Terminology columns
ALTER TABLE fb_compete.sports
  ADD COLUMN IF NOT EXISTS points_term VARCHAR(20) DEFAULT 'points',
  ADD COLUMN IF NOT EXISTS score_term VARCHAR(20) DEFAULT 'score';

-- Display Configuration columns
ALTER TABLE fb_compete.sports
  ADD COLUMN IF NOT EXISTS show_diff BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_domination BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- 2. Add unique constraint on slug
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_sports_slug_unique 
  ON fb_compete.sports(slug) 
  WHERE slug IS NOT NULL;

-- ============================================================================
-- 3. Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sports_is_active ON fb_compete.sports(is_active);
CREATE INDEX IF NOT EXISTS idx_sports_sort_order ON fb_compete.sports(sort_order);

-- ============================================================================
-- 4. Add column comments
-- ============================================================================

COMMENT ON COLUMN fb_compete.sports.display_name IS 'User-facing display name';
COMMENT ON COLUMN fb_compete.sports.icon IS 'Emoji icon for UI display (separated for flexibility)';
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

COMMIT;

