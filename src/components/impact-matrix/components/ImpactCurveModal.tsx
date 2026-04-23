import { useState } from 'react';
import { X, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImpactCurveData } from '../hooks/useImpactCurveData';
import { ImpactCurveChart } from './ImpactCurveChart';
import { RETURN_PERIODS, MAINTENANCE_LEVELS, MAINTENANCE_LABELS } from '@/types/risk';

type Climate = 'present' | 'future';
type Maintenance = 'breaches' | 'redcapacity' | 'perfect';

interface ImpactCurveModalProps {
  onClose: () => void;
  initialClimate?: Climate;
  initialLayer?: 'Cropped_Area' | 'Built_up_Area';
}

export function ImpactCurveModal({
  onClose,
  initialClimate = 'present',
  initialLayer = 'Cropped_Area',
}: ImpactCurveModalProps) {
  const [climate, setClimate] = useState<Climate>(initialClimate);
  const [seriesBy, setSeriesBy] = useState<'climate' | 'maintenance' | 'district'>('climate');
  const [maintenance, setMaintenance] = useState<Maintenance>('breaches');
  const [layerType, setLayerType] = useState<'Cropped_Area' | 'Built_up_Area'>(initialLayer);
  const [logScale, setLogScale] = useState(false);

  const { curveData, isLoading, error } = useImpactCurveData({
    climate,
    maintenance,
    region: 'TOTAL',
    seriesBy,
    layerType,
  });

  const seriesByOptions = [
    { value: 'climate', label: 'Compare Climates' },
    { value: 'maintenance', label: 'Compare Maintenance' },
    { value: 'district', label: 'By District (N/A)' },
  ] as const;

  const layerOptions = [
    { value: 'Cropped_Area' as const, label: 'Cropped Area', color: '#22c55e' },
    { value: 'Built_up_Area' as const, label: 'Built-up Area', color: '#3b82f6' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] max-w-6xl flex flex-col max-h-[95vh] relative z-[9999]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Impact Curves - {layerType === 'Cropped_Area' ? 'Cropped Area' : 'Built-up Area'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Layer Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Layer:</span>
              <div className="flex gap-1">
                {layerOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={layerType === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLayerType(opt.value)}
                    className="text-xs h-7"
                    style={
                      layerType === opt.value
                        ? { backgroundColor: opt.color, color: 'white' }
                        : undefined
                    }
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Series By */}
            <div className="flex gap-1">
              {seriesByOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={seriesBy === opt.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSeriesBy(opt.value)}
                  className="text-xs h-7"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* Log Scale Toggle */}
            <Button
              variant={logScale ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLogScale(!logScale)}
              className="text-xs h-7 ml-auto"
            >
              {logScale ? 'Log Scale' : 'Linear Scale'}
            </Button>
          </div>

          {/* Secondary controls based on seriesBy */}
          <div className="flex flex-wrap gap-4 mt-3">
            {seriesBy === 'climate' && (
              <>
                <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                  <Info className="w-3.5 h-3.5" />
                  Shows both Present and Future climates on the graph
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Maintenance:</span>
                  <div className="flex gap-1">
                    {MAINTENANCE_LEVELS.map((m) => (
                      <Button
                        key={m}
                        variant={maintenance === m ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMaintenance(m)}
                        className="text-xs h-7"
                      >
                        {MAINTENANCE_LABELS[m]}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {seriesBy === 'maintenance' && (
              <>
                <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                  <Info className="w-3.5 h-3.5" />
                  Compares Breaches, Reduced Capacity, and Perfect Maintenance levels
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Climate:</span>
                  <div className="flex gap-1">
                    {(['present', 'future'] as Climate[]).map((c) => (
                      <Button
                        key={c}
                        variant={climate === c ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setClimate(c)}
                        className="text-xs h-7"
                      >
                        {c === 'present' ? 'Present' : 'Future'}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {seriesBy === 'district' && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <Info className="w-3.5 h-3.5" />
                District comparison not available - Impact data is aggregated at regional level only
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-slate-500">Loading Impact curve data...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-red-500">Error loading Impact data: {error.message}</div>
            </div>
          ) : curveData?.series ? (
            <>
              <ImpactCurveChart
                series={curveData.series}
                layerType={layerType}
                logScale={logScale}
              />

              {/* Stats Table */}
              <div className="mt-6 bg-slate-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Affected {layerType === 'Cropped_Area' ? 'Cropped Area' : 'Built-up Area'} by Return Period
                </h3>
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {RETURN_PERIODS.map((rp) => {
                    const dataPoint = curveData.series[0]?.data.find(
                      (d) => d.returnPeriod === rp
                    );
                    const value = dataPoint?.value || 0;
                    return (
                      <div
                        key={rp}
                        className="bg-white rounded p-2 text-center border border-slate-200"
                      >
                        <div className="font-semibold text-slate-700">{rp}y</div>
                        <div className="text-slate-600 mt-1">
                          {value >= 1000000
                            ? `${(value / 1000000).toFixed(2)}M`
                            : value >= 1000
                            ? `${(value / 1000).toFixed(1)}K`
                            : value.toLocaleString()}
                        </div>
                        <div className="text-slate-400 text-[10px]">m²</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            X-axis: Return Period (log scale) • Y-axis: Affected Area ({logScale ? 'log' : 'linear'} scale)
          </div>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
