import React from 'react';
import { motion } from 'motion/react';
import { 
  GripVertical
} from 'lucide-react';
import { SharedResource, Car } from '../types';

interface SharedResourceCardProps {
  resource: SharedResource;
  cars: Car[];
  onRemoveFromQueue: (resourceId: string, carId: string) => void;
  onAdvanceQueue: (resourceId: string) => void;
  onAddToQueue: (resourceId: string, carId: string) => void;
}

export const SharedResourceCard: React.FC<SharedResourceCardProps> = ({
  resource,
  cars,
  onRemoveFromQueue,
  onAdvanceQueue,
  onAddToQueue
}) => {
  const activeCar = cars.find(c => c.id === resource.currentCarId);
  const nextCarId = resource.queue[0];
  const nextCar = nextCarId ? cars.find(c => c.id === nextCarId) : null;

  // Compute resource progress dynamically
  const resourceJob = activeCar?.jobs.find(j => {
    const t = j.title.toLowerCase();
    return resource.type === 'alignment'
      ? t.includes('align')
      : (t.includes('wash') || t.includes('detail'));
  });

  const activeElapsed = resourceJob ? resourceJob.elapsedMins : (resource.type === 'alignment' ? 15 : 8);
  const activeDuration = resourceJob ? resourceJob.durationMins : (resource.type === 'alignment' ? 30 : 15);
  const progressPct = Math.min(100, Math.round((activeElapsed / activeDuration) * 100));

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const carId = e.dataTransfer.getData('text/plain');
    if (carId) {
      onAddToQueue(resource.id, carId);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl p-4 border border-neutral-200 flex flex-col justify-between min-h-[200px] shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.02)]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div>
        {/* Header Line */}
        <div className="flex items-center justify-between pb-2">
          <div>
            <h4 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider">
              {resource.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-neutral-400 font-bold tracking-wide uppercase">
                {resource.type === 'alignment' ? '4-WHEEL ALIGNMENT' : 'EXTERIOR + INTERIOR'}
              </span>
              <span className="text-neutral-300">|</span>
              <span className="text-[10px] text-teal-600 font-mono font-bold">
                {resource.assignedTechnicianId?.toUpperCase() || 'NO TECH'}
              </span>
            </div>
          </div>

          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-sm tracking-wide uppercase font-mono ${
            activeCar 
              ? 'bg-success-100 text-success-700' 
              : 'bg-neutral-150 text-neutral-500'
          }`}>
            {activeCar ? 'IN WORK' : 'FREE'}
          </span>
        </div>

        {/* Content area */}
        <div className="pt-3">
          {activeCar ? (
            <div className="space-y-2">
              {/* Active Car Plate box */}
              <div 
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', activeCar.id);
                }}
                className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 flex items-center justify-between hover:bg-neutral-100 cursor-grab active:cursor-grabbing transition-colors"
              >
                <span className="text-sm font-extrabold text-neutral-900 tracking-widest font-mono">
                  {activeCar.plateNumber}
                </span>
                <span className="flex flex-col gap-[2px] cursor-grab">
                  <span className="w-1.5 h-[2px] bg-neutral-400 rounded-full" />
                  <span className="w-1.5 h-[2px] bg-neutral-400 rounded-full" />
                  <span className="w-1.5 h-[2px] bg-neutral-400 rounded-full" />
                </span>
              </div>

              {/* Dynamic progress bar */}
              <div className="space-y-1 bg-neutral-50 border border-neutral-150 p-2 rounded-lg text-[10px]">
                <div className="flex justify-between font-mono font-bold text-neutral-500">
                  <span>Progress: {activeElapsed}/{activeDuration}m</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full bg-neutral-150 h-1 rounded-full overflow-hidden border border-neutral-200">
                  <div className="bg-primary-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
          ) : (
            /* empty slot dashed helper */
            <div className="border-2 border-dashed border-neutral-200 bg-neutral-100/50 rounded-xl h-[56px] flex flex-col justify-center items-center text-center p-2">
              <span className="text-xs font-extrabold text-neutral-550">
                Drop Vehicle
              </span>
              <span className="text-[9px] text-neutral-400 font-semibold">
                drag a card here
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next slot row */}
      <div className="mt-4 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] font-bold">
        <div className="flex items-center gap-1.5 text-neutral-500">
          <span className="font-extrabold text-neutral-450 uppercase tracking-widest text-[9px]">Next slot ·</span>
          {nextCar ? (
            <span className="font-mono font-extrabold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded text-xs select-all">
              {nextCar.plateNumber}
            </span>
          ) : (
            <span className="text-neutral-400 italic font-mono text-[10px]">13:15</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {nextCar && (
            <button
              onClick={() => onRemoveFromQueue(resource.id, nextCar.id)}
              className="text-neutral-400 hover:text-red-600 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => onAdvanceQueue(resource.id)}
            disabled={!activeCar && !nextCar}
            className={`px-3 py-1 font-extrabold text-[11px] rounded transition-all duration-150 ${
              !activeCar && nextCar
                ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                : activeCar
                ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                : 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
            }`}
          >
            {activeCar ? 'Release Station' : 'Pull Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
