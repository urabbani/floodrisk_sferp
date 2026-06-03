-- Migration: Add depth_category text column to all impacted tables
-- Run: psql -h 10.0.0.205 -U postgres -d postgres -f api/migrations/add_depth_category.sql

SET client_min_messages TO WARNING;

DO $$
DECLARE
    schema_rec record;
    table_rec record;
    schema_count integer := 0;
    table_count integer := 0;
    table_names text[] := ARRAY[
        'BHU', 'Branch_Canals', 'Cropped_Area', 'Drains',
        'Electric_lines', 'Embankments', 'Hospitals', 'Main_Canals',
        'Railways', 'Roads', 'Schools', 'Telecom_Tower'
    ];
BEGIN
    -- Loop through all impacted schemas
    FOR schema_rec IN
        SELECT schema_name FROM information_schema.schemata
        WHERE schema_name LIKE 'T3_%_Impacted'
        ORDER BY schema_name
    LOOP
        schema_count := schema_count + 1;

        -- Loop through all exposure tables
        FOR table_rec IN
            SELECT unnest(table_names) AS table_name
        LOOP
            BEGIN
                -- Check if table exists
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables t
                    WHERE t.table_schema = schema_rec.schema_name
                    AND t.table_name = table_rec.table_name
                ) THEN
                    table_count := table_count + 1;

                    -- Check if column already exists (using alias to avoid ambiguity)
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns c
                        WHERE c.table_schema = schema_rec.schema_name
                        AND c.table_name = table_rec.table_name
                        AND c.column_name = 'depth_category'
                    ) THEN
                        -- Add the depth_category column
                        EXECUTE format('ALTER TABLE %I.%I ADD COLUMN depth_category text',
                            schema_rec.schema_name, table_rec.table_name);

                        -- Update depth_category based on depth_bin (in cm)
                        EXECUTE format('UPDATE %I.%I SET depth_category = CASE
                            WHEN depth_bin < 100 THEN %L
                            WHEN depth_bin >= 100 AND depth_bin < 200 THEN %L
                            WHEN depth_bin >= 200 AND depth_bin < 300 THEN %L
                            WHEN depth_bin >= 300 AND depth_bin < 400 THEN %L
                            WHEN depth_bin >= 400 AND depth_bin < 500 THEN %L
                            WHEN depth_bin >= 500 THEN %L
                            ELSE NULL
                        END WHERE depth_bin IS NOT NULL',
                            schema_rec.schema_name, table_rec.table_name,
                            '15-100cm', '1-2m', '2-3m', '3-4m', '4-5m', 'above5m');

                        -- Create index on depth_category
                        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_depth_category ON %I.%I(depth_category)',
                            replace(table_rec.table_name, '.', '_'), schema_rec.schema_name, table_rec.table_name);

                        RAISE NOTICE 'Added depth_category to %.% (table %)',
                            schema_rec.schema_name, table_rec.table_name, table_count;
                    ELSE
                        RAISE NOTICE 'Column depth_category already exists in %.%',
                            schema_rec.schema_name, table_rec.table_name;
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Error processing %.%: %',
                    schema_rec.schema_name, table_rec.table_name, SQLERRM;
            END;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Migration complete: processed % schemas with % tables total',
        schema_count, table_count;
END $$;

-- Verify migration
DO $$
BEGIN
    RAISE NOTICE 'Verifying migration...';
END $$;

-- Sample data check
SELECT depth_bin, depth_category, COUNT(*) as row_count
FROM "T3_2.3yrs_Present_Breaches_Impacted"."BHU"
WHERE depth_bin IS NOT NULL
GROUP BY depth_bin, depth_category
ORDER BY depth_bin
LIMIT 10;
