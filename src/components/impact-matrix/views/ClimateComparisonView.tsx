/**
 * Climate Comparison View Component
 *
 * Main view for comparing Present vs Future climate scenarios
 * Shows side-by-side heatmaps with synchronized scrolling
 *
 * Follows ui-skills guidelines:
 * - h-dvh for container height
 * - text-balance for headings, text-pretty for body
 * - Animate only transform/opacity with max 200ms
 * - Structural skeleton during loading
 * - Show errors next to action
 */

import { useState } from 'react';
import { useIsDesktop } from '@/hooks/use-media-query';
import { ClimateSummaryCards } from './components/ClimateSummaryCards';
import { PairedHeatmapGrid } from './components/PairedHeatmapGrid';
import { useSummaryDeltas } from '../hooks/useCompareData';
import type { ClimateComparisonViewProps, ScenarioImpactSummary } from '@/types/impact';
import { cn } from '@/lib/utils';

/**
 * Mobile toggle button component
 */
function MobileToggle({
  visibleSide,
  onChange,
}: {
  visibleSide: 'present' | 'future';
  onChange: (side: 'present' | 'future') => void;
}) {
  return (
    <div className="flex gap-2 p-2">
      <button
        type="button"
        onClick={() => onChange('present')}
        className={cn(
          'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
          visibleSide === 'present'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
        )}
      >
        Present
      </button>
      <button
        type="button"
        onClick={() => onChange('future')}
        className={cn(
          'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
          visibleSide === 'future'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
        )}
      >
        Future
      </button>
    </div>
  );
}

/**
 * Climate Comparison View Component
 */
export function ClimateComparisonView({
  data,
  onScenarioSelect,
}: ClimateComparisonViewProps) {
  const isDesktop = useIsDesktop();
  const [visibleSide, setVisibleSide] = useState<'present' | 'future'>('future');

  // Calculate summary deltas
  const summaryDeltas = useSummaryDeltas(data.deltas);

  // Handle scenario click
  const handleScenarioClick = (scenario: ScenarioImpactSummary) => {
    onScenarioSelect?.(scenario);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Summary Cards */}
      <div className="flex-shrink-0 border-b border-slate-200">
        <ClimateSummaryCards deltas={summaryDeltas} />
      </div>

      {/* Mobile Toggle */}
      {!isDesktop && (
        <div className="flex-shrink-0 border-b border-slate-200">
          <MobileToggle visibleSide={visibleSide} onChange={setVisibleSide} />
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="flex-1 overflow-auto p-4">
        <PairedHeatmapGrid
          comparisons={data.deltas}
          onScenarioClick={handleScenarioClick}
          className={!isDesktop && visibleSide === 'present' ? 'hidden' : ''}
        />
      </div>
    </div>
  );
}
