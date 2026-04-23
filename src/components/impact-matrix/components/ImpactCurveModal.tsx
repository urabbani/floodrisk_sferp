import { useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImpactCurveData } from '../hooks/useImpactCurveData';
import { ImpactCurveChart } from './ImpactCurveChart';
import { MAINTENANCE_LEVELS, MAINTENANCE_LABELS } from '@/types/risk';

type Climate = 'present' | 'future';
type Maintenance = 'breaches' | 'redcapacity' | 'perfect';

interface ImpactCurveModalProps {
  onClose: () => void;
  initialClimate?: Climate;
}

export function ImpactCurveModal({
  onClose,
  initialClimate = 'present',
}: ImpactCurveModalProps) {
  const [climate, setClimate] = useState<Climate>(initialClimate);
  const [maintenance, setMaintenance] = useState<Maintenance>('breaches');

  const { curveData, isLoading, error } = useImpactCurveData({
    climate,
    maintenance,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center overflow-y-auto py-8 z-[10000]">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] max-w-4xl flex flex-col max-h-[95vh] relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Impact Curves - Affected Area
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
            {/* Climate Selector */}
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

            {/* Maintenance Selector */}
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
              <div className="text-red-500">Error loading Impact data: {error}</div>
            </div>
          ) : curveData?.dataPoints ? (
            <>
              <ImpactCurveChart series={curveData} />

              {/* Stats Table */}
              <div className="mt-6 bg-slate-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Affected Area by Return Period
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-slate-600 font-medium">Return Period</th>
                        <th className="text-right py-2 px-3 text-green-700 font-medium">Cropped Area</th>
                        <th className="text-right py-2 px-3 text-blue-700 font-medium">Built-up Area</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curveData.dataPoints.map((point) => (
                        <tr key={point.returnPeriod} className="border-b border-slate-100">
                          <td className="py-2 px-3 font-medium text-slate-700">{point.returnPeriod} years</td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {point.croppedArea >= 1000000
                              ? `${(point.croppedArea / 1000000).toFixed(2)}M`
                              : point.croppedArea >= 1000
                              ? `${(point.croppedArea / 1000).toFixed(1)}K`
                              : point.croppedArea.toLocaleString()}
                            {' '}m²
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {point.builtUpArea >= 1000000
                              ? `${(point.builtUpArea / 1000000).toFixed(2)}M`
                              : point.builtUpArea >= 1000
                              ? `${(point.builtUpArea / 1000).toFixed(1)}K`
                              : point.builtUpArea.toLocaleString()}
                            {' '}m²
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
