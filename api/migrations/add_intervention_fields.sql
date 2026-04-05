-- Add intervention_type and intervention_info columns to annotations.features
-- to persist intervention metadata that was previously lost on page reload.

ALTER TABLE annotations.features
  ADD COLUMN IF NOT EXISTS intervention_type TEXT,
  ADD COLUMN IF NOT EXISTS intervention_info JSONB;

-- Create index for filtering by intervention type
CREATE INDEX IF NOT EXISTS idx_features_intervention_type
  ON annotations.features (intervention_type);
