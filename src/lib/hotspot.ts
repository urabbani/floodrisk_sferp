/**
 * Hotspot Score Calculation
 *
 * Combines physical risk, population risk, and socioeconomic vulnerability
 * into a composite hotspot score for flood risk prioritization.
 */

import type {
  DistrictName,
  HotspotWeights,
  HotspotDimensionScores,
  HotspotDistrictResult,
} from '@/types/socioeconomic';
import { DISTRICTS, RETURN_PERIODS } from '@/types/risk';
import type { EadResult } from '@/types/risk';
import type { VulnerabilityIndex } from '@/types/socioeconomic';

/**
 * Calculate Expected Annual Fatalities (EAF) using trapezoidal integration
 *
 * Mirrors the EAD calculation methodology: integrates fatality estimates
 * across all 7 return periods to get an annualized expected value.
 *
 * EAF = Σ 0.5 × (Fᵢ + Fᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|
 *
 * @param fatalitiesByRP - Array of { returnPeriod, fatalities } sorted by RP ascending
 * @returns Expected annual fatalities (integrated across probability spectrum)
 */
export function calculateExpectedAnnualFatalities(
  fatalitiesByRP: { returnPeriod: number; fatalities: number }[]
): number {
  if (fatalitiesByRP.length < 2) return 0;

  let eaf = 0;
  for (let i = 0; i < fatalitiesByRP.length - 1; i++) {
    const freqLeft = 1 / fatalitiesByRP[i].returnPeriod;
    const freqRight = 1 / fatalitiesByRP[i + 1].returnPeriod;
    eaf += 0.5 * (fatalitiesByRP[i].fatalities + fatalitiesByRP[i + 1].fatalities)
          * Math.abs(freqLeft - freqRight);
  }
  return eaf;
}

/**
 * Calculate Expected Annual Population Affected (EAPA) using trapezoidal integration
 *
 * Mirrors the EAD and EAF methodology: integrates population affected across
 * all 7 return periods to get an annualized expected value.
 *
 * EAPA = Σ 0.5 × (Pᵢ + Pᵢ₊₁) × |1/RPᵢ - 1/RPᵢ₊₁|
 *
 * @param populationByRP - Array of { returnPeriod, population } sorted by RP ascending
 * @returns Expected annual population affected (integrated across probability spectrum)
 */
export function calculateExpectedAnnualPopulationAffected(
  populationByRP: { returnPeriod: number; population: number }[]
): number {
  if (populationByRP.length < 2) return 0;

  let eapa = 0;
  for (let i = 0; i < populationByRP.length - 1; i++) {
    const freqLeft = 1 / populationByRP[i].returnPeriod;
    const freqRight = 1 / populationByRP[i + 1].returnPeriod;
    eapa += 0.5 * (populationByRP[i].population + populationByRP[i + 1].population)
          * Math.abs(freqLeft - freqRight);
  }
  return eapa;
}

/**
 * Min-max normalize an array of values to 0-100 scale
 * Returns a new array with same length as input
 */
function normalizeTo100(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => 50); // all equal -> mid
  return values.map((v) => ((v - min) / range) * 100);
}

/**
 * Compute hotspot scores for all districts
 *
 * @param params - Configuration and data for hotspot calculation
 * @returns Ranked array of HotspotDistrictResult (rank 1 = highest score)
 */
export function computeHotspotScores(params: {
  eadResults: EadResult[];
  expectedAnnualFatalities: Record<DistrictName, number>; // Integrated across all RPs
  vulnerabilityIndices: VulnerabilityIndex[];
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'redcapacity' | 'perfect';
  weights: HotspotWeights;
}): HotspotDistrictResult[] {
  const {
    eadResults,
    expectedAnnualFatalities,
    vulnerabilityIndices,
    climate,
    maintenance,
    weights,
  } = params;

  // Build vulnerability lookup by district name
  const vulnMap: Record<string, VulnerabilityIndex> = {};
  for (const vi of vulnerabilityIndices) {
    vulnMap[vi.district] = vi;
  }

  // Extract raw dimension values per district (in DISTRICTS order)
  const rawPhysical: number[] = [];
  const rawPopulation: number[] = [];
  const rawSocioeconomic: number[] = [];

  for (const district of DISTRICTS) {
    // Physical Risk: EAD total (economic damage)
    const ead = eadResults.find(
      (r) => r.climate === climate && r.maintenance === maintenance && r.region === district
    );
    rawPhysical.push(ead?.eadTotal ?? 0);

    // Population Risk: Expected Annual Fatalities (integrated across all return periods)
    rawPopulation.push(expectedAnnualFatalities[district] ?? 0);

    // Socioeconomic Vulnerability: composite vulnerability index
    rawSocioeconomic.push(vulnMap[district]?.overallScore ?? 50);
  }

  // Normalize each dimension to 0-100
  const normPhysical = normalizeTo100(rawPhysical);
  const normPopulation = normalizeTo100(rawPopulation);
  const normSocioeconomic = normalizeTo100(rawSocioeconomic);

  // Compute weighted composite scores
  const results: HotspotDistrictResult[] = DISTRICTS.map((district, i) => {
    const dimensions: HotspotDimensionScores = {
      district,
      physicalRisk: Math.round(normPhysical[i] * 10) / 10,
      populationRisk: Math.round(normPopulation[i] * 10) / 10,
      socioeconomicVulnerability: Math.round(normSocioeconomic[i] * 10) / 10,
    };

    const hotspotScore = Math.round(
      dimensions.physicalRisk * weights.physicalRisk +
      dimensions.populationRisk * weights.populationRisk +
      dimensions.socioeconomicVulnerability * weights.socioeconomicVulnerability
    );

    return {
      district,
      hotspotScore,
      dimensions,
      overallRank: 0, // assigned after sorting
    };
  });

  // Sort by hotspotScore descending and assign ranks
  results.sort((a, b) => b.hotspotScore - a.hotspotScore);
  results.forEach((r, i) => {
    r.overallRank = i + 1;
  });

  return results;
}
