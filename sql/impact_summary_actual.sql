-- ============================================================================
-- Flood Impact & Exposure Summary Query (Actual Database Structure)
-- ============================================================================
-- This SQL script is tailored for the actual database schema where:
-- - Schemas are named: T3_{rp}yrs_{Climate}_{Maintenance}_Impacted
-- - Tables are named: BHU, Buildings, Built_up_Area, Cropped_Area, etc.
-- - depth_bin is a TEXT column with values: '15-100cm', '1-2m', '2-3m', '3-4m', '4-5m', 'above5m'
--
-- Required Extensions:
-- - PostGIS
-- ============================================================================

-- Drop existing objects if they exist
DROP MATERIALIZED VIEW IF EXISTS impact_summary_matview CASCADE;
DROP VIEW IF EXISTS impact_summary_vw CASCADE;
DROP FUNCTION IF EXISTS get_impact_summary(text, text, text, text) CASCADE;

-- ============================================================================
-- FUNCTION: get_impact_summary
-- ============================================================================
-- Returns aggregated impact statistics for a single scenario/exposure combination
--
-- Parameters:
--   p_return_period: Return period (e.g., '25', '50', '100')
--   p_climate: Climate scenario ('present' or 'future')
--   p_maintenance: Maintenance level ('breaches', 'redcapacity', 'perfect')
--   p_exposure_type: Exposure layer type ('Buildings', 'Roads', etc.)
--
-- Returns:
--   JSON object with impact statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_impact_summary(
  p_return_period TEXT,
  p_climate TEXT,
  p_maintenance TEXT,
  p_exposure_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema_name TEXT;
  v_total_features INTEGER;
  v_affected_features INTEGER;
  v_max_depth_bin TEXT;
  v_result JSON;
BEGIN
  -- Build the schema name: T3_{rp}yrs_{Climate}_{Maintenance}_Impacted
  -- Climate: Present/Future
  -- Maintenance: Breaches/RedCapacity/Perfect
  v_schema_name := 'T3_' || p_return_period || 'yrs_' ||
                   initcap(p_climate) || '_' ||
                   CASE
                     WHEN p_maintenance = 'breaches' THEN 'Breaches'
                     WHEN p_maintenance = 'redcapacity' THEN 'RedCapacity'
                     WHEN p_maintenance = 'perfect' THEN 'Perfect'
                     ELSE initcap(p_maintenance)
                   END || '_Impacted';

  -- Execute dynamic SQL to get statistics
  BEGIN
    EXECUTE format(
      'WITH stats AS (
        SELECT
          COUNT(*) as total_features,
          COUNT(CASE WHEN depth_bin IS NOT NULL AND depth_bin != '' THEN 1 END) as affected_features,
          -- Determine max depth bin by order
          CASE
            WHEN COUNT(*) FILTER (WHERE depth_bin = ''above5m'') > 0 THEN ''above5m''
            WHEN COUNT(*) FILTER (WHERE depth_bin = ''4-5m'') > 0 THEN ''4-5m''
            WHEN COUNT(*) FILTER (WHERE depth_bin = ''3-4m'') > 0 THEN ''3-4m''
            WHEN COUNT(*) FILTER (WHERE depth_bin = ''2-3m'') > 0 THEN ''2-3m''
            WHEN COUNT(*) FILTER (WHERE depth_bin = ''1-2m'') > 0 THEN ''1-2m''
            WHEN COUNT(*) FILTER (WHERE depth_bin = ''15-100cm'') > 0 THEN ''15-100cm''
            ELSE NULL
          END as max_depth_bin,
          COUNT(*) FILTER (WHERE depth_bin = ''15-100cm'') as bin_15_100cm,
          COUNT(*) FILTER (WHERE depth_bin = ''1-2m'') as bin_1_2m,
          COUNT(*) FILTER (WHERE depth_bin = ''2-3m'') as bin_2_3m,
          COUNT(*) FILTER (WHERE depth_bin = ''3-4m'') as bin_3_4m,
          COUNT(*) FILTER (WHERE depth_bin = ''4-5m'') as bin_4_5m,
          COUNT(*) FILTER (WHERE depth_bin = ''above5m'') as bin_above5m
        FROM %I.%I
      )
      SELECT json_build_object(
        ''layerType'', %L,
        ''totalFeatures'', total_features,
        ''affectedFeatures'', affected_features,
        ''maxDepthBin'', max_depth_bin,
        ''depthBins'', json_build_array(
          json_build_object(''range'', ''15-100cm'', ''count'', bin_15_100cm),
          json_build_object(''range'', ''1-2m'', ''count'', bin_1_2m),
          json_build_object(''range'', ''2-3m'', ''count'', bin_2_3m),
          json_build_object(''range'', ''3-4m'', ''count'', bin_3_4m),
          json_build_object(''range'', ''4-5m'', ''count'', bin_4_5m),
          json_build_object(''range'', ''above5m'', ''count'', bin_above5m)
        )
      ) FROM stats',
      v_schema_name, p_exposure_type, p_exposure_type
    ) INTO v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Table doesn't exist, return null impact
      v_result := json_build_object(
        'layerType', p_exposure_type,
        'totalFeatures', 0,
        'affectedFeatures', 0,
        'maxDepthBin', NULL,
        'depthBins', '[]'::json
      );
  END;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- VIEW: impact_summary_vw
-- ============================================================================
-- Provides a comprehensive summary of impacts across all scenarios
--
-- Usage:
--   SELECT * FROM impact_summary_vw
--   WHERE lower(climate) = 'present'
--   ORDER BY return_period_num, maintenance, exposure_type;
-- ============================================================================

CREATE OR REPLACE VIEW impact_summary_vw AS
WITH all_combinations AS (
  -- Generate all scenario combinations
  SELECT
    lower(climate) as climate,
    lower(maintenance) as maintenance,
    return_period,
    exposure_type
  FROM (
    VALUES ('present'), ('future')
  ) AS climate(climate)
  CROSS JOIN (
    VALUES ('breaches'), ('redcapacity'), ('perfect')
  ) AS maintenance(maintenance)
  CROSS JOIN (
    VALUES ('2.3'), ('5'), ('10'), ('25'), ('50'), ('100'), ('500')
  ) AS rp(return_period)
  CROSS JOIN (
    VALUES ('BHU'), ('Buildings'), ('Built_up_Area'), ('Cropped_Area'),
           ('Electric_Grid'), ('Railways'), ('Roads'), ('Settlements'), ('Telecom_Towers')
  ) AS exposure(exposure_type)
),
scenario_stats AS (
  -- For each combination, get the actual statistics
  SELECT
    ac.climate,
    ac.maintenance,
    ac.return_period,
    ac.exposure_type,
    get_impact_summary(ac.return_period::text, ac.climate, ac.maintenance, ac.exposure_type) AS impact_data
  FROM all_combinations ac
)
-- Parse the JSON and return as structured rows
SELECT
  ss.climate,
  ss.maintenance,
  ss.return_period,
  ss.exposure_type,
  CAST(ss.return_period AS NUMERIC) as return_period_num,  -- For sorting
  (ss.impact_data->>'totalFeatures')::integer AS total_features,
  (ss.impact_data->>'affectedFeatures')::integer AS affected_features,
  ss.impact_data->>'maxDepthBin' AS max_depth_bin,
  -- Depth bin counts
  (ss.impact_data->'depthBins'->0->>'count')::integer AS bin_15_100cm_count,
  (ss.impact_data->'depthBins'->1->>'count')::integer AS bin_1_2m_count,
  (ss.impact_data->'depthBins'->2->>'count')::integer AS bin_2_3m_count,
  (ss.impact_data->'depthBins'->3->>'count')::integer AS bin_3_4m_count,
  (ss.impact_data->'depthBins'->4->>'count')::integer AS bin_4_5m_count,
  (ss.impact_data->'depthBins'->5->>'count')::integer AS bin_above5m_count
FROM scenario_stats ss;

-- ============================================================================
-- MATERIALIZED VIEW: impact_summary_matview (Optional - for performance)
-- ============================================================================
-- Create a materialized view for faster queries
-- Refresh periodically: REFRESH MATERIALIZED VIEW impact_summary_matview;
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS impact_summary_matview AS
SELECT * FROM impact_summary_vw;

-- Create indexes on materialized view
CREATE INDEX IF NOT EXISTS idx_impact_summary_climate ON impact_summary_matview(climate);
CREATE INDEX IF NOT EXISTS idx_impact_summary_maintenance ON impact_summary_matview(maintenance);
CREATE INDEX IF NOT EXISTS idx_impact_summary_return_period ON impact_summary_matview(return_period);
CREATE INDEX IF NOT EXISTS idx_impact_summary_exposure_type ON impact_summary_matview(exposure_type);

COMMENT ON FUNCTION get_impact_summary IS 'Returns impact statistics for a single scenario/exposure combination';
COMMENT ON VIEW impact_summary_vw IS 'Comprehensive impact summary across all scenarios and exposure types';
COMMENT ON MATERIALIZED VIEW impact_summary_matview IS 'Materialized version of impact_summary_vw for better performance';

-- ============================================================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================================================

-- Test single scenario/exposure
-- SELECT get_impact_summary('25', 'present', 'breaches', 'Buildings');

-- Get all impacts for present climate
-- SELECT * FROM impact_summary_vw WHERE climate = 'present' ORDER BY return_period_num, maintenance;

-- Get scenario summary (count affected exposure types per scenario)
-- SELECT
--   climate,
--   maintenance,
--   return_period,
--   COUNT(*) FILTER (WHERE affected_features > 0) as affected_exposure_types,
--   SUM(affected_features) as total_affected_features,
--   MAX(max_depth_bin) as max_depth_bin_in_scenario
-- FROM impact_summary_vw
-- WHERE climate = 'present'
-- GROUP BY climate, maintenance, return_period
-- ORDER BY return_period_num, maintenance;

-- Get impact summary for a specific return period across all maintenances
-- SELECT * FROM impact_summary_vw
-- WHERE climate = 'present' AND return_period = '25'
-- ORDER BY maintenance, exposure_type;

-- Refresh materialized view
-- REFRESH MATERIALIZED VIEW impact_summary_matview;
