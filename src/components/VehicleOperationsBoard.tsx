import React, { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  Search, 
  Clock, 
  User, 
  FileText, 
  AlertTriangle,
  ArrowUpDown,
  Compass,
  Sparkles,
  Wrench
} from 'lucide-react';
import { Car } from '../types';

interface VehicleOperationsBoardProps {
  cars: Car[];
  currentTime?: string;
  onSelectCar: (carId: string) => void;
}

export const VehicleOperationsBoard: React.FC<VehicleOperationsBoardProps> = ({
  cars,
  currentTime,
  onSelectCar
}) => {
  const [filter, setFilter] = useState<'all' | 'at-risk' | 'approval' | 'parts' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'promisedTime' | 'risk' | 'progress'>('promisedTime');
  const [search, setSearch] = useState('');

  // Helper to determine the precise operational risk category of a vehicle in real-time
  const getCarCategory = (car: Car) => {
    if (!car) return 'none';
    if (car.overallStatus === 'completed') return 'completed';
    if (car.overallStatus === 'blocked') return 'blocked';

    // Delay calculation
    const isCarDelayed = (() => {
      try {
        const [pHour, pMin] = car.promisedTime.split(':').map(Number);
        const [cHour, cMin] = (currentTime || '08:00').split(':').map(Number);
        const promisedTotal = pHour * 60 + pMin;
        const currentTotal = cHour * 60 + cMin;
        return currentTotal > promisedTotal;
      } catch {
        return false;
      }
    })();

    if (isCarDelayed) return 'delayed';

    // Check estimated time buffer risk
    const estimatedMins = car.jobs.reduce((sum, j) => sum + (j.durationMins || 20), 0);
    const remainingMins = (() => {
      try {
        const [pHour, pMin] = car.promisedTime.split(':').map(Number);
        const [cHour, cMin] = (currentTime || '08:00').split(':').map(Number);
        const promisedTotal = pHour * 60 + pMin;
        const currentTotal = cHour * 60 + cMin;
        return promisedTotal - currentTotal;
      } catch {
        return 120;
      }
    })();

    const isBufferRisk = remainingMins < (estimatedMins + 60);

    if (car.overallStatus === 'critical' || car.overallStatus === 'at-risk' || isBufferRisk) {
      return 'at-risk';
    }

    return 'healthy';
  };

  // Calculate progress percent of a vehicle
  const calculateProgress = (car: Car) => {
    if (car.jobs.length === 0) return 0;
    const completed = car.jobs.filter(j => j.status === 'completed').length;
    return Math.round((completed / car.jobs.length) * 100);
  };

  // Filters & sorts
  const filteredCars = useMemo(() => {
    return cars
      .filter(car => {
        // Search filter matching registration/make/model
        const matchesSearch = 
          car.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
          car.make.toLowerCase().includes(search.toLowerCase()) ||
          car.model.toLowerCase().includes(search.toLowerCase()) ||
          car.customerName.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        // Custom filter lists
        if (filter === 'all') return true;
        if (filter === 'at-risk') {
          const category = getCarCategory(car);
          return category === 'at-risk' || category === 'delayed';
        }
        if (filter === 'approval') return car.approvalPending;
        if (filter === 'parts') return car.partsOnOrder;
        if (filter === 'completed') return getCarCategory(car) === 'completed';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'promisedTime') {
          return a.promisedTime.localeCompare(b.promisedTime);
        }
        if (sortBy === 'risk') {
          const riskWeight = { 'critical': 4, 'at-risk': 3, 'blocked': 2, 'healthy': 1, 'completed': 0 };
          return (riskWeight[b.overallStatus] || 0) - (riskWeight[a.overallStatus] || 0);
        }
        if (sortBy === 'progress') {
          return calculateProgress(b) - calculateProgress(a);
        }
        return 0;
      });
  }, [cars, filter, sortBy, search, currentTime]);

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      {/* Header and filters line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded tracking-widest inline-block">Operational Scan</span>
          <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
            Real-time tracking of active jobs, technician assignments, and schedule commitments.
          </p>
        </div>

        {/* Search tool inside */}
        <div className="relative w-full md:w-[260px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search register plates / model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 h-9 bg-white border border-neutral-250 rounded-xl font-medium outline-none focus:border-primary-500 shadow-sm transition"
          />
        </div>
      </div>

      {/* Control ribbon: Filters + Sorting options */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-neutral-100/70 p-3 rounded-xl border border-neutral-200 text-xs">
        {/* Grayscale low-fi tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Vehicles', count: cars.length },
            { id: 'at-risk', label: 'At Risk', count: cars.filter(c => { const cat = getCarCategory(c); return cat === 'at-risk' || cat === 'delayed'; }).length },
            { id: 'approval', label: 'Waiting Approval', count: cars.filter(c => c.approvalPending).length },
            { id: 'parts', label: 'Waiting Parts', count: cars.filter(c => c.partsOnOrder).length },
            { id: 'completed', label: 'Completed', count: cars.filter(c => getCarCategory(c) === 'completed').length }
          ].map(tab => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider rounded-xl border transition-all duration-155 active:scale-95 ${
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

        {/* Sort triggers */}
        <div className="flex items-center gap-2">
          <span className="font-mono uppercase font-semibold text-neutral-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sorting:
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-white border border-neutral-250 px-2 py-1.5 text-xs font-semibold rounded-xl outline-none cursor-pointer focus:border-primary-500 shadow-sm"
          >
            <option value="promisedTime">Commitment (Dispatch Time)</option>
            <option value="risk">Risk / Gravity Level</option>
            <option value="progress">Work Progress (%)</option>
          </select>
        </div>
      </div>

      {/* Cards list workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCars.map(car => {
          const progress = calculateProgress(car);
          const isAtRisk = car.overallStatus === 'at-risk' || car.overallStatus === 'critical';
          const isBlocked = car.overallStatus === 'blocked';
          const isCompleted = car.overallStatus === 'completed';

          const hasServiceBay = car.jobs.some(j => j.status === 'completed' && !j.title.toLowerCase().includes('align') && !j.title.toLowerCase().includes('wash') && !j.title.toLowerCase().includes('vacuum') && !j.title.toLowerCase().includes('detail'));
          const hasAlignment = car.jobs.some(j => j.status === 'completed' && j.title.toLowerCase().includes('align'));
          const hasWash = car.jobs.some(j => j.status === 'completed' && (j.title.toLowerCase().includes('wash') || j.title.toLowerCase().includes('vacuum') || j.title.toLowerCase().includes('detail')));

          // Determine specific visual treatment
          let cardStyle = 'border-neutral-200 bg-white hover:border-primary-500';
          let badgeClass = 'bg-primary-100 text-primary-800 border bg-primary-50 border-primary-200';
          let progressBg = 'bg-primary-600';

          if (isBlocked) {
            cardStyle = 'border-l-4 border-l-critical-500 border-t border-b border-r border-critical-255 bg-critical-50/5 hover:border-critical-600';
            badgeClass = 'bg-critical-100 text-critical-700 border border-critical-200 uppercase';
            progressBg = 'bg-critical-550';
          } else if (isAtRisk) {
            cardStyle = 'border-l-4 border-l-risk-500 border-t border-b border-r border-risk-250 bg-risk-55/5 hover:border-risk-600';
            badgeClass = 'bg-risk-100 text-risk-850 border border-risk-200 uppercase';
            progressBg = 'bg-risk-500';
          } else if (isCompleted) {
            cardStyle = 'border-l-4 border-l-success-500 border-t border-b border-r border-success-200 bg-success-50/10 hover:border-success-600';
            badgeClass = 'bg-success-100 text-success-800 border border-success-200 uppercase';
            progressBg = 'bg-success-500';
          } else if (car.approvalPending) {
            cardStyle = 'border-l-4 border-l-warning-550 border-t border-b border-r border-warning-200 bg-warning-50/5 hover:border-warning-600';
            badgeClass = 'bg-warning-100 text-warning-700 border border-warning-200 uppercase';
            progressBg = 'bg-warning-500';
          }

          return (
            <div 
              key={car.id}
              onClick={() => onSelectCar(car.id)}
              className={`rounded-xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between custom-shadow-sm hover:shadow-md ${cardStyle}`}
            >
              <div>
                {/* Header line */}
                <div className="flex items-start justify-between pb-3 border-b border-neutral-100/50">
                  <div>
                    <span className="text-sm font-bold font-mono tracking-widest text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-250">
                      {car.plateNumber}
                    </span>
                    <span className="text-xs text-neutral-500 block uppercase font-bold mt-1 font-sans">
                      {car.make} {car.model}
                    </span>
                  </div>
                  
                  {/* Overall status badge */}
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase rounded border ${badgeClass}`}>
                    {car.overallStatus}
                  </span>
                </div>

                {/* Sub status descriptions */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-neutral-500">
                    <span className="flex items-center gap-1 font-mono text-neutral-700 font-bold bg-neutral-100 rounded px-1.5 py-0.5">
                      <Clock className="w-3.5 h-3.5 text-primary-600" /> DISPATCH: {car.promisedTime}
                    </span>
                    <span className={`uppercase font-extrabold text-[10px] px-1.5 py-0.5 rounded border ${isCompleted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : (car.currentBayId ? 'text-primary-800 bg-primary-100/50 border-primary-200' : 'text-amber-800 bg-amber-50 border-amber-200')}`}>
                      {isCompleted ? 'DISPATCH AREA' : (car.currentBayId ? `Bay 0${car.currentBayId.replace('bay-', '')}` : 'STAGED')}
                    </span>
                  </div>

                  {/* Technician and core active task listing */}
                  <div className="text-xs space-y-1.5 border-t pt-2.5 border-neutral-100 text-neutral-700">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-extrabold text-neutral-700">Mechanic: <span className="text-primary-805 font-mono">{car.jobs[0]?.technicianName || 'PENDING ASSIGN'}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <FileText className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="truncate">Tasks: <span className="font-bold text-neutral-600">{car.jobs.map(j => j.title).join(', ') || 'Inspection'}</span></span>
                    </div>
                    {/* Route completed indicators */}
                    {(hasServiceBay || hasAlignment || hasWash) && (
                      <div className="pt-2 border-t border-neutral-100/50 flex flex-wrap gap-1.5 mt-1 items-center">
                        <span className="text-[9px] text-neutral-400 font-mono font-bold uppercase tracking-wider block mr-0.5">Completed Route:</span>
                        {hasServiceBay && (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-extrabold font-mono px-1.5 py-0.5 rounded bg-neutral-50 text-neutral-600 border border-neutral-250">
                            🛠️ SERVICE BAY
                          </span>
                        )}
                        {hasAlignment && (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-extrabold font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-150">
                            🧭 ALIGNMENT
                          </span>
                        )}
                        {hasWash && (
                          <span className="inline-flex items-center gap-1 text-[8.5px] font-extrabold font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-150">
                            ✨ WASH BAY
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar info */}
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  <span>PROGRESS</span>
                  <span className="text-neutral-800 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200">
                  <div 
                    className={`${progressBg} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Warnings details inside if blocked / approval pending */}
              {(car.approvalPending || car.partsOnOrder) && (
                <div className="mt-4 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[11px] font-sans space-y-1.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div>
                    {car.approvalPending && (
                      <span className="block text-warning-700 font-extrabold uppercase text-[10px] tracking-wide">
                        AWAITING CLIENT QUOTE AUTH (${car.approvalRequiredCost})
                      </span>
                    )}
                    {car.partsOnOrder && (
                      <span className="block text-amber-800 font-bold text-[10.5px]">
                        PARTS ACTIVE: <span className="font-medium text-neutral-600">{car.partsOrderDescription}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredCars.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-neutral-400 italic bg-neutral-50 border border-dashed rounded-lg">
            No active vehicles match the current filter or search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
