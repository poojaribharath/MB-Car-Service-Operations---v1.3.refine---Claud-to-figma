import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  HelpCircle, 
  ArrowRight,
  User,
  ExternalLink,
  ClipboardList,
  Palette,
  Wrench,
  Compass,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, ServiceBay, SharedResource } from '../types';
import { getCarRiskStatus } from '../lib/utils';

interface ManagerDashboardProps {
  cars: Car[];
  bays: ServiceBay[];
  sharedResources: SharedResource[];
  currentTime: string;
  onSelectCar: (carId: string) => void;
  onCustomerApprove: (carId: string) => void;
  onCustomerDecline: (carId: string) => void;
  onReceiveShortParts: (carId: string) => void;
  onAdvanceQueue: (resourceId: string) => void;
  onRemoveFromQueue: (resourceId: string, carId: string) => void;
  onAssignCarToBay: (bayId: string, carId: string) => void;
  onDispatchCar?: (carId: string) => void;
  onNavigateToDesignSystem?: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  cars,
  bays,
  sharedResources,
  currentTime,
  onSelectCar,
  onCustomerApprove,
  onCustomerDecline,
  onReceiveShortParts,
  onAdvanceQueue,
  onRemoveFromQueue,
  onAssignCarToBay,
  onDispatchCar,
  onNavigateToDesignSystem,
}) => {
  // Calculations for KPI Cards
  const activeVehiclesCount = useMemo(() => {
    return cars.filter(c => c.currentBayId !== null || c.sharedResourceStatus === 'active').length;
  }, [cars]);

  const atRiskCount = useMemo(() => {
    return cars.filter(c => {
      const category = getCarRiskStatus(c, currentTime);
      return category === 'at-risk' || category === 'delayed';
    }).length;
  }, [cars, currentTime]);

  const blockedBaysCount = useMemo(() => {
    return bays.filter(b => {
      if (!b.currentCarId) return false;
      const car = cars.find(c => c.id === b.currentCarId);
      return car?.overallStatus === 'blocked';
    }).length;
  }, [bays, cars]);

  const waitingApprovalsCount = useMemo(() => {
    return cars.filter(c => c.approvalPending).length;
  }, [cars]);

  const waitingPartsCount = useMemo(() => {
    return cars.filter(c => c.partsOnOrder).length;
  }, [cars]);

  // Alert builder
  const criticalAlerts = useMemo(() => {
    const alerts: Array<{ id: string; type: 'critical' | 'alert' | 'info'; badge?: string; title: string; desc: string; actionText?: string; onAction?: () => void }> = [];

    cars.forEach(car => {
      if (car.approvalPending) {
        alerts.push({
          id: `alert-approval-${car.id}`,
          type: 'critical',
          badge: 'APPROVAL REQUIRED',
          title: `Approval Needed: ${car.plateNumber}`,
          desc: `Customer approval requested at ${car.approvalRequestedAt || 'N/A'} for ₹${car.approvalRequiredCost || 0} (${car.approvalRequiredWork || 'unnamed repair'}).`,
          actionText: 'Authorize Work',
          onAction: () => onCustomerApprove(car.id)
        });
      }
      if (car.partsOnOrder) {
        alerts.push({
          id: `alert-parts-${car.id}`,
          type: 'critical',
          badge: 'CRITICAL',
          title: `Approval Needed (Parts): ${car.plateNumber}`,
          desc: `Awaiting: ${car.partsOrderDescription || 'required parts'}. Expected time left: ${car.partsExpectedTime || 'pending'}.`,
          actionText: 'Authorize Work',
          onAction: () => onCustomerApprove(car.id)
        });
      }
      const category = getCarRiskStatus(car, currentTime);
      if (category === 'delayed') {
        alerts.push({
          id: `alert-risk-${car.id}`,
          type: 'alert',
          badge: 'BREACHED',
          title: `Promised Time Breached: ${car.plateNumber}`,
          desc: `Promise threshold was ${car.promisedTime}. Current simulated offset is already past this mark.`,
          actionText: 'View Work Details',
          onAction: () => onSelectCar(car.id)
        });
      } else if (category === 'at-risk') {
        alerts.push({
          id: `alert-risk-${car.id}`,
          type: 'info',
          badge: 'AT RISK',
          title: `At Risk: ${car.plateNumber}`,
          desc: `Vehicle estimated completion + 30m buffer exceeds promised delivery time (${car.promisedTime}).`,
          actionText: 'View Work Details',
          onAction: () => onSelectCar(car.id)
        });
      }
    });

    return alerts;
  }, [cars, currentTime, onCustomerApprove, onReceiveShortParts, onSelectCar]);

  // Suggested actions builder
  const suggestedActions = useMemo(() => {
    const list: Array<{ id: string; text: string; buttonText: string; onClick: () => void }> = [];

    // Helper: find vacant bays
    const vacantBay = bays.find(b => b.currentCarId === null);
    const queuedCar = cars.find(c => c.currentBayId === null && c.overallStatus !== 'completed' && c.sharedResourceStatus === 'none');

    if (vacantBay && queuedCar) {
      list.push({
        id: 'suggest-assign',
        text: `Assign waitlist vehicle ${queuedCar.plateNumber} into vacant ${vacantBay.name}.`,
        buttonText: 'Auto-Assign',
        onClick: () => onAssignCarToBay(vacantBay.id, queuedCar.id)
      });
    }

    // Alignment and wash lane pulls
    sharedResources.forEach(res => {
      if (res.currentCarId === null && res.queue.length > 0) {
        const nextCar = cars.find(c => c.id === res.queue[0]);
        if (nextCar) {
          list.push({
            id: `suggest-lane-${res.id}`,
            text: `${res.name} is currently idle. Pull queued vehicle ${nextCar.plateNumber} onto the rig.`,
            buttonText: 'Pull Next',
            onClick: () => onAdvanceQueue(res.id)
          });
        }
      }
    });

    // Final Dispatch / Delivery
    cars.forEach(car => {
      if (car.overallStatus === 'completed') {
        list.push({
          id: `suggest-dispatch-${car.id}`,
          text: `Vehicle ${car.plateNumber} (${car.make} ${car.model}) has completed all procedures and is ready for customer pickup.`,
          buttonText: 'Complete Dispatch',
          onClick: () => onDispatchCar ? onDispatchCar(car.id) : onSelectCar(car.id)
        });
      }
    });

    // Escalations
    cars.forEach(car => {
      if (car.overallStatus === 'blocked' && !car.approvalPending && !car.partsOnOrder) {
        list.push({
          id: `suggest-unblock-${car.id}`,
          text: `Identify bottleneck on blocked vehicle ${car.plateNumber} in work bay.`,
          buttonText: 'Inspect Jobs',
          onClick: () => onSelectCar(car.id)
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: 'no-actions',
        text: 'All operational lines are running within baseline specifications.',
        buttonText: 'Audit Status',
        onClick: () => {}
      });
    }

    return list;
  }, [bays, cars, sharedResources, onAssignCarToBay, onAdvanceQueue, onSelectCar, onDispatchCar]);

  // Suggested floor operations actions (excluding dispatches)
  const suggestedOpsActions = useMemo(() => {
    const list: Array<{ id: string; text: string; buttonText: string; onClick: () => void }> = [];

    // Helper: find vacant bays
    const vacantBay = bays.find(b => b.currentCarId === null);
    const queuedCar = cars.find(c => c.currentBayId === null && c.overallStatus !== 'completed' && c.sharedResourceStatus === 'none');

    if (vacantBay && queuedCar) {
      list.push({
        id: 'suggest-assign',
        text: `Assign waitlist vehicle ${queuedCar.plateNumber} into vacant ${vacantBay.name}.`,
        buttonText: 'Auto-Assign',
        onClick: () => onAssignCarToBay(vacantBay.id, queuedCar.id)
      });
    }

    // Alignment and wash lane pulls
    sharedResources.forEach(res => {
      if (res.currentCarId === null && res.queue.length > 0) {
        const nextCar = cars.find(c => c.id === res.queue[0]);
        if (nextCar) {
          list.push({
            id: `suggest-lane-${res.id}`,
            text: `${res.name} is currently idle. Pull queued vehicle ${nextCar.plateNumber} onto the rig.`,
            buttonText: 'Pull Next',
            onClick: () => onAdvanceQueue(res.id)
          });
        }
      }
    });

    // Escalations
    cars.forEach(car => {
      if (car.overallStatus === 'blocked' && !car.approvalPending && !car.partsOnOrder) {
        list.push({
          id: `suggest-unblock-${car.id}`,
          text: `Identify bottleneck on blocked vehicle ${car.plateNumber} in work bay.`,
          buttonText: 'Inspect Jobs',
          onClick: () => onSelectCar(car.id)
        });
      }
    });

    return list;
  }, [bays, cars, sharedResources, onAssignCarToBay, onAdvanceQueue, onSelectCar]);

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      
      {/* Upper stats header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest block font-sans">Control Room</span>
          <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
            Operational dashboard oversight and telemetry control cabin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToDesignSystem && (
            <button
              onClick={onNavigateToDesignSystem}
              className="flex items-center gap-1.5 border border-teal-200 bg-teal-50/50 hover:bg-teal-100/80 hover:text-teal-900 px-3 py-1.5 rounded-xl text-xs font-mono font-black text-teal-800 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <Palette className="w-3.5 h-3.5 text-teal-600" />
              <span>DESIGN LAB SPEC</span>
            </button>
          )}
          
          <div className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-neutral-700 custom-shadow-xs">
            <Clock className="w-4 h-4 text-primary-600" />
            <span>CURRENT TIMELINE: <span className="text-neutral-900 font-bold">{currentTime}</span></span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TOP SECTION: Grayscale Low-Fidelity KPI Cards         */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Vehicles', val: activeVehiclesCount, prefix: 'ON FLOOR', theme: 'bg-primary-50/50 border-primary-200 text-primary-700 font-sans' },
          { label: 'At-Risk Vehicles', val: atRiskCount, prefix: 'DISPATCH RISK', theme: 'bg-risk-50 border-risk-200 text-risk-700', isTriggered: atRiskCount > 0 },
          { label: 'Blocked Bays', val: blockedBaysCount, prefix: 'REPAIR HALT', theme: 'bg-critical-50 border-critical-250 text-critical-700', isTriggered: blockedBaysCount > 0 },
          { label: 'Waiting Approvals', val: waitingApprovalsCount, prefix: 'QUOTES OUT', theme: 'bg-warning-50 border-warning-200 text-warning-700', isTriggered: waitingApprovalsCount > 0 },
          { label: 'Waiting Parts', val: waitingPartsCount, prefix: 'LANE OUTAGE', theme: 'bg-neutral-50 border-neutral-200 text-neutral-600', isTriggered: waitingPartsCount > 0 }
        ].map((kpi, kIdx) => {
          const cardClass = kpi.isTriggered 
            ? kpi.theme 
            : 'bg-white border-neutral-200 text-neutral-500';

          return (
            <div 
              key={kIdx}
              className={`border-2 p-4 rounded-xl flex flex-col justify-between transition-all duration-150 custom-shadow-sm ${cardClass}`}
            >
              <div>
                <span className={`text-[9px] uppercase font-mono font-bold tracking-wider ${kpi.isTriggered ? 'opacity-90' : 'text-neutral-400'}`}>
                  {kpi.prefix}
                </span>
                <h3 className="text-xs font-bold uppercase tracking-tight mt-1 text-neutral-800">
                  {kpi.label}
                </h3>
              </div>
              <div className="flex items-baseline justify-between pt-5 mt-auto">
                <span className="text-3px font-extrabold tracking-tight font-mono text-neutral-950 text-2xl md:text-3xl">
                  {String(kpi.val).padStart(2, '0')}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-60">UNITS</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ======================================================== */}
      {/* Main split: Center section + Right section              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CENTER SECTION: Bay Board (Col span 8) */}
        <div className="col-span-1 lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center pb-1 border-b border-neutral-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 font-sans">
              Bay Board Grid Status (8 Bays)
            </h3>
            <span className="px-2 py-0.5 text-[9px] font-extrabold rounded bg-primary-100 text-primary-800 tracking-wide uppercase font-mono">
              REALTIME MATRIX
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {bays.map(bay => {
              const car = cars.find(c => c.id === bay.currentCarId) || null;
              
              // Determine status text
              let statusText = 'FREE';
              let borderStyle = 'border-emerald-200 bg-emerald-50/10';
              let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              if (car) {
                if (car.overallStatus === 'blocked') {
                  statusText = 'BLOCKED CAR';
                  borderStyle = 'border-l-4 border-l-critical-500 border-t border-b border-r border-critical-200 bg-critical-50/5';
                  badgeClass = 'bg-critical-100 text-critical-700 border-critical-200';
                } else if (car.approvalPending) {
                  statusText = 'WAITING APPROVAL';
                  borderStyle = 'border-l-4 border-l-warning-500 border-t border-b border-r border-warning-200 bg-warning-50/5';
                  badgeClass = 'bg-warning-100 text-warning-700 border-warning-200';
                } else if (car.partsOnOrder) {
                  statusText = 'WAITING PARTS';
                  borderStyle = 'border-l-4 border-l-warning-600 border-t border-b border-r border-amber-250 bg-amber-50/10';
                  badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
                } else if (car.overallStatus === 'at-risk') {
                  statusText = 'AT RISK';
                  borderStyle = 'border-l-4 border-l-risk-500 border-t border-b border-r border-risk-250 bg-risk-50/5';
                  badgeClass = 'bg-risk-100 text-risk-800 border-risk-200';
                } else if (car.overallStatus === 'completed') {
                  statusText = 'COMPLETED';
                  borderStyle = 'border-l-4 border-l-success-500 border-t border-b border-r border-success-200 bg-success-50/5';
                  badgeClass = 'bg-success-100 text-success-800 border-success-200';
                } else {
                  statusText = 'IN WORK';
                  borderStyle = 'border-neutral-200 bg-white';
                  badgeClass = 'bg-primary-100 text-primary-800 border-primary-200';
                }
              }

              return (
                <div 
                  key={bay.id}
                  onClick={() => car && onSelectCar(car.id)}
                  className={`p-4 rounded-xl border flex flex-col justify-between min-h-[170px] cursor-pointer hover:border-primary-500 hover:shadow-md transition-all duration-200 custom-shadow-sm ${borderStyle}`}
                >
                  <div>
                    {/* Header line of wireframe */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-extrabold text-neutral-900 font-mono">
                          {bay.name}
                        </span>
                        <span className="text-[10px] uppercase block text-neutral-400 mt-0.5 tracking-wider font-semibold">
                          {bay.type} unit
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClass}`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Assigned Vehicle if exists */}
                    {car ? (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-900 font-mono tracking-widest bg-neutral-100 px-2 py-0.5 rounded border border-neutral-250">
                            {car.plateNumber}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-bold">
                            {car.make} {car.model}
                          </span>
                        </div>
                        {/* Mechanic detail and promised timing */}
                        <div className="flex justify-between items-center text-[11px] text-neutral-500 font-mono pt-1">
                          <span className="flex items-center gap-1 font-sans text-neutral-600">
                            <User className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{car.jobs[0]?.technicianName || 'STAFF'}</span>
                          </span>
                          <span className="bg-neutral-100 text-neutral-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                            Target: {car.promisedTime}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex items-center justify-center border border-dashed border-emerald-250 py-4 rounded-xl bg-emerald-50/5">
                        <span className="text-[11px] uppercase font-mono tracking-widest text-emerald-600 font-bold">
                          Vacant Slot
                        </span>
                      </div>
                    )}
                  </div>

                  {car && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex justify-between items-center">
                      <span className="text-[10px] uppercase font-mono text-neutral-500 font-semibold truncate max-w-[180px]">
                        Task: {car.jobs.find(j => j.status !== 'completed')?.title || 'Inspect'}
                      </span>
                      <span className="text-[10px] font-extrabold text-primary-700 flex items-center gap-0.5 hover:underline uppercase tracking-wider">
                        Dispatch <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Critical alerts, At-Risk vehicles, Suggested actions */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          
          {/* Critical alerts & at-risk list */}
          <div className="border border-neutral-250 p-4 bg-white rounded-xl space-y-4 custom-shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-800 font-mono border-b pb-2">
              Critical Alerts Log
            </h4>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {criticalAlerts.map((alert, index) => {
                const isCritical = alert.type === 'critical';
                const containerClass = isCritical 
                  ? 'border-l-4 border-l-critical-500 bg-critical-50/40 border-critical-100' 
                  : 'border-l-4 border-l-warning-550 bg-amber-50/30 border-amber-200';
                const statusBadge = isCritical 
                  ? 'bg-critical-150 text-critical-700 border border-critical-250' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200';

                return (
                  <div 
                    key={alert.id || index} 
                    className={`p-3 border rounded-r-xl text-xs space-y-1.5 transition-colors ${containerClass}`}
                  >
                    <div className="flex items-center justify-between font-bold text-neutral-900">
                      <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] uppercase tracking-wider ${statusBadge}`}>
                        {alert.badge || alert.type}
                      </span>
                      <span className="text-[9px] font-normal text-neutral-400 font-mono">ALERT-{index+1}</span>
                    </div>
                    <p className="font-bold text-neutral-800 line-clamp-2">{alert.title}</p>
                    <p className="text-neutral-500 text-[11px] leading-relaxed">{alert.desc}</p>
                    {alert.actionText && alert.onAction && (
                      <button 
                        onClick={alert.onAction}
                        className={`mt-1 text-[10px] font-extrabold uppercase tracking-widest text-white py-1.5 rounded-lg active:scale-95 transition-all w-full text-center block shadow ${alert.type === 'critical' ? 'bg-primary-700 hover:bg-primary-800' : 'bg-neutral-900 hover:bg-neutral-850'}`}
                      >
                        {alert.actionText}
                      </button>
                    )}
                  </div>
                );
              })}

              {criticalAlerts.length === 0 && (
                <div className="p-6 text-center text-xs text-neutral-400 italic">
                  No active incidents or critical breaches currently logged on floor.
                </div>
              )}
            </div>
          </div>

          {/* Suggested actions list */}
          <div className="border border-neutral-250 p-4 bg-white rounded-xl space-y-4 custom-shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-800 font-mono">
                Suggested dispatches
              </h4>
              <span className="text-[9px] font-extrabold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono uppercase">
                Active Tracker
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {(() => {
                const activeCars = cars;

                if (activeCars.length === 0) {
                  return (
                    <div className="p-6 text-center text-xs text-neutral-400 italic">
                      No active vehicles currently tracked in workshop.
                    </div>
                  );
                }

                return activeCars.map((car) => {
                  // Milestone 1: Job Done
                  const primaryJobs = car.jobs.filter(j => {
                    const title = j.title.toLowerCase();
                    return !title.includes('align') && !title.includes('wash') && !title.includes('vacuum') && !title.includes('detail');
                  });
                  const isJobDone = primaryJobs.length > 0 ? primaryJobs.every(j => j.status === 'completed') : true;

                  // Milestone 2: Alignment Done
                  const alignmentJobs = car.jobs.filter(j => j.title.toLowerCase().includes('align'));
                  const isAlignmentDone = alignmentJobs.length > 0 && alignmentJobs.every(j => j.status === 'completed');

                  // Milestone 3: Wash Done
                  const washJobs = car.jobs.filter(j => {
                    const title = j.title.toLowerCase();
                    return title.includes('wash') || title.includes('vacuum') || title.includes('detail');
                  });
                  const isWashDone = washJobs.length > 0 && washJobs.every(j => j.status === 'completed');

                  // Sequential milestones array
                  const workflowSteps: string[] = [];
                  if (isJobDone) {
                    workflowSteps.push('job_completed');
                    if (isAlignmentDone) {
                      workflowSteps.push('alignment_completed');
                      if (isWashDone) {
                        workflowSteps.push('wash_completed');
                      }
                    }
                  }

                  // CTA unlocked ONLY when all 3 sequential milestones are completed
                  const isCtaVisible = workflowSteps.includes('job_completed') && 
                                       workflowSteps.includes('alignment_completed') && 
                                       workflowSteps.includes('wash_completed');

                  return (
                    <div 
                      key={car.id} 
                      className="p-3 border border-neutral-100 bg-neutral-50 hover:bg-neutral-100/50 transition duration-150 rounded-xl text-xs space-y-2.5"
                    >
                      {/* Top: Plate number and make/model */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-neutral-900 font-mono bg-neutral-150 px-1.5 py-0.5 rounded border border-neutral-200">
                            {car.plateNumber}
                          </span>
                          <span className="text-[11px] text-neutral-500 font-semibold truncate max-w-[120px] capitalize">
                            {car.make} {car.model}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-neutral-400 font-medium">
                          Promised: {car.promisedTime}
                        </span>
                      </div>

                      {/* Progress Milestones display */}
                      <div className="grid grid-cols-3 gap-1 bg-white border border-neutral-150 rounded-lg p-2 text-[9px] font-mono relative">
                        {/* Step 1: Job Done */}
                        <div className="flex flex-col items-center justify-center text-center p-1 border-r border-neutral-100">
                          <span className={`font-extrabold tracking-tight uppercase ${isJobDone ? 'text-teal-600 font-black' : 'text-neutral-400'}`}>
                            Job Done
                          </span>
                          <span className={`text-[8px] mt-0.5 font-bold ${isJobDone ? 'text-teal-500 font-extrabold' : 'text-neutral-400'}`}>
                            {isJobDone ? '✓ DONE' : '○ PENDING'}
                          </span>
                        </div>

                        {/* Step 2: Alignment Done */}
                        <div className="flex flex-col items-center justify-center text-center p-1 border-r border-neutral-100">
                          <span className={`font-extrabold tracking-tight uppercase ${isAlignmentDone ? 'text-indigo-600 font-black' : 'text-neutral-400'}`}>
                            Alignment Done
                          </span>
                          <span className={`text-[8px] mt-0.5 font-bold ${isAlignmentDone ? 'text-indigo-500 font-extrabold' : 'text-neutral-400'}`}>
                            {isAlignmentDone ? '✓ DONE' : '○ PENDING'}
                          </span>
                        </div>

                        {/* Step 3: Wash Done */}
                        <div className="flex flex-col items-center justify-center text-center p-1">
                          <span className={`font-extrabold tracking-tight uppercase ${isWashDone ? 'text-purple-600 font-black' : 'text-neutral-400'}`}>
                            Wash Done
                          </span>
                          <span className={`text-[8px] mt-0.5 font-bold ${isWashDone ? 'text-purple-500 font-extrabold' : 'text-neutral-400'}`}>
                            {isWashDone ? '✓ DONE' : '○ PENDING'}
                          </span>
                        </div>
                      </div>

                      {/* Visual Pipeline flow connector info */}
                      <div className="flex justify-between items-center text-[8.5px] text-neutral-400 font-mono px-1">
                        <span>Milestones Passed: {workflowSteps.length}/3</span>
                        <span className="font-bold uppercase tracking-wider">
                          {isCtaVisible ? '✓ ROUTE COMPLETED' : '⌛ ROUTING PROCESS'}
                        </span>
                      </div>

                      {/* Conditional Call to Action (CTA) with smooth fade-in motion transition */}
                      <AnimatePresence>
                        {isCtaVisible && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 4 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <button 
                              onClick={() => onDispatchCar ? onDispatchCar(car.id) : onSelectCar(car.id)}
                              className="w-full text-center bg-teal-600 hover:bg-teal-700 text-white py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Complete Dispatch
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Operational recommendations panel */}
          {suggestedOpsActions.length > 0 && (
            <div className="border border-neutral-250 p-4 bg-white rounded-xl space-y-4 custom-shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-800 font-mono border-b pb-2">
                Floor Optimization Tasks
              </h4>
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {suggestedOpsActions.map((act) => (
                  <div 
                    key={act.id} 
                    className="p-3 border border-neutral-100 bg-neutral-50 hover:bg-neutral-100/50 transition duration-150 rounded-xl text-xs"
                  >
                    <p className="text-neutral-600 font-bold leading-relaxed mb-2">
                      {act.text}
                    </p>
                    <button 
                      onClick={act.onClick}
                      className="w-full text-center border-2 border-primary-700 py-1.5 rounded-xl font-extrabold text-[11px] text-primary-700 uppercase tracking-widest bg-white hover:bg-primary-700 hover:text-white transition-all duration-150 active:translate-y-px shadow-sm"
                    >
                      {act.buttonText}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM SECTION: Queue boards (Approval, Parts, Align, Wash) */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2 border-neutral-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 font-sans">
            Pipeline queue monitors
          </h3>
          <span className="text-[10px] font-extrabold text-primary-700 bg-primary-100 px-2.5 py-0.5 rounded uppercase font-mono">4 core categories</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* A. Approval Queue */}
          <div className="border border-neutral-250 rounded-xl p-4 bg-white flex flex-col justify-between custom-shadow-sm">
            <div>
              <div className="flex justify-between items-center border-b pb-2 border-neutral-100">
                <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide">
                  I. Customer Approvals
                </span>
                <span className="text-[10px] bg-warning-500 text-white font-mono rounded px-2 py-0.5 font-bold">
                  {cars.filter(c => c.approvalPending).length}
                </span>
              </div>
              
              <div className="pt-3 space-y-2 max-h-[200px] overflow-y-auto">
                {cars.filter(c => c.approvalPending).map(c => (
                  <div key={c.id} className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1.5 transition hover:bg-neutral-100/50">
                    <div className="flex justify-between items-center font-bold">
                      <span className="font-mono text-neutral-900 bg-white border border-neutral-250 px-1.5 py-0.5 rounded">{c.plateNumber}</span>
                      <span className="text-warning-700 font-bold font-mono">₹{c.approvalRequiredCost}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-medium line-clamp-2">{c.approvalRequiredWork}</p>
                    <div className="flex gap-1.5 pt-1">
                      <button 
                        onClick={() => onCustomerApprove(c.id)}
                        className="flex-grow py-1.5 bg-neutral-900 text-white text-[10px] font-extrabold uppercase rounded-lg hover:bg-neutral-855 tracking-wide active:scale-95 transition-all"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => onCustomerDecline(c.id)}
                        className="py-1.5 px-2 bg-white border border-neutral-300 text-[10px] font-bold rounded-lg text-neutral-500 hover:text-red-650 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
                        title="Decline"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {cars.filter(c => c.approvalPending).length === 0 && (
                  <p className="text-neutral-400 text-[11px] italic pt-4 text-center font-medium">No quotes pending customer auth.</p>
                )}
              </div>
            </div>
          </div>

          {/* B. Parts Queue */}
          <div className="border border-neutral-250 rounded-xl p-4 bg-white flex flex-col justify-between custom-shadow-sm">
            <div>
              <div className="flex justify-between items-center border-b pb-2 border-neutral-100">
                <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide">
                  II. Parts Logistics
                </span>
                <span className="text-[10px] bg-amber-600 text-white font-mono rounded px-2 py-0.5 font-bold">
                  {cars.filter(c => c.partsOnOrder).length}
                </span>
              </div>

              <div className="pt-3 space-y-2 max-h-[200px] overflow-y-auto">
                {cars.filter(c => c.partsOnOrder).map(c => (
                  <div key={c.id} className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1.5 transition hover:bg-neutral-100/50">
                    <div className="flex justify-between items-center font-bold">
                      <span className="font-mono text-neutral-900 bg-white border border-neutral-250 px-1.5 py-0.5 rounded">{c.plateNumber}</span>
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 rounded text-[10px] font-bold">{c.partsExpectedTime}</span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-medium line-clamp-2">{c.partsOrderDescription}</p>
                    <button 
                      onClick={() => onReceiveShortParts(c.id)}
                      className="w-full py-1.5 bg-primary-600 text-white text-[10px] font-extrabold uppercase rounded-lg hover:bg-primary-700 transition duration-150 active:scale-95 shadow-sm"
                    >
                      Arrived / Deliver
                    </button>
                  </div>
                ))}

                {cars.filter(c => c.partsOnOrder).length === 0 && (
                  <p className="text-neutral-400 text-[11px] italic pt-4 text-center font-medium">Zero parts backlogs currently registered.</p>
                )}
              </div>
            </div>
          </div>

          {/* C. Alignment Queue */}
          <div className="border border-neutral-250 rounded-xl p-4 bg-white flex flex-col justify-between custom-shadow-sm">
            <div>
              <div className="flex justify-between items-center border-b pb-2 border-neutral-100">
                <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide">
                  III. Alignment Queue
                </span>
                <span className="text-[10px] bg-primary-800 text-white font-mono rounded px-2 py-0.5 font-bold">
                  {sharedResources[0]?.queue.length || 0}
                </span>
              </div>

              <div className="pt-3 space-y-2 max-h-[200px] overflow-y-auto">
                {/* Active space */}
                {sharedResources[0]?.currentCarId && (() => {
                  const alignCar = cars.find(c => c.id === sharedResources[0].currentCarId);
                  const alignJob = alignCar?.jobs.find(j => j.title.toLowerCase().includes('align'));
                  const alignElapsed = alignJob ? alignJob.elapsedMins : 15;
                  const alignDuration = alignJob ? alignJob.durationMins : 30;
                  const alignProgressPct = Math.min(100, Math.round((alignElapsed / alignDuration) * 100));
                  return (
                    <div className="p-2.5 bg-primary-50/50 border border-primary-200 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono text-primary-600 uppercase font-extrabold block">RIG ALIGNER ACTIVE</span>
                          <span className="font-mono font-bold text-neutral-900 text-xs">
                            MH-01: {alignCar?.plateNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-neutral-500">
                          {alignElapsed}/{alignDuration} Mins
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden border border-neutral-200">
                          <div className="bg-primary-500 h-full rounded-full transition-all duration-300" style={{ width: `${alignProgressPct}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
                          <span>Progress</span>
                          <span>{alignProgressPct}%</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => onAdvanceQueue(sharedResources[0].id)}
                        className="w-full text-center bg-primary-700 text-white py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide hover:bg-primary-800 transition duration-150 active:scale-95"
                      >
                        Release Rig / Done
                      </button>
                    </div>
                  );
                })()}

                {sharedResources[0]?.queue.map((id, index) => {
                  const car = cars.find(c => c.id === id);
                  return car ? (
                    <div key={id} className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs flex justify-between items-center font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 flex items-center justify-center bg-white border border-neutral-250 rounded-full text-[9px] font-mono font-extrabold text-neutral-500">#{index+1}</span>
                        <span className="font-mono text-neutral-800 font-bold">{car.plateNumber}</span>
                      </div>
                      <button 
                        onClick={() => onRemoveFromQueue(sharedResources[0].id, id)}
                        className="text-[10px] text-neutral-450 hover:text-red-600 transition font-extrabold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null;
                })}

                {!(sharedResources[0]?.currentCarId) && (sharedResources[0]?.queue.length === 0) && (
                  <p className="text-neutral-400 text-[11px] italic pt-4 text-center font-medium">Alignment bay is vacant.</p>
                )}
              </div>
            </div>
          </div>

          {/* D. Wash Queue */}
          <div className="border border-neutral-250 rounded-xl p-4 bg-white flex flex-col justify-between custom-shadow-sm">
            <div>
              <div className="flex justify-between items-center border-b pb-2 border-neutral-100">
                <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide">
                  IV. Wash Bay Lane
                </span>
                <span className="text-[10px] bg-primary-800 text-white font-mono rounded px-2 py-0.5 font-bold">
                  {sharedResources[1]?.queue.length || 0}
                </span>
              </div>

              <div className="pt-3 space-y-2 max-h-[200px] overflow-y-auto">
                {/* Active space */}
                {sharedResources[1]?.currentCarId && (() => {
                  const washCar = cars.find(c => c.id === sharedResources[1].currentCarId);
                  const washJob = washCar?.jobs.find(j => {
                    const t = j.title.toLowerCase();
                    return t.includes('wash') || t.includes('detail');
                  });
                  const washElapsed = washJob ? washJob.elapsedMins : 8;
                  const washDuration = washJob ? washJob.durationMins : 15;
                  const washProgressPct = Math.min(100, Math.round((washElapsed / washDuration) * 100));
                  return (
                    <div className="p-2.5 bg-primary-50/50 border border-primary-200 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-mono text-primary-600 uppercase font-extrabold block">WASH BAY ACTIVE</span>
                          <span className="font-mono font-bold text-neutral-900 text-xs">
                            {washCar?.plateNumber}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-neutral-500">
                          {washElapsed}/{washDuration} Mins
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden border border-neutral-200">
                          <div className="bg-primary-500 h-full rounded-full transition-all duration-300" style={{ width: `${washProgressPct}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
                          <span>Progress</span>
                          <span>{washProgressPct}%</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => onAdvanceQueue(sharedResources[1].id)}
                        className="w-full text-center bg-primary-700 text-white py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide hover:bg-primary-800 transition duration-150 active:scale-95"
                      >
                        Release Bay / Done
                      </button>
                    </div>
                  );
                })()}

                {sharedResources[1]?.queue.map((id, index) => {
                  const car = cars.find(c => c.id === id);
                  return car ? (
                    <div key={id} className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-xs flex justify-between items-center font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 flex items-center justify-center bg-white border border-neutral-250 rounded-full text-[9px] font-mono font-extrabold text-neutral-500">#{index+1}</span>
                        <span className="font-mono text-neutral-800 font-bold">{car.plateNumber}</span>
                      </div>
                      <button 
                        onClick={() => onRemoveFromQueue(sharedResources[1].id, id)}
                        className="text-[10px] text-neutral-450 hover:text-red-650 transition font-extrabold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null;
                })}

                {!(sharedResources[1]?.currentCarId) && (sharedResources[1]?.queue.length === 0) && (
                  <p className="text-neutral-400 text-[11px] italic pt-4 text-center font-medium">Wash bay is vacant.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
