import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getCarRiskStatus } from './lib/utils';
import { 
  Wrench, 
  Clock, 
  Plus, 
  Search, 
  SlidersHorizontal,
  Home,
  LayoutGrid,
  FileText,
  Truck,
  CheckSquare,
  Calendar,
  History,
  AlertCircle,
  ChevronLeft,
  Settings,
  GripVertical,
  Sliders,
  RefreshCw,
  Compass,
  ShieldAlert,
  BarChart3,
  Users,
  Sparkles,
  Menu,
  X,
  Bell,
  Trash2,
  CheckCheck,
  ChevronRight,
  Zap,
  Activity,
  Palette,
  CheckCircle2,
  Terminal
} from 'lucide-react';

import { Car, ServiceBay, SharedResource, ActivityLogEntry, AppNotification, EodReport } from './types';
import { INITIAL_CARS, INITIAL_BAYS, INITIAL_SHARED_RESOURCES, INITIAL_LOGS, STAFF_ROSTER } from './data';
import { ServiceBayCard } from './components/ServiceBayCard';
import { SharedResourceCard } from './components/SharedResourceCard';
import { NewJobModal } from './components/NewJobModal';
import { VehicleDetailModal } from './components/VehicleDetailModal';
import { ManagerDashboard } from './components/ManagerDashboard';

// Import QA mock scheduler and component
import { checkAndTriggerQAAutomation, calculateActiveMinsAdvanced, isServiceCenterOpen, calculateEodReport } from './utils/qaMockScheduler';
import { QAAutomationPanel } from './components/QAAutomationPanel';

// Import newly created pages for desensitized layout control
import { VehicleOperationsBoard } from './components/VehicleOperationsBoard';
import { VehicleDetailView } from './components/VehicleDetailView';
import { BayManagement } from './components/BayManagement';
import { ApprovalCenter } from './components/ApprovalCenter';
import { PartsDependencyCenter } from './components/PartsDependencyCenter';
import { AlignmentQueueView } from './components/AlignmentQueueView';
import { WashBayQueueView } from './components/WashBayQueueView';
import { MechanicWorkloadView } from './components/MechanicWorkloadView';
import { DailyOperationsReview } from './components/DailyOperationsReview';
import { SystemAlertsRiskCenter } from './components/SystemAlertsRiskCenter';
import { DesignSystemShowcase } from './components/DesignSystemShowcase';
import { MechanicAllocationModal } from './components/MechanicAllocationModal';
import { HoldingAreaModal } from './components/HoldingAreaModal';

import { NotificationDropdown } from './components/NotificationDropdown';
import { NotificationCentre } from './components/NotificationCentre';
import { cn, isPartsEtaTooLong } from './lib/utils';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    title: 'SLA Breach Risk',
    message: 'Vehicle ABC-123 is 15 minutes away from promised handback. Final washing not started.',
    timestamp: '16:45',
    severity: 'danger',
    category: 'operational',
    read: false,
    isActionable: true,
    status: 'active'
  },
  {
    id: '2',
    title: 'New Approval Received',
    message: 'John Doe has approved the supplementary brake pad replacement for XYZ-789.',
    timestamp: '16:30',
    severity: 'info',
    category: 'approval',
    read: false,
    isActionable: false,
    status: 'active'
  },
  {
    id: '3',
    title: 'Parts Delayed',
    message: 'Transmission sensor for QWE-456 expected in 2 hours. Supplier delivery ETA shifted.',
    timestamp: '15:10',
    severity: 'warning',
    category: 'parts',
    read: true,
    isActionable: true,
    status: 'active'
  },
  {
    id: '4',
    title: 'System Maintenance',
    message: 'Automated CRM sync will occur at 20:00. Expect 5 minute write latency.',
    timestamp: '14:00',
    severity: 'info',
    category: 'system',
    read: true,
    isActionable: false,
    status: 'resolved'
  },
  {
    id: '5',
    title: 'Bay 4 Blocked',
    message: 'Oil spill detected in Bay 4. Cleaning required before next unit.',
    timestamp: '13:45',
    severity: 'warning',
    category: 'operational',
    read: true,
    isActionable: true,
    status: 'resolved'
  }
];

interface ToastNotificationItemProps {
  toast: {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    timestamp: string;
    isPushAlert?: boolean;
    targetBay?: string;
  };
  onClose: () => void;
}

const ToastNotificationItem: React.FC<ToastNotificationItemProps> = ({ toast, onClose }) => {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Only auto-close info/success severity notifications (after 5 seconds).
    // Critical and warning alerts require manual dismissal so they are not missed.
    const isInfoLike = toast.severity === 'info' || (toast.severity as string) === 'success';
    if (!isInfoLike) {
      return;
    }
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.severity, toast.id]);

  useEffect(() => {
    // Play sweet synthetic double alert chime if it is a major push alarm or critical delay alert
    if (toast.isPushAlert || toast.severity === 'critical') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const playBeep = (freq: number, delayMs: number, durationMs: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const scheduleTime = ctx.currentTime + (delayMs / 1000);
            const stopTime = scheduleTime + (durationMs / 1000);
            
            osc.frequency.setValueAtTime(freq, scheduleTime);
            gain.gain.setValueAtTime(0.08, scheduleTime);
            gain.gain.exponentialRampToValueAtTime(0.001, stopTime);
            
            osc.start(scheduleTime);
            osc.stop(stopTime);
          };
          
          // Double alert beep sequence
          playBeep(987.77, 0, 100); // B5 note
          playBeep(987.77, 180, 200);
        }
      } catch (e) {
        console.warn('Silent fallback: AudioContext playback is restricted or blocked.', e);
      }
    }
  }, [toast.id, toast.isPushAlert, toast.severity]);

  const severityStyles = {
    critical: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-orange-50 border-orange-200 text-orange-900',
    info: 'bg-cyan-50 border-cyan-200 text-cyan-900'
  };

  const badgeStyles = {
    critical: 'bg-red-600 text-white',
    warning: 'bg-orange-500 text-white',
    info: 'bg-cyan-600 text-white'
  };

  const isPush = toast.isPushAlert || toast.title.includes('PUSH') || toast.title.includes('Manager');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: 80, transition: { duration: 0.2 } }}
      className={cn(
        "p-4 rounded-xl border shadow-lg flex items-start gap-3 w-80 sm:w-[410px] select-none transition-all duration-300",
        isPush 
          ? "bg-red-50/95 border-red-500 border-2 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-4 ring-red-500/10 animate-shake"
          : severityStyles[toast.severity] || severityStyles.info
      )}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <span className={cn(
            "text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full",
            isPush ? "bg-red-700 text-white animate-pulse" : badgeStyles[toast.severity]
          )}>
            {isPush ? '🚨 PUSH NOTIFICATION (MANAGER ALERT)' : toast.severity}
          </span>
          <span className={cn("text-[10px] font-bold font-mono", isPush ? "text-red-700" : "text-neutral-450")}>
            {toast.timestamp}
          </span>
        </div>
        <h4 className={cn("text-[13px] font-bold font-sans tracking-tight", isPush ? "text-red-900 font-extrabold" : "")}>
          {toast.title}
        </h4>
        <p className={cn("text-[11.5px] font-medium leading-relaxed mt-1.5", isPush ? "text-red-850" : "text-neutral-600")}>
          {toast.description}
        </p>
        {isPush && toast.targetBay && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-[9px] font-mono font-bold bg-red-100 border border-red-200 text-red-700 px-1.5 py-0.5 rounded uppercase">
              Slot: {toast.targetBay}
            </span>
            <span className="text-[9.5px] font-sans font-semibold text-red-700 animate-pulse">
              ⚠️ Immediate Manager Intervention Required
            </span>
          </div>
        )}
      </div>
      <button 
        onClick={onClose}
        className={cn(
          "p-1 rounded-lg transition-transform hover:scale-[1.08] cursor-pointer",
          isPush ? "text-red-500 hover:text-red-800" : "text-neutral-450 hover:text-neutral-700"
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default function App() {
  // --- STATE PERSISTENCE ---
  const [cars, setCars] = useState<Car[]>(() => {
    const saved = localStorage.getItem('mb_cars_v4');
    return saved ? JSON.parse(saved) : INITIAL_CARS;
  });

  const [bays, setBays] = useState<ServiceBay[]>(() => {
    const saved = localStorage.getItem('mb_bays_v4');
    return saved ? JSON.parse(saved) : INITIAL_BAYS;
  });

  const [sharedResources, setSharedResources] = useState<SharedResource[]>(() => {
    const saved = localStorage.getItem('mb_shared_resources_v4');
    return saved ? JSON.parse(saved) : INITIAL_SHARED_RESOURCES;
  });

  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => {
    const saved = localStorage.getItem('mb_logs_v4');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [currentTime, setCurrentTime] = useState<string>(() => {
    return localStorage.getItem('mb_time_v4') || '14:30';
  });

  const [currentDay, setCurrentDay] = useState<number>(() => {
    const saved = localStorage.getItem('mb_current_day_v5');
    return saved ? parseInt(saved) : 1;
  });

  const [eodReports, setEodReports] = useState<EodReport[]>(() => {
    const saved = localStorage.getItem('mb_eod_reports_v5');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mb_current_day_v5', String(currentDay));
  }, [currentDay]);

  useEffect(() => {
    localStorage.setItem('mb_eod_reports_v5', JSON.stringify(eodReports));
  }, [eodReports]);


  // UI state
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [profilerCarId, setProfilerCarId] = useState<string | null>(null);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  
  // Guard references to prevent duplicate/looping triggers from background ticks and race conditions
  const routingInProgressRef = useRef<Set<string>>(new Set());
  const advancingResourcesRef = useRef<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('floor'); // left nav indicator state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [secondsInMinute, setSecondsInMinute] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('mb_notifications_v5');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('mb_notifications_v5', JSON.stringify(notifications));
  }, [notifications]);

  const scheduledNotificationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    notifications.forEach(n => {
      if (n.severity === 'info' && n.status === 'active' && !scheduledNotificationTimers.current.has(n.id)) {
        const timer = setTimeout(() => {
          setNotifications(prev => prev.filter(item => item.id !== n.id));
          scheduledNotificationTimers.current.delete(n.id);
        }, 5000);
        scheduledNotificationTimers.current.set(n.id, timer);
      }
    });

    // Cleanup timers of notifications that are no longer in the list or are inactive
    const currentActiveInfoIds = new Set(
      notifications.filter(n => n.severity === 'info' && n.status === 'active').map(n => n.id)
    );
    scheduledNotificationTimers.current.forEach((timer, id) => {
      if (!currentActiveInfoIds.has(id)) {
        clearTimeout(timer);
        scheduledNotificationTimers.current.delete(id);
      }
    });

    return () => {
      // Clear all active timers on unmount to prevent leaks
      scheduledNotificationTimers.current.forEach(timer => clearTimeout(timer));
      scheduledNotificationTimers.current.clear();
    };
  }, [notifications]);

  // Auto-release bays when all jobs are completed
  const lastProcessedBays = useRef<Record<string, string>>({});

  useEffect(() => {
    bays.forEach(bay => {
      if (bay.currentCarId) {
        const car = cars.find(c => c.id === bay.currentCarId);
        if (car && car.jobs.every(j => j.status === 'completed')) {
          // Only release if it hasn't been processed yet for this car
          if (lastProcessedBays.current[bay.id] !== car.id) {
            lastProcessedBays.current[bay.id] = car.id;
            handleReleaseCarFromBay(bay.id);
          }
        } else if (!car) {
          // If no car found, or car removed, clear the processed tracking
          delete lastProcessedBays.current[bay.id];
        }
      } else {
        // If bay is empty, clear the processed tracking
        delete lastProcessedBays.current[bay.id];
      }
    });
  }, [cars, bays]);
  // Startup healing: ensure that any loaded active shared resource has its job set to 'in-progress'
  useEffect(() => {
    setCars(prev => prev.map(c => {
      if (c.sharedResourceStatus === 'active') {
        const updatedJobs = c.jobs.map(j => {
          const t = j.title.toLowerCase();
          const matches = c.sharedResourceRequest === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
          if (matches && j.status !== 'in-progress') {
            return { ...j, status: 'in-progress' as const };
          }
          return j;
        });
        return { ...c, jobs: updatedJobs };
      }
      return c;
    }));
  }, []); // Run ONCE on mount to heal the state!

  const handleAdvanceTimeRef = useRef<((mins: number) => void) | null>(null);

  useEffect(() => {
    handleAdvanceTimeRef.current = handleAdvanceTime;
  }); // run on every render so it always has the freshest reference

  const tickRef = useRef(0);

  // --- AUTOMATIC TIME PROGRESSION ---
  useEffect(() => {
    if (!isLiveMode) return;
    
    const interval = setInterval(() => {
      tickRef.current += 1;
      if (tickRef.current >= 60) {
        tickRef.current = 0;
        // batch state updates safely outside of the updater function!
        setSecondsInMinute(0);
        handleAdvanceTimeRef.current?.(1);
      } else {
        setSecondsInMinute(tickRef.current);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLiveMode]);

  // --- BRAKE DIAGNOSTIC / AUTO-ASSIGNMENT ENGINE ---
  /**
   * LIVE FLOOR CONTROL FUNCTIONALITY BRIEF
   * --------------------------------------
   * Primary Tactical Hub for MBCS-DS v2.0
   * 1. Real-time Grid: Synchronized status tracking across all bays.
   * 2. Auto-Assignment: 10-minute grace period visual countdown before system-level intervention.
   * 3. Decision Support: Identifies SLA breaches (At Risk) and bottlenecks (Blocked Bays).
   * 4. Contextual Awareness: Next-in-queue visibility for vacant bays.
   */

  // Helper to determine the precise operational risk category of a vehicle in real-time
  const getCarCategory = (car: Car) => {
    return getCarRiskStatus(car, currentTime);
  };

  // Toast alert states
  const [toastAlerts, setToastAlerts] = useState<{
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    timestamp: string;
  }[]>([]);

  const [shownToastKeys, setShownToastKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('mb_shown_toasts_v4');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync shownToasts list to localStorage
  useEffect(() => {
    localStorage.setItem('mb_shown_toasts_v4', JSON.stringify(shownToastKeys));
  }, [shownToastKeys]);

  const getTimeDiff = (timeStart: string | null | undefined, timeEnd: string | null | undefined): number => {
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

  // Dynamic alert scanner on current simulation time
  useEffect(() => {
    const newToasts: typeof toastAlerts = [];
    const updatedKeys = [...shownToastKeys];
    let keysChanged = false;

    cars.forEach(car => {
      // 1. Customer approvals (30m, 1h, 2h)
      if (car.approvalPending && car.approvalRequestedAt) {
        const minsPending = getTimeDiff(car.approvalRequestedAt, currentTime);
        
        let alertToRaise: { 
          key: string; 
          title: string; 
          description: string; 
          severity: 'critical' | 'warning' | 'info';
          isPushAlert?: boolean;
          targetBay?: string;
        } | null = null;
        
        if (minsPending >= 120) {
          alertToRaise = {
            key: `approval-2h-${car.id}-${car.approvalRequestedAt}`,
            title: `🚨 PUSH ALARM: 2-Hour SLA Client Silence`,
            description: `DANGER UI: The customer Eleanor Vance has not responded for over 2 hours on supplementary authorization for ${car.make} ${car.model} (Cost is $${car.approvalRequiredCost || 150}). Allotted bay is blocked!`,
            severity: 'critical',
            isPushAlert: true,
            targetBay: bays.find(b => b.id === car.currentBayId)?.name
          };
        } else if (minsPending >= 60) {
          alertToRaise = {
            key: `approval-1h-${car.id}-${car.approvalRequestedAt}`,
            title: `1-Hour SLA Client Silence: ${car.plateNumber}`,
            description: `Warning: No client response for over 1 hour on supplementary approval for ${car.make} ${car.model}. Cost: $${car.approvalRequiredCost}.`,
            severity: 'warning'
          };
        } else if (minsPending >= 30) {
          alertToRaise = {
            key: `approval-30m-${car.id}-${car.approvalRequestedAt}`,
            title: `30-Min SLA Client Silence: ${car.plateNumber}`,
            description: `Notification: No client response for over 30 minutes on supplementary approval for ${car.make} ${car.model}. Cost: $${car.approvalRequiredCost}.`,
            severity: 'warning'
          };
        }

        if (alertToRaise && !updatedKeys.includes(alertToRaise.key)) {
          updatedKeys.push(alertToRaise.key);
          keysChanged = true;
          newToasts.push({
            id: `toast-${Date.now()}-${Math.random()}`,
            title: alertToRaise.title,
            description: alertToRaise.description,
            severity: alertToRaise.severity,
            timestamp: currentTime,
            isPushAlert: alertToRaise.isPushAlert,
            targetBay: alertToRaise.targetBay
          });
        }
      }

      // 2. Parts Dependencies (whenever parts ETA is > 2 hours/too long, raise severe Push danger UI warning)
      if (car.partsOnOrder) {
        let partAlert: { 
          key: string; 
          title: string; 
          description: string; 
          severity: 'critical' | 'warning' | 'info';
          isPushAlert?: boolean;
          targetBay?: string;
        } | null = null;

        const isTooLong = isPartsEtaTooLong(car.partsExpectedTime);

        if (isTooLong) {
          partAlert = {
            key: `parts-delay-too-long-2h-${car.id}-${car.partsExpectedTime || 'default'}`,
            title: `🚨 PUSH ALARM: Parts ETA Exceeds 2 Hours`,
            description: `DANGER UI: Mechanic or parts specialist reports components ETA is "${car.partsExpectedTime || 'delayed'}" for ${car.make} ${car.model} (${car.plateNumber}). Allotted bay will be blocked by 2 hours or more!`,
            severity: 'critical',
            isPushAlert: true,
            targetBay: bays.find(b => b.id === car.currentBayId)?.name
          };
        } else {
          // Check standard Delay Past Promise Time
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
            partAlert = {
              key: `parts-delay-${car.id}-${car.promisedTime}`,
              title: `Critical Parts Delay: ${car.plateNumber}`,
              description: `Breach: Part request for "${car.partsOrderDescription || 'OEM Component'}" on ${car.make} ${car.model} is delaying the vehicle past promised completion (${car.promisedTime})!`,
              severity: 'critical'
            };
          } else {
            partAlert = {
              key: `parts-raised-${car.id}`,
              title: `Part Order Raised: ${car.plateNumber}`,
              description: `System logged a part request for "${car.partsOrderDescription || 'OEM Component'}" on ${car.make} ${car.model}. Awaiting stock allocation.`,
              severity: 'warning'
            };
          }
        }

        if (partAlert && !updatedKeys.includes(partAlert.key)) {
          updatedKeys.push(partAlert.key);
          keysChanged = true;
          newToasts.push({
            id: `toast-${Date.now()}-${Math.random()}`,
            title: partAlert.title,
            description: partAlert.description,
            severity: partAlert.severity,
            timestamp: currentTime,
            isPushAlert: partAlert.isPushAlert,
            targetBay: partAlert.targetBay
          });
        }
      }
    });

    if (newToasts.length > 0) {
      setToastAlerts(prev => [...prev, ...newToasts]);
      newToasts.forEach((t) => {
        addLogEntry(`[SYSTEM ALERT] ${t.title}: ${t.description}`, t.severity === 'critical' ? 'error' : 'warning');
      });
    }

    if (keysChanged) {
      setShownToastKeys(updatedKeys);
    }
  }, [currentTime, cars, bays]);

  // --- ACTIONABLE NOTIFICATIONS SYSTEM SYNC ENGINE ---
  useEffect(() => {
    let changed = false;
    const updatedNotifications = [...notifications];

    cars.forEach(car => {
      // 1. Check Blocked > 2 Hours SLA breach
      let isTwoHrsBlock = false;
      if (car.overallStatus === 'blocked' && car.blockedAt) {
        const diff = getTimeDiff(car.blockedAt, currentTime);
        if (diff >= 120) isTwoHrsBlock = true;
      }
      if (car.approvalPending && car.approvalRequestedAt) {
        const diff = getTimeDiff(car.approvalRequestedAt, currentTime);
        if (diff >= 120) isTwoHrsBlock = true;
      }
      if (car.partsOnOrder && car.partsExpectedTime) {
        const etaStr = car.partsExpectedTime.toLowerCase();
        if (etaStr.includes('2 h') || etaStr.includes('2hr') || etaStr.includes('2 hours') || etaStr.includes('120') || etaStr.includes('3 h') || etaStr.includes('3hr') || etaStr.includes('4 h')) {
          isTwoHrsBlock = true;
        }
      }

      // 2. Parts Missing exception
      const hasPartsMissing = car.partsOnOrder === true;

      // 3. Blocked exception (general block)
      const isBlocked = car.overallStatus === 'blocked';

      // --- SYNC EACH EXCEPTION STATE TO NOTIFICATION STATE ---
      
      // SLA 2H Breach Notification:
      const slaId = `act-sla-2h-${car.id}`;
      const existingSlaIndex = updatedNotifications.findIndex(n => n.id === slaId);
      if (isTwoHrsBlock) {
        if (existingSlaIndex === -1) {
          const bayName = bays.find(b => b.id === car.currentBayId)?.name || 'Service Bay';
          updatedNotifications.unshift({
            id: slaId,
            title: `🚨 PUSH ESCALATION: SLA Breach > 2 Hours`,
            message: `CRITICAL SLA BREACH: ${car.make} ${car.model} (${car.plateNumber}) has blocked ${bayName} for over 2 hours! Action is required.`,
            timestamp: currentTime,
            severity: 'danger',
            category: 'risk',
            read: false,
            isActionable: true,
            status: 'active',
            actionRequiredText: 'Relocate vehicle to holding quarantine / Escalate SLA bottleneck',
            relatedCarId: car.id
          });
          changed = true;
        } else {
          // If the status was resolved but it is blocked again, we can reset it or ignore
        }
      } else {
        if (existingSlaIndex !== -1 && updatedNotifications[existingSlaIndex].status !== 'resolved') {
          updatedNotifications[existingSlaIndex] = {
            ...updatedNotifications[existingSlaIndex],
            status: 'resolved',
            resolvedAt: currentTime,
            read: true
          };
          changed = true;
        }
      }

      // Parts Missing Notification:
      const partsId = `act-parts-${car.id}`;
      const existingPartsIndex = updatedNotifications.findIndex(n => n.id === partsId);
      if (hasPartsMissing) {
        if (existingPartsIndex === -1) {
          updatedNotifications.unshift({
            id: partsId,
            title: `Parts Missing: ${car.make} ${car.model}`,
            message: `Vehicle ${car.plateNumber} is stalled waiting for parts. Part: "${car.partsOrderDescription || 'OEM Component'}". ETA: ${car.partsExpectedTime || 'Pending'}.`,
            timestamp: currentTime,
            severity: 'warning',
            category: 'parts',
            read: false,
            isActionable: true,
            status: 'active',
            actionRequiredText: 'Process Vendor Parts Intake / Receive stock manually',
            relatedCarId: car.id
          });
          changed = true;
        }
      } else {
        if (existingPartsIndex !== -1 && updatedNotifications[existingPartsIndex].status !== 'resolved') {
          updatedNotifications[existingPartsIndex] = {
            ...updatedNotifications[existingPartsIndex],
            status: 'resolved',
            resolvedAt: currentTime,
            read: true
          };
          changed = true;
        }
      }

      // Blocked Notification:
      const blockedId = `act-blocked-${car.id}`;
      const existingBlockedIndex = updatedNotifications.findIndex(n => n.id === blockedId);
      if (isBlocked && !isTwoHrsBlock) { // don't duplicate blocked if SLA is breached
        if (existingBlockedIndex === -1) {
          updatedNotifications.unshift({
            id: blockedId,
            title: `Workflow Blocked: ${car.make} ${car.model}`,
            message: `Vehicle ${car.plateNumber} is stalled on the shop floor. ${car.approvalPending ? 'Awaiting supplementary customer clearance.' : `Manual blockage reason: ${car.manualBlockReason || 'Uncategorized constraint'}`}`,
            timestamp: currentTime,
            severity: 'warning',
            category: car.approvalPending ? 'approval' : 'operational',
            read: false,
            isActionable: true,
            status: 'active',
            actionRequiredText: car.approvalPending ? 'Contact customer Eleanor Vance' : 'Clear mechanical bay bottleneck',
            relatedCarId: car.id
          });
          changed = true;
        }
      } else {
        if (existingBlockedIndex !== -1 && updatedNotifications[existingBlockedIndex].status !== 'resolved') {
          updatedNotifications[existingBlockedIndex] = {
            ...updatedNotifications[existingBlockedIndex],
            status: 'resolved',
            resolvedAt: currentTime,
            read: true
          };
          changed = true;
        }
      }
    });

    if (changed) {
      setNotifications(updatedNotifications);
    }
  }, [cars, currentTime, notifications]);

  // Consolidate auto-assignment to Alignment RIG when primary jobs are completed
  // Trigger 4 (around line 725) now handles all vehicles (both in queue and in bays)

  // Trigger 2: Auto-advance shared resources (Alignment RIG and Wash BAY) when active jobs are completed
  useEffect(() => {
    sharedResources.forEach(res => {
      if (!res.currentCarId) return;

      const activeCar = cars.find(c => c.id === res.currentCarId);
      if (!activeCar) return;

      const correspondingJob = activeCar.jobs.find(j => {
        const title = j.title.toLowerCase();
        return res.type === 'alignment' 
          ? title.includes('align') 
          : (title.includes('wash') || title.includes('detail'));
      });

      if (correspondingJob && correspondingJob.status === 'completed' && activeCar.sharedResourceStatus !== 'completed') {
        if (advancingResourcesRef.current.has(res.id)) return;
        advancingResourcesRef.current.add(res.id);

        // Automatically advance the queue!
        addLogEntry(`AUTO-ADVANCE: Completed task on ${res.name} for ${activeCar.make} ${activeCar.model} (${activeCar.plateNumber}). Advancing queue automatically.`, 'info', activeCar.id);
        handleAdvanceResourceQueue(res.id);

        setTimeout(() => {
          advancingResourcesRef.current.delete(res.id);
        }, 300);
      }
    });
  }, [cars, sharedResources, currentTime]);

  // Trigger 3: Pull next car from queue if station is idle
  useEffect(() => {
    sharedResources.forEach(res => {
      if (!res.currentCarId && res.queue.length > 0) {
        if (advancingResourcesRef.current.has(res.id)) return;
        advancingResourcesRef.current.add(res.id);

        addLogEntry(`AUTO-ADVANCE: Station ${res.name} is idle. Pulling first vehicle from queue.`, 'info', res.queue[0]);
        handleAdvanceResourceQueue(res.id);

        setTimeout(() => {
          advancingResourcesRef.current.delete(res.id);
        }, 300);
      }
    });
  }, [sharedResources]);

  // Trigger 4: Auto-route to Alignment RIG when primary jobs are completed
  useEffect(() => {
    const carsToRoute: string[] = [];
    
    cars.forEach(car => {
      // Exclude cars already in or completed shared resource workflow
      if (car.sharedResourceStatus !== 'none') return;
      if (car.overallStatus === 'completed') return;
      // Note: We specifically ALLOW 'at-risk' and 'critical' cars to move - moving them to alignment helps resolve the delay
      if (car.overallStatus === 'blocked') return;

      // Check if all "primary" (non-shared) jobs are completed
      const primaryJobs = car.jobs.filter(j => {
        const title = j.title.toLowerCase();
        return !title.includes('align') && !title.includes('wash') && !title.includes('detail');
      });

      // Must have at least one primary job and all must be completed
      if (primaryJobs.length > 0 && primaryJobs.every(j => j.status === 'completed')) {
        // Also check if alignment is actually needed (not already completed)
        const alignmentJob = car.jobs.find(j => j.title.toLowerCase().includes('align'));
        if (!alignmentJob || alignmentJob.status !== 'completed') {
          carsToRoute.push(car.id);
        }
      }
    });

    if (carsToRoute.length > 0) {
      carsToRoute.forEach(carId => {
        if (routingInProgressRef.current.has(carId)) return;
        routingInProgressRef.current.add(carId);

        // Double check the car still exists and needs routing
        const currentCar = cars.find(c => c.id === carId);
        if (currentCar && currentCar.sharedResourceStatus === 'none') {
          addLogEntry(`AUTO-WORKFLOW: ${currentCar.make} ${currentCar.model} (${currentCar.plateNumber}) completed primary jobs. Routing to Alignment RIG.`, 'success', carId);
          handleAddToResourceQueue('alignment-rig', carId);
        }
      });
    }
  }, [cars]);

  // Self-healing synchronization to keep Car currentBayId, Bay currentCarId and SharedResource states perfectly aligned
  useEffect(() => {
    let carsChanged = false;
    let baysChanged = false;

    // A. Sync bays based on cars
    const syncedBays = bays.map(b => {
      // Find if any car currently claims to be in this bay
      const claimingCar = cars.find(c => c.currentBayId === b.id);
      
      if (claimingCar) {
        // If the bay doesn't know about it, sync the bay to the car
        if (b.currentCarId !== claimingCar.id) {
          baysChanged = true;
          return { ...b, currentCarId: claimingCar.id, becameFreeAt: null };
        }
      } else {
        // No car claims this bay. But wait, does the bay still claim a car that claims another location or is in staging?
        if (b.currentCarId !== null) {
          const occupant = cars.find(c => c.id === b.currentCarId);
          if (!occupant || occupant.currentBayId !== b.id) {
            baysChanged = true;
            return { ...b, currentCarId: null, becameFreeAt: b.becameFreeAt || currentTime };
          }
        }
      }
      return b;
    });

    // B. Sync cars based on bays and shared resources
    const syncedCars = cars.map(c => {
      // 1. If a car is active in a shared resource, its currentBayId MUST be null
      if (c.sharedResourceStatus === 'active' && c.currentBayId !== null) {
        carsChanged = true;
        return { ...c, currentBayId: null };
      }

      // 2. If a bay has currentCarId = car.id, but the car doesn't have currentBayId = bay.id
      // AND the car is not currently active/queued on any shared resource, sync the car to the bay
      const residentBay = bays.find(b => b.currentCarId === c.id);
      if (residentBay && c.currentBayId !== residentBay.id && c.sharedResourceStatus !== 'active' && c.sharedResourceStatus !== 'queued') {
        carsChanged = true;
        return { ...c, currentBayId: residentBay.id };
      }

      return c;
    });

    // Perform batched state updates only if an actual change was made to prevent infinite loops
    if (carsChanged) {
      setCars(syncedCars);
    }
    if (baysChanged) {
      setBays(syncedBays);
    }
  }, [cars, bays, sharedResources, currentTime]);

  // Workflow Dialog State
  const [mechanicAllocationParams, setMechanicAllocationParams] = useState<{ bayId: string, carId: string } | null>(null);
  const [holdingAreaParams, setHoldingAreaParams] = useState<{ carId: string } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('mb_cars_v4', JSON.stringify(cars));
    localStorage.setItem('mb_bays_v4', JSON.stringify(bays));
    localStorage.setItem('mb_shared_resources_v4', JSON.stringify(sharedResources));
    localStorage.setItem('mb_logs_v4', JSON.stringify(logs));
    localStorage.setItem('mb_time_v4', currentTime);
  }, [cars, bays, sharedResources, logs, currentTime]);

  // QA Automation daily scheduler check on simulated clock updates
  useEffect(() => {
    checkAndTriggerQAAutomation(
      cars,
      setCars,
      bays,
      setBays,
      setSharedResources,
      setLogs,
      setNotifications,
      currentTime,
      addLogEntry
    );
  }, [currentTime, cars, setCars, bays, setBays, setSharedResources, setLogs, setNotifications]);

  // Helper: Log custom message
  const addLogEntry = (message: string, type: ActivityLogEntry['type'] = 'info', carId?: string) => {
    let associatedCarId = carId;
    
    // Auto-detect carId if not explicitly passed
    if (!associatedCarId) {
      const matchingCar = cars.find(c => {
        const escapedPlate = c.plateNumber.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const plateRegex = new RegExp(`(?:[^a-zA-Z0-9]|^)${escapedPlate}(?:[^a-zA-Z0-9]|$)`, 'i');
        return plateRegex.test(message);
      });
      if (matchingCar) {
        associatedCarId = matchingCar.id;
      }
    }

    const newEntry: ActivityLogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: currentTime,
      message,
      type,
      carId: associatedCarId
    };
    setLogs(prev => [newEntry, ...prev]);
  };

  // --- AUTOMATIC EOD REPORT TRIGGER AT 08:30 PM (20:30) ---
  useEffect(() => {
    const [h, m] = currentTime.split(':').map(Number);
    const totalMinutes = h * 60 + m;
    
    // 20:30 is 1230 minutes from midnight
    if (totalMinutes >= 1230) {
      // Check if we've already generated a report for this currentDay
      const reportExists = eodReports.some(r => r.dayId === `Day ${currentDay}`);
      
      if (!reportExists) {
        // Automatically calculate EOD Report!
        const report = calculateEodReport(currentDay, cars, bays, currentTime);
        setEodReports(prev => {
          // Prevent double insertion
          if (prev.some(r => r.dayId === report.dayId)) return prev;
          return [...prev, report];
        });
        
        // Add a notification
        const notificationId = `notif-eod-${currentDay}-${Date.now()}`;
        setNotifications(prev => [
          {
            id: notificationId,
            title: `EOD Report Synchronized`,
            message: `At 08:30 PM, Day ${currentDay}'s operational performance was calculated and successfully synced with the KPI Review Page.`,
            timestamp: currentTime,
            severity: 'info',
            category: 'system',
            read: false,
            isActionable: false,
            status: 'active'
          },
          ...prev
        ]);
        
        // Log to Activity log
        const logId = `log-eod-${currentDay}-${Date.now()}`;
        setLogs(prev => [
          {
            id: logId,
            timestamp: currentTime,
            message: `SYSTEM EVENT: 08:30 PM reached. Day ${currentDay} operations calculated, saved, and synchronized with KPI Review Page.`,
            type: 'success'
          },
          ...prev
        ]);
      }
    }
  }, [currentTime, currentDay, cars, bays, eodReports]);

  // Transition to Tomorrow (Starts Day N+1, keeping pending vehicles and taking new ones)
  const handleStartNewDay = () => {
    // 1. Identify pending cars vs completed cars
    const pendingCars = cars.filter(c => c.overallStatus !== 'completed');
    const completedCars = cars.filter(c => c.overallStatus === 'completed');
    
    // 2. Clear any completed cars from the bays
    const updatedBays = bays.map(b => {
      if (b.currentCarId) {
        const car = cars.find(c => c.id === b.currentCarId);
        if (car && car.overallStatus === 'completed') {
          return { ...b, currentCarId: null, becameFreeAt: '08:00' };
        }
      }
      return b;
    });

    // 3. Clear completed cars from the shared resource queues and active slots
    const updatedResources = sharedResources.map(res => {
      const activeCar = res.currentCarId ? cars.find(c => c.id === res.currentCarId) : null;
      const isCompleted = activeCar && activeCar.overallStatus === 'completed';
      
      return {
        ...res,
        currentCarId: isCompleted ? null : res.currentCarId,
        queue: res.queue.filter(carId => {
          const car = cars.find(c => c.id === carId);
          return car ? car.overallStatus !== 'completed' : false;
        })
      };
    });

    // 4. Generate some new cars to "take new vehicles tomorrow"
    const pool = [
      { make: 'Tesla', model: 'Model Y', year: 2023, customerName: 'Elon Muske', customerPhone: '+1 415 555 1212', jobTitle: 'Laser Wheel Alignment', jobDuration: 30, cost: 75, sharedResourceRequest: 'alignment' as const },
      { make: 'Ford', model: 'F-150', year: 2021, customerName: 'Henry Trucker', customerPhone: '+1 313 555 4567', jobTitle: 'Brake Disc Machining', jobDuration: 120, cost: 240, sharedResourceRequest: 'none' as const },
      { make: 'Porsche', model: '911 Carrera', year: 2022, customerName: 'Speedy Gonzales', customerPhone: '+1 911 555 1911', jobTitle: 'Complimentary Wash & Vacuum', jobDuration: 15, cost: 0, sharedResourceRequest: 'wash' as const },
      { make: 'BMW', model: 'M3 Comp', year: 2024, customerName: 'Beemer Racer', customerPhone: '+1 800 555 4444', jobTitle: 'Full Vehicle Diagnostic', jobDuration: 60, cost: 120, sharedResourceRequest: 'none' as const },
    ];
    
    // Pick 2 random cars
    const selectedPool = [...pool].sort(() => 0.5 - Math.random()).slice(0, 2);
    
    const newDayNum = currentDay + 1;
    const generatedCars: Car[] = selectedPool.map((p, idx) => {
      const carId = `car-new-d${newDayNum}-${idx}-${Math.floor(Math.random() * 1000)}`;
      const jobId = `job-new-d${newDayNum}-${idx}-${Math.floor(Math.random() * 1000)}`;
      return {
        id: carId,
        make: p.make,
        model: p.model,
        year: p.year,
        plateNumber: `GA-01-N-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        promisedTime: '18:00',
        promisedDateTime: `2026-06-30T18:00:00`,
        overallStatus: 'healthy' as const,
        currentBayId: null,
        jobs: [
          {
            id: jobId,
            title: p.jobTitle,
            durationMins: p.jobDuration,
            elapsedMins: 0,
            status: 'pending' as const,
            technicianName: 'Pending Allocation',
            cost: p.cost
          }
        ],
        approvalPending: false,
        partsOnOrder: false,
        sharedResourceRequest: p.sharedResourceRequest,
        sharedResourceStatus: 'none' as const
      };
    });

    // Merge pending cars and newly generated cars
    const updatedCars = [...pendingCars, ...generatedCars];

    // 5. Update states
    setCars(updatedCars);
    setBays(updatedBays);
    setSharedResources(updatedResources);
    setCurrentDay(newDayNum);
    setCurrentTime('08:00'); // Reset clock to 8 AM

    // 6. Push notifications and logs
    addLogEntry(`SYSTEM EVENT: Start of Day ${newDayNum}. Dispatched ${completedCars.length} completed vehicles. Carried over ${pendingCars.length} pending vehicles and accepted ${generatedCars.length} new vehicles for today's service list.`, 'success');

    setNotifications(prev => [
      {
        id: `notif-newday-${newDayNum}-${Date.now()}`,
        title: `Day ${newDayNum} Roster Synchronized`,
        message: `Clock reset to 08:00 AM. Carried over ${pendingCars.length} pending vehicles and accepted ${generatedCars.length} new incoming bookings.`,
        timestamp: '08:00',
        severity: 'info',
        category: 'system',
        read: false,
        isActionable: false,
        status: 'active'
      },
      ...prev
    ]);
  };

  // --- INTERACTION HANDLERS ---

  // Triggered when clicking a task progress toggle (play/pause)
  const handleToggleJobProgress = (carId: string, jobId: string) => {
    setCars(prevCars => prevCars.map(c => {
      if (c.id !== carId) return c;
      
      const updatedJobs = c.jobs.map(j => {
        if (j.id === jobId) {
          const nextStatus = j.status === 'in-progress' ? 'hold' : 'in-progress';
          return { ...j, status: nextStatus };
        }
        if (j.id !== jobId && j.status === 'in-progress') {
          return { ...j, status: 'hold' };
        }
        return j;
      });

      const activeJob = updatedJobs.find(j => j.status === 'in-progress');
      let overallStatus = c.overallStatus;
      if (overallStatus !== 'blocked') {
        overallStatus = 'healthy';
      }

      return {
        ...c,
        jobs: updatedJobs,
        overallStatus
      };
    }));

    const car = cars.find(c => c.id === carId);
    const job = car?.jobs.find(j => j.id === jobId);
    if (car && job) {
      const stateLabel = job.status === 'in-progress' ? 'PAUSED' : 'STARTED';
      addLogEntry(`${car.make} ${car.model}: ${stateLabel} job task "${job.title}".`, 'info');
    }
  };

  // Add new vehicle record from intake
  const handleAddIntakeCar = (newCarData: Omit<Car, 'id'>) => {
    const newCarId = `car-added-${Date.now()}`;
    const newCar: Car = {
      ...newCarData,
      id: newCarId,
      currentBayId: null // Force placing in the queue as default per wireframe
    };

    setCars(prev => [...prev, newCar]);
    addLogEntry(`Intake check-in completed: ${newCar.make} ${newCar.model} (${newCar.plateNumber}) added to Waiting Vehicle Queue.`, 'success');
  };

  // Assign staged car to vacant bay
  const handleAssignCarToBay = (bayId: string, carId: string) => {
    const existingCar = cars.find(c => c.currentBayId === bayId);
    if (existingCar) {
      const bayObj = bays.find(b => b.id === bayId);
      addLogEntry(`Allocation Blocked: ${bayObj ? bayObj.name : 'Bay'} is already occupied by ${existingCar.make} ${existingCar.model} (${existingCar.plateNumber}). Allocation must be on FREE bays only.`, 'error');
      return;
    }
    setMechanicAllocationParams({ bayId, carId });
  };

  const executeAssignCarToBay = (bayId: string, carId: string, mechanicName: string) => {
    // Check if another car was in this bay
    const previousCarInBay = cars.find(c => c.currentBayId === bayId);
    if (previousCarInBay) {
      addLogEntry(`Allocation Blocked: Bay is already occupied. Assignment cancelled.`, 'error');
      return;
    }
    
    setCars(prev => prev.map(c => {
      // Release from previous bay if needed
      if (c.id === carId) {
        const hasInProgress = c.jobs.some(j => j.status === 'in-progress');
        const firstPendingOrHoldIdx = c.jobs.findIndex(j => j.status === 'pending' || j.status === 'hold');
        
        return { 
          ...c, 
          currentBayId: bayId,
          // Release from alignment or wash active work if moved back to service bay
          sharedResourceStatus: 'none',
          jobs: c.jobs.map((j, idx) => {
            const isTarget = !hasInProgress && idx === firstPendingOrHoldIdx;
            return {
              ...j,
              technicianName: mechanicName,
              status: isTarget ? 'in-progress' as const : j.status
            };
          })
        };
      }
      return c;
    }));

    setBays(prev => prev.map(b => {
      if (b.id === bayId) {
        return { ...b, currentCarId: carId, becameFreeAt: null };
      }
      if (b.currentCarId === carId && b.id !== bayId) {
        return { ...b, currentCarId: null, becameFreeAt: currentTime };
      }
      return b;
    }));

    // If assigned car was on a resource, clear it
    setSharedResources(prev => prev.map(res => {
      if (res.currentCarId === carId) {
        return { ...res, currentCarId: null };
      }
      return {
        ...res,
        queue: res.queue.filter(id => id !== carId)
      };
    }));

    const cand = cars.find(c => c.id === carId);
    const bayObj = bays.find(b => b.id === bayId);
    if (cand && bayObj) {
      addLogEntry(`${cand.make} ${cand.model} (${cand.plateNumber}) assigned onto ${bayObj.name}.`, 'success');
    }
  };

  // Move car out of bay, parking it back in the queue
  const handleReleaseCarFromBay = (bayId: string) => {
    const bayObj = bays.find(b => b.id === bayId);
    if (!bayObj || !bayObj.currentCarId) return;

    const carId = bayObj.currentCarId;
    const carObj = cars.find(c => c.id === carId);

    if (!carObj) return;

    addLogEntry(`RELEASING CAR: ${carObj.plateNumber} from bay ${bayObj.name}.`, 'info');

    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        const allFinished = c.jobs.every(j => j.status === 'completed');
        
        const primaryJobs = c.jobs.filter(j => {
          const title = j.title.toLowerCase();
          return !title.includes('align') && !title.includes('wash') && !title.includes('vacuum') && !title.includes('detail');
        });
        const isJobDone = primaryJobs.length > 0 ? primaryJobs.every(j => j.status === 'completed') : true;

        let sharedResourceRequest: Car['sharedResourceRequest'] = c.sharedResourceRequest;
        let sharedResourceStatus: Car['sharedResourceStatus'] = c.sharedResourceStatus;
        let overallStatus = allFinished ? 'completed' : c.overallStatus;

        if (isJobDone) {
             const hasAlignment = c.jobs.some(j => j.title.toLowerCase().includes('align'));
             const isAlignmentDone = c.jobs.filter(j => j.title.toLowerCase().includes('align')).every(j => j.status === 'completed');
             
             if (hasAlignment && !isAlignmentDone) {
                 sharedResourceRequest = 'alignment';
                 sharedResourceStatus = 'queued';
                 setSharedResources(prevRes => prevRes.map(r => r.id === 'alignment-rig' ? { ...r, queue: [...r.queue, c.id] } : r));
             } else {
                 const hasWash = c.jobs.some(j => j.title.toLowerCase().includes('wash') || j.title.toLowerCase().includes('vacuum') || j.title.toLowerCase().includes('detail'));
                 const isWashDone = c.jobs.filter(j => j.title.toLowerCase().includes('wash') || j.title.toLowerCase().includes('vacuum') || j.title.toLowerCase().includes('detail')).every(j => j.status === 'completed');
                 
                 if (hasWash && !isWashDone) {
                     sharedResourceRequest = 'wash';
                     sharedResourceStatus = 'queued';
                     setSharedResources(prevRes => prevRes.map(r => r.id === 'wash-bay' ? { ...r, queue: [...r.queue, c.id] } : r));
                 }
             }
        } else if (sharedResourceStatus !== 'queued') {
            overallStatus = 'blocked';
        }

        return {
          ...c,
          currentBayId: null,
          overallStatus: overallStatus,
          sharedResourceRequest: sharedResourceRequest,
          sharedResourceStatus: sharedResourceStatus
        };
      }
      return c;
    }));

    setBays(prev => prev.map(b => b.id === bayId ? { ...b, currentCarId: null, becameFreeAt: currentTime } : b));
    
    // Notify about free bay
    const bayName = bayObj.name;
    const newNotification: AppNotification = {
      id: `bay-free-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Bay Available',
      message: `${bayName} is now free. Auto-assignment will trigger in 10 minutes if no manual action is taken.`,
      timestamp: currentTime,
      severity: 'info',
      category: 'operational',
      read: false,
      isActionable: false,
      status: 'active'
    };
    setNotifications(prev => [newNotification, ...prev]);

    addLogEntry(`${carObj.make} ${carObj.model} (${carObj.plateNumber}): Cleared out of ${bayObj.name} and placed back in waitlist.`, 'info');
  };

  // Customer Approvals handlers
  const handleCustomerApprove = (carId: string) => {
    setCars(prev => prev.map(c => {
      if (c.id !== carId) return c;

      const supplementaryWork = {
        id: `job-supplemental-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: c.approvalRequiredWork || 'Discovered Supplemental Repair',
        durationMins: 45,
        elapsedMins: 0,
        status: 'pending' as const,
        technicianName: 'Sarah Patel',
        cost: c.approvalRequiredCost || 150
      };

      const resumedJobs = c.jobs.map(j => j.status === 'hold' ? { ...j, status: 'pending' as const } : j);

      return {
        ...c,
        overallStatus: 'healthy' as const,
        approvalPending: false,
        approvalRequestedAt: null,
        approvalRequiredWork: null,
        approvalRequiredCost: null,
        jobs: [...resumedJobs, supplementaryWork]
      };
    }));

    const targetCar = cars.find(c => c.id === carId);
    if (targetCar) {
      addLogEntry(`CUSTOMER AUTHORIZED: Supplement work approved ($${targetCar.approvalRequiredCost}) for ${targetCar.make} ${targetCar.model}.`, 'success');
    }
  };

  const handleCustomerDecline = (carId: string) => {
    setCars(prev => prev.map(c => {
      if (c.id !== carId) return c;

      const resumedJobs = c.jobs.map(j => j.status === 'hold' ? { ...j, status: 'pending' as const } : j);

      return {
        ...c,
        overallStatus: 'healthy',
        approvalPending: false,
        approvalRequestedAt: null,
        approvalRequiredWork: null,
        approvalRequiredCost: null,
        jobs: resumedJobs
      };
    }));

    const targetCar = cars.find(c => c.id === carId);
    if (targetCar) {
      addLogEntry(`CUSTOMER DECLINED: Additional proposal rejected for ${targetCar.make} ${targetCar.model}. Resuming base tasks.`, 'warning');
    }
  };

  const handleLogContactAttempt = (carId: string) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, approvalContactLogged: true } : c));
    const targetCar = cars.find(c => c.id === carId);
    if (targetCar) {
      addLogEntry(`Manager contacted customer regarding extra diagnostics on ${targetCar.make} ${targetCar.model}.`, 'info');
    }
  };

  // Receive parts
  const handleReceiveShortParts = (carId: string) => {
    setCars(prev => prev.map(c => {
      if (c.id !== carId) return c;

      const resumedJobs = c.jobs.map(j => j.status === 'hold' ? { ...j, status: 'pending' as const } : j);

      return {
        ...c,
        overallStatus: 'healthy',
        partsOnOrder: false,
        partsOrderDescription: null,
        partsExpectedTime: null,
        jobs: resumedJobs
      };
    }));

    const targetCar = cars.find(c => c.id === carId);
    if (targetCar) {
      addLogEntry(`PARTS SECURED: Required components arrived for ${targetCar.make} ${targetCar.model}.`, 'success');
    }
  };

  const handleDispatchCar = (carId: string) => {
    const targetCar = cars.find(c => c.id === carId);
    if (targetCar) {
      addLogEntry(`VEHICLE DISPATCHED: ${targetCar.make} ${targetCar.model} (${targetCar.plateNumber}) has been handed over to customer.`, 'success', carId);
      
      // Decouple/Archive active tracking cache logs for this visit ID and plate number so they do not bleed into future sessions
      setLogs(prev => prev.map(l => {
        const escapedPlate = targetCar.plateNumber.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const plateRegex = new RegExp(`(?:[^a-zA-Z0-9]|^)${escapedPlate}(?:[^a-zA-Z0-9]|$)`, 'i');
        if (l.carId === carId || plateRegex.test(l.message)) {
          return { ...l, archived: true, carId: l.carId || carId };
        }
        return l;
      }));

      // Clean up routing guards
      routingInProgressRef.current.delete(carId);

      setCars(prev => prev.filter(c => c.id !== carId));
      setSelectedCarId(null);

      setToastAlerts(prev => [
        ...prev,
        {
          id: `toast-dispatch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Vehicle Dispatched',
          description: `${targetCar.plateNumber} has been successfully delivered.`,
          severity: 'success',
          timestamp: currentTime,
          isPushAlert: false
        }
      ]);
    }
  };

  // --- SHARED RESOURCE QUEUES HANDLERS ---
  const handleAdvanceResourceQueue = (resourceId: string) => {
    const res = sharedResources.find(r => r.id === resourceId);
    if (!res) return;

    const currentActiveCarId = res.currentCarId;
    const nextCarIdInQueue = res.queue[0];
    const isAlignmentCompletion = resourceId === 'alignment-rig' && currentActiveCarId !== null;

    // Get the technician assigned to the NEXT resource if moving from Alignment to Wash
    const washRes = sharedResources.find(r => r.id === 'wash-bay');
    const washTechId = washRes?.assignedTechnicianId;
    const washTech = STAFF_ROSTER.find(t => t.id === washTechId)?.name || 'Wash Bay Tech';

    // Get technician assigned to CURRENT resource for the next car in queue
    const resTechId = res.assignedTechnicianId;
    const resTech = STAFF_ROSTER.find(t => t.id === resTechId)?.name || (res.type === 'alignment' ? 'Alignment Tech' : 'Wash Bay Tech');

    const carBeingLoaded = nextCarIdInQueue ? cars.find(c => c.id === nextCarIdInQueue) : null;
    const previousBayId = carBeingLoaded?.currentBayId;
    if (previousBayId) {
      setBays(prev => prev.map(b => b.id === previousBayId ? { ...b, currentCarId: null, becameFreeAt: currentTime } : b));
    }

    setCars(prevCars => {
      return prevCars.map(c => {
        // 1. Handle completion of current active car
        if (c.id === currentActiveCarId) {
          const completedJobs = c.jobs.map(j => {
            const t = j.title.toLowerCase();
            const matches = res.type === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
            return matches ? { ...j, status: 'completed' as const, elapsedMins: j.durationMins } : j;
          });

          const hasServiceBay = completedJobs.some(j => {
            const title = j.title.toLowerCase();
            return !title.includes('align') && !title.includes('wash') && !title.includes('vacuum') && !title.includes('detail');
          });
          const isJobDone = hasServiceBay ? completedJobs.filter(j => {
            const title = j.title.toLowerCase();
            return !title.includes('align') && !title.includes('wash') && !title.includes('vacuum') && !title.includes('detail');
          }).every(j => j.status === 'completed') : true;

          const isAlignmentDone = completedJobs.some(j => j.title.toLowerCase().includes('align') && j.status === 'completed');
          const isWashDone = completedJobs.some(j => (j.title.toLowerCase().includes('wash') || j.title.toLowerCase().includes('vacuum') || j.title.toLowerCase().includes('detail')) && j.status === 'completed');

          const allDone = isJobDone && isAlignmentDone && isWashDone;

          if (isAlignmentCompletion) {
            // Auto-route to Wash Bay
            const hasWashJob = completedJobs.some(j => {
              const t = j.title.toLowerCase();
              return t.includes('wash') || t.includes('detail');
            });

            const isWashIdle = washRes && washRes.currentCarId === null;
            let finalJobs = completedJobs;

            if (!hasWashJob) {
              finalJobs = [...completedJobs, {
                id: `job-wash-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: 'Complimentary Wash & Vacuum',
                durationMins: 20,
                elapsedMins: 0,
                status: isWashIdle ? 'in-progress' as const : 'pending' as const,
                technicianName: washTech,
                cost: 0
              }];
            } else {
              finalJobs = completedJobs.map(j => {
                const t = j.title.toLowerCase();
                if (t.includes('wash') || t.includes('detail')) {
                  return { ...j, status: isWashIdle ? 'in-progress' as const : 'pending' as const, technicianName: washTech };
                }
                return j;
              });
            }

            addLogEntry(`AUTO-WORKFLOW: ${c.make} ${c.model} completed alignment. Routing to Wash BAY.`, 'success');

            return {
              ...c,
              sharedResourceRequest: 'wash' as const,
              sharedResourceStatus: isWashIdle ? 'active' as const : 'queued' as const,
              jobs: finalJobs,
              overallStatus: 'healthy' as const,
              currentBayId: null 
            };
          }

          // Non-alignment completion (e.g., Wash completion)
          return {
            ...c,
            sharedResourceStatus: 'completed' as const,
            jobs: completedJobs,
            overallStatus: allDone ? 'completed' as const : c.overallStatus
          };
        }

        // 2. Handle starting the next car in queue
        if (c.id === nextCarIdInQueue) {
          const hasJob = c.jobs.some(j => {
            const t = j.title.toLowerCase();
            return res.type === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
          });

          let updatedJobs = [...c.jobs];
          if (!hasJob) {
            if (res.type === 'alignment') {
              updatedJobs.push({
                id: `job-align-auto-adv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: 'Laser Wheel Alignment',
                durationMins: 30,
                elapsedMins: 0,
                status: 'in-progress' as const,
                technicianName: resTech,
                cost: 50
              });
            } else {
              updatedJobs.push({
                id: `job-wash-auto-adv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: 'Complimentary Wash & Vacuum',
                durationMins: 15,
                elapsedMins: 0,
                status: 'in-progress' as const,
                technicianName: resTech,
                cost: 0
              });
            }
          } else {
            updatedJobs = updatedJobs.map(j => {
              const t = j.title.toLowerCase();
              const matches = res.type === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
              return matches ? { ...j, status: 'in-progress' as const, technicianName: resTech } : j;
            });
          }

          return {
            ...c,
            sharedResourceStatus: 'active' as const,
            sharedResourceRequest: res.type as 'alignment' | 'wash',
            jobs: updatedJobs,
            currentBayId: null
          };
        }

        return c;
      });
    });


    setSharedResources(prevResources => {
      const updatedResources = prevResources.map(r => {
        if (r.id === resourceId) {
          const updatedQueue = r.queue.slice(1);
          return {
            ...r,
            currentCarId: nextCarIdInQueue || null,
            queue: updatedQueue
          };
        }
        return r;
      });

      if (isAlignmentCompletion && currentActiveCarId) {
        return updatedResources.map(r => {
          if (r.id === 'wash-bay') {
            const isWashIdle = r.currentCarId === null;
            if (isWashIdle) {
              return { ...r, currentCarId: currentActiveCarId };
            } else {
              if (r.queue.includes(currentActiveCarId)) return r;
              return { ...r, queue: [...r.queue, currentActiveCarId] };
            }
          }
          return r;
        });
      }
      return updatedResources;
    });

    const nextCarObj = nextCarIdInQueue ? cars.find(c => c.id === nextCarIdInQueue) : null;
    const previousCarObj = currentActiveCarId ? cars.find(c => c.id === currentActiveCarId) : null;

    if (previousCarObj) {
      addLogEntry(`${previousCarObj.make} ${previousCarObj.model}: Released from ${res.name}.`, 'success');

      if (isAlignmentCompletion) {
        addLogEntry(`AUTO-WORKFLOW: ${previousCarObj.make} ${previousCarObj.model} (${previousCarObj.plateNumber}) completed alignment. Automatically moved to Wash BAY.`, 'success');

        setToastAlerts(prev => [
          ...prev,
          {
            id: `toast-wash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Job Completed',
            description: `Vehicle ${previousCarObj.plateNumber} has completed alignment and has been moved to the Wash BAY.`,
            severity: 'info',
            timestamp: currentTime,
            isPushAlert: false
          }
        ]);

        setNotifications(prev => [
          {
            id: `auto-wash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Wash Bay Assigned',
            message: `Vehicle ${previousCarObj.plateNumber} moved to Wash BAY queue.`,
            timestamp: currentTime,
            type: 'info',
            category: 'operational',
            read: false
          },
          ...prev
        ]);
      }
    }
    if (nextCarObj) {
      addLogEntry(`${nextCarObj.make} ${nextCarObj.model}: Loaded onto ${res.name} rig, starting service.`, 'info');
    }
  };

  const handleAddToResourceQueue = (resourceId: string, carId: string) => {
    const res = sharedResources.find(r => r.id === resourceId);
    const carObj = cars.find(c => c.id === carId);

    if (!res || !carObj) return;

    const isStationIdle = res.currentCarId === null;
    const hasPreviousBay = carObj.currentBayId !== null;
    const previousBayId = carObj.currentBayId;
    const bayObj = previousBayId ? bays.find(b => b.id === previousBayId) : null;

    // 1. Release the bay if it had one
    if (previousBayId) {
      setBays(prev => prev.map(b => b.id === previousBayId ? { ...b, currentCarId: null, becameFreeAt: currentTime } : b));
      
      if (bayObj) {
        setNotifications(prev => [
          {
            id: `bay-free-sr-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Bay Available',
            message: `${bayObj.name} is now free (Vehicle moved to ${res.name}).`,
            timestamp: currentTime,
            type: 'info',
            category: 'operational',
            read: false
          },
          ...prev
        ]);
      }
    }

    // 2. Prepare the jobs list (add or update alignment/wash job)
    const hasTargetJob = carObj.jobs.some(j => {
      const t = j.title.toLowerCase();
      return res.type === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
    });

    // Get the technician assigned to this bay
    const resTechId = res.assignedTechnicianId;
    const resTech = STAFF_ROSTER.find(t => t.id === resTechId)?.name || (res.type === 'alignment' ? 'Alignment Tech' : 'Wash Bay Tech');

    let updatedJobs = [...carObj.jobs];
    const initialJobStatus = isStationIdle ? ('in-progress' as const) : ('pending' as const);

    if (!hasTargetJob) {
      if (res.type === 'alignment') {
        updatedJobs.push({
          id: `job-align-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Laser Wheel Alignment',
          durationMins: 30,
          elapsedMins: 0,
          status: initialJobStatus,
          technicianName: resTech,
          cost: 50
        });
      } else {
        updatedJobs.push({
          id: `job-wash-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Complimentary Wash & Vacuum',
          durationMins: 20,
          elapsedMins: 0,
          status: initialJobStatus,
          technicianName: resTech,
          cost: 0
        });
      }
    } else {
      updatedJobs = updatedJobs.map(j => {
        const t = j.title.toLowerCase();
        const matches = res.type === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
        // Assign the bay-specific technician
        return matches ? { ...j, status: initialJobStatus, technicianName: resTech } : j;
      });
    }


    // 3. Update the shared resources and cars states
    if (isStationIdle) {
      setSharedResources(prev => prev.map(r => r.id === resourceId ? { ...r, currentCarId: carId } : r));
      
      setCars(prev => prev.map(c => {
        if (c.id === carId) {
          return {
            ...c,
            sharedResourceRequest: res.type,
            sharedResourceStatus: 'active' as const,
            overallStatus: 'healthy' as const,
            approvalPending: false,
            partsOnOrder: false,
            holdingReason: undefined,
            blockedFromResourceId: null,
            jobs: updatedJobs,
            currentBayId: null
          };
        }
        return c;
      }));

      addLogEntry(`MANAGER OVERRIDE: ${carObj.make} ${carObj.model} (${carObj.plateNumber}) manually assigned directly to active slot on ${res.name}.${hasPreviousBay ? ` ${bayObj?.name || 'Previous bay'} released.` : ''}`, 'success');
    } else {
      setSharedResources(prev => prev.map(r => {
        if (r.id === resourceId) {
          if (r.queue.includes(carId)) return r;
          return { ...r, queue: [...r.queue, carId] };
        }
        return r;
      }));

      setCars(prev => prev.map(c => {
        if (c.id === carId) {
          return {
            ...c,
            sharedResourceRequest: res.type,
            sharedResourceStatus: 'queued' as const,
            overallStatus: 'healthy' as const,
            approvalPending: false,
            partsOnOrder: false,
            holdingReason: undefined,
            blockedFromResourceId: null,
            jobs: updatedJobs,
            currentBayId: null
          };
        }
        return c;
      }));

      addLogEntry(`MANAGER OVERRIDE: ${carObj.make} ${carObj.model} (${carObj.plateNumber}) manually added to ${res.name} waitlist queue.${hasPreviousBay ? ` ${bayObj?.name || 'Previous bay'} released.` : ''}`, 'success');
    }

    // 4. Send the required toast notification for Event 1 (when moved to Alignment)
    if (resourceId === 'alignment-rig') {
      setToastAlerts(prev => [
        ...prev,
        {
          id: `toast-align-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Job Completed',
          description: `Vehicle ${carObj.plateNumber} has completed its job and has been assigned to the Alignment RIG.`,
          severity: 'info',
          timestamp: currentTime,
          isPushAlert: false
        }
      ]);

      setNotifications(prev => [
        {
          id: `manual-align-notify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Alignment Assigned (Manual)',
          message: `Vehicle ${carObj.plateNumber} was manually moved to the Alignment RIG queue.`,
          timestamp: currentTime,
          type: 'info',
          category: 'operational',
          read: false
        },
        ...prev
      ]);
    } else if (resourceId === 'wash-bay') {
      setToastAlerts(prev => [
        ...prev,
        {
          id: `toast-wash-manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Manual Override: Wash Bay Assignment',
          description: `Vehicle ${carObj.plateNumber} assigned to Wash BAY. ${bayObj?.name || 'Previous bay'} released.`,
          severity: 'info',
          timestamp: currentTime,
          isPushAlert: false
        }
      ]);
    }
  };

  const handleRemoveFromQueue = (resourceId: string, carId: string) => {
    setSharedResources(prev => prev.map(r => {
      if (r.id === resourceId) {
        return { ...r, queue: r.queue.filter(id => id !== carId) };
      }
      return r;
    }));

    setCars(prev => prev.map(c => c.id === carId ? { ...c, sharedResourceStatus: 'none', sharedResourceRequest: 'none' } : c));
    const carObj = cars.find(c => c.id === carId);
    if (carObj) {
      addLogEntry(`${carObj.make} ${carObj.model}: Withdrawn from shared lane list.`, 'warning');
    }
  };

  const handleReorderResourceQueue = (resourceId: string, direction: 'up' | 'down', index: number) => {
    setSharedResources(prev => prev.map(r => {
      if (r.id !== resourceId) return r;
      const newQueue = [...(r.queue || [])];
      if (direction === 'up' && index > 0) {
        const temp = newQueue[index];
        newQueue[index] = newQueue[index - 1];
        newQueue[index - 1] = temp;
      } else if (direction === 'down' && index < newQueue.length - 1) {
        const temp = newQueue[index];
        newQueue[index] = newQueue[index + 1];
        newQueue[index + 1] = temp;
      }
      return { ...r, queue: newQueue };
    }));
    addLogEntry(`Reordered waiting queue for alignment/wash station: ${direction.toUpperCase()} at index ${index + 1}.`, 'info');
  };

  // --- TIME SIMULATOR ENGINE ---
  const handleAdvanceTime = (mins: number) => {
    tickRef.current = 0; // Synchronize underlying tick state so we don't fire midway
    setSecondsInMinute(0); // Synchronize visual sync when user clicks advance buttons
    
    // Calculate how many minutes of the advance are during active working hours (08:00 - 20:00)
    const activeWorkingMins = calculateActiveMinsAdvanced(currentTime, mins);
    
    const [h, m] = currentTime.split(':').map(Number);
    let totalMins = h * 60 + m + mins;
    
    if (totalMins >= 1440) totalMins -= 1440;
    
    const nextH = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const nextM = String(totalMins % 60).padStart(2, '0');
    const newSimTime = `${nextH}:${nextM}`;

    // 1. Calculate and Prepare Next Car States
    const nextCars = cars.map(c => {
      // (Removed automatic holding expiry logic - vehicles must be manually moved back from holding)
      
      if (c.overallStatus === 'completed' && c.sharedResourceStatus !== 'active' && c.sharedResourceStatus !== 'queued') return c;

      // Ensure that if this car is active in a shared resource, its corresponding shared resource job is set to 'in-progress'
      let baseJobs = [...c.jobs];
      if (c.sharedResourceStatus === 'active') {
        const hasJob = baseJobs.some(j => {
          const t = j.title.toLowerCase();
          return c.sharedResourceRequest === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
        });

        if (!hasJob) {
          if (c.sharedResourceRequest === 'alignment') {
            const alignRes = sharedResources.find(r => r.id === 'alignment-rig');
            const alignTech = STAFF_ROSTER.find(t => t.id === alignRes?.assignedTechnicianId)?.name || 'Ravi Kumar';
            baseJobs.push({
              id: `job-align-auto-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: 'Laser Wheel Alignment',
              durationMins: 30,
              elapsedMins: 0,
              status: 'in-progress' as const,
              technicianName: alignTech,
              cost: 50
            });
          } else {
            const washRes = sharedResources.find(r => r.id === 'wash-bay');
            const washTech = STAFF_ROSTER.find(t => t.id === washRes?.assignedTechnicianId)?.name || 'Krishna Murthy';
            baseJobs.push({
              id: `job-wash-auto-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: 'Complimentary Wash & Vacuum',
              durationMins: 15,
              elapsedMins: 0,
              status: 'in-progress' as const,
              technicianName: washTech,
              cost: 0
            });
          }
        } else {
          baseJobs = baseJobs.map(j => {
            const t = j.title.toLowerCase();
            const matches = c.sharedResourceRequest === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
            return matches && j.status === 'pending' ? { ...j, status: 'in-progress' as const } : j;
          });
        }
      }

      const updatedJobs = baseJobs.map(j => {
        if (j.status === 'in-progress') {
          const newElapsed = Math.min(j.durationMins, j.elapsedMins + activeWorkingMins);
          const nextStatus = newElapsed >= j.durationMins ? 'completed' as const : 'in-progress' as const;
          
          if (nextStatus === 'completed' && j.status !== 'completed') {
            addLogEntry(`${c.make} ${c.model} (${c.plateNumber}): Finished job task "${j.title}".`, 'success');
          }
          
          return { ...j, elapsedMins: newElapsed, status: nextStatus };
        }
        return j;
      });

      const hasServiceBay = updatedJobs.some(j => {
        const title = j.title.toLowerCase();
        return !title.includes('align') && !title.includes('wash') && !title.includes('vacuum') && !title.includes('detail');
      });
      const isJobDone = hasServiceBay ? updatedJobs.filter(j => {
        const title = j.title.toLowerCase();
        return !title.includes('align') && !title.includes('wash') && !title.includes('vacuum') && !title.includes('detail');
      }).every(j => j.status === 'completed') : true;

      const isAlignmentDone = updatedJobs.some(j => j.title.toLowerCase().includes('align') && j.status === 'completed');
      const isWashDone = updatedJobs.some(j => (j.title.toLowerCase().includes('wash') || j.title.toLowerCase().includes('vacuum') || j.title.toLowerCase().includes('detail')) && j.status === 'completed');

      const allDone = isJobDone && isAlignmentDone && isWashDone;
      
      if (allDone && c.overallStatus !== 'completed') {
        addLogEntry(`${c.make} ${c.model} (${c.plateNumber}): All shop procedures finalized. Vehicle ready for dispatch.`, 'success');
      }
      
      // Track status transitions
      let newOverallStatus = c.overallStatus;
      
      // Reset from completed if new jobs were added
      if (!allDone && c.overallStatus === 'completed') {
        newOverallStatus = 'healthy';
      }
      
      // Promised time check
      const [pHour, pMin] = c.promisedTime.split(':').map(Number);
      const [cHour, cMin] = newSimTime.split(':').map(Number);
      const diffPromised = (pHour * 60 + pMin) - (cHour * 60 + cMin);
      
      if (diffPromised < 0 && newOverallStatus !== 'critical' && newOverallStatus !== 'completed') {
        newOverallStatus = 'critical';
        addLogEntry(`${c.make} ${c.model} (${c.plateNumber}): Promised dispatch time BREACHED. Status elevated to CRITICAL.`, 'error');
      } else if (diffPromised <= 60 && diffPromised >= 0 && newOverallStatus === 'healthy') {
        newOverallStatus = 'at-risk';
        addLogEntry(`${c.make} ${c.model} (${c.plateNumber}): Within 60 mins of promised time. Status set to AT-RISK.`, 'warning');
      }

      let forcedBlockedStatus = newOverallStatus;
      if (c.currentBayId && newOverallStatus !== 'blocked' && c.blockedAt && (c.approvalPending || c.partsOnOrder)) {
         const diff = getTimeDiff(c.blockedAt, newSimTime);
         if (diff >= 120) {
             forcedBlockedStatus = 'blocked';
         }
      }

      const finalStatus = allDone ? 'completed' as const : (forcedBlockedStatus === 'blocked' ? 'blocked' as const : newOverallStatus);
      
      let finalBayId = c.currentBayId;
      
      // If all jobs are done, release the bay and move to dispatch
      if (allDone && c.currentBayId) {
        finalBayId = null;
      }

      return {
        ...c,
        jobs: updatedJobs,
        overallStatus: finalStatus,
        currentBayId: finalBayId,
        sharedResourceStatus: allDone ? 'completed' as const : c.sharedResourceStatus
      };
    });

    // Handle bay freeing in side effects if they were released in the map above
    const releasedBayIds = nextCars
      .filter((c, idx) => cars[idx].currentBayId !== null && c.currentBayId === null)
      .map(c => cars.find(oldC => oldC.id === c.id)?.currentBayId)
      .filter(id => id !== null) as string[];

    if (releasedBayIds.length > 0) {
      setBays(prev => prev.map(b => releasedBayIds.includes(b.id) ? { ...b, currentCarId: null, becameFreeAt: newSimTime } : b));
    }

    // Handle shared resource freeing
    const releasedSharedResourceCars = nextCars.filter((c, idx) => 
      cars[idx].sharedResourceStatus === 'active' && c.sharedResourceStatus === 'completed'
    );

    if (releasedSharedResourceCars.length > 0) {
      setSharedResources(prev => prev.map(res => {
        const releasedCar = releasedSharedResourceCars.find(c => res.currentCarId === c.id);
        if (releasedCar) {
          return { ...res, currentCarId: null };
        }
        return res;
      }));
    }

    // 2. Identify and Process System-Triggered Auto-Assignments
    const assignments: { bayId: string; carId: string }[] = [];
    const waitlistBase = nextCars.filter(c => 
      c.currentBayId === null && 
      c.overallStatus !== 'completed' && 
      c.overallStatus !== 'blocked' &&
      c.sharedResourceStatus === 'none' // ONLY cars with NO shared resource involvement (queued/active/completed)
    );

    const idleBays = bays.filter(b => b.currentCarId === null && b.becameFreeAt !== null);

    const [hCur, mCur] = newSimTime.split(':').map(Number);
    const isAfter9PM = hCur >= 21 || hCur < 8;

    if (!isAfter9PM && idleBays.length > 0 && waitlistBase.length > 0) {
      let currentQL = [...waitlistBase];
      console.log(`[Auto-Assign Eval] Time: ${newSimTime} | Idle Bays: ${idleBays.length} | Queue Length: ${currentQL.length}`);
      idleBays.forEach(bay => {
        const diff = getTimeDiff(bay.becameFreeAt, newSimTime);
        console.log(`  -> Bay ${bay.id} free since ${bay.becameFreeAt} (Diff: ${diff}m)`);
        if (diff >= 10 && currentQL.length > 0) {
          const targetCar = currentQL[0];
          console.log(`  -> MATCH: Assigning Car ${targetCar.id} to Bay ${bay.id}`);
          assignments.push({ bayId: bay.id, carId: targetCar.id });
          addLogEntry(`AUTO-PILOT: ${targetCar.make} ${targetCar.model} (${targetCar.plateNumber}) moved from queue to ${bay.name}.`, 'success');
          currentQL = currentQL.slice(1);
        }
      });
    }

    // 3. Final State Synchronization
    setCurrentTime(newSimTime);

    // Track prolonged bay blockages (>= 2 hours)
    nextCars.forEach(c => {
      if (c.overallStatus === 'blocked' && c.currentBayId) {
        let isTwoHrsBlock = false;
        
        if (c.blockedAt) {
          const diff = getTimeDiff(c.blockedAt, newSimTime);
          if (diff >= 120) isTwoHrsBlock = true;
        }
        
        if (c.partsOnOrder && c.partsExpectedTime) {
          const etaStr = c.partsExpectedTime.toLowerCase();
          if (etaStr.includes('2 h') || etaStr.includes('2hr') || etaStr.includes('2 hours') || etaStr.includes('120') || etaStr.includes('3 h') || etaStr.includes('3hr') || etaStr.includes('4 h')) {
            isTwoHrsBlock = true;
          }
        }

        if (isTwoHrsBlock) {
          const expectedId = `block-2h-${c.id}-${c.blockedAt || 'eta'}`;
          setNotifications(prev => {
            if (prev.some(n => n.id === expectedId)) return prev;
            
            const bayName = bays.find(b => b.id === c.currentBayId)?.name || 'a Bay';
            const errorMsg = c.holdingReason === 'manual' 
                             ? `Mechanic indicated: ${c.manualBlockReason || 'Manual block'}.`
                             : c.partsOnOrder
                               ? 'Parts delivery delayed / estimated > 2 hours.' 
                               : 'Customer not responding for over 2 hours.';
                             
            return [{
              id: expectedId,
              title: 'Critical: Bay Blocked > 2Hrs',
              message: `Vehicle ${c.plateNumber} has stalled ${bayName}. ${errorMsg} Immediate resolution required.`,
              timestamp: newSimTime,
              type: 'critical',
              category: 'risk',
              read: false
            }, ...prev];
          });
        }
      }
    });
    
    if (assignments.length > 0) {
      setBays(prev => prev.map(b => {
        const match = assignments.find(a => a.bayId === b.id);
        return match ? { ...b, currentCarId: match.carId, becameFreeAt: null } : b;
      }));

      const finalCars = nextCars.map(c => {
        const match = assignments.find(a => a.carId === c.id);
        if (match) {
          return { 
            ...c, 
            currentBayId: match.bayId,
            jobs: c.jobs.map((j, idx) => {
              const pendingIdx = c.jobs.findIndex(job => job.status === 'pending');
              return idx === pendingIdx ? { ...j, status: 'in-progress', technicianName: 'System Assignment' } : j;
            })
          };
        }
        return c;
      });
      setCars(finalCars);

      assignments.forEach(a => {
        const car = nextCars.find(c => c.id === a.carId);
        const bay = bays.find(b => b.id === a.bayId);
        if (car && bay) {
          addLogEntry(`AUTO-PILOT: Assigned ${car.plateNumber} to ${bay.name} (Idle threshold met).`, 'success');
          setNotifications(prev => [{
            id: `auto-${Date.now()}-${a.carId}`,
            title: 'System Optimization',
            message: `Auto-assigned ${car.plateNumber} to ${bay.name}.`,
            timestamp: newSimTime,
            type: 'info',
            category: 'operational',
            read: false
          }, ...prev]);
        }
      });
    } else {
      setCars(nextCars);
    }

    // 4. Auto-advance shared resources that have completed their jobs
    const completedResources: string[] = [];
    sharedResources.forEach(res => {
      const activeCarId = res.currentCarId;
      if (activeCarId) {
        const car = nextCars.find(c => c.id === activeCarId);
        if (car) {
          const job = car.jobs.find(j => {
            const t = j.title.toLowerCase();
            return res.type === 'alignment' ? t.includes('align') : (t.includes('wash') || t.includes('detail'));
          });
          if (job && job.status === 'completed') {
            completedResources.push(res.id);
          }
        }
      }
    });

    if (completedResources.length > 0) {
      setTimeout(() => {
        completedResources.forEach(resId => {
          handleAdvanceResourceQueue(resId);
        });
      }, 50);
    }

    addLogEntry(`Cycle synchronization successful: ${newSimTime}.`, 'info');
  };

  const handleResolveActionableNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // 1. Mark notification as resolved
    setNotifications(prev => prev.map(n => {
      if (n.id === notificationId) {
        return {
          ...n,
          status: 'resolved',
          resolvedAt: currentTime,
          read: true
        };
      }
      return n;
    }));

    // 2. Perform direct physical system action on corresponding vehicle if linked!
    if (notification.relatedCarId) {
      setCars(prev => prev.map(c => {
        if (c.id === notification.relatedCarId) {
          addLogEntry(`[OVERRIDE RESOLVE] Center Manager resolved actionable alarm: "${notification.title}". Blocker cleared on ${c.make} ${c.model}.`, 'success');
          
          return {
            ...c,
            overallStatus: 'healthy',
            approvalPending: false,
            partsOnOrder: false,
            holdingReason: undefined,
            jobs: c.jobs.map(j => j.status === 'hold' ? { ...j, status: 'pending' } : j)
          };
        }
        return c;
      }));
    }
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const notification = notifications.find(n => n.id === id);
    if (notification?.relatedCarId) {
      setSelectedCarId(notification.relatedCarId);
      setActiveTab('vehicle_detail');
    } else {
      setActiveTab('notification_centre');
    }
  };

  const handleResetData = () => {
    // Clear all standard user data v4 and v5 keys
    localStorage.removeItem('mb_cars_v4');
    localStorage.removeItem('mb_bays_v4');
    localStorage.removeItem('mb_shared_resources_v4');
    localStorage.removeItem('mb_logs_v4');
    localStorage.removeItem('mb_time_v4');
    localStorage.removeItem('mb_shown_toasts_v4');
    localStorage.removeItem('mb_notifications_v5');

    // Clear QA Cron / automation cache keys
    localStorage.removeItem('qa_last_cron_run_date');
    localStorage.removeItem('qa_last_cron_run_time');
    localStorage.removeItem('qa_last_midday_run_date');
    localStorage.removeItem('qa_last_midday_run_time');
    localStorage.removeItem('qa_cron_logs');
    localStorage.removeItem('qa_payload_type');
    localStorage.removeItem('qa_env_override');

    // Reset local react states
    setShownToastKeys([]);
    setToastAlerts([]);
    setCars(INITIAL_CARS);
    setBays(INITIAL_BAYS);
    setSharedResources(INITIAL_SHARED_RESOURCES);
    setLogs(INITIAL_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentTime('08:00');
    addLogEntry('Demo database states and cache cleared. Successfully reseeded to pristine initial state.', 'success');
  };

  // Drag and drop queue targets
  const handleQueueDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleQueueDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const carId = e.dataTransfer.getData('text/plain');
    if (carId) {
      const carObj = cars.find(c => c.id === carId);
      if (carObj) {
        if (carObj.currentBayId) {
          handleReleaseCarFromBay(carObj.currentBayId);
        } else if (carObj.overallStatus === 'blocked') {
          // Dragged from holding area back to waiting queue
          handleMoveHoldingToWaiting(carId, false);
        }
      }
    }
  };

  const handleHoldingAreaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleHoldingAreaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const carId = e.dataTransfer.getData('text/plain');
    if (carId) {
      setHoldingAreaParams({ carId });
    }
  };

  const executeHoldingAreaDrop = (carId: string, date: string, time: string, reason: 'parts' | 'confirmation' | 'manual', manualReason?: string) => {
    const carObj = cars.find(c => c.id === carId);
    if (!carObj) return;

    if (carObj.currentBayId) {
      handleReleaseCarFromBay(carObj.currentBayId);
    }

    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        const isParts = reason === 'parts';
        return {
          ...c,
          overallStatus: 'blocked',
          blockedAt: currentTime,
          partsOnOrder: isParts ? true : c.partsOnOrder,
          approvalPending: reason === 'confirmation' ? true : c.approvalPending,
          holdingReason: reason,
          manualBlockReason: manualReason || c.manualBlockReason,
          partsExpectedTime: `${date} at ${time}`, // Store here temporarily
          promisedTime: time // optional, update the schedule
        };
      }
      return c;
    }));

    const reasonLabel = reason === 'manual' ? `Manual: ${manualReason}` : reason === 'parts' ? 'Waiting for Parts' : 'Waiting for Confirmation';
    addLogEntry(`${carObj.make} ${carObj.model} (${carObj.plateNumber}): Moved to Holding Area (${reasonLabel}). Expected pick-up manually set to ${date} ${time} by Admin.`, 'warning');
    setHoldingAreaParams(null);
  };

  const handleMoveHoldingToWaiting = (carId: string, resolved: boolean) => {
    const carObj = cars.find(c => c.id === carId);
    if (!carObj) return;

    const resourceIdToReturnTo = carObj.blockedFromResourceId;

    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        return {
          ...c,
          overallStatus: 'healthy',
          approvalPending: false,
          partsOnOrder: false,
          holdingReason: undefined,
          blockedFromResourceId: null,
          sharedResourceStatus: resourceIdToReturnTo ? 'queued' : c.sharedResourceStatus
        };
      }
      return c;
    }));

    if (resourceIdToReturnTo) {
      setSharedResources(prev => prev.map(res => {
        if (res.id === resourceIdToReturnTo) {
          // Add back to waitlist if not already there
          if (!res.queue.includes(carId)) {
            return { ...res, queue: [...res.queue, carId] };
          }
        }
        return res;
      }));
    }

    const statusLabel = resolved ? 'Block Resolved with Confirmation' : 'Manual Transfer';
    const targetLabel = resourceIdToReturnTo ? `Waitlist of ${sharedResources.find(r => r.id === resourceIdToReturnTo)?.name}` : 'Waiting Queue';
    addLogEntry(`${carObj.make} ${carObj.model} (${carObj.plateNumber}): Moved from Holding Area to ${targetLabel} (${statusLabel}).`, 'success');
  };

  const handleQueueItemDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    // Check if dragged element is a holding area car
    const draggedCar = cars.find(c => c.id === draggedId);
    if (draggedCar && draggedCar.overallStatus === 'blocked') {
      handleMoveHoldingToWaiting(draggedId, false);
      return;
    }

    if (draggedId === targetId) return;

    setCars(prev => {
      const draggedCarObj = prev.find(c => c.id === draggedId);
      if (!draggedCarObj) return prev;

      const withoutDragged = prev.filter(c => c.id !== draggedId);
      const targetIndex = withoutDragged.findIndex(c => c.id === targetId);
      if (targetIndex === -1) return prev;

      const newCars = [...withoutDragged];
      // Place it at the index of targetId
      newCars.splice(targetIndex, 0, draggedCarObj);
      return newCars;
    });

    const targetCar = cars.find(c => c.id === targetId);
    if (draggedCar && targetCar) {
      addLogEntry(`Reordered waiting queue: Dragged ${draggedCar.plateNumber} to position of ${targetCar.plateNumber}.`, 'info');
    }
  };

  const handleMoveQueueItem = (carId: string, direction: 'up' | 'down') => {
    const queueIndex = waitingQueueCars.findIndex(c => c.id === carId);
    if (queueIndex === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && queueIndex > 0) {
      targetIndex = queueIndex - 1;
    } else if (direction === 'down' && queueIndex < waitingQueueCars.length - 1) {
      targetIndex = queueIndex + 1;
    }

    if (targetIndex !== -1) {
      const itemA = waitingQueueCars[queueIndex];
      const itemB = waitingQueueCars[targetIndex];

      setCars(prev => {
        const newCars = [...prev];
        const idxA = newCars.findIndex(c => c.id === itemA.id);
        const idxB = newCars.findIndex(c => c.id === itemB.id);
        if (idxA !== -1 && idxB !== -1) {
          const temp = newCars[idxA];
          newCars[idxA] = newCars[idxB];
          newCars[idxB] = temp;
        }
        return newCars;
      });

      addLogEntry(`Reordered waiting queue: Moved ${itemA.make} ${itemA.model} (${itemA.plateNumber}) ${direction.toUpperCase()}.`, 'info');
    }
  };

  const handleSetQueuePriority = (carId: string, priority: 'high' | 'medium' | 'low') => {
    setCars(prev => prev.map(c => {
      if (c.id === carId) {
        return { ...c, queuePriority: priority };
      }
      return c;
    }));
    setTimeout(() => {
      const carObj = cars.find(c => c.id === carId);
      addLogEntry(`Priority Updated: ${carObj ? carObj.plateNumber : 'Vehicle'} priority set to ${priority.toUpperCase()}.`, 'info');
    }, 50);
  };

  const handleAutoSortQueueByPriority = () => {
    const waitingIds = waitingQueueCars.map(c => c.id);
    const priorityWeights = { 'high': 3, 'medium': 2, 'low': 1 };
    
    const sortedWaitingCars = [...waitingQueueCars].sort((a, b) => {
      const weightA = priorityWeights[a.queuePriority || 'low'] || 1;
      const weightB = priorityWeights[b.queuePriority || 'low'] || 1;
      return weightB - weightA; 
    });

    setCars(prev => {
      let sortedIndex = 0;
      return prev.map(c => {
        if (waitingIds.includes(c.id)) {
          const replacement = sortedWaitingCars[sortedIndex];
          sortedIndex++;
          return replacement;
        }
        return c;
      });
    });

    addLogEntry(`Manager executed auto-priority optimization across the Waiting Queue lane.`, 'success');
  };

  // Filter queues
  const filteredBays = bays.map(b => {
    const carInBay = cars.find(c => c.id === b.currentCarId) || null;
    return {
      bay: b,
      car: carInBay
    };
  });

  // Waiting vehicles list
  const trueWaitlist = cars.filter(c => 
    c.currentBayId === null && 
    c.overallStatus !== 'completed' &&
    c.overallStatus !== 'blocked' &&
    c.sharedResourceStatus !== 'active' &&
    c.sharedResourceStatus !== 'queued'
  );

  const waitingQueueCars = trueWaitlist.filter(c => 
    (c.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const holdingAreaCars = cars.filter(c => 
    c.currentBayId === null && 
    c.overallStatus === 'blocked' &&
    c.sharedResourceStatus !== 'active' &&
    (c.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const dispatchAreaCars = cars.filter(c => 
    c.overallStatus === 'completed' &&
    (c.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex selection:bg-teal-500/20 antialiased font-sans">
      
      {/* Top Right Toast Notifications stack */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none mb-4 max-h-[80vh] overflow-y-auto no-scrollbar">
        <div className="pointer-events-auto flex flex-col gap-2">
          <AnimatePresence>
            {toastAlerts.map(toast => (
              <ToastNotificationItem 
                key={toast.id} 
                toast={toast} 
                onClose={() => setToastAlerts(prev => prev.filter(t => t.id !== toast.id))} 
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* ======================================================== */}
      {/* 1. LEFT PINNED NAVIGATION SIDEBAR PLACEHOLDER            */}
      {/* ======================================================== */}
      <div className="w-[72px] h-screen flex-shrink-0 hidden md:block" />

      {/* ======================================================== */}
      {/* 1. LEFT PINNED NAVIGATION SIDEBAR                       */}
      {/* ======================================================== */}
      <motion.aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        animate={{ width: isSidebarHovered ? 260 : 72 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        style={{
          boxShadow: isSidebarHovered ? '4px 0 30px rgba(0, 0, 0, 0.4)' : 'none'
        }}
        className="bg-white border-r border-neutral-200 flex flex-col justify-between items-center py-5 select-none hidden md:flex h-screen fixed top-0 left-0 z-50 transition-shadow duration-300 overflow-x-hidden"
      >
        <div className="flex flex-col items-center gap-6 w-full px-3.5">
          {/* Logo Brand tool badge */}
          <div className="flex items-center w-full overflow-hidden shrink-0">
            <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex shrink-0 items-center justify-center shadow-inner">
                <Wrench className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className={`flex flex-col min-w-0 ml-1 shrink-0 transition-opacity duration-300 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-[13px] font-black text-neutral-900 tracking-widest leading-none text-nowrap uppercase mt-0.5">AutoTrack</span>
              <span className="text-[9px] text-teal-600 font-extrabold uppercase tracking-widest mt-1.5 leading-none text-nowrap">Mercedes Service</span>
            </div>
          </div>

          {/* Navigation vertical list */}
          <nav className="flex flex-col gap-1.5 w-full overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-none py-1.5 border-t border-b border-neutral-100 overflow-x-hidden">
            {[
              { id: 'floor', icon: LayoutGrid, label: 'Live Floor View' },
              { id: 'home', icon: Home, label: 'Manager Dashboard' },
              { id: 'operations_board', icon: SlidersHorizontal, label: 'Vehicle Operations Board' },
              { id: 'bay_management', icon: Wrench, label: 'Workshop Bay Board' },
              { id: 'approval_center', icon: CheckSquare, label: 'Supplementary Estimates CRM' },
              { id: 'parts_dependency', icon: Truck, label: 'Parts Dependency & Logistics' },
              { id: 'alignment_queue', icon: Compass, label: 'Wheel Alignment Queue' },
              { id: 'wash_queue', icon: Sparkles, label: 'Wash Bay Queue' },
              { id: 'mechanic_workload', icon: Users, label: 'Mechanic Workload capacity' },
              { id: 'daily_review', icon: BarChart3, label: 'Production KPI Review' },
              { id: 'notification_centre', icon: Bell, label: 'Notification Centre' },
              { id: 'alerts_risk', icon: ShieldAlert, label: 'Risks & System Alarms Desk' },
              { id: 'qa_automation', icon: Terminal, label: 'QA Testing Console' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              const isNested = 'isNested' in item && item.isNested;
              return (
                <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   title={isSidebarHovered ? undefined : item.label}
                   className={`h-[44px] rounded-xl flex items-center w-full transition-colors relative overflow-hidden shrink-0 ${
                     isNested && isSidebarHovered ? 'pl-4' : ''
                   } ${
                     isSelected 
                       ? 'bg-teal-50 text-teal-700 font-bold' 
                       : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                   }`}
                >
                  <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
                    {isNested && isSidebarHovered ? (
                      <span className="text-teal-400 font-mono text-xs mr-0.5">└─</span>
                    ) : null}
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                  </div>
                  
                  <span
                    className={`text-xs font-bold whitespace-nowrap text-left tracking-wide transition-opacity duration-300 ml-1 ${
                      isSidebarHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom items */}
        <div className="flex flex-col gap-4 w-full px-3.5 pb-2">
          <button 
            onClick={() => setIsFiltersOpen(prev => !prev)}
            className="h-[44px] rounded-xl text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 flex items-center transition-colors cursor-pointer w-full overflow-hidden shrink-0"
            title="Operational System Rules"
          >
            <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
              <AlertCircle className="w-[18px] h-[18px] shrink-0" />
            </div>
            <span className={`text-xs font-bold whitespace-nowrap ml-1 transition-opacity duration-300 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>
              System Rules
            </span>
          </button>
          
          <div className="flex items-center w-full overflow-hidden shrink-0 pb-1">
            <div className="w-[44px] h-[44px] flex items-center justify-center shrink-0">
              <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 flex shrink-0 items-center justify-center font-bold text-xs text-neutral-600 select-none shadow-sm cursor-pointer hover:bg-neutral-200">
                BP
              </div>
            </div>
            <div className={`flex flex-col min-w-0 ml-1 shrink-0 transition-opacity duration-300 ${isSidebarHovered ? 'opacity-100' : 'opacity-0'}`}>
              <span className="text-xs font-extrabold text-neutral-900 leading-none truncate text-nowrap mt-0.5">Bharath Poojari</span>
              <span className="text-[10px] text-neutral-500 font-bold leading-none mt-1.5 truncate text-nowrap">Workshop Admin</span>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Drawer Menu (Burger Menu style) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <React.Fragment key="mobile-menu-presence">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 md:hidden flex flex-col justify-between p-6"
            >
              <div className="flex flex-col gap-6">
                {/* Header of Drawer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-800 text-teal-300 flex items-center justify-center shadow-inner">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-neutral-900 tracking-tight block">AutoTrack</span>
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block">Console</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="h-[1px] w-full bg-neutral-100" />

                {/* Vertical menu list */}
                <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none pr-1">
                  {[
                    { id: 'floor', icon: LayoutGrid, label: 'Live Floor View' },
                    { id: 'home', icon: Home, label: 'Manager Dashboard' },
                    { id: 'operations_board', icon: SlidersHorizontal, label: 'Vehicle Operations Board' },
                    { id: 'bay_management', icon: Wrench, label: 'Workshop Bay Board' },
                    { id: 'approval_center', icon: CheckSquare, label: 'Supplementary Estimates CRM' },
                    { id: 'parts_dependency', icon: Truck, label: 'Parts Dependency & Logistics' },
                    { id: 'alignment_queue', icon: Compass, label: 'Wheel Alignment Queue' },
                    { id: 'wash_queue', icon: Sparkles, label: 'Wash Bay Queue' },
                    { id: 'mechanic_workload', icon: Users, label: 'Mechanic Workload capacity' },
                    { id: 'daily_review', icon: BarChart3, label: 'Production KPI Review' },
                    { id: 'notification_centre', icon: Bell, label: 'Notification Centre' },
                    { id: 'alerts_risk', icon: ShieldAlert, label: 'Risks & System Alarms Desk' },
                    { id: 'qa_automation', icon: Terminal, label: 'QA Testing Console' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeTab === item.id;
                    const isNested = 'isNested' in item && item.isNested;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full h-12 rounded-xl flex items-center gap-3.5 px-4 transition-all ${
                          isNested ? 'pl-8' : ''
                        } ${
                          isSelected 
                            ? 'bg-neutral-950 text-white shadow-md font-bold' 
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
                        } text-xs`}
                      >
                        {isNested ? (
                          <span className="text-neutral-400 font-mono text-sm mr-1">└─</span>
                        ) : null}
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom profile info in Drawer */}
              <div className="flex flex-col gap-4 border-t border-neutral-100 pt-4">
                <button 
                  onClick={() => {
                    setIsFiltersOpen(prev => !prev);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full h-11 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-neutral-600 flex items-center px-4 gap-3 text-xs font-semibold cursor-pointer"
                >
                  <AlertCircle className="w-5 h-5 text-neutral-400" />
                  <span>System Rules</span>
                </button>

                <div className="flex items-center gap-3 px-1">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center font-bold text-xs text-neutral-600 select-none shadow-sm shadow-black/5">
                    BP
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-neutral-850 leading-none">Bharath Poojari</span>
                    <span className="text-[10px] text-neutral-400 font-bold leading-none mt-1">Admin Profile</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. MAIN APP CONTENT CONTAINER AREA                      */ }
      {/* ======================================================== */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Top Header bar with exact layout */}
        <header className="h-[76px] px-4 sm:px-6 border-b border-neutral-200 bg-white flex items-center justify-between select-none gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Burger Menu Button for Mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 bg-white hover:bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors flex md:hidden items-center justify-center cursor-pointer flex-shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <button className="p-2 hover:bg-neutral-50 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:block">
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-neutral-900 tracking-tight truncate max-w-[120px] xs:max-w-[170px] sm:max-w-xs md:max-w-none">
                {activeTab === 'home' && 'Manager Dashboard'}
                {activeTab === 'floor' && 'Live Floor View'}
                {activeTab === 'operations_board' && 'Vehicle Operations Board'}
                {activeTab === 'vehicle_detail' && 'Vehicle Diagnostic Profiler'}
                {activeTab === 'bay_management' && 'Workshop Bay Board'}
                {activeTab === 'approval_center' && 'Supplementary Estimates CRM'}
                {activeTab === 'parts_dependency' && 'Parts Dependency & Logistics'}
                {activeTab === 'alignment_queue' && 'Wheel Alignment Queue'}
                {activeTab === 'wash_queue' && 'Wash Bay Queue'}
                {activeTab === 'mechanic_workload' && 'Mechanic Staffing & Capacity'}
                {activeTab === 'daily_review' && 'Production KPI Review'}
                {activeTab === 'notification_centre' && 'Automated Notification Archive'}
                {activeTab === 'alerts_risk' && 'Risks & System Alarms Desk'}
                {activeTab === 'design_system' && 'Design System Lab'}
                {activeTab === 'qa_automation' && 'QA Automation Console'}
              </h1>
              <span className="text-[10px] sm:text-xs text-neutral-400 font-bold tracking-wide mt-0.5 hidden lg:block truncate">
                {activeTab === 'home' && 'Continuous operational command console'}
                {activeTab === 'floor' && 'Floor Operations · Wireframe v0.1'}
                {activeTab === 'operations_board' && 'Active vehicles, tracking delays and commitments'}
                {activeTab === 'vehicle_detail' && 'Diagnostic lookup, timelines and active blocks'}
                {activeTab === 'bay_management' && 'Individual service bay assignments & workloads'}
                {activeTab === 'approval_center' && 'Supplementary work quotes triage Kanban'}
                {activeTab === 'parts_dependency' && 'Supply chain tracking, delivery transits & risk assessment'}
                {activeTab === 'alignment_queue' && 'Laser measurement elevator backlog sequence'}
                {activeTab === 'wash_queue' && 'Handoff sprayer cabin throughput checklist'}
                {activeTab === 'mechanic_workload' && 'Technician utilization rate & staffing balance'}
                {activeTab === 'daily_review' && 'Production KPI Review'}
                {activeTab === 'notification_centre' && 'Centralized log of all critical floor signals and client decisions'}
                {activeTab === 'alerts_risk' && 'Rapid alarm scanner and automated dispatches'}
                {activeTab === 'design_system' && 'Visual style guide, components library, and custom variables specs'}
                {activeTab === 'qa_automation' && 'Scheduled mock data injections, environment decoupling rules and logs'}
              </span>
            </div>
          </div>

          {/* Right Header: search vehicles, filters custom button, profile etc. */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            
            {/* Simulation Clock control nicely styled inside header */}
            <div className="bg-neutral-100 p-1 sm:p-2 py-1 sm:py-1.5 rounded-lg border border-neutral-200 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-neutral-800 font-mono animate-pulse">
                    {currentTime}
                  </span>
                  
                  <div className="h-4 w-px bg-neutral-200 hidden xs:block" />
                  
                  <button 
                    onClick={() => setIsLiveMode(!isLiveMode)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                      isLiveMode 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-neutral-50 text-neutral-500 border-neutral-200"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", isLiveMode ? "bg-emerald-500 animate-pulse" : "bg-neutral-300")} />
                    {isLiveMode ? 'Live' : 'Paused'}
                  </button>

                  <div className="h-4 w-px bg-neutral-200 hidden xs:block" />

                  <button 
                    onClick={() => handleAdvanceTime(1)}
                    className="p-1 hover:bg-white rounded transition-colors text-neutral-400 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Advance Sim Time +1 min"
                    disabled={isLiveMode}
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
              {(() => {
                const [h, m] = currentTime.split(':').map(Number);
                const tMins = h * 60 + m;
                let statusText = 'CLOSED';
                let colorClass = 'bg-neutral-200 text-neutral-700 border-neutral-300';
                if (tMins >= 480 && tMins < 1200) {
                  statusText = 'OPEN';
                  colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold';
                } else if (tMins >= 1200 && tMins < 1230) {
                  statusText = 'BUFFER PERIOD';
                  colorClass = 'bg-amber-100 text-amber-800 border-amber-200 font-semibold animate-pulse';
                }
                return (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold tracking-wider border select-none ${colorClass}`}>
                    {statusText}
                  </span>
                );
              })()}
              <div className="flex gap-0.5 sm:gap-1 pl-0.5 sm:pl-1">
                <button 
                  onClick={() => handleAdvanceTime(5)}
                  className="px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-200 font-bold rounded cursor-pointer"
                  title="Forward 5 minutes"
                >
                  +5m
                </button>
                <button 
                  onClick={() => handleAdvanceTime(15)}
                  className="px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] bg-neutral-900 text-white hover:bg-neutral-800 font-bold rounded shadow-xs cursor-pointer"
                  title="Forward 15 minutes"
                >
                  +15m
                </button>
                <button 
                  onClick={() => handleAdvanceTime(30)}
                  className="px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] bg-teal-800 text-white hover:bg-teal-700 font-bold rounded shadow-xs cursor-pointer"
                  title="Forward 30 minutes to check 30m Client SLA Silence"
                >
                  +30m
                </button>
                <button 
                  onClick={() => handleAdvanceTime(60)}
                  className="px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] bg-rose-800 text-white hover:bg-rose-700 font-bold rounded shadow-xs cursor-pointer"
                  title="Forward 1 hour to check 1h/2h Client SLA Silence"
                >
                  +1h
                </button>
                <button 
                  onClick={handleResetData}
                  className="p-1 hover:bg-neutral-200 rounded hidden xs:block cursor-pointer"
                  title="Reset Workspace"
                >
                  <RefreshCw className="w-3 h-3 text-neutral-500" />
                </button>
              </div>
            </div>

            {/* Inputs & Filters */}
            <div className="relative w-[80px] xs:w-[130px] sm:w-[170px] md:w-[220px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-[10px] sm:text-xs pl-7 sm:pl-10 pr-2 h-8 sm:h-11 bg-neutral-100 rounded-lg border border-transparent outline-none focus:bg-white focus:border-neutral-300 font-medium shadow-inner transition"
              />
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                className="h-8 sm:h-11 w-8 sm:w-11 text-[10px] sm:text-xs font-semibold bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg flex items-center justify-center transition cursor-pointer flex-shrink-0 relative"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
                )}
              </button>
              
              <NotificationDropdown 
                notifications={notifications}
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                onViewAll={() => setActiveTab('notification_centre')}
                onNotificationClick={handleNotificationClick}
              />
            </div>
          </div>
        </header>

        {/* ======================================================== */}


        {/* Filter overlay option if clicked */}
        {isFiltersOpen && (
          <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200 flex items-center gap-4 transition-all">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">Filters:</span>
            <div className="flex gap-2">
              {['ALL', 'blocked', 'healthy'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-xs rounded-full font-bold transition ${
                    filterStatus === status 
                      ? 'bg-neutral-900 text-white' 
                      : 'bg-white border text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {status.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="flex-grow" />
            <button
              onClick={() => setIsNewJobOpen(true)}
              className="py-1 px-3 bg-teal-800 text-white rounded text-xs font-bold hover:bg-teal-700 font-sans transition"
            >
              + Create Intake
            </button>
          </div>
        )}

        {activeTab === 'home' && (
          <ManagerDashboard
            cars={cars}
            bays={bays}
            sharedResources={sharedResources}
            currentTime={currentTime}
            onSelectCar={(id) => setSelectedCarId(id)}
            onCustomerApprove={handleCustomerApprove}
            onCustomerDecline={handleCustomerDecline}
            onReceiveShortParts={handleReceiveShortParts}
            onAdvanceQueue={handleAdvanceResourceQueue}
            onRemoveFromQueue={handleRemoveFromQueue}
            onAssignCarToBay={handleAssignCarToBay}
            onDispatchCar={handleDispatchCar}
          />
        )}

        {activeTab === 'floor' && (
          <>
            {/* ======================================================== */}
            {/* 3. DYNAMIC STATUS CARDS / OVERVIEW METRICS              */}
            {/* ======================================================== */}
            {(() => {
              const activeCarsForMetrics = searchQuery.trim()
                ? cars.filter(c =>
                    c.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : cars;

              const delayedCars = activeCarsForMetrics.filter(c => getCarCategory(c) === 'delayed');
              const delayedCount = delayedCars.length;
 
              return (
                <div className="mx-6 mt-6 mb-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest block font-sans">Live Floor Overview Metrics</span>
                      {filterStatus !== 'ALL' && (
                        <button
                          onClick={() => setFilterStatus('ALL')}
                          className="px-2 py-0.5 text-[9px] font-black bg-neutral-150 text-neutral-600 rounded border border-neutral-250 hover:bg-neutral-200 hover:text-neutral-800 transition font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1"
                        >
                          Clear Filter ({filterStatus}) <span className="text-[10px] font-bold">×</span>
                        </button>
                      )}
                    </div>
                    {delayedCount > 0 && (
                      <div className="flex items-center gap-1.5 animate-in slide-in-from-right fade-in duration-400 ease-out text-critical-700 bg-critical-50 px-3 py-1.5 rounded-xl border border-critical-200">
                        <span className="text-[12px]">🚨</span>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest">
                          {delayedCount} Missed Deliver{delayedCount > 1 ? 'ies' : 'y'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Status card 1: total cars */}
                    <div 
                      onClick={() => setFilterStatus('ALL')}
                      className={`bg-white p-3.5 rounded-xl border transition cursor-pointer select-none custom-shadow-sm flex flex-col justify-between h-[100px] ${
                        filterStatus === 'ALL' ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50/5' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-neutral-450 font-extrabold uppercase tracking-wider font-mono">TOTAL ACTIVE</span>
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                      </div>
                      <div>
                        <span className="text-2xl font-mono font-extrabold text-neutral-900 block">{activeCarsForMetrics.filter(c => c.overallStatus !== 'completed').length}</span>
                        <span className="text-[10px] text-neutral-400 block font-sans mt-0.5">Active on floor</span>
                      </div>
                    </div>
 
                    {/* Status card 2: healthy */}
                    <div 
                      onClick={() => setFilterStatus('healthy')}
                      className={`bg-white p-3.5 rounded-xl border transition cursor-pointer select-none custom-shadow-sm flex flex-col justify-between h-[100px] ${
                        filterStatus === 'healthy' ? 'border-success-500 ring-1 ring-success-500 bg-success-50/5' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-neutral-450 font-extrabold uppercase tracking-wider font-mono">ON TRACK</span>
                        <span className="w-2 h-2 rounded-full bg-success-500" />
                      </div>
                      <div>
                        <span className="text-2xl font-mono font-extrabold text-success-700 block">
                          {activeCarsForMetrics.filter(c => getCarCategory(c) === 'healthy').length}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-sans mt-0.5">Healthy repair flow</span>
                      </div>
                    </div>
 
                    {/* Status card 3: at-risk */}
                    <div 
                      onClick={() => setFilterStatus('at-risk')}
                      className={`bg-white p-3.5 rounded-xl border transition cursor-pointer select-none custom-shadow-sm flex flex-col justify-between h-[100px] ${
                        filterStatus === 'at-risk' ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/5' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-neutral-450 font-extrabold uppercase tracking-wider font-mono">AT RISK / ALERT</span>
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                      <div>
                        <span className="text-2xl font-mono font-extrabold text-orange-600 block">
                          {activeCarsForMetrics.filter(c => getCarCategory(c) === 'at-risk').length}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-sans mt-0.5">SLA close breaches</span>
                      </div>
                    </div>
 
                    {/* Status card 4: blocked */}
                    <div 
                      onClick={() => setFilterStatus('blocked')}
                      className={`bg-white p-3.5 rounded-xl border transition cursor-pointer select-none custom-shadow-sm flex flex-col justify-between h-[100px] ${
                        filterStatus === 'blocked' ? 'border-red-500 ring-1 ring-red-500 bg-red-50/5' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-neutral-450 font-extrabold uppercase tracking-wider font-mono">STALLED / BLOCK</span>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      </div>
                      <div>
                        <span className="text-2xl font-mono font-extrabold text-red-600 block">
                          {activeCarsForMetrics.filter(c => getCarCategory(c) === 'blocked').length}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-sans mt-0.5">CRM & Spares stalls</span>
                      </div>
                    </div>
 
                    {/* Status card 5: completed */}
                    <div 
                      onClick={() => setFilterStatus('completed')}
                      className={`bg-white p-3.5 rounded-xl border transition cursor-pointer select-none custom-shadow-sm flex flex-col justify-between h-[100px] ${
                        filterStatus === 'completed' ? 'border-teal-500 ring-1 ring-teal-500 bg-teal-50/5' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-neutral-450 font-extrabold uppercase tracking-wider font-mono">COMPLETED</span>
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                      </div>
                      <div>
                        <span className="text-2xl font-mono font-extrabold text-teal-700 block">
                          {activeCarsForMetrics.filter(c => getCarCategory(c) === 'completed').length}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-sans mt-0.5">Ready to dispatch</span>
                      </div>
                    </div>
 
                    {/* Status card 6: DELAYED DISPATCHES */}
                    <div 
                      onClick={() => setFilterStatus('DELAYED')}
                      className={`p-3.5 rounded-xl border transition cursor-pointer select-none custom-shadow-sm flex flex-col justify-between h-[100px] ${
                        filterStatus === 'DELAYED'
                          ? 'border-critical-600 ring-1 ring-critical-600 bg-critical-50/5' 
                          : delayedCount > 0 
                          ? 'bg-critical-50/10 border-red-200 animate-pulse hover:border-red-300' 
                          : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] text-neutral-450 font-extrabold uppercase tracking-wider font-mono">MISSED COMMITMENT</span>
                        <span className={`w-2 h-2 rounded-full ${delayedCount > 0 ? 'bg-critical-500 animate-ping' : 'bg-neutral-300'}`} />
                      </div>
                      <div>
                        <span className={`text-2xl font-mono font-extrabold block ${delayedCount > 0 ? 'text-critical-700' : 'text-neutral-500'}`}>
                          {delayedCount}
                        </span>
                        <span className="text-[10px] text-neutral-450 block font-sans mt-0.5 font-medium">
                          {delayedCount > 0 ? 'Dispatch Commitment Missed' : 'No delayed hours'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ======================================================== */}
            {/* 4. WORKSPACE DIVISION (FLOOR LAYOUT & SIDEBAR QUEUE)     */}
            {/* ======================================================== */}
            <div className="flex-grow p-4 sm:p-6 pt-2 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto pb-12 select-none">
              
              {/* LEFT WORKSPACE: Service Bays & Shared rigs (Col span 8 on md, 9 on xl) */}
              <main className="col-span-1 md:col-span-8 xl:col-span-9 space-y-6">
                
                {/* General Service Bays section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm font-bold text-neutral-800 uppercase tracking-wider block">
                      General Service Bays
                    </span>
                    <span className="text-xs text-neutral-400 font-bold tracking-widest block font-mono">
                      8 BAYS · DYNAMIC REGION
                    </span>
                  </div>

                  {/* Responsively adaptive Grid layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredBays.map(({ bay, car }) => {
                      // Apply quick secondary status overlay filters if designated
                      if (filterStatus !== 'ALL') {
                        if (!car) return null;
                        const category = getCarCategory(car);
                        if (filterStatus === 'DELAYED') {
                          if (category !== 'delayed') return null;
                        } else if (filterStatus === 'at-risk') {
                          if (category !== 'at-risk') return null;
                        } else {
                          if (category !== filterStatus) return null;
                        }
                      }

                      return (
                        <ServiceBayCard
                          key={bay.id}
                          bay={bay}
                          car={car}
                          onSelectCar={(id) => setSelectedCarId(id)}
                          onToggleJobProgress={handleToggleJobProgress}
                          onReleaseBay={handleReleaseCarFromBay}
                          onAssignCar={handleAssignCarToBay}
                          availableStagedCars={waitingQueueCars}
                          availableWaitlistCars={trueWaitlist}
                          currentTime={currentTime}
                          secondsInMinute={secondsInMinute}
                        />
                      );
                    })}
                    {filteredBays.filter(({ car }) => {
                      if (filterStatus === 'ALL') return true;
                      if (!car) return false;
                      const category = getCarCategory(car);
                      if (filterStatus === 'DELAYED') return category === 'delayed';
                      if (filterStatus === 'at-risk') return category === 'at-risk';
                      return category === filterStatus;
                    }).length === 0 && (
                      <div className="col-span-full py-12 px-4 text-center text-xs text-neutral-450 bg-white border border-dashed border-neutral-250 rounded-2xl italic flex flex-col items-center justify-center gap-2">
                        <span>No active service bays match the active status filter: <strong className="uppercase font-mono text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">{filterStatus}</strong></span>
                        <button
                          onClick={() => setFilterStatus('ALL')}
                          className="mt-2 px-3 py-1 text-[10px] font-bold bg-neutral-100 text-neutral-650 rounded-lg hover:bg-neutral-200 hover:text-neutral-800 transition font-sans uppercase tracking-wider cursor-pointer border border-neutral-250"
                        >
                          Clear Filter to show all bays
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alignment Rig & Wash Bay Section full row width */}
                <div className="flex flex-col gap-6 pt-2">
                  
                  {/* Alignment Rig */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-sm font-bold text-neutral-800 uppercase tracking-wide">
                        Alignment Rig
                      </span>
                      <span className="text-neutral-400 font-bold font-mono uppercase tracking-wider">
                        1 Station
                      </span>
                    </div>
                    {sharedResources[0] && (
                      <SharedResourceCard
                        resource={sharedResources[0]}
                        cars={cars}
                        onAddToQueue={handleAddToResourceQueue}
                        onRemoveFromQueue={handleRemoveFromQueue}
                        onAdvanceQueue={handleAdvanceResourceQueue}
                      />
                    )}
                  </div>

                  {/* Wash Bay */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-sm font-bold text-neutral-800 uppercase tracking-wide">
                        Wash Bay
                      </span>
                      <span className="text-neutral-400 font-bold font-mono uppercase tracking-wider">
                        1 Station
                      </span>
                    </div>
                    {sharedResources[1] && (
                      <SharedResourceCard
                        resource={sharedResources[1]}
                        cars={cars}
                        onAddToQueue={handleAddToResourceQueue}
                        onRemoveFromQueue={handleRemoveFromQueue}
                        onAdvanceQueue={handleAdvanceResourceQueue}
                      />
                    )}
                  </div>

                </div>

              </main>

              {/* RIGHT SIDEBAR: Waiting Vehicle Queue column (Now on the Right for easy Drag and Drop) */}
              <aside className="col-span-1 md:col-span-4 xl:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-neutral-800 uppercase tracking-tight">
                      Waiting Vehicle Queue
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium font-sans">
                      Drag to allocate / arrange list by dragging
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-900 text-white font-mono shadow-inner">
                    {waitingQueueCars.length} waiting
                  </span>
                </div>

                {/* Drag drop dropzone list container */}
                <div 
                  onDragOver={handleQueueDragOver}
                  onDrop={handleQueueDrop}
                  className="space-y-2.5 h-[calc(70vh-140px)] overflow-y-auto pr-1 select-none flex flex-col"
                >
                  {waitingQueueCars.map((car, idx) => {
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

                    const estimatedMins = car.jobs.reduce((sum, j) => sum + (j.durationMins || 20), 0);
                    const remainingMins = (() => {
                      try {
                        const [pHour, pMin] = car.promisedTime.split(':').map(Number);
                        const [cHour, cMin] = currentTime.split(':').map(Number);
                        const promisedTotal = pHour * 60 + pMin;
                        const currentTotal = cHour * 60 + cMin;
                        return promisedTotal - currentTotal;
                      } catch {
                        return 120;
                      }
                    })();

                    // Risk if getting closer to promised time within the estimated time + 1 hour buffer (60 mins)
                    const isBufferRisk = remainingMins < (estimatedMins + 60);

                    const isAtRisk = isCarDelayed || car.overallStatus === 'critical' || car.overallStatus === 'at-risk' || isBufferRisk;

                    if (filterStatus !== 'ALL') {
                      const category = getCarCategory(car);
                      if (filterStatus === 'DELAYED') {
                        if (category !== 'delayed') return null;
                      } else if (filterStatus === 'at-risk') {
                        if (category !== 'at-risk') return null;
                      } else {
                        if (category !== filterStatus) return null;
                      }
                    }

                    const isHighPriority = car.queuePriority === 'high';
                    const isMediumPriority = car.queuePriority === 'medium';
                    
                    let borderStyle = 'border-neutral-200 hover:border-neutral-300';
                    if (isHighPriority) {
                      borderStyle = 'border-l-4 border-l-red-500 border-y-red-200 border-r-red-200 bg-red-50/5 hover:border-red-400';
                    } else if (isCarDelayed || car.overallStatus === 'critical') {
                      borderStyle = 'border-l-4 border-l-red-500 border-y-red-200 border-r-red-200 bg-red-50/5 hover:border-red-400';
                    } else if (isBufferRisk) {
                      borderStyle = 'border-l-4 border-l-orange-500 border-y-orange-200 border-r-orange-200 bg-orange-50/5 hover:border-orange-400';
                    } else if (isMediumPriority || car.overallStatus === 'at-risk') {
                      borderStyle = 'border-l-4 border-l-amber-500 border-y-amber-200 border-r-amber-200 bg-amber-50/5 hover:border-amber-400';
                    }

                    return (
                      <div
                        key={car.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', car.id);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleQueueItemDrop(e, car.id)}
                        onClick={() => setSelectedCarId(car.id)}
                        className={`bg-white rounded-xl p-3 border hover:shadow-xs cursor-grab active:cursor-grabbing transition-all flex flex-col gap-2 ${borderStyle}`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex items-start gap-2.5">
                            {/* Grip handle & Position Number Badge */}
                            <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                              <GripVertical className="w-3.5 h-3.5 text-neutral-400 cursor-grab" />
                              <span className="w-6 h-6 rounded-md bg-neutral-50 border border-neutral-200 text-[10px] font-extrabold text-neutral-600 flex items-center justify-center font-mono">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                            </div>

                            <div>
                              {/* plate and job description */}
                              <span className="text-sm font-bold text-neutral-900 tracking-wide font-mono block">
                                {car.plateNumber}
                              </span>
                              <span className="text-[11px] text-neutral-500 font-semibold mt-0.5 block capitalize text-neutral-700">
                                {car.make} {car.model}
                              </span>
                              
                              {/* Estimated, Remaining & Buffer alerts */}
                              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                                <span className="px-1.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[9.5px] font-black uppercase font-mono inline-flex items-center gap-1 shadow-2xs">
                                  ⏱️ Est: {estimatedMins}m
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-black uppercase font-mono inline-flex items-center gap-1 shadow-2xs ${
                                  remainingMins <= estimatedMins 
                                    ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                                    : isBufferRisk 
                                      ? 'bg-orange-50 border-orange-200 text-orange-800 font-medium' 
                                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 font-medium'
                                }`}>
                                  ⏳ Rem: {remainingMins <= 0 ? 'LATE' : `${remainingMins}m`}
                                </span>
                              </div>
                              
                              {/* Services Breakdown Tags */}
                              <div className="mt-2.5 flex flex-wrap gap-1 max-w-[185px]">
                                {car.jobs.map((j) => (
                                  <span 
                                    key={j.id} 
                                    className="px-1.5 py-px text-[8.5px] font-medium rounded-md bg-neutral-50 text-neutral-600 border border-neutral-200 select-none capitalize inline-block"
                                    title={`${j.title} (${j.durationMins}m)`}
                                  >
                                    🔧 {j.title}
                                  </span>
                                ))}
                                {car.jobs.length === 0 && (
                                  <span className="px-1.5 py-px text-[8.5px] font-medium rounded-md bg-neutral-50 text-neutral-500 border border-neutral-200 select-none">
                                    🔧 Diagnostic
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex flex-col justify-between items-end h-full min-h-[46px]">
                            <span className={`text-[10px] font-mono font-bold ${isCarDelayed ? 'text-red-600 font-extrabold' : isBufferRisk ? 'text-orange-600 font-extrabold' : 'text-neutral-500'}`}>
                              {car.promisedTime}
                            </span>
                            {isHighPriority ? (
                              <span className="px-1 py-0.2 text-[8.5px] font-extrabold uppercase rounded bg-red-100 text-red-700 border border-red-200 font-mono mt-1 animate-pulse">
                                CRITICAL
                              </span>
                            ) : isCarDelayed ? (
                              <span className="px-1.5 py-0.2 text-[8.5px] font-extrabold uppercase rounded bg-red-100 text-red-700 border border-red-200 animate-pulse font-mono mt-1">
                                OVERDUE
                              </span>
                            ) : car.overallStatus === 'blocked' ? (
                              <span className="px-1.5 py-0.2 text-[8.5px] font-extrabold uppercase rounded bg-amber-100 text-amber-700 border border-amber-200 font-mono mt-1">
                                BLOCKED
                              </span>
                            ) : car.sharedResourceStatus === 'queued' ? (
                              <span className="px-1.5 py-0.2 text-[8.5px] font-extrabold uppercase rounded bg-blue-100 text-blue-700 border border-blue-200 font-mono mt-1">
                                QUEUED
                              </span>
                            ) : isBufferRisk ? (
                              <span className="px-1.5 py-0.2 text-[8.5px] font-extrabold uppercase rounded bg-orange-100 text-orange-700 border border-orange-200 animate-pulse font-mono mt-1">
                                AT RISK
                              </span>
                            ) : (
                              <span className={`px-1.5 py-0.2 text-[8.5px] font-bold uppercase rounded font-mono mt-1 ${
                                car.overallStatus === 'critical' ? 'bg-red-50 text-red-700 animate-pulse border border-red-200' : 'bg-neutral-50 text-neutral-500 border border-neutral-200'
                              }`}>
                                WAIT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {waitingQueueCars.length === 0 && (
                    <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl italic">
                      Queue is currently vacant. All vehicles assigned to active service bays.
                    </div>
                  )}

                  {/* "+" Drag new arrival slot card */}
                  <button
                    onClick={() => setIsNewJobOpen(true)}
                    className="w-full bg-neutral-100/50 hover:bg-neutral-100 border-2 border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-1.5 transition cursor-pointer select-none"
                  >
                    <Plus className="w-5 h-5 text-neutral-400" />
                    <span className="text-xs font-bold text-neutral-500">
                      Drop new arrival here
                    </span>
                  </button>
                </div>

                <div className="flex flex-col pt-4 mt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-800 uppercase tracking-tight">
                      Holding Area
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-900 text-white font-mono shadow-inner">
                      {holdingAreaCars.length} parked
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium font-sans mt-0.5 mb-3">
                    Drag back to Waiting Queue to resume manually
                  </span>

                  <div 
                    onDragOver={handleHoldingAreaDragOver}
                    onDrop={handleHoldingAreaDrop}
                    className="space-y-2.5 h-[calc(40vh-120px)] overflow-y-auto pr-1 select-none flex flex-col border-2 border-dashed border-red-200 rounded-xl p-2 bg-red-50/10 min-h-[180px]"
                  >
                     {holdingAreaCars.map((car, idx) => {
                       if (filterStatus !== 'ALL' && filterStatus !== 'blocked') {
                         return null;
                       }

                       return (
                         <div
                           key={car.id}
                           draggable
                           onDragStart={(e) => {
                             e.dataTransfer.setData('text/plain', car.id);
                           }}
                           onClick={() => setSelectedCarId(car.id)}
                           className="bg-white rounded-xl p-3 border-l-4 border-l-amber-500 border-y-neutral-200 border-r-neutral-200 hover:shadow-xs cursor-pointer transition-all flex flex-col gap-2"
                           title="Drag vehicle back to Waiting Queue to resume repair manually"
                         >
                           <div className="flex items-start justify-between w-full">
                             <div className="flex items-center gap-3">
                               <span className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-600 flex items-center justify-center font-mono">
                                 H{String(idx + 1).padStart(2, '0')}
                               </span>
                               <div>
                                 <span className="text-sm font-bold text-neutral-900 tracking-wide font-mono block">
                                   {car.plateNumber}
                                 </span>
                                 <span className="text-[11px] text-neutral-500 font-normal mt-0.5 block capitalize">
                                   {car.make} {car.model}
                                 </span>
                                 <span className="text-[10.5px] text-amber-700 bg-amber-50/60 border border-amber-200 px-1.5 py-0.5 rounded-lg mt-1 inline-flex items-center gap-1 font-medium font-sans">
                                   {car.holdingReason === 'manual' ? (
                                     <><span>🔧</span> {car.manualBlockReason || 'Manual Block'}</>
                                   ) : car.holdingReason === 'confirmation' || car.approvalPending ? (
                                     <><span>📝</span> Waiting for Confirmation</>
                                   ) : (
                                     <><span>🔩</span> Waiting for Parts</>
                                   )}
                                 </span>
                               </div>
                             </div>

                             <div className="text-right flex flex-col justify-between items-end">
                               <span className="text-[10px] font-mono font-bold text-neutral-400">
                                 {car.partsExpectedTime || car.promisedTime}
                               </span>
                               <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border font-mono mt-1 bg-amber-100/60 border-amber-200 text-amber-800">
                                 WAITING
                               </span>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                    {holdingAreaCars.length === 0 && (
                      <div className="flex items-center justify-center h-full text-xs font-bold text-red-300 uppercase tracking-widest text-center italic mt-6">
                        No vehicles in holding
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col pt-4 mt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-800 uppercase tracking-tight">
                      Dispatch Area
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-600 text-white font-mono shadow-inner">
                      {dispatchAreaCars.length} ready
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium font-sans mt-0.5 mb-3">
                    Completed vehicles awaiting final dispatch
                  </span>

                  <div className="space-y-2.5 h-[calc(55vh-120px)] overflow-y-auto pr-1 select-none flex flex-col border-2 border-dashed border-teal-200 rounded-xl p-2 bg-teal-50/10 min-h-[300px]">
                     {dispatchAreaCars.map((car, idx) => {
                       const hasServiceBay = car.jobs.some(j => j.status === 'completed' && !j.title.toLowerCase().includes('align') && !j.title.toLowerCase().includes('wash') && !j.title.toLowerCase().includes('vacuum') && !j.title.toLowerCase().includes('detail'));
                       const hasAlignment = car.jobs.some(j => j.status === 'completed' && j.title.toLowerCase().includes('align'));
                       const hasWash = car.jobs.some(j => j.status === 'completed' && (j.title.toLowerCase().includes('wash') || j.title.toLowerCase().includes('vacuum') || j.title.toLowerCase().includes('detail')));

                       return (
                         <div
                           key={car.id}
                           onClick={() => setSelectedCarId(car.id)}
                           className="bg-white rounded-xl p-3 border-l-4 border-l-teal-500 border-y-neutral-200 border-r-neutral-200 hover:shadow-xs cursor-pointer transition-all flex flex-col gap-2.5"
                         >
                           <div className="flex items-start justify-between w-full">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-md bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                                 <CheckCircle2 className="w-4 h-4" />
                               </div>
                               <div>
                                 <span className="text-sm font-bold text-neutral-900 tracking-wide font-mono block">
                                   {car.plateNumber}
                                 </span>
                                 <span className="text-[11px] text-neutral-500 font-normal mt-0.5 block capitalize">
                                   {car.make} {car.model}
                                 </span>
                               </div>
                             </div>
                             <div className="text-right">
                               <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-teal-100 text-teal-700 border border-teal-200 font-mono">
                                 READY
                                </span>
                             </div>
                           </div>

                           {/* Route completed indicators */}
                           <div className="pt-2 border-t border-neutral-100/70 flex flex-wrap gap-1">
                             <span className="text-[8.5px] text-neutral-400 font-mono block w-full uppercase font-bold tracking-wider">Completed Route:</span>
                             {hasServiceBay && (
                               <span className="inline-flex items-center gap-1 text-[8px] font-extrabold font-mono px-1.5 py-0.5 rounded bg-neutral-50 text-neutral-600 border border-neutral-250">
                                 🛠️ SERVICE BAY
                               </span>
                             )}
                             {hasAlignment && (
                               <span className="inline-flex items-center gap-1 text-[8px] font-extrabold font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-150">
                                 🧭 ALIGNMENT
                               </span>
                             )}
                             {hasWash && (
                               <span className="inline-flex items-center gap-1 text-[8px] font-extrabold font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-150">
                                 ✨ WASH BAY
                               </span>
                             )}
                           </div>
                         </div>
                       );
                     })}
                    {dispatchAreaCars.length === 0 && (
                      <div className="flex items-center justify-center h-full text-xs font-bold text-teal-300 uppercase tracking-widest text-center italic mt-6 px-4">
                        No vehicles in dispatch
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        {activeTab === 'operations_board' && (
          <VehicleOperationsBoard 
            cars={cars} 
            currentTime={currentTime}
            onSelectCar={(id) => { 
              if (id) {
                setProfilerCarId(id);
                setActiveTab('vehicle_detail');
              }
            }} 
          />
        )}

        {activeTab === 'vehicle_detail' && (
          <VehicleDetailView 
            cars={cars} 
            bays={bays} 
            initialSelectedCarId={profilerCarId}
            onSelectCar={(id) => setSelectedCarId(id)} 
            onCustomerApprove={handleCustomerApprove}
            onCustomerDecline={handleCustomerDecline}
            onReceiveShortParts={handleReceiveShortParts}
            onBack={() => setActiveTab('operations_board')}
          />
        )}

        {activeTab === 'bay_management' && (
          <BayManagement 
            cars={cars} 
            bays={bays} 
            onReleaseBay={handleReleaseCarFromBay} 
            onAssignCarToBay={handleAssignCarToBay} 
          />
        )}

        {activeTab === 'approval_center' && (
          <ApprovalCenter 
            cars={cars} 
            onCustomerApprove={handleCustomerApprove} 
            onCustomerDecline={handleCustomerDecline} 
          />
        )}

        {activeTab === 'parts_dependency' && (
          <PartsDependencyCenter 
            cars={cars} 
            onReceiveParts={handleReceiveShortParts} 
          />
        )}

        {activeTab === 'alignment_queue' && (
          <AlignmentQueueView
            resource={sharedResources[0]}
            cars={cars}
            onAdvanceQueue={handleAdvanceResourceQueue}
            onRemoveFromQueue={(carId, resId) => handleRemoveFromQueue(resId, carId)}
            onReorderQueue={handleReorderResourceQueue}
          />
        )}

        {activeTab === 'wash_queue' && (
          <WashBayQueueView
            resource={sharedResources[1]}
            cars={cars}
            onAdvanceQueue={handleAdvanceResourceQueue}
            onRemoveFromQueue={(carId, resId) => handleRemoveFromQueue(resId, carId)}
            onReorderQueue={handleReorderResourceQueue}
          />
        )}

        {activeTab === 'mechanic_workload' && (
          <MechanicWorkloadView 
            cars={cars} 
            bays={bays} 
          />
        )}

        {activeTab === 'daily_review' && (
          <DailyOperationsReview 
            cars={cars} 
            bays={bays} 
            currentDay={currentDay}
            eodReports={eodReports}
            onStartNewDay={handleStartNewDay}
            currentTime={currentTime}
          />
        )}

        {activeTab === 'notification_centre' && (
          <NotificationCentre 
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onClearAll={handleClearAllNotifications}
            onNotificationClick={handleNotificationClick}
            onResolveActionable={handleResolveActionableNotification}
          />
        )}

        {activeTab === 'alerts_risk' && (
          <SystemAlertsRiskCenter
            cars={cars}
            bays={bays}
            sharedResources={sharedResources}
            currentTime={currentTime}
            onSelectCar={(id) => setSelectedCarId(id)}
            onCustomerApprove={handleCustomerApprove}
            onReceiveParts={handleReceiveShortParts}
            onAdvanceQueue={handleAdvanceResourceQueue}
          />
        )}

        {activeTab === 'design_system' && (
          <DesignSystemShowcase />
        )}

        {activeTab === 'qa_automation' && (
          <QAAutomationPanel
            cars={cars}
            setCars={setCars}
            bays={bays}
            setBays={setBays}
            setSharedResources={setSharedResources}
            setLogs={setLogs}
            setNotifications={setNotifications}
            currentTime={currentTime}
            addLogEntry={addLogEntry}
          />
        )}

        {/* ======================================================== */}
        {/* 5. TIMELINES ACTIVITY LOG (FOOTER BAR)                  */ }
        {/* ======================================================== */}
        <div className="border-t border-neutral-200 bg-white px-4 sm:px-6 py-4 select-none">
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-neutral-400" />
                System Activity Log • Universal timelines
              </h2>
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] text-neutral-400 hover:text-neutral-700 font-semibold"
              >
                Clear History
              </button>
            </div>

            <div className="h-28 bg-neutral-900 border border-neutral-800 rounded-xl font-mono text-xs text-neutral-200 p-3 overflow-y-auto space-y-1.5 shadow-inner">
              {logs.map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="text-neutral-500">[{item.timestamp}]</span>
                  <span className={`px-1 py-0.1 text-[9px] font-bold rounded uppercase ${
                    item.type === 'success' ? 'bg-emerald-900 text-emerald-100' :
                    item.type === 'warning' ? 'bg-amber-900 text-amber-100' :
                    item.type === 'error' ? 'bg-red-950 text-red-200' :
                    'bg-neutral-800 text-neutral-400'
                  }`}>
                    {item.type}
                  </span>
                  <span className="text-neutral-200 select-all">{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* --- POPUPS DRAWERS & MODALS --- */}
      
      {/* 5. intake creation form modal */}
      <NewJobModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        bays={bays}
        onAddCar={handleAddIntakeCar}
        initialTime={currentTime}
        carsCount={cars.length}
      />

      <MechanicAllocationModal
        isOpen={mechanicAllocationParams !== null}
        onClose={() => setMechanicAllocationParams(null)}
        onAssign={(mechanicName) => {
          if (mechanicAllocationParams) {
            executeAssignCarToBay(mechanicAllocationParams.bayId, mechanicAllocationParams.carId, mechanicName);
            setMechanicAllocationParams(null);
          }
        }}
        bayName={mechanicAllocationParams ? bays.find(b => b.id === mechanicAllocationParams.bayId)?.name : ''}
        vehiclePlate={mechanicAllocationParams ? cars.find(c => c.id === mechanicAllocationParams.carId)?.plateNumber : ''}
        cars={cars}
        bays={bays}
      />

      <HoldingAreaModal
        isOpen={holdingAreaParams !== null}
        onClose={() => setHoldingAreaParams(null)}
        onSubmit={(date, time, reason, manualReason) => {
          if (holdingAreaParams) {
            executeHoldingAreaDrop(holdingAreaParams.carId, date, time, reason, manualReason);
          }
        }}
        car={holdingAreaParams ? cars.find(c => c.id === holdingAreaParams.carId) || null : null}
      />

      {/* 6. Active Vehicle operations pop-up modal */}
      <VehicleDetailModal
        isOpen={selectedCarId !== null}
        onClose={() => setSelectedCarId(null)}
        car={cars.find(c => c.id === selectedCarId) || null}
        bays={bays}
        logs={logs}
        currentTime={currentTime}
        onUpdateCar={(updatedCar) => {
          // --- AUTOMATED HOLDING LOGIC FOR ALIGNMENT/WASH ---
          // If the car was active in Alignment RIG or Wash BAY and is now marked as blocked, move it to Holding
          let finalCar = { ...updatedCar };
          const originalCar = cars.find(c => c.id === updatedCar.id);
          
          const isSharedResourceActive = originalCar?.sharedResourceStatus === 'active';
          const isNowBlocked = updatedCar.overallStatus === 'blocked' || updatedCar.partsOnOrder || updatedCar.approvalPending;
          
          if (isSharedResourceActive && isNowBlocked) {
            // Find which resource it was in
            const res = sharedResources.find(r => r.currentCarId === updatedCar.id);
            if (res) {
              finalCar = {
                ...updatedCar,
                overallStatus: 'blocked',
                currentBayId: null,
                sharedResourceStatus: 'none', // Effectively moved out of the active slot
                blockedFromResourceId: res.id
              };

              // Clear the resource slot
              setSharedResources(prev => prev.map(r => r.id === res.id ? { ...r, currentCarId: null } : r));
              
              // Log the transition
              addLogEntry(`HOLDING QUARANTINE: ${updatedCar.plateNumber} encountered a blockage while in ${res.name}. Moving to Holding Area.`, 'warning');
              
              // Trigger info toast for manager
              setToastAlerts(prev => [
                ...prev,
                {
                  id: `toast-hold-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  title: 'Holding Quarantine',
                  description: `Vehicle ${updatedCar.plateNumber} moved from ${res.name} to Holding Area due to blockage.`,
                  severity: 'info',
                  timestamp: currentTime
                }
              ]);
            }
          }

          // If the car is reassigned to a general service bay, clear any shared resource association
          if (finalCar.currentBayId !== null) {
            finalCar.sharedResourceRequest = 'none';
            finalCar.sharedResourceStatus = 'none';
            finalCar.blockedFromResourceId = null;
            setSharedResources(prev => prev.map(res => {
              if (res.currentCarId === finalCar.id) {
                return { ...res, currentCarId: null };
              }
              return {
                ...res,
                queue: res.queue.filter(id => id !== finalCar.id)
              };
            }));
          }

          setCars(prev => prev.map(c => c.id === finalCar.id ? finalCar : c));
          setBays(prevBays => prevBays.map(b => {
            if (b.currentCarId === finalCar.id && finalCar.currentBayId !== b.id) {
              return { ...b, currentCarId: null, becameFreeAt: currentTime };
            }
            if (b.id === finalCar.currentBayId) {
              return { ...b, currentCarId: finalCar.id, becameFreeAt: null };
            }
            return b;
          }));
        }}
        onAddLog={addLogEntry}
        onDispatchCar={handleDispatchCar}
      />
    </div>
  );
}
