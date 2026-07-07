import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, HelpCircle } from 'lucide-react';
import { Car } from '../types';

interface HoldingAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, time: string, reason: 'parts' | 'confirmation' | 'manual', manualReason?: string) => void;
  car: Car | null;
}

export const HoldingAreaModal: React.FC<HoldingAreaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  car
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState<'parts' | 'confirmation' | 'manual'>('parts');
  const [manualText, setManualText] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // Auto-detect suggested reason when car changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setViewDate(today);
      
      if (!time) {
        setTime('17:00');
      }
    }
    if (car) {
      if (car.holdingReason === 'manual') {
        setReason('manual');
        setManualText(car.manualBlockReason || '');
      } else if (car.approvalPending) {
        setReason('confirmation');
      } else if (car.partsOnOrder) {
        setReason('parts');
      } else {
        setReason('parts'); // Default fallback
      }
    }
  }, [car, isOpen]);

  if (!isOpen) return null;

  // Generate 24hr time slots from 07:00 to 19:00
  const timeSlots = Array.from({ length: 25 }).map((_, i) => {
    const hours = Math.floor(i / 2) + 7;
    const mins = i % 2 === 0 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${mins}`;
  });

  // Calendar helpers
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const yyyy = viewDate.getFullYear();
    const mm = String(viewDate.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
    setShowCalendar(false);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${months[monthIndex]} ${day}, ${year}`;
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const emptySlots = Array.from({ length: firstDayIndex });
  const daysArray = Array.from({ length: totalDays }).map((_, i) => i + 1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 overflow-y-auto" id="holding-area-modal">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-xl shadow-lg border border-neutral-200 w-full max-w-sm flex flex-col relative"
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-neutral-800">Move to Holding Area</h3>
                <p className="text-[11px] text-neutral-400">Specify holding reason & estimated dispatch.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-700"
              id="close-holding-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 bg-white space-y-5">
            {car && (
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wider font-mono">Selected Vehicle</span>
                <span className="text-xs font-bold text-neutral-800 font-mono">{car.plateNumber}</span>
                <span className="text-[11px] text-neutral-500 block">{car.make} {car.model} ({car.year})</span>
              </div>
            )}

            {/* Hold Reason selection */}
            <div>
              <label className="text-[11px] font-bold text-neutral-600 block mb-2 uppercase tracking-wide">
                Holding Status Reason *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="btn-reason-parts"
                  onClick={() => setReason('parts')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center justify-center gap-1 transition-all pointer-events-auto ${
                    reason === 'parts' 
                      ? 'bg-amber-50/50 border-amber-500 text-amber-800 ring-2 ring-amber-500/10' 
                      : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base">🔩</span>
                  <span>Waiting for Parts</span>
                </button>
                <button
                  type="button"
                  id="btn-reason-confirmation"
                  onClick={() => setReason('confirmation')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center justify-center gap-1 transition-all pointer-events-auto ${
                    reason === 'confirmation' 
                      ? 'bg-teal-50/50 border-teal-500 text-teal-800 ring-2 ring-teal-500/10' 
                      : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base">📝</span>
                  <span>Waiting for Confirmation</span>
                </button>
                <button
                  type="button"
                  id="btn-reason-manual"
                  onClick={() => setReason('manual')}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center flex flex-col items-center justify-center gap-1 transition-all pointer-events-auto ${
                    reason === 'manual' 
                      ? 'bg-blue-50/50 border-blue-500 text-blue-800 ring-2 ring-blue-500/10' 
                      : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-base">🔧</span>
                  <span>Manual Block</span>
                </button>
              </div>

              {reason === 'manual' && (
                <div>
                  <label className="text-[11px] font-bold text-neutral-600 block mb-2 uppercase tracking-wide">
                    Manual Reason Note *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Provide reason for blocking"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-teal-500 font-medium outline-none text-neutral-700 bg-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-600 block mb-2 uppercase tracking-wide">Estimated Pick-up Date *</label>
              <div className="relative">
                <button
                  type="button"
                  id="custom-calendar-trigger"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-teal-500 font-medium text-left text-neutral-700 bg-white relative flex items-center justify-between cursor-pointer"
                >
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-neutral-400" />
                  </span>
                  <span>{formatDateLabel(date)}</span>
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCalendar && (
                  <>
                    {/* Invisible backdrop to dismiss calendar popover on click-outside */}
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowCalendar(false)} 
                    />
                    
                    {/* Calendar Dropdown Panel */}
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl p-3.5 z-40">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-3">
                        <button 
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-[11px] font-extrabold text-neutral-800 font-sans uppercase tracking-wider">
                          {MONTHS[month]} {year}
                        </span>
                        <button 
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Weekday Labels */}
                      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <span key={day} className="text-[9px] font-bold text-neutral-400 font-mono uppercase">
                            {day}
                          </span>
                        ))}
                      </div>

                      {/* Day Grid Cells */}
                      <div className="grid grid-cols-7 gap-1">
                        {emptySlots.map((_, idx) => (
                          <div key={`empty-${idx}`} className="h-7 w-7" />
                        ))}
                        {daysArray.map(dayNum => {
                          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                          const isSelected = date === dateString;
                          
                          const today = new Date();
                          const isToday = today.getDate() === dayNum && today.getMonth() === month && today.getFullYear() === year;
                          
                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => handleSelectDay(dayNum)}
                              className={`h-7 w-7 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-teal-600 text-white shadow-xs' 
                                  : isToday 
                                    ? 'border border-teal-500 text-teal-700 hover:bg-teal-50' 
                                    : 'text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              {dayNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-600 block mb-2 uppercase tracking-wide">Estimated Pick-up Time *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-4 w-4 text-neutral-400" />
                </div>
                <select
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium outline-none text-neutral-700 bg-white cursor-pointer appearance-none"
                >
                  <option value="" disabled>Select Time Slot</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3 bg-neutral-50 px-6 p-4 rounded-b-xl">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50 transition-all cursor-pointer"
              id="cancel-holding-btn"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                const isValid = reason === 'manual' ? (date && time && manualText) : (date && time);
                if (isValid) {
                  onSubmit(date, time, reason, manualText);
                }
              }}
              disabled={reason === 'manual' ? (!date || !time || !manualText) : (!date || !time)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 shadow-sm inline-flex items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              id="confirm-holding-btn"
            >
              Confirm & Move
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
