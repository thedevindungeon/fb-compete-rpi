-- Create team_rpi table in fb_compete schema
CREATE TABLE IF NOT EXISTS fb_compete.team_rpi (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES fb_compete.teams(id) ON DELETE CASCADE,
  sport_id BIGINT NOT NULL,
  value NUMERIC(10, 6) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Add indexes for common queries
  CONSTRAINT team_rpi_team_id_sport_id_generated_at_key UNIQUE (team_id, sport_id, generated_at)
);

-- Indexes
CREATE INDEX idx_team_rpi_team_id ON fb_compete.team_rpi(team_id);
CREATE INDEX idx_team_rpi_sport_id ON fb_compete.team_rpi(sport_id);
CREATE INDEX idx_team_rpi_team_sport ON fb_compete.team_rpi(team_id, sport_id);
CREATE INDEX idx_team_rpi_active ON fb_compete.team_rpi(active) WHERE active = TRUE;
CREATE INDEX idx_team_rpi_generated_at ON fb_compete.team_rpi(generated_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION fb_compete.update_team_rpi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_rpi_updated_at
  BEFORE UPDATE ON fb_compete.team_rpi
  FOR EACH ROW
  EXECUTE FUNCTION fb_compete.update_team_rpi_updated_at();

-- Comment
COMMENT ON TABLE fb_compete.team_rpi IS 'Historical RPI calculations for teams';

