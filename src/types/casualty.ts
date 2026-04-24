// Population Risk and Casualty Estimation Types
// For the Population Risk (Casualty Estimation) module

/**
 * Casualty estimation range with low, moderate, and high values
 * to transparently communicate uncertainty
 */
export interface CasualtyRange {
  low: number;
  moderate: number;
  high: number;
}

/**
 * Risk level for casualty estimation
 */
export type RiskLevel = 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';

/**
 * Velocity class for depth × velocity cross-tabulation
 */
export type VelocityClass = 'v_low' | 'v_moderate' | 'v_high';

/**
 * Duration class for depth × duration cross-tabulation
 */
export type DurationClass = 'd_short' | 'd_medium' | 'd_long';

/**
 * Depth bin ranges (matching existing impact depth bins)
 */
export type DepthBinRange = '15-100cm' | '1-2m' | '2-3m' | '3-4m' | '4-5m' | 'above5m';

/**
 * Depth × velocity cross-tabulation data
 */
export interface DepthVelocityCross {
  [depthBin: string]: {
    v_low: number;
    v_moderate: number;
    v_high: number;
  };
}

/**
 * Depth × duration cross-tabulation data
 */
export interface DepthDurationCross {
  [depthBin: string]: {
    d_short: number;
    d_medium: number;
    d_long: number;
  };
}

/**
 * District-level population risk data
 */
export interface PopulationRiskDistrict {
  district: string;
  affectedPopulation: number;
  depthBins?: Record<DepthBinRange, number>;
  depthVelocityCross?: DepthVelocityCross;
  depthDurationCross?: DepthDurationCross;
  vhExceedPopulation?: number;
  fatalityRiskLevel: RiskLevel;
  injuryRiskLevel: RiskLevel;
  estimatedFatalities: CasualtyRange;
  estimatedInjuries: CasualtyRange;
}

/**
 * Casualty estimation for a scenario
 */
export interface CasualtyEstimate {
  fatalities: CasualtyRange;
  injuries: CasualtyRange;
  fatalityRiskLevel: RiskLevel;
  injuryRiskLevel: RiskLevel;
  keyDrivers: string[];
}

/**
 * Depth bins distribution for a scenario
 */
export interface ScenarioDepthBins {
  '15-100cm': number;
  '1-2m': number;
  '2-3m': number;
  '3-4m': number;
  '4-5m': number;
  'above5m': number;
}

/**
 * Population risk data for a single scenario
 */
export interface PopulationRiskScenario {
  scenarioName: string;
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'perfect' | 'redcapacity';
  returnPeriod: string;
  totalAffectedPopulation: number;
  depthBins: ScenarioDepthBins;
  casualtyEstimate: CasualtyEstimate;
  districtBreakdown: PopulationRiskDistrict[];
}

/**
 * Metadata for population risk response
 */
export interface PopulationRiskMetadata {
  lastUpdated: string;
  totalScenarios: number;
  methodology: {
    sources: string[];
    notes: string[];
  };
}

/**
 * Complete population risk API response
 */
export interface PopulationRiskResponse {
  success: boolean;
  data: {
    climate: string;
    scenarios: PopulationRiskScenario[];
    metadata: PopulationRiskMetadata;
  };
  error?: string;
}

/**
 * Query parameters for population risk endpoint
 */
export interface PopulationRiskQuery {
  climate: 'present' | 'future';
  maintenance?: 'breaches' | 'perfect' | 'redcapacity' | 'all';
  returnPeriod?: '2.3' | '5' | '10' | '25' | '50' | '100' | '500' | 'all';
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Risk level labels for display
 */
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  very_low: 'Very Low',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
};

/**
 * Risk level colors (matching existing severity colors)
 */
export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  very_low: '#90EE90',   // Light Green
  low: '#9ACD32',       // Yellow Green
  moderate: '#FFD700',  // Gold
  high: '#FF6347',      // Tomato Red
  very_high: '#8B0000', // Dark Red
};

/**
 * Velocity class labels
 */
export const VELOCITY_CLASS_LABELS: Record<VelocityClass, string> = {
  v_low: 'Low (<0.5 m/s)',
  v_moderate: 'Moderate (0.5-1.5 m/s)',
  v_high: 'High (>1.5 m/s)',
};

/**
 * Duration class labels
 */
export const DURATION_CLASS_LABELS: Record<DurationClass, string> = {
  d_short: 'Short (<6h)',
  d_medium: 'Medium (6-24h)',
  d_long: 'Long (>24h)',
};

/**
 * Methodology citations for casualty estimation
 */
export const CASUALTY_METHODOLOGY_SOURCES = [
  'Jonkman, S.N. et al. (2008). Loss of life estimation in flood risk assessment. Journal of Flood Risk Management.',
  'USBR (2015). RCEM – Reclamation Consequence Estimating Methodology.',
  'AIDR (2017). Managing the Floodplain: Handbook 7.',
  'Defra/Environment Agency (2006). Flood Risks to People – Phase 2. R&D Technical Report FD2321.',
];

/**
 * Format casualty range for display
 */
export function formatCasualtyRange(range: CasualtyRange): string {
  if (range.high === 0) return '0';
  if (range.low === range.high) return Math.round(range.low).toLocaleString();
  return `${Math.round(range.low).toLocaleString()} - ${Math.round(range.high).toLocaleString()}`;
}

/**
 * Format moderate estimate with fallback
 */
export function formatModerateEstimate(range: CasualtyRange): string {
  return Math.round(range.moderate).toLocaleString();
}

/**
 * Get risk level from fatality count and percentage
 */
export function getRiskLevelFromFatalities(
  fatalities: number,
  affectedPopulation: number
): RiskLevel {
  const percentage = affectedPopulation > 0 ? (fatalities / affectedPopulation) * 100 : 0;

  // Classification thresholds from spec
  if (fatalities < 10 || percentage < 0.01) return 'very_low';
  if (fatalities < 50 || percentage < 0.05) return 'low';
  if (fatalities < 200 || percentage < 0.2) return 'moderate';
  if (fatalities < 1000 || percentage < 1.0) return 'high';
  return 'very_high';
}

/**
 * Normalize depth bin key from database format to display format
 * Database uses "1-2m", "2-3m" but spec uses "15-100cm" for the first bin
 */
export function normalizeDepthBinKey(key: string): DepthBinRange {
  // Handle various formats from database
  if (key.includes('15') || key.includes('100cm')) return '15-100cm';
  if (key.includes('1-2')) return '1-2m';
  if (key.includes('2-3')) return '2-3m';
  if (key.includes('3-4')) return '3-4m';
  if (key.includes('4-5')) return '4-5m';
  if (key.includes('above') || key.includes('5m')) return 'above5m';
  return '15-100cm'; // default
}

/**
 * Get all depth bins in order
 */
export const DEPTH_BINS: DepthBinRange[] = [
  '15-100cm',
  '1-2m',
  '2-3m',
  '3-4m',
  '4-5m',
  'above5m',
];

/**
 * Get all velocity classes
 */
export const VELOCITY_CLASSES: VelocityClass[] = ['v_low', 'v_moderate', 'v_high'];

/**
 * Get all duration classes
 */
export const DURATION_CLASSES: DurationClass[] = ['d_short', 'd_medium', 'd_long'];

/**
 * Districts in the population risk analysis (7 active districts)
 */
export const POPULATION_RISK_DISTRICTS = [
  'Dadu',
  'Jacobabad',
  'Jamshoro',
  'Kashmore',
  'Larkana',
  'Qambar Shahdadkot',
  'Shikarpur',
] as const;
