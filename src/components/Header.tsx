import { Menu, Info, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AnnotationToolbar } from '@/components/annotations';
import type { DrawingTool } from '@/types/annotations';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  // Intervention props
  activeTool?: DrawingTool;
  onToolChange?: (tool: DrawingTool) => void;
  onExport?: () => void;
  onUpload?: () => void;
  onToggleInterventionsPanel?: () => void;
  interventionsCount?: number;
  isAuthenticated?: boolean;
}

export function Header({
  onToggleSidebar,
  sidebarOpen,
  activeTool = 'none',
  onToolChange,
  onExport,
  onUpload,
  onToggleInterventionsPanel,
  interventionsCount = 0,
  isAuthenticated = false,
}: HeaderProps) {
  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 shadow-sm z-20">
      {/* Left side */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className={`h-10 w-10 sm:h-9 sm:w-9 transition-colors ${sidebarOpen ? 'bg-slate-100' : ''}`}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </Button>

        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SID DSS Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-slate-800 leading-tight">
              Flood Risk Assessment
            </h1>
            <p className="text-[10px] text-slate-500 leading-tight">
              Right Bank of the Indus River
            </p>
          </div>
          <div className="sm:hidden">
            <h1 className="text-sm font-semibold text-slate-800 leading-tight">
              Flood Risk
            </h1>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Intervention Controls */}
        {isAuthenticated ? (
          <AnnotationToolbar
            activeTool={activeTool}
            onToolChange={onToolChange}
            onExport={onExport}
            onUpload={onUpload}
            onToggleInterventionsPanel={onToggleInterventionsPanel}
            interventionsCount={interventionsCount}
            variant="header"
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              // Trigger login dialog - we'll handle this by dispatching a custom event
              // or we can pass a login callback from App
              window.dispatchEvent(new CustomEvent('show-login-dialog'));
            }}
            title="Login to create Interventions"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Button>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-9 sm:w-9">
              <Info className="w-5 h-5 text-slate-600" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>About This Project</DialogTitle>
              <DialogDescription>
                Flood Risk Assessment and Proposal of Mitigation Measures for the Right Bank of the Indus River
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                This web-based GIS application provides interactive visualization of flood risk assessment
                for the Right Bank of the Indus River in Sindh Province, Pakistan. It combines OpenLayers mapping
                with GeoServer WMS services to display flood scenarios across different climate conditions,
                infrastructure maintenance levels, and return periods.
              </p>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Key Features</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Risk Dashboard:</strong> Summary Heatmap, District Breakdown, Spatial Choropleth, EAD, and Population Risk</li>
                  <li><strong>Impact Matrix:</strong> 42 scenarios with exposure analysis for 9 asset types</li>
                  <li><strong>Scenario Explorer:</strong> Side-by-side comparison of flood scenarios</li>
                  <li><strong>Interventions:</strong> Collaborative drawing and annotation tool (login required)</li>
                  <li><strong>Layer Control:</strong> Interactive layer tree with 100+ map layers</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Data Layers</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Hazard Layers:</strong> Depth, Velocity, Duration, V×h for 42 scenarios</li>
                  <li><strong>Exposure Layers:</strong> 9 types (buildings, agriculture, infrastructure, facilities)</li>
                  <li><strong>Structures:</strong> Canal network, drains, stream network</li>
                  <li><strong>Supporting:</strong> AOI, 7 district boundaries, sub-catchments</li>
                  <li><strong>Flood 2022:</strong> Actual event data for validation</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Scenarios</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Return Periods:</strong> 2.3, 5, 10, 25, 50, 100, 500 years</li>
                  <li><strong>Climate:</strong> Present and Future (climate change projections)</li>
                  <li><strong>Maintenance:</strong> Perfect, Breaches, Reduced Capacity</li>
                  <li><strong>Districts:</strong> 7 districts in Sindh Province (excluded: Naushahro Feroze, Shaheed Benazirabad)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Parameters</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Depth:</strong> Maximum flood depth (meters)</li>
                  <li><strong>Velocity:</strong> Maximum flow velocity (m/s)</li>
                  <li><strong>Duration:</strong> Flood duration (hours)</li>
                  <li><strong>V × h:</strong> Hazard threshold (m²/s) for stability analysis</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Coordinate System</h3>
                <p className="text-slate-600">
                  WGS 84 / UTM Zone 42N (EPSG:32642)
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
