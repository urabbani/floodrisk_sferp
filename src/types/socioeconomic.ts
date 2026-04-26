/**
 * Types and interfaces for socioeconomic and demographic data
 */

/**
 * Census 2017 district-level data
 */
export interface CensusDistrictData {
  name: DistrictName;
  censusName: string;
  totalPopulation: number;
  male: number;
  female: number;
  sexRatio: number; // females per 1000 males
  populationDensity: number; // persons per sq km
  urbanProportion: number; // percentage (0-100)
  avgHouseholdSize: number; // average persons per household
  areaSqKm: number;
  annualGrowthRate: number; // percentage
}

/**
 * District names (7 study districts in Sindh)
 */
export type DistrictName =
  | 'Dadu'
  | 'Jacobabad'
  | 'Jamshoro'
  | 'Kashmore'
  | 'Larkana'
  | 'Qambar Shahdadkot'
  | 'Shikarpur';

/**
 * Socioeconomic vulnerability indicators
 */
export interface VulnerabilityIndicators {
  district: DistrictName;
  povertyRate?: number; // % below poverty line
  populationDensity: number; // persons per sq km
  urbanProportion: number; // % urban
  avgHouseholdSize: number; // persons per household
  dependencyRatio?: number; // dependents per working-age adult
  femaleHeadedHH?: number; // % of households
  disabilityRate?: number; // % of population
  housingQualityIndex?: number; // 0-1 composite
  serviceAccessScore?: number; // 0-1 composite
}

/**
 * Composite vulnerability index
 */
export interface VulnerabilityIndex {
  district: DistrictName;
  overallScore: number; // 0-100
  demographicVulnerability: number; // 0-100
  economicVulnerability: number; // 0-100
  housingVulnerability: number; // 0-100
  serviceAccessVulnerability: number; // 0-100
  rank: number; // 1-7 (1 = most vulnerable)
}

/**
 * Infrastructure criticality weights
 */
export interface InfrastructureCriticality {
  type: 'hospitals' | 'bhu' | 'schools' | 'roads' | 'electric' | 'railways' | 'telecom';
  economicWeight: number; // 0-1
  serviceWeight: number; // 0-1
  combinedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Priority area for intervention
 */
export interface PriorityArea {
  district: DistrictName;
  tehsil?: string;
  hotspotScore: number; // 0-100
  physicalRisk: number; // 0-100
  vulnerability: number; // 0-100
  criticality: number; // 0-100
  overallRank: number; // 1-N
  recommendedActions: string[];
}

/**
 * MCDA (Multi-Criteria Decision Analysis) weights
 */
export interface MCDAWeights {
  riskPotential: number; // 0-1
  vulnerability: number; // 0-1
  criticality: number; // 0-1
  feasibility: number; // 0-1
}

/**
 * Poverty data (PSLM 2019-20 / World Bank)
 */
export interface PovertyDistrictData {
  district: DistrictName;
  povertyRate: number; // % below poverty line
  povertyHeadcount: number; // number of people below poverty line
  meanMonthlyConsumption: number; // PKR per adult-equivalent
  poorConsumption: number; // PKR per adult-equivalent (for the poor)
  povertyGap: number; // depth of poverty measure
  populationPSLM: number; // population from PSLM survey
}

/**
 * Census data response structure
 */
export interface CensusDataResponse {
  source: string;
  sourceUrl: string;
  lastUpdated: string;
  description: string;
  data: Record<DistrictName, CensusDistrictData>;
}

/**
 * Poverty data response structure
 */
export interface PovertyDataResponse {
  source: string;
  sourceUrl: string;
  lastUpdated: string;
  description: string;
  data: Record<DistrictName, PovertyDistrictData>;
}

/**
 * Combined socioeconomic data for vulnerability analysis
 */
export interface SocioeconomicData {
  census: CensusDistrictData;
  poverty?: PovertyDistrictData;
}

/**
 * Normalized dimension scores for a single district (0-100)
 * Used for hotspot composite score calculation
 */
export interface HotspotDimensionScores {
  district: DistrictName;
  physicalRisk: number; // from EAD total, normalized
  populationRisk: number; // from fatality estimates, normalized
  socioeconomicVulnerability: number; // from VulnerabilityIndex.overallScore
}

/**
 * Computed hotspot result for a single district
 */
export interface HotspotDistrictResult {
  district: DistrictName;
  hotspotScore: number; // weighted composite 0-100
  dimensions: HotspotDimensionScores;
  overallRank: number; // 1-7 (1 = highest hotspot score)
}

/**
 * Weights for the hotspot composite score
 * Each weight is 0-1 and should sum to 1.0
 */
export interface HotspotWeights {
  physicalRisk: number;
  populationRisk: number;
  socioeconomicVulnerability: number;
}

/**
 * Default equal weights for hotspot calculation
 */
export const DEFAULT_HOTSPOT_WEIGHTS: HotspotWeights = {
  physicalRisk: 1 / 3,
  populationRisk: 1 / 3,
  socioeconomicVulnerability: 1 / 3,
};
