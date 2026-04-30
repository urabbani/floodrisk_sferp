/**
 * React hook for computing Expected Annual Population Affected (EAPA)
 *
 * Fetches population risk data across all 7 return periods and applies
 * trapezoidal integration to compute the annualized expected value.
 */

import { useState, useEffect, useCallback } from 'react';
import { calculateExpectedAnnualPopulationAffected } from '@/lib/hotspot';
import type { DistrictName, EapaResult } from '@/types/risk';

const API_BASE = '/api/population-risk';

interface UseEapaResult {
  data: EapaResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for computing Expected Annual Population Affected
 *
 * Fetches all 7 return periods for a given climate/maintenance combo,
 * then integrates population affected across the probability spectrum.
 *
 * @param climate - 'present' or 'future'
 * @param maintenance - 'breaches', 'perfect', or 'redcapacity'
 * @returns EAPA for total region and per-district breakdown
 */
export function useEapa(
  climate: 'present' | 'future',
  maintenance: 'breaches' | 'perfect' | 'redcapacity'
): UseEapaResult {
  const [data, setData] = useState<EapaResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndCompute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all 7 return periods for this climate/maintenance
      const params = new URLSearchParams({
        climate,
        maintenance,
        returnPeriod: 'all',
      });

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch population risk data');
      }

      const scenarios = result.data.scenarios;

      if (!scenarios || scenarios.length === 0) {
        throw new Error('No scenarios returned from API');
      }

      // Sort by return period
      const sortedScenarios = scenarios.sort(
        (a: any, b: any) => parseFloat(a.returnPeriod) - parseFloat(b.returnPeriod)
      );

      // Extract total affected population by return period
      const totalPopulationByRP = sortedScenarios.map((s: any) => ({
        returnPeriod: parseFloat(s.returnPeriod),
        population: s.totalAffectedPopulation,
      }));

      // Compute EAPA for total region
      const totalEapa = calculateExpectedAnnualPopulationAffected(totalPopulationByRP);

      // Extract district-level population by return period
      const districts: DistrictName[] = [
        'Dadu', 'Jacobabad', 'Jamshoro', 'Kashmore',
        'Larkana', 'Qambar Shahdadkot', 'Shikarpur'
      ];

      const districtEapa: Record<DistrictName, number> = {} as any;

      for (const district of districts) {
        const districtPopulationByRP = sortedScenarios.map((s: any) => {
          const districtData = s.districtBreakdown?.find((d: any) => d.district === district);
          return {
            returnPeriod: parseFloat(s.returnPeriod),
            population: districtData?.affectedPopulation || 0,
          };
        });

        districtEapa[district] = calculateExpectedAnnualPopulationAffected(districtPopulationByRP);
      }

      setData({
        climate,
        maintenance,
        region: 'TOTAL',
        eapa: Math.round(totalEapa),
        byDistrict: districtEapa,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error computing EAPA:', err);
    } finally {
      setLoading(false);
    }
  }, [climate, maintenance]);

  useEffect(() => {
    fetchAndCompute();
  }, [fetchAndCompute]);

  return {
    data,
    loading,
    error,
    refetch: fetchAndCompute,
  };
}

export default useEapa;
