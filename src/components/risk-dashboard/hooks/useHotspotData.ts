/**
 * Hook for computing flood risk hotspot scores
 *
 * Combines EAD (physical risk), Expected Annual Fatalities (population risk),
 * and socioeconomic vulnerability into composite hotspot scores.
 *
 * UPDATED: Now integrates population risk across all 7 return periods using
 * trapezoidal integration (Expected Annual Fatalities), matching the EAD methodology.
 */

import { useMemo, useState, useEffect } from 'react';
import { useEadData } from './useEadData';
import { useSocioeconomicData } from '@/hooks/useSocioeconomicData';
import { calculateVulnerabilityIndicesWithPoverty } from '@/lib/vulnerability';
import { computeHotspotScores, calculateExpectedAnnualFatalities } from '@/lib/hotspot';
import type { HotspotWeights, HotspotDistrictResult } from '@/types/socioeconomic';
import { DEFAULT_HOTSPOT_WEIGHTS } from '@/types/socioeconomic';
import { RETURN_PERIODS, DISTRICTS } from '@/types/risk';
import type { DistrictName } from '@/types/risk';

interface UseHotspotDataResult {
  hotspotResults: HotspotDistrictResult[] | null;
  isLoading: boolean;
  error: string | null;
  maintenance: string;
  setMaintenance: (m: string) => void;
  weights: HotspotWeights;
  setWeights: (w: HotspotWeights) => void;
}

interface PopulationRiskScenario {
  returnPeriod: number;
  districtBreakdown: {
    district: string;
    estimatedFatalities: { moderate: number };
  }[];
}

const API_BASE = '/api/population-risk';

/**
 * Fetch population risk data for all return periods in parallel
 */
async function fetchAllPopulationRiskScenarios(
  climate: 'present' | 'future',
  maintenance: string
): Promise<PopulationRiskScenario[]> {
  const scenarios = await Promise.all(
    RETURN_PERIODS.map(async (rp) => {
      const params = new URLSearchParams({
        climate,
        maintenance,
        returnPeriod: String(rp),
      });
      const response = await fetch(`${API_BASE}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch population risk for RP=${rp}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch population risk data');
      }
      const scenario = result.data.scenarios[0];
      return {
        returnPeriod: rp,
        districtBreakdown: scenario.districtBreakdown,
      };
    })
  );
  return scenarios;
}

/**
 * Hook for computing hotspot scores
 *
 * Methodology:
 * - Physical Risk: Uses EAD (integrated across all 7 return periods)
 * - Population Risk: Uses EAF - Expected Annual Fatalities (integrated across all 7 return periods)
 * - Socioeconomic: Static vulnerability index
 *
 * This provides consistent methodology across both risk dimensions.
 */
export function useHotspotData(
  climate: 'present' | 'future'
): UseHotspotDataResult {
  const [maintenance, setMaintenance] = useState('breaches');
  const [weights, setWeights] = useState<HotspotWeights>(DEFAULT_HOTSPOT_WEIGHTS);
  const [popScenariosAll, setPopScenariosAll] = useState<PopulationRiskScenario[] | null>(null);
  const [popLoading, setPopLoading] = useState(true);
  const [popError, setPopError] = useState<string | null>(null);

  // Load EAD and socioeconomic data
  const { eadResults, isLoading: eadLoading, error: eadError } = useEadData();
  const { data: socioeconomicData, loading: socioLoading, error: socioError } = useSocioeconomicData();

  // Fetch all 7 population risk scenarios when climate or maintenance changes
  useEffect(() => {
    let aborted = false;
    setPopLoading(true);
    setPopError(null);

    fetchAllPopulationRiskScenarios(climate, maintenance)
      .then((scenarios) => {
        if (!aborted) {
          setPopScenariosAll(scenarios);
          setPopError(null);
        }
      })
      .catch((err) => {
        if (!aborted) {
          const message = err instanceof Error ? err.message : 'Unknown error loading population risk';
          setPopError(message);
          console.error('Error loading population risk:', err);
        }
      })
      .finally(() => {
        if (!aborted) setPopLoading(false);
      });

    return () => {
      aborted = true;
    };
  }, [climate, maintenance]);

  // Compute Expected Annual Fatalities for each district
  const expectedAnnualFatalities = useMemo<Record<DistrictName, number>>(() => {
    if (!popScenariosAll || popScenariosAll.length === 0) {
      return {} as Record<DistrictName, number>;
    }

    const eaf: Record<string, number> = {};

    for (const district of DISTRICTS) {
      // Build fatalities array across all return periods for this district
      const fatalitiesByRP: { returnPeriod: number; fatalities: number }[] = [];

      for (const scenario of popScenariosAll) {
        const districtData = scenario.districtBreakdown.find((d) => d.district === district);
        if (districtData) {
          fatalitiesByRP.push({
            returnPeriod: scenario.returnPeriod,
            fatalities: districtData.estimatedFatalities.moderate,
          });
        }
      }

      // Sort by return period and calculate EAF
      fatalitiesByRP.sort((a, b) => a.returnPeriod - b.returnPeriod);
      eaf[district] = calculateExpectedAnnualFatalities(fatalitiesByRP);
    }

    return eaf as Record<DistrictName, number>;
  }, [popScenariosAll]);

  // Compute hotspot scores when all data is available
  const hotspotResults = useMemo(() => {
    if (!eadResults || !socioeconomicData || !expectedAnnualFatalities) return null;

    // Calculate vulnerability indices from census + poverty data
    const vulnerabilityIndices = calculateVulnerabilityIndicesWithPoverty(socioeconomicData);

    // Compute hotspot scores using Expected Annual Fatalities
    return computeHotspotScores({
      eadResults,
      expectedAnnualFatalities,
      vulnerabilityIndices,
      climate,
      maintenance: maintenance as 'breaches' | 'redcapacity' | 'perfect',
      weights,
    });
  }, [eadResults, socioeconomicData, expectedAnnualFatalities, climate, maintenance, weights]);

  const isLoading = eadLoading || socioLoading || popLoading;
  const error = eadError || socioError || popError;

  return {
    hotspotResults,
    isLoading,
    error,
    maintenance,
    setMaintenance,
    weights,
    setWeights,
    // Keep return period for potential future use (not currently used for EAF calculation)
    returnPeriod: '25',
    setReturnPeriod: () => {},
  };
}

export default useHotspotData;
