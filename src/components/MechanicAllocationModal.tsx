import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Activity, Wrench, X } from 'lucide-react';
import { Mechanic, Car, ServiceBay } from '../types';
import { STAFF_ROSTER } from '../data';

interface MechanicAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (mechanicName: string) => void;
  bayName?: string;
  vehiclePlate?: string;
  cars?: Car[];
  bays?: ServiceBay[];
}

export const MechanicAllocationModal: React.FC<MechanicAllocationModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  bayName,
  vehiclePlate,
  cars,
  bays
}) => {
  if (!isOpen) return null;

  // Dynamically compute stats for all 12 mechanics based on current active jobs
  const computedStaff = STAFF_ROSTER.map((mechanic) => {
    const name = mechanic.name;
    if (!cars) {
      return {
        ...mechanic,
        activeJobsCount: mechanic.activeJobs,
        computedUtilization: mechanic.utilization
      };
    }

    // Find all jobs assigned to this technician
    const allJobsByMe = cars.flatMap(c => c.jobs.map(j => ({ ...j, carPlate: c.plateNumber, carStatus: c.overallStatus })))
      .filter(j => j.technicianName === name || name.toLowerCase().startsWith(j.technicianName.toLowerCase()));

    const activeJobsByMe = allJobsByMe.filter(j => j.status === 'in-progress');
    const completedJobsByMe = allJobsByMe.filter(j => j.status === 'completed');

    // Compute dynamic active jobs
    const activeJobsCount = activeJobsByMe.length;

    // Compute dynamic utilization based on active and completed jobs
    let computedUtilization = mechanic.utilization; // baseline
    if (activeJobsByMe.length > 0) {
      computedUtilization = Math.min(Math.max(computedUtilization, 75) + activeJobsByMe.length * 8, 98);
    } else if (completedJobsByMe.length > 0) {
      computedUtilization = Math.min(Math.max(computedUtilization, 60) + completedJobsByMe.length * 4, 90);
    } else {
      computedUtilization = Math.max(computedUtilization - 12, 10);
    }

    return {
      ...mechanic,
      activeJobsCount,
      computedUtilization
    };
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4 animate-fadeIn">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 flex-shrink-0">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Assign Mechanic</h2>
              {bayName && vehiclePlate && (
                <p className="text-sm font-semibold text-neutral-500 mt-1">
                  Allocating to {bayName} for vehicle {vehiclePlate}
                </p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 bg-neutral-50/50 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {computedStaff.map(mechanic => (
                <div 
                  key={mechanic.id}
                  onClick={() => onAssign(mechanic.name)}
                  className="bg-white border text-left border-neutral-200 rounded-xl p-5 hover:border-teal-500 hover:shadow-md cursor-pointer transition-all group flex flex-col gap-4 animate-scaleUp"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 font-bold">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-extrabold text-neutral-900 text-sm">{mechanic.name}</div>
                        <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">
                          {mechanic.level}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-neutral-100 pt-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase text-neutral-500">
                        <span>Utilization</span>
                        <span className={mechanic.computedUtilization > 80 ? 'text-orange-600' : 'text-emerald-600'}>
                          {mechanic.computedUtilization}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full ${mechanic.computedUtilization > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                          style={{ width: `${mechanic.computedUtilization}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-[1px] h-6 bg-neutral-200" />

                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                      <span className="text-sm font-black text-neutral-800 leading-none">{mechanic.activeJobsCount}</span>
                      <span className="text-[9px] font-bold text-neutral-400 uppercase mt-1">Active Jobs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
