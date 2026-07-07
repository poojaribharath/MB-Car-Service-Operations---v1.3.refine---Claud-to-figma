import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  CheckCheck, 
  Truck, 
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { Car } from '../types';

interface PartsTrackerProps {
  cars: Car[];
  onReceiveParts: (carId: string) => void;
}

export const PartsTracker: React.FC<PartsTrackerProps> = ({ cars, onReceiveParts }) => {
  const partsOrderedCars = cars.filter(c => c.partsOnOrder);

  return (
    <div id="parts-tracker-widget" className="card p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h4 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-500 animate-bounce" />
            Supplier Parts Order Status
          </h4>
          <p className="text-[11px] text-neutral-400">Track incoming components blocking open repair lines.</p>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 font-mono">
          {partsOrderedCars.length} Pending
        </span>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 wods-scroll">
        <AnimatePresence mode="popLayout">
          {partsOrderedCars.length > 0 ? (
            partsOrderedCars.map(car => (
              <motion.div
                key={car.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-lg border border-blue-200 bg-blue-50/15 space-y-2.5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500" />
                
                {/* Car Line */}
                <div className="flex justify-between items-start pl-1">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-900 leading-tight">
                      {car.make} {car.model}
                    </h5>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      Plate: {car.plateNumber} • Bay: {car.currentBayId ? car.currentBayId.replace('bay-', 'Bay ') : 'Parked'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 font-semibold font-mono rounded">
                      ETA {car.partsExpectedTime}
                    </span>
                  </div>
                </div>

                {/* Ordered components description */}
                <div className="p-2 rounded bg-white border border-blue-100 pl-3">
                  <span className="text-[9px] font-bold text-blue-800 tracking-wider block">PARTS REQUISITION</span>
                  <p className="text-xs font-medium text-neutral-700 mt-0.5">{car.partsOrderDescription}</p>
                </div>

                {/* Confirm delivery action */}
                <button
                  onClick={() => onReceiveParts(car.id)}
                  className="w-full py-1.5 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold inline-flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <CheckCheck className="w-4 h-4" /> Receive parts & Resume Job
                </button>
              </motion.div>
            ))
          ) : (
            <div className="p-8 text-center text-neutral-400 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-150">
              <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-600 font-mono">Inventory Full</p>
              <p className="text-[10px] text-neutral-400 mt-1 max-w-[200px] mx-auto">
                No active parts shortages. All jobs currently have requisite stock on hand.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
