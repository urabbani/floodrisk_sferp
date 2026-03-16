// Impact and Exposure Types for Flood Impact Matrix
// These types define the structure for displaying flood impact and exposure data

/**
 * The 9 exposure layer types that can be impacted by flooding
 */
export type ExposureLayerType =
  | 'BHU'
  | 'Buildings'
  | 'Built_up_Area'
  | 'Cropped_Area'
  | 'Electric_Grid'
  | 'Railways'
  | 'Roads'
  | 'Settlements'
  | 'Telecom_Towers';

/**
 * Depth bin ranges for flood depth classification
 * (matches database text values)
 */
export type DepthBinRange = '15-100cm' | '1-2m' | '2-3m' | '3-4m' | '4-5m' | 'above5m';

/**
 * Depth bin statistics for a single depth range
 */
export type DepthBin = {
  range: DepthBinRange;
  minDepth: number;
  maxDepth: number;
  count: number;  // Number of features in this depth range
  percentage: number;  // Percentage of total affected features
};

/**
 * Impact statistics for a single exposure layer
 */
export type ExposureImpact = {
  layerType: ExposureLayerType;
  totalFeatures: number;  // Total number of features in the layer
  affectedFeatures: number;  // Features with depth > threshold
  maxDepthBin: string;  // Maximum flood depth bin (e.g., "above5m", "1-2m")
  depthBins: DepthBin[];  // Distribution across depth bins
  geoserverLayer: string;  // GeoServer layer name for WMS
  workspace: string;  // GeoServer workspace
  geometryType: 'point' | 'line' | 'polygon';  // Geometry type
};

/**
 * Severity level based on number of affected exposure types
 */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'extreme';

/**
 * Summary of impacts for a single scenario
 */
export type ScenarioImpactSummary = {
  scenarioId: string;  // e.g., 't3_25yrs_present_breaches'
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'redcapacity' | 'perfect';
  returnPeriod: string;  // '2.3', '5', '10', '25', '50', '100', '500'
  totalAffectedExposures: number;  // Count of exposure types with any impact
  severity: SeverityLevel;  // Calculated severity level
  impacts: Record<ExposureLayerType, ExposureImpact | null>;  // null if no impact
};

/**
 * Complete impact matrix data for a climate scenario
 */
export type ImpactMatrixData = {
  climate: 'present' | 'future';
  summaries: ScenarioImpactSummary[];
  metadata: {
    lastUpdated: string;
    totalScenarios: number;
  };
};

/**
 * Query parameters for fetching impact summaries
 */
export type ImpactSummaryQuery = {
  climate: 'present' | 'future';
  maintenance?: 'breaches' | 'redcapacity' | 'perfect' | 'all';
  returnPeriod?: string;
};

/**
 * API response format for impact summary endpoint
 */
export type ImpactSummaryResponse = {
  success: boolean;
  data: ImpactMatrixData;
  error?: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All exposure layer types
 */
export const EXPOSURE_LAYER_TYPES: ExposureLayerType[] = [
  'BHU',
  'Buildings',
  'Built_up_Area',
  'Cropped_Area',
  'Electric_Grid',
  'Railways',
  'Roads',
  'Settlements',
  'Telecom_Towers',
];

/**
 * Display labels for exposure layer types
 */
export const EXPOSURE_LAYER_LABELS: Record<ExposureLayerType, string> = {
  'BHU': 'Basic Health Units',
  'Buildings': 'Buildings',
  'Built_up_Area': 'Built-up Area',
  'Cropped_Area': 'Cropped Area',
  'Electric_Grid': 'Electric Grid',
  'Railways': 'Railways',
  'Roads': 'Roads',
  'Settlements': 'Settlements',
  'Telecom_Towers': 'Telecom Towers',
};

/**
 * Geometry types for each exposure layer
 */
export const EXPOSURE_LAYER_GEOMETRY: Record<ExposureLayerType, 'point' | 'line' | 'polygon'> = {
  'BHU': 'point',
  'Buildings': 'polygon',
  'Built_up_Area': 'polygon',
  'Cropped_Area': 'polygon',
  'Electric_Grid': 'line',
  'Railways': 'line',
  'Roads': 'line',
  'Settlements': 'polygon',
  'Telecom_Towers': 'point',
};

/**
 * Depth bin ranges in order (matching database values)
 */
export const DEPTH_BINS: DepthBinRange[] = ['15-100cm', '1-2m', '2-3m', '3-4m', '4-5m', 'above5m'];

/**
 * Color scheme for depth bins (light to dark)
 */
export const DEPTH_BIN_COLORS: Record<DepthBinRange, string> = {
  '15-100cm': '#90EE90',   // Light Green
  '1-2m': '#FFD700',       // Gold
  '2-3m': '#FFA500',       // Orange
  '3-4m': '#FF6347',       // Tomato Red
  '4-5m': '#DC143C',       // Crimson
  'above5m': '#8B0000',    // Dark Red
};

/**
 * Depth bin ranges with min/max values (in meters)
 * Note: "15-100cm" represents 0.15-1.0m range
 */
export const DEPTH_BIN_RANGES: Record<DepthBinRange, { min: number; max: number | null }> = {
  '15-100cm': { min: 0.15, max: 1.0 },
  '1-2m': { min: 1.0, max: 2.0 },
  '2-3m': { min: 2.0, max: 3.0 },
  '3-4m': { min: 3.0, max: 4.0 },
  '4-5m': { min: 4.0, max: 5.0 },
  'above5m': { min: 5.0, max: null },
};

/**
 * Severity thresholds based on number of affected exposure types (out of 9)
 */
export const SEVERITY_THRESHOLDS = {
  low: { min: 0, max: 2 },      // 0-2 exposure types affected
  medium: { min: 3, max: 5 },   // 3-5 exposure types affected
  high: { min: 6, max: 7 },     // 6-7 exposure types affected
  extreme: { min: 8, max: 9 },  // 8-9 exposure types affected
};

/**
 * Color scheme for severity levels
 */
export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: '#90EE90',      // Light Green
  medium: '#FFD700',   // Gold
  high: '#FF6347',     // Tomato Red
  extreme: '#8B0000',  // Dark Red
};

/**
 * GeoServer workspace for impact layers
 */
export const IMPACT_LAYER_WORKSPACE = 'results';

/**
 * Build database schema name for an impact scenario
 * Pattern: T3_{returnPeriod}yrs_{Climate}_{Maintenance}_Impacted
 * Example: T3_25yrs_Present_Breaches_Impacted
 */
export function buildImpactSchemaName(
  returnPeriod: string,
  climate: 'present' | 'future',
  maintenance: 'breaches' | 'redcapacity' | 'perfect'
): string {
  // Capitalize first letter of climate
  const climateCap = climate.charAt(0).toUpperCase() + climate.slice(1);
  // Title case for maintenance
  const maintenanceTitle = maintenance.charAt(0).toUpperCase() + maintenance.slice(1);

  return `T3_${returnPeriod}yrs_${climateCap}_${maintenanceTitle}_Impacted`;
}

/**
 * Build GeoServer layer name for an impact layer
 * Pattern: {schema}.{exposureType}
 * Example: T3_25yrs_Present_Breaches_Impacted.Buildings
 */
export function buildImpactLayerName(
  returnPeriod: string,
  climate: 'present' | 'future',
  maintenance: 'breaches' | 'redcapacity' | 'perfect',
  exposureType: ExposureLayerType
): string {
  const schema = buildImpactSchemaName(returnPeriod, climate, maintenance);
  return `${schema}.${exposureType}`;
}

/**
 * Parse scenario ID into components
 * Example: 'T3_25yrs_Present_Breaches_Impacted' -> { returnPeriod: '25', climate: 'present', maintenance: 'breaches' }
 */
export function parseScenarioId(scenarioId: string): {
  returnPeriod: string;
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'redcapacity' | 'perfect';
} | null {
  // Pattern: T3_{rp}yrs_{Climate}_{Maintenance}_Impacted
  const match = scenarioId.match(/^T3_(\d+(?:\.\d+)?)yrs_(Present|Future)_(Breaches|RedCapacity|Perfect)_Impacted$/);
  if (!match) return null;

  return {
    returnPeriod: match[1],
    climate: match[2].toLowerCase() as 'present' | 'future',
    maintenance: match[3].toLowerCase().replace('redcapacity', 'redcapacity') as 'breaches' | 'redcapacity' | 'perfect',
  };
}

/**
 * Calculate severity level based on number of affected exposure types
 */
export function calculateSeverity(affectedCount: number): SeverityLevel {
  if (affectedCount <= SEVERITY_THRESHOLDS.low.max) return 'low';
  if (affectedCount <= SEVERITY_THRESHOLDS.medium.max) return 'medium';
  if (affectedCount <= SEVERITY_THRESHOLDS.high.max) return 'high';
  return 'extreme';
}

/**
 * Get depth bin range for a given depth value (in meters)
 */
export function getDepthBinRange(depth: number): DepthBinRange {
  if (depth < 1.0) return '15-100cm';
  if (depth < 2.0) return '1-2m';
  if (depth < 3.0) return '2-3m';
  if (depth < 4.0) return '3-4m';
  if (depth < 5.0) return '4-5m';
  return 'above5m';
}

/**
 * Format depth bin label for display
 * Converts internal 'above5m' to user-friendly '>5m'
 */
export function formatDepthBinLabel(range: DepthBinRange | string): string {
  if (range === 'above5m') return '>5m';
  return range;
}

/**
 * Format maintenance level label for display
 * Converts internal 'redcapacity' to user-friendly 'Reduced Capacity'
 */
export function formatMaintenanceLabel(maintenance: string): string {
  const labels: Record<string, string> = {
    'breaches': 'Flood 2022 (Breaches)',
    'redcapacity': 'Reduced Capacity',
    'perfect': 'Perfect',
  };
  return labels[maintenance] || maintenance;
}

/**
 * Format climate label for display
 * Converts internal values to user-friendly labels
 */
export function formatClimateLabel(climate: string): string {
  const labels: Record<string, string> = {
    'present': 'Present Climate',
    'future': 'Future Climate',
  };
  return labels[climate] || climate;
}

/**
 * Format depth value for display
 */
export function formatDepthValue(depth: number): string {
  if (depth >= 1000) {
    return `${(depth / 1000).toFixed(1)}km`;
  }
  return `${depth.toFixed(2)}m`;
}

/**
 * Format count with commas for thousands
 */
export function formatCount(count: number): string {
  return count.toLocaleString();
}
