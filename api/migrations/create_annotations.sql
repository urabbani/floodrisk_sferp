-- Annotations Schema Migration
-- Creates tables for storing user-drawn annotations with PostGIS geometry support

-- Create the annotations schema
CREATE SCHEMA IF NOT EXISTS annotations;

-- Drop table if exists (for development convenience)
-- Comment this out for production
DROP TABLE IF EXISTS annotations.features CASCADE;

-- Create the main annotations table
CREATE TABLE annotations.features (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL DEFAULT 'Untitled',
  description   TEXT,
  category      VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'observation', 'infrastructure', 'hazard', 'field_note', 'other')),
  geometry_type VARCHAR(20) NOT NULL CHECK (geometry_type IN ('point', 'line', 'polygon')),
  geometry      GEOMETRY(Geometry, 32642) NOT NULL,
  style_config  JSONB DEFAULT '{"color":"#ff0000","strokeWidth":2,"fillColor":"rgba(255,0,0,0.2)","opacity":0.7}',
  created_by    TEXT NOT NULL DEFAULT 'Anonymous',
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON SCHEMA annotations IS 'User-drawn annotations and spatial notes';
COMMENT ON TABLE annotations.features IS 'Spatial annotations drawn by users on the flood risk map';
COMMENT ON COLUMN annotations.features.id IS 'Unique identifier';
COMMENT ON COLUMN annotations.features.title IS 'Annotation title/name';
COMMENT ON COLUMN annotations.features.description IS 'Detailed description or notes';
COMMENT ON COLUMN annotations.features.category IS 'Category for grouping and filtering';
COMMENT ON COLUMN annotations.features.geometry_type IS 'Type of geometry (point, line, polygon)';
COMMENT ON COLUMN annotations.features.geometry IS 'Geometry in UTM Zone 42N (EPSG:32642)';
COMMENT ON COLUMN annotations.features.style_config IS 'Visual styling options (color, stroke, fill) as JSON';
COMMENT ON COLUMN annotations.features.created_by IS 'Username of the person who created this annotation';
COMMENT ON COLUMN annotations.features.created_at IS 'Timestamp when annotation was created';
COMMENT ON COLUMN annotations.features.updated_at IS 'Timestamp when annotation was last updated';

-- Create spatial index for fast spatial queries
CREATE INDEX idx_annotations_geom ON annotations.features USING GIST(geometry);

-- Create index by creator for filtering by user
CREATE INDEX idx_annotations_creator ON annotations.features(created_by);

-- Create index by category for filtering
CREATE INDEX idx_annotations_category ON annotations.features(category);

-- Create index by geometry type
CREATE INDEX idx_annotations_geometry_type ON annotations.features(geometry_type);

-- Create index on updated_at for sorting recent changes
CREATE INDEX idx_annotations_updated_at ON annotations.features(updated_at DESC);

-- Grant permissions (adjust as needed for your database user)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON annotations.features TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE annotations.features_id_seq TO your_app_user;

-- Sample insert for testing (optional)
-- INSERT INTO annotations.features (title, description, category, geometry_type, geometry, created_by)
-- VALUES (
--   'Test Annotation',
--   'This is a test annotation to verify the setup',
--   'general',
--   'point',
--   ST_SetSRID(ST_MakePoint(439335, 3080045), 32642),
--   'Test User'
-- );
