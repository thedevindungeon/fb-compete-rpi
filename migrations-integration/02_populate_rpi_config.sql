-- Migration: Populate sports with RPI configuration data
-- This migration populates existing sports rows with full RPI configuration
-- Designed to be run after 01_add_rpi_config_to_sports.sql
--
-- Prerequisites:
--   - Migration 01_add_rpi_config_to_sports.sql has been run
--   - Sports rows already exist (or will be created here if they don't)

BEGIN;

-- ============================================================================
-- UPSERT sports with full RPI configuration
-- Uses INSERT ... ON CONFLICT to handle both new inserts and updates
-- ============================================================================

-- First, ensure we have a sequence for sports
CREATE SEQUENCE IF NOT EXISTS fb_compete.sports_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

ALTER SEQUENCE fb_compete.sports_id_seq OWNED BY fb_compete.sports.id;

-- Baseball (ID: 1)
INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, is_active, sort_order
) VALUES (
  1, 'baseball', 'Baseball', '⚾', 'baseball',
  0.250, 0.500, 0.250,
  0.050, 1.000,
  0.050, 0.100,
  5, 5,
  'runs', 'runs',
  TRUE, TRUE,
  'NCAA Standard 25-50-25 formula. Baseball requires more games for accurate RPI due to higher variance.',
  TRUE, 1
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug,
  default_clwp_coeff = EXCLUDED.default_clwp_coeff,
  default_oclwp_coeff = EXCLUDED.default_oclwp_coeff,
  default_ooclwp_coeff = EXCLUDED.default_ooclwp_coeff,
  default_diff_coeff = EXCLUDED.default_diff_coeff,
  default_domination_coeff = EXCLUDED.default_domination_coeff,
  default_clgw_step = EXCLUDED.default_clgw_step,
  default_clgl_step = EXCLUDED.default_clgl_step,
  default_min_games = EXCLUDED.default_min_games,
  default_diff_interval = EXCLUDED.default_diff_interval,
  points_term = EXCLUDED.points_term,
  score_term = EXCLUDED.score_term,
  show_diff = EXCLUDED.show_diff,
  show_domination = EXCLUDED.show_domination,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Soccer (ID: 2)
INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, is_active, sort_order
) VALUES (
  2, 'soccer', 'Soccer', '⚽', 'soccer',
  0.250, 0.500, 0.250,
  0.080, 1.000,
  0.050, 0.100,
  4, 3,
  'goals', 'goals',
  TRUE, TRUE,
  'NCAA Standard 25-50-25 with tie handling (ties count as 0.5 wins).',
  TRUE, 2
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug,
  default_clwp_coeff = EXCLUDED.default_clwp_coeff,
  default_oclwp_coeff = EXCLUDED.default_oclwp_coeff,
  default_ooclwp_coeff = EXCLUDED.default_ooclwp_coeff,
  default_diff_coeff = EXCLUDED.default_diff_coeff,
  default_domination_coeff = EXCLUDED.default_domination_coeff,
  default_clgw_step = EXCLUDED.default_clgw_step,
  default_clgl_step = EXCLUDED.default_clgl_step,
  default_min_games = EXCLUDED.default_min_games,
  default_diff_interval = EXCLUDED.default_diff_interval,
  points_term = EXCLUDED.points_term,
  score_term = EXCLUDED.score_term,
  show_diff = EXCLUDED.show_diff,
  show_domination = EXCLUDED.show_domination,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Football (ID: 3)
INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, is_active, sort_order
) VALUES (
  3, 'football', 'Football', '🏈', 'football',
  0.350, 0.400, 0.250,
  0.150, 0.900,
  0.060, 0.120,
  3, 14,
  'points', 'points',
  TRUE, TRUE,
  'Modified formula emphasizing win/loss record. Point differential is highly significant.',
  TRUE, 3
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug,
  default_clwp_coeff = EXCLUDED.default_clwp_coeff,
  default_oclwp_coeff = EXCLUDED.default_oclwp_coeff,
  default_ooclwp_coeff = EXCLUDED.default_ooclwp_coeff,
  default_diff_coeff = EXCLUDED.default_diff_coeff,
  default_domination_coeff = EXCLUDED.default_domination_coeff,
  default_clgw_step = EXCLUDED.default_clgw_step,
  default_clgl_step = EXCLUDED.default_clgl_step,
  default_min_games = EXCLUDED.default_min_games,
  default_diff_interval = EXCLUDED.default_diff_interval,
  points_term = EXCLUDED.points_term,
  score_term = EXCLUDED.score_term,
  show_diff = EXCLUDED.show_diff,
  show_domination = EXCLUDED.show_domination,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Volleyball (ID: 4)
INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, is_active, sort_order
) VALUES (
  4, 'volleyball', 'Volleyball', '🏐', 'volleyball',
  0.250, 0.500, 0.250,
  0.030, 1.000,
  0.040, 0.080,
  5, 5,
  'points', 'points',
  TRUE, FALSE,
  'NCAA Standard 25-50-25. Set-based scoring means lower differential impact.',
  TRUE, 4
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug,
  default_clwp_coeff = EXCLUDED.default_clwp_coeff,
  default_oclwp_coeff = EXCLUDED.default_oclwp_coeff,
  default_ooclwp_coeff = EXCLUDED.default_ooclwp_coeff,
  default_diff_coeff = EXCLUDED.default_diff_coeff,
  default_domination_coeff = EXCLUDED.default_domination_coeff,
  default_clgw_step = EXCLUDED.default_clgw_step,
  default_clgl_step = EXCLUDED.default_clgl_step,
  default_min_games = EXCLUDED.default_min_games,
  default_diff_interval = EXCLUDED.default_diff_interval,
  points_term = EXCLUDED.points_term,
  score_term = EXCLUDED.score_term,
  show_diff = EXCLUDED.show_diff,
  show_domination = EXCLUDED.show_domination,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Basketball (ID: 5)
INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, is_active, sort_order
) VALUES (
  5, 'basketball', 'Basketball', '🏀', 'basketball',
  0.900, 0.100, 0.100,
  0.100, 0.900,
  0.050, 0.100,
  4, 10,
  'points', 'points',
  TRUE, TRUE,
  'Custom 90-10-10 formula. Your record matters most. Penalty for 8+ game win streaks.',
  TRUE, 5
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug,
  default_clwp_coeff = EXCLUDED.default_clwp_coeff,
  default_oclwp_coeff = EXCLUDED.default_oclwp_coeff,
  default_ooclwp_coeff = EXCLUDED.default_ooclwp_coeff,
  default_diff_coeff = EXCLUDED.default_diff_coeff,
  default_domination_coeff = EXCLUDED.default_domination_coeff,
  default_clgw_step = EXCLUDED.default_clgw_step,
  default_clgl_step = EXCLUDED.default_clgl_step,
  default_min_games = EXCLUDED.default_min_games,
  default_diff_interval = EXCLUDED.default_diff_interval,
  points_term = EXCLUDED.points_term,
  score_term = EXCLUDED.score_term,
  show_diff = EXCLUDED.show_diff,
  show_domination = EXCLUDED.show_domination,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Hockey (ID: 6)
INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, is_active, sort_order
) VALUES (
  6, 'hockey', 'Hockey', '🏒', 'hockey',
  0.250, 0.500, 0.250,
  0.080, 1.000,
  0.050, 0.100,
  4, 2,
  'goals', 'goals',
  TRUE, TRUE,
  'Similar to Soccer with tie handling. Moderate goal differential impact.',
  TRUE, 6
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug,
  default_clwp_coeff = EXCLUDED.default_clwp_coeff,
  default_oclwp_coeff = EXCLUDED.default_oclwp_coeff,
  default_ooclwp_coeff = EXCLUDED.default_ooclwp_coeff,
  default_diff_coeff = EXCLUDED.default_diff_coeff,
  default_domination_coeff = EXCLUDED.default_domination_coeff,
  default_clgw_step = EXCLUDED.default_clgw_step,
  default_clgl_step = EXCLUDED.default_clgl_step,
  default_min_games = EXCLUDED.default_min_games,
  default_diff_interval = EXCLUDED.default_diff_interval,
  points_term = EXCLUDED.points_term,
  score_term = EXCLUDED.score_term,
  show_diff = EXCLUDED.show_diff,
  show_domination = EXCLUDED.show_domination,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Lacrosse (ID: 7)
INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, is_active, sort_order
) VALUES (
  7, 'lacrosse', 'Lacrosse', '🥍', 'lacrosse',
  0.300, 0.450, 0.250,
  0.100, 1.000,
  0.050, 0.100,
  4, 3,
  'goals', 'goals',
  TRUE, TRUE,
  'Hybrid approach balancing win/loss record with schedule strength.',
  TRUE, 7
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug,
  default_clwp_coeff = EXCLUDED.default_clwp_coeff,
  default_oclwp_coeff = EXCLUDED.default_oclwp_coeff,
  default_ooclwp_coeff = EXCLUDED.default_ooclwp_coeff,
  default_diff_coeff = EXCLUDED.default_diff_coeff,
  default_domination_coeff = EXCLUDED.default_domination_coeff,
  default_clgw_step = EXCLUDED.default_clgw_step,
  default_clgl_step = EXCLUDED.default_clgl_step,
  default_min_games = EXCLUDED.default_min_games,
  default_diff_interval = EXCLUDED.default_diff_interval,
  points_term = EXCLUDED.points_term,
  score_term = EXCLUDED.score_term,
  show_diff = EXCLUDED.show_diff,
  show_domination = EXCLUDED.show_domination,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Pickleball (ID: 8)
INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, is_active, sort_order
) VALUES (
  8, 'pickleball', 'Pickleball', '🏓', 'pickleball',
  0.250, 0.500, 0.250,
  0.020, 1.000,
  0.040, 0.080,
  6, 5,
  'points', 'points',
  TRUE, FALSE,
  'Similar to Volleyball NCAA standard. Game-based scoring with lowest differential impact.',
  TRUE, 8
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  slug = EXCLUDED.slug,
  default_clwp_coeff = EXCLUDED.default_clwp_coeff,
  default_oclwp_coeff = EXCLUDED.default_oclwp_coeff,
  default_ooclwp_coeff = EXCLUDED.default_ooclwp_coeff,
  default_diff_coeff = EXCLUDED.default_diff_coeff,
  default_domination_coeff = EXCLUDED.default_domination_coeff,
  default_clgw_step = EXCLUDED.default_clgw_step,
  default_clgl_step = EXCLUDED.default_clgl_step,
  default_min_games = EXCLUDED.default_min_games,
  default_diff_interval = EXCLUDED.default_diff_interval,
  points_term = EXCLUDED.points_term,
  score_term = EXCLUDED.score_term,
  show_diff = EXCLUDED.show_diff,
  show_domination = EXCLUDED.show_domination,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================================================
-- Verification and summary
-- ============================================================================

DO $$
DECLARE
  configured_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO configured_count 
  FROM fb_compete.sports 
  WHERE display_name IS NOT NULL 
    AND icon IS NOT NULL 
    AND slug IS NOT NULL;
  
  RAISE NOTICE '✅ Sports RPI configuration populated';
  RAISE NOTICE '   Sports with full RPI config: %', configured_count;
  
  IF configured_count >= 8 THEN
    RAISE NOTICE '   ✅ All 8 sports successfully configured';
  ELSE
    RAISE WARNING '   ⚠️  Expected 8 sports, found %', configured_count;
  END IF;
END $$;

-- Display summary
SELECT 
  id,
  name,
  display_name,
  icon,
  slug,
  CONCAT(
    default_clwp_coeff::TEXT, '-',
    default_oclwp_coeff::TEXT, '-',
    default_ooclwp_coeff::TEXT
  ) as rpi_formula,
  default_min_games as min_games,
  points_term,
  is_active
FROM fb_compete.sports
ORDER BY sort_order;

COMMIT;

