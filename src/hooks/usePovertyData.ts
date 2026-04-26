/**
 * React hook for loading poverty data from PSLM 2019-20
 */

import { useState, useEffect } from 'react';
import type { PovertyDataResponse, DistrictName } from '@/types/socioeconomic';

interface UsePovertyDataResult {
  data: PovertyDataResponse | null;
  loading: boolean;
  error: string | null;
  getDistrictData: (district: DistrictName) => any;
}

const POVERTY_DATA_PATH = '/data/socioeconomic/poverty2019.json';

/**
 * Hook for loading poverty data
 *
 * @returns Poverty data, loading state, error, and district lookup function
 */
export function usePovertyData(): UsePovertyDataResult {
  const [data, setData] = useState<PovertyDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(POVERTY_DATA_PATH);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to load poverty data`);
        }
        const result: PovertyDataResponse = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error loading poverty data';
        setError(message);
        console.error('Error loading poverty data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDistrictData = (district: DistrictName) => {
    if (!data) return null;
    return data.data[district] || null;
  };

  return {
    data,
    loading,
    error,
    getDistrictData,
  };
}

export default usePovertyData;
