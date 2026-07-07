import React from 'react';
import { Car, ServiceJob, ServiceBay, SharedResource, ActivityLogEntry, AppNotification, EodReport } from '../types';
import { STAFF_ROSTER } from '../data';


// Helper to determine environment constraints
export const getEnvironmentMode = (): 'staging' | 'production' => {
  const override = localStorage.getItem('qa_env_override');
  if (override === 'production') return 'production';
  if (override === 'staging') return 'staging';

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isDevPreview = window.location.hostname.includes('dev') || window.location.hostname.includes('ais-dev');
  
  if (isLocalhost || isDevPreview || (import.meta as any).env?.MODE === 'development') {
    return 'staging';
  }
  return 'production';
};

// Check if QA Automation Scheduler is active
export const isQASchedulerActive = (): boolean => {
  return getEnvironmentMode() === 'staging';
};

// Check if Service Center is open at a given time
export const isServiceCenterOpen = (timeStr: string): boolean => {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m;
  return totalMins >= 480 && totalMins < 1200; // 08:00 to 20:00
};

// Calculate active working minutes advanced
export const calculateActiveMinsAdvanced = (startTimeStr: string, minsToAdd: number): number => {
  let activeMins = 0;
  const [startH, startM] = startTimeStr.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  
  for (let i = 0; i < minsToAdd; i++) {
    const currentMinOfDay = (startTotal + i) % 1440;
    if (currentMinOfDay >= 480 && currentMinOfDay < 1200) {
      activeMins++;
    }
  }
  return activeMins;
};

// Structure for QA Execution Logs
export interface QACronLog {
  timestamp: string;
  simulatedTime: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED' | 'CLEANUP';
  message: string;
  environment: string;
}

// Retrieve QA Cron Execution Logs
export const getQACronLogs = (): QACronLog[] => {
  const saved = localStorage.getItem('qa_cron_logs');
  return saved ? JSON.parse(saved) : [];
};

// Add to QA Cron logs
export const addQACronLog = (log: Omit<QACronLog, 'timestamp'>) => {
  const logs = getQACronLogs();
  const newLog: QACronLog = {
    ...log,
    timestamp: new Date().toLocaleTimeString()
  };
  localStorage.setItem('qa_cron_logs', JSON.stringify([newLog, ...logs].slice(0, 50)));
};

// 40 mock test vehicles generator (Morning Initialization at 07:50 AM)
export const generateFortyMockVehicles = (): Car[] => {
  const currentYear = 2026;
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const makes = ['Tesla', 'BMW', 'Mercedes', 'Audi', 'Lexus', 'Porsche', 'Jaguar', 'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Hyundai'];
  const modelsMap: Record<string, string[]> = {
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y'],
    'BMW': ['3 Series', '5 Series', 'X5', 'i4'],
    'Mercedes': ['C-Class', 'E-Class', 'GLE', 'EQS'],
    'Audi': ['A4', 'A6', 'Q5', 'e-tron'],
    'Lexus': ['RX', 'ES', 'NX', 'LC'],
    'Porsche': ['911 Carrera', 'Cayenne', 'Taycan', 'Macan'],
    'Jaguar': ['F-PACE', 'I-PACE', 'XF'],
    'Toyota': ['Camry', 'RAV4', 'Prius', 'Supra'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot'],
    'Ford': ['Mustang', 'Explorer', 'F-150', 'Mach-E'],
    'Chevrolet': ['Corvette', 'Camaro', 'Tahoe', 'Bolt'],
    'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Ioniq 5']
  };

  const services = [
    { title: 'Full Diagnostic Scan', duration: 45, cost: 150 },
    { title: 'Brake Pad & Rotor Replacement', duration: 90, cost: 240 },
    { title: 'Suspension Tuning & Alignment', duration: 60, cost: 180 },
    { title: 'Synthetic Oil & Filter Service', duration: 30, cost: 95 },
    { title: 'Transmission Fluid Flush', duration: 75, cost: 210 },
    { title: 'Spark Plug Renewal & Tune', duration: 60, cost: 140 },
    { title: 'Engine Belt Replacement', duration: 90, cost: 280 }
  ];

  const techs = ['Sarah Patel', 'Ming Chen', 'Ravi Kumar', 'Marcus Brodie', 'Alice Davis', 'Vikram Malhotra', 'Amit Shah', 'Elena Rostova', 'John Smith', 'Bob Wilson', 'Krishna Murthy', 'Ryan Gallagher'];

  return Array.from({ length: 40 }, (_, i) => {
    const num = i + 1;
    const make = makes[i % makes.length];
    const models = modelsMap[make] || ['Staging-Test'];
    const model = models[i % models.length];
    const service = services[i % services.length];
    const technicianName = techs[i % techs.length];

    const jobs: ServiceJob[] = [{
      id: `job-qa-load-${num}-${Date.now()}`,
      title: service.title,
      durationMins: service.duration,
      elapsedMins: num <= 8 ? 5 : 0, // 5 mins in-progress for those in bays
      status: num <= 8 ? 'in-progress' : 'pending',
      technicianName,
      cost: service.cost
    }];

    // Stagger promised times nicely
    const hour = 10 + Math.floor(i / 4);
    const min = (i % 4) * 15;
    const promisedTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const promisedDateTime = `${todayStr}T${promisedTime}:00`;

    return {
      id: `qa-vehicle-${num}`,
      make,
      model,
      year: currentYear,
      plateNumber: `QA-VEH-${String(num).padStart(3, '0')}`,
      customerName: `Loadtest Client ${num}`,
      customerPhone: `+1 555-0750-${String(num).padStart(3, '0')}`,
      promisedTime,
      promisedDateTime,
      overallStatus: 'healthy',
      currentBayId: num <= 8 ? `bay-${num}` : null, // Bays 1-8 occupied, others sit in Waiting Queue
      jobs,
      approvalPending: false,
      partsOnOrder: false,
      sharedResourceRequest: 'none',
      sharedResourceStatus: 'none',
      queuePriority: 'medium'
    };
  });
};

// Single VIP / Emergency Vehicle injector
export const injectVIPVehicleHelper = (
  cars: Car[],
  bays: ServiceBay[],
  setCars: React.Dispatch<React.SetStateAction<Car[]>>,
  setBays: React.Dispatch<React.SetStateAction<ServiceBay[]>>,
  currentTime: string,
  addLogEntry: (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'approval', carId?: string) => void
): boolean => {
  const currentYear = 2026;
  const todayStr = new Date().toISOString().split('T')[0];
  const vipId = `qa-vehicle-vip-${Date.now()}`;
  const vipPlate = `VIP-EMER-${Math.floor(Math.random() * 900) + 100}`;

  // Find if any bay is currently free
  const freeBay = bays.find(b => b.currentCarId === null);

  const vipCar: Car = {
    id: vipId,
    make: '🚨 [EMERGENCY/VIP] Porsche',
    model: 'Taycan Turbo S',
    year: currentYear,
    plateNumber: vipPlate,
    customerName: 'VIP Executive Client',
    customerPhone: '+1 555-911-999',
    promisedTime: currentTime, // Immediate
    promisedDateTime: `${todayStr}T${currentTime}:00`,
    overallStatus: 'critical',
    currentBayId: freeBay ? freeBay.id : null,
    jobs: [{
      id: `job-vip-${Date.now()}`,
      title: 'VIP Emergency Diagnostics & Speed Service',
      durationMins: 30,
      elapsedMins: freeBay ? 5 : 0,
      status: freeBay ? 'in-progress' : 'pending',
      technicianName: 'Sarah Patel',
      cost: 450
    }],
    approvalPending: false,
    partsOnOrder: false,
    sharedResourceRequest: 'none',
    sharedResourceStatus: 'none',
    queuePriority: 'high' // Flags as high priority, will sit at the very top of waitlist
  };

  if (freeBay) {
    // Fill the open slot immediately
    setBays(prev => prev.map(b => b.id === freeBay.id ? { ...b, currentCarId: vipId, becameFreeAt: null } : b));
    setCars(prev => [vipCar, ...prev]);
    addLogEntry(`[QA VIP Injection] Emergency VIP vehicle Porsche (${vipPlate}) injected. Bay ${freeBay.name} is free - assigned directly.`, 'success', vipId);
  } else {
    // Sit at the absolute top of the waiting queue
    setCars(prev => [vipCar, ...prev]);
    addLogEntry(`[QA VIP Injection] Emergency VIP vehicle Porsche (${vipPlate}) injected. All bays occupied - placed at the absolute top of the Waiting Queue.`, 'warning', vipId);
  }

  addQACronLog({
    simulatedTime: currentTime,
    status: 'SUCCESS',
    message: `Injected VIP/Emergency vehicle Porsche (${vipPlate}). Assigned directly: ${freeBay ? freeBay.name : 'No (placed at absolute top of Waitlist Queue)'}.`,
    environment: getEnvironmentMode()
  });

  return true;
};

// Main Unified QA Automation Engine (Handles morning cron, hourly exceptions, and automated VIP injections)
export const checkAndTriggerQAAutomation = (
  cars: Car[],
  setCars: React.Dispatch<React.SetStateAction<Car[]>>,
  bays: ServiceBay[],
  setBays: React.Dispatch<React.SetStateAction<ServiceBay[]>>,
  setSharedResources: React.Dispatch<React.SetStateAction<SharedResource[]>>,
  setLogs: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>,
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>,
  currentTime: string, // hh:mm
  addLogEntry: (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'approval', carId?: string) => void,
  forceRunMorning: boolean = false,
  forceRunHourly: boolean = false,
  forceRunVIP: boolean = false
): boolean => {
  const env = getEnvironmentMode();
  
  // Staging constraint: Decoupled and completely disabled in Production env unless forced
  if (env === 'production' && !forceRunMorning && !forceRunHourly && !forceRunVIP) {
    return false;
  }

  const [hourStr, minStr] = currentTime.split(':');
  const hour = Number(hourStr);
  const min = Number(minStr);

  const today = new Date().toDateString();

  // --- RULE 1: DAILY INITIALIZATION & CLEANUP (07:50 AM) ---
  if (currentTime === '07:50' || forceRunMorning) {
    const lastMorningRun = localStorage.getItem('qa_last_morning_run_date');
    if (lastMorningRun === today && !forceRunMorning) {
      return false; // Already executed today
    }

    try {
      // Wipe the database slate
      localStorage.removeItem('mb_cars_v4');
      localStorage.removeItem('mb_bays_v4');
      localStorage.removeItem('mb_shared_resources_v4');
      localStorage.removeItem('mb_logs_v4');
      localStorage.removeItem('mb_notifications_v5');

      // Reset state for bays and shared resources to master configs (clean/free)
      setBays(prev => prev.map(b => ({ ...b, currentCarId: null, becameFreeAt: null })));
      setSharedResources(prev => prev.map(sr => ({ ...sr, currentCarId: null, queue: [] })));
      setLogs([]);
      setNotifications([]);

      // Generate the 40 mock test vehicles
      const morningFleet = generateFortyMockVehicles();

      // Update cars state
      setCars(morningFleet);

      // Save marker to prevent double execution
      localStorage.setItem('qa_last_morning_run_date', today);

      // Log actions
      const msg = `[QA INITIALIZATION] 07:50 AM Morning Cron completed. Database slate completely purged of historical visit logs. Generated 40 active fleet vehicles. Bays 1-8 occupied and busy; 32 vehicles routed to Waiting Queue.`;
      
      const newEntry: ActivityLogEntry = {
        id: `log-init-${Date.now()}`,
        timestamp: currentTime,
        message: msg,
        type: 'success'
      };
      setLogs([newEntry]);

      addQACronLog({
        simulatedTime: currentTime,
        status: 'CLEANUP',
        message: `Wiped all previous tests data. Successfully injected 40 active fleet vehicles at 07:50 AM morning initialization.`,
        environment: env
      });

      return true;
    } catch (e: any) {
      addQACronLog({
        simulatedTime: currentTime,
        status: 'FAILED',
        message: `07:50 AM Initialization failed: ${e?.message || e}`,
        environment: env
      });
      return false;
    }
  }

  // --- RULE 2: HOURLY MICRO-BOTTLENECK LOOPS (09:00 AM - 19:00 PM on the hour) ---
  const isOnTheHour = min === 0;
  const isWithinFrictionWindow = hour >= 9 && hour <= 19;
  
  if ((isOnTheHour && isWithinFrictionWindow) || forceRunHourly) {
    const lastFrictionHour = localStorage.getItem('qa_last_friction_hour');
    if (lastFrictionHour === hourStr && !forceRunHourly) {
      return false; // Already processed this hour
    }

    try {
      // Find active vehicles in bays (not blocked, not approval pending)
      const activeInBays = cars.filter(c => c.currentBayId !== null && c.overallStatus !== 'blocked' && !c.approvalPending);

      if (activeInBays.length >= 2 || (forceRunHourly && activeInBays.length >= 1)) {
        // We need 1 vehicle for Parts Delay and 1 vehicle for Approval Hold
        const partsCarIndex = 0;
        const approvalCarIndex = activeInBays.length > 1 ? 1 : 0;

        const partsCar = activeInBays[partsCarIndex];
        const approvalCar = activeInBays[approvalCarIndex];

        let updatedCars = [...cars];

        // 1. Transition first car to Parts Delay (Blocked - Parts Missing)
        updatedCars = updatedCars.map(c => {
          if (c.id === partsCar.id) {
            return {
              ...c,
              overallStatus: 'blocked' as const,
              blockedAt: currentTime,
              partsOnOrder: true,
              partsOrderDescription: 'OEM Component Backlog - Hold',
              partsExpectedTime: 'Indefinite',
              holdingReason: 'parts' as const,
              manualBlockReason: 'Parts Missing',
              jobs: c.jobs.map(j => j.status === 'in-progress' ? { ...j, status: 'hold' as const } : j)
            };
          }
          return c;
        });

        // 2. Transition second car to Approval Required
        if (partsCar.id !== approvalCar.id) {
          updatedCars = updatedCars.map(c => {
            if (c.id === approvalCar.id) {
              return {
                ...c,
                approvalPending: true,
                approvalRequestedAt: currentTime,
                approvalRequiredWork: 'Complete Suspension Assembly & Rotor Supplement',
                approvalRequiredCost: 480,
                holdingReason: 'confirmation' as const,
                jobs: c.jobs.map(j => j.status === 'in-progress' ? { ...j, status: 'hold' as const } : j)
              };
            }
            return c;
          });
        } else {
          // Fallback if only 1 active car exists
          // Handled or skip approval hold
        }

        setCars(updatedCars);

        // Generate notifications for both roadblocks to appear in Alerts/Risks dashboard
        const partsNotification: AppNotification = {
          id: `notif-parts-${partsCar.id}-${Date.now()}`,
          title: 'Parts Delay: Workshop Blockage',
          message: `${partsCar.make} ${partsCar.model} (${partsCar.plateNumber}) requires OEM parts which are backlogged. Bay status: BLOCKED.`,
          timestamp: currentTime,
          severity: 'danger',
          category: 'parts',
          read: false,
          isActionable: true,
          status: 'active',
          actionRequiredText: 'Order Parts Override',
          relatedCarId: partsCar.id
        };

        const approvalNotification: AppNotification = {
          id: `notif-appr-${approvalCar.id}-${Date.now()}`,
          title: 'Customer Approval Hold',
          message: `${approvalCar.make} ${approvalCar.model} (${approvalCar.plateNumber}) requires customer approval for $480 additional repairs.`,
          timestamp: currentTime,
          severity: 'warning',
          category: 'approval',
          read: false,
          isActionable: true,
          status: 'active',
          actionRequiredText: 'Contact Customer',
          relatedCarId: approvalCar.id
        };

        setNotifications(prev => [partsNotification, approvalNotification, ...prev]);

        // Mark execution
        localStorage.setItem('qa_last_friction_hour', hourStr);

        addLogEntry(`[QA FRICTION RULE] Parts Delay bottleneck triggered for ${partsCar.make} ${partsCar.model} (${partsCar.plateNumber}) in Bay. Status set to Blocked (Parts Missing).`, 'warning', partsCar.id);
        if (partsCar.id !== approvalCar.id) {
          addLogEntry(`[QA FRICTION RULE] Approval Required lock triggered for ${approvalCar.make} ${approvalCar.model} (${approvalCar.plateNumber}) in Bay. Diagnostics hold active.`, 'warning', approvalCar.id);
        }

        addQACronLog({
          simulatedTime: currentTime,
          status: 'SUCCESS',
          message: `Hourly roadblock loop triggered at ${currentTime}. Blocked ${partsCar.plateNumber} (Parts Missing) and placed ${partsCar.id !== approvalCar.id ? approvalCar.plateNumber : 'N/A'} on Approval Hold.`,
          environment: env
        });

        return true;
      } else {
        // Not enough active cars to simulate friction
        localStorage.setItem('qa_last_friction_hour', hourStr);
        return false;
      }
    } catch (e: any) {
      localStorage.setItem('qa_last_friction_hour', hourStr);
      return false;
    }
  }

  // --- RULE 3: PERIODIC HIGH-PRIORITY INJECTIONS (Systematic/Automated VIP injections throughout shift) ---
  // We trigger them systematically at 10:30, 14:30 and 16:30
  const isVIPSchedulingTime = currentTime === '10:30' || currentTime === '14:30' || currentTime === '16:30';
  if (isVIPSchedulingTime || forceRunVIP) {
    const lastVIPTime = localStorage.getItem('qa_last_vip_time');
    if (lastVIPTime === currentTime && !forceRunVIP) {
      return false; // Already triggered at this minute
    }

    localStorage.setItem('qa_last_vip_time', currentTime);
    injectVIPVehicleHelper(cars, bays, setCars, setBays, currentTime, addLogEntry);
    return true;
  }

  return false;
};

export const calculateEodReport = (
  dayNum: number,
  cars: Car[],
  bays: ServiceBay[],
  currentTime: string
): EodReport => {
  const completedCars = cars.filter(c => c.overallStatus === 'completed');
  const pendingCars = cars.filter(c => c.overallStatus !== 'completed');
  const totalCarsCount = cars.length;
  
  // SLA
  const deliverySLA = totalCarsCount > 0 
    ? Math.round(((completedCars.length + cars.filter(c => c.overallStatus === 'healthy').length) / totalCarsCount) * 100) 
    : 92;

  // Avg Turnaround Hours (completed cars avg or baseline)
  const avgTurnaroundHours = 4.2;

  // Total Revenue Generated today (from completed jobs across all cars)
  let totalCostValue = 0;
  cars.forEach(c => {
    c.jobs.forEach(j => {
      if (j.status === 'completed') {
        totalCostValue += j.cost || 0;
      }
    });
  });

  // Mechanic Performance Overview
  const mechanics = STAFF_ROSTER.map((mechanic) => {
    const name = mechanic.name;
    const allJobsByMe = cars.flatMap(c => c.jobs.map(j => ({ ...j, carPlate: c.plateNumber, carStatus: c.overallStatus })))
      .filter(j => j.technicianName === name || name.toLowerCase().startsWith(j.technicianName.toLowerCase()));

    const completedJobsByMe = allJobsByMe.filter(j => j.status === 'completed');
    const activeJobsByMe = allJobsByMe.filter(j => j.status === 'in-progress');

    const baseCompletedVehicles = (parseInt(mechanic.id) * 3 + 2) % 4 + 2;
    const uniqueLiveCompletedPlates = new Set(completedJobsByMe.map(j => j.carPlate));
    const vehiclesCompleted = baseCompletedVehicles + uniqueLiveCompletedPlates.size;
    const jobsCompleted = vehiclesCompleted + completedJobsByMe.length;

    let activeWorkTime = mechanic.utilization;
    if (activeJobsByMe.length > 0) {
      activeWorkTime = Math.min(Math.max(activeWorkTime, 75) + activeJobsByMe.length * 8, 98);
    } else if (completedJobsByMe.length > 0) {
      activeWorkTime = Math.min(Math.max(activeWorkTime, 60) + completedJobsByMe.length * 4, 90);
    } else {
      activeWorkTime = Math.max(activeWorkTime - 12, 10);
    }

    let status: 'active' | 'idle' | 'warning' = 'idle';
    const carsWithMyJobs = cars.filter(c => c.jobs.some(j => 
      (j.technicianName === name || name.toLowerCase().startsWith(j.technicianName.toLowerCase()))
    ));
    const hasBlockedJob = carsWithMyJobs.some(c => c.overallStatus === 'blocked');
    const hasActiveJob = carsWithMyJobs.some(c => c.jobs.some(j => j.status === 'in-progress'));

    if (hasBlockedJob) {
      status = 'warning';
    } else if (hasActiveJob) {
      status = 'active';
    } else if (activeWorkTime > 45) {
      status = 'active';
    }

    // Revenue generated by this mechanic (completed jobs)
    const revenueGenerated = completedJobsByMe.reduce((sum, j) => sum + (j.cost || 0), 0);

    return {
      id: mechanic.id,
      name,
      level: mechanic.level,
      vehiclesCompleted,
      jobsCompleted,
      activeWorkTime,
      status,
      revenueGenerated
    };
  });

  // Pending Vehicles details
  const pendingVehicles = pendingCars.map(c => {
    const completedJobsCount = c.jobs.filter(j => j.status === 'completed').length;
    return {
      id: c.id,
      make: c.make,
      model: c.model,
      plateNumber: c.plateNumber,
      overallStatus: c.overallStatus,
      currentBayId: c.currentBayId,
      jobsCount: c.jobs.length,
      completedJobsCount,
      promisedTime: c.promisedTime,
      queuePriority: c.queuePriority || 'medium'
    };
  });

  return {
    dayId: `Day ${dayNum}`,
    date: new Date().toISOString().split('T')[0],
    calculatedAtTime: currentTime,
    totalVehicles: totalCarsCount,
    completedCount: completedCars.length,
    pendingCount: pendingCars.length,
    onTimeDispatchSla: deliverySLA,
    avgTurnaroundHours,
    totalCostValue,
    mechanics,
    pendingVehicles
  };
};

