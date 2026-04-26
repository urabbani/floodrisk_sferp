/**
 * React hook for loading combined census and poverty socioeconomic data
 */

import { useState, useEffect } from 'react';
import type { CensusDataResponse, PovertyDataResponse, DistrictName, SocioeconomicData } from '@/types/socioeconomic';

interface UseSocioeconomicDataResult {
  data: Record<DistrictName, SocioeconomicData> | null;
  loading: boolean;
  error: string | null;
  getDistrictData: (district: DistrictName) => SocioeconomicData | null;
}

const CENSUS_DATA_PATH = '/data/socioeconomic/census2017.json';
const POVERTY_DATA_PATH = '/data/socioeconomic/poverty2019.json';

/**
 * Hook for loading combined census and poverty socioeconomic data
 *
 * @returns Combined socioeconomic data, loading state, error, and district lookup function
 */
export function useSocioeconomicData(): UseSocioeconomicDataResult {
  const [data, setData] = useState<Record<DistrictName, SocioeconomicData> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load both datasets in parallel
        const [censusResponse, povertyResponse] = await Promise.all([
          fetch(CENSUS_DATA_PATH),
          fetch(POVERTY_DATA_PATH).catch(() => null), // Poverty data is optional
        ]);

        if (!censusResponse.ok) {
          throw new Error(`HTTP ${censusResponse.status}: Failed to load census data`);
        }

        const censusResult: CensusDataResponse = await censusResponse.json();
        let povertyResult: PovertyDataResponse | null = null;

        if (povertyResponse && povertyResponse.ok) {
          povertyResult = await povertyResponse.json();
        }

        // Combine census and poverty data
        const combined: Record<DistrictName, SocioeconomicData> = {};

        for (const [district, censusData] of Object.entries(censusResult.data)) {
          combined[district as DistrictName] = {
            census: censusData,
            poverty: povertyResult?.data[district as DistrictName],
          };
        }

        setData(combined);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error loading socioeconomic data';
        setError(message);
        console.error('Error loading socioeconomic data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDistrictData = (district: DistrictName): SocioeconomicData | null => {
    if (!data) return null;
    return data[district] || null;
  };

  return {
    data,
    loading,
    error,
    getDistrictData,
  };
}

export default useSocioeconomicData;
