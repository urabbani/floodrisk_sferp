/**
 * Scenario Comparison Charts Component
 *
 * Displays insightful charts comparing Present vs Future climate
 * for a selected scenario (Return Period + Maintenance Level)
 *
 * Charts included:
 * 1. Summary cards with key deltas
 * 2. Exposure impact comparison (paired bar chart)
 * 3. Population impact by depth bin
 * 4. Infrastructure impact breakdown
 *
 * Follows ui-skills guidelines:
 * - tabular-nums for all data
 * - text-balance for headings
 * - Animate only transform/opacity
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  Building2,
  Wrench,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { ScenarioComparison, ClimateDelta } from '@/types/impact';
import {
  formatCount,
  formatDelta,
  EXPOSURE_LAYER_LABELS,
  EXPOSURE_LAYER_TYPES,
  formatDepthBinLabel,
  formatMaintenanceLabel,
} from '@/types/impact';
import { cn } from '@/lib/utils';

interface ScenarioComparisonChartsProps {
  comparison: ScenarioComparison;
}

/**
 * Direction icon component
 */
function DeltaIcon({ delta }: { delta: number }) {
  if (delta > 5) {
    return <TrendingUp className="w-4 h-4 text-red-600" aria-hidden="true" />;
  }
  if (delta < -5) {
    return <TrendingDown className="w-4 h-4 text-blue-600" aria-hidden="true" />;
  }
  return <Minus className="w-4 h-4 text-gray-400" aria-hidden="true" />;
}

/**
 * Summary card showing key metric with delta
 */
function SummaryCard({
  title,
  presentValue,
  futureValue,
  delta,
  icon: Icon,
  unit = '',
}: {
  title: string;
  presentValue: number;
  futureValue: number;
  delta: ClimateDelta;
  icon: React.ComponentType<{ className?: string }>;
  unit?: string;
}) {
  const deltaText = formatDelta(delta.relative);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-600" aria-hidden="true" />
          <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        </div>
        <DeltaIcon delta={delta.relative} aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Present</span>
          <span className="text-sm font-semibold tabular-nums text-slate-800">
            {formatCount(presentValue)}
            {unit}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-slate-500">Future</span>
          <span className="text-sm font-semibold tabular-nums text-slate-800">
            {formatCount(futureValue)}
            {unit}
          </span>
        </div>
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Change</span>
            <span
              className={cn(
                'text-sm font-bold tabular-nums',
                delta.direction === 'increase' && 'text-red-600',
                delta.direction === 'decrease' && 'text-blue-600',
                delta.direction === 'neutral' && 'text-gray-400'
              )}
            >
              {deltaText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Exposure comparison chart data preparation
 * Uses percentages instead of raw counts for better visualization
 */
function prepareExposureChartData(comparison: ScenarioComparison) {
  return EXPOSURE_LAYER_TYPES.map((layerType) => {
    const presentImpact = comparison.baseline.impacts[layerType];
    const futureImpact = comparison.comparison.impacts[layerType];
    const delta = comparison.deltas[layerType];

    // Calculate percentage affected for Present and Future
    // Handle null/undefined impacts safely
    let presentPercent = 0;
    let futurePercent = 0;

    if (presentImpact && presentImpact.totalFeatures > 0) {
      presentPercent = (presentImpact.affectedFeatures / presentImpact.totalFeatures) * 100;
    }

    if (futureImpact && futureImpact.totalFeatures > 0) {
      futurePercent = (futureImpact.affectedFeatures / futureImpact.totalFeatures) * 100;
    }

    return {
      name: EXPOSURE_LAYER_LABELS[layerType],
      present: presentPercent,
      future: futurePercent,
      delta: delta?.relative || 0,
    };
  }).sort((a, b) => b.delta - a.delta); // Sort by delta magnitude
}

/**
 * Custom tooltip for exposure impact bar chart (percentages)
 */
function ExposureTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const presentBar = payload.find((p: any) => p.dataKey === 'present');
  const futureBar = payload.find((p: any) => p.dataKey === 'future');

  // Safely extract and format values, handling undefined/NaN
  const presentValue = presentBar?.value;
  const futureValue = futureBar?.value;
  const formattedPresent = (presentValue !== undefined && presentValue !== null && !isNaN(presentValue))
    ? presentValue.toFixed(1)
    : '0.0';
  const formattedFuture = (futureValue !== undefined && futureValue !== null && !isNaN(futureValue))
    ? futureValue.toFixed(1)
    : '0.0';

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-slate-800 mb-2">{data.name}</p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-slate-600">Present:</span>
          <span className="font-semibold tabular-nums">{formattedPresent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-slate-600">Future:</span>
          <span className="font-semibold tabular-nums">{formattedFuture}%</span>
        </div>
        <div className="pt-1 border-t border-slate-100">
          <span className={cn(
            'font-bold tabular-nums',
            data.delta > 5 ? 'text-red-600' : data.delta < -5 ? 'text-blue-600' : 'text-gray-400'
          )}>
            {formatDelta(data.delta || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom tooltip for population depth chart (integer counts)
 */
function PopulationTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const presentBar = payload.find((p: any) => p.dataKey === 'present');
  const futureBar = payload.find((p: any) => p.dataKey === 'future');

  // Format as integers (people count cannot be decimal)
  const presentValue = presentBar?.value ?? 0;
  const futureValue = futureBar?.value ?? 0;
  const formattedPresent = Math.round(presentValue).toLocaleString();
  const formattedFuture = Math.round(futureValue).toLocaleString();

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-slate-800 mb-2">{data.range}</p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-slate-600">Present:</span>
          <span className="font-semibold tabular-nums">{formattedPresent} people</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-slate-600">Future:</span>
          <span className="font-semibold tabular-nums">{formattedFuture} people</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Population depth distribution comparison
 */
function PopulationDepthComparison({ comparison }: { comparison: ScenarioComparison }) {
  if (!comparison.baseline.populationImpact || !comparison.comparison.populationImpact) {
    return null;
  }

  const presentBins = comparison.baseline.populationImpact.depthBins || [];
  const futureBins = comparison.comparison.populationImpact.depthBins || [];

  const chartData = presentBins.map((bin, index) => {
    const futureBin = futureBins[index];
    const presentPopulation = bin?.population ?? 0;
    const futurePopulation = futureBin?.population ?? 0;
    return {
      range: bin?.range ? formatDepthBinLabel(bin.range) : `Bin ${index + 1}`,
      present: presentPopulation,
      future: futurePopulation,
    };
  }).filter(item => item !== null);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-4 text-balance">
        Population Impact by Flood Depth
      </h3>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(value: number) => Math.round(value).toLocaleString()}
          />
          <YAxis
            dataKey="range"
            type="category"
            width={80}
            stroke="#64748b"
            tick={{ fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip content={<PopulationTooltip />} />
          <Legend />
          <Bar dataKey="present" fill="#3b82f6" name="Present" radius={[0, 4, 4, 0]} />
          <Bar dataKey="future" fill="#ef4444" name="Future" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Scenario Comparison Charts Component
 */
export function ScenarioComparisonCharts({
  comparison,
}: ScenarioComparisonChartsProps) {
  const exposureChartData = prepareExposureChartData(comparison);

  // Calculate infrastructure delta (average of roads, railways, electric, telecom)
  const infrastructureTypes = ['Roads', 'Railways', 'Electric_Grid', 'Telecom_Towers'] as const;

  let infrastructurePresentAvg = 0;
  let infrastructureFutureAvg = 0;
  let infrastructureCount = 0;

  infrastructureTypes.forEach((type) => {
    const presentImpact = comparison.baseline.impacts[type];
    const futureImpact = comparison.comparison.impacts[type];
    if (presentImpact && futureImpact && presentImpact.totalFeatures > 0 && futureImpact.totalFeatures > 0) {
      const presentPercent = (presentImpact.affectedFeatures / presentImpact.totalFeatures) * 100;
      const futurePercent = (futureImpact.affectedFeatures / futureImpact.totalFeatures) * 100;
      if (!isNaN(presentPercent) && !isNaN(futurePercent)) {
        infrastructurePresentAvg += presentPercent;
        infrastructureFutureAvg += futurePercent;
        infrastructureCount++;
      }
    }
  });

  if (infrastructureCount > 0) {
    infrastructurePresentAvg /= infrastructureCount;
    infrastructureFutureAvg /= infrastructureCount;
  } else {
    infrastructurePresentAvg = 0;
    infrastructureFutureAvg = 0;
  }

  const infrastructureDelta = {
    absolute: infrastructureFutureAvg - infrastructurePresentAvg,
    relative: infrastructurePresentAvg !== 0 && !isNaN(infrastructurePresentAvg)
      ? ((infrastructureFutureAvg - infrastructurePresentAvg) / infrastructurePresentAvg) * 100
      : 0,
    direction: infrastructureFutureAvg > infrastructurePresentAvg + 5 ? ('increase' as const)
      : infrastructureFutureAvg < infrastructurePresentAvg - 5 ? ('decrease' as const)
      : ('neutral' as const),
  };

  // Calculate ag/building delta
  const agBuildingTypes = ['Buildings', 'Built_up_Area', 'Cropped_Area'] as const;

  let agBuildingPresentAvg = 0;
  let agBuildingFutureAvg = 0;
  let agBuildingCount = 0;

  agBuildingTypes.forEach((type) => {
    const presentImpact = comparison.baseline.impacts[type];
    const futureImpact = comparison.comparison.impacts[type];
    if (presentImpact && futureImpact && presentImpact.totalFeatures > 0 && futureImpact.totalFeatures > 0) {
      const presentPercent = (presentImpact.affectedFeatures / presentImpact.totalFeatures) * 100;
      const futurePercent = (futureImpact.affectedFeatures / futureImpact.totalFeatures) * 100;
      if (!isNaN(presentPercent) && !isNaN(futurePercent)) {
        agBuildingPresentAvg += presentPercent;
        agBuildingFutureAvg += futurePercent;
        agBuildingCount++;
      }
    }
  });

  if (agBuildingCount > 0) {
    agBuildingPresentAvg /= agBuildingCount;
    agBuildingFutureAvg /= agBuildingCount;
  } else {
    agBuildingPresentAvg = 0;
    agBuildingFutureAvg = 0;
  }

  const agBuildingDelta = {
    absolute: agBuildingFutureAvg - agBuildingPresentAvg,
    relative: agBuildingPresentAvg !== 0 && !isNaN(agBuildingPresentAvg)
      ? ((agBuildingFutureAvg - agBuildingPresentAvg) / agBuildingPresentAvg) * 100
      : 0,
    direction: agBuildingFutureAvg > agBuildingPresentAvg + 5 ? ('increase' as const)
      : agBuildingFutureAvg < agBuildingPresentAvg - 5 ? ('decrease' as const)
      : ('neutral' as const),
  };

  return (
    <div className="p-4 space-y-4">
      {/* Scenario Header */}
      <div className="text-center pb-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 text-balance">
          {comparison.baseline.returnPeriod} Years • {formatMaintenanceLabel(comparison.baseline.maintenance)}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Present vs Future Climate Comparison</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          title="Population Affected"
          presentValue={comparison.baseline.populationImpact?.affectedPopulation || 0}
          futureValue={comparison.comparison.populationImpact?.affectedPopulation || 0}
          delta={comparison.populationDelta || {
            absolute: 0,
            relative: 0,
            direction: 'neutral',
          }}
          icon={Users}
        />
        <SummaryCard
          title="Infrastructure Impact"
          presentValue={infrastructurePresentAvg}
          futureValue={infrastructureFutureAvg}
          delta={infrastructureDelta}
          icon={Wrench}
          unit="%"
        />
        <SummaryCard
          title="Ag & Buildings"
          presentValue={agBuildingPresentAvg}
          futureValue={agBuildingFutureAvg}
          delta={agBuildingDelta}
          icon={Building2}
          unit="%"
        />
        <SummaryCard
          title="Severity"
          presentValue={comparison.baseline.severity === 'extreme' ? 4 : comparison.baseline.severity === 'high' ? 3 : comparison.baseline.severity === 'medium' ? 2 : 1}
          futureValue={comparison.comparison.severity === 'extreme' ? 4 : comparison.comparison.severity === 'high' ? 3 : comparison.comparison.severity === 'medium' ? 2 : 1}
          delta={{
            absolute: 0,
            relative: comparison.severityChange === 'increased' ? 50 : comparison.severityChange === 'decreased' ? -50 : 0,
            direction: comparison.severityChange === 'increased' ? 'increase' : comparison.severityChange === 'decreased' ? 'decrease' : 'neutral',
          }}
          icon={AlertTriangle}
        />
      </div>

      {/* Exposure Impact Comparison Chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 text-balance">
          Exposure Impact Comparison (Present vs Future)
        </h3>
        <p className="text-xs text-slate-500 mb-3">Percentage of features affected by flooding</p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={exposureChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(value: number) => {
                if (value === undefined || value === null || isNaN(value)) return '0%';
                return `${value.toFixed(0)}%`;
              }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip content={<ExposureTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend />
            <Bar dataKey="present" fill="#3b82f6" name="Present" radius={[0, 4, 4, 0]} />
            <Bar dataKey="future" fill="#ef4444" name="Future" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Population Depth Distribution */}
      <PopulationDepthComparison comparison={comparison} />
    </div>
  );
}
