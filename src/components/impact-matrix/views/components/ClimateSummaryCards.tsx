/**
 * Climate Summary Cards Component
 *
 * Displays 4 key metrics showing deltas between Present and Future climate:
 * - Population Affected
 * - Infrastructure Impact
 * - Agriculture
 * - Overall Risk Severity
 *
 * Follows ui-skills guidelines:
 * - Uses tabular-nums for data
 * - Animate only transform/opacity (compositor props)
 * - Max 200ms duration with ease-out
 * - Accessible with aria-label on icon-only buttons
 */

import { Users, Building2, Wrench, AlertTriangle } from 'lucide-react';
import type { ClimateSummaryCardsProps } from '@/types/impact';
import { cn, formatCount, formatDelta } from '@/lib/utils';

/**
 * Direction icon component showing increase, decrease, or neutral
 */
function DeltaIcon({ direction }: { direction: 'increase' | 'decrease' | 'neutral' }) {
  const Icon = direction === 'increase' ? AlertTriangle : direction === 'decrease' ? Wrench : Users;
  const colorClass =
    direction === 'increase'
      ? 'text-red-600'
      : direction === 'decrease'
        ? 'text-blue-600'
        : 'text-gray-400';

  return (
    <Icon
      className={cn('w-4 h-4', colorClass)}
      aria-label={
        direction === 'increase'
          ? 'Increase'
          : direction === 'decrease'
            ? 'Decrease'
            : 'No change'
      }
    />
  );
}

/**
 * Summary card displaying a metric with delta
 */
function SummaryCard({
  title,
  value,
  delta,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  delta: { absolute: number; relative: number; direction: string };
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  description?: string;
}) {
  const deltaText = formatDelta(delta.relative);
  const direction = delta.direction as 'increase' | 'decrease' | 'neutral';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 flex flex-col gap-2">
      {/* Header with title and icon */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-600" aria-hidden={true} />
          <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        </div>
        <DeltaIcon direction={direction} />
      </div>

      {/* Value display */}
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-semibold tabular-nums text-slate-900">{value}</span>
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            direction === 'increase' && 'text-red-600',
            direction === 'decrease' && 'text-blue-600',
            direction === 'neutral' && 'text-gray-400'
          )}
        >
          {deltaText}
        </span>
      </div>

      {/* Optional description */}
      {description && <p className="text-sm text-slate-500 line-clamp-2">{description}</p>}
    </div>
  );
}

/**
 * Climate Summary Cards Component
 */
export function ClimateSummaryCards({ deltas }: ClimateSummaryCardsProps) {
  // Format population delta
  const populationValue = formatCount(Math.abs(deltas.population.absolute));
  const populationDescription =
    deltas.population.direction === 'increase'
      ? 'More people affected in future climate'
      : deltas.population.direction === 'decrease'
        ? 'Fewer people affected in future climate'
        : 'No significant change in population affected';

  // Format infrastructure delta
  const infrastructureValue = `${Math.abs(deltas.infrastructure.relative).toFixed(1)}%`;
  const infrastructureDescription =
    deltas.infrastructure.direction === 'increase'
      ? 'Higher infrastructure impact in future climate'
      : deltas.infrastructure.direction === 'decrease'
        ? 'Lower infrastructure impact in future climate'
        : 'No significant change in infrastructure impact';

  // Format agriculture delta
  const agBuildingValue = `${Math.abs(deltas.agBuilding.relative).toFixed(1)}%`;
  const agBuildingDescription =
    deltas.agBuilding.direction === 'increase'
      ? 'More agriculture area affected'
      : deltas.agBuilding.direction === 'decrease'
        ? 'Less agriculture area affected'
        : 'No significant change in agriculture area';

  // Format severity change
  const severityLabel =
    deltas.severityChange === 'increased'
      ? 'Worsening'
      : deltas.severityChange === 'decreased'
        ? 'Improving'
        : 'Stable';
  const severityDescription =
    deltas.severityChange === 'increased'
      ? 'Overall risk severity increasing'
      : deltas.severityChange === 'decreased'
        ? 'Overall risk severity decreasing'
        : 'Overall risk severity remains stable';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3">
      <SummaryCard
        title="Population"
        value={populationValue}
        delta={deltas.population}
        icon={Users}
        description={populationDescription}
      />
      <SummaryCard
        title="Infrastructure"
        value={infrastructureValue}
        delta={deltas.infrastructure}
        icon={Wrench}
        description={infrastructureDescription}
      />
      <SummaryCard
        title="Agriculture"
        value={agBuildingValue}
        delta={deltas.agBuilding}
        icon={Building2}
        description={agBuildingDescription}
      />
      <SummaryCard
        title="Overall Risk"
        value={severityLabel}
        delta={{
          absolute: 0,
          relative:
            deltas.severityChange === 'increased' ? 10 : deltas.severityChange === 'decreased' ? -10 : 0,
          direction: deltas.severityChange === 'increased' ? 'increase' : deltas.severityChange === 'decreased' ? 'decrease' : 'neutral',
        }}
        icon={AlertTriangle}
        description={severityDescription}
      />
    </div>
  );
}
