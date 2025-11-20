-- Migration: Create view for easy querying of events with sport configuration

BEGIN;

-- ============================================================================
-- Create comprehensive view joining events with sports
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
  -- Sport metadata
  s.description as sport_description,
  s.is_active as sport_is_active
FROM public.events e
LEFT JOIN fb_compete.compete_event_details ced ON e.id = ced.event_id
LEFT JOIN fb_compete.sports s ON ced.sport_id = s.id;

COMMENT ON VIEW fb_compete.v_events_with_sport IS 'Denormalized view of events with their sport configuration for easy querying. Icon is stored separately for flexibility.';

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT ON fb_compete.v_events_with_sport TO anon;
GRANT SELECT ON fb_compete.v_events_with_sport TO authenticated;

-- ============================================================================
-- Test the view
-- ============================================================================

SELECT 
  event_id,
  event_name,
  sport_icon,
  sport_display_name,
  CONCAT(default_clwp_coeff, '-', default_oclwp_coeff, '-', default_ooclwp_coeff) as formula
FROM fb_compete.v_events_with_sport
WHERE sport_id IS NOT NULL
ORDER BY event_id
LIMIT 5;

COMMIT;

