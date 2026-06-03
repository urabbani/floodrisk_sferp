-- Update Impact Summary View to use new 12 exposure layers
-- This replaces the old 9 layers with the updated schema structure

-- Drop existing view and materialized view
DROP MATERIALIZED VIEW IF EXISTS impact_summary_matview CASCADE;
DROP VIEW IF EXISTS impact_summary_vw CASCADE;

-- Create updated view with 12 new exposure types
CREATE OR REPLACE VIEW impact_summary_vw AS
WITH all_combinations AS (
  SELECT
    lower(climate.climate) AS climate,
    lower(maintenance.maintenance) AS maintenance,
    rp.return_period,
    exposure.exposure_type
  FROM (
    VALUES ('present'::text), ('future'::text)
  ) climate(climate)
  CROSS JOIN (
    VALUES ('breaches'::text), ('redcapacity'::text), ('perfect'::text)
  ) maintenance(maintenance)
  CROSS JOIN (
    VALUES ('2.3'::text), ('5'::text), ('10'::text), ('25'::text), ('50'::text), ('100'::text), ('500'::text)
  ) rp(return_period)
  CROSS JOIN (
    -- Updated 12 exposure types matching new T3 schema structure
    VALUES ('BHU'::text), ('Branch_Canals'::text), ('Cropped_Area'::text), ('Drains'::text),
           ('Electric_lines'::text), ('Embankments'::text), ('Hospitals'::text), ('Main_Canals'::text),
           ('Railways'::text), ('Roads'::text), ('Schools'::text), ('Telecom_Tower'::text)
  ) exposure(exposure_type)
),
scenario_stats AS (
  SELECT
    ac.climate,
    ac.maintenance,
    ac.return_period,
    ac.exposure_type,
    get_impact_summary(ac.return_period, ac.climate, ac.maintenance, ac.exposure_type) AS impact_data
  FROM all_combinations ac
)
SELECT
  climate,
  maintenance,
  return_period,
  exposure_type,
  (return_period)::numeric AS return_period_num,
  ((impact_data ->> 'totalFeatures'::text))::integer AS total_features,
  ((impact_data ->> 'affectedFeatures'::text))::integer AS affected_features,
  (impact_data ->> 'maxDepthBin'::text) AS max_depth_bin,
  ((((impact_data -> 'depthBins'::text) -> 0) ->> 'count'::text))::integer AS bin_15_100cm_count,
  ((((impact_data -> 'depthBins'::text) -> 1) ->> 'count'::text))::integer AS bin_1_2m_count,
  ((((impact_data -> 'depthBins'::text) -> 2) ->> 'count'::text))::integer AS bin_2_3m_count,
  ((((impact_data -> 'depthBins'::text) -> 3) ->> 'count'::text))::integer AS bin_3_4m_count,
  ((((impact_data -> 'depthBins'::text) -> 4) ->> 'count'::text))::integer AS bin_4_5m_count,
  ((((impact_data -> 'depthBins'::text) -> 5) ->> 'count'::text))::integer AS bin_above5m_count
FROM scenario_stats ss;

-- Create materialized view from the updated view
CREATE MATERIALIZED VIEW impact_summary_matview AS
SELECT * FROM impact_summary_vw;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_impact_summary_climate ON impact_summary_matview(climate);
CREATE INDEX IF NOT EXISTS idx_impact_summary_maintenance ON impact_summary_matview(maintenance);
CREATE INDEX IF NOT EXISTS idx_impact_summary_return_period ON impact_summary_matview(return_period);
CREATE INDEX IF NOT EXISTS idx_impact_summary_exposure_type ON impact_summary_matview(exposure_type);
CREATE INDEX IF NOT EXISTS idx_impact_summary_composite ON impact_summary_matview(climate, maintenance, return_period, exposure_type);

-- Add comment
COMMENT ON MATERIALIZED VIEW impact_summary_matview IS 'Impact summary statistics for 12 exposure types across all flood scenarios (updated with new layer structure)';
