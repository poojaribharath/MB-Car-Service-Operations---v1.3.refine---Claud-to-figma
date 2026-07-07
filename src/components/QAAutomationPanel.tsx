import React, { useState, useEffect } from 'react';
import { 
  Clock, Play, Trash2, ShieldAlert, CheckCircle, Server, RefreshCw, 
  ChevronRight, Activity, Calendar, Zap, Terminal, Info,
  Layers, DoorClosed, CheckSquare
} from 'lucide-react';
import { Car, ServiceBay, SharedResource, ActivityLogEntry, AppNotification } from '../types';
import { 
  getEnvironmentMode, isQASchedulerActive, checkAndTriggerQAAutomation, 
  getQACronLogs, addQACronLog, isServiceCenterOpen, generateFortyMockVehicles
} from '../utils/qaMockScheduler';

interface QAAutomationPanelProps {
  cars: Car[];
  setCars: React.Dispatch<React.SetStateAction<Car[]>>;
  bays: ServiceBay[];
  setBays: React.Dispatch<React.SetStateAction<ServiceBay[]>>;
  setSharedResources: React.Dispatch<React.SetStateAction<SharedResource[]>>;
  setLogs: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  currentTime: string;
  addLogEntry: (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'approval', carId?: string) => void;
}

export const QAAutomationPanel: React.FC<QAAutomationPanelProps> = ({
  cars,
  setCars,
  bays,
  setBays,
  setSharedResources,
  setLogs: setAppLogs,
  setNotifications,
  currentTime,
  addLogEntry
}) => {
  const [envMode, setEnvMode] = useState<'staging' | 'production'>(getEnvironmentMode());
  const [logs, setLogs] = useState(getQACronLogs());
  const [schedulerActive, setSchedulerActive] = useState(isQASchedulerActive());
  const [lastMorningDate, setLastMorningDate] = useState(localStorage.getItem('qa_last_morning_run_date') || 'Never');

  // Sync state on load and updates
  useEffect(() => {
    setEnvMode(getEnvironmentMode());
    setSchedulerActive(isQASchedulerActive());
  }, []);

  const refreshLogs = () => {
    setLogs(getQACronLogs());
    setLastMorningDate(localStorage.getItem('qa_last_morning_run_date') || 'Never');
  };

  const handleManualPurgeAndSeed = () => {
    const executed = checkAndTriggerQAAutomation(
      cars,
      setCars,
      bays,
      setBays,
      setSharedResources,
      setAppLogs,
      setNotifications,
      currentTime,
      addLogEntry,
      true,  // forceRunMorning
      false, // forceRunHourly
      false  // forceRunVIP
    );
    if (executed) {
      addLogEntry('[QA Automation] Manually triggered 07:50 AM Purge & 40 Vehicles Load Seeding completed successfully.', 'success');
    }
    refreshLogs();
  };

  const handleManualHourlyFriction = () => {
    const executed = checkAndTriggerQAAutomation(
      cars,
      setCars,
      bays,
      setBays,
      setSharedResources,
      setAppLogs,
      setNotifications,
      currentTime,
      addLogEntry,
      false, // forceRunMorning
      true,  // forceRunHourly
      false  // forceRunVIP
    );
    if (executed) {
      addLogEntry('[QA Automation] Manually triggered Hourly Friction roadblock loop (Parts delay + Approval holds).', 'success');
    } else {
      addLogEntry('[QA Automation] Cannot trigger friction: Make sure there are active, non-blocked vehicles in bays.', 'warning');
    }
    refreshLogs();
  };

  const handleManualVIPInjection = () => {
    const executed = checkAndTriggerQAAutomation(
      cars,
      setCars,
      bays,
      setBays,
      setSharedResources,
      setAppLogs,
      setNotifications,
      currentTime,
      addLogEntry,
      false, // forceRunMorning
      false, // forceRunHourly
      true   // forceRunVIP
    );
    if (executed) {
      addLogEntry('[QA Automation] Manually injected Emergency / VIP vehicle into the system.', 'success');
    }
    refreshLogs();
  };

  const handleManualPurge = () => {
    // Purge staging vehicles & reset system to clean slate
    setBays(prev => prev.map(b => ({ ...b, currentCarId: null, becameFreeAt: null })));
    setSharedResources(prev => prev.map(sr => ({ ...sr, currentCarId: null, queue: [] })));
    setCars([]);
    setAppLogs([]);
    setNotifications([]);
    
    addLogEntry('[QA Automation] Manual purge completed: completely wiped active fleet, timelines, logs, and notification queue.', 'warning');

    addQACronLog({
      simulatedTime: currentTime,
      status: 'CLEANUP',
      message: `Manually executed active database slate wipe. Purged all vehicle cards, logs, and notification records.`,
      environment: envMode
    });

    refreshLogs();
  };

  const handleEnvironmentToggle = (mode: 'staging' | 'production' | 'auto') => {
    if (mode === 'auto') {
      localStorage.removeItem('qa_env_override');
    } else {
      localStorage.setItem('qa_env_override', mode);
    }
    const nextMode = getEnvironmentMode();
    setEnvMode(nextMode);
    setSchedulerActive(isQASchedulerActive());
    addLogEntry(`[QA Automation] Environment mode updated to ${nextMode.toUpperCase()}${mode === 'auto' ? ' (Auto-detected)' : ' (Manual Override)'}.`, 'info');
    refreshLogs();
  };

  const handleResetLocks = () => {
    localStorage.removeItem('qa_last_morning_run_date');
    localStorage.removeItem('qa_last_friction_hour');
    localStorage.removeItem('qa_last_vip_time');
    addLogEntry('[QA Automation] Simulation and cron safety locks successfully reset.', 'info');
    refreshLogs();
  };

  const occupiedBaysCount = cars.filter(c => c.currentBayId !== null).length;
  const isCenterOpen = isServiceCenterOpen(currentTime);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" id="qa-automation-dashboard">
      
      {/* 1. Header Banner & Status Badge */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 custom-shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-linear-to-l from-teal-50/20 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-900 text-teal-400 flex items-center justify-center border border-neutral-850 shadow-inner">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-neutral-900 tracking-tight">QA Load-Testing & DevOps Control Console</h2>
                <span className="text-[10px] font-mono font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-lg border border-neutral-300 bg-neutral-50 text-neutral-500">
                  STRESS-PROFILE-v2
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                Designated testing command center. Manages the active workshop load-testing simulation profile, schedules morning injections, triggers friction bottlenecks, and manages target environments.
              </p>
            </div>
          </div>

          {/* Environment Status Badge */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-[10px] font-mono text-neutral-400 text-right font-extrabold uppercase tracking-wider mb-1">
              Active Environment Mode
            </span>
            {envMode === 'staging' ? (
              <div className="bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black animate-pulse">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <span>ENABLED (STAGING/TESTING)</span>
              </div>
            ) : (
              <div className="bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>DISABLED (PRODUCTION)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1B. Operational Status Indicator Banner */}
      <div className={`border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${
        isCenterOpen 
          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
          : 'bg-red-50/50 border-red-200 text-red-900'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`p-3 rounded-xl shrink-0 ${isCenterOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {isCenterOpen ? <CheckSquare className="w-6 h-6" /> : <DoorClosed className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-tight">
                Service Center Operational Status: {isCenterOpen ? 'OPEN' : 'CLOSED'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isCenterOpen ? 'bg-emerald-150 text-emerald-800' : 'bg-red-150 text-red-800'
              }`}>
                {currentTime}
              </span>
            </div>
            <p className="text-xs mt-1 opacity-90 leading-relaxed max-w-2xl">
              {isCenterOpen 
                ? 'Standard operation hours are active (08:00 to 20:00). Simulated clocks, service technician assignments, and workflow progress are active.'
                : 'The Service Center closes daily in the evening at 08:00 PM (20:00) and re-opens at 08:00 AM. Simulated time clocks can still be advanced, but active jobs are paused until morning.'}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-start md:items-end bg-white/65 px-4 py-2.5 rounded-xl border border-black/[0.06] text-xs">
          <span className="font-mono text-[10px] text-neutral-450 uppercase font-extrabold tracking-wider">Active Bays Load</span>
          <span className="text-neutral-900 font-extrabold mt-0.5">{occupiedBaysCount} of 8 Bays Occupied</span>
          <span className="text-[10px] text-neutral-500 mt-0.5">
            {occupiedBaysCount >= 6 ? '🔴 HEAVY LOAD' : occupiedBaysCount >= 3 ? '🟡 MEDIUM LOAD' : '🟢 LIGHT LOAD'}
          </span>
        </div>
      </div>

      {/* 2. Key Metrics & Cron State */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Cron Configuration */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 custom-shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-455 font-extrabold uppercase tracking-wider font-mono">Job Schedule Details</span>
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-neutral-900">07:50 AM</div>
            <p className="text-xs text-neutral-400 mt-1 font-sans">Triggered when simulated clock reaches exactly 07:50 AM</p>
          </div>
          <div className="border-t border-neutral-100 pt-3 mt-4 flex justify-between items-center text-[10.5px]">
            <span className="text-neutral-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-400" /> Auto-Purge Interval
            </span>
            <span className="text-teal-700 font-bold bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">Every Morning</span>
          </div>
        </div>

        {/* Metric 2: Target Data Batch */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 custom-shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-455 font-extrabold uppercase tracking-wider font-mono">Payload Size</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black font-mono text-neutral-900">
              40 Vehicles
            </div>
            <p className="text-xs text-neutral-400 mt-1 font-sans">
              Wipes yesterday's fleet & creates 40 new mock vehicles simultaneously
            </p>
          </div>
          <div className="border-t border-neutral-100 pt-3 mt-4 flex justify-between items-center text-[10.5px]">
            <span className="text-neutral-500 font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3 text-neutral-400" /> Fleet Distribution
            </span>
            <span className="text-teal-700 font-bold bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">8 Active / 32 Queued</span>
          </div>
        </div>

        {/* Metric 3: Latest Scheduler Run */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 custom-shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-neutral-455 font-extrabold uppercase tracking-wider font-mono">Last Run Status</span>
            <Server className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-4">
            <div className="text-sm font-black font-mono text-neutral-850 truncate">Date: {lastMorningDate}</div>
            <p className="text-xs text-neutral-400 mt-1 font-sans">Simulated Time: 07:50 AM</p>
          </div>
          <div className="border-t border-neutral-100 pt-3 mt-4 flex justify-between items-center text-[10.5px]">
            <span className="text-neutral-500 font-semibold flex items-center gap-1">
              <Info className="w-3 h-3 text-neutral-400" /> Run Restriction
            </span>
            <span className={`font-bold px-1.5 py-0.5 rounded-md ${schedulerActive ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-800'}`}>
              {schedulerActive ? 'Staging Locked' : 'Production Idle'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Interactive Actions & Active Simulation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Interactive Actions Panel */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl p-5 custom-shadow-sm space-y-5">
          <h3 className="text-xs font-mono font-extrabold text-neutral-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" /> Interactive Actions Panel
          </h3>

          <div className="space-y-4">
            {/* Environment Selector */}
            <div>
              <label className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Environment Override Selector
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                <button
                  onClick={() => handleEnvironmentToggle('staging')}
                  className={`py-1.5 text-[9.5px] font-extrabold uppercase rounded-lg transition-all text-center cursor-pointer ${
                    localStorage.getItem('qa_env_override') === 'staging'
                      ? 'bg-white border border-neutral-200 text-teal-700 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
                  }`}
                >
                  Staging
                </button>
                <button
                  onClick={() => handleEnvironmentToggle('production')}
                  className={`py-1.5 text-[9.5px] font-extrabold uppercase rounded-lg transition-all text-center cursor-pointer ${
                    localStorage.getItem('qa_env_override') === 'production'
                      ? 'bg-white border border-neutral-200 text-red-700 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
                  }`}
                >
                  Prod
                </button>
                <button
                  onClick={() => handleEnvironmentToggle('auto')}
                  className={`py-1.5 text-[9.5px] font-extrabold uppercase rounded-lg transition-all text-center cursor-pointer ${
                    !localStorage.getItem('qa_env_override')
                      ? 'bg-white border border-neutral-200 text-neutral-800 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
                  }`}
                >
                  Auto
                </button>
              </div>
            </div>

            <div className="border-t border-neutral-100 my-2" />

            {/* Test Automation Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleManualPurgeAndSeed}
                className="w-full flex items-center justify-between text-left p-3 bg-neutral-950 hover:bg-neutral-900 text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 border border-neutral-950"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                    <Play className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold tracking-tight block">Simulate 07:50 AM Init</span>
                    <span className="text-[9.5px] text-neutral-400 font-sans block mt-0.5">Pre-Clean slate & inject 40 fleet vehicles</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </button>

              <button
                onClick={handleManualHourlyFriction}
                className="w-full flex items-center justify-between text-left p-3 bg-amber-550 hover:bg-amber-600 text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 border border-amber-550"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/15 text-white">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold tracking-tight block">Simulate Hourly Roadblocks</span>
                    <span className="text-[9.5px] text-amber-100 font-sans block mt-0.5">Set 1 Parts Delay & 1 Approval Hold</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-200" />
              </button>

              <button
                onClick={handleManualVIPInjection}
                className="w-full flex items-center justify-between text-left p-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 border border-indigo-650"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/15 text-white">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold tracking-tight block">Inject Emergency / VIP Car</span>
                    <span className="text-[9.5px] text-indigo-100 font-sans block mt-0.5">Bypasses standard queue; sits at very top</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-200" />
              </button>

              <button
                onClick={handleManualPurge}
                className="w-full flex items-center justify-between text-left p-3 bg-white border border-red-200 hover:bg-red-50/30 text-red-800 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold tracking-tight block">Purge All Active States</span>
                    <span className="text-[9.5px] text-red-600/70 font-sans block mt-0.5">Completely wipe database slate</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </button>

              <button
                onClick={handleResetLocks}
                className="w-full flex items-center justify-between text-left p-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-600">
                    <RefreshCw className="w-3.5 h-3.5 animate-hover" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold tracking-tight block">Reset Run Safety Locks</span>
                    <span className="text-[9.5px] text-neutral-450 font-sans block mt-0.5">Clear schedule markers in localStorage</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Active Load Profile Overview */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-2xl p-5 custom-shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-mono font-extrabold text-neutral-800 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" /> Load-Testing Active Profile
              </h3>
              <span className="text-[10px] font-mono text-neutral-400 font-extrabold">STAGING ONLY</span>
            </div>

            {/* Profile Specifics Description */}
            <div className="mt-4 space-y-4">
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-650 space-y-3">
                <div className="flex items-center gap-1.5 font-extrabold text-neutral-800">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Rule 1: Daily Initialization & Pre-Clean (07:50 AM)</span>
                </div>
                <p className="leading-relaxed text-[11px] pl-5">
                  Wipes all active job details, tracking timelines (logs), and historical cards from previous sessions before starting. Inject 40 fleet vehicles simultaneously, occupying all 8 General Service Bays instantly with active tasks, routing 32 vehicles to the waitlist queue.
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-650 space-y-3">
                <div className="flex items-center gap-1.5 font-extrabold text-neutral-800">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Rule 2: Hourly Micro-Bottleneck Friction Loops</span>
                </div>
                <p className="leading-relaxed text-[11px] pl-5">
                  Triggers automatically on the hour (starting at 09:00 AM up to 07:00 PM). Picks 1 active bay vehicle and blocks it due to <strong>Parts Missing</strong>, and picks another active bay vehicle to lock on <strong>Approval Required</strong> status to simulate real-world shop friction.
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-650 space-y-3">
                <div className="flex items-center gap-1.5 font-extrabold text-neutral-800">
                  <ShieldAlert className="w-4 h-4 text-indigo-500" />
                  <span>Rule 3: Periodic Emergency & VIP Injections</span>
                </div>
                <p className="leading-relaxed text-[11px] pl-5">
                  Systematically injects 2 to 3 new vehicles during the shift (at 10:30 AM, 02:30 PM, and 04:30 PM). These bypass standard queue priorities. If a bay slot is open, they fill it; if not, they are placed at the absolute top of the waitlist queue.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-neutral-100 flex items-center gap-2 text-[11px] text-neutral-450 italic leading-tight">
            <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>Simulation runs purely in the browser staging environment. Standard configurations (Technicians & Bays list) are preserved safely.</span>
          </div>
        </div>

      </div>

      {/* 4. Execution Logs */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 custom-shadow-sm">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-xs font-mono font-extrabold text-neutral-800 uppercase tracking-widest flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-600" /> Scheduler Execution Logs
          </h3>
          <button 
            onClick={refreshLogs} 
            className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase text-neutral-500 hover:text-neutral-900 cursor-pointer bg-neutral-50 hover:bg-neutral-100 border px-2.5 py-1 rounded-xl transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh logs</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 border border-dashed border-neutral-150 rounded-xl italic text-xs font-sans">
            No execution logs found. Simulated runs or automated cron schedules will populate execution records here.
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 font-bold">
                  <th className="py-2.5 font-mono text-[10px] uppercase">Timestamp</th>
                  <th className="py-2.5 font-mono text-[10px] uppercase">Simulated Time</th>
                  <th className="py-2.5 font-mono text-[10px] uppercase">Status</th>
                  <th className="py-2.5 font-mono text-[10px] uppercase">Active Env</th>
                  <th className="py-2.5 font-mono text-[10px] uppercase">Execution details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50">
                    <td className="py-3 font-mono text-neutral-500 text-[10.5px]">{log.timestamp}</td>
                    <td className="py-3 font-mono text-neutral-600 font-extrabold">{log.simulatedTime}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-extrabold uppercase ${
                        log.status === 'SUCCESS' 
                          ? 'bg-teal-50 border border-teal-200 text-teal-800'
                          : log.status === 'CLEANUP'
                          ? 'bg-amber-50 border border-amber-200 text-amber-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-neutral-500 uppercase text-[10px]">{log.environment}</td>
                    <td className="py-3 text-neutral-650 font-medium text-[11px]">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
