-- Migration: Populate sports table with professional configuration
-- Updates existing sports with complete RPI settings and display info

BEGIN;

-- ============================================================================
-- Update existing sports with full configuration
-- ============================================================================

-- Baseball (ID: 1)
UPDATE fb_compete.sports
SET 
  display_name = 'Baseball',
  icon = '⚾',
  slug = 'baseball',
  default_clwp_coeff = 0.250,
  default_oclwp_coeff = 0.500,
  default_ooclwp_coeff = 0.250,
  default_diff_coeff = 0.050,
  default_domination_coeff = 1.000,
  default_clgw_step = 0.050,
  default_clgl_step = 0.100,
  default_min_games = 5,
  default_diff_interval = 5,
  points_term = 'runs',
  score_term = 'runs',
  show_diff = TRUE,
  show_domination = TRUE,
  description = 'NCAA Standard 25-50-25 formula. Baseball requires more games for accurate RPI due to higher variance.',
  is_active = TRUE,
  sort_order = 1
WHERE id = 1;

-- Soccer (ID: 2)
UPDATE fb_compete.sports
SET 
  display_name = 'Soccer',
  icon = '⚽',
  slug = 'soccer',
  default_clwp_coeff = 0.250,
  default_oclwp_coeff = 0.500,
  default_ooclwp_coeff = 0.250,
  default_diff_coeff = 0.080,
  default_domination_coeff = 1.000,
  default_clgw_step = 0.050,
  default_clgl_step = 0.100,
  default_min_games = 4,
  default_diff_interval = 3,
  points_term = 'goals',
  score_term = 'goals',
  show_diff = TRUE,
  show_domination = TRUE,
  description = 'NCAA Standard 25-50-25 with tie handling (ties count as 0.5 wins).',
  is_active = TRUE,
  sort_order = 2
WHERE id = 2;

-- Football (ID: 3)
UPDATE fb_compete.sports
SET 
  display_name = 'Football',
  icon = '🏈',
  slug = 'football',
  default_clwp_coeff = 0.350,
  default_oclwp_coeff = 0.400,
  default_ooclwp_coeff = 0.250,
  default_diff_coeff = 0.150,
  default_domination_coeff = 0.900,
  default_clgw_step = 0.060,
  default_clgl_step = 0.120,
  default_min_games = 3,
  default_diff_interval = 14,
  points_term = 'points',
  score_term = 'points',
  show_diff = TRUE,
  show_domination = TRUE,
  description = 'Modified formula emphasizing win/loss record. Point differential is highly significant.',
  is_active = TRUE,
  sort_order = 3
WHERE id = 3;

-- Volleyball (ID: 4)
UPDATE fb_compete.sports
SET 
  display_name = 'Volleyball',
  icon = '🏐',
  slug = 'volleyball',
  default_clwp_coeff = 0.250,
  default_oclwp_coeff = 0.500,
  default_ooclwp_coeff = 0.250,
  default_diff_coeff = 0.030,
  default_domination_coeff = 1.000,
  default_clgw_step = 0.040,
  default_clgl_step = 0.080,
  default_min_games = 5,
  default_diff_interval = 5,
  points_term = 'points',
  score_term = 'points',
  show_diff = TRUE,
  show_domination = FALSE,
  description = 'NCAA Standard 25-50-25. Set-based scoring means lower differential impact.',
  is_active = TRUE,
  sort_order = 4
WHERE id = 4;

-- Basketball (ID: 5)
UPDATE fb_compete.sports
SET 
  display_name = 'Basketball',
  icon = '🏀',
  slug = 'basketball',
  default_clwp_coeff = 0.900,
  default_oclwp_coeff = 0.100,
  default_ooclwp_coeff = 0.100,
  default_diff_coeff = 0.100,
  default_domination_coeff = 0.900,
  default_clgw_step = 0.050,
  default_clgl_step = 0.100,
  default_min_games = 4,
  default_diff_interval = 10,
  points_term = 'points',
  score_term = 'points',
  show_diff = TRUE,
  show_domination = TRUE,
  description = 'Custom 90-10-10 formula. Your record matters most. Penalty for 8+ game win streaks.',
  is_active = TRUE,
  sort_order = 5
WHERE id = 5;

-- Hockey (ID: 6)
UPDATE fb_compete.sports
SET 
  display_name = 'Hockey',
  icon = '🏒',
  slug = 'hockey',
  default_clwp_coeff = 0.250,
  default_oclwp_coeff = 0.500,
  default_ooclwp_coeff = 0.250,
  default_diff_coeff = 0.080,
  default_domination_coeff = 1.000,
  default_clgw_step = 0.050,
  default_clgl_step = 0.100,
  default_min_games = 4,
  default_diff_interval = 2,
  points_term = 'goals',
  score_term = 'goals',
  show_diff = TRUE,
  show_domination = TRUE,
  description = 'Similar to Soccer with tie handling. Moderate goal differential impact.',
  is_active = TRUE,
  sort_order = 6
WHERE id = 6;

-- Lacrosse (ID: 7)
UPDATE fb_compete.sports
SET 
  display_name = 'Lacrosse',
  icon = '🥍',
  slug = 'lacrosse',
  default_clwp_coeff = 0.300,
  default_oclwp_coeff = 0.450,
  default_ooclwp_coeff = 0.250,
  default_diff_coeff = 0.100,
  default_domination_coeff = 1.000,
  default_clgw_step = 0.050,
  default_clgl_step = 0.100,
  default_min_games = 4,
  default_diff_interval = 3,
  points_term = 'goals',
  score_term = 'goals',
  show_diff = TRUE,
  show_domination = TRUE,
  description = 'Hybrid approach balancing win/loss record with schedule strength.',
  is_active = TRUE,
  sort_order = 7
WHERE id = 7;

-- Pickleball (ID: 8)
UPDATE fb_compete.sports
SET 
  display_name = 'Pickleball',
  icon = '🏓',
  slug = 'pickleball',
  default_clwp_coeff = 0.250,
  default_oclwp_coeff = 0.500,
  default_ooclwp_coeff = 0.250,
  default_diff_coeff = 0.020,
  default_domination_coeff = 1.000,
  default_clgw_step = 0.040,
  default_clgl_step = 0.080,
  default_min_games = 6,
  default_diff_interval = 5,
  points_term = 'points',
  score_term = 'points',
  show_diff = TRUE,
  show_domination = FALSE,
  description = 'Similar to Volleyball NCAA standard. Game-based scoring with lowest differential impact.',
  is_active = TRUE,
  sort_order = 8
WHERE id = 8;

-- ============================================================================
-- Verify all sports were updated
-- ============================================================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM fb_compete.sports 
  WHERE display_name IS NOT NULL AND icon IS NOT NULL;
  
  RAISE NOTICE 'Sports updated with full configuration: %', updated_count;
  
  IF updated_count >= 8 THEN
    RAISE NOTICE '✅ All sports successfully configured';
  ELSE
    RAISE WARNING '⚠️ Expected at least 8 sports, found %', updated_count;
  END IF;
END $$;

-- ============================================================================
-- Display summary
-- ============================================================================

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

