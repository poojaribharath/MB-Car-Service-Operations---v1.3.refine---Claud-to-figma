import React, { useMemo } from 'react';
import { 
  Compass, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle, 
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Car, SharedResource, Mechanic } from '../types';
import { STAFF_ROSTER } from '../data';

interface AlignmentQueueViewProps {
  resource: SharedResource;
  cars: Car[];
  onAdvanceQueue: (resourceId: string) => void;
  onRemoveFromQueue: (carId: string, resourceId: string) => void;
  onReorderQueue?: (resourceId: string, direction: 'up' | 'down', index: number) => void;
}


export const AlignmentQueueView: React.FC<AlignmentQueueViewProps> = ({
  resource,
  cars,
  onAdvanceQueue,
  onRemoveFromQueue,
  onReorderQueue
}) => {
  // Extract info
  const activeCar = cars.find(c => c.id === resource.currentCarId);
  
  const waitingCars = useMemo(() => {
    return (resource.queue || []).map(carId => cars.find(c => c.id === carId)).filter(Boolean) as Car[];
  }, [resource.queue, cars]);

  // Compute alignment progress dynamically
  const alignmentJob = activeCar?.jobs.find(j => j.title.toLowerCase().includes('align'));
  const activeElapsed = alignmentJob ? alignmentJob.elapsedMins : 15;
  const activeDuration = alignmentJob ? alignmentJob.durationMins : 30;
  const progressPct = Math.min(100, Math.round((activeElapsed / activeDuration) * 100));

  // Compute calculated metrics
  const avgWaitMins = 25; // standard alignment timeframe
  const totalWaitTimes = waitingCars.length * avgWaitMins;

  // Resolve assigned technician name
  const bayTechnician = STAFF_ROSTER.find(t => t.id === resource.assignedTechnicianId)?.name || 'Alignment Tech';

  return (

    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      {/* Upper stats header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded tracking-widest inline-block font-sans">Laser Alignment Queue</span>
          <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
            Coordinate laser measurement setups, sequence backlogs, and prevent flow-stagnating queues.
          </p>
        </div>

        {/* Centralised KPIs metrics bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-white border border-neutral-200 p-3 rounded-xl text-xs font-mono font-extrabold text-neutral-500 custom-shadow-sm">
          <div>
            <span>QUEUE:</span> <span className="bg-primary-100 text-primary-800 border border-primary-200 rounded-lg px-2 py-0.5 ml-1 font-mono">{waitingCars.length}</span>
          </div>
          <div>
            <span>AVG CYCLE:</span> <span className="text-neutral-900 bg-neutral-100 px-2 py-0.5 border border-neutral-200 rounded-lg ml-1 font-mono">{avgWaitMins} MINS</span>
          </div>
          <div>
            <span>BLOCKED EST:</span> <span className="text-neutral-900 bg-neutral-100 px-2 py-0.5 border border-neutral-200 rounded-lg ml-1 font-mono">{totalWaitTimes} MINS</span>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Active alignment bay occupant card */}
        <div className="lg:col-span-4 space-y-4">
          <span className="text-xs font-bold font-sans text-neutral-500 uppercase tracking-widest block">
            Alignment RIG BAY (Laser Rack)
          </span>

          {activeCar ? (
            <div className="bg-white rounded-xl p-5 border border-neutral-250 space-y-5 text-xs font-sans custom-shadow-sm">
              <div className="flex items-start justify-between border-b pb-2">
                <div>
                  <span className="font-extrabold text-neutral-900 text-sm tracking-wider font-mono bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 inline-block">{activeCar.plateNumber}</span>
                  <span className="text-[10px] text-neutral-400 capitalize block mt-1.5 font-bold">{activeCar.make} {activeCar.model}</span>
                </div>
                <span className="bg-primary-100 border border-primary-200 text-primary-800 px-2 py-1 text-[8.5px] font-extrabold uppercase rounded-lg tracking-wider animate-pulse">ALIGNING</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center bg-neutral-50 p-2 rounded-lg">
                  <span className="text-neutral-450 font-bold uppercase text-[9px] tracking-wider">Bay Technician:</span>
                  <span className="font-bold text-neutral-700 font-mono text-[11px]">{bayTechnician}</span>
                </div>
                <div className="flex justify-between items-center bg-neutral-50 p-2 rounded-lg">
                  <span className="text-neutral-450 font-bold uppercase text-[9px] tracking-wider">SLA Promised:</span>
                  <span className="font-bold text-neutral-700 font-mono text-[11px]">{activeCar.promisedTime}</span>
                </div>
                <div className="flex justify-between items-center bg-neutral-50 p-2 rounded-lg">
                  <span className="text-neutral-450 font-bold uppercase text-[9px] tracking-wider">Elapsed Interval:</span>
                  <span className="font-bold text-neutral-700 font-mono text-[11px]">{activeElapsed} / {activeDuration} Mins</span>
                </div>
              </div>

              {/* Progress visualizer */}
              <div className="space-y-1.5 pb-1">
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>Progress</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden border">
                  <div className="bg-primary-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <button
                onClick={() => onAdvanceQueue(resource.id)}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-sans uppercase font-extrabold py-2.5 rounded-lg text-center shadow transition-all active:scale-95 flex items-center justify-center gap-1.5 text-[11px]"
              >
                <CheckCircle className="w-4 h-4 text-emerald-350" /> Finalize Setup & Free Rack
              </button>
            </div>
          ) : (
            <div className="bg-neutral-100/30 rounded-xl p-10 border border-dashed border-neutral-250 text-center text-xs text-neutral-450 italic">
              Rig currently vacant. Click "Pull Next" from waiting list to load.
            </div>
          )}
        </div>

        {/* Right Side: Scrollable queue pipeline backlog */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-sans text-neutral-500 uppercase tracking-widest">
              Lined-up Waiting Queue ({waitingCars.length})
            </span>
            {waitingCars.length > 0 && activeCar === undefined && (
              <button
                onClick={() => onAdvanceQueue(resource.id)}
                className="bg-primary-700 hover:bg-primary-800 text-white text-[10px] font-sans uppercase font-extrabold px-3 py-1.5 rounded-lg transition shadow active:scale-95"
              >
                Pull Next
              </button>
            )}
          </div>

          <div className="space-y-3">
            {waitingCars.map((car, idx) => {
              const estimatedWait = (idx + 1) * avgWaitMins;
              let riskBadge = 'bg-neutral-100 text-neutral-500 border border-neutral-250';
              if (car.overallStatus === 'critical') {
                riskBadge = 'bg-critical-100 text-critical-700 border border-critical-250 uppercase font-bold animate-pulse';
              } else if (car.overallStatus === 'at-risk') {
                riskBadge = 'bg-warning-100 text-warning-800 border border-warning-250 uppercase font-bold';
              }
              return (
                <div 
                  key={car.id}
                  className="bg-white rounded-xl p-4 border border-neutral-250 flex items-center justify-between gap-4 text-xs font-sans custom-shadow-sm hover:border-primary-400 transition"
                >
                  <div className="flex items-center gap-4">
                    {/* Index block */}
                    <span className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-600 font-mono font-bold flex items-center justify-center border text-[11px] border-neutral-200">
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <div>
                      <span className="text-sm font-extrabold font-mono text-neutral-900 tracking-wider block">{car.plateNumber}</span>
                      <span className="text-[11px] text-neutral-500 capitalize font-medium">{car.make} {car.model}</span>
                    </div>
                  </div>

                  {/* Mid metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-right">
                    <div className="hidden md:block">
                      <span className="text-[9px] text-neutral-400 block font-bold uppercase tracking-wider font-mono">Estimated Wait</span>
                      <span className="font-bold text-neutral-800 font-mono">{estimatedWait} mins</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-400 block font-bold uppercase tracking-wider font-mono">Promised</span>
                      <span className="font-bold text-neutral-800 font-mono">{car.promisedTime}</span>
                    </div>
                    <div className="hidden md:block">
                      <span className="text-[9px] text-neutral-400 block font-bold uppercase tracking-wider font-mono">Risk Profile</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider ${riskBadge}`}>
                        {car.overallStatus}
                      </span>
                    </div>
                  </div>

                  {/* Queue interaction modifiers */}
                  <div className="flex items-center gap-2">
                    {/* UP/DOWN priority controllers */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onReorderQueue?.(resource.id, 'up', idx)}
                        disabled={idx === 0}
                        className={`p-1 border rounded-lg border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 transition ${idx === 0 ? 'opacity-20 cursor-not-allowed' : 'active:scale-90'}`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReorderQueue?.(resource.id, 'down', idx)}
                        disabled={idx === waitingCars.length - 1}
                        className={`p-1 border rounded-lg border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 transition ${idx === waitingCars.length - 1 ? 'opacity-20 cursor-not-allowed' : 'active:scale-90'}`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveFromQueue(car.id, resource.id)}
                      className="border border-neutral-300 text-neutral-600 hover:bg-red-50 hover:text-red-650 hover:border-red-200 text-[10px] font-extrabold uppercase py-2 px-3 rounded-lg transition font-sans whitespace-nowrap active:scale-95 shadow-sm"
                    >
                      Hold Out
                    </button>
                  </div>
                </div>
              );
            })}

            {waitingCars.length === 0 && (
              <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-100/10 border border-dashed border-neutral-250 rounded-xl italic font-sans">
                No vehicles queued in alignment waiting timelines. Alignment throughput operating nominal buffer.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
