-- Migration: Create professional sports reference table
-- This separates sport configuration from application code

-- ============================================================================
-- 1. Create sports reference table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_compete.sports (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  icon VARCHAR(10),
  slug VARCHAR(50) NOT NULL UNIQUE,
  
  -- RPI Configuration
  default_clwp_coeff DECIMAL(4,3) DEFAULT 0.250,
  default_oclwp_coeff DECIMAL(4,3) DEFAULT 0.500,
  default_ooclwp_coeff DECIMAL(4,3) DEFAULT 0.250,
  default_diff_coeff DECIMAL(4,3) DEFAULT 0.100,
  default_domination_coeff DECIMAL(4,3) DEFAULT 1.000,
  default_clgw_step DECIMAL(4,3) DEFAULT 0.050,
  default_clgl_step DECIMAL(4,3) DEFAULT 0.100,
  default_min_games INTEGER DEFAULT 3,
  default_diff_interval INTEGER DEFAULT 10,
  
  -- Scoring Terminology
  points_term VARCHAR(20) DEFAULT 'points',
  score_term VARCHAR(20) DEFAULT 'score',
  
  -- Display Configuration
  show_diff BOOLEAN DEFAULT TRUE,
  show_domination BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Add comments for documentation
-- ============================================================================

COMMENT ON TABLE fb_compete.sports IS 'Reference table for sport types and their RPI configurations';
COMMENT ON COLUMN fb_compete.sports.id IS 'Unique sport identifier (1=Baseball, 2=Soccer, etc.)';
COMMENT ON COLUMN fb_compete.sports.name IS 'Internal name (lowercase, snake_case)';
COMMENT ON COLUMN fb_compete.sports.display_name IS 'User-facing display name';
COMMENT ON COLUMN fb_compete.sports.icon IS 'Emoji icon for UI display';
COMMENT ON COLUMN fb_compete.sports.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN fb_compete.sports.default_clwp_coeff IS 'Cumulative Winning Percentage coefficient (NCAA standard: 0.25)';
COMMENT ON COLUMN fb_compete.sports.default_oclwp_coeff IS 'Opponents Cumulative Winning Percentage coefficient (NCAA standard: 0.50)';
COMMENT ON COLUMN fb_compete.sports.default_ooclwp_coeff IS 'Opponents Opponents Cumulative Winning Percentage coefficient (NCAA standard: 0.25)';

-- ============================================================================
-- 3. Insert sport data based on current configuration
-- ============================================================================

INSERT INTO fb_compete.sports (
  id, name, display_name, icon, slug,
  default_clwp_coeff, default_oclwp_coeff, default_ooclwp_coeff,
  default_diff_coeff, default_domination_coeff,
  default_clgw_step, default_clgl_step,
  default_min_games, default_diff_interval,
  points_term, score_term,
  show_diff, show_domination,
  description, sort_order
) VALUES
  (
    1, 'baseball', 'Baseball', '⚾', 'baseball',
    0.250, 0.500, 0.250,
    0.050, 1.000,
    0.050, 0.100,
    5, 5,
    'runs', 'runs',
    TRUE, TRUE,
    'NCAA Standard 25-50-25 formula. Baseball requires more games for accurate RPI due to higher variance.',
    1
  ),
  (
    2, 'soccer', 'Soccer', '⚽', 'soccer',
    0.250, 0.500, 0.250,
    0.080, 1.000,
    0.050, 0.100,
    4, 3,
    'goals', 'goals',
    TRUE, TRUE,
    'NCAA Standard 25-50-25 with tie handling (ties count as 0.5 wins).',
    2
  ),
  (
    3, 'football', 'Football', '🏈', 'football',
    0.350, 0.400, 0.250,
    0.150, 0.900,
    0.060, 0.120,
    3, 14,
    'points', 'points',
    TRUE, TRUE,
    'Modified formula emphasizing win/loss record. Point differential is highly significant.',
    3
  ),
  (
    4, 'volleyball', 'Volleyball', '🏐', 'volleyball',
    0.250, 0.500, 0.250,
    0.030, 1.000,
    0.040, 0.080,
    5, 5,
    'points', 'points',
    TRUE, FALSE,
    'NCAA Standard 25-50-25. Set-based scoring means lower differential impact.',
    4
  ),
  (
    5, 'basketball', 'Basketball', '🏀', 'basketball',
    0.900, 0.100, 0.100,
    0.100, 0.900,
    0.050, 0.100,
    4, 10,
    'points', 'points',
    TRUE, TRUE,
    'Custom 90-10-10 formula. Your record matters most. Penalty for 8+ game win streaks.',
    5
  ),
  (
    6, 'hockey', 'Hockey', '🏒', 'hockey',
    0.250, 0.500, 0.250,
    0.080, 1.000,
    0.050, 0.100,
    4, 2,
    'goals', 'goals',
    TRUE, TRUE,
    'Similar to Soccer with tie handling. Moderate goal differential impact.',
    6
  ),
  (
    7, 'lacrosse', 'Lacrosse', '🥍', 'lacrosse',
    0.300, 0.450, 0.250,
    0.100, 1.000,
    0.050, 0.100,
    4, 3,
    'goals', 'goals',
    TRUE, TRUE,
    'Hybrid approach balancing win/loss record with schedule strength.',
    7
  ),
  (
    8, 'pickleball', 'Pickleball', '🏓', 'pickleball',
    0.250, 0.500, 0.250,
    0.020, 1.000,
    0.040, 0.080,
    6, 5,
    'points', 'points',
    TRUE, FALSE,
    'Similar to Volleyball NCAA standard. Game-based scoring with lowest differential impact.',
    8
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sports_slug ON fb_compete.sports(slug);
CREATE INDEX IF NOT EXISTS idx_sports_is_active ON fb_compete.sports(is_active);
CREATE INDEX IF NOT EXISTS idx_sports_sort_order ON fb_compete.sports(sort_order);

-- ============================================================================
-- 5. Add foreign key constraint to compete_event_details
-- ============================================================================

-- First, ensure all existing sport_ids are valid
DO $$
BEGIN
  -- Update any invalid sport_ids to NULL
  UPDATE fb_compete.compete_event_details
  SET sport_id = NULL
  WHERE sport_id IS NOT NULL 
    AND sport_id NOT IN (SELECT id FROM fb_compete.sports);
    
  -- Now add the foreign key constraint
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

-- Add comment to the foreign key
COMMENT ON CONSTRAINT fk_compete_event_details_sport_id 
ON fb_compete.compete_event_details IS 'Links event to sport configuration';

-- ============================================================================
-- 6. Create function to update timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION fb_compete.update_sports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Create trigger for auto-updating updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_sports_updated_at ON fb_compete.sports;
CREATE TRIGGER trigger_sports_updated_at
  BEFORE UPDATE ON fb_compete.sports
  FOR EACH ROW
  EXECUTE FUNCTION fb_compete.update_sports_updated_at();

-- ============================================================================
-- 8. Create view for easy querying
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
  s.show_domination
FROM public.events e
LEFT JOIN fb_compete.compete_event_details ced ON e.id = ced.event_id
LEFT JOIN fb_compete.sports s ON ced.sport_id = s.id;

COMMENT ON VIEW fb_compete.v_events_with_sport IS 'Denormalized view of events with their sport configuration for easy querying';

-- ============================================================================
-- 9. Grant appropriate permissions (adjust as needed for your setup)
-- ============================================================================

-- Grant read access to anon role (for public API)
GRANT SELECT ON fb_compete.sports TO anon;
GRANT SELECT ON fb_compete.v_events_with_sport TO anon;

-- Grant full access to authenticated users (adjust as needed)
GRANT SELECT ON fb_compete.sports TO authenticated;
GRANT SELECT ON fb_compete.v_events_with_sport TO authenticated;

-- ============================================================================
-- 10. Verification queries
-- ============================================================================

-- Verify all sports are inserted
DO $$
DECLARE
  sport_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sport_count FROM fb_compete.sports;
  RAISE NOTICE 'Total sports inserted: %', sport_count;
  
  IF sport_count = 8 THEN
    RAISE NOTICE '✅ All 8 sports successfully inserted';
  ELSE
    RAISE WARNING '⚠️ Expected 8 sports, found %', sport_count;
  END IF;
END $$;

-- Show summary
SELECT 
  id,
  display_name,
  icon,
  CONCAT(default_clwp_coeff::TEXT, '-', default_oclwp_coeff::TEXT, '-', default_ooclwp_coeff::TEXT) as rpi_formula,
  default_min_games as min_games,
  is_active
FROM fb_compete.sports
ORDER BY sort_order;

