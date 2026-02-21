import { Menu, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
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
                This web application provides interactive visualization of flood scenario simulation results
                for the Right Bank of the Indus River. The project analyzes flood risks under various
                climate and infrastructure maintenance scenarios.
              </p>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Available Data Layers</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Survey Data:</strong> DGPS survey points collected during field campaigns</li>
                  <li><strong>Structures:</strong> Drains and canal network in the study area</li>
                  <li><strong>Supporting Layers:</strong> AOI, Sindh Province boundaries, sub-catchments</li>
                  <li><strong>Present Climate Scenarios:</strong> 3 maintenance levels × 4 parameters × 7 return periods</li>
                  <li><strong>Future Climate Scenarios:</strong> Climate change projections</li>
                  <li><strong>Flood 2022:</strong> Actual event simulation results</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Parameters</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Depth:</strong> Maximum flood depth (meters)</li>
                  <li><strong>Velocity:</strong> Maximum flow velocity (m/s)</li>
                  <li><strong>Duration:</strong> Flood duration (hours)</li>
                  <li><strong>V × h:</strong> Velocity-depth product (m²/s)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Coordinate System</h3>
                <p className="text-slate-600">
                  WGS 84 / UTM zone 42N (EPSG:32642)
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
