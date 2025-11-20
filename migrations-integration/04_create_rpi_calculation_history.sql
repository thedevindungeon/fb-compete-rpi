-- Migration: Create historical RPI calculation tracking
-- Compact, professional schema for storing RPI snapshots over time

BEGIN;

-- ============================================================================
-- 1. Create RPI calculation runs table (metadata)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_compete.rpi_calculation_runs (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  sport_id INTEGER NOT NULL,
  
  -- Snapshot metadata
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_as_of TIMESTAMPTZ, -- When the match data was last updated
  
  -- Coefficients used (snapshot for historical accuracy)
  clwp_coeff DECIMAL(4,3) NOT NULL,
  oclwp_coeff DECIMAL(4,3) NOT NULL,
  ooclwp_coeff DECIMAL(4,3) NOT NULL,
  diff_coeff DECIMAL(4,3) NOT NULL,
  domination_coeff DECIMAL(4,3) NOT NULL,
  
  -- Calculation statistics
  total_teams INTEGER NOT NULL,
  total_matches INTEGER NOT NULL,
  matches_with_scores INTEGER NOT NULL,
  calculation_duration_ms INTEGER, -- Performance tracking
  
  -- User/trigger info
  calculated_by_user_id BIGINT,
  calculation_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'auto', 'scheduled'
  
  -- Optional notes
  notes TEXT,
  
  -- Indexes
  CONSTRAINT fk_rpi_runs_event FOREIGN KEY (event_id) 
    REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT fk_rpi_runs_sport FOREIGN KEY (sport_id) 
    REFERENCES fb_compete.sports(id) ON DELETE RESTRICT
);

CREATE INDEX idx_rpi_runs_event_id ON fb_compete.rpi_calculation_runs(event_id);
CREATE INDEX idx_rpi_runs_calculated_at ON fb_compete.rpi_calculation_runs(calculated_at DESC);
CREATE INDEX idx_rpi_runs_event_date ON fb_compete.rpi_calculation_runs(event_id, calculated_at DESC);

COMMENT ON TABLE fb_compete.rpi_calculation_runs IS 'Metadata for each RPI calculation run, stores coefficients and statistics';
COMMENT ON COLUMN fb_compete.rpi_calculation_runs.data_as_of IS 'Timestamp of the most recent match data included in calculation';
COMMENT ON COLUMN fb_compete.rpi_calculation_runs.calculation_type IS 'How calculation was triggered: manual, auto, or scheduled';

-- ============================================================================
-- 2. Create RPI results table (actual rankings - COMPACT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_compete.rpi_results (
  run_id BIGINT NOT NULL,
  team_id BIGINT NOT NULL,
  
  -- Core RPI values (highly compact - only essential data)
  rank SMALLINT NOT NULL,
  rpi DECIMAL(6,4) NOT NULL, -- Final RPI score
  
  -- Component values (for analysis)
  wp DECIMAL(5,4) NOT NULL,   -- Winning percentage
  owp DECIMAL(5,4) NOT NULL,  -- Opponent winning percentage
  oowp DECIMAL(5,4) NOT NULL, -- Opponent's opponent winning percentage
  
  -- Match statistics (compact)
  wins SMALLINT NOT NULL,
  losses SMALLINT NOT NULL,
  ties SMALLINT DEFAULT 0,
  
  -- Optional advanced metrics (NULL if not applicable)
  point_diff INTEGER,
  domination_penalty DECIMAL(4,3),
  
  -- Composite primary key (no separate ID needed for space efficiency)
  PRIMARY KEY (run_id, team_id),
  
  CONSTRAINT fk_rpi_results_run FOREIGN KEY (run_id) 
    REFERENCES fb_compete.rpi_calculation_runs(id) ON DELETE CASCADE,
  CONSTRAINT fk_rpi_results_team FOREIGN KEY (team_id) 
    REFERENCES fb_compete.teams(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_rpi_results_rank ON fb_compete.rpi_results(run_id, rank);
CREATE INDEX idx_rpi_results_team ON fb_compete.rpi_results(team_id, run_id DESC);
CREATE INDEX idx_rpi_results_rpi ON fb_compete.rpi_results(run_id, rpi DESC);

COMMENT ON TABLE fb_compete.rpi_results IS 'Compact storage of RPI calculation results. Each row = one team in one calculation run.';
COMMENT ON COLUMN fb_compete.rpi_results.rpi IS 'Final calculated RPI score (0.0000 to 1.0000)';
COMMENT ON COLUMN fb_compete.rpi_results.domination_penalty IS 'Penalty applied for dominating wins (NULL if not applicable)';

-- ============================================================================
-- 3. Create view for latest RPI by event
-- ============================================================================

CREATE OR REPLACE VIEW fb_compete.v_latest_rpi_by_event AS
WITH latest_runs AS (
  SELECT DISTINCT ON (event_id)
    id as run_id,
    event_id,
    calculated_at
  FROM fb_compete.rpi_calculation_runs
  ORDER BY event_id, calculated_at DESC
)
SELECT 
  lr.event_id,
  lr.calculated_at as last_calculated,
  r.team_id,
  t.name as team_name,
  r.rank,
  r.rpi,
  r.wp,
  r.owp,
  r.oowp,
  r.wins,
  r.losses,
  r.ties,
  r.point_diff,
  r.domination_penalty,
  run.sport_id,
  s.display_name as sport_name,
  s.icon as sport_icon
FROM latest_runs lr
JOIN fb_compete.rpi_results r ON lr.run_id = r.run_id
JOIN fb_compete.teams t ON r.team_id = t.id
JOIN fb_compete.rpi_calculation_runs run ON lr.run_id = run.id
LEFT JOIN fb_compete.sports s ON run.sport_id = s.id
ORDER BY lr.event_id, r.rank;

COMMENT ON VIEW fb_compete.v_latest_rpi_by_event IS 'Shows the most recent RPI calculation for each event';

-- ============================================================================
-- 4. Create view for RPI history (trend analysis)
-- ============================================================================

CREATE OR REPLACE VIEW fb_compete.v_rpi_history AS
SELECT 
  run.id as run_id,
  run.event_id,
  run.calculated_at,
  run.calculation_type,
  r.team_id,
  t.name as team_name,
  r.rank,
  r.rpi,
  r.wp,
  r.wins,
  r.losses,
  r.ties,
  run.total_teams,
  run.total_matches,
  s.display_name as sport_name,
  s.icon as sport_icon,
  -- Calculate rank change (requires window function in query)
  LAG(r.rank) OVER (PARTITION BY r.team_id, run.event_id ORDER BY run.calculated_at) as previous_rank,
  LAG(r.rpi) OVER (PARTITION BY r.team_id, run.event_id ORDER BY run.calculated_at) as previous_rpi
FROM fb_compete.rpi_calculation_runs run
JOIN fb_compete.rpi_results r ON run.id = r.run_id
JOIN fb_compete.teams t ON r.team_id = t.id
LEFT JOIN fb_compete.sports s ON run.sport_id = s.id
ORDER BY run.event_id, run.calculated_at DESC, r.rank;

COMMENT ON VIEW fb_compete.v_rpi_history IS 'Complete RPI history with trend analysis (previous rank/RPI)';

-- ============================================================================
-- 5. Create function to get RPI comparison between two runs
-- ============================================================================

CREATE OR REPLACE FUNCTION fb_compete.compare_rpi_runs(
  p_run_id_1 BIGINT,
  p_run_id_2 BIGINT
)
RETURNS TABLE (
  team_id BIGINT,
  team_name VARCHAR,
  run1_rank SMALLINT,
  run1_rpi DECIMAL,
  run2_rank SMALLINT,
  run2_rpi DECIMAL,
  rank_change INTEGER,
  rpi_change DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r1.team_id,
    t.name::VARCHAR as team_name,
    r1.rank as run1_rank,
    r1.rpi as run1_rpi,
    r2.rank as run2_rank,
    r2.rpi as run2_rpi,
    (r1.rank - r2.rank)::INTEGER as rank_change,
    (r2.rpi - r1.rpi)::DECIMAL as rpi_change
  FROM fb_compete.rpi_results r1
  JOIN fb_compete.rpi_results r2 ON r1.team_id = r2.team_id
  JOIN fb_compete.teams t ON r1.team_id = t.id
  WHERE r1.run_id = p_run_id_1
    AND r2.run_id = p_run_id_2
  ORDER BY r2.rank;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fb_compete.compare_rpi_runs IS 'Compare RPI results between two calculation runs';

-- ============================================================================
-- 6. Create function to clean up old calculations (data retention)
-- ============================================================================

CREATE OR REPLACE FUNCTION fb_compete.cleanup_old_rpi_calculations(
  p_event_id BIGINT,
  p_keep_count INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Keep only the N most recent calculations per event
  WITH runs_to_keep AS (
    SELECT id
    FROM fb_compete.rpi_calculation_runs
    WHERE event_id = p_event_id
    ORDER BY calculated_at DESC
    LIMIT p_keep_count
  )
  DELETE FROM fb_compete.rpi_calculation_runs
  WHERE event_id = p_event_id
    AND id NOT IN (SELECT id FROM runs_to_keep);
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fb_compete.cleanup_old_rpi_calculations IS 'Delete old RPI calculations, keeping only the N most recent per event';

-- ============================================================================
-- 7. Grant permissions
-- ============================================================================

GRANT SELECT ON fb_compete.rpi_calculation_runs TO anon, authenticated;
GRANT SELECT ON fb_compete.rpi_results TO anon, authenticated;
GRANT SELECT ON fb_compete.v_latest_rpi_by_event TO anon, authenticated;
GRANT SELECT ON fb_compete.v_rpi_history TO anon, authenticated;

-- For authenticated users who can trigger calculations
GRANT INSERT ON fb_compete.rpi_calculation_runs TO authenticated;
GRANT INSERT ON fb_compete.rpi_results TO authenticated;
GRANT USAGE ON SEQUENCE fb_compete.rpi_calculation_runs_id_seq TO authenticated;

-- ============================================================================
-- 8. Create trigger for automatic cleanup (optional)
-- ============================================================================

CREATE OR REPLACE FUNCTION fb_compete.auto_cleanup_old_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- After inserting a new calculation, clean up old ones
  -- Keep last 20 calculations per event
  PERFORM fb_compete.cleanup_old_rpi_calculations(NEW.event_id, 20);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_cleanup_rpi
  AFTER INSERT ON fb_compete.rpi_calculation_runs
  FOR EACH ROW
  EXECUTE FUNCTION fb_compete.auto_cleanup_old_calculations();

COMMENT ON TRIGGER trigger_auto_cleanup_rpi ON fb_compete.rpi_calculation_runs IS 'Automatically cleanup old calculations, keeping last 20 per event';

-- ============================================================================
-- 9. Verification and summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RPI calculation history tables created';
  RAISE NOTICE '   - rpi_calculation_runs: Stores calculation metadata';
  RAISE NOTICE '   - rpi_results: Stores team rankings (compact schema)';
  RAISE NOTICE '   - 2 views for easy querying';
  RAISE NOTICE '   - 2 utility functions';
  RAISE NOTICE '   - Auto-cleanup trigger (keeps last 20 per event)';
END $$;

COMMIT;

