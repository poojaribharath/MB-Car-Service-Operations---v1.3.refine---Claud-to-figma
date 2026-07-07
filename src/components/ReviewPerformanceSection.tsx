import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ReviewPerformanceSectionProps {
  onTimeCount: number;
  atRiskCount: number;
  missedCount: number;
}

export const ReviewPerformanceSection: React.FC<ReviewPerformanceSectionProps> = ({
  onTimeCount,
  atRiskCount,
  missedCount
}) => {
  const data = [
    { name: 'On-Time', value: onTimeCount, color: '#22C55E' },
    { name: 'At-Risk', value: atRiskCount, color: '#F97316' },
    { name: 'Missed', value: missedCount, color: '#DC2626' },
  ];

  const total = onTimeCount + atRiskCount + missedCount;

  return (
    <div className="bg-white p-space-6 rounded-xl border border-neutral-200 custom-shadow-sm h-full">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-space-4 mb-space-5">
        <div>
          <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Dispatch Commitment Performance</h3>
          <p className="text-body text-neutral-500 mt-1">SLA adherence for today's promised handbacks</p>
        </div>
        <div className="text-right">
          <span className="text-[24px] font-bold text-neutral-900">{total}</span>
          <p className="text-[11px] font-bold text-neutral-400 uppercase font-mono">Total Commitments</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-space-8 h-[240px]">
        <div className="w-full md:w-1/2 h-full">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={data}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={5}
                 dataKey="value"
               >
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.color} />
                 ))}
               </Pie>
               <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
               />
             </PieChart>
           </ResponsiveContainer>
        </div>

        <div className="w-full md:w-1/2 space-y-space-4">
           {data.map((item) => (
             <div key={item.name} className="flex items-center justify-between p-space-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                 <span className="text-body font-semibold text-neutral-700">{item.name} Vehicles</span>
               </div>
               <div className="text-right">
                 <span className="text-h3 font-bold text-neutral-900">{item.value}</span>
                 <span className="text-[12px] text-neutral-400 ml-2 font-medium">
                   ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                 </span>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
