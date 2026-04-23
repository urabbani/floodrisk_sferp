import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImpactCurveData } from '../hooks/useImpactCurveData';
import { ImpactCurveChart } from './ImpactCurveChart';
import { MAINTENANCE_LEVELS, MAINTENANCE_LABELS, RETURN_PERIODS } from '@/types/risk';

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
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
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Climate Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Climate:</span>
              <div className="flex gap-1">
                {(['present', 'future'] as Climate[]).map((c) => (
                  <Button
                    key={c}
                    variant={climate === c ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setClimate(c)}
                    className="text-sm h-8"
                  >
                    {c === 'present' ? 'Present' : 'Future'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Maintenance Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Maintenance:</span>
              <div className="flex gap-1">
                {MAINTENANCE_LEVELS.map((m) => (
                  <Button
                    key={m}
                    variant={maintenance === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMaintenance(m)}
                    className="text-sm h-8"
                  >
                    {MAINTENANCE_LABELS[m]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading Impact curve data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-80">
              <div className="text-red-500 text-center">
                <p className="font-medium">Error loading Impact data</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : curveData?.dataPoints ? (
            <>
              <ImpactCurveChart series={curveData} height={350} />

              {/* Stats Table */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Affected Area by Return Period
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
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
                            {formatArea(point.croppedArea)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">
                            {formatArea(point.builtUpArea)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-80">
              <p className="text-slate-500">No data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0 flex justify-end">
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function formatArea(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M m²`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K m²`;
  return `${value.toLocaleString()} m²`;
}
