import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { isPartsEtaTooLong, getCarRiskStatus } from '../lib/utils';
import { STAFF_ROSTER } from '../data';
import { 
  X, 
  MapPin, 
  User, 
  Phone, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  CornerDownRight, 
  Plus, 
  Trash2,
  Lock,
  ArrowRightLeft,
  Truck,
  PhoneCall,
  Activity
} from 'lucide-react';
import { Car, ServiceBay, ServiceJob, ActivityLogEntry } from '../types';

interface VehicleDetailModalProps {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
  bays: ServiceBay[];
  logs: ActivityLogEntry[];
  currentTime: string;
  onUpdateCar: (updatedCar: Car) => void;
  onAddLog: (message: string, type: ActivityLogEntry['type']) => void;
  onDispatchCar?: (carId: string) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  car,
  isOpen,
  onClose,
  bays,
  logs,
  currentTime,
  onUpdateCar,
  onAddLog,
  onDispatchCar
}) => {
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkDuration, setNewWorkDuration] = useState<number>(30);
  const [newWorkCost, setNewWorkCost] = useState<number>(60);
  const [newWorkTech, setNewWorkTech] = useState(STAFF_ROSTER[0]?.name || 'Sarah Patel');

  // Block parameters inputs for modal toggles
  const [blockType, setBlockType] = useState<'none' | 'approval' | 'parts' | 'manual'>('none');
  const [extraWorkDesc, setExtraWorkDesc] = useState('Discovered leak in rear shocks requiring full assembly swap');
  const [extraWorkCost, setExtraWorkCost] = useState<number>(310);
  const [partsDesc, setPartsDesc] = useState('Upper Hose Inlet Pipe replacement Part');
  const [partsEta, setPartsEta] = useState('30 mins');
  const [manualBlockReason, setManualBlockReason] = useState('Requires specialized diagnostic tool from another branch');

  const [activeModalTab, setActiveModalTab] = useState<'status_card' | 'actions'>('status_card');

  React.useEffect(() => {
    if (car) {
      if (car.partsOnOrder) {
        setBlockType('parts');
        setPartsDesc(car.partsOrderDescription || 'Upper Hose Inlet Pipe replacement Part');
        setPartsEta(car.partsExpectedTime || '30 mins');
      } else if (car.approvalPending) {
        setBlockType('approval');
        setExtraWorkDesc(car.approvalRequiredWork || 'Discovered leak in rear shocks requiring full assembly swap');
        setExtraWorkCost(car.approvalRequiredCost || 310);
      } else if (car.holdingReason === 'manual' || car.overallStatus === 'blocked') {
        setBlockType('manual');
        setManualBlockReason(car.manualBlockReason || 'Requires specialized diagnostic tool from another branch');
      } else {
        setBlockType('none');
      }
    }
  }, [car?.id]);

  if (!isOpen || !car) return null;

  // Filter logs for this specific car
  const vehicleLogs = logs.filter(l => {
    // If the log is archived (belonging to a past dispatched service visit), don't show it in the active/current timeline
    if (l.archived) return false;

    // Direct visit isolation if carId is present
    if (l.carId) {
      return l.carId === car.id;
    }

    // High-fidelity fallback isolation using strictly the unique registration plate number
    const escapedPlate = car.plateNumber.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const plateRegex = new RegExp(`(?:[^a-zA-Z0-9]|^)${escapedPlate}(?:[^a-zA-Z0-9]|$)`, 'i');
    
    return plateRegex.test(l.message);
  });

  // Re-assign bay selection
  const handleBayReassign = (newBayId: string | 'staging') => {
    const updatedBayId = newBayId === 'staging' ? null : newBayId;
    
    let updatedJobs = car.jobs;
    if (updatedBayId !== null) {
      const hasInProgress = car.jobs.some(j => j.status === 'in-progress');
      const firstPendingOrHoldIdx = car.jobs.findIndex(j => j.status === 'pending' || j.status === 'hold');
      if (!hasInProgress && firstPendingOrHoldIdx !== -1) {
        updatedJobs = car.jobs.map((j, idx) => {
          if (idx === firstPendingOrHoldIdx) {
            return { ...j, status: 'in-progress' as const };
          }
          return j;
        });
      }
    }

    onUpdateCar({
      ...car,
      currentBayId: updatedBayId,
      jobs: updatedJobs
    });

    const destination = newBayId === 'staging' ? 'Staging Lane (Outside)' : bays.find(b => b.id === newBayId)?.name;
    onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Reassigned onto ${destination}.`, 'info');
  };

  // Add a task directly in-modal
  const handleAddNewTask = () => {
    if (!newWorkTitle) return;

    const newTask: ServiceJob = {
      id: `job-detail-added-${Date.now()}`,
      title: newWorkTitle,
      durationMins: newWorkDuration,
      elapsedMins: 0,
      status: 'pending',
      technicianName: newWorkTech,
      cost: newWorkCost
    };

    onUpdateCar({
      ...car,
      jobs: [...car.jobs, newTask]
    });

    onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Appended new task '${newWorkTitle}' estimate ${newWorkDuration}m.`, 'info');
    setNewWorkTitle('');
  };

  // Remove a task from job card
  const handleRemoveTask = (taskId: string) => {
    const task = car.jobs.find(j => j.id === taskId);
    const updatedJobs = car.jobs.filter(j => j.id !== taskId);
    
    // Recalculate status in case active was removed
    onUpdateCar({
      ...car,
      jobs: updatedJobs
    });

    if (task) {
      onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Removed task '${task.title}' from order sheet.`, 'warning');
    }
  };

  // Toggle job status
  const handleToggleJobStatus = (taskId: string, currentStatus: ServiceJob['status']) => {
    let nextStatus: ServiceJob['status'] = 'pending';
    
    if (currentStatus === 'pending') nextStatus = 'in-progress';
    else if (currentStatus === 'in-progress') nextStatus = 'completed';
    else if (currentStatus === 'completed') nextStatus = 'hold';
    else if (currentStatus === 'hold') nextStatus = 'pending';

    const updatedJobs = car.jobs.map(j => {
      if (j.id === taskId) {
        // Carry over partial elapsed is in-progress -> completed
        const elapsed = nextStatus === 'completed' ? j.durationMins : j.elapsedMins;
        return { ...j, status: nextStatus, elapsedMins: elapsed };
      }
      return j;
    });

    // Check if any job is in progress
    const activeJobs = updatedJobs.filter(j => j.status === 'in-progress');
    const isBlocked = car.overallStatus === 'blocked';

    onUpdateCar({
      ...car,
      jobs: updatedJobs,
      overallStatus: isBlocked ? 'blocked' : activeJobs.length > 0 ? 'healthy' : car.overallStatus
    });

    const task = car.jobs.find(j => j.id === taskId);
    if (task) {
      onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Transited task '${task.title}' state to ${nextStatus.toUpperCase()}.`, 'info');
    }
  };

  const handleUpdateExpectedTime = (taskId: string, mins: number) => {
    const updatedJobs = car.jobs.map(j => {
      if (j.id === taskId) {
        return { ...j, durationMins: Math.max(1, mins) };
      }
      return j;
    });
    onUpdateCar({ ...car, jobs: updatedJobs });
  };

  // Turn on block parameters
  const applyBlockActions = () => {
    if (blockType === 'approval') {
      const updatedCar: Car = {
        ...car,
        overallStatus: 'healthy',
        blockedAt: currentTime,
        approvalPending: true,
        approvalRequestedAt: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        approvalRequiredWork: extraWorkDesc,
        approvalRequiredCost: extraWorkCost,
        approvalContactLogged: false,
        // Halt current active job
        jobs: car.jobs.map(j => j.status === 'in-progress' ? { ...j, status: 'hold' } : j)
      };
      onUpdateCar(updatedCar);
      onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Pending authorization from customer Eleanor Vance (₹${extraWorkCost}). Job halted.`, 'approval');
    } else if (blockType === 'parts') {
      const isTwoHoursOrMore = isPartsEtaTooLong(partsEta);
      
      const updatedCar: Car = {
        ...car,
        overallStatus: isTwoHoursOrMore ? 'blocked' : 'healthy',
        blockedAt: currentTime,
        partsOnOrder: true,
        partsOrderDescription: partsDesc,
        partsExpectedTime: partsEta,
        // Halt current active job
        jobs: car.jobs.map(j => j.status === 'in-progress' ? { ...j, status: 'hold' } : j)
      };
      onUpdateCar(updatedCar);
      onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Waiting for parts (${partsDesc}). ETA: ${partsEta}. Job halted.`, 'warning');
    } else if (blockType === 'manual') {
      const updatedCar: Car = {
        ...car,
        overallStatus: 'blocked',
        blockedAt: currentTime,
        holdingReason: 'manual',
        manualBlockReason: manualBlockReason,
        // Halt current active job
        jobs: car.jobs.map(j => j.status === 'in-progress' ? { ...j, status: 'hold' } : j)
      };
      onUpdateCar(updatedCar);
      onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Manually blocked by mechanic: ${manualBlockReason}`, 'warning');
    } else if (blockType === 'none') {
      // Unblock and return to healthy/previous
      onUpdateCar({
        ...car,
        overallStatus: 'healthy',
        approvalPending: false,
        partsOnOrder: false,
        jobs: car.jobs.map(j => j.status === 'hold' ? { ...j, status: 'pending' } : j)
      });
      onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Removed all workshop floor block parameters. Repairs resumed.`, 'success');
    }
  };

  // --- MOCKUP DATA BINDING HELPERS ---
  const getDisplayLocationLabel = () => {
    if (car.sharedResourceStatus === 'active') {
      return car.sharedResourceRequest === 'alignment' ? 'ALIGNMENT RIG' : 'WASH BAY';
    }
    if (car.sharedResourceStatus === 'queued') {
      return car.sharedResourceRequest === 'alignment' ? 'QUEUED FOR ALIGNMENT' : 'QUEUED FOR WASH';
    }
    const bObj = car.currentBayId 
      ? bays.find(b => b.id === car.currentBayId) 
      : (bays.find(b => b.currentCarId === car.id) || null);
    return bObj ? bObj.name.toUpperCase() : 'STAGING';
  };
  const bayLabel = getDisplayLocationLabel();

  const getDisplayLocationDetail = () => {
    if (car.sharedResourceStatus === 'active') {
      return car.sharedResourceRequest === 'alignment' ? 'Alignment Rig (Active Work)' : 'Wash Bay (Active Work)';
    }
    if (car.sharedResourceStatus === 'queued') {
      return car.sharedResourceRequest === 'alignment' ? 'Queued for Alignment Rig' : 'Queued for Wash Bay';
    }
    const bObj = car.currentBayId 
      ? bays.find(b => b.id === car.currentBayId) 
      : (bays.find(b => b.currentCarId === car.id) || null);
    return bObj ? bObj.name : 'Staging Lane (Parked Outside)';
  };

  const assignedMechanic = car.jobs.find(j => j.status === 'in-progress')?.technicianName || 
                            car.jobs[0]?.technicianName || 
                            'R. Kumar';

  const getBlockData = () => {
    let label = 'ACTIVE FOR';
    let text = '0h 00m';
    let sinceText = 'since 08:00';
    let totalMins = 0;

    if (car.overallStatus === 'blocked') {
      label = 'BLOCKED FOR';
    } else if (car.overallStatus === 'completed') {
      label = 'COMPLETED IN';
    } else if (car.overallStatus === 'critical' || car.overallStatus === 'at-risk') {
      label = 'RISK TIME';
    } else {
      label = 'ELAPSED';
    }

    const startTime = car.blockedAt || car.approvalRequestedAt || '11:46';
    sinceText = `since ${startTime}`;

    try {
      const [sHour, sMin] = startTime.split(':').map(Number);
      const [cHour, cMin] = currentTime.split(':').map(Number);
      if (!isNaN(sHour) && !isNaN(cHour)) {
        let diffMins = (cHour * 60 + cMin) - (sHour * 60 + sMin);
        if (diffMins < 0) diffMins += 24 * 60; // adjust for next day wrapper cycles
        totalMins = diffMins;
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        text = `${h}h ${m.toString().padStart(2, '0')}m`;
      }
    } catch (e) {
      text = '2h 14m';
    }

    const isBlocked = car.overallStatus === 'blocked';
    const isBlockedOver2Hours = isBlocked && (
      totalMins >= 120 ||
      isPartsEtaTooLong(car.partsExpectedTime)
    );

    return { label, text, sinceText, isBlockedOver2Hours };
  };

  const blockInfo = getBlockData();

  const getPromiseText = () => {
    try {
      const [pHour, pMin] = car.promisedTime.split(':').map(Number);
      const [cHour, cMin] = currentTime.split(':').map(Number);
      if (!isNaN(pHour) && !isNaN(cHour)) {
        const diff = (pHour * 60 + pMin) - (cHour * 60 + cMin);
        if (diff < 0) {
          const h = Math.floor(Math.abs(diff) / 60);
          const m = Math.abs(diff) % 60;
          return `Breached by ${h}h ${m}m ago`;
        } else {
          const h = Math.floor(diff / 60);
          const m = diff % 60;
          return `Promised to customer · ${h}h ${m}m remaining`;
        }
      }
    } catch (e) {}
    return 'Promised to customer · 3h 32m remaining';
  };

  const promiseText = getPromiseText();

  const getJobProgressVal = () => {
    const total = car.jobs.length;
    if (total === 0) return 0;
    let count = 0;
    car.jobs.forEach(j => {
      if (j.status === 'completed') count += 100;
      else if (j.status === 'in-progress') count += Math.round((j.elapsedMins / j.durationMins) * 100) || 50;
      else if (j.status === 'hold') count += Math.round((j.elapsedMins / j.durationMins) * 100) || 20;
    });
    return Math.min(100, Math.round(count / total));
  };

  const progressPercent = getJobProgressVal();

  // Determine if specific elements should be styled with a gray background as in the mockup
  const isCard1Shaded = car.overallStatus === 'blocked';
  const isCard4Shaded = car.partsOnOrder;
  const isCard6Shaded = car.overallStatus === 'blocked' || car.overallStatus === 'critical';

  const getTimelineItems = () => {
    // Convert vehicle logs to timeline items format
    const logItems = vehicleLogs.map(log => {
      // Robust stripping of prefix like "Toyota Camry (ABC-123): "
      let displayMessage = log.message;
      const colonIndex = log.message.indexOf(': ');
      if (colonIndex !== -1 && colonIndex < 60) { // Safety check on prefix length
        displayMessage = log.message.substring(colonIndex + 2);
      }
      
      return {
        time: log.timestamp,
        text: displayMessage,
        type: log.type
      };
    }).reverse(); // Most recent first is usually better for "Track Timeline" in a status card

    // If no logs, fall back to basic info
    if (logItems.length === 0) {
      return [{
        time: currentTime,
        text: 'Vehicle entered system and is awaiting processing',
        elapsed: 'just now',
        type: 'info' as const
      }];
    }

    return logItems;
  };

  const timelineItems = getTimelineItems();

  const getTimelineDisplay = () => {
    return (
      <div className="space-y-space-3.5">
        {timelineItems.map((item, idx) => {
          let timeColor = "text-neutral-500";
          if (item.type === 'error' || item.type === 'warning') {
            timeColor = "text-red-650 font-bold";
          } else if (item.type === 'approval') {
            timeColor = "text-amber-700 font-bold";
          } else if (item.type === 'success') {
            timeColor = "text-teal-600 font-bold";
          }

          return (
            <div key={idx} className="flex justify-between items-start text-[13px] leading-[18px] font-mono border-b border-dashed border-neutral-150 pb-space-2.5 last:border-0 last:pb-0">
              <div className="text-neutral-800 flex items-start gap-space-2.5">
                <span className={`${timeColor} shrink-0`}>{item.time}</span>
                <span className="text-neutral-400 font-medium shrink-0">·</span>
                <span className="text-neutral-800 font-medium text-[12px]">{item.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const category = car ? getCarRiskStatus(car, currentTime) : 'none';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-space-4 z-50 overflow-y-auto w-full h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[var(--radius-l)] border border-neutral-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden custom-shadow-lg"
        >
          {/* Custom Switch Tab Header */}
          <div className="flex border-b border-neutral-200 bg-neutral-150/50 p-space-4 justify-between items-center select-none">
            <div className="flex gap-space-2">
              <button
                onClick={() => setActiveModalTab('status_card')}
                className={`h-[44px] px-space-4 text-[12px] leading-[16px] font-mono font-bold tracking-wider transition-all duration-200 rounded-[var(--radius-m)] cursor-pointer ${
                  activeModalTab === 'status_card'
                    ? 'bg-neutral-950 text-white custom-shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 border border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                📋 DIGITAL JOB STATUS CARD
              </button>
              <button
                onClick={() => setActiveModalTab('actions')}
                className={`h-[44px] px-space-4 text-[12px] leading-[16px] font-mono font-bold tracking-wider transition-all duration-200 rounded-[var(--radius-m)] cursor-pointer ${
                  activeModalTab === 'actions'
                    ? 'bg-neutral-950 text-white custom-shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 border border-neutral-200 bg-white hover:bg-neutral-50'
                }`}
              >
                🔧 CONTROL CABINET ACTIONS
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="p-space-2 hover:bg-neutral-200 rounded-full text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-space-6 md:p-space-8 bg-white">
            {activeModalTab === 'status_card' ? (
              // --- PRECISION VISUAL STATUS CARD LAYOUT ---
              <div className="space-y-space-6 pb-space-2">
                
                {/* Visual Card Header */}
                <div className={`p-space-5 sm:p-space-6 rounded-[var(--radius-l)] border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-4 transition-all duration-300 ${
                  blockInfo.isBlockedOver2Hours ? 'bg-red-50 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.18)] ring-2 ring-red-500/10' :
                  car.overallStatus === 'blocked' ? 'bg-[#FEF2F2] border-red-200 shadow-xs' :
                  car.overallStatus === 'critical' ? 'bg-[#FEF2F2] border-red-200' :
                  category === 'at-risk' ? 'bg-[#FFF7ED] border-orange-200 shadow-xs' :
                  category === 'delayed' ? 'bg-red-50 border-red-200' :
                  car.overallStatus === 'completed' ? 'bg-[#F0FDF4] border-green-200' :
                  'bg-[#F0FDFA] border-teal-200'
                }`}>
                  <div className="space-y-[6px]">
                    <div className="flex items-center gap-space-2.5 flex-wrap">
                      {car.overallStatus === 'blocked' && (
                        <span className={`inline-flex items-center px-space-2.5 py-[3px] rounded-full text-[10px] leading-[14px] font-mono font-bold uppercase tracking-wider ${
                          blockInfo.isBlockedOver2Hours
                            ? 'bg-red-700 text-white border border-red-800 animate-bounce'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {blockInfo.isBlockedOver2Hours ? '🚨 CRITICAL DELAY > 2HRS' : 'BLOCKED'}
                        </span>
                      )}
                      {car.overallStatus === 'critical' && (
                        <span className="inline-flex items-center px-space-2.5 py-[3px] rounded-full text-[10px] leading-[14px] font-mono font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                          CRITICAL
                        </span>
                      )}
                      {category === 'at-risk' && (
                        <span className="inline-flex items-center px-space-2.5 py-[3px] rounded-full text-[10px] leading-[14px] font-mono font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200 animate-pulse">
                          AT RISK
                        </span>
                      )}
                      {category === 'delayed' && (
                        <span className="inline-flex items-center px-space-2.5 py-[3px] rounded-full text-[10px] leading-[14px] font-mono font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
                          DELAYED
                        </span>
                      )}
                      {car.overallStatus === 'completed' && (
                        <span className="inline-flex items-center px-space-2.5 py-[3px] rounded-full text-[10px] leading-[14px] font-mono font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
                          COMPLETED
                        </span>
                      )}
                      {category !== 'blocked' && car.overallStatus !== 'critical' && category !== 'at-risk' && category !== 'delayed' && car.overallStatus !== 'completed' && (
                        <span className="inline-flex items-center px-space-2.5 py-[3px] rounded-full text-[10px] leading-[14px] font-mono font-bold uppercase tracking-wider bg-teal-100 text-teal-700 border border-teal-200">
                          ON TIME
                        </span>
                      )}
                      <span className="text-[20px] font-bold text-neutral-900 font-sans tracking-tight">{bayLabel}</span>
                    </div>
                    
                    <h2 className="text-[24px] leading-[32px] font-sans font-bold tracking-tight text-neutral-950 flex flex-wrap items-center gap-space-2">
                      <span className="text-neutral-900">{car.plateNumber}</span>
                      <span className="text-neutral-400 font-normal">·</span>
                      <span className="text-neutral-800 font-semibold">{car.make} {car.model}</span>
                    </h2>
                    
                    <div className="text-[12px] leading-[16px] font-mono text-neutral-500 font-semibold uppercase tracking-wider">
                      Job Card #J-{(car.id.replace('car-', '')) || '2041'} <span className="text-neutral-300 mx-space-1.5">·</span> Mechanic: {assignedMechanic}
                    </div>
                  </div>
                  
                  {/* Blocked For Frame Info Box */}
                  <div className={`rounded-[12px] p-space-4 min-w-[150px] sm:min-w-[170px] text-center shadow-xs flex flex-col justify-center border transition-all duration-300 ${
                    blockInfo.isBlockedOver2Hours
                      ? 'bg-red-100 border-red-500 text-red-900 shadow-[0_0_12px_rgba(239,68,68,0.22)] ring-1 ring-red-500/20'
                      : 'bg-white border-neutral-200/90'
                  }`}>
                    <div className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                      blockInfo.isBlockedOver2Hours ? 'text-red-700 animate-pulse' : 'text-neutral-400'
                    }`}>
                      {blockInfo.isBlockedOver2Hours ? '🚨 SLA BREACH' : blockInfo.label}
                    </div>
                    <div className={`text-[32px] leading-[38px] font-mono font-bold tracking-tight my-[4px] ${
                      blockInfo.isBlockedOver2Hours ? 'text-red-700 font-extrabold animate-pulse' :
                      car.overallStatus === 'blocked' || car.overallStatus === 'critical' ? 'text-red-600' : 'text-neutral-900'
                    }`}>
                      {blockInfo.text}
                    </div>
                    <div className={`text-[10px] font-mono font-bold uppercase ${
                      blockInfo.isBlockedOver2Hours ? 'text-red-650' : 'text-neutral-500'
                    }`}>
                      {blockInfo.sinceText}
                    </div>
                  </div>
                </div>

                {/* 3x2 Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
                  
                  {/* Card 1: Current Blocker */}
                  <div className={`border p-space-4 transition-all duration-300 rounded-[12px] shadow-xs flex flex-col min-h-[140px] ${
                    blockInfo.isBlockedOver2Hours
                      ? 'bg-red-100/60 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.1)]'
                      : car.overallStatus === 'blocked' || car.overallStatus === 'critical'
                      ? 'bg-red-50/50 border-red-150'
                      : 'bg-white border-neutral-200'
                  }`}>
                    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 uppercase">
                      ① CURRENT BLOCKER
                    </div>
                    <div className={`text-[18px] font-bold mt-space-2 font-sans flex-grow ${
                      blockInfo.isBlockedOver2Hours ? 'text-red-800 font-black' :
                      car.overallStatus === 'blocked' || car.overallStatus === 'critical' ? 'text-red-700' : 'text-neutral-900'
                    }`}>
                      {car.overallStatus === 'blocked' ? (car.partsOnOrder ? 'Waiting Part' : car.approvalPending ? 'Waiting Approval' : 'Manual Hold') : 'None (Healthy)'}
                      {blockInfo.isBlockedOver2Hours && (
                        <div className="text-[12px] font-bold text-red-600 mt-1">
                          Breached by <span className="font-bold">4h 49m</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-600 mt-space-1 leading-relaxed">
                      {car.partsOnOrder ? car.partsOrderDescription : car.approvalPending ? car.approvalRequiredWork : car.manualBlockReason || 'No delays or blocker constraints flagged'}
                    </div>
                  </div>

                  {/* Card 2: Dispatch Commitment */}
                  <div className="border border-amber-200 bg-amber-50/40 p-space-4 rounded-[12px] shadow-xs flex flex-col min-h-[140px]">
                    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 uppercase">
                      ② DISPATCH COMMITMENT
                    </div>
                    <div className="text-[18px] font-semibold text-[#B45309] mt-space-2 font-sans flex-grow">
                      Today · {car.promisedTime}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-600 mt-space-1 leading-relaxed">
                      {promiseText}
                    </div>
                  </div>

                  {/* Card 3: Job Progress */}
                  <div className="border border-neutral-200 bg-white p-space-4 rounded-[12px] shadow-xs flex flex-col min-h-[140px]">
                    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 uppercase">
                      ③ JOB PROGRESS
                    </div>
                    <div className="text-[18px] font-bold text-neutral-900 mt-space-2 font-sans flex-grow">
                      {progressPercent}% complete
                    </div>
                    <div className="text-[11px] font-mono text-neutral-600 mt-space-1 leading-relaxed">
                      {car.overallStatus === 'blocked' ? 'Stopped mid-assembly' : car.overallStatus === 'completed' ? 'Assembly complete & certified' : 'Active floor diagnostics'}
                    </div>
                  </div>
                
                  {/* Card 4: Part ETA */}
                  <div className={`border p-space-4 transition-all duration-300 rounded-[12px] shadow-xs flex flex-col min-h-[140px] ${
                    car.partsOnOrder ? 'bg-red-50/50 border-red-150' : 'bg-white border-neutral-200'
                  }`}>
                    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 uppercase">
                      ④ PART ETA
                    </div>
                    <div className={`text-[18px] font-bold mt-space-2 font-sans flex-grow ${
                      car.partsOnOrder ? 'text-red-700' : 'text-neutral-900'
                    }`}>
                      {car.partsOnOrder ? (car.partsExpectedTime || 'Tomorrow · 10:00') : 'In Stock · Immediate'}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-600 mt-space-1 leading-relaxed">
                      {car.partsOnOrder ? 'Vendor: AutoParts Co · PO-8821' : 'All service parts verified in bay workshop inventory'}
                    </div>
                  </div>

                  {/* Card 5: Approval Status */}
                  <div className={`border p-space-4 transition-all duration-300 rounded-[12px] shadow-xs flex flex-col min-h-[140px] ${
                    car.approvalPending ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-neutral-200'
                  }`}>
                    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 uppercase">
                      ⑤ APPROVAL STATUS
                    </div>
                    <div className={`text-[18px] font-bold mt-space-2 font-sans flex-grow ${
                      car.approvalPending ? 'text-[#B45309]' : 'text-neutral-900'
                    }`}>
                      {car.approvalPending ? 'Pending' : 'Approved'}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-600 mt-space-1 leading-relaxed">
                      {car.approvalPending ? 'Awaiting customer estimate approval' : 'All repairs authorized by customer'}
                    </div>
                  </div>

                  {/* Card 6: Impact Risk */}
                  <div className={`border p-space-4 transition-all duration-300 rounded-[12px] shadow-xs flex flex-col min-h-[140px] ${
                    blockInfo.isBlockedOver2Hours
                      ? 'bg-red-100 border-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      : car.overallStatus === 'blocked' || car.overallStatus === 'critical' ? 'bg-red-50/50 border-red-150' :
                      car.overallStatus === 'at-risk' ? 'bg-orange-50/45 border-orange-200' :
                      'bg-white border-neutral-200'
                  }`}>
                    <div className="text-[10px] font-mono font-bold tracking-wider text-neutral-500 uppercase">
                      ⑥ IMPACT RISK
                    </div>
                    <div className={`text-[18px] font-bold mt-space-2 font-sans flex-grow ${
                      blockInfo.isBlockedOver2Hours ? 'text-red-900 font-black' :
                      car.overallStatus === 'blocked' || car.overallStatus === 'critical' ? 'text-red-700' :
                      car.overallStatus === 'at-risk' ? 'text-orange-600' :
                      'text-green-700'
                    }`}>
                      {blockInfo.isBlockedOver2Hours ? 'CRITICAL (SLA BREACHED)' :
                       car.overallStatus === 'blocked' || car.overallStatus === 'critical' ? 'HIGH' :
                       car.overallStatus === 'at-risk' ? 'MEDIUM' : 'LOW'}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-600 mt-space-1 leading-relaxed">
                      {blockInfo.isBlockedOver2Hours ? 'Blocked > 2 hours. Workshop flow severely logjammed.' :
                       car.overallStatus === 'blocked' || car.overallStatus === 'critical' ? 'Dispatch at risk · queue cascading' : 'Standard monitoring bounds secured'}
                    </div>
                  </div>

                </div>

                {/* Job Progress Breakdown */}
                <div className="border-t border-dashed border-neutral-200 my-space-5" />
                
                <div>
                  <h4 className="text-[11px] leading-[16px] font-mono font-bold text-neutral-500 tracking-wider mb-space-4 uppercase">
                    Job Progress Breakdown
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-space-8 gap-y-space-4">
                    {car.jobs.map((job) => {
                      const jobPct = job.status === 'completed' ? 100 : job.status === 'pending' ? 0 : Math.min(100, Math.round((job.elapsedMins / job.durationMins) * 100) || 50);
                      return (
                        <div key={job.id} className="space-y-space-2">
                          <div className="flex justify-between items-center text-[13px] leading-[16px]">
                            <span className="text-neutral-800 font-sans font-medium">{job.title}</span>
                            <span className="text-neutral-900 font-mono font-bold">{jobPct}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                job.status === 'completed' ? 'bg-[#22C55E]' :
                                job.status === 'in-progress' ? 'bg-[#14B8A6] animate-pulse' :
                                job.status === 'hold' ? 'bg-red-500' : 'bg-neutral-300'
                              }`}
                              style={{ width: `${jobPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Impact Timeline */}
                <div className="border-t border-dashed border-neutral-200 my-space-5" />
                
                <div>
                  <h4 className="text-[11px] leading-[16px] font-mono font-bold text-neutral-500 tracking-wider mb-space-4 uppercase">
                    Track Timeline: Movement & Job Progress
                  </h4>

                  {getTimelineDisplay()}
                </div>

              </div>
            ) : (
              // --- IN-DEPTH INTERACTIVE WORKSHOP CONSOLE ACTIONS ---
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-4 animate-fade-in-up">
                
                {/* Left hand job tasks / bay management */}
                <div className="lg:col-span-7 space-y-space-4">
                  
                  {/* Bay Placement Selection */}
                  <div className="space-y-space-3 bg-white p-space-4 border border-neutral-200 rounded-[12px] shadow-xs">
                    <h4 className="text-[11px] leading-[16px] font-mono font-semibold text-neutral-500 uppercase tracking-widest">Floor Location Allocation</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-3">
                      <div className="space-y-[2px]">
                        <p className="text-[14px] leading-[20px] font-bold text-neutral-900 font-sans">
                          Current: {getDisplayLocationDetail()}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          {car.overallStatus === 'completed' 
                            ? 'Location locked - vehicle finalized for customer release'
                            : 'Reassign onto a vacant workshop repair lift to resume process flow'}
                        </p>
                      </div>

                      {car.overallStatus === 'completed' ? (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wide flex items-center gap-1.5 shadow-sm">
                          <span>📦 Locked in Dispatch Area</span>
                        </div>
                      ) : (
                        <select
                          value={car.currentBayId || (car.sharedResourceStatus === 'none' && bays.find(b => b.currentCarId === car.id)?.id) || 'staging'}
                          onChange={(e) => handleBayReassign(e.target.value)}
                          className="h-[40px] px-space-2 bg-white border border-neutral-300 rounded-[10px] text-xs font-semibold outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer min-w-[180px]"
                        >
                          <option value="staging">Staging Lane (Outside)</option>
                          {bays.map(b => (
                            <option 
                              key={b.id} 
                              value={b.id} 
                              disabled={b.currentCarId !== null && b.currentCarId !== car.id}
                            >
                              {b.name} {b.currentCarId === car.id ? '(Active)' : b.currentCarId ? '(OCCUPIED)' : '(VACANT)'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Active Repair state manager */}
                  <div className="space-y-space-3">
                    <div className="flex items-center justify-between pb-space-2 border-b border-neutral-200">
                      <h4 className="text-[11px] leading-[16px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Repair Tasks Order Sheet</h4>
                      <span className="text-[10px] text-neutral-400 font-semibold font-mono uppercase tracking-wider">
                        {car.overallStatus === 'completed' ? '✓ ALL JOBS COMPLETE' : 'Status: Pnd ➜ Prog ➜ Hold ➜ Ok'}
                      </span>
                    </div>

                    <div className="space-y-space-2 max-h-[300px] overflow-y-auto pr-space-1">
                      {car.jobs.map((job) => (
                        <div 
                          key={job.id}
                          className="p-space-4 bg-white border border-neutral-200 rounded-[12px] flex flex-col md:flex-row items-start md:items-center justify-between gap-space-3 text-xs shadow-xs transition-all hover:border-neutral-300"
                        >
                          <div className="space-y-space-1 md:max-w-[60%]">
                            <div className="flex items-center flex-wrap gap-space-2">
                              <p className="font-bold text-neutral-900 text-[14px] font-sans">{job.title}</p>
                              <span className={`px-2 py-[2px] text-[10px] font-bold font-mono rounded-[var(--radius-s)] uppercase tracking-wider border ${
                                job.status === 'completed' ? 'bg-[#DCFCE7] text-[#15803D] border-[#bbf7d0]' :
                                job.status === 'in-progress' ? 'bg-[#CCFBF1] text-[#0F766E] border-[#99f6e4]' :
                                job.status === 'hold' ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#fecaca]' :
                                'bg-[#F1F5F9] text-[#475569] border-[#e2e8f0]'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-space-4 gap-y-[2px] text-[11px] text-neutral-500 font-mono font-bold">
                              <span>Est: {job.durationMins}m</span>
                              <span>Elapsed: {job.elapsedMins}m</span>
                              <span>Tech: {job.technicianName}</span>
                              <span className="text-neutral-800 font-semibold">Cost: ₹{job.cost}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-space-2 w-full md:w-auto justify-end">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-neutral-400 font-mono uppercase font-bold mb-[2px]">Mins Est</span>
                              <input
                                type="number"
                                title="Update expected repair minutes estimate"
                                defaultValue={job.durationMins}
                                onChange={(e) => handleUpdateExpectedTime(job.id, Number(e.target.value))}
                                disabled={car.overallStatus === 'completed'}
                                className={`w-14 h-[44px] text-xs border rounded-[12px] text-center font-mono font-semibold transition-all ${
                                  car.overallStatus === 'completed'
                                    ? 'bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed'
                                    : 'bg-white border-neutral-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
                                }`}
                              />
                            </div>
                            {car.overallStatus !== 'completed' && (
                              <>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-transparent font-mono mb-[2px] select-none">Action</span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleJobStatus(job.id, job.status)}
                                    className="h-[44px] px-space-3 text-[11px] bg-teal-50 hover:bg-[#CCFBF1] text-teal-800 border border-teal-200 rounded-[12px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    Cycle
                                  </button>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-transparent font-mono mb-[2px] select-none">Del</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTask(job.id)}
                                    className="h-[44px] w-[44px] flex items-center justify-center hover:text-red-650 hover:bg-red-50 text-neutral-400 rounded-[12px] transition-colors cursor-pointer border border-neutral-200 hover:border-red-200"
                                    title="Delete task order"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Inline Job Appender Form */}
                    {car.overallStatus !== 'completed' ? (
                      <div className="p-space-4 bg-[#F8FAFC] rounded-[12px] border border-neutral-200 grid grid-cols-1 md:grid-cols-5 gap-space-2.5 items-end">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5 font-mono">Add Job Task</label>
                          <input 
                            type="text" placeholder="e.g. Brake fluid bleed, tire rotation..."
                            value={newWorkTitle} onChange={e => setNewWorkTitle(e.target.value)}
                            className="w-full h-[44px] text-xs px-space-3 rounded-[12px] border border-neutral-300 bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5 font-mono">Mins Est</label>
                          <input 
                            type="number" placeholder="mins"
                            value={newWorkDuration || ''} onChange={e => setNewWorkDuration(Number(e.target.value))}
                            className="w-full h-[44px] text-xs px-space-3 rounded-[12px] border border-neutral-300 bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-mono font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide block mb-1.5 font-mono">Assign Tech</label>
                          <select
                            value={newWorkTech}
                            onChange={e => setNewWorkTech(e.target.value)}
                            className="w-full h-[44px] text-xs px-space-3 rounded-[12px] border border-neutral-300 bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-semibold cursor-pointer"
                          >
                            {STAFF_ROSTER.map(tech => (
                              <option key={tech.id} value={tech.name}>
                                {tech.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleAddNewTask}
                            className="w-full h-[44px] bg-neutral-950 hover:bg-neutral-900 border border-neutral-950 hover:border-neutral-900 text-white text-xs font-mono font-bold rounded-[12px] flex items-center justify-center gap-space-1.5 transition-all shadow-xs cursor-pointer tracking-wider"
                          >
                            <Plus className="w-4 h-4" /> APPEND TASK
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-space-4 bg-green-50/50 rounded-[12px] border border-green-150 text-center shadow-xs">
                        <p className="text-xs font-bold text-green-700 font-mono uppercase tracking-wide flex items-center justify-center gap-2">
                          <span>✓ Repair sequence locked. All scheduled procedures successfully completed.</span>
                        </p>
                      </div>
                    )}

                  </div>

                </div>

                {/* Right hand constraints blockers and shared resource dispatch */}
                <div className="lg:col-span-5 space-y-space-6">
                  
                  {car.overallStatus === 'completed' ? (
                    <div className="p-space-5 rounded-[12px] border border-green-200 bg-green-50/30 space-y-space-4 shadow-xs flex flex-col justify-between min-h-[300px]">
                      <div className="space-y-space-3">
                        <div className="flex items-center gap-space-2">
                          <CheckCircle className="w-4.5 h-4.5 text-green-600" />
                          <h4 className="text-[11px] leading-[16px] font-mono font-bold text-neutral-800 uppercase tracking-widest">
                            SERVICE COMPLETED & LOCKBOX ARMED
                          </h4>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold">
                          All diagnostic scans, general repair tasks, laser wheel alignment calibrations, and detailing washing cycles have been completed. The vehicle has been staged in the Dispatch Area.
                        </p>
                      </div>

                      <div className="border-t border-green-100 pt-space-4 space-y-space-3 text-xs font-semibold font-mono text-neutral-700">
                        <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-neutral-200/50 shadow-xxs">
                          <span className="text-neutral-400 font-bold uppercase text-[10px]">TOTAL JOBS PERFORMED:</span>
                          <span className="text-neutral-900 font-bold font-sans">{car.jobs.length}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-neutral-200/50 shadow-xxs">
                          <span className="text-neutral-400 font-bold uppercase text-[10px]">TOTAL PROCESS TIME:</span>
                          <span className="text-neutral-900 font-bold font-sans">{car.jobs.reduce((sum, j) => sum + (j.durationMins || 0), 0)} mins</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-100/50 p-2.5 rounded-lg border border-green-200/60 shadow-xxs text-green-800">
                          <span className="text-green-700 font-bold uppercase text-[10px]">ACCUMULATED BILLING:</span>
                          <span className="text-green-950 font-extrabold font-sans">₹{car.jobs.reduce((sum, j) => sum + (j.cost || 0), 0)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* HOLD RULES CONFIGURATOR */}
                      <div className="p-space-5 rounded-[12px] border border-red-200 bg-[#FEF2F2]/40 space-y-space-4 shadow-xs">
                        <div className="flex items-center gap-space-2">
                          <Lock className="w-4 h-4 text-red-650" />
                          <h4 className="text-[11px] leading-[16px] font-mono font-bold text-neutral-800 uppercase tracking-widest">
                            Configure Block Hold Regulations
                          </h4>
                        </div>

                        <div className="space-y-space-4">
                          <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold font-sans">
                            Select a delay parameter to manually halt operations. A warning state flags instantly.
                          </p>

                          <div className="grid grid-cols-2 gap-space-2">
                            <label className={`flex items-center gap-space-2 px-space-3 py-2.5 rounded-[12px] border text-[10px] font-mono font-bold cursor-pointer select-none transition-all ${
                              blockType === 'none' 
                                ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-xs' 
                                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-55 font-medium'
                            }`}>
                              <input 
                                type="radio" name="block-type" checked={blockType === 'none'}
                                onChange={() => setBlockType('none')}
                                className="text-teal-650 focus:ring-teal-500 w-3.5 h-3.5"
                              /> CLEAN OK
                            </label>
                            <label className={`flex items-center gap-space-2 px-space-3 py-2.5 rounded-[12px] border text-[10px] font-mono font-bold cursor-pointer select-none transition-all ${
                              blockType === 'approval' 
                                ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs' 
                                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-55 font-medium'
                            }`}>
                              <input 
                                type="radio" name="block-type" checked={blockType === 'approval'}
                                onChange={() => setBlockType('approval')}
                                className="text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                              /> SIGN SIGN-OFF
                            </label>
                            <label className={`flex items-center gap-space-2 px-space-2 py-2.5 rounded-[12px] border text-[10px] font-mono font-bold cursor-pointer select-none transition-all ${
                              blockType === 'parts' 
                                ? 'bg-red-50 border-red-300 text-red-800 shadow-xs' 
                                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-55 font-medium'
                            }`}>
                              <input 
                                type="radio" name="block-type" checked={blockType === 'parts'}
                                onChange={() => setBlockType('parts')}
                                className="text-red-650 focus:ring-red-500 w-3.5 h-3.5"
                              /> NO PARTS
                            </label>
                            <label className={`flex items-center gap-space-2 px-space-2 py-2.5 rounded-[12px] border text-[10px] font-mono font-bold cursor-pointer select-none transition-all ${
                              blockType === 'manual' 
                                ? 'bg-red-50 border-red-300 text-red-800 shadow-xs' 
                                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-55 font-medium'
                            }`}>
                              <input 
                                type="radio" name="block-type" checked={blockType === 'manual'}
                                onChange={() => setBlockType('manual')}
                                className="text-red-650 focus:ring-red-500 w-3.5 h-3.5"
                              /> LIFT BLOCK
                            </label>
                          </div>

                          {blockType === 'approval' && (
                            <div className="p-space-4 bg-white rounded-[12px] border border-amber-200 space-y-space-3 text-xs animate-fade-in-down shadow-xs">
                              <div>
                                <label className="text-[10px] font-mono font-bold text-neutral-500 block mb-1 uppercase">UNSCHEDULED ESTIMATES</label>
                                <input 
                                  type="text" value={extraWorkDesc} onChange={e => setExtraWorkDesc(e.target.value)}
                                  className="w-full h-[44px] text-xs px-3 border border-neutral-300 rounded-[12px] bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-semibold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-mono font-bold text-neutral-500 block mb-1 uppercase">ESTIMATED COMPONENT COST (₹)</label>
                                <input 
                                  type="number" value={extraWorkCost} onChange={e => setExtraWorkCost(Number(e.target.value))}
                                  className="w-full h-[44px] text-xs px-3 border border-neutral-300 rounded-[12px] bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono font-bold"
                                />
                              </div>
                            </div>
                          )}

                          {blockType === 'parts' && (
                            <div className="p-space-4 bg-white rounded-[12px] border border-red-200 space-y-space-3 text-xs animate-fade-in-down shadow-xs">
                              <div>
                                <label className="text-[10px] font-mono font-bold text-neutral-500 block mb-1 uppercase">PARTS REQUIRED SPECIFICATION</label>
                                <input 
                                  type="text" value={partsDesc} onChange={e => setPartsDesc(e.target.value)}
                                  className="w-full h-[44px] text-xs px-3 border border-neutral-300 rounded-[12px] bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-semibold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-mono font-bold text-neutral-500 block mb-1 uppercase">COURIER ARRIVAL ETA</label>
                                <input 
                                  type="text" value={partsEta} onChange={e => setPartsEta(e.target.value)}
                                  className="w-full h-[44px] text-xs px-3 border border-neutral-300 rounded-[12px] bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono font-bold"
                                />
                              </div>
                            </div>
                          )}

                          {blockType === 'manual' && (
                            <div className="p-space-4 bg-white rounded-[12px] border border-neutral-200 space-y-space-3 text-xs animate-fade-in-down shadow-xs">
                              <div>
                                <label className="text-[10px] font-mono font-bold text-neutral-500 block mb-1 uppercase">RECORD BLOCK REASON</label>
                                <input 
                                  type="text" value={manualBlockReason} onChange={e => setManualBlockReason(e.target.value)}
                                  className="w-full h-[44px] text-xs px-3 border border-neutral-300 rounded-[12px] bg-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-semibold"
                                  placeholder="e.g. Lift hydraulic line leakage"
                                />
                              </div>
                            </div>
                          )}

                          {car.overallStatus === 'blocked' || car.partsOnOrder || car.approvalPending ? (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateCar({
                                  ...car,
                                  overallStatus: 'healthy',
                                  approvalPending: false,
                                  partsOnOrder: false,
                                  holdingReason: undefined,
                                  jobs: car.jobs.map(j => j.status === 'hold' ? { ...j, status: 'pending' } : j)
                                });
                                onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Blockage explicitly CLEARED by personnel. Resuming workflow.`, 'success');
                              }}
                              className="w-full h-[44px] text-xs font-mono font-bold rounded-[12px] bg-green-600 hover:bg-green-700 hover:scale-[1.01] border border-green-700 text-white text-center transition-all shadow-sm cursor-pointer tracking-wider"
                            >
                              ✅ CLEAR BLOCKAGE & RESUME
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={applyBlockActions}
                              className="w-full h-[44px] text-xs font-mono font-bold rounded-[12px] bg-[#B91C1C] hover:bg-red-700 hover:scale-[1.01] border border-red-700 text-white text-center transition-all shadow-sm cursor-pointer tracking-wider"
                            >
                              ⚡ COMPOSE HOLD REGULATIONS
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Shared Precision Station requests */}
                      <div className="p-space-5 rounded-[12px] border border-neutral-200 bg-white space-y-space-3 shadow-xs">
                        <div className="flex items-center gap-space-2">
                          <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                          <h4 className="text-[11px] leading-[16px] font-mono font-bold text-neutral-800 uppercase tracking-widest">
                            Promote to Shared Stations
                          </h4>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-relaxed font-semibold">
                          Dispatch vehicle to alignment calibrations loops or detailing stations.
                        </p>

                        <div className="grid grid-cols-2 gap-space-2.5 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateCar({
                                ...car,
                                sharedResourceRequest: 'alignment',
                                sharedResourceStatus: 'queued'
                              });
                              onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Added directly to Precision Alignment Rig Queue.`, 'info');
                            }}
                            className={`h-[44px] border rounded-[12px] font-bold font-mono text-[10.5px] leading-[12px] uppercase tracking-wider transition-all shadow-xs text-center cursor-pointer ${
                              car.sharedResourceRequest === 'alignment'
                                ? 'bg-[#E0F2FE] border-[#bae6fd] text-[#0369a1] font-extrabold cursor-default'
                                : 'border-neutral-300 bg-white text-neutral-800 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300'
                            }`}
                          >
                            {car.sharedResourceRequest === 'alignment' ? 'Alignment Queued' : 'Alignment Queue'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateCar({
                                ...car,
                                sharedResourceRequest: 'wash',
                                sharedResourceStatus: 'queued'
                              });
                              onAddLog(`${car.make} ${car.model} (${car.plateNumber}): Added directly to Wash & Detailing Bay Queue.`, 'info');
                            }}
                            className={`h-[44px] border rounded-[12px] font-bold font-mono text-[10.5px] leading-[12px] uppercase tracking-wider transition-all shadow-xs text-center cursor-pointer ${
                              car.sharedResourceRequest === 'wash'
                                ? 'bg-[#E0F2FE] border-[#bae6fd] text-[#0369a1] font-extrabold cursor-default'
                                : 'border-neutral-300 bg-white text-neutral-800 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300'
                            }`}
                          >
                            {car.sharedResourceRequest === 'wash' ? 'Wash Queued' : 'Detailing Wash'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                </div>

              </div>
            )}
          </div>
          
          <div className="p-space-4 border-t border-neutral-200 flex items-center justify-end bg-neutral-105/90 gap-space-2 select-none">
            {car?.overallStatus === 'completed' && onDispatchCar && (
              <button
                onClick={() => onDispatchCar(car.id)}
                className="h-[44px] px-space-6 bg-teal-600 hover:bg-teal-700 text-white rounded-m text-xs font-mono font-bold shadow-sm transition-all cursor-pointer tracking-wider flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                COMPLETE DISPATCH
              </button>
            )}
            <button
              onClick={onClose}
              className="h-[44px] px-space-6 bg-neutral-950 hover:bg-neutral-900 text-white rounded-m text-xs font-mono font-bold shadow-sm transition-all cursor-pointer tracking-wider"
            >
              🚀 ESC CLOSE MODAL
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
