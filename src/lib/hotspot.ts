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
import { DISTRICTS } from '@/types/risk';
import type { EadResult } from '@/types/risk';
import type { VulnerabilityIndex } from '@/types/socioeconomic';

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
  fatalityMap: Record<DistrictName, number>;
  vulnerabilityIndices: VulnerabilityIndex[];
  climate: 'present' | 'future';
  maintenance: 'breaches' | 'redcapacity' | 'perfect';
  weights: HotspotWeights;
}): HotspotDistrictResult[] {
  const {
    eadResults,
    fatalityMap,
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

    // Population Risk: moderate fatality estimate
    rawPopulation.push(fatalityMap[district] ?? 0);

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
