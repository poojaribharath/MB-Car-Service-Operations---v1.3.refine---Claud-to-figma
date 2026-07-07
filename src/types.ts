export interface ActivityLogEntry {
  id: string;
  timestamp: string; // HH:MM:SS
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'approval';
  carId?: string;
  archived?: boolean;
}

export interface ServiceJob {
  id: string;
  title: string;
  durationMins: number;
  elapsedMins: number; // progress tracking
  status: 'pending' | 'in-progress' | 'completed' | 'hold';
  technicianName: string;
  cost: number;
}

export interface Mechanic {
  id: string;
  name: string;
  level: 'Senior' | 'Mid-Level' | 'Junior';
  utilization: number;
  activeJobs: number;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  customerName: string;
  customerPhone: string;
  promisedTime: string; // HH:MM format (24h or AM/PM)
  promisedDateTime: string; // ISO string for sorting/timers
  overallStatus: 'healthy' | 'at-risk' | 'critical' | 'blocked' | 'completed';
  blockedAt?: string | null; // HH:MM format
  currentBayId: string | null; // which bay it's in, or null if parked
  jobs: ServiceJob[];
  
  // Blockage/Approval section
  approvalPending?: boolean;
  approvalRequestedAt?: string | null; // HH:MM
  approvalRequiredWork?: string | null; // description
  approvalRequiredCost?: number | null; // cost of extra work
  approvalContactLogged?: boolean; // boolean if manager called/messaged
  
  // Parts section
  partsOnOrder?: boolean;
  partsOrderDescription?: string | null;
  partsExpectedTime?: string | null; // "30 mins", "1 hour", etc.
  
  // Special shared resource requests
  sharedResourceRequest: 'none' | 'alignment' | 'wash';
  sharedResourceStatus: 'none' | 'queued' | 'active' | 'completed';
  holdingReason?: 'parts' | 'confirmation' | 'manual';
  manualBlockReason?: string;
  blockedFromResourceId?: string | null;
  queuePriority?: 'high' | 'medium' | 'low';
}

export interface ServiceBay {
  id: string;
  name: string;
  type: 'diagnostics' | 'heavy' | 'fast-track' | 'standard';
  currentCarId: string | null;
  becameFreeAt: string | null; // HH:MM
}

export interface SharedResource {
  id: string;
  name: string;
  type: 'alignment' | 'wash';
  currentCarId: string | null;
  queue: string[]; // array of Car IDs
  assignedTechnicianId?: string; // ID of the technician currently assigned to this bay
}

export interface WorkshopStats {
  totalCars: number;
  activeWork: number;
  blockedBays: number;
  approvalsPendingCount: number;
  criticalTimeCount: number;
  utilizationRate: number; // percentage
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'danger';
  category: 'operational' | 'approval' | 'parts' | 'system' | 'risk';
  read: boolean;
  isActionable: boolean;
  status: 'active' | 'dismissed' | 'resolved';
  resolvedAt?: string;
  actionRequiredText?: string;
  relatedCarId?: string;
}

export interface EodReportMechanic {
  id: string;
  name: string;
  level: string;
  vehiclesCompleted: number;
  jobsCompleted: number;
  activeWorkTime: number; // percentage
  status: 'active' | 'idle' | 'warning';
  revenueGenerated: number;
}

export interface EodReportPendingVehicle {
  id: string;
  make: string;
  model: string;
  plateNumber: string;
  overallStatus: string;
  currentBayId: string | null;
  jobsCount: number;
  completedJobsCount: number;
  promisedTime: string;
  queuePriority: string;
}

export interface EodReport {
  dayId: string;
  date: string;
  calculatedAtTime: string;
  totalVehicles: number;
  completedCount: number;
  pendingCount: number;
  onTimeDispatchSla: number;
  avgTurnaroundHours: number;
  totalCostValue: number;
  mechanics: EodReportMechanic[];
  pendingVehicles: EodReportPendingVehicle[];
}

