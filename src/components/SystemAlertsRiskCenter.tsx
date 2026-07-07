import React, { useMemo } from 'react';
import { isPartsEtaTooLong, getCarRiskStatus } from '../lib/utils';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Sliders, 
  MapPin, 
  Hourglass, 
  Flame,
  CheckCircle,
  FileCheck2,
  Wrench
} from 'lucide-react';
import { Car, ServiceBay, SharedResource } from '../types';

interface SystemAlertsRiskCenterProps {
  cars: Car[];
  bays: ServiceBay[];
  sharedResources: SharedResource[];
  currentTime: string;
  onSelectCar: (carId: string) => void;
  onCustomerApprove: (carId: string) => void;
  onReceiveParts: (carId: string) => void;
  onAdvanceQueue: (resourceId: string) => void;
}

const timeDiffInMinutes = (timeStart: string | null | undefined, timeEnd: string | null | undefined): number => {
  if (!timeStart || !timeEnd) return 0;
  try {
    const [h1, m1] = timeStart.split(':').map(Number);
    const [h2, m2] = timeEnd.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) {
      diff += 1440; // wrap around 24 hours
    }
    return diff;
  } catch {
    return 0;
  }
};

export const SystemAlertsRiskCenter: React.FC<SystemAlertsRiskCenterProps> = ({
  cars,
  bays,
  sharedResources,
  currentTime,
  onSelectCar,
  onCustomerApprove,
  onReceiveParts,
  onAdvanceQueue
}) => {

  // Compile active alarms across all systems dynamically
  const parsedAlertsList = useMemo(() => {
    const list: {
      id: string;
      category: 'at-risk' | 'blocked-bay' | 'approval-delay' | 'parts-delay' | 'queue-bottleneck';
      severity: 'critical' | 'warning' | 'info';
      vehiclePlate: string;
      description: string;
      timeImpact: string;
      suggestedAction: string;
      actionType: 'approve' | 'receive' | 'advance' | 'select';
      referenceId: string;
    }[] = [];

    // 1. At-Risk Vehicles search
    cars.forEach(car => {
      const category = getCarRiskStatus(car, currentTime);
      if (category === 'at-risk' || category === 'delayed') {
        list.push({
          id: `alert-car-${car.id}`,
          category: 'at-risk',
          severity: (category === 'delayed' || car.overallStatus === 'critical') ? 'critical' : 'warning',
          vehiclePlate: car.plateNumber,
          description: category === 'delayed' ? `Commitment missed (${car.promisedTime})` : `SLA dispatch threshold closely breached. Delivery promise: ${car.promisedTime}.`,
          timeImpact: category === 'delayed' ? 'Missing commitment timeframe' : 'Missing commitment by 30 mins+',
          suggestedAction: 'Direct tech lead to priority assignment or contact customer.',
          actionType: 'select',
          referenceId: car.id
        });
      }
    });

    // 2. Blocked Bays
    bays.forEach(bay => {
      const activeCar = cars.find(c => c.currentBayId === bay.id);
      if (activeCar && (activeCar.overallStatus === 'blocked' || activeCar.approvalPending || activeCar.partsOnOrder)) {
        const isBlocked = activeCar.overallStatus === 'blocked';
        const blockMins = activeCar.blockedAt ? timeDiffInMinutes(activeCar.blockedAt, currentTime) : 0;
        
        let isCriticalBlocked = isBlocked && (
          blockMins >= 120 ||
          isPartsEtaTooLong(activeCar.partsExpectedTime)
        );

        list.push({
          id: `alert-bay-${bay.id}`,
          category: 'blocked-bay',
          severity: isCriticalBlocked ? 'critical' : 'warning',
          vehiclePlate: activeCar.plateNumber,
          description: isCriticalBlocked
            ? `⚠️ CRITICAL: Mechanical slot ${bay.name} completely stalled for OVER 2 HOURS (${blockMins > 0 ? `${Math.floor(blockMins / 60)}h ${blockMins % 60}m` : activeCar.partsExpectedTime || '2h+'}). Physical bay dead-time holding up queue.`
            : `Mechanical slot ${bay.name} stalled. Physical bay dead-time holding up queue.`,
          timeImpact: isCriticalBlocked ? 'SLA deadline breached. Assembly line blocked.' : 'Slot unused for 45 mins+',
          suggestedAction: isCriticalBlocked 
            ? 'ESCALATE: Move vehicle to holding patio or issue direct manager disclaimer call.'
            : 'Transfer vehicle to parking yard to unblock physical space core.',
          actionType: 'select',
          referenceId: activeCar.id
        });
      }
    });

    // 3. Long Waiting Approvals (including 30min, 1hr, 2hr thresholds)
    cars.forEach(car => {
      if (car.approvalPending) {
        const minsPending = car.approvalRequestedAt ? timeDiffInMinutes(car.approvalRequestedAt, currentTime) : 30; // default to 30 for demo if not set
        
        let severity: 'critical' | 'warning' | 'info' = 'info';
        let titleIntro = '30-MIN CLIENT SILENCE';
        let detailDesc = `Supplementary authorization pending customer review. Extra repairs total ₹${car.approvalRequiredCost}. No response from client after 30 mins (requested at ${car.approvalRequestedAt || 'unknown'}).`;
        let timeImpact = 'No response from client after 30 min';
        let suggestedAction = 'Log contacts CRM or call customer directly to secure confirmation.';

        if (minsPending >= 120) {
          severity = 'critical';
          titleIntro = '2-HOUR CLIENT SILENCE';
          detailDesc = `CRITICAL: Client has not responded to supplementary repair estimates for over 2 hours (since ${car.approvalRequestedAt || 'unknown'}). Total estimate is ₹${car.approvalRequiredCost}.`;
          timeImpact = 'No response from client after 2hr';
          suggestedAction = 'ESCALATE: Move vehicle to holding patio or issue direct manager disclaimer call.';
        } else if (minsPending >= 60) {
          severity = 'warning';
          titleIntro = '1-HOUR CLIENT SILENCE';
          detailDesc = `WARNING: Client supplementary estimate review has exceeded 1 hour (since ${car.approvalRequestedAt || 'unknown'}). Estimate: ₹${car.approvalRequiredCost}.`;
          timeImpact = 'No response from client after 1hr';
          suggestedAction = 'Call customer via CRM dashboard link or send SMS notification.';
        }

        list.push({
          id: `alert-approval-${car.id}-${minsPending >= 120 ? '2h' : minsPending >= 60 ? '1h' : '30m'}`,
          category: 'approval-delay',
          severity,
          vehiclePlate: `${car.plateNumber} [${titleIntro}]`,
          description: detailDesc,
          timeImpact,
          suggestedAction,
          actionType: 'approve',
          referenceId: car.id
        });
      }
    });

    // 4. Parts delays (whenever rises a part, and if getting delayed)
    cars.forEach(car => {
      if (car.partsOnOrder) {
        // Evaluate if getting delayed (e.g. past promised target)
        const isCarDelayed = (() => {
          if (car.overallStatus === 'completed') return false;
          try {
            const [pHour, pMin] = car.promisedTime.split(':').map(Number);
            const [cHour, cMin] = currentTime.split(':').map(Number);
            const promisedTotal = pHour * 60 + pMin;
            const currentTotal = cHour * 60 + cMin;
            return currentTotal > promisedTotal;
          } catch {
            return false;
          }
        })();

        if (isCarDelayed) {
          list.push({
            id: `alert-parts-delayed-${car.id}`,
            category: 'parts-delay',
            severity: 'critical',
            vehiclePlate: `${car.plateNumber} [CRITICAL DELAY]`,
            description: `SEVERE PARTS DELAY: Parts order for "${car.partsOrderDescription || 'OEM Component'}" is blocking workshop progress. Vehicle committed dispatch was ${car.promisedTime}.`,
            timeImpact: 'SLA deadline breached. Assembly line blocked.',
            suggestedAction: 'Immediately expedite with logistics manager or coordinate rental / customer ride share.',
            actionType: 'receive',
            referenceId: car.id
          });
        } else {
          list.push({
            id: `alert-parts-${car.id}`,
            category: 'parts-delay',
            severity: 'warning',
            vehiclePlate: car.plateNumber,
            description: `Parts on order: "${car.partsOrderDescription || 'OEM component'}". System awaiting delivery dispatch.`,
            timeImpact: `Parts expected time: ${car.partsExpectedTime || '45m'}`,
            suggestedAction: 'Monitor supply chain or click manual override action to allocate components.',
            actionType: 'receive',
            referenceId: car.id
          });
        }
      }
    });

    // 5. Queue Bottlenecks
    sharedResources.forEach(res => {
      const waitingCount = res.queue ? res.queue.length : 0;
      if (waitingCount >= 2) {
        list.push({
          id: `alert-res-${res.id}`,
          category: 'queue-bottleneck',
          severity: 'warning',
          vehiclePlate: res.name,
          description: `Shared station ${res.name} experiencing wait queues with ${waitingCount} vehicle backlogs.`,
          timeImpact: 'Adding 50 mins of sequential work delays',
          suggestedAction: 'Expedite current alignment program or pull high-priority SLA ahead.',
          actionType: 'advance',
          referenceId: res.id
        });
      }
    });

    return list;
  }, [cars, bays, sharedResources, currentTime]);

  // Totals count categorization helpers
  const criticalCount = parsedAlertsList.filter(a => a.severity === 'critical').length;
  const warningCount = parsedAlertsList.filter(a => a.severity === 'warning').length;

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      {/* Header ribbon operations */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded tracking-widest inline-block font-sans">Risks & System Alarms Desk</span>
          <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
            Rapid scan command screen, priority severity sorting, and actionable operational dispatch suggestions.
          </p>
        </div>

        {/* Counter items details */}
        <div className="flex gap-4 text-xs font-mono font-bold">
          <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-xl border border-red-200 animate-in slide-in-from-top fade-in duration-400 ease-out font-sans flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            CRITICAL BLOCKS: <span className="font-mono font-extrabold">{criticalCount}</span>
          </div>
          <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl border border-orange-200 animate-in slide-in-from-top fade-in duration-400 ease-out font-sans flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            WARNING THREATS: <span className="font-mono font-extrabold">{warningCount}</span>
          </div>
        </div>
      </div>

      {/* Structured Category Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left main: Active actionable listing */}
        <div className="xl:col-span-8 space-y-4">
          <span className="text-xs font-bold font-sans text-neutral-500 uppercase tracking-widest block">
            Actionable Rapid Scan Alerts Queue ({parsedAlertsList.length})
          </span>

          <div className="space-y-4">
            {parsedAlertsList.map(alert => {
              const isCrit = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';
              
              let badgeStyle = 'bg-slate-100 text-slate-600 border border-slate-200';
              if (isCrit) {
                badgeStyle = 'bg-red-100 text-red-700 border border-red-200';
              } else if (isWarning) {
                badgeStyle = 'bg-orange-100 text-orange-700 border border-orange-200';
              }
              
              return (
                <div 
                  key={alert.id}
                  className={`bg-white rounded-xl p-5 border flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-primary-400 custom-shadow-sm ${
                    isCrit 
                      ? 'border-red-200 bg-red-50/10 animate-in slide-in-from-left fade-in duration-400 ease-out fill-mode-forwards' 
                      : isWarning
                      ? 'border-orange-200 bg-orange-50/5'
                      : 'border-slate-200 bg-slate-50/20'
                  }`}
                >
                  <div className="space-y-2 max-w-[500px]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[8.5px] font-mono font-extrabold uppercase rounded-lg tracking-wide ${badgeStyle}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-neutral-450 font-sans font-bold uppercase tracking-wider">
                        {alert.category.replace('-', ' ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-base font-extrabold font-mono text-neutral-900 tracking-wider block uppercase">
                        {alert.vehiclePlate}
                      </span>
                      <p className="text-xs text-neutral-600 font-medium leading-relaxed mt-0.5">
                        {alert.description}
                      </p>
                    </div>

                    <div className="text-[11px] font-sans font-extrabold text-neutral-405 tracking-wide">
                      TIME IMPACT: <span className="text-neutral-805 font-mono font-bold bg-neutral-100 px-1.5 py-0.5 rounded border">{alert.timeImpact}</span>
                    </div>
                  </div>

                  {/* Suggestion block and interactive action trigger */}
                  <div className="md:text-right flex flex-col items-start md:items-end gap-3 md:max-w-[240px]">
                    <p className="text-[11px] font-sans text-neutral-500 italic leading-relaxed">
                      <span className="font-extrabold text-neutral-805 uppercase not-italic block mb-0.5 text-[10px] tracking-wider">SUGGESTED DISPATCH:</span>
                      {alert.suggestedAction}
                    </p>

                    {/* Conditional rendering actions matching the workflow */}
                    {alert.actionType === 'approve' && (
                      <button
                        onClick={() => onCustomerApprove(alert.referenceId)}
                        className="bg-primary-600 hover:bg-primary-700 font-sans font-extrabold uppercase text-[10px] text-white px-3.5 py-1.5 rounded-xl transition shadow active:scale-95"
                      >
                        Authorize Supp.
                      </button>
                    )}
                    {alert.actionType === 'receive' && (
                      <button
                        onClick={() => onReceiveParts(alert.referenceId)}
                        className="bg-primary-600 hover:bg-primary-700 font-sans font-extrabold uppercase text-[10px] text-white px-3.5 py-1.5 rounded-xl transition shadow active:scale-95"
                      >
                        Allocate Parts
                      </button>
                    )}
                    {alert.actionType === 'advance' && (
                      <button
                        onClick={() => onAdvanceQueue(alert.referenceId)}
                        className="bg-neutral-900 hover:bg-neutral-850 font-sans font-extrabold uppercase text-[10px] text-white px-3.5 py-1.5 rounded-xl transition shadow active:scale-95"
                      >
                        Cycle Queue
                      </button>
                    )}
                    {alert.actionType === 'select' && (
                      <button
                        onClick={() => onSelectCar(alert.referenceId)}
                        className="bg-white border border-neutral-300 hover:bg-neutral-50 font-sans font-extrabold uppercase text-[10px] text-neutral-705 px-3.5 py-1.5 rounded-xl transition shadow-sm active:scale-95"
                      >
                        Diag Vehicle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {parsedAlertsList.length === 0 && (
              <div className="text-center py-12 text-xs text-neutral-450 bg-neutral-100/10 border border-dashed border-neutral-250 rounded-xl italic font-sans animate-pulse">
                Pristine! No active service centre risks detected. The floor operations are moving seamlessly.
              </div>
            )}
          </div>
        </div>

        {/* Right side: Summary categorization checklists */}
        <div className="xl:col-span-4 bg-white rounded-xl p-5 border border-neutral-250 custom-shadow-sm space-y-5">
          <h3 className="text-sm font-extrabold font-sans uppercase text-neutral-900 border-b pb-2 tracking-wide">
            Operational Risk Checklist
          </h3>

          <div className="space-y-4 font-sans text-xs">
            {/* Checklist 1 */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-bold text-neutral-800 block">SLA BREACH ALERT</span>
                <span className="text-[11px] text-neutral-505 block">Vehicles breaching promises today</span>
              </div>
              <span className="text-lg font-mono font-extrabold text-neutral-900 bg-white border px-2.5 py-0.5 rounded-lg">
                {cars.filter(c => c.overallStatus === 'critical').length}
              </span>
            </div>

            {/* Checklist 2 */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-bold text-neutral-800 block">CRM LATENCY SIGN-OFFS</span>
                <span className="text-[11px] text-neutral-505 block">Pending supplemental decisions</span>
              </div>
              <span className="text-lg font-mono font-extrabold text-neutral-900 bg-white border px-2.5 py-0.5 rounded-lg">
                {cars.filter(c => c.approvalPending).length}
              </span>
            </div>

            {/* Checklist 3 */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-bold text-neutral-800 block">SUPPLIER Road transits</span>
                <span className="text-[11px] text-neutral-505 block">Active parts on backorder</span>
              </div>
              <span className="text-lg font-mono font-extrabold text-neutral-900 bg-white border px-2.5 py-0.5 rounded-lg">
                {cars.filter(c => c.partsOnOrder).length}
              </span>
            </div>

            {/* General instruction helper */}
            <div className="p-4 bg-neutral-900 text-white rounded-xl text-[11px] leading-relaxed shadow-md">
              <span className="font-extrabold block text-neutral-300 uppercase mb-0.5 tracking-wider font-mono text-[9px]">Manager Action Principle</span>
              Resolve column blocks starting from the highest severity. Critical warnings on bays must be sorted before scheduling queue dispatches.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
