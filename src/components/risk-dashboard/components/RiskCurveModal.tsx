import { useState, useMemo } from 'react';
import { X, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRiskCurveData } from '../hooks/useRiskCurveData';
import { RiskCurveChart } from './RiskCurveChart';
import {
  MAINTENANCE_LEVELS,
  MAINTENANCE_LABELS,
  DISTRICTS,
  ASSET_SUB_KEYS,
  ASSET_SUB_KEY_LABELS,
  type RiskMode,
  type AssetSubKey,
  RISK_ASSET_COLORS,
} from '@/types/risk';

interface RiskCurveModalProps {
  onClose: () => void;
  initialClimate?: 'present' | 'future';
  initialMode?: RiskMode;
}

export function RiskCurveModal({
  onClose,
  initialClimate = 'present',
  initialMode = 'Dmg',
}: RiskCurveModalProps) {
  const [climate, setClimate] = useState<'present' | 'future'>(initialClimate);
  const [seriesBy, setSeriesBy] = useState<'climate' | 'district' | 'asset'>('climate');
  const [maintenance, setMaintenance] = useState<'breaches' | 'redcapacity' | 'perfect'>('breaches');
  const [region, setRegion] = useState<'TOTAL' | typeof DISTRICTS[number]>('TOTAL');
  const [logScale, setLogScale] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<AssetSubKey[]>(ASSET_SUB_KEYS);

  // Fixed to Economic Damage mode
  const mode: RiskMode = 'Dmg';

  // Generate asset options dynamically from all 11 assets
  const assetOptions: { value: AssetSubKey; label: string; color: string }[] = ASSET_SUB_KEYS.map((asset) => ({
    value: asset,
    label: ASSET_SUB_KEY_LABELS[asset],
    color: RISK_ASSET_COLORS[asset],
  }));

  const toggleAsset = (asset: AssetSubKey) => {
    if (selectedAssets.includes(asset)) {
      if (selectedAssets.length > 1) {
        setSelectedAssets(selectedAssets.filter((a) => a !== asset));
      }
    } else {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  const { curveData, isLoading, error } = useRiskCurveData({
    climate,
    maintenance,
    region,
    mode,
    seriesBy,
    includeTotal: true,
    selectedAssets,
  });

  const seriesByOptions = [
    { value: 'climate', label: 'Compare Climates' },
    { value: 'district', label: 'Compare Districts' },
    { value: 'asset', label: 'Compare Assets' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] max-w-6xl flex flex-col max-h-[95vh] relative z-[9999]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Risk vs Return Period</h2>
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
          <div className="flex flex-wrap gap-4">
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Region:</span>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as typeof region)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TOTAL">TOTAL (All Districts)</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {seriesBy === 'district' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Climate:</span>
                  <div className="flex gap-1">
                    {(['present', 'future'] as const).map((c) => (
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

            {seriesBy === 'asset' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Climate:</span>
                  <div className="flex gap-1">
                    {(['present', 'future'] as const).map((c) => (
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Region:</span>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as typeof region)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TOTAL">TOTAL (All Districts)</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asset checkboxes */}
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs font-medium text-slate-600">Assets:</span>
                  {assetOptions.map((asset) => (
                    <button
                      key={asset.value}
                      onClick={() => toggleAsset(asset.value)}
                      className={cn(
                        "px-2 py-1 text-xs rounded-md border transition-colors flex items-center gap-1",
                        selectedAssets.includes(asset.value)
                          ? "border-current bg-slate-100"
                          : "border-slate-300 bg-white opacity-50"
                      )}
                      style={{
                        borderColor: selectedAssets.includes(asset.value) ? asset.color : undefined,
                        color: selectedAssets.includes(asset.value) ? asset.color : undefined,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: asset.color }}
                      />
                      {asset.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-500">Loading risk data...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-500">Error loading risk data: {error}</div>
            </div>
          )}

          {!isLoading && !error && curveData && (
            <div className="space-y-4">
              {/* Chart */}
              <RiskCurveChart
                series={curveData.series}
                mode={mode}
                logScale={logScale}
                height={400}
              />

              {/* Info box */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Understanding Risk Curves</p>
                    <ul className="space-y-0.5 text-blue-800 text-xs">
                      <li>• X-axis: Return period (flood rarity) from 2.3 years (frequent) to 500 years (extreme)</li>
                      <li>• Y-axis: Economic Damage (USD) - monetary value of flood damage</li>
                      <li>• Higher curves indicate greater risk; steeper curves show faster risk growth</li>
                      <li>• Use <strong>Log Scale</strong> to better visualize differences across return periods</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 text-center">
          Data from 7 return periods (2.3, 5, 10, 25, 50, 100, 500 years) × 2 climates × 3 maintenance levels × 7 districts
        </div>
      </div>
    </div>
  );
}
