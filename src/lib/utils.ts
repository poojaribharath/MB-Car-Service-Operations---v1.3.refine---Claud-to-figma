import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Car } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDelayMinutes(promisedTime: string, currentTime: string): number {
  const getMinutes = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    } catch {
      return 0;
    }
  };

  const promisedTotal = getMinutes(promisedTime);
  const currentTotal = getMinutes(currentTime);
  
  let diff = currentTotal - promisedTotal;
  if (diff < -720) { // If it seems like promised is yesterday (e.g. promised 23:00, current 01:00)
    diff += 1440;
  }
  
  return Math.max(0, diff);
}

/**
 * Calculates the operational risk status of a vehicle in real-time.
 * 
 * Logic:
 * 1. If completed/blocked -> return that status immediately.
 * 2. Calculate time left until promised time.
 * 3. Calculate estimated time to complete remaining jobs.
 * 4. Add a 30-minute buffer to estimated time.
 * 5. If time left < (estimated time + buffer), it is 'at-risk'.
 */
export function getCarRiskStatus(car: Car, currentTime: string): 'none' | 'completed' | 'blocked' | 'delayed' | 'at-risk' | 'healthy' {
  if (!car) return 'none';
  if (car.overallStatus === 'completed') return 'completed';
  if (car.overallStatus === 'blocked') return 'blocked';

  const getMinutes = (timeStr: string) => {
    try {
      // Handle "HH:MM" (e.g. "14:30")
      const [h, m] = timeStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    } catch {
      return 0;
    }
  };

  const promisedTotal = getMinutes(car.promisedTime);
  const currentTotal = getMinutes(currentTime);
  const isCarDelayed = currentTotal > promisedTotal;

  if (isCarDelayed) return 'delayed';

  // sum of REMAINING non-completed jobs
  const remainingJobMins = car.jobs
    .filter(j => j.status !== 'completed')
    .reduce((sum, j) => sum + (j.durationMins || 20), 0);
  
  const remainingTimeMins = promisedTotal - currentTotal;

  // At Risk if remaining time < estimated time + 30 min buffer
  const isBufferRisk = remainingTimeMins < (remainingJobMins + 30);

  if (car.overallStatus === 'critical' || car.overallStatus === 'at-risk' || isBufferRisk) {
    return 'at-risk';
  }

  return 'healthy';
}

/**
 * Calculates if a given parts ETA string or manual input represents a duration of 2 hours or more (120 minutes or more).
 * It handles text formats (e.g. "2h", "150m", "3 hours", "120 mins") and numbers.
 */
export function isPartsEtaTooLong(eta: string | null | undefined): boolean {
  if (!eta) return false;
  const str = eta.toLowerCase().trim();
  
  // 1. Check for explicit patterns for minutes (e.g., "120 mins", "150m", "130 minutes")
  const minMatch = str.match(/(\d+)\s*(min|m\b|minute)/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    return !isNaN(mins) && mins >= 120;
  }
  
  // 2. Check for explicit patterns for hours (e.g., "2h", "2.5h", "3 hours", "2hr")
  const hourMatch = str.match(/(\d+(\.\d+)?)\s*(h|hour|hr)/);
  if (hourMatch) {
    const hrs = parseFloat(hourMatch[1]);
    return !isNaN(hrs) && hrs >= 2.0;
  }
  
  // 3. Fallback: contains key strings signifying 2h or more
  const triggers = [
    '2 h', '2h', '2hr', '2 hours',
    '3 h', '3h', '3hr', '3 hours',
    '4 h', '4h', '4hr', '4 hours',
    '5 h', '5h', '5hr', '5 hours',
    '6 h', '6h', '6hr', '6 hours',
    '7 h', '7h', '7hr', '7 hours',
    '8 h', '8h', '8hr', '8 hours',
    'next day', '1 day', 'tomorrow', 'delayed'
  ];
  if (triggers.some(trigger => str.includes(trigger))) {
    return true;
  }
  
  // 4. Try parsing raw numbers
  const rawNum = parseFloat(str);
  if (!isNaN(rawNum)) {
    // If it's 120 or greater, treat as minutes
    if (rawNum >= 120) return true;
    // If it's between 2 and under 120, treat as hours
    if (rawNum >= 2 && rawNum < 120) return true;
  }
  
  return false;
}
