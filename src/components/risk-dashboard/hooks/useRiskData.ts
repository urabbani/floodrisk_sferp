import { useState, useEffect } from 'react';
import type { RiskJsonData } from '@/types/risk';

// Module-level cache: fetch once, share across hook instances
let cachedData: RiskJsonData | null = null;
let fetchPromise: Promise<RiskJsonData> | null = null;

export function useRiskData() {
  const [data, setData] = useState<RiskJsonData | null>(cachedData);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setIsLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch('/data/risk.json')
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json() as Promise<RiskJsonData>;
        })
        .then((d) => {
          cachedData = d;
          return d;
        })
        .catch((e) => {
          fetchPromise = null;
          throw e;
        });
    }

    setIsLoading(true);
    fetchPromise
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load risk data'))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}
