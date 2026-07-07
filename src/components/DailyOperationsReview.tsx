import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Activity,
  Users,
  CheckCircle2,
  Calendar,
  Filter,
  BarChart,
  PieChart as PieChartIcon,
  ChevronDown,
  Download,
  Share2,
  Package,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart as ReBarChart, 
  Bar, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'motion/react';
import { Car, ServiceBay, EodReport } from '../types';
import { ReviewKpiCard } from './ReviewKpiCard';
import { ReviewPerformanceSection } from './ReviewPerformanceSection';
import { ReviewBottleneckSection } from './ReviewBottleneckSection';
import { ReviewBayAnalysis } from './ReviewBayAnalysis';
import { ReviewMechanicOverview } from './ReviewMechanicOverview';
import { ReviewRecommendations } from './ReviewRecommendations';
import { cn } from '../lib/utils';

// Mock trend data
const performanceTrendData = [
  { day: 'Mon', onTime: 88, completed: 32 },
  { day: 'Tue', onTime: 91, completed: 35 },
  { day: 'Wed', onTime: 85, completed: 28 },
  { day: 'Thu', onTime: 94, completed: 41 },
  { day: 'Fri', onTime: 92, completed: 38 },
  { day: 'Sat', onTime: 96, completed: 24 },
  { day: 'Sun', onTime: 98, completed: 18 },
];

const delaySourceData = [
  { name: 'Parts', value: 35, color: '#0D9488' },
  { name: 'Approvals', value: 25, color: '#F59E0B' },
  { name: 'Alignment', value: 20, color: '#F97316' },
  { name: 'Wash', value: 15, color: '#3B82F6' },
  { name: 'Other', value: 5, color: '#64748B' },
];

interface DailyOperationsReviewProps {
  cars: Car[];
  bays: ServiceBay[];
  currentDay?: number;
  eodReports?: EodReport[];
  onStartNewDay?: () => void;
  currentTime?: string;
}

export const DailyOperationsReview: React.FC<DailyOperationsReviewProps> = ({
  cars,
  bays,
  currentDay = 1,
  eodReports = [],
  onStartNewDay,
  currentTime = '14:30'
}) => {
  const [activeFilter, setActiveFilter] = useState('Today');
  const [selectedHistoryDay, setSelectedHistoryDay] = useState<string | null>(null);


  // Derive real statistics from props
  const completedCars = cars.filter(c => c.overallStatus === 'completed');
  const totalCarsCount = cars.length;
  const deliverySLA = totalCarsCount > 0 
    ? Math.round(((completedCars.length + cars.filter(c => c.overallStatus === 'healthy').length) / totalCarsCount) * 100) 
    : 92;
  
  const bayOccPct = bays.length > 0
    ? Math.round((bays.filter(b => b.currentCarId).length / bays.length) * 100)
    : 87;

  const blockedBayTime = cars.filter(c => c.overallStatus === 'blocked').length * 45; // mock 45m per blocked
  const approvalDelayMins = cars.filter(c => c.approvalPending).length * 30; // mock 30m per pending

  const missedCount = cars.filter(c => c.overallStatus === 'critical').length;
  const atRiskCount = cars.filter(c => c.overallStatus === 'at-risk').length;
  const onTimeCount = completedCars.length + cars.filter(c => c.overallStatus === 'healthy').length;

  return (
    <div className="flex-grow bg-neutral-50 min-h-screen overflow-y-auto pb-12">
      {/* 0. Top Navigation / Filter Bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="w-full px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-space-4">
            <div className="flex items-center gap-space-2 text-primary-700">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-bold text-[18px] tracking-tight">Operations Review</span>
            </div>
            <div className="h-4 w-px bg-neutral-200 mx-space-2" />
            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-space-4 py-1.5 text-[12px] font-bold rounded-lg transition-all uppercase tracking-wider font-mono",
                    activeFilter === f ? "bg-white text-primary-900 shadow-sm border border-neutral-200" : "text-neutral-500 hover:text-neutral-700"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-space-3">
             <button className="flex items-center gap-2 px-space-4 py-2 border border-neutral-200 rounded-xl bg-white hover:bg-neutral-50 transition-colors text-[12px] font-bold text-neutral-600">
               <Download className="w-4 h-4" /> Export Report
             </button>
             <button className="flex items-center gap-2 px-space-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-[12px] font-bold shadow-sm">
               <Share2 className="w-4 h-4" /> Share with Team
             </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 py-4 sm:py-6 pt-2 space-y-6">
        
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-4">
           <div>
             <div className="flex items-center gap-space-3 mb-space-2">
               <span className="px-2 py-0.5 bg-success-50 text-success-700 border border-success-100 rounded text-[10px] font-bold uppercase tracking-widest font-mono">
                 ● Day {currentDay} Active
               </span>
               <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium font-mono">
                 <Clock className="w-3 h-3" />
                 Simulated Time: {currentTime}
               </div>
             </div>
             <h1 className="text-display-large font-bold text-neutral-950 tracking-tight">Workshop Operations Review — Day {currentDay}</h1>
             <p className="text-body text-neutral-500 mt-1 max-w-2xl">
               Live performance sync, automatic end-of-day operational summary compiling, and workloads carry-over control for Day {currentDay}.
             </p>
           </div>
           <div className="bg-white p-space-4 rounded-xl border border-neutral-200 custom-shadow-sm flex items-center gap-space-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary-50 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-primary-600" />
                 </div>
                 <div>
                    <span className="text-[20px] font-bold text-neutral-900 block leading-tight">92%</span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono">Overall Efficiency</span>
                 </div>
              </div>
              <div className="h-10 w-px bg-neutral-100" />
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-warning-50 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-warning-600" />
                 </div>
                 <div>
                    <span className="text-[20px] font-bold text-neutral-900 block leading-tight">3</span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono">SLA Breaches</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Section 1 — Daily Performance Summary */}
        {/* End of Day (EOD) Operations Control Hub */}
        <div className="bg-white rounded-xl border border-neutral-200 custom-shadow-sm overflow-hidden mb-6">
          <div className="p-space-5 border-b border-neutral-100 bg-neutral-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                <h2 className="text-[14px] font-mono uppercase tracking-wider font-bold text-neutral-100">
                  🌙 End-of-Day (EOD) Operations Control Hub
                </h2>
              </div>
              <p className="text-[12px] text-neutral-400 mt-1 max-w-xl">
                Persistent daily KPI compiling, mechanic performance scoring, and carry-over workload alignment. Lock-in occurs at 08:30 PM (20:30).
              </p>
            </div>
            
            {/* History Selector if reports exist */}
            {eodReports.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase font-mono tracking-wider text-neutral-400">EOD Report Archive:</span>
                <select
                  value={selectedHistoryDay || ""}
                  onChange={(e) => setSelectedHistoryDay(e.target.value || null)}
                  className="bg-neutral-800 text-white border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-primary-500"
                >
                  <option value="" className="text-neutral-950">-- View Active Day {currentDay} (Live) --</option>
                  {eodReports.map(rep => (
                    <option key={rep.dayId} value={rep.dayId} className="text-neutral-950">
                      {rep.dayId} Report ({rep.calculatedAtTime})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selectedHistoryDay ? (
            // HISTORICAL ARCHIVED REPORT VIEW
            (() => {
              const histReport = eodReports.find(r => r.dayId === selectedHistoryDay);
              if (!histReport) return null;
              return (
                <div className="p-space-6 bg-neutral-50/50 space-y-6">
                  <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                    <div>
                      <span className="px-2.5 py-0.5 bg-neutral-800 text-neutral-200 rounded text-[9px] font-bold uppercase tracking-widest font-mono">
                        ARCHIVED PERFORMANCE METRICS
                      </span>
                      <h3 className="text-md font-bold text-neutral-900 mt-1">Operational Metrics Summary for {histReport.dayId}</h3>
                      <p className="text-xs text-neutral-500">Calculated on {histReport.date} at {histReport.calculatedAtTime} simulated time</p>
                    </div>
                    <button
                      onClick={() => setSelectedHistoryDay(null)}
                      className="px-3.5 py-1.5 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-all font-mono uppercase tracking-wider cursor-pointer"
                    >
                      Close Archive
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm text-center">
                      <div className="text-[22px] font-black text-primary-600 font-mono">{histReport.onTimeDispatchSla}%</div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">On-Time SLA</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm text-center">
                      <div className="text-[22px] font-black text-neutral-800 font-mono">{histReport.completedCount} / {histReport.totalVehicles}</div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Dispatched Today</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm text-center">
                      <div className="text-[22px] font-black text-amber-600 font-mono">{histReport.pendingCount}</div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Carried Over (Pending)</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm text-center">
                      <div className="text-[22px] font-black text-emerald-600 font-mono">${histReport.totalCostValue}</div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Completed Labor Revenue</div>
                    </div>
                  </div>

                  {/* Historical Mechanic Table */}
                  <div className="bg-white p-space-5 rounded-xl border border-neutral-200 shadow-sm">
                    <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-wider font-mono mb-3">
                      Technician Roster Production & Workloads ({histReport.dayId})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-200 text-neutral-400 font-bold uppercase font-mono text-[9px] pb-2">
                            <th className="pb-2">Mechanic Name</th>
                            <th className="pb-2 text-center">Roster Role</th>
                            <th className="pb-2 text-center">Vehicles Completed</th>
                            <th className="pb-2 text-center">Jobs Completed</th>
                            <th className="pb-2 text-center">Labor Workload Util.</th>
                            <th className="pb-2 text-right">Revenue Contributed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {histReport.mechanics.map(m => (
                            <tr key={m.id} className="hover:bg-neutral-50/50">
                              <td className="py-2.5 font-bold text-neutral-800">{m.name}</td>
                              <td className="py-2.5 text-center text-neutral-500 font-mono text-[10px]">{m.level}</td>
                              <td className="py-2.5 text-center font-mono font-bold text-neutral-800">{m.vehiclesCompleted}</td>
                              <td className="py-2.5 text-center font-mono text-neutral-600">{m.jobsCompleted}</td>
                              <td className="py-2.5 text-center font-mono font-bold text-neutral-700">{m.activeWorkTime}%</td>
                              <td className="py-2.5 text-right font-mono font-bold text-emerald-600">${m.revenueGenerated}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Carried over list */}
                  <div className="bg-white p-space-5 rounded-xl border border-neutral-200 shadow-sm">
                    <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-wider font-mono mb-3">
                      Transferred Pending Vehicles ("Let It Be" Roster)
                    </h4>
                    {histReport.pendingVehicles.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic">No vehicles required overnight transfer. Day concluded with 100% throughput!</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {histReport.pendingVehicles.map(v => (
                          <div key={v.id} className="p-3 border border-neutral-150 bg-neutral-50 rounded-lg flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-neutral-800">{v.make} {v.model}</div>
                              <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{v.plateNumber}</div>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono",
                                v.overallStatus === 'blocked' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                              )}>
                                {v.overallStatus}
                              </span>
                              <div className="text-[9px] font-medium text-neutral-400 mt-1 font-mono">
                                Jobs: {v.completedJobsCount}/{v.jobsCount}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            // LIVE DAY VIEW & CONTROLS
            (() => {
              const [h, m] = currentTime.split(':').map(Number);
              const isAfterEodTime = (h * 60 + m) >= 1230; // 20:30 is 1230 minutes

              return (
                <div className="p-space-6 bg-neutral-50/70 space-y-6">
                  {/* Status Banner */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-dashed border-neutral-200 rounded-xl bg-white">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-100 rounded-lg text-neutral-800 shrink-0">
                        <Clock className="w-5 h-5 text-neutral-600 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider font-mono flex items-center gap-2">
                          {isAfterEodTime ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>✓ 08:30 PM REACHED: EOD KPI SYNC COMPLETED</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              <span>⏳ SHIFT IN PROGRESS — AUTO-SYNC AT 20:30 (08:30 PM)</span>
                            </>
                          )}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                          {isAfterEodTime 
                            ? `Day ${currentDay}'s final report has been processed and synced. Any vehicles still pending ("let it be") will carry over to tomorrow's shift automatically so you can accept new vehicles.`
                            : `The simulated clock is at ${currentTime}. Automatic daily metrics compilation locks in at 08:30 PM (20:30). If you transition now, completed vehicles will be cleared, and all pending work is carried forward intact.`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      {onStartNewDay && (
                        <button
                          onClick={onStartNewDay}
                          className={cn(
                            "w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider font-mono shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                            isAfterEodTime 
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02]" 
                              : "bg-primary-600 text-white hover:bg-primary-700 hover:scale-[1.02]"
                          )}
                        >
                          <Zap className="w-4 h-4" />
                          {isAfterEodTime ? `Start Day ${currentDay + 1} Shift` : `Force EOD & Start Day ${currentDay + 1}`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Carry Over Pending Status */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black text-neutral-800 uppercase tracking-wider font-mono border-l-4 border-amber-500 pl-2.5">
                        Overnight Workload Carry-over Preview ({cars.filter(c => c.overallStatus !== 'completed').length} Vehicles Pending)
                      </h4>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase font-mono">
                        Safe Carryover Guaranteed ("Let It Be")
                      </span>
                    </div>

                    {cars.filter(c => c.overallStatus !== 'completed').length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-neutral-200 bg-white rounded-xl">
                        <p className="text-xs text-neutral-400 italic font-mono">All vehicles completed! Roster is clear for tomorrow's bookings.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cars.filter(c => c.overallStatus !== 'completed').map(c => {
                          const complJobs = c.jobs.filter(j => j.status === 'completed').length;
                          return (
                            <div key={c.id} className="p-3 border border-neutral-200 bg-white rounded-xl shadow-sm hover:border-neutral-300 transition-all">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="text-xs font-bold text-neutral-800 leading-tight">{c.make} {c.model}</h5>
                                  <p className="text-[9px] text-neutral-400 font-mono mt-0.5 uppercase tracking-wider">{c.plateNumber}</p>
                                </div>
                                <span className={cn(
                                  "text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-wider",
                                  c.overallStatus === 'blocked' ? "bg-red-50 text-red-700" :
                                  c.overallStatus === 'critical' ? "bg-amber-50 text-amber-700 animate-pulse" :
                                  c.overallStatus === 'at-risk' ? "bg-amber-50 text-amber-600" :
                                  "bg-emerald-50 text-emerald-700"
                                )}>
                                  {c.overallStatus}
                                </span>
                              </div>

                              <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5 text-neutral-500 font-mono">
                                  <span className="font-bold text-neutral-700">{complJobs}/{c.jobs.length}</span>
                                  <span>Tasks Done</span>
                                </div>
                                <div className="text-neutral-400 text-[9px] font-bold font-mono uppercase">
                                  Bay: {c.currentBayId ? bays.find(b => b.id === c.currentBayId)?.name : 'Parked'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-4">
          <ReviewKpiCard 
            name="On-Time Dispatch" 
            value={`${deliverySLA}%`} 
            icon={Clock} 
            trendStatus="up" 
            trendValue="+4%" 
            trendLabel="vs Yesterday" 
          />
          <ReviewKpiCard 
            name="Vehicles Completed" 
            value={`${completedCars.length}`} 
            subtitle={`/ ${totalCarsCount}`} 
            icon={CheckCircle2} 
            trendStatus="neutral" 
            trendValue="High Volume" 
            trendLabel="Throughput Status" 
          />
          <ReviewKpiCard 
            name="Avg Turnaround" 
            value="4.2h" 
            icon={TrendingUp} 
            trendStatus="down" 
            trendValue="-15m" 
            trendLabel="vs Weekly Avg" 
          />
          <ReviewKpiCard 
            name="Bay Utilization" 
            value={`${bayOccPct}%`} 
            icon={Activity} 
            trendStatus="up" 
            trendValue="+12%" 
            trendLabel="Capacity Loading" 
          />
          <ReviewKpiCard 
            name="Blocked Bay Time" 
            value={`${Math.floor(blockedBayTime / 60)}h ${blockedBayTime % 60}m`} 
            icon={BarChart3} 
            trendStatus="down" 
            trendValue="-45m" 
            trendLabel="Downtime Reduction" 
            className="border-warning-100"
          />
          <ReviewKpiCard 
            name="Approval Delay" 
            value={`${Math.floor(approvalDelayMins / 60)}h ${approvalDelayMins % 60}m`} 
            icon={Users} 
            trendStatus="up" 
            trendValue="+20m" 
            trendLabel="Latency Risk" 
            className="border-risk-100"
          />
        </div>

        {/* Section 2 & 3 — Commitments & Bottlenecks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6">
          <div className="lg:col-span-5">
            <ReviewPerformanceSection 
              onTimeCount={onTimeCount} 
              atRiskCount={atRiskCount} 
              missedCount={missedCount} 
            />
          </div>
          <div className="lg:col-span-7">
            <ReviewBottleneckSection />
          </div>
        </div>

        {/* Section 4 & 5 — Bay Analysis & Mechanic Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6">
          <div className="lg:col-span-7">
            <ReviewBayAnalysis cars={cars} bays={bays} />
          </div>
          <div className="lg:col-span-5">
            <ReviewMechanicOverview cars={cars} bays={bays} />
          </div>
        </div>

        {/* Section 6 — Tomorrow's Risks & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6">
          <div className="lg:col-span-8">
            <ReviewRecommendations />
          </div>
          
          {/* Diagnostic Charts - Column */}
          <div className="lg:col-span-4 space-y-space-6">
            
            {/* Dispatch Performance Trend */}
            <div className="bg-white p-space-6 rounded-xl border border-neutral-200 custom-shadow-sm">
               <div className="flex items-center justify-between mb-space-5">
                  <h4 className="text-[14px] font-bold text-neutral-900 border-l-4 border-primary-600 pl-3 uppercase tracking-wider font-sans">SLA Trend (7D)</h4>
                  <BarChart className="w-4 h-4 text-neutral-300" />
               </div>
               <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceTrendData}>
                      <defs>
                        <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#0F172A' }}
                      />
                      <Area type="monotone" dataKey="onTime" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorOnTime)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-space-4 pt-space-4 border-t border-neutral-50 flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase font-mono">
                  <span>Mon (88%)</span>
                  <span>Sun (98%)</span>
               </div>
            </div>

            {/* Delay Source Breakdown */}
            <div className="bg-white p-space-6 rounded-xl border border-neutral-200 custom-shadow-sm">
               <div className="flex items-center justify-between mb-space-5">
                  <h4 className="text-[14px] font-bold text-neutral-900 border-l-4 border-primary-600 pl-3 uppercase tracking-wider font-sans">Delay Distribution</h4>
                  <PieChartIcon className="w-4 h-4 text-neutral-300" />
               </div>
               <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={delaySourceData}
                        cx="50%"
                        cy="50%"
                        stroke="none"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {delaySourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-4">
                  {delaySourceData.slice(0, 4).map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] font-bold text-neutral-600">{d.name}</span>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
