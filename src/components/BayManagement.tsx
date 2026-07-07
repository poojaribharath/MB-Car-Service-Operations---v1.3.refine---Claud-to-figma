import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Unlock, 
  User, 
  Clock, 
  MapPin, 
  RefreshCw, 
  LogOut,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { ServiceBay, Car } from '../types';

interface BayManagementProps {
  bays: ServiceBay[];
  cars: Car[];
  onReleaseBay: (bayId: string) => void;
  onAssignCarToBay: (bayId: string, carId: string) => void;
}

export const BayManagement: React.FC<BayManagementProps> = ({
  bays,
  cars,
  onReleaseBay,
  onAssignCarToBay
}) => {
  const [filter, setFilter] = useState<'all' | 'free' | 'occupied' | 'blocked'>('all');
  const [selectedBayForMove, setSelectedBayForMove] = useState<string | null>(null);

  // Staged cars that are in the waiting queue and of course can be pulled into a bay
  const waitingQueueCars = useMemo(() => {
    return cars.filter(c => c.currentBayId === null && c.overallStatus !== 'completed');
  }, [cars]);

  // Map bays to their corresponding vehicles optionally
  const bayStatusList = useMemo(() => {
    return bays.map(bay => {
      const activeCar = cars.find(c => c.currentBayId === bay.id);
      let status: 'free' | 'occupied' | 'blocked' = 'free';
      if (activeCar) {
        if (activeCar.overallStatus === 'blocked' || activeCar.approvalPending || activeCar.partsOnOrder) {
          status = 'blocked';
        } else {
          status = 'occupied';
        }
      }
      return {
        bay,
        car: activeCar,
        status
      };
    });
  }, [bays, cars]);

  const filteredBays = useMemo(() => {
    if (filter === 'all') return bayStatusList;
    return bayStatusList.filter(item => item.status === filter);
  }, [bayStatusList, filter]);

  // Statistics
  const freeCount = bayStatusList.filter(b => b.status === 'free').length;
  const occupiedCount = bayStatusList.filter(b => b.status === 'occupied').length;
  const blockedCount = bayStatusList.filter(b => b.status === 'blocked').length;

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      {/* Upper informational ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded tracking-widest inline-block">Workshop Management</span>
          <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
            Optimize mechanical slot utilization, coordinate mechanic workflows, and resolve blockages.
          </p>
        </div>

        {/* Quick totals summary */}
        <div className="flex items-center gap-4 text-xs font-mono font-bold bg-neutral-100 p-2.5 rounded-xl border border-neutral-250 custom-shadow-sm">
          <span className="text-neutral-500 uppercase tracking-wider text-[10px]">UTILIZATION RATE:</span>
          <span className="text-success-800 bg-success-100 px-2 py-0.5 rounded border border-success-200">Occupied: {occupiedCount}</span>
          <span className="text-critical-705 bg-critical-100 px-2 py-0.5 rounded border border-critical-200">Blocked: {blockedCount}</span>
          <span className="text-neutral-600 bg-white px-2 py-0.5 rounded border border-neutral-250">Free: {freeCount}</span>
        </div>
      </div>

      {/* Control ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-100/70 p-3 rounded-xl border border-neutral-200 text-xs">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Workshop Bays', count: bays.length },
            { id: 'free', label: 'Free Bays Only', count: freeCount },
            { id: 'occupied', label: 'Occupied Bays', count: occupiedCount },
            { id: 'blocked', label: 'Blocked Bays', count: blockedCount }
          ].map(tab => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 font-bold uppercase rounded-xl border transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-primary-700 text-white border-primary-700 shadow'
                    : 'bg-white text-neutral-600 border-neutral-250 hover:bg-primary-50 hover:text-primary-850 hover:border-primary-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Bays Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {filteredBays.map(({ bay, car, status }) => {
          const isBlocked = status === 'blocked';
          const isOccupied = status === 'occupied';
          const isFree = status === 'free';
          const activeJob = car ? car.jobs.find(j => j.status === 'in-progress') || car.jobs[0] : null;

          let cardStyle = 'border-neutral-200 bg-white hover:border-primary-400';
          let statusBadge = 'bg-neutral-100 text-neutral-500 border border-neutral-250';

          if (isBlocked) {
            cardStyle = 'border-l-4 border-l-critical-500 border-t border-b border-r border-critical-200 bg-critical-50/5';
            statusBadge = 'bg-critical-100 text-critical-700 border border-critical-200 font-bold uppercase animate-pulse';
          } else if (isOccupied) {
            cardStyle = 'border-l-4 border-l-primary-500 border-t border-b border-r border-primary-200 bg-white hover:border-primary-400';
            statusBadge = 'bg-primary-100 text-primary-800 border border-primary-200 font-bold uppercase';
          } else {
            cardStyle = 'border-neutral-250 border-dashed bg-neutral-50/20 hover:border-emerald-300 hover:bg-emerald-50/5';
            statusBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase font-bold';
          }

          return (
            <div 
              key={bay.id}
              className={`rounded-xl p-5 border-2 flex flex-col justify-between min-h-[300px] transition duration-150 custom-shadow-sm hover:shadow-md ${cardStyle}`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-sm font-bold font-mono text-neutral-900 uppercase tracking-wide">
                    {bay.name}
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wider ${statusBadge}`}>
                    {status}
                  </span>
                </div>

                {/* Bay specs info */}
                <span className="text-[10px] text-neutral-450 uppercase tracking-wider font-mono font-semibold block mt-1.5">
                  UNIT TYPE: <strong className="text-neutral-600 font-bold">{bay.type}</strong>
                </span>

                {/* Active vehicle details */}
                {car ? (
                  <div className="mt-4 space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] text-neutral-400 font-bold font-mono block uppercase tracking-wider">VEHICLE ATTACHED</span>
                      <span className="font-extrabold font-mono text-neutral-900 text-sm block tracking-widest bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 w-fit mt-1">{car.plateNumber}</span>
                      <span className="text-[11px] text-neutral-500 font-bold block mt-1">{car.make} {car.model}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t pt-2 border-neutral-100 font-sans">
                      <div>
                        <span className="text-[9px] text-neutral-450 block uppercase font-bold tracking-wider">Mechanic</span>
                        <span className="font-bold text-neutral-700 font-mono text-[11px]">{activeJob?.technicianName || 'STAFF'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-450 block uppercase font-bold tracking-wider">Elapsed Time</span>
                        <span className="font-bold text-neutral-700 font-mono text-[11px]">45m elapsed</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-600 font-sans mt-1">
                      <span className="font-bold text-neutral-700">Scope:</span> <span className="font-medium text-neutral-500">{activeJob?.title || 'Inspection diagnostics'}</span>
                    </div>

                    {isBlocked && (
                      <div className="mt-2.5 p-2 bg-critical-500 text-white rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
                        <AlertOctagon className="w-3.5 h-3.5 text-white" />
                        <span>BAY BLOCKED: WAITING INPUTS</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 text-center text-xs text-neutral-400 italic py-6 border border-dashed border-neutral-200 bg-neutral-50/50 rounded-xl">
                    Bay vacant & completely free.
                  </div>
                )}
              </div>

              {/* Action buttons inside */}
              <div className="mt-6 pt-3 border-t border-neutral-150 space-y-2">
                {car ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onReleaseBay(bay.id)}
                      className="flex-1 bg-white border border-neutral-300 text-neutral-600 hover:text-red-650 hover:bg-red-50 hover:border-red-200 font-sans uppercase font-extrabold text-[10px] tracking-wide py-2 rounded-xl transition flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Release Bay
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedBayForMove(bay.id);
                      }}
                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-sans uppercase font-extrabold text-[10px] tracking-wider py-2 px-3.5 rounded-xl transition flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Move
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* If selected bay is in loading state, show wait queue dispatch */}
                    {selectedBayForMove === bay.id || waitingQueueCars.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-mono font-bold text-neutral-500 block tracking-wider">Queue Dispatch:</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssignCarToBay(bay.id, e.target.value);
                              setSelectedBayForMove(null);
                            }
                          }}
                          defaultValue=""
                          className="w-full bg-white border-2 border-primary-700 text-xs py-2 px-2.5 rounded-xl font-sans uppercase font-extrabold text-primary-750 outline-none shadow-sm cursor-pointer"
                        >
                          <option value="">-- Choose Car --</option>
                          {waitingQueueCars.map(c => (
                            <option key={c.id} value={c.id}>{c.plateNumber} ({c.make})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-neutral-100 border border-neutral-300 text-neutral-400 font-sans uppercase font-extrabold text-[10px] tracking-wider py-2 rounded-xl text-center cursor-not-allowed"
                      >
                        No park-out waiting to assign
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
