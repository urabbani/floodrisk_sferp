-- Update get_impact_summary function to handle numeric depth_bin values
-- The new T3 schemas use depth_bin as bigint (centimeters) instead of text labels

CREATE OR REPLACE FUNCTION get_impact_summary(
  p_return_period text,
  p_climate text,
  p_maintenance text,
  p_exposure_type text
) RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_schema_name TEXT;
  v_result JSON;
BEGIN
  v_schema_name := 'T3_' || p_return_period || 'yrs_' ||
                   initcap(p_climate) || '_' ||
                   CASE
                     WHEN p_maintenance = 'breaches' THEN 'Breaches'
                     WHEN p_maintenance = 'redcapacity' THEN 'RedCapacity'
                     WHEN p_maintenance = 'perfect' THEN 'Perfect'
                     ELSE initcap(p_maintenance)
                   END || '_Impacted';

  BEGIN
    EXECUTE format(
      'WITH stats AS (
        SELECT
          COUNT(*) as total_features,
          COUNT(CASE WHEN depth_bin IS NOT NULL AND depth_bin > 15 THEN 1 END) as affected_features,
          CASE
            WHEN COUNT(*) FILTER (WHERE depth_bin >= 500) > 0 THEN ''above5m''
            WHEN COUNT(*) FILTER (WHERE depth_bin >= 400 AND depth_bin < 500) > 0 THEN ''4-5m''
            WHEN COUNT(*) FILTER (WHERE depth_bin >= 300 AND depth_bin < 400) > 0 THEN ''3-4m''
            WHEN COUNT(*) FILTER (WHERE depth_bin >= 200 AND depth_bin < 300) > 0 THEN ''2-3m''
            WHEN COUNT(*) FILTER (WHERE depth_bin >= 100 AND depth_bin < 200) > 0 THEN ''1-2m''
            WHEN COUNT(*) FILTER (WHERE depth_bin >= 15 AND depth_bin < 100) > 0 THEN ''15-100cm''
            ELSE NULL
          END as max_depth_bin,
          COUNT(*) FILTER (WHERE depth_bin >= 15 AND depth_bin < 100) as bin_15_100cm,
          COUNT(*) FILTER (WHERE depth_bin >= 100 AND depth_bin < 200) as bin_1_2m,
          COUNT(*) FILTER (WHERE depth_bin >= 200 AND depth_bin < 300) as bin_2_3m,
          COUNT(*) FILTER (WHERE depth_bin >= 300 AND depth_bin < 400) as bin_3_4m,
          COUNT(*) FILTER (WHERE depth_bin >= 400 AND depth_bin < 500) as bin_4_5m,
          COUNT(*) FILTER (WHERE depth_bin >= 500) as bin_above5m
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
$function$;
