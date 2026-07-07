import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Car as CarIcon, 
  User, 
  Phone, 
  Clock, 
  Plus, 
  Trash2, 
  AlertCircle,
  Hash,
  Database
} from 'lucide-react';
import { ServiceBay, Car, ServiceJob } from '../types';
import { STAFF_ROSTER } from '../data';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  bays: ServiceBay[];
  onAddCar: (newCar: Omit<Car, 'id'>) => void;
  initialTime: string;
  carsCount: number;
}

const PRESET_JOBS = [
  { title: 'Standard Oil & Filter Service', duration: 30, cost: 95 },
  { title: 'Electrical System Diagnostics', duration: 45, cost: 120 },
  { title: 'Front Brake Pads Replacement', duration: 60, cost: 180 },
  { title: 'Wheel Alignment Tuning', duration: 45, cost: 129, sharedResource: 'alignment' },
  { title: 'Full Detailing & Body Wash', duration: 25, cost: 50, sharedResource: 'wash' },
  { title: 'Spark Plug Assembly Check', duration: 90, cost: 240 },
  { title: 'Multi-point Safety Inspection', duration: 30, cost: 75 }
];

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  bays,
  onAddCar,
  initialTime,
  carsCount
}) => {
  // Fields state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [plateNumber, setPlateNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promisedTime, setPromisedTime] = useState('18:00');
  const [selectedBayId, setSelectedBayId] = useState<string>(''); // empty means "Stage Lane / Park outside"
  const [technician, setTechnician] = useState('Sarah Patel');
  
  // Custom job entries
  const [addedJobs, setAddedJobs] = useState<Omit<ServiceJob, 'id' | 'elapsedMins' | 'status'>[]>([
    { title: 'Multi-point Safety Inspection', durationMins: 30, technicianName: 'Sarah Patel', cost: 75 }
  ]);

  const [customTitle, setCustomTitle] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [customCost, setCustomCost] = useState<number>(95);

  const [error, setError] = useState('');

  const handleAddPresetJob = (preset: typeof PRESET_JOBS[0]) => {
    setAddedJobs(prev => [
      ...prev,
      {
        title: preset.title,
        durationMins: preset.duration,
        technicianName: technician,
        cost: preset.cost
      }
    ]);
  };

  const handleAddCustomJob = () => {
    if (!customTitle) return;
    setAddedJobs(prev => [
      ...prev,
      {
        title: customTitle,
        durationMins: customDuration,
        technicianName: technician,
        cost: customCost
      }
    ]);
    setCustomTitle('');
  };

  const handleRemoveJob = (index: number) => {
    setAddedJobs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (carsCount >= 40) {
      setError('Service Centre Capacity Exceeded! Today\'s intake maximum limit of 40 vehicles has been reached.');
      return;
    }
    if (!make || !model || !plateNumber || !customerName || !customerPhone || !promisedTime) {
      setError('Please fill in all mandatory mechanical and client fields.');
      return;
    }

    if (addedJobs.length === 0) {
      setError('Please designate at least one initial service repair job/task.');
      return;
    }

    // Assemble jobs
    const jobs: ServiceJob[] = addedJobs.map((j, idx) => ({
      ...j,
      id: `job-added-${Date.now()}-${idx}`,
      elapsedMins: 0,
      status: (selectedBayId && idx === 0) ? ('in-progress' as const) : ('pending' as const)
    }));

    // Find if the jobs need a shared resource right away
    const needsAlignment = jobs.some(j => j.title.toLowerCase().includes('align'));
    const needsWash = jobs.some(j => j.title.toLowerCase().includes('wash') || j.title.toLowerCase().includes('detail'));

    onAddCar({
      make,
      model,
      year: year || 2020,
      plateNumber: plateNumber.toUpperCase(),
      customerName,
      customerPhone,
      promisedTime,
      promisedDateTime: `2026-06-17T${promisedTime}:00`,
      overallStatus: 'healthy', // Default healthy initialization
      currentBayId: selectedBayId || null,
      jobs,
      approvalPending: false,
      approvalRequestedAt: null,
      approvalRequiredWork: null,
      approvalRequiredCost: null,
      approvalContactLogged: false,
      partsOnOrder: false,
      partsOrderDescription: null,
      partsExpectedTime: null,
      sharedResourceRequest: needsAlignment ? 'alignment' : needsWash ? 'wash' : 'none',
      sharedResourceStatus: (needsAlignment || needsWash) ? 'queued' : 'none'
    });

    // Reset fields
    setMake('');
    setModel('');
    setYear(new Date().getFullYear());
    setPlateNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setPromisedTime('18:00');
    setSelectedBayId('');
    setAddedJobs([{ title: 'Multi-point Safety Inspection', durationMins: 30, technicianName: 'Sarah Patel', cost: 75 }]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-xl shadow-lg border border-neutral-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div className="flex items-center gap-2">
              <CarIcon className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-neutral-800">Register New Intake Vehicle</h3>
                <p className="text-[11px] text-neutral-400">Log customer instructions and assign a workload bay.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Vehicle & Customer */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pb-1 border-b">Vehicle Specs & Identification</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Make *</label>
                    <input 
                      type="text" placeholder="e.g. Mercedes-Benz" required
                      value={make} onChange={e => setMake(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-neutral-200 outline-none focus:border-teal-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Model *</label>
                    <input 
                      type="text" placeholder="e.g. C300" required
                      value={model} onChange={e => setModel(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-neutral-200 outline-none focus:border-teal-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Model Year</label>
                    <input 
                      type="number" placeholder="2020"
                      value={year} onChange={e => setYear(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded border border-neutral-200 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Plate Number *</label>
                    <input 
                      type="text" placeholder="e.g. STR-77X" required
                      value={plateNumber} onChange={e => setPlateNumber(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-neutral-200 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pt-2 pb-1 border-b">Customer Contact & Dispatch</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Owner Name *</label>
                    <input 
                      type="text" placeholder="e.g. Jack Ryan" required
                      value={customerName} onChange={e => setCustomerName(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-neutral-200 outline-none focus:border-teal-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Owner Phone *</label>
                    <input 
                      type="text" placeholder="e.g. +1 (555) 012-3456" required
                      value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-neutral-200 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Promised Dispatch *</label>
                    <input 
                      type="text" placeholder="Time e.g. 17:30" required
                      value={promisedTime} onChange={e => setPromisedTime(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-neutral-200 outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Floor Assignment</label>
                    <select
                      value={selectedBayId} onChange={e => setSelectedBayId(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-neutral-200 outline-none focus:border-teal-500 cursor-pointer font-medium text-neutral-700"
                    >
                      <option value="">Stage outside (Secondary Staging)</option>
                      {bays.map(b => (
                        <option key={b.id} value={b.id} disabled={b.currentCarId !== null}>
                          {b.name} {b.currentCarId ? '— (OCCUPIED)' : '— (VACANT)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Work Order Tasks */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pb-1 border-b">Repair Work Order</h4>

                {/* Added Jobs Listing */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto border border-neutral-150 p-2.5 rounded-lg bg-neutral-50 wods-scroll">
                  {addedJobs.map((j, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-white p-2 border border-neutral-200 rounded">
                      <div>
                        <p className="font-semibold text-neutral-800">{j.title}</p>
                        <p className="text-[10px] text-neutral-400">Est: {j.durationMins} mins • Tech: {j.technicianName} • ₹{j.cost}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveJob(idx)}
                        className="text-neutral-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Technician Picker for new jobs */}
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Assigned Technician</label>
                  <select
                    value={technician} onChange={e => setTechnician(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-neutral-200 outline-none font-medium cursor-pointer"
                  >
                    {STAFF_ROSTER.map(tech => (
                      <option key={tech.id} value={tech.name}>
                        {tech.name} ({tech.level} Level)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preset Fast additions */}
                <div>
                  <label className="text-[10px] font-bold text-neutral-400 tracking-wider block mb-1.5">PRESETS QUICK-ADD</label>
                  <div className="flex flex-wrap gap-1.5 select-none">
                    {PRESET_JOBS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPresetJob(preset)}
                        className="p-1 px-1.5 text-[10px] bg-white border border-neutral-200 text-neutral-700 rounded-md hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-all font-medium"
                      >
                        + {preset.title} (₹{preset.cost})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Task Addition Form */}
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-150 space-y-3.5">
                  <span className="text-[10px] font-bold text-neutral-500 block">CREATE CUSTOM SERVICES</span>
                  <div>
                    <input 
                      type="text" placeholder="Title of custom job service task..."
                      value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                      className="w-full text-xs p-2 rounded border border-neutral-200 bg-white outline-none focus:border-teal-500 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input 
                        type="number" placeholder="Duration (min)"
                        value={customDuration || ''} onChange={e => setCustomDuration(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded border border-neutral-200 bg-white outline-none font-mono"
                      />
                    </div>
                    <div>
                      <input 
                        type="number" placeholder="Cost (₹)"
                        value={customCost || ''} onChange={e => setCustomCost(Number(e.target.value))}
                        className="w-full text-xs p-2 rounded border border-neutral-200 bg-white outline-none font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomJob}
                    className="w-full py-1.5 bg-neutral-800 text-white rounded text-xs font-semibold hover:bg-neutral-900 inline-flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Append Custom Work Task
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions Form */}
            <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50 -mx-6 -mb-6 p-4">
              {carsCount >= 40 ? (
                <span className="text-[11px] font-bold text-critical-600 bg-critical-50 border border-critical-200 px-3 py-1.5 rounded-lg select-none uppercase tracking-wide">
                  ⚠️ INFLOW CAPACITY LOCKED (MAX 40 REACHED)
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-neutral-500 font-sans">
                  Current Inflow: <strong className="text-neutral-800">{carsCount}</strong> / 40 Daily Limit
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={carsCount >= 40}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-bold shadow-sm inline-flex items-center gap-1 transition-all ${
                    carsCount >= 40 
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-70 border-neutral-200' 
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  <Database className="w-4 h-4" /> Finalize Intake Record
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
