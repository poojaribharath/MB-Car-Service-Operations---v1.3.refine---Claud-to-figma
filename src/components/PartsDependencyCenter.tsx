import React, { useMemo } from 'react';
import { 
  ShieldAlert, 
  Package, 
  Truck, 
  AlertOctagon, 
  Clock, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Car } from '../types';

interface PartsDependencyCenterProps {
  cars: Car[];
  onReceiveParts: (carId: string) => void;
}

export const PartsDependencyCenter: React.FC<PartsDependencyCenterProps> = ({
  cars,
  onReceiveParts
}) => {
  // Categorise parts dependency statuses
  // Sections: Waiting Parts, Ordered, Arriving Today, Delayed
  const partsCategories = useMemo(() => {
    // Locate cars with parts orders
    const rawCars = cars.filter(c => c.partsOnOrder || c.partsOrderDescription);

    const waiting: Car[] = [];
    const ordered: Car[] = [];
    const arrivingToday: Car[] = [];
    const delayed: Car[] = [];

    rawCars.forEach((car, index) => {
      // Simulate categorization for test variance
      if (car.overallStatus === 'critical') {
        delayed.push(car);
      } else if (index % 3 === 0) {
        arrivingToday.push(car);
      } else if (car.partsExpectedTime?.includes('hour') || car.partsExpectedTime?.includes('day')) {
        ordered.push(car);
      } else {
        waiting.push(car);
      }
    });

    return { waiting, ordered, arrivingToday, delayed };
  }, [cars]);

  // Compute overall summary of active parts delay impact
  const impactSummary = useMemo(() => {
    const totalBlockedParts = cars.filter(c => c.partsOnOrder).length;
    let criticalRiskCount = 0;
    cars.forEach(c => {
      if (c.partsOnOrder && (c.overallStatus === 'at-risk' || c.overallStatus === 'critical')) {
        criticalRiskCount++;
      }
    });

    return {
      totalBlockedParts,
      criticalRiskCount,
      estimatedLostHours: totalBlockedParts * 2.5
    };
  }, [cars]);

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      {/* Header and statistics panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest block font-sans">Parts Logistics</span>
          <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
            Identify parts-related vehicle delays, track component transit ETAs, and evaluate dispatch delivery risks.
          </p>
        </div>

        {/* Impact summary dashboard */}
        <div className="grid grid-cols-3 gap-6 bg-neutral-100 p-3 rounded-lg border border-neutral-250 text-xs font-mono">
          <div>
            <span className="text-[9px] text-neutral-400 block font-bold uppercase">DEPENDENCY PARTS</span>
            <span className="text-lg font-extrabold text-neutral-900">{impactSummary.totalBlockedParts}</span>
          </div>
          <div>
            <span className="text-[9px] text-neutral-400 block font-bold uppercase">COMMITMENT RISK</span>
            <span className="text-lg font-extrabold text-neutral-900">{impactSummary.criticalRiskCount} CARS</span>
          </div>
          <div>
            <span className="text-[9px] text-neutral-400 block font-bold uppercase">CAPACITY LOSS</span>
            <span className="text-lg font-extrabold text-neutral-900">~{impactSummary.estimatedLostHours} HRS</span>
          </div>
        </div>
      </div>

      {/* Grid segments: Waiting Parts, Ordered, Arriving Today, Delayed */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start xl:h-[680px] h-auto xl:overflow-hidden overflow-visible pb-12 xl:pb-0">
        
        {/* Waiting Parts Column */}
        <div className="flex flex-col xl:h-full h-auto min-h-[300px] bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm">
          <div className="p-3 border-b border-neutral-200 bg-neutral-100/50 flex items-center justify-between font-sans">
            <span className="text-xs uppercase font-extrabold text-neutral-900 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Sourcing Request
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-white font-extrabold rounded text-[10px]">
              {partsCategories.waiting.length}
            </span>
          </div>

          <div className="p-3 flex-grow overflow-y-auto space-y-3.5">
            {partsCategories.waiting.map(car => (
              <div key={car.id} className="bg-white p-4 rounded-lg border-2 border-neutral-300 space-y-3 font-mono text-xs text-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-neutral-950 text-sm tracking-widest">{car.plateNumber}</span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5 capitalize">{car.make} {car.model}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded border text-[11px] space-y-1">
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase">NEEDED COMPONENT</span>
                  <span className="font-extrabold text-neutral-900 leading-tight block">{car.partsOrderDescription || 'Engine Valve Spares'}</span>
                </div>

                <div className="space-y-1 text-[11px] border-t pt-2 border-neutral-100">
                  <div className="text-neutral-500">AFFECTED JOBS: {car.jobs.map(j => j.title).join(', ')}</div>
                  <div className="text-neutral-500">RISK: <span className="text-neutral-800 font-extrabold">LOW - COMPROMISED</span></div>
                  <div className="text-neutral-500">EST TRANSIT: <span className="text-neutral-800 font-semibold">{car.partsExpectedTime || 'Pending Dispatch'}</span></div>
                </div>

                <button 
                  onClick={() => onReceiveParts(car.id)}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-mono uppercase font-bold py-1.5 rounded transition text-center"
                >
                  Confirm Arrival
                </button>
              </div>
            ))}

            {partsCategories.waiting.length === 0 && (
              <div className="text-center text-xs text-neutral-400 italic py-12">
                No active parts sourcing requested.
              </div>
            )}
          </div>
        </div>

        {/* Ordered Column */}
        <div className="flex flex-col xl:h-full h-auto min-h-[300px] bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm">
          <div className="p-3 border-b border-neutral-200 bg-neutral-100/50 flex items-center justify-between font-sans">
            <span className="text-xs uppercase font-extrabold text-neutral-900 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> Active Transit
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-white font-extrabold rounded text-[10px]">
              {partsCategories.ordered.length}
            </span>
          </div>

          <div className="p-3 flex-grow overflow-y-auto space-y-3.5">
            {partsCategories.ordered.map(car => (
              <div key={car.id} className="bg-white p-4 rounded-lg border-2 border-neutral-300 space-y-3 font-mono text-xs text-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-neutral-950 text-sm tracking-widest">{car.plateNumber}</span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5 capitalize">{car.make} {car.model}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded border text-[11px] space-y-1">
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase">NEEDED COMPONENT</span>
                  <span className="font-extrabold text-neutral-900 leading-tight block">{car.partsOrderDescription}</span>
                </div>

                <div className="space-y-1 text-[11px] border-t pt-2 border-neutral-100">
                  <div className="text-neutral-500">RISK: <span className="text-neutral-900 font-extrabold">MEDIUM SLA THREAT</span></div>
                  <div className="text-neutral-500">TRACKING ETA: <span className="text-neutral-905 font-bold font-mono">{car.partsExpectedTime || '45 mins'}</span></div>
                </div>

                <button 
                  onClick={() => onReceiveParts(car.id)}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-mono uppercase font-bold py-1.5 rounded transition text-center"
                >
                  Mark Received
                </button>
              </div>
            ))}

            {partsCategories.ordered.length === 0 && (
              <div className="text-center text-xs text-neutral-400 italic py-12">
                No orders tracking in active supplier courier fleets.
              </div>
            )}
          </div>
        </div>

        {/* Arriving Today Column */}
        <div className="flex flex-col xl:h-full h-auto min-h-[300px] bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm">
          <div className="p-3 border-b border-neutral-200 bg-neutral-100/50 flex items-center justify-between font-sans">
            <span className="text-xs uppercase font-extrabold text-neutral-900 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Arriving Today
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-white font-extrabold rounded text-[10px]">
              {partsCategories.arrivingToday.length}
            </span>
          </div>

          <div className="p-3 flex-grow overflow-y-auto space-y-3.5">
            {partsCategories.arrivingToday.map(car => (
              <div key={car.id} className="bg-white p-4 rounded-lg border-2 border-neutral-950 space-y-3 font-mono text-xs text-neutral-700">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-neutral-955 text-sm tracking-widest">{car.plateNumber}</span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5 capitalize">{car.make} {car.model}</span>
                  </div>
                  <span className="px-1 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[8px] font-bold uppercase font-mono tracking-wider rounded">ON VAN</span>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded border text-[11px] space-y-1">
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase">NEEDED COMPONENT</span>
                  <span className="font-extrabold text-neutral-900 block">{car.partsOrderDescription}</span>
                </div>

                <div className="space-y-1 text-[11px] border-t pt-2 border-neutral-100">
                  <div className="text-neutral-500">RISK LEVEL: <span className="text-emerald-700 font-extrabold">LOW</span></div>
                  <div className="text-neutral-500">INBOUND ETA: <span className="text-neutral-950 font-bold">INSIDE 20 MINS</span></div>
                </div>

                <button 
                  onClick={() => onReceiveParts(car.id)}
                  className="w-full bg-neutral-950 hover:bg-neutral-900 text-white text-[10px] font-mono uppercase font-bold py-1.5 rounded transition text-center"
                >
                  Unbox & Allocate
                </button>
              </div>
            ))}

            {partsCategories.arrivingToday.length === 0 && (
              <div className="text-center text-xs text-neutral-400 italic py-12">
                No active components logged on today's delivery runs.
              </div>
            )}
          </div>
        </div>

        {/* Delayed Column */}
        <div className="flex flex-col xl:h-full h-auto min-h-[300px] bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm">
          <div className="p-3 border-b border-neutral-200 bg-neutral-100/50 flex items-center justify-between font-sans">
            <span className="text-xs uppercase font-extrabold text-neutral-900 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-neutral-900" /> Sourcing Delayed
            </span>
            <span className="px-2 py-0.5 bg-neutral-950 text-white font-extrabold rounded text-[10px]">
              {partsCategories.delayed.length}
            </span>
          </div>

          <div className="p-3 flex-grow overflow-y-auto space-y-3.5">
            {partsCategories.delayed.map(car => (
              <div key={car.id} className="bg-neutral-150 p-4 rounded-lg border-2 border-neutral-950 space-y-3 font-mono text-xs text-neutral-800">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-neutral-950 text-sm tracking-widest">{car.plateNumber}</span>
                  </div>
                  <span className="px-1 py-0.2 bg-neutral-950 text-white text-[8px] font-bold uppercase font-mono tracking-wider rounded animate-pulse">CRITICAL DELAY</span>
                </div>

                <div className="p-2.5 bg-white rounded border-2 border-neutral-950 text-[11px] space-y-1">
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase">OUT OF SPANNER STOCK</span>
                  <span className="font-extrabold text-neutral-900 block">{car.partsOrderDescription}</span>
                </div>

                <div className="space-y-1 text-[11px] border-t pt-2 border-neutral-300">
                  <div className="text-neutral-700">PROM DISPATCH: <span className="text-neutral-950 font-bold">{car.promisedTime}</span></div>
                  <div className="text-neutral-950 font-extrabold">ACTION REQD: CALL CLIENT WORKAROUND</div>
                </div>

                <button 
                  onClick={() => onReceiveParts(car.id)}
                  className="w-full bg-white border-2 border-neutral-950 text-neutral-900 text-[10px] font-mono uppercase font-bold py-1 rounded transition text-center hover:bg-neutral-50"
                >
                  Force Complete Transit
                </button>
              </div>
            ))}

            {partsCategories.delayed.length === 0 && (
              <div className="text-center text-xs text-neutral-500 italic py-12">
                No parts orders currently flagged with delay breaches. Sourcing logistics nominal.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
