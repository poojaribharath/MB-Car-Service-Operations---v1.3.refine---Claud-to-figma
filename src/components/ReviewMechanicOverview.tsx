import React from 'react';
import { cn } from '../lib/utils';
import { User } from 'lucide-react';
import { Car, ServiceBay } from '../types';
import { STAFF_ROSTER } from '../data';

interface ReviewMechanicOverviewProps {
  cars: Car[];
  bays: ServiceBay[];
}

interface MechanicStats {
  id: string;
  name: string;
  level: string;
  vehiclesCompleted: number;
  jobsCompleted: number;
  activeWorkTime: number; // percentage
  status: 'active' | 'idle' | 'warning';
}

export const ReviewMechanicOverview: React.FC<ReviewMechanicOverviewProps> = ({
  cars,
  bays
}) => {
  // Dynamically compute stats for all 12 mechanics in the roster
  const computedMechanics: MechanicStats[] = STAFF_ROSTER.map((mechanic) => {
    const name = mechanic.name;

    // Find all jobs assigned to this technician
    const allJobsByMe = cars.flatMap(c => c.jobs.map(j => ({ ...j, carPlate: c.plateNumber, carStatus: c.overallStatus })))
      .filter(j => j.technicianName === name || name.toLowerCase().startsWith(j.technicianName.toLowerCase()));

    const completedJobsByMe = allJobsByMe.filter(j => j.status === 'completed');
    const activeJobsByMe = allJobsByMe.filter(j => j.status === 'in-progress');

    // 1. Vehicles completed: stable daily baseline + live completed jobs
    const baseCompletedVehicles = (parseInt(mechanic.id) * 3 + 2) % 4 + 2; // stable base between 2 and 5
    // Unique completed vehicle plates
    const uniqueLiveCompletedPlates = new Set(completedJobsByMe.map(j => j.carPlate));
    const vehiclesCompleted = baseCompletedVehicles + uniqueLiveCompletedPlates.size;

    // 2. Jobs completed: base completed + live completed jobs
    const jobsCompleted = vehiclesCompleted + completedJobsByMe.length;

    // 3. Active work time / Utilization
    let activeWorkTime = mechanic.utilization; // start with static baseline
    if (activeJobsByMe.length > 0) {
      activeWorkTime = Math.min(Math.max(activeWorkTime, 75) + activeJobsByMe.length * 8, 98);
    } else if (completedJobsByMe.length > 0) {
      activeWorkTime = Math.min(Math.max(activeWorkTime, 60) + completedJobsByMe.length * 4, 90);
    } else {
      activeWorkTime = Math.max(activeWorkTime - 12, 10); // slightly idle
    }

    // 4. Status
    let status: 'active' | 'idle' | 'warning' = 'idle';
    const carsWithMyJobs = cars.filter(c => c.jobs.some(j => 
      (j.technicianName === name || name.toLowerCase().startsWith(j.technicianName.toLowerCase()))
    ));
    const hasBlockedJob = carsWithMyJobs.some(c => c.overallStatus === 'blocked');
    const hasActiveJob = carsWithMyJobs.some(c => c.jobs.some(j => j.status === 'in-progress'));

    if (hasBlockedJob) {
      status = 'warning';
    } else if (hasActiveJob) {
      status = 'active';
    } else if (activeWorkTime > 45) {
      status = 'active';
    }

    return {
      id: mechanic.id,
      name,
      level: mechanic.level,
      vehiclesCompleted,
      jobsCompleted,
      activeWorkTime,
      status
    };
  });

  // Sort: Active or warning first, then by utilization
  const sortedMechanics = [...computedMechanics].sort((a, b) => {
    if (a.status === 'warning' && b.status !== 'warning') return -1;
    if (b.status === 'warning' && a.status !== 'warning') return 1;
    if (a.status === 'active' && b.status === 'idle') return -1;
    if (b.status === 'active' && a.status === 'idle') return 1;
    return b.activeWorkTime - a.activeWorkTime;
  });

  return (
    <div className="bg-white p-space-6 rounded-xl border border-neutral-200 custom-shadow-sm h-full flex flex-col">
      <div className="border-b border-neutral-100 pb-space-4 mb-space-5">
        <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Mechanic Performance Overview</h3>
        <p className="text-body text-neutral-500 mt-1">Operational balancing and labor efficiency metrics ({STAFF_ROSTER.length} total staff)</p>
      </div>

      <div className="overflow-y-auto max-h-[500px] pr-1 flex-grow">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-neutral-100 text-[10px] font-bold uppercase text-neutral-400 font-mono">
              <th className="pb-space-3 font-semibold bg-white">Mechanic Name</th>
              <th className="pb-space-3 font-semibold text-center bg-white">Vehicles</th>
              <th className="pb-space-3 font-semibold text-center bg-white">Jobs</th>
              <th className="pb-space-3 font-semibold text-right bg-white">Active Work Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {sortedMechanics.map((m) => (
              <tr key={m.id} className="group hover:bg-neutral-50/50 transition-colors">
                <td className="py-space-3">
                   <div className="flex items-center gap-space-3">
                      <div className="w-space-8 h-space-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold group-hover:bg-primary-100 transition-colors shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-card-title font-bold text-neutral-800 leading-tight">{m.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] font-bold uppercase text-neutral-400 font-mono">{m.level}</span>
                          <span className={cn(
                            "text-[8px] font-black px-1 py-0.2 rounded uppercase",
                            m.status === 'active' ? "bg-success-50 text-success-700" :
                            m.status === 'idle' ? "bg-neutral-100 text-neutral-500" :
                            "bg-warning-50 text-warning-700"
                          )}>
                            {m.status}
                          </span>
                        </div>
                      </div>
                   </div>
                </td>
                <td className="py-space-3 text-center">
                   <span className="text-h3 font-bold text-neutral-900 font-mono">{m.vehiclesCompleted}</span>
                </td>
                <td className="py-space-3 text-center">
                   <span className="text-h3 font-bold text-neutral-700 font-mono">{m.jobsCompleted}</span>
                </td>
                <td className="py-space-3 text-right">
                   <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className={cn(
                          "text-h3 font-bold font-mono",
                          m.activeWorkTime >= 80 ? "text-success-600" :
                          m.activeWorkTime >= 50 ? "text-neutral-900" :
                          "text-warning-600"
                        )}>
                          {m.activeWorkTime}%
                        </span>
                        <span className="text-[9px] text-neutral-400 font-bold uppercase font-mono">Active</span>
                      </div>
                      <div className="w-20 h-1 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            m.activeWorkTime >= 80 ? "bg-success-500" :
                            m.activeWorkTime >= 50 ? "bg-primary-500" :
                            "bg-warning-500"
                          )}
                          style={{ width: `${m.activeWorkTime}%` }}
                        />
                      </div>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-space-4 p-space-3 bg-primary-50 border border-primary-100 rounded-xl">
        <p className="text-[11px] leading-[1.5] text-primary-900">
          <strong className="font-bold">Operational Insight:</strong> Live technician roster tracks current queue velocity. Top-utilized senior mechanics (Sarah, Ming, Ravi) are hitting daily targets. Ensure junior team members receive balanced work distribution.
        </p>
      </div>
    </div>
  );
};

