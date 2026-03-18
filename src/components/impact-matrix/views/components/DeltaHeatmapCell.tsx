/**
 * Delta Heatmap Cell Component
 *
 * Individual comparison cell showing Present → Future scenario values
 * with delta indicator and diverging background color
 *
 * Follows ui-skills guidelines:
 * - Accessible Button with proper aria-label
 * - Visible focus outline (outline-2 outline-offset-2)
 * - Keyboard navigation support
 * - Animate only transform/opacity
 * - Diverging color scale for delta encoding
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDeltaColor, formatMaintenanceLabel } from '@/types/impact';
import type { DeltaHeatmapCellProps } from '@/types/impact';

/**
 * Delta icon showing direction of change
 */
function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 5) {
    return (
      <TrendingUp
        className="w-3 h-3 text-red-700"
        aria-label="Increase"
      />
    );
  }
  if (delta < -5) {
    return (
      <TrendingDown
        className="w-3 h-3 text-blue-700"
        aria-label="Decrease"
      />
    );
  }
  return (
    <Minus
      className="w-3 h-3 text-gray-500"
      aria-label="No change"
    />
  );
}

/**
 * Delta Heatmap Cell Component
 */
export function DeltaHeatmapCell({
  presentValue,
  futureValue,
  delta,
  returnPeriod,
  maintenance,
  onClick,
}: DeltaHeatmapCellProps) {
  const backgroundColor = getDeltaColor(delta);
  const displayReturnPeriod = returnPeriod === '2.3' ? '2.3' : returnPeriod;
  const maintenanceLabel = formatMaintenanceLabel(maintenance);

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        'h-14 flex flex-col items-center justify-center gap-1',
        'rounded-md transition-[transform,opacity]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
        'hover:opacity-90 active:scale-95'
      )}
      style={{ backgroundColor }}
      aria-label={`
        ${displayReturnPeriod} years, ${maintenanceLabel}:
        ${presentValue} affected in present climate,
        ${futureValue} affected in future climate
        (${delta > 0 ? '+' : ''}${delta.toFixed(1)}% change)
      `}
    >
      {/* Present → Future values */}
      <span className="tabular-nums text-xs font-medium text-slate-800">
        {presentValue} → {futureValue}
      </span>

      {/* Delta percentage and icon */}
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'tabular-nums text-xs font-semibold',
            delta > 5 && 'text-red-700',
            delta < -5 && 'text-blue-700',
            delta >= -5 && delta <= 5 && 'text-gray-600'
          )}
        >
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
        </span>
        <DeltaIcon delta={delta} aria-hidden="true" />
      </div>
    </Button>
  );
}
