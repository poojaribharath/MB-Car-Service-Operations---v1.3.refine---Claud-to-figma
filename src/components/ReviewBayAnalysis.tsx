import React from 'react';
import { cn } from '../lib/utils';
import { Car, ServiceBay } from '../types';

interface ReviewBayAnalysisProps {
  cars: Car[];
  bays: ServiceBay[];
}

interface BayMetric {
  id: string;
  name: string;
  typeLabel: string;
  utilization: number;
  vehiclesProcessed: number;
  blockedTime: string;
  avgDuration: string;
  status: 'optimal' | 'low' | 'blocked';
}

export const ReviewBayAnalysis: React.FC<ReviewBayAnalysisProps> = ({
  cars,
  bays: liveBays
}) => {
  // Compute dynamic metrics for standard bays and shared resources
  const computedBays: BayMetric[] = [
    ...liveBays.map((b, index) => {
      const currentCar = cars.find(c => c.currentBayId === b.id);
      const isOccupied = b.currentCarId !== null || !!currentCar;
      const isBlocked = currentCar?.overallStatus === 'blocked';
      
      // Calculate vehicles processed: stable baseline + actual completed cars
      const baseProcessed = ((index * 3 + 4) % 5) + 3; // 3 to 7
      const completedSystemCars = cars.filter(c => c.overallStatus === 'completed').length;
      const vehiclesProcessed = baseProcessed + Math.floor(completedSystemCars / 2);

      // Determine utilization percentage
      let utilization = isOccupied ? 85 : 40;
      utilization += (vehiclesProcessed * 2) % 15; // some variance
      if (isBlocked) {
        utilization = 55; // Lower active utilization because of blocks
      }
      utilization = Math.min(Math.max(utilization, 30), 98);

      // Status
      const status: 'optimal' | 'low' | 'blocked' = isBlocked
        ? 'blocked'
        : utilization > 75 ? 'optimal' : 'low';

      // Blocked time
      let blockedTime = '0m';
      if (isBlocked) {
        blockedTime = '1h 15m';
      } else if (index % 3 === 0 && index > 0) {
        blockedTime = '15m';
      } else if (index % 4 === 0) {
        blockedTime = '35m';
      }

      // Average job duration
      let avgDuration = '1h 10m';
      if (b.type === 'diagnostics') avgDuration = '45m';
      if (b.type === 'heavy') avgDuration = '2h 15m';
      if (b.type === 'fast-track') avgDuration = '30m';

      return {
        id: b.id,
        name: b.name,
        typeLabel: b.type.toUpperCase(),
        utilization,
        vehiclesProcessed,
        blockedTime,
        avgDuration,
        status
      };
    }),
    // Include shared resources for completeness as they operate as specialized bays
    (() => {
      const alignmentCars = cars.filter(c => c.sharedResourceRequest === 'alignment');
      const activeCar = alignmentCars.find(c => c.sharedResourceStatus === 'active');
      const isOccupied = !!activeCar;
      const isBlocked = activeCar?.overallStatus === 'blocked';
      const queuedCount = alignmentCars.filter(c => c.sharedResourceStatus === 'queued').length;
      
      const baseProcessed = 6;
      const completedAlignment = cars.filter(c => c.sharedResourceRequest === 'alignment' && c.sharedResourceStatus === 'completed').length;
      const vehiclesProcessed = baseProcessed + completedAlignment;

      let utilization = isOccupied ? 90 : (queuedCount > 0 ? 65 : 35);
      if (isBlocked) utilization = 60;

      return {
        id: 'alignment-rig',
        name: 'ALN-01',
        typeLabel: 'ALIGNMENT RIG',
        utilization,
        vehiclesProcessed,
        blockedTime: isBlocked ? '45m' : '0m',
        avgDuration: '25m',
        status: isBlocked ? 'blocked' as const : (utilization > 75 ? 'optimal' as const : 'low' as const)
      };
    })(),
    (() => {
      const washCars = cars.filter(c => c.sharedResourceRequest === 'wash');
      const activeCar = washCars.find(c => c.sharedResourceStatus === 'active');
      const isOccupied = !!activeCar;
      const isBlocked = activeCar?.overallStatus === 'blocked';
      const queuedCount = washCars.filter(c => c.sharedResourceStatus === 'queued').length;

      const baseProcessed = 8;
      const completedWash = cars.filter(c => c.sharedResourceRequest === 'wash' && c.sharedResourceStatus === 'completed').length;
      const vehiclesProcessed = baseProcessed + completedWash;

      let utilization = isOccupied ? 85 : (queuedCount > 0 ? 60 : 25);
      if (isBlocked) utilization = 50;

      return {
        id: 'wash-bay',
        name: 'WSH-01',
        typeLabel: 'WASH BAY',
        utilization,
        vehiclesProcessed,
        blockedTime: isBlocked ? '20m' : '0m',
        avgDuration: '15m',
        status: isBlocked ? 'blocked' as const : (utilization > 75 ? 'optimal' as const : 'low' as const)
      };
    })()
  ];

  return (
    <div className="bg-white p-space-6 rounded-xl border border-neutral-200 custom-shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-space-4 mb-space-5 gap-space-2">
        <div>
          <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Bay Performance Analysis</h3>
          <p className="text-body text-neutral-500 mt-1">Utilization efficiency and bay-specific throughput</p>
        </div>
        <div className="flex items-center gap-space-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success-500" />
            <span className="text-[12px] font-medium text-neutral-500">Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning-500" />
            <span className="text-[12px] font-medium text-neutral-500">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-critical-500" />
            <span className="text-[12px] font-medium text-neutral-500">Blocked</span>
          </div>
        </div>
      </div>

      <div className="space-y-space-5 max-h-[500px] overflow-y-auto pr-2">
        {computedBays.map((bay) => (
          <div key={bay.id} className="space-y-space-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-4">
                <span className="text-card-title font-bold text-neutral-950 font-mono w-space-16 text-left">{bay.name}</span>
                <span className="text-[9px] font-bold text-neutral-400 font-sans tracking-wide bg-neutral-100 px-1.5 py-0.5 rounded">{bay.typeLabel}</span>
                <span className={cn(
                  "text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border",
                  bay.status === 'optimal' ? "bg-success-50 text-success-700 border-success-200" :
                  bay.status === 'low' ? "bg-warning-50 text-warning-700 border-warning-200" :
                  "bg-critical-50 text-critical-700 border-critical-200"
                )}>
                  {bay.status === 'blocked' ? 'Blocked' : bay.status === 'optimal' ? 'Optimal' : 'Low Efficiency'}
                </span>
              </div>
              <div className="flex items-center gap-space-6 text-neutral-600">
                <div className="text-center min-w-[50px]">
                   <span className="text-[12px] font-bold text-neutral-900 block leading-none">{bay.vehiclesProcessed}</span>
                   <span className="text-[9px] font-bold uppercase text-neutral-400 font-mono">Vehicles</span>
                </div>
                <div className="text-center min-w-[50px]">
                   <span className={cn("text-[12px] font-bold block leading-none", bay.status === 'blocked' ? 'text-critical-600' : 'text-neutral-900')}>
                     {bay.blockedTime}
                   </span>
                   <span className="text-[9px] font-bold uppercase text-neutral-400 font-mono">Blocked</span>
                </div>
                <div className="text-center min-w-[50px]">
                   <span className="text-[12px] font-bold text-neutral-900 block leading-none">{bay.avgDuration}</span>
                   <span className="text-[9px] font-bold uppercase text-neutral-400 font-mono">Avg Job</span>
                </div>
              </div>
            </div>
            
            <div className="relative h-space-4 bg-neutral-100 rounded-full overflow-hidden border border-neutral-150">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  bay.utilization > 80 ? "bg-success-500" :
                  bay.utilization > 50 ? "bg-warning-500" :
                  "bg-critical-500"
                )}
                style={{ width: `${bay.utilization}%` }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-white mix-blend-difference font-mono">
                {bay.utilization}% UTILIZATION
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

