import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneCall, 
  Check, 
  X, 
  MessageSquare, 
  UserCheck, 
  UserX,
  Clock,
  DollarSign
} from 'lucide-react';
import { Car } from '../types';

interface CustomerApprovalListProps {
  cars: Car[];
  onApproveWork: (carId: string) => void;
  onRejectWork: (carId: string) => void;
  onLogContact: (carId: string) => void;
}

export const CustomerApprovalList: React.FC<CustomerApprovalListProps> = ({
  cars,
  onApproveWork,
  onRejectWork,
  onLogContact
}) => {
  const pendingApprovals = cars.filter(c => c.approvalPending);

  return (
    <div id="customer-approval-list-widget" className="card p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-warning-500 animate-pulse" />
            Customer Approvals & Contacts
          </h4>
          <p className="text-[11px] text-neutral-400">Track pending authorizations for supplementary work found.</p>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-warning-50 text-warning-700 font-mono">
          {pendingApprovals.length} Needed
        </span>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 wods-scroll">
        <AnimatePresence mode="popLayout">
          {pendingApprovals.length > 0 ? (
            pendingApprovals.map(car => (
              <motion.div
                key={car.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-3 rounded-lg border border-warning-200 bg-warning-50/15 space-y-3 relative overflow-hidden"
              >
                {/* Visual side accent */}
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-warning-500" />
                
                {/* Header info */}
                <div className="flex justify-between items-start pl-1">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-900 leading-tight">
                      {car.make} {car.model} — {car.plateNumber}
                    </h5>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      Owner: {car.customerName} ({car.customerPhone})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      Req at {car.approvalRequestedAt}
                    </p>
                  </div>
                </div>

                {/* Proposed Work detail card */}
                <div className="p-2.5 rounded bg-amber-50/50 border border-amber-100 pl-3">
                  <span className="text-[9px] font-bold text-amber-800 tracking-wider block">PROPOSED EXTRA WORK</span>
                  <p className="text-xs font-semibold text-neutral-800 mt-0.5">{car.approvalRequiredWork}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-900 font-bold">
                    <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                    Estimate: ${car.approvalRequiredCost}
                  </div>
                </div>

                {/* Contact Log Status */}
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${car.approvalContactLogged ? 'bg-success-500' : 'bg-red-500'}`} />
                    <span className="text-[11px] text-neutral-500 font-medium">
                      {car.approvalContactLogged 
                        ? 'Contact Logged (Waiting on callback)' 
                        : 'Customer not yet contacted! Delay risk!'}
                    </span>
                  </div>

                  {!car.approvalContactLogged && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onLogContact(car.id)}
                      className="px-2 py-1 text-[10px] bg-sky-50 text-sky-700 border border-sky-200 rounded font-bold inline-flex items-center gap-1 transition-all"
                    >
                      <MessageSquare className="w-3 h-3" /> Log Call/SMS
                    </motion.button>
                  )}
                </div>

                {/* Decision Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onApproveWork(car.id)}
                    className="w-full py-1.5 px-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-bold inline-flex items-center justify-center gap-1 shadow-xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Customer Approved (Yes)
                  </button>
                  <button
                    onClick={() => onRejectWork(car.id)}
                    className="w-full py-1.5 px-3 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" /> Declined (No)
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-neutral-400 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-150">
              <PhoneCall className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-600">No Pending Approvals</p>
              <p className="text-[10px] text-neutral-400 mt-1 max-w-[200px] mx-auto">
                Excellent! All discovered extra work has been authorized or processed already. No delays on hold.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
