-- Migration: Create population impact statistics table
-- Description: Stores population impacted data for each flood scenario
-- Date: 2026-03-16

-- Create schema if not exists (for organization)
CREATE SCHEMA IF NOT EXISTS impact;

-- Drop table if exists (for clean re-runs during development)
DROP TABLE IF EXISTS impact.population_stats CASCADE;

-- Create population impact statistics table
CREATE TABLE impact.population_stats (
  id SERIAL PRIMARY KEY,
  climate VARCHAR(10) NOT NULL CHECK (climate IN ('present', 'future')),
  maintenance VARCHAR(20) NOT NULL CHECK (maintenance IN ('breaches', 'redcapacity', 'perfect')),
  return_period VARCHAR(10) NOT NULL CHECK (return_period IN ('2.3', '5', '10', '25', '50', '100', '500')),

  -- Population totals
  total_population NUMERIC(12,2) NOT NULL, -- Total population in study area
  affected_population NUMERIC(12,2) NOT NULL, -- Population affected by flood (any depth)
  affected_percentage NUMERIC(5,2) NOT NULL, -- (affected / total) * 100

  -- Population by depth bin (from Excel files)
  pop_15_100cm NUMERIC(12,2) DEFAULT 0, -- Population in 15-100cm depth
  pop_1_2m NUMERIC(12,2) DEFAULT 0, -- Population in 1-2m depth
  pop_2_3m NUMERIC(12,2) DEFAULT 0, -- Population in 2-3m depth
  pop_3_4m NUMERIC(12,2) DEFAULT 0, -- Population in 3-4m depth
  pop_4_5m NUMERIC(12,2) DEFAULT 0, -- Population in 4-5m depth
  pop_above5m NUMERIC(12,2) DEFAULT 0, -- Population in >5m depth

  -- Metadata
  source_file VARCHAR(255), -- Source Excel filename
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one record per scenario
  UNIQUE(climate, maintenance, return_period)
);

-- Create index for fast scenario-based lookups
CREATE INDEX idx_population_stats_scenario
  ON impact.population_stats(climate, maintenance, return_period);

-- Create index for filtering by climate
CREATE INDEX idx_population_stats_climate
  ON impact.population_stats(climate);

-- Create index for filtering by severity (percentage)
CREATE INDEX idx_population_stats_severity
  ON impact.population_stats(affected_percentage);

-- Add comments for documentation
COMMENT ON TABLE impact.population_stats IS 'Population impact statistics for each flood scenario';
COMMENT ON COLUMN impact.population_stats.climate IS 'Climate scenario: present or future';
COMMENT ON COLUMN impact.population_stats.maintenance IS 'Maintenance level: breaches, redcapacity, or perfect';
COMMENT ON COLUMN impact.population_stats.return_period IS 'Return period in years: 2.3, 5, 10, 25, 50, 100, or 500';
COMMENT ON COLUMN impact.population_stats.total_population IS 'Total population in the study area';
COMMENT ON COLUMN impact.population_stats.affected_population IS 'Total population affected by flooding (any depth)';
COMMENT ON COLUMN impact.population_stats.affected_percentage IS 'Percentage of population affected: (affected / total) * 100';
COMMENT ON COLUMN impact.population_stats.source_file IS 'Source Excel filename (e.g., Exposure_Consolidated_T3_2.3yrs_Future_Breaches.xlsx)';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON impact.population_stats TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE impact.population_stats_id_seq TO your_app_user;
