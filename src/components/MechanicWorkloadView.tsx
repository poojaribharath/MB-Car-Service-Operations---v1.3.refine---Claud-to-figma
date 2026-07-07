import React, { useMemo } from 'react';
import { 
  Users, 
  Wrench, 
  Layers, 
  CheckSquare, 
  UserPlus, 
  AlertTriangle,
  Flame,
  BatteryCharging
} from 'lucide-react';
import { Car, ServiceBay } from '../types';
import { STAFF_ROSTER } from '../data';

interface MechanicWorkloadViewProps {
  cars: Car[];
  bays: ServiceBay[];
}

export const MechanicWorkloadView: React.FC<MechanicWorkloadViewProps> = ({
  cars,
  bays
}) => {
  // Build a distinct index of active mechanics from the database
  const techniciansList = useMemo(() => {
    return STAFF_ROSTER.map((mechanic, idx) => {
      const name = mechanic.name;
      // Find what jobs they are currently carrying out
      const activeJobs: { carPlate: string; jobTitle: string; status: string; bayName: string }[] = [];
      let totalMins = 0;
      let completedMins = 0;

      cars.forEach(car => {
        car.jobs.forEach(job => {
          // Flexible match for exact name or short names
          if (job.technicianName === name || name.toLowerCase().startsWith(job.technicianName.toLowerCase())) {
            const getBayName = () => {
              if (car.sharedResourceStatus === 'active') {
                return car.sharedResourceRequest === 'alignment' ? 'Alignment Rig' : 'Wash Bay';
              }
              const b = bays.find(b => b.id === car.currentBayId) || bays.find(b => b.currentCarId === car.id);
              return b ? b.name : 'Parked';
            };
            activeJobs.push({
              carPlate: car.plateNumber,
              jobTitle: job.title,
              status: job.status,
              bayName: getBayName()
            });
            totalMins += job.durationMins;
            if (job.status === 'completed') {
              completedMins += job.durationMins;
            } else if (job.status === 'in-progress') {
              completedMins += job.elapsedMins;
            }
          }
        });
      });

      // Utilization is based on active capacity allocations
      // If they have pre-seeded workload from STAFF_ROSTER, combine it
      const baseUtilization = totalMins > 0 ? Math.round((completedMins / totalMins) * 100) : mechanic.utilization;
      
      let availability: 'available' | 'optimal' | 'saturated' = 'available';
      const actualActiveJobs = activeJobs.filter(j => j.status !== 'completed');
      
      if (actualActiveJobs.length >= 2 || baseUtilization > 80) {
        availability = 'saturated';
      } else if (actualActiveJobs.length > 0) {
        availability = 'optimal';
      }

      return {
        name,
        level: mechanic.level,
        activeJobs: actualActiveJobs,
        completedCount: activeJobs.filter(j => j.status === 'completed').length,
        utilization: baseUtilization,
        availability,
        rating: 5 - (idx % 2)
      };
    });
  }, [cars, bays]);

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      {/* Header element */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded tracking-widest inline-block font-sans">Staffing & Capacity Management</span>
          <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
            Balance staff assignments, optimize task distributions, and identify technician schedule blocks.
          </p>
        </div>

        {/* Dynamic totals indicator */}
        <div className="bg-white border border-neutral-220 p-2.5 rounded-xl text-xs font-sans font-bold text-neutral-600 flex items-center gap-1.5 custom-shadow-sm">
          <Users className="w-4 h-4 text-primary-700" />
          <span>On-Floor Technicians: <span className="text-neutral-900 font-mono font-extrabold">{techniciansList.length} Staff</span></span>
        </div>
      </div>

      {/* Grid of mechanic profiling cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {techniciansList.map(tech => {
          const isSaturated = tech.availability === 'saturated';
          const isAvailable = tech.availability === 'available';

          const availabilityPillStyle = isSaturated
            ? 'bg-critical-100 text-critical-701 border border-critical-250 animate-pulse'
            : isAvailable
            ? 'bg-success-100 text-success-800 border border-success-200'
            : 'bg-primary-50 text-primary-800 border border-primary-200';

          return (
            <div 
              key={tech.name}
              className={`bg-white rounded-xl p-5 border flex flex-col justify-between min-h-[300px] transition custom-shadow-sm hover:border-primary-400 ${
                isSaturated ? 'border-critical-200' : 'border-neutral-250'
              }`}
            >
              <div>
                {/* Header overview line */}
                <div className="flex items-start justify-between border-b pb-3">
                  <div>
                    <span className="text-sm font-extrabold font-sans text-neutral-900 block">{tech.name}</span>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider font-mono">Floor Tech - {tech.level}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-extrabold uppercase tracking-wide ${availabilityPillStyle}`}>
                    {tech.availability}
                  </span>
                </div>

                {/* Status elements lists */}
                <div className="mt-4 space-y-4">
                  {/* Utilization metrics tracker */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-sans font-extrabold text-neutral-500 tracking-wider uppercase">
                      <span>CAPACITY ALLOCATION</span>
                      <span className="font-mono text-neutral-800">{tech.utilization}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border">
                      <div 
                        className={`h-full rounded-full transition-all ${isSaturated ? 'bg-critical-500' : 'bg-primary-500'}`}
                        style={{ width: `${Math.min(tech.utilization || 10, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Job Timeline Backlog */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-neutral-400 uppercase font-extrabold tracking-wider font-sans block">
                      Active Task Queue ({tech.activeJobs.length})
                    </span>

                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {tech.activeJobs.map((job, idx) => (
                        <div key={idx} className="p-2 border border-neutral-200 bg-neutral-50/70 rounded-xl flex items-center justify-between text-xs font-sans">
                          <div>
                            <span className="font-extrabold font-mono text-neutral-850 block">{job.carPlate}</span>
                            <span className="text-[10px] text-neutral-500 block truncate max-w-[170px]">{job.jobTitle}</span>
                          </div>
                          <span className="text-[9px] bg-white border border-neutral-200 text-neutral-605 px-1.5 py-0.5 rounded-lg font-mono font-bold">
                            {job.bayName}
                          </span>
                        </div>
                      ))}

                      {tech.activeJobs.length === 0 && (
                        <div className="text-center py-6 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-[11px] text-neutral-450 italic font-sans">
                          No active assigned tasks. Staff idle/ready.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource balancing overrides actions footer */}
              <div className="mt-6 pt-3 border-t border-neutral-150 flex items-center justify-between text-xs text-neutral-500 font-sans">
                <div>
                  <span>Completed: <span className="font-mono font-extrabold text-neutral-850">{tech.completedCount}</span> today</span>
                </div>

                <button 
                  disabled={isAvailable}
                  className={`bg-neutral-900 text-white hover:bg-neutral-800 font-sans uppercase font-extrabold text-[9px] tracking-wide px-3 py-1.5 rounded-xl transition shadow active:scale-95 ${
                    isAvailable ? 'opacity-20 cursor-not-allowed' : ''
                  }`}
                >
                  Balance
                </button>
              </div>

            </div>
          );
        })}

        {/* Virtual Placeholder Slot to Balance Resources */}
        <div className="border border-dashed border-neutral-250 rounded-xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-neutral-50/20 custom-shadow-sm">
          <UserPlus className="w-8 h-8 text-neutral-400 mb-2" />
          <span className="font-sans text-xs font-extrabold text-neutral-750 uppercase tracking-widest">Interactive Placeholder</span>
          <p className="text-[11px] text-neutral-450 max-w-[190px] mt-1 font-sans leading-relaxed">
            Drag here to allocate custom freelancers or split workloads on surge shifts.
          </p>
        </div>
      </div>
    </div>
  );
};
