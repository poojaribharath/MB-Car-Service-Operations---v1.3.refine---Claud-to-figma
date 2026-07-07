import { Car, ServiceBay, SharedResource, ActivityLogEntry, Mechanic } from './types';

export const INITIAL_BAYS: ServiceBay[] = [
  { id: 'bay-1', name: 'Bay 01', type: 'diagnostics', currentCarId: 'car-s1', becameFreeAt: null },
  { id: 'bay-2', name: 'Bay 02', type: 'heavy', currentCarId: 'car-s2', becameFreeAt: null },
  { id: 'bay-3', name: 'Bay 03', type: 'fast-track', currentCarId: 'car-s3', becameFreeAt: null },
  { id: 'bay-4', name: 'Bay 04', type: 'standard', currentCarId: 'car-a1', becameFreeAt: null },
  { id: 'bay-5', name: 'Bay 05', type: 'standard', currentCarId: 'car-b1', becameFreeAt: null },
  { id: 'bay-6', name: 'Bay 06', type: 'standard', currentCarId: 'car-v1', becameFreeAt: null },
  { id: 'bay-7', name: 'Bay 07', type: 'heavy', currentCarId: 'car-s7', becameFreeAt: null },
  { id: 'bay-8', name: 'Bay 08', type: 'diagnostics', currentCarId: 'car-s8', becameFreeAt: null },
];

export const INITIAL_SHARED_RESOURCES: SharedResource[] = [
  {
    id: 'alignment-rig',
    name: 'ALN-01',
    type: 'alignment',
    currentCarId: 'car-s1',
    queue: ['car-s2'],
    assignedTechnicianId: '3'
  },
  {
    id: 'wash-bay',
    name: 'WSH-01',
    type: 'wash',
    currentCarId: null,
    queue: ['car-s7'],
    assignedTechnicianId: '11'
  }
];

export const INITIAL_CARS: Car[] = [
  // --- IN BAYS (8 CARS) ---
  {
    id: 'car-s1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    plateNumber: 'GA-01-S1-1001',
    customerName: 'Morning Service 1',
    customerPhone: '+91 90001 00001',
    promisedTime: '17:00',
    promisedDateTime: '2026-06-26T17:00:00',
    overallStatus: 'healthy',
    currentBayId: 'bay-1',
    jobs: [{ id: 'j-s1', title: 'Periodic Service', durationMins: 90, elapsedMins: 45, status: 'in-progress', technicianName: 'Sarah Patel', cost: 150 }],
    approvalPending: false,
    partsOnOrder: false,
    sharedResourceRequest: 'alignment',
    sharedResourceStatus: 'active'
  },
  {
    id: 'car-s2',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    plateNumber: 'GA-01-S2-1002',
    customerName: 'Morning Service 2',
    customerPhone: '+91 90001 00002',
    promisedTime: '15:30', // At Risk (Current 14:30 + 30 buffer + 45 work = 15:45 > 15:30)
    promisedDateTime: '2026-06-26T15:30:00',
    overallStatus: 'healthy',
    currentBayId: 'bay-2',
    jobs: [{ id: 'j-s2', title: 'Brake Overhaul', durationMins: 60, elapsedMins: 15, status: 'in-progress', technicianName: 'Ming Chen', cost: 200 }],
    approvalPending: false,
    partsOnOrder: false,
    sharedResourceRequest: 'alignment',
    sharedResourceStatus: 'queued'
  },
  {
    id: 'car-s3',
    make: 'Ford',
    model: 'Endeavour',
    year: 2019,
    plateNumber: 'GA-01-S3-1003',
    customerName: 'Morning Service 3',
    customerPhone: '+91 90001 00003',
    promisedTime: '14:00', // Delayed (Current 14:30)
    promisedDateTime: '2026-06-26T14:00:00',
    overallStatus: 'healthy',
    currentBayId: 'bay-3',
    jobs: [{ id: 'j-s3', title: 'Suspension Check', durationMins: 45, elapsedMins: 40, status: 'in-progress', technicianName: 'Ravi Kumar', cost: 120 }],
    approvalPending: false,
    partsOnOrder: false,
    sharedResourceRequest: 'none',
    sharedResourceStatus: 'none'
  },
  {
    id: 'car-a1',
    make: 'Skoda',
    model: 'Octavia',
    year: 2020,
    plateNumber: 'GA-01-A1-2001',
    customerName: 'Accident Repair 1',
    customerPhone: '+91 90002 00001',
    promisedTime: '20:00',
    promisedDateTime: '2026-06-26T20:00:00',
    overallStatus: 'healthy',
    currentBayId: 'bay-4',
    jobs: [{ id: 'j-a1', title: 'Body Panel Realignment', durationMins: 180, elapsedMins: 10, status: 'in-progress', technicianName: 'Vikram Malhotra', cost: 500 }],
    approvalPending: false,
    partsOnOrder: false,
    sharedResourceRequest: 'none',
    sharedResourceStatus: 'none'
  },
  {
    id: 'car-b1',
    make: 'Mercedes',
    model: 'GLE',
    year: 2022,
    plateNumber: 'GA-01-B1-3001',
    customerName: 'Breakdown 1',
    customerPhone: '+91 90003 00001',
    promisedTime: '19:00',
    promisedDateTime: '2026-06-26T19:00:00',
    overallStatus: 'blocked',
    blockedAt: '14:15',
    currentBayId: 'bay-5',
    jobs: [{ id: 'j-b1', title: 'Alternator Diagnostic', durationMins: 120, elapsedMins: 20, status: 'hold', technicianName: 'Marcus Brodie', cost: 350 }],
    approvalPending: false,
    partsOnOrder: true,
    partsOrderDescription: 'OEM Alternator Unit',
    partsExpectedTime: '2 Hours',
    sharedResourceRequest: 'none',
    sharedResourceStatus: 'none'
  },
  {
    id: 'car-v1',
    make: 'Audi',
    model: 'Q7',
    year: 2023,
    plateNumber: 'GA-01-V1-4001',
    customerName: 'VIP Client',
    customerPhone: '+91 90004 00001',
    promisedTime: '16:00',
    promisedDateTime: '2026-06-26T16:00:00',
    overallStatus: 'critical',
    currentBayId: 'bay-6',
    jobs: [{ id: 'j-v1', title: 'Engine Tuning (Express)', durationMins: 60, elapsedMins: 5, status: 'in-progress', technicianName: 'John Smith', cost: 300 }],
    approvalPending: false,
    partsOnOrder: false,
    sharedResourceRequest: 'none',
    sharedResourceStatus: 'none'
  },
  {
    id: 'car-s7',
    make: 'BMW',
    model: 'X5',
    year: 2021,
    plateNumber: 'GA-01-S7-1007',
    customerName: 'Morning Service 7',
    customerPhone: '+91 90001 00007',
    promisedTime: '14:15',
    promisedDateTime: '2026-06-26T14:15:00',
    overallStatus: 'healthy',
    currentBayId: 'bay-7',
    jobs: [{ id: 'j-s7', title: 'Oil Change', durationMins: 30, elapsedMins: 30, status: 'completed', technicianName: 'Krishna Murthy', cost: 100 }],
    approvalPending: false,
    partsOnOrder: false,
    sharedResourceRequest: 'wash',
    sharedResourceStatus: 'queued'
  },
  {
    id: 'car-s8',
    make: 'Volkswagen',
    model: 'Tiguan',
    year: 2021,
    plateNumber: 'GA-01-S8-1008',
    customerName: 'Morning Service 8',
    customerPhone: '+91 90001 00008',
    promisedTime: '18:00',
    promisedDateTime: '2026-06-26T18:00:00',
    overallStatus: 'healthy',
    currentBayId: 'bay-8',
    jobs: [{ id: 'j-s8', title: 'Full Inspection', durationMins: 120, elapsedMins: 100, status: 'hold', technicianName: 'Amit Shah', cost: 250 }],
    approvalPending: true,
    approvalRequestedAt: '14:20',
    approvalRequiredWork: 'Replacement of Front Control Arm Bushings',
    approvalRequiredCost: 180,
    partsOnOrder: false,
    sharedResourceRequest: 'none',
    sharedResourceStatus: 'none'
  },

  // --- QUEUE (32 CARS) ---
  // Service Vehicles (Morning Intakes)
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `car-q-s${i + 1}`,
    make: ['Maruti', 'Hyundai', 'Kia', 'Tata'][i % 4],
    model: ['Swift', 'Creta', 'Seltos', 'Nexon'][i % 4],
    year: 2018 + (i % 5),
    plateNumber: `GA-02-QS-${1000 + i}`,
    customerName: `Service Customer ${i + 1}`,
    customerPhone: `+91 91000 ${10000 + i}`,
    promisedTime: `${16 + Math.floor(i/4)}:00`,
    promisedDateTime: `2026-06-26T${16 + Math.floor(i/4)}:00:00`,
    overallStatus: 'healthy' as const,
    currentBayId: null,
    jobs: [{ id: `j-q-s${i}`, title: 'General Service', durationMins: 60, elapsedMins: 0, status: 'pending' as const, technicianName: 'Unassigned', cost: 100 }],
    approvalPending: false,
    partsOnOrder: false,
    sharedResourceRequest: 'none' as const,
    sharedResourceStatus: 'none' as const
  })),

  // Accident/Breakdown/VIP (Afternoon Intakes)
  ...Array.from({ length: 20 }).map((_, i) => {
    const type = i < 10 ? 'Accident' : i < 18 ? 'Breakdown' : 'VIP';
    return {
      id: `car-q-pm${i + 1}`,
      make: ['Mahindra', 'Jeep', 'Volvo', 'Lexus'][i % 4],
      model: ['Thar', 'Compass', 'XC60', 'ES'][i % 4],
      year: 2020 + (i % 4),
      plateNumber: `GA-03-QP-${2000 + i}`,
      customerName: `${type} Customer ${i + 1}`,
      customerPhone: `+91 92000 ${20000 + i}`,
      promisedTime: `${19 + Math.floor(i/10)}:30`,
      promisedDateTime: `2026-06-26T${19 + Math.floor(i/10)}:30:00`,
      overallStatus: (type === 'VIP' ? 'critical' : 'healthy') as 'critical' | 'healthy',
      currentBayId: null,
      jobs: [{ id: `j-q-pm${i}`, title: `${type} Diagnostic`, durationMins: 90, elapsedMins: 0, status: 'pending' as const, technicianName: 'Unassigned', cost: 200 }],
      approvalPending: false,
      partsOnOrder: false,
      sharedResourceRequest: 'none' as const,
      sharedResourceStatus: 'none' as const
    };
  })
];

export const INITIAL_LOGS: ActivityLogEntry[] = [
  { id: 'log-1', timestamp: '08:00', message: 'Shop Floor v2.0 Day Operations started. System initialized.', type: 'info' },
  { id: 'log-2', timestamp: '08:15', message: 'BMW KA-02 QR 3340: Periodic standard inspection completed. Found brake disc groove wear. Customer quotation sent (₹220).', type: 'approval' },
  { id: 'log-3', timestamp: '08:30', message: 'Maruti Suzuki TN-09 XY 7733: Front brake pad replacement halted. Ordered urgent OEM Swift pads from depot.', type: 'warning' },
  { id: 'log-4', timestamp: '08:45', message: 'Hyundai KA-01 MH 4421: Standard 45-min periodic inspection completed. Transferred to ALN-01 rig for active wheel alignment.', type: 'success' },
];

export const STAFF_ROSTER: Mechanic[] = [
  // 4 Senior Level
  { id: '1', name: 'Sarah Patel', level: 'Senior', utilization: 85, activeJobs: 1 },
  { id: '2', name: 'Ming Chen', level: 'Senior', utilization: 40, activeJobs: 1 },
  { id: '3', name: 'Ravi Kumar', level: 'Senior', utilization: 75, activeJobs: 1 },
  { id: '4', name: 'Marcus Brodie', level: 'Senior', utilization: 60, activeJobs: 1 },

  // 4 Mid-Level
  { id: '5', name: 'Alice Davis', level: 'Mid-Level', utilization: 20, activeJobs: 0 },
  { id: '6', name: 'Vikram Malhotra', level: 'Mid-Level', utilization: 90, activeJobs: 2 },
  { id: '7', name: 'Amit Shah', level: 'Mid-Level', utilization: 50, activeJobs: 1 },
  { id: '8', name: 'Elena Rostova', level: 'Mid-Level', utilization: 0, activeJobs: 0 },

  // 4 Junior Level
  { id: '9', name: 'John Smith', level: 'Junior', utilization: 45, activeJobs: 1 },
  { id: '10', name: 'Bob Wilson', level: 'Junior', utilization: 0, activeJobs: 0 },
  { id: '11', name: 'Krishna Murthy', level: 'Junior', utilization: 30, activeJobs: 1 },
  { id: '12', name: 'Ryan Gallagher', level: 'Junior', utilization: 0, activeJobs: 0 }
];
