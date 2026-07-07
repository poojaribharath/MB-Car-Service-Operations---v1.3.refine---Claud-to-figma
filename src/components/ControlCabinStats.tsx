import React from 'react';
import { Car, ServiceBay } from '../types';
import { DSStatWidget } from './DesignSystem';

interface ControlCabinStatsProps {
  cars: Car[];
  bays: ServiceBay[];
  currentTime: string; // "16:15"
}

export const ControlCabinStats: React.FC<ControlCabinStatsProps> = ({ cars, bays, currentTime }) => {
  // Compute Stats
  const totalCars = cars.length;
  
  // Active work (cars that have at least one job in progress)
  const activeWork = cars.filter(c => c.jobs.some(j => j.status === 'in-progress')).length;
  
  // Blocked cars (either approvalPending or partsOnOrder)
  const blockedCars = cars.filter(c => c.overallStatus === 'blocked').length;

  // Helper inside loop for time difference
  const getDiffMinutes = (timeStart: string, timeEnd: string): number => {
    try {
      const [h1, m1] = timeStart.split(':').map(Number);
      const [h2, m2] = timeEnd.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 1440;
      return diff;
    } catch {
      return 0;
    }
  };

  const blockedOver2HoursCount = cars.filter(c => {
    if (c.overallStatus !== 'blocked') return false;
    const blockMins = c.blockedAt ? getDiffMinutes(c.blockedAt, currentTime) : 0;
    return blockMins >= 120 || (
      c.partsExpectedTime && (
        c.partsExpectedTime.toLowerCase().includes('2h') ||
        c.partsExpectedTime.toLowerCase().includes('2 h') ||
        c.partsExpectedTime.toLowerCase().includes('3h') ||
        c.partsExpectedTime.toLowerCase().includes('3 h') ||
        c.partsExpectedTime.toLowerCase().includes('4h') ||
        c.partsExpectedTime.toLowerCase().includes('4 h') ||
        parseInt(c.partsExpectedTime) >= 2
      )
    );
  }).length;
  
  // Pending customer approvals
  const pendingApprovals = cars.filter(c => c.approvalPending).length;
  
  // Critical countdown (promised within 60 minutes and has unfinished jobs)
  const criticalCars = cars.filter(c => {
    if (c.overallStatus === 'completed') return false;
    
    // Parse promised time "HH:MM"
    const [pHour, pMin] = c.promisedTime.split(':').map(Number);
    const [cHour, cMin] = currentTime.split(':').map(Number);
    
    const pTotal = pHour * 60 + pMin;
    const cTotal = cHour * 60 + cMin;
    
    const diff = pTotal - cTotal;
    
    // Unfinished jobs exist
    const hasUnfinished = c.jobs.some(j => j.status !== 'completed');
    
    return hasUnfinished && (diff <= 60 && diff >= 0);
  });

  const criticalCount = criticalCars.length;

  // Active bays (bays with a car inside)
  const occupiedBaysCount = bays.filter(b => b.currentCarId !== null).length;
  const utilizationRate = Math.round((occupiedBaysCount / bays.length) * 100) || 0;

  return (
    <div id="stats-dashboard-row" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* Metric 1: Total Vehicles */}
      <DSStatWidget
        id="stat-total-cars"
        title="TOTAL VEHICLES / DAILY INFLOW"
        value={`${totalCars} / 40`}
        subtitle={`Active Inflow Load: ${Math.round((totalCars / 40) * 100)}%`}
        variant="neutral"
        iconName="vehicle"
      />

      {/* Metric 2: Active Work */}
      <DSStatWidget
        id="stat-active-work"
        title="ACTIVE REPAIRS"
        value={activeWork}
        subtitle="Wrenches turning"
        variant="primary"
        iconName="parts"
      />

      {/* Metric 3: Critical Miss Risk */}
      <DSStatWidget
        id="stat-critical-alerts"
        title="DELIVERY ALERTS"
        value={criticalCount}
        subtitle={criticalCount > 0 ? 'Promised < 1 hour' : 'All schedules on track'}
        variant={criticalCount > 0 ? 'critical' : 'neutral'}
        iconName="timer"
      />

      {/* Metric 4: Blocked Bays */}
      <DSStatWidget
        id="stat-blocked-bays"
        title={blockedOver2HoursCount > 0 ? '⚠️ CRITICAL BLOCK (>2H)' : 'BAY BLOCKAGES'}
        value={blockedCars}
        subtitle={blockedOver2HoursCount > 0 ? `${blockedOver2HoursCount} Critical SLA breaching` : 'Approvals or Parts'}
        variant={blockedOver2HoursCount > 0 ? 'critical-over-2h' : blockedCars > 0 ? 'risk' : 'neutral'}
        iconName="alert"
      />

      {/* Metric 5: Pending Approvals */}
      <DSStatWidget
        id="stat-pending-approvals"
        title="PENDING APPROVALS"
        value={pendingApprovals}
        subtitle="Awaiting customer YES"
        variant={pendingApprovals > 0 ? 'warning' : 'neutral'}
        iconName="approval"
      />

      {/* Metric 6: Bay Utilization Rate */}
      <DSStatWidget
        id="stat-utilization-rate"
        title="BAY UTILIZATION"
        value={`${utilizationRate}%`}
        subtitle={`${occupiedBaysCount} of ${bays.length} active bays`}
        variant="neutral"
        iconName="status"
      />
    </div>
  );
};
