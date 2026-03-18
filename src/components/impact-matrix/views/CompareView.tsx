/**
 * Compare View - Simple Chart-Focused Design
 *
 * Select a scenario (Return Period + Maintenance) and see charts
 * comparing Present vs Future climate impacts
 *
 * Follows ui-skills guidelines:
 * - h-dvh for full-height containers
 * - Simple selectors, insightful charts
 * - Minimal buttons, maximum insights
 */

import { useState, useMemo } from 'react';
import { useCompareData } from '../hooks/useCompareData';
import { ComparisonSkeleton } from './components/ComparisonSkeleton';
import { ComparisonErrorState } from './components/ComparisonErrorState';
import { ScenarioComparisonCharts } from './components/ScenarioComparisonCharts';
import { returnPeriods, maintenanceLevels } from '@/types/layers';
import { cn } from '@/lib/utils';

interface CompareViewProps {
  className?: string;
}

/**
 * Compare View Component
 */
export function CompareView({ className }: CompareViewProps) {
  // Fetch comparison data
  const { data, isLoading, error, refetch } = useCompareData('climate');

  // Simple state: selected return period and maintenance
  const [selectedReturnPeriod, setSelectedReturnPeriod] = useState<string>('25');
  const [selectedMaintenance, setSelectedMaintenance] = useState<string>('breaches');

  // Find the comparison for selected scenario
  const selectedComparison = useMemo(() => {
    if (!data) return null;

    return data.deltas.find(
      (comp) =>
        comp.baseline.returnPeriod === selectedReturnPeriod &&
        comp.baseline.maintenance === selectedMaintenance
    );
  }, [data, selectedReturnPeriod, selectedMaintenance]);

  // Handle scenario change
  const handleScenarioChange = (rp: string, maintenance: string) => {
    setSelectedReturnPeriod(rp);
    setSelectedMaintenance(maintenance);
  };

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Loading State */}
      {isLoading && <ComparisonSkeleton />}

      {/* Error State */}
      {error && !isLoading && <ComparisonErrorState error={error} onRetry={refetch} />}

      {/* Main Content */}
      {!isLoading && !error && data && (
        <div className="flex flex-col h-full">
          {/* Simple Scenario Selector */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-6">
              {/* Return Period Selector */}
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  Return Period
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {returnPeriods.map((rp) => (
                    <button
                      key={rp.value}
                      onClick={() => handleScenarioChange(rp.value, selectedMaintenance)}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-all',
                        selectedReturnPeriod === rp.value
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {rp.label.replace(' Years', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Maintenance Level Selector */}
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  Maintenance Level
                </label>
                <div className="flex gap-1.5">
                  {maintenanceLevels.map((ml) => (
                    <button
                      key={ml.value}
                      onClick={() => handleScenarioChange(selectedReturnPeriod, ml.value)}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-all flex-1',
                        selectedMaintenance === ml.value
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {ml.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Display */}
          <div className="flex-1 overflow-auto">
            {selectedComparison ? (
              <ScenarioComparisonCharts comparison={selectedComparison} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-slate-500">No comparison data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
