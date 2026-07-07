import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Wrench, 
  AlertOctagon, 
  CheckCircle2, 
  AlertTriangle,
  User,
  Activity,
  UserCheck,
  ClipboardList,
  Package,
  Truck,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { Car, ServiceBay } from '../types';

interface VehicleDetailViewProps {
  cars: Car[];
  bays: ServiceBay[];
  onSelectCar: (carId: string | null) => void;
  onCustomerApprove: (carId: string) => void;
  onCustomerDecline: (carId: string) => void;
  onReceiveShortParts: (carId: string) => void;
  initialSelectedCarId?: string | null;
  onBack?: () => void;
}

export const VehicleDetailView: React.FC<VehicleDetailViewProps> = ({
  cars,
  bays,
  onSelectCar,
  onCustomerApprove,
  onCustomerDecline,
  onReceiveShortParts,
  initialSelectedCarId,
  onBack
}) => {
  // Let the user select inside if none selected, default to the first car in the shop
  const [activeCarId, setActiveCarId] = useState<string>(initialSelectedCarId || cars[0]?.id || '');

  React.useEffect(() => {
    if (initialSelectedCarId) {
      setActiveCarId(initialSelectedCarId);
    }
  }, [initialSelectedCarId]);

  const car = cars.find(c => c.id === activeCarId);

  // Return to pick selection if there's no car
  if (!car) {
    return (
      <div className="p-8 text-center bg-white border rounded">
        No active vehicles in the database.
      </div>
    );
  }

  const getAssignedLocation = () => {
    if (car.sharedResourceStatus === 'active') {
      return { name: car.sharedResourceRequest === 'alignment' ? 'Alignment Rig' : 'Wash Bay' };
    }
    if (car.sharedResourceStatus === 'queued') {
      return { name: car.sharedResourceRequest === 'alignment' ? 'Alignment Queue' : 'Wash Bay Queue' };
    }
    return bays.find(b => b.id === car.currentBayId) || bays.find(b => b.currentCarId === car.id) || null;
  };
  const assignedBay = getAssignedLocation();
  const primaryMechanic = car.jobs[0]?.technicianName || 'STAFF PENDING';

  // Compute calculated timeline indicators
  // Timeline: Listed, Assigned, In Progress, Waiting Approval, Waiting Part, Completed
  const allJobsCompleted = car.jobs.length > 0 && car.jobs.every(j => j.status === 'completed');
  const hasJobInProgress = car.jobs.some(j => j.status === 'in-progress');

  const timelineStages = [
    { 
      label: 'Intake Registration', 
      status: 'completed',
      subtext: 'Reception intake completed',
      value: 'PASSED',
      icon: ClipboardList,
      borderColor: 'border-l-success-500 border-y-neutral-200 border-r-neutral-200',
      badgeColor: 'bg-emerald-55 text-emerald-800'
    },
    { 
      label: 'Bay Assignment', 
      status: car.currentBayId ? 'completed' : 'pending',
      subtext: assignedBay ? `Staged in ${assignedBay.name}` : 'Awaiting open bay slot',
      value: assignedBay ? 'ALLOCATED' : 'STAGED',
      icon: MapPin,
      borderColor: car.currentBayId ? 'border-l-success-500 border-y-neutral-200 border-r-neutral-200' : 'border-l-neutral-300 border-y-neutral-200 border-r-neutral-200',
      badgeColor: car.currentBayId ? 'bg-emerald-55 text-emerald-800' : 'bg-neutral-50 text-neutral-450'
    },
    { 
      label: 'Active Repair Scope', 
      status: allJobsCompleted ? 'completed' : hasJobInProgress ? 'active' : 'pending',
      subtext: hasJobInProgress 
        ? `Running: ${car.jobs.find(j => j.status === 'in-progress')?.title || 'Diagnostic'}` 
        : allJobsCompleted ? 'Initial work scope done' : 'Standing by in bay slot',
      value: `${car.jobs.filter(j => j.status === 'completed').length}/${car.jobs.length} JOBS`,
      icon: Wrench,
      borderColor: allJobsCompleted 
        ? 'border-l-success-500 border-y-neutral-200 border-r-neutral-200' 
        : hasJobInProgress 
          ? 'border-l-blue-500 border-y-neutral-200 border-r-neutral-200 ring-2 ring-blue-50' 
          : 'border-l-neutral-300 border-y-neutral-200 border-r-neutral-200',
      badgeColor: allJobsCompleted 
        ? 'bg-emerald-55 text-emerald-800' 
        : hasJobInProgress 
          ? 'bg-blue-100 text-blue-800 font-extrabold animate-pulse' 
          : 'bg-neutral-50 text-neutral-450'
    },
    { 
      label: 'Supplemental Auth', 
      status: car.approvalPending ? 'blocked' : (car.approvalRequestedAt && !car.approvalPending) ? 'completed' : 'pending',
      subtext: car.approvalPending 
        ? `Waiting signature for $${car.approvalRequiredCost}` 
        : (car.approvalRequestedAt && !car.approvalPending) 
          ? 'Additional work cleared' 
          : 'Standard scope only',
      value: car.approvalPending ? 'STALLED WORK' : 'CLEARED',
      icon: UserCheck,
      borderColor: car.approvalPending 
        ? 'border-l-red-500 border-y-neutral-200 border-r-neutral-200 ring-2 ring-red-50 animate-pulse' 
        : (car.approvalRequestedAt && !car.approvalPending) 
          ? 'border-l-success-500 border-y-neutral-200 border-r-neutral-200' 
          : 'border-l-neutral-300 border-y-neutral-200 border-r-neutral-200',
      badgeColor: car.approvalPending 
        ? 'bg-red-100 text-red-800 font-black' 
        : (car.approvalRequestedAt && !car.approvalPending) 
          ? 'bg-emerald-55 text-emerald-800 font-extrabold' 
          : 'bg-neutral-50 text-neutral-450'
    },
    { 
      label: 'Parts Logistics', 
      status: car.partsOnOrder ? 'blocked' : (car.partsExpectedTime && !car.partsOnOrder) ? 'completed' : 'pending',
      subtext: car.partsOnOrder 
        ? `Transit: ${car.partsOrderDescription || 'spare items'}` 
        : car.partsExpectedTime 
          ? 'Special order received' 
          : 'Regular stock allocated',
      value: car.partsOnOrder ? 'WAIT_PARTS' : 'IN_STOCK',
      icon: Truck,
      borderColor: car.partsOnOrder 
        ? 'border-l-orange-500 border-y-neutral-200 border-r-neutral-200 ring-2 ring-orange-50 animate-pulse' 
        : (car.partsExpectedTime && !car.partsOnOrder)
          ? 'border-l-success-500 border-y-neutral-200 border-r-neutral-200'
          : 'border-l-neutral-300 border-y-neutral-200 border-r-neutral-200',
      badgeColor: car.partsOnOrder 
        ? 'bg-orange-100 text-orange-850 font-black' 
        : 'bg-emerald-55 text-emerald-800'
    },
    { 
      label: 'Quality & Clearance', 
      status: car.overallStatus === 'completed' ? 'completed' : 'pending',
      subtext: car.overallStatus === 'completed' ? 'Ready for handover' : 'Awaiting checklist',
      value: car.overallStatus === 'completed' ? 'RELEASE' : 'ACTIVE_FLOW',
      icon: ShieldCheck,
      borderColor: car.overallStatus === 'completed' 
        ? 'border-l-success-500 border-y-neutral-200 border-r-neutral-200' 
        : 'border-l-neutral-300 border-y-neutral-200 border-r-neutral-200',
      badgeColor: car.overallStatus === 'completed' 
        ? 'bg-emerald-55 text-emerald-800' 
        : 'bg-neutral-50 text-neutral-450'
    }
  ];

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 space-y-6 overflow-y-auto select-none w-full">
      {/* Upper selector line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-3">
        <div className="flex items-start gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="mt-1 p-1.5 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-colors flex items-center justify-center shrink-0"
              title="Back to Operations Board"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-primary-700 bg-primary-55 px-2.5 py-0.5 rounded tracking-widest inline-block select-all">Dossier Code: {car.id.slice(0, 8).toUpperCase()}</span>
            <p className="text-xs text-neutral-500 font-medium font-sans mt-0.5">
              Detailed technical diagnostic dossier, real-time workload timeline, and approvals status.
            </p>
          </div>
        </div>

        {/* Dropdown selector for looking up another car directly */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase text-neutral-600">Switch dossier:</span>
          <select
            value={activeCarId}
            onChange={e => setActiveCarId(e.target.value)}
            className="bg-white border border-neutral-250 px-3 py-1.5 text-xs font-extrabold uppercase rounded-xl outline-none focus:border-primary-500 shadow-sm col-span-3 cursor-pointer"
          >
            {cars.map(c => (
              <option key={c.id} value={c.id}>
                {c.plateNumber} ({c.make} {c.model})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Overview & Timeline */}
        <div className="col-span-12 lg:col-span-12 xl:col-span-7 space-y-6">
          
          {/* Section: Vehicle Overview */}
          <div className="bg-white rounded-xl p-5 border border-neutral-250 space-y-4 custom-shadow-sm">
            <h3 className="text-sm font-bold uppercase text-neutral-800 border-b pb-2 tracking-wider font-sans flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-teal-600" />
              Vehicle Characteristics Overview
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-mono text-neutral-400 block font-bold uppercase">Plate Number</span>
                <span className="text-sm font-mono font-extrabold text-neutral-900 bg-white px-1.5 py-0.2 rounded border border-neutral-250 inline-block mt-1">{car.plateNumber}</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-mono text-neutral-400 block font-bold uppercase">Dispatch Promised</span>
                <span className="text-xs font-bold text-neutral-800 block mt-1.5">{car.promisedTime}</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-mono text-neutral-400 block font-bold uppercase">Bay Location</span>
                <span className="text-xs font-bold text-neutral-800 block mt-1.5">{assignedBay ? assignedBay.name : 'PARK OUT'}</span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-mono text-neutral-400 block font-bold uppercase">Key Mechanic</span>
                <span className="text-xs font-bold text-primary-750 block mt-1.5">{primaryMechanic}</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-neutral-600 flex flex-wrap gap-4 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <div><span className="font-extrabold text-neutral-700">Client Name:</span> <span className="font-semibold text-neutral-600">{car.customerName}</span></div>
              <div className="hidden sm:block text-neutral-300">|</div>
              <div><span className="font-extrabold text-neutral-700">Telephone:</span> <span className="font-semibold text-mono text-neutral-600">{car.customerPhone}</span></div>
            </div>
          </div>

          {/* Section: Redesigned Step Timeline */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 space-y-4 custom-shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold uppercase text-neutral-800 tracking-wider font-sans flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                Live Operational Milestone Pipeline
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-900 text-white font-mono uppercase shadow-inner">
                {car.overallStatus.toUpperCase()}
              </span>
            </div>

            {/* Redesigned interactive stage flow - grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1.5">
              {timelineStages.map((stage, idx) => {
                const Icon = stage.icon;

                let statusBadgeLabel = stage.value;
                let stepStatusColor = 'text-neutral-400';
                let iconBg = 'bg-neutral-50 text-neutral-400 border-neutral-200';
                
                if (stage.status === 'completed') {
                  stepStatusColor = 'text-emerald-700 font-extrabold';
                  iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                } else if (stage.status === 'active') {
                  stepStatusColor = 'text-blue-700 font-black';
                  iconBg = 'bg-blue-50 text-blue-600 border-blue-200 ring-2 ring-blue-50';
                } else if (stage.status === 'blocked') {
                  stepStatusColor = 'text-red-700 font-black';
                  iconBg = 'bg-red-50 text-red-600 border-red-200 animate-pulse';
                }

                return (
                  <div 
                    key={idx} 
                    className={`bg-white rounded-xl p-3.5 border-l-4 ${stage.borderColor} shadow-2xs hover:shadow-xs hover:border-y-neutral-300 hover:border-r-neutral-300 transition-all flex flex-col justify-between min-h-[120px]`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-neutral-400 font-extrabold uppercase">Step {idx + 1}</span>
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <h4 className="text-[12.5px] font-black tracking-tight text-neutral-900 leading-tight">
                        {stage.label}
                      </h4>
                      
                      <p className="text-[10.5px] font-medium text-neutral-500 leading-tight">
                        {stage.subtext}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100/70 flex items-center justify-between mt-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono select-none uppercase font-black tracking-wider ${stage.badgeColor}`}>
                        {statusBadgeLabel}
                      </span>
                      {stage.status === 'completed' && <span className="text-emerald-500 text-xs font-bold font-mono">✓ Done</span>}
                      {stage.status === 'active' && <span className="text-blue-500 text-xs font-bold font-sans animate-pulse">● Active</span>}
                      {stage.status === 'blocked' && <span className="text-red-500 text-xs font-black font-sans animate-bounce">⚠️ Stalled</span>}
                      {stage.status === 'pending' && <span className="text-neutral-400 text-[10px] font-semi tracking-wide font-mono">Pending</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Jobs Detail Catalog */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 space-y-4 custom-shadow-sm">
            <h3 className="text-sm font-bold uppercase text-neutral-800 border-b pb-2 tracking-wider font-sans">
              Active Job Scope Details
            </h3>

            <div className="space-y-3">
              {car.jobs.map(job => {
                let statusBadge = 'bg-neutral-100 text-neutral-500 border border-neutral-200';
                if (job.status === 'completed') statusBadge = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                else if (job.status === 'in-progress') statusBadge = 'bg-primary-100 text-primary-800 border border-primary-200';

                return (
                  <div key={job.id} className="p-3 bg-neutral-50/70 hover:bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition">
                    <div>
                      <span className="font-extrabold text-neutral-900 block">{job.title}</span>
                      <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase block mt-0.5">MECHANIC ID: {job.technicianName}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-neutral-500">
                        Work Interval: <strong className="text-neutral-700">{job.elapsedMins}</strong> / {job.durationMins} mins
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono uppercase font-extrabold tracking-wider ${statusBadge}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right column: Blocker, Approvals, Parts */}
        <div className="col-span-12 lg:col-span-12 lg:lg:col-span-5 space-y-6">
          
          {/* BLOCKING DIALOG DETAILS */}
          <div className="bg-white rounded-xl p-5 border border-neutral-250 space-y-4 custom-shadow-sm">
            <div className="flex items-center gap-2 border-b pb-2 text-neutral-900">
              <AlertOctagon className="w-5 h-5 text-critical-550" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-sans">
                Active Workshop Blockages
              </h3>
            </div>

            {car.overallStatus === 'blocked' || car.approvalPending || car.partsOnOrder ? (
              <div className="bg-critical-50/10 p-4 rounded-xl border-l-4 border-l-critical-500 border-t border-b border-r border-critical-200 space-y-3 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Active Blocker Type</span>
                  <span className="font-extrabold text-critical-700 text-xs">
                    {car.approvalPending ? 'SUPPLEMENTAL APPROVAL DISPUTE' : car.partsOnOrder ? 'OUT OF STOCK BACKLOG' : 'OPERATOR HANDICAP'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t pt-2.5 border-red-200/50">
                  <div>
                    <span className="text-[9px] text-neutral-400 block uppercase font-bold">Unblock ETA</span>
                    <span className="font-bold text-neutral-800">{car.approvalRequestedAt ? `Awaiting auth` : 'Pending dispatch'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-400 block uppercase font-bold">SLA Risk Assessment</span>
                    <span className="font-extrabold text-red-600 uppercase">Severe Breach</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center bg-gray-50 text-xs text-neutral-400 italic rounded-xl border border-dashed border-neutral-200">
                No active blockages on this vehicle. Works moving on schedule.
              </div>
            )}
          </div>

          {/* APPROVAL DECISION PANEL */}
          <div className="bg-white rounded-xl p-5 border border-neutral-200 space-y-4 custom-shadow-sm">
            <h3 className="text-sm font-bold uppercase text-neutral-800 border-b pb-2 tracking-wider font-sans">
              Supplemental Customer Approval
            </h3>

            {car.approvalPending ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-neutral-50/50 rounded-xl border border-neutral-200 text-neutral-700 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 uppercase font-bold">
                    <span>Requested: {car.approvalRequestedAt}</span>
                    <span className="bg-warning-100 text-warning-800 px-2 py-0.5 rounded border border-warning-200 font-bold">${car.approvalRequiredCost}</span>
                  </div>
                  <p className="font-bold text-neutral-800 text-[11px] leading-relaxed">
                    Additional Scope: <span className="font-medium text-neutral-600">{car.approvalRequiredWork}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onCustomerApprove(car.id)}
                    className="flex-1 bg-neutral-900 text-white font-sans uppercase font-extrabold text-[11px] tracking-wider py-2 rounded-xl hover:bg-neutral-800 shadow transition-all active:scale-95"
                  >
                    Approve Work
                  </button>
                  <button
                    onClick={() => onCustomerDecline(car.id)}
                    className="bg-white border border-neutral-300 text-neutral-600 font-sans uppercase font-bold text-[11px] py-2 px-4 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center bg-gray-50 text-xs text-neutral-400 italic rounded-xl border border-dashed border-neutral-200">
                No supplementary requests pending customer signature.
              </div>
            )}
          </div>

          {/* PARTS DEPENDENCY COMPARTMENT */}
          <div className="bg-white rounded-xl p-5 border border-neutral-250 space-y-4 custom-shadow-sm">
            <h3 className="text-sm font-bold uppercase text-neutral-800 border-b pb-2 tracking-wider font-sans">
              Component Parts Logistics
            </h3>

            {car.partsOnOrder ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex justify-between text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                    <span>Part Description</span>
                    <span>Sourcing ETA</span>
                  </div>
                  <span className="font-bold text-neutral-850 block">{car.partsOrderDescription}</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/50 border border-amber-200 px-1.5 py-0.5 rounded inline-block">Expected: {car.partsExpectedTime || '30 mins'}</span>
                </div>

                <button
                  onClick={() => onReceiveShortParts(car.id)}
                  className="w-full bg-white border-2 border-primary-700 text-primary-700 font-sans uppercase font-extrabold text-[11px] tracking-wider py-2.5 rounded-xl transition hover:bg-primary-700 hover:text-white active:scale-95 shadow-sm"
                >
                  Receive Part & Resume Work
                </button>
              </div>
            ) : (
              <div className="p-4 text-center bg-gray-50 text-xs text-neutral-400 italic rounded-xl border border-dashed border-neutral-200">
                All scheduled components pre-allocated in internal workshop stock.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
