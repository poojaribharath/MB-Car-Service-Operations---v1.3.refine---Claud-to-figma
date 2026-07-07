import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  Hourglass, 
  DollarSign, 
  PhoneCall, 
  CheckCircle2, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { Car } from '../types';

interface ApprovalCenterProps {
  cars: Car[];
  onCustomerApprove: (carId: string) => void;
  onCustomerDecline: (carId: string) => void;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  cars,
  onCustomerApprove,
  onCustomerDecline
}) => {
  // Map simulated approval statuses to Kanban Columns
  // Columns: Newly Requested, Waiting Response, Escalated, Approved
  // Let's divide approval-seeking cars into these columns
  const kanbanColumns = useMemo(() => {
    // Collect all cars centered on approvals
    const allEligible = cars.filter(c => c.approvalRequiredWork !== null || c.approvalPending);

    const newlyRequested: Car[] = [];
    const waitingResponse: Car[] = [];
    const escalated: Car[] = [];
    const approved: Car[] = [];

    allEligible.forEach(car => {
      // If supplementary work has been approved (i.e. approvalPending is false but work was noted, or general completion metrics)
      if (!car.approvalPending && car.approvalRequiredWork && car.overallStatus !== 'completed') {
        approved.push(car);
        return;
      }

      // If pending, categorize by "aging" simulation
      if (car.approvalPending) {
        if (car.overallStatus === 'critical') {
          escalated.push(car);
        } else if (car.approvalContactLogged) {
          waitingResponse.push(car);
        } else {
          newlyRequested.push(car);
        }
      }
    });

    return {
      newlyRequested,
      waitingResponse,
      escalated,
      approved
    };
  }, [cars]);

  // Simple aging calculation helper (simulate duration stalled)
  const getSimulatedAge = (car: Car) => {
    if (car.overallStatus === 'critical') return 'Over 120 mins';
    if (car.approvalContactLogged) return '45 mins';
    return '15 mins';
  };

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      {/* Header operations detail */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div>
          <span className="text-[10px] uppercase font-mono font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded tracking-widest inline-block font-sans">Supplementary Estimates CRM</span>
          <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
            Keep bays flowing. Fast-track supplementary repair estimates to unblock garage capacity.
          </p>
        </div>

        {/* Quick totals summary */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-bold bg-neutral-100 p-2.5 rounded-xl border border-neutral-250 custom-shadow-sm">
          <Hourglass className="w-4 h-4 text-primary-700" />
          <span>SLA Goal: Approve all supplemental estimates inside 15 mins.</span>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start h-[640px] overflow-hidden">
        
        {/* COLUMN 1: NEWLY REQUESTED */}
        <div className="flex flex-col h-full bg-neutral-105/50 rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-neutral-200 bg-white flex items-center justify-between font-sans">
            <span className="text-xs uppercase font-extrabold text-neutral-700">Newly Requested</span>
            <span className="px-2 py-0.5 bg-neutral-150 text-neutral-700 border border-neutral-250 font-mono font-extrabold rounded-lg text-[10px]">
              {kanbanColumns.newlyRequested.length}
            </span>
          </div>
          
          <div className="p-3 flex-grow overflow-y-auto space-y-4">
            {kanbanColumns.newlyRequested.map(car => (
              <div key={car.id} className="bg-white p-4 rounded-xl border border-neutral-250 custom-shadow-sm space-y-3 font-sans text-xs text-neutral-700 hover:border-primary-400 transition">
                <div className="flex items-start justify-between">
                  <span className="font-extrabold font-mono text-neutral-900 text-sm tracking-wider bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">{car.plateNumber}</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-lg border border-amber-250 font-mono uppercase">NEW</span>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px]">
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase tracking-wider font-mono">SUPPLEMENTARY SCOPE</span>
                  <span className="font-bold text-neutral-800 block mt-0.5">{car.approvalRequiredWork}</span>
                  <span className="font-extrabold text-primary-800 font-mono text-[11px] block mt-1">EST. COST: ₹{car.approvalRequiredCost}</span>
                </div>

                <div className="space-y-1 text-[11px] text-neutral-500 border-t pt-2 border-dashed border-neutral-200">
                  <div>PROM TIME: <span className="font-semibold text-neutral-800 font-mono">{car.promisedTime}</span></div>
                  <div className="flex items-center gap-1 mt-1">
                    <Hourglass className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Age: <span className="text-neutral-800 font-bold font-mono">{getSimulatedAge(car)}</span></span>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button 
                    onClick={() => onCustomerApprove(car.id)}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-sans uppercase font-extrabold text-[10px] tracking-wider py-1.5 rounded-xl transition text-center active:scale-95 shadow-sm"
                  >
                    Authorize
                  </button>
                  <button 
                    onClick={() => onCustomerDecline(car.id)}
                    className="bg-white border border-neutral-250 text-neutral-600 hover:bg-red-50 hover:text-red-650 hover:border-red-200 font-sans uppercase font-extrabold text-[10px] tracking-wide px-2.5 py-1.5 rounded-xl transition text-center active:scale-95 shadow-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
            
            {kanbanColumns.newlyRequested.length === 0 && (
              <div className="text-center text-xs text-neutral-455 italic py-12 px-4 border border-dashed border-neutral-200 rounded-xl bg-white m-2">
                No newly found scope requiring quotes.
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: WAITING RESPONSE */}
        <div className="flex flex-col h-full bg-neutral-105/50 rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-neutral-200 bg-white flex items-center justify-between font-sans">
            <span className="text-xs uppercase font-extrabold text-neutral-700">Waiting Response</span>
            <span className="px-2 py-0.5 bg-neutral-150 text-neutral-700 border border-neutral-250 font-mono font-extrabold rounded-lg text-[10px]">
              {kanbanColumns.waitingResponse.length}
            </span>
          </div>

          <div className="p-3 flex-grow overflow-y-auto space-y-4">
            {kanbanColumns.waitingResponse.map(car => (
              <div key={car.id} className="bg-white p-4 rounded-xl border border-neutral-250 custom-shadow-sm space-y-3 font-sans text-xs text-neutral-700 hover:border-primary-400 transition">
                <div className="flex items-start justify-between">
                  <span className="font-extrabold font-mono text-neutral-900 text-sm tracking-wider bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">{car.plateNumber}</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-primary-100 text-primary-850 rounded-lg border border-primary-200 font-mono uppercase">CONTACTED</span>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px]">
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase tracking-wider font-mono">SUPPLEMENTARY SCOPE</span>
                  <span className="font-bold text-neutral-800 block mt-0.5">{car.approvalRequiredWork}</span>
                  <span className="font-extrabold text-primary-800 font-mono text-[11px] block mt-1">EST. COST: ₹{car.approvalRequiredCost}</span>
                </div>

                <div className="space-y-1 text-[11px] text-neutral-500 border-t pt-2 border-dashed border-neutral-200">
                  <div>CLIENT: <span className="font-bold text-neutral-800">{car.customerName}</span></div>
                  <div>TEL: <span className="font-semibold text-neutral-700 font-mono">{car.customerPhone}</span></div>
                  <div className="flex items-center gap-1 mt-1">
                    <Hourglass className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Stalled: <span className="text-neutral-800 font-bold font-mono">{getSimulatedAge(car)}</span></span>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button 
                    onClick={() => onCustomerApprove(car.id)}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-sans uppercase font-extrabold text-[10px] tracking-wider py-1.5 rounded-xl transition text-center active:scale-95 shadow-sm"
                  >
                    Authorize
                  </button>
                  <button 
                    onClick={() => onCustomerDecline(car.id)}
                    className="bg-white border border-neutral-250 text-neutral-600 hover:bg-red-50 hover:text-red-650 hover:border-red-200 font-sans uppercase font-extrabold text-[10px] tracking-wide px-2.5 py-1.5 rounded-xl transition text-center active:scale-95 shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}

            {kanbanColumns.waitingResponse.length === 0 && (
              <div className="text-center text-xs text-neutral-455 italic py-12 px-4 border border-dashed border-neutral-200 rounded-xl bg-white m-2">
                No active contacts awaiting client replies.
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: ESCALATED */}
        <div className="flex flex-col h-full bg-neutral-105/50 rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-neutral-200 bg-white flex items-center justify-between font-sans">
            <span className="text-xs uppercase font-extrabold text-neutral-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-critical-550 animate-bounce" /> Escalated
            </span>
            <span className="px-2 py-0.5 bg-critical-100 text-critical-705 border border-critical-250 font-mono font-extrabold rounded-lg text-[10px]">
              {kanbanColumns.escalated.length}
            </span>
          </div>

          <div className="p-3 flex-grow overflow-y-auto space-y-4">
            {kanbanColumns.escalated.map(car => (
              <div key={car.id} className="bg-critical-50/10 p-4 rounded-xl border border-critical-200 custom-shadow-sm space-y-3 font-sans text-xs text-neutral-700">
                <div className="flex items-start justify-between">
                  <span className="font-extrabold font-mono text-critical-700 text-sm tracking-widest bg-white border border-critical-250 px-1.5 py-0.5 rounded">{car.plateNumber}</span>
                  <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-critical-500 text-white rounded-lg font-mono uppercase animate-pulse">CRITICAL OVERDUE</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-critical-200 text-[11px]">
                  <span className="text-[9px] text-critical-550 block font-bold uppercase tracking-wider font-mono">BLOCKED ESTIMATE</span>
                  <span className="font-bold text-neutral-850 block mt-0.5">{car.approvalRequiredWork}</span>
                  <span className="font-extrabold text-critical-755 font-mono block mt-1">₹{car.approvalRequiredCost}</span>
                </div>

                <div className="space-y-1 text-[11px] text-neutral-600 border-t pt-2 border-critical-100 border-dashed">
                  <div>PHONE: <span className="font-bold text-neutral-800 font-mono">{car.customerPhone}</span></div>
                  <div className="text-neutral-500 font-medium block">LOCATION: <span className="text-critical-650 font-bold">Bay KA-01 (Blocked Heavy Slot)</span></div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button 
                    onClick={() => onCustomerApprove(car.id)}
                    className="flex-1 bg-critical-500 hover:bg-critical-600 text-white font-sans uppercase font-extrabold text-[10px] tracking-wider py-1.5 rounded-xl transition text-center active:scale-95 shadow-sm"
                  >
                    Force Auth
                  </button>
                  <button 
                    onClick={() => onCustomerDecline(car.id)}
                    className="bg-white border text-neutral-605 border-neutral-300 hover:bg-red-50 hover:text-red-650 hover:border-red-200 font-sans uppercase font-extrabold text-[10px] tracking-wide px-2.5 py-1.5 rounded-xl transition text-center active:scale-95 shadow-sm"
                  >
                    Decline Scope
                  </button>
                </div>
              </div>
            ))}

            {kanbanColumns.escalated.length === 0 && (
              <div className="text-center text-xs text-neutral-455 italic py-12 px-4 border border-dashed border-neutral-200 rounded-xl bg-white m-2">
                No estimates exceeding delay thresholds.
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 4: APPROVED */}
        <div className="flex flex-col h-full bg-neutral-105/50 rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-neutral-200 bg-white flex items-center justify-between font-sans">
            <span className="text-xs uppercase font-extrabold text-neutral-700">Approved & Merged</span>
            <span className="px-2 py-0.5 bg-success-100 text-success-800 border border-success-200 font-mono font-extrabold rounded-lg text-[10px]">
              {kanbanColumns.approved.length}
            </span>
          </div>

          <div className="p-3 flex-grow overflow-y-auto space-y-4">
            {kanbanColumns.approved.map(car => (
              <div key={car.id} className="bg-white/80 p-4 rounded-xl border border-neutral-200 custom-shadow-sm space-y-3 font-sans text-xs text-neutral-500 hover:border-success-300 transition">
                <div className="flex items-start justify-between">
                  <span className="font-bold font-mono text-neutral-400 line-through text-sm bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">{car.plateNumber}</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-success-100 text-success-800 rounded-lg border border-success-200 flex items-center gap-0.5 font-mono uppercase">
                    <CheckCircle2 className="w-3 h-3 text-success-600" /> MERGED
                  </span>
                </div>

                <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-150 text-[11px]">
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase font-mono tracking-wider font-mono">AUTHORIZED ESTIMATE</span>
                  <span className="text-neutral-500 block mt-0.5 line-through">{car.approvalRequiredWork}</span>
                </div>

                <div className="text-[10px] text-neutral-400 font-sans italic leading-tight font-sans">
                  Synced directly to mechanical workload queues & tablets.
                </div>
              </div>
            ))}

            {kanbanColumns.approved.length === 0 && (
              <div className="text-center text-xs text-neutral-455 italic py-12 px-4 border border-dashed border-neutral-200 rounded-xl bg-white m-2">
                All approved supplementary tasks successfully merged.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
