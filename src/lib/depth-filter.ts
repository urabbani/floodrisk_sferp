/**
 * Depth Filtering Utilities for Impact Data
 *
 * These functions filter impact data based on a depth threshold,
 * recalculating statistics to show only impacts >= threshold.
 */

import type {
  ScenarioImpactSummary,
  ExposureImpact,
  DepthBin,
  PopulationImpact,
  DepthBinRange,
} from '@/types/impact';
import { DEPTH_BIN_RANGES, DEPTH_BINS } from '@/types/impact';

/**
 * Filter depth bins to only include those >= threshold
 */
export function filterDepthBinsByThreshold(
  depthBins: DepthBin[],
  threshold: number
): DepthBin[] {
  return depthBins.filter((bin) => {
    const range = DEPTH_BIN_RANGES[bin.range as DepthBinRange];
    if (!range) return false;

    // Include this bin if its minimum depth >= threshold
    // OR if it spans across the threshold
    return range.min >= threshold || (range.max !== null && range.max >= threshold);
  });
}

/**
 * Filter population depth bins to only include those >= threshold
 */
export function filterPopulationDepthBinsByThreshold(
  depthBins: Array<{ range: DepthBinRange; population: number; percentage: number }>,
  threshold: number
): Array<{ range: DepthBinRange; population: number; percentage: number }> {
  return depthBins.filter((bin) => {
    const range = DEPTH_BIN_RANGES[bin.range];
    if (!range) return false;

    // Include this bin if its minimum depth >= threshold
    // OR if it spans across the threshold
    return range.min >= threshold || (range.max !== null && range.max >= threshold);
  });
}

/**
 * Recalculate affected features count based on depth threshold
 *
 * This estimates the affected count by summing depth bins >= threshold
 */
export function recalculateAffectedCount(
  impact: ExposureImpact | null,
  threshold: number
): number {
  if (!impact || impact.affectedFeatures === 0) return 0;

  // Filter depth bins >= threshold
  const filteredBins = filterDepthBinsByThreshold(impact.depthBins, threshold);

  // If no bins meet threshold, no features are affected
  if (filteredBins.length === 0) return 0;

  // Sum counts from filtered bins
  const affectedCount = filteredBins.reduce((sum, bin) => sum + bin.count, 0);

  return affectedCount;
}

/**
 * Recalculate population impact based on depth threshold
 */
export function recalculatePopulationImpact(
  populationImpact: PopulationImpact | null | undefined,
  threshold: number
): {
  affectedPopulation: number;
  affectedPercentage: number;
  depthBins: PopulationImpact['depthBins'];
} {
  if (!populationImpact) {
    return {
      affectedPopulation: 0,
      affectedPercentage: 0,
      depthBins: [],
    };
  }

  // Filter depth bins >= threshold
  const filteredBins = filterPopulationDepthBinsByThreshold(
    populationImpact.depthBins,
    threshold
  );

  // If no bins meet threshold, no population is affected
  if (filteredBins.length === 0) {
    return {
      affectedPopulation: 0,
      affectedPercentage: 0,
      depthBins: [],
    };
  }

  // Sum population from filtered bins
  const affectedPopulation = filteredBins.reduce(
    (sum, bin) => sum + bin.population,
    0
  );

  // Recalculate percentage
  const affectedPercentage =
    populationImpact.totalPopulation > 0
      ? (affectedPopulation / populationImpact.totalPopulation) * 100
      : 0;

  return {
    affectedPopulation,
    affectedPercentage,
    depthBins: filteredBins,
  };
}

/**
 * Create a filtered copy of a scenario summary with depth threshold applied
 */
export function filterScenarioByThreshold(
  scenario: ScenarioImpactSummary,
  threshold: number
): ScenarioImpactSummary {
  // Filter each exposure impact
  const filteredImpacts: ScenarioImpactSummary['impacts'] = {};

  Object.entries(scenario.impacts).forEach(([exposureType, impact]) => {
    if (!impact) {
      filteredImpacts[exposureType as keyof typeof filteredImpacts] = null;
      return;
    }

    // Recalculate affected count
    const affectedCount = recalculateAffectedCount(impact, threshold);

    // Filter depth bins
    const filteredDepthBins = filterDepthBinsByThreshold(impact.depthBins, threshold);

    // Create filtered impact object
    filteredImpacts[exposureType as keyof typeof filteredImpacts] = {
      ...impact,
      affectedFeatures: affectedCount,
      depthBins: filteredDepthBins,
    };
  });

  // Recalculate total affected exposures
  const affectedExposuresCount = Object.values(filteredImpacts).filter(
    (impact) => impact && impact.affectedFeatures > 0
  ).length;

  // Recalculate severity
  const severity = calculateSeverity(affectedExposuresCount);

  // Filter population impact
  const filteredPopulationImpact = scenario.populationImpact
    ? recalculatePopulationImpact(scenario.populationImpact, threshold)
    : undefined;

  return {
    ...scenario,
    impacts: filteredImpacts,
    totalAffectedExposures: affectedExposuresCount,
    severity,
    populationImpact: filteredPopulationImpact
      ? {
          ...scenario.populationImpact!,
          ...filteredPopulationImpact,
        }
      : undefined,
  };
}

/**
 * Filter multiple scenarios by depth threshold
 */
export function filterScenariosByThreshold(
  scenarios: ScenarioImpactSummary[],
  threshold: number
): ScenarioImpactSummary[] {
  return scenarios.map((scenario) =>
    filterScenarioByThreshold(scenario, threshold)
  );
}

/**
 * Calculate severity level based on number of affected exposure types
 */
function calculateSeverity(affectedCount: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (affectedCount <= 2) return 'low';
  if (affectedCount <= 5) return 'medium';
  if (affectedCount <= 7) return 'high';
  return 'extreme';
}

/**
 * Get depth bin index for a given threshold
 * Returns the first bin that has min depth >= threshold
 */
export function getDepthBinIndexForThreshold(threshold: number): number {
  return DEPTH_BINS.findIndex((bin) => {
    const range = DEPTH_BIN_RANGES[bin];
    return range && range.min >= threshold;
  });
}

/**
 * Check if a depth value meets the threshold
 */
export function depthMeetsThreshold(depth: number, threshold: number): boolean {
  return depth >= threshold;
}

/**
 * Convert depth threshold to CQL filter for GeoServer WMS
 *
 * Example:
 *   threshold: 1.5
 *   returns: "depth_bin >= 1.5"
 *
 *   For discrete depth bins, you might use:
 *   returns: "depth_bin IN ('1-2m', '2-3m', '3-4m', '4-5m', 'above5m')"
 */
export function createCQLFilterForThreshold(
  threshold: number,
  useDiscreteBins: boolean = false
): string {
  if (useDiscreteBins) {
    // Filter by discrete depth bin labels
    const binsToInclude: string[] = [];

    if (threshold <= 0.15) binsToInclude.push('15-100cm');
    if (threshold <= 1.0) binsToInclude.push('1-2m');
    if (threshold <= 2.0) binsToInclude.push('2-3m');
    if (threshold <= 3.0) binsToInclude.push('3-4m');
    if (threshold <= 4.0) binsToInclude.push('4-5m');
    if (threshold <= 5.0) binsToInclude.push('above5m');

    if (binsToInclude.length === 0) return 'depth_bin IS NULL';
    if (binsToInclude.length === DEPTH_BINS.length) return ''; // No filter needed

    return `depth_bin IN ('${binsToInclude.join("', '")}')`;
  }

  // Filter by numeric depth value
  return `depth_bin >= ${threshold}`;
}
