import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { isPartsEtaTooLong, getCarRiskStatus, getDelayMinutes } from '../lib/utils';
import { 
  GripVertical,
  MoreVertical,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Hourglass,
  Package,
  Activity
} from 'lucide-react';
import { ServiceBay, Car } from '../types';

interface ServiceBayCardProps {
  bay: ServiceBay;
  car: Car | null;
  onSelectCar: (carId: string) => void;
  onToggleJobProgress: (carId: string, jobId: string) => void;
  onReleaseBay: (bayId: string) => void;
  onAssignCar: (bayId: string, carId: string) => void;
  availableStagedCars: Car[]; // Used for manual assignment list
  availableWaitlistCars?: Car[]; // Used for top queue preview
  currentTime?: string;
  secondsInMinute?: number;
}

export const ServiceBayCard: React.FC<ServiceBayCardProps> = ({
  bay,
  car,
  onSelectCar,
  onReleaseBay,
  onAssignCar,
  availableWaitlistCars = [],
  currentTime = '08:00',
  secondsInMinute = 0
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Calculate initials
  const getInitials = (name: string) => {
    if (!name || name === 'Unassigned') return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return parts[0][0].toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Get color for mechanic initials
  const getMechanicBadgeColor = (name: string) => {
    if (!name || name === 'Unassigned') return 'bg-neutral-100 text-neutral-600';
    const code = name.charCodeAt(0) % 5;
    switch (code) {
      case 0: return 'bg-teal-100 text-teal-800 border-teal-200';
      case 1: return 'bg-amber-100 text-amber-800 border-amber-200';
      case 2: return 'bg-sky-100 text-sky-800 border-sky-200';
      case 3: return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const carId = e.dataTransfer.getData('text/plain');
    if (carId) {
      onAssignCar(bay.id, carId);
    }
  };

  const isBlocked = car?.overallStatus === 'blocked';
  const delayMins = car ? getDelayMinutes(car.promisedTime, currentTime) : 0;
  const category = car ? getCarRiskStatus(car, currentTime || '00:00') : 'none';
  const isAtRisk = category === 'at-risk' || category === 'delayed';
  const isWaitingApproval = car?.approvalPending;
  const isWaitingParts = car?.partsOnOrder;

  // Compute actual elapsed blocked duration
  const blockedMins = (car && isBlocked && car.blockedAt) ? getDelayMinutes(car.blockedAt, currentTime) : 0;
  const isBlockedOver2Hours = isBlocked && (
    blockedMins >= 120 ||
    isPartsEtaTooLong(car?.partsExpectedTime)
  );

  // Determine dominant status and its badge styling
  let statusText = 'IN WORK';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  
  if (car) {
    if (car.overallStatus === 'completed') {
      statusText = 'COMPLETED';
      badgeClass = 'bg-green-50 text-green-700 border-green-200';
    } else if (isBlocked) {
      if (isBlockedOver2Hours) {
        statusText = 'BAY BLOCKED > 2HRS';
        badgeClass = 'bg-red-600 text-white border-red-700 font-extrabold animate-pulse';
      } else {
        statusText = 'BLOCKED';
        badgeClass = 'bg-red-50 text-red-600 border-red-200';
      }
    } else if (isWaitingApproval) {
      statusText = 'WAITING APPROVAL';
      badgeClass = 'bg-amber-50 text-amber-600 border-amber-200';
    } else if (isWaitingParts) {
      statusText = 'WAITING PART';
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-250';
    } else if (isAtRisk) {
      statusText = 'AT RISK';
      badgeClass = 'bg-orange-100 text-orange-700 border-orange-200 font-sans font-extrabold';
    }
  }

  // Render vacant state
  if (!car) {
    const elapsed = bay.becameFreeAt ? getDelayMinutes(bay.becameFreeAt, currentTime) : 0;
    const remainingGrace = Math.max(0, 10 - elapsed);
    const nextCarInQueue = availableWaitlistCars[0];

    const [hVal, mVal] = currentTime.split(':').map(Number);
    const isAfter9PM = hVal >= 21 || hVal < 8;

    // Ticking seconds display - show MM:SS format
    // Fix: Using a unified second offset to prevent visual reset during minute ticks
    const totalSecondsElapsed = elapsed * 60 + secondsInMinute;
    const totalSecondsGrace = 600; // 10 minutes
    const totalSecondsRemaining = isAfter9PM ? 0 : Math.max(0, totalSecondsGrace - totalSecondsElapsed);
    
    const displayMins = Math.floor(totalSecondsRemaining / 60);
    const displaySecs = totalSecondsRemaining % 60;
    
    const timeString = isAfter9PM ? "--:--" : `${displayMins}:${displaySecs.toString().padStart(2, '0')}`;
    const progressRemaining = isAfter9PM ? 0 : (totalSecondsRemaining / totalSecondsGrace) * 100;

    return (
      <motion.div
        id={`bay-card-${bay.id}`}
        layout
        className="bg-white rounded-xl p-4 transition-all duration-200 flex flex-col justify-between min-h-[224px] border-2 border-dashed border-emerald-200 bg-emerald-50/5 hover:bg-emerald-50/10 shadow-sm"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100/50">
            <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider">
              {bay.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-sm bg-emerald-100 text-emerald-800 tracking-wide uppercase font-mono">
                FREE
              </span>
            </div>
          </div>
          
          <div className="mt-3 flex flex-col items-center text-center">
            <div className="relative w-16 h-16 mb-2">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  className={isAfter9PM ? "text-neutral-100" : "text-emerald-50"}
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={176}
                  strokeDashoffset={176 - (176 * progressRemaining) / 100}
                  className={`${isAfter9PM ? "text-neutral-200" : "text-emerald-500"} transition-all duration-1000`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[11px] font-black font-mono leading-none ${isAfter9PM ? "text-neutral-400" : "text-emerald-700"}`}>{timeString}</span>
                <span className={`text-[7px] font-bold uppercase tracking-tighter mt-0.5 ${isAfter9PM ? "text-neutral-400" : "text-emerald-500"}`}>AUTO</span>
              </div>
            </div>
            
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isAfter9PM ? "text-neutral-400" : "text-emerald-600"}`}>
              {isAfter9PM ? "Auto-Assign Stopped" : "Auto-Assign Pending"}
            </span>
          </div>
        </div>

        <div className="mt-auto">
          {nextCarInQueue && !isAfter9PM ? (
            <div className="bg-white p-2 rounded-lg border border-emerald-100 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Next Vehicle</span>
                <Clock className="w-2.5 h-2.5 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-neutral-900">{nextCarInQueue.plateNumber}</span>
                <span className="text-[10px] font-bold text-neutral-500 truncate ml-2">{nextCarInQueue.make} {nextCarInQueue.model}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 bg-neutral-50 rounded-lg border border-neutral-100">
               <span className="text-[10px] font-bold text-neutral-400">
                 {isAfter9PM ? "Opens @ 08:00 AM" : "Queue is empty"}
               </span>
            </div>
          )}
          <div className="mt-2 text-center">
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">
              Or drag from waitlist manually
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Formulate warning texts
  let blockedText = "1h 25m";
  if (car.partsExpectedTime) {
    blockedText = car.partsExpectedTime;
  }

  let waitingText = "45 Minutes";
  if (car.approvalRequestedAt) {
    const elapsed = getDelayMinutes(car.approvalRequestedAt, currentTime);
    waitingText = `${elapsed > 0 ? elapsed : 45} Minutes`;
  }

  const etaText = car.partsExpectedTime ? `ETA ${car.partsExpectedTime}` : 'ETA 2 Hours';
  
  const riskText = delayMins > 0 ? `${delayMins} Minutes Behind` : '30 Minutes Behind';

  // Active job details
  const activeJob = car.jobs.find(j => j.status === 'in-progress') || car.jobs[0];
  let progressPercent = 60; // Fallback default
  if (activeJob && activeJob.durationMins > 0) {
    progressPercent = Math.min(100, Math.round((activeJob.elapsedMins / activeJob.durationMins) * 100));
  }
  if (progressPercent <= 0) {
    progressPercent = 40; // Default placeholder for normal loading
  }

  // Next Step Suggestion
  let nextStepText = "Proceed as planned";
  if (isBlocked) {
    nextStepText = "Reschedule / Contact Customer";
  } else if (isWaitingApproval) {
    nextStepText = "Call Customer for Auth";
  } else if (isWaitingParts) {
    nextStepText = "Check ETA / Expedite Parts";
  } else if (isAtRisk) {
    nextStepText = "Expedite / Assign Helper";
  }

  return (
    <motion.div
      id={`bay-card-${bay.id}`}
      layout
      initial={{ scale: 1 }}
      animate={
        isBlockedOver2Hours
          ? { scale: [1, 1.015, 1], borderColor: ["#EF4444", "#DC2626", "#EF4444"], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
          : isBlocked 
          ? { scale: [1, 1.02, 1], transition: { duration: 0.3 } }
          : isAtRisk
          ? { borderColor: ["#fbd38d", "#ed8936", "#fbd38d"], transition: { duration: 1.5, ease: "easeInOut" } }
          : {}
      }
      className={`rounded-xl p-4 transition-colors duration-500 flex flex-col justify-between min-h-[224px] shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.02)] border ${
        isBlockedOver2Hours
          ? 'border-red-500 bg-red-50/70 border-2 shadow-[0_0_12px_rgba(220,38,38,0.15)] ring-2 ring-red-500/20'
          : isBlocked 
          ? 'border-l-4 border-l-red-600 border-t border-b border-r border-red-200 bg-red-50/10' 
          : isAtRisk 
          ? 'border-l-4 border-l-orange-500 border-t border-b border-r border-orange-200 bg-[#FAF7F0]'
          : 'border-neutral-200 bg-white hover:border-neutral-350'
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div>
        {/* Header Ribbon Row of the card */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <span className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider">
            {bay.name}
          </span>
          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded border ${badgeClass} tracking-wide uppercase font-mono`}>
            {statusText}
          </span>
        </div>

        {/* Card Body content */}
        <div className="space-y-2 mt-2.5">
          {/* Draggable Vehicle Plate Container */}
          <div 
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', car.id);
            }}
            onClick={() => onSelectCar(car.id)}
            className={`rounded-lg p-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing transition-colors border ${
              isAtRisk 
                ? 'bg-orange-50/40 border-orange-100 hover:bg-orange-100/20' 
                : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-extrabold text-neutral-900 tracking-wide font-sans leading-none flex items-center gap-1.5">
                {car.plateNumber} · <span className="font-bold text-neutral-600">{car.model || car.make}</span>
              </span>
              <span className="text-[11px] text-neutral-500 font-semibold mt-1.5 block leading-none">
                {car.customerName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 select-none">
              <span className="flex flex-col gap-[2px] cursor-grab">
                <span className="w-1.5 h-[2px] bg-neutral-400 rounded-full" />
                <span className="w-1.5 h-[2px] bg-neutral-400 rounded-full" />
                <span className="w-1.5 h-[2px] bg-neutral-400 rounded-full" />
              </span>
            </div>
          </div>

          {/* Mechanic Assignee Info */}
          <div className="text-[11px] font-bold text-neutral-500">
            Mechanic: <span className="text-neutral-700 font-extrabold">{activeJob?.technicianName || 'Unassigned'}</span>
          </div>

          {/* Service & Job Description Details */}
          <div className="text-[11px] text-neutral-600 font-semibold leading-relaxed">
            {activeJob ? activeJob.title : 'Standard Inspection'}
          </div>
        </div>
      </div>

      {/* Dynamic Mid section info representation (Progress bar vs alerts) */}
      <div className="mt-3">
        {/* If blocked */}
        {isBlocked && (
          <div className="flex flex-col gap-1">
            <span className={`text-xl font-black tracking-tight font-mono select-none ${isBlockedOver2Hours ? 'text-red-700 text-2xl animate-pulse' : 'text-red-600'}`}>
              {blockedText}
            </span>
            {isBlockedOver2Hours && (
              <span className="text-[9px] w-fit font-mono font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 py-[2px] rounded uppercase animate-bounce mt-1">
                ⚠️ CRITICAL OVER-2H DELAY
              </span>
            )}
          </div>
        )}

        {/* If waiting approval */}
        {!isBlocked && isWaitingApproval && (
          <div className="text-xl font-extrabold text-amber-500 tracking-tight font-mono select-none">
            {waitingText}
          </div>
        )}

        {/* If waiting parts */}
        {!isBlocked && !isWaitingApproval && isWaitingParts && (
          <div className="text-xl font-extrabold text-amber-600 tracking-tight select-none">
            {etaText}
          </div>
        )}

        {/* If at risk */}
        {!isBlocked && !isWaitingApproval && !isWaitingParts && isAtRisk && (
          <div className="text-base font-extrabold text-rose-600 tracking-tight uppercase animate-pulse select-none">
            {riskText}
          </div>
        )}

        {/* Default / Good status Progress bar representation */}
        {!isBlocked && !isWaitingApproval && !isWaitingParts && !isAtRisk && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-extrabold text-neutral-400 tracking-wider">
              <span>PROGRESS</span>
              <span className="text-neutral-750 font-mono text-[11px]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200">
              <div 
                className="bg-teal-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Suggested Next Step */}
        <div className="mt-2.5 bg-neutral-50 border border-neutral-100 rounded text-[10px] font-bold text-neutral-600 p-1.5 flex items-start gap-1.5 leading-tight">
          <Activity className="w-3 h-3 text-teal-600 mt-0.5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold">Next Step</span>
            <span className="text-neutral-700">{nextStepText}</span>
          </div>
        </div>
      </div>

      {/* Card Footer options and bottom stats */}
      <div className="mt-3.5 pt-2 border-t border-neutral-105 flex items-center justify-between text-[11px] font-bold text-neutral-500">
        <div className="flex flex-col">
          {isAtRisk ? (
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-450 text-[10px] font-extrabold uppercase tracking-wide">
                Dispatch
              </span>
              <span className="text-orange-600 font-mono font-black text-sm select-none">
                {car.promisedTime}
              </span>
            </div>
          ) : (
            <span className="text-neutral-400 text-[10px] font-extrabold uppercase tracking-wide">
              Dispatch: <span className="text-neutral-800 font-mono text-[11px]">{car.promisedTime}</span>
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button 
            type="button"
            className="hover:text-neutral-900 transition-colors cursor-pointer text-xs font-bold text-neutral-600 hover:text-black"
            onClick={() => onSelectCar(car.id)}
          >
            Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};
