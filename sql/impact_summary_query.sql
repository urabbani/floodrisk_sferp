-- ============================================================================
-- Flood Impact & Exposure Summary Query
-- ============================================================================
-- This SQL script creates views and functions for aggregating flood impact
-- statistics across 42 scenarios and 9 exposure layer types.
--
-- Schema Assumptions:
-- - Impact layers are in PostGIS with geometry and depth_bin attribute
-- - Layer naming: t3_{rp}yrs_{climate}_{maintenance}_{exposureType}
-- - depth_bin column contains flood depth in meters
--
-- Required Extensions:
-- - PostGIS
-- ============================================================================

-- Drop existing objects if they exist (for clean re-runs)
DROP VIEW IF EXISTS impact_summary_vw CASCADE;
DROP FUNCTION IF EXISTS get_impact_summary(text, text, text, numeric) CASCADE;

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
--   p_depth_threshold: Minimum depth to consider as "affected" (default: 0)
--
-- Returns:
--   JSON object with impact statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_impact_summary(
  p_return_period TEXT,
  p_climate TEXT,
  p_maintenance TEXT,
  p_exposure_type TEXT,
  p_depth_threshold NUMERIC DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_layer_name TEXT;
  v_total_features INTEGER;
  v_affected_features INTEGER;
  v_max_depth NUMERIC;
  v_result JSON;
BEGIN
  -- Build the layer name
  v_layer_name := 't3_' || p_return_period || 'yrs_' || p_climate || '_' || p_maintenance || '_' || p_exposure_type;

  -- Execute dynamic SQL to get statistics
  EXECUTE format(
    'WITH stats AS (
      SELECT
        COUNT(*) as total_features,
        COUNT(CASE WHEN depth_bin >= %L THEN 1 END) as affected_features,
        MAX(depth_bin) as max_depth,
        COUNT(CASE WHEN depth_bin >= 0 AND depth_bin < 1 THEN 1 END) as bin_0_1,
        COUNT(CASE WHEN depth_bin >= 1 AND depth_bin < 2 THEN 1 END) as bin_1_2,
        COUNT(CASE WHEN depth_bin >= 2 AND depth_bin < 3 THEN 1 END) as bin_2_3,
        COUNT(CASE WHEN depth_bin >= 3 AND depth_bin < 4 THEN 1 END) as bin_3_4,
        COUNT(CASE WHEN depth_bin >= 4 AND depth_bin < 5 THEN 1 END) as bin_4_5,
        COUNT(CASE WHEN depth_bin >= 5 THEN 1 END) as bin_5_plus
      FROM %I
      WHERE depth_bin IS NOT NULL
    )
    SELECT json_build_object(
      ''layerType'', %L,
      ''totalFeatures'', total_features,
      ''affectedFeatures'', affected_features,
      ''maxDepth'', COALESCE(max_depth, 0),
      ''depthBins'', json_build_array(
        json_build_object(''range'', ''0-1m'', ''minDepth'', 0, ''maxDepth'', 1, ''count'', bin_0_1),
        json_build_object(''range'', ''1-2m'', ''minDepth'', 1, ''maxDepth'', 2, ''count'', bin_1_2),
        json_build_object(''range'', ''2-3m'', ''minDepth'', 2, ''maxDepth'', 3, ''count'', bin_2_3),
        json_build_object(''range'', ''3-4m'', ''minDepth'', 3, ''maxDepth'', 4, ''count'', bin_3_4),
        json_build_object(''range'', ''4-5m'', ''minDepth'', 4, ''maxDepth'', 5, ''count'', bin_4_5),
        json_build_object(''range'', ''5m+'', ''minDepth'', 5, ''maxDepth'', null, ''count'', bin_5_plus)
      )
    ) FROM stats',
    p_depth_threshold,
    p_exposure_type,
    v_layer_name,
    p_exposure_type
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- If table doesn't exist, return null impact
    RETURN json_build_object(
      'layerType', p_exposure_type,
      'totalFeatures', 0,
      'affectedFeatures', 0,
      'maxDepth', 0,
      'depthBins', '[]'::json
    );
END;
$$;

-- ============================================================================
-- VIEW: impact_summary_vw
-- ============================================================================
-- Provides a comprehensive summary of impacts across all scenarios
-- Query this view to get impact data for the API endpoint
--
-- Usage:
--   SELECT * FROM impact_summary_vw
--   WHERE climate = 'present'
--   ORDER BY return_period, maintenance, exposure_type;
-- ============================================================================

CREATE OR REPLACE VIEW impact_summary_vw AS
WITH all_combinations AS (
  -- Generate all scenario combinations (2 climates × 3 maintenances × 7 return periods × 9 exposure types = 378 combinations)
  SELECT
    climate.climate,
    maintenance.maintenance,
    rp.return_period,
    exposure.exposure_type
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
    get_impact_summary(ac.return_period::text, ac.climate, ac.maintenance, ac.exposure_type, 0) AS impact_data
  FROM all_combinations ac
)
-- Parse the JSON and return as structured rows
SELECT
  ss.climate,
  ss.maintenance,
  ss.return_period,
  ss.exposure_type,
  (ss.impact_data->>'totalFeatures')::integer AS total_features,
  (ss.impact_data->>'affectedFeatures')::integer AS affected_features,
  (ss.impact_data->>'maxDepth')::numeric AS max_depth,
  -- Depth bin counts
  (ss.impact_data->'depthBins'->0->>'count')::integer AS bin_0_1_count,
  (ss.impact_data->'depthBins'->1->>'count')::integer AS bin_1_2_count,
  (ss.impact_data->'depthBins'->2->>'count')::integer AS bin_2_3_count,
  (ss.impact_data->'depthBins'->3->>'count')::integer AS bin_3_4_count,
  (ss.impact_data->'depthBins'->4->>'count')::integer AS bin_4_5_count,
  (ss.impact_data->'depthBins'->5->>'count')::integer AS bin_5_plus_count,
  -- Calculate severity
  CASE
    WHEN (ss.impact_data->>'affectedFeatures')::integer = 0 THEN 'none'
    WHEN (ss.impact_data->>'maxDepth')::numeric < 1 THEN 'shallow'
    WHEN (ss.impact_data->>'maxDepth')::numeric < 2 THEN 'moderate'
    WHEN (ss.impact_data->>'maxDepth')::numeric < 3 THEN 'deep'
    WHEN (ss.impact_data->>'maxDepth')::numeric < 4 THEN 'very_deep'
    ELSE 'extreme'
  END AS severity_level
FROM scenario_stats ss;

-- ============================================================================
-- QUERY: Get scenario summary for API
-- ============================================================================
-- This query returns data formatted for the Impact Matrix frontend
-- Use this in your API endpoint: /api/impact/summary
--
-- Parameters:
--   $1 = climate ('present' or 'future')
--   $2 = depth_threshold (default: 0)
-- ============================================================================

-- Prepare a parameterized query for the API
-- Returns JSON format matching ImpactMatrixData interface

COMMENT ON FUNCTION get_impact_summary IS 'Returns impact statistics for a single scenario/exposure combination';
COMMENT ON VIEW impact_summary_vw IS 'Comprehensive impact summary across all scenarios and exposure types';

-- ============================================================================
-- INDEXES (Optional but recommended for performance)
-- ============================================================================
-- Create indexes on depth_bin for faster queries
-- Uncomment and adjust for your actual table names

-- CREATE INDEX IF NOT EXISTS idx_buildings_depth_bin ON "Buildings_present_breaches_25yrs"(depth_bin);
-- CREATE INDEX IF NOT EXISTS idx_roads_depth_bin ON "Roads_present_breaches_25yrs"(depth_bin);
-- ... etc for all impact layers

-- ============================================================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================================================

-- Test single scenario/exposure
-- SELECT get_impact_summary('25', 'present', 'breaches', 'Buildings', 0);

-- Get all impacts for present climate
-- SELECT * FROM impact_summary_vw WHERE climate = 'present' ORDER BY return_period, maintenance;

-- Get scenario summary (count affected exposure types per scenario)
-- SELECT
--   climate,
--   maintenance,
--   return_period,
--   COUNT(*) FILTER (WHERE affected_features > 0) as affected_exposure_types,
--   SUM(affected_features) as total_affected_features,
--   MAX(max_depth) as max_depth_in_scenario
-- FROM impact_summary_vw
-- WHERE climate = 'present'
-- GROUP BY climate, maintenance, return_period
-- ORDER BY return_period, maintenance;

-- Get impact summary for a specific return period across all maintenances
-- SELECT * FROM impact_summary_vw
-- WHERE climate = 'present' AND return_period = '25'
-- ORDER BY maintenance, exposure_type;
