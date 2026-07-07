import React from 'react';
import { AlertCircle, Clock, Package, CheckCircle2, Waves, ChevronRight } from 'lucide-react';

interface DelaySource {
  id: string;
  source: string;
  timeLost: string;
  affectedVehicles: number;
  impact: 'high' | 'medium' | 'low';
}

export const ReviewBottleneckSection: React.FC = () => {
  const delays: DelaySource[] = [
    { id: '1', source: 'Waiting Parts', timeLost: '3h 25m', affectedVehicles: 8, impact: 'high' },
    { id: '2', source: 'Waiting Approvals', timeLost: '2h 10m', affectedVehicles: 5, impact: 'high' },
    { id: '3', source: 'Alignment Queue', timeLost: '1h 20m', affectedVehicles: 4, impact: 'medium' },
    { id: '4', source: 'Wash Queue', timeLost: '45m', affectedVehicles: 12, impact: 'low' },
  ];

  return (
    <div className="bg-white p-space-6 rounded-xl border border-neutral-200 custom-shadow-sm h-full">
      <div className="border-b border-neutral-100 pb-space-4 mb-space-5">
        <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Bottleneck Analysis</h3>
        <p className="text-body text-neutral-500 mt-1">Primary delay sources and operational drag factors</p>
      </div>

      <div className="space-y-space-3">
        {delays.map((delay, idx) => (
          <div key={delay.id} className="flex items-center group">
            <div className="mr-space-4 text-neutral-400 font-mono text-[14px] font-bold w-space-6">{idx + 1}.</div>
            <div className="flex-grow p-space-4 rounded-xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50 transition-all flex items-center justify-between">
              <div className="flex items-center gap-space-4">
                 <div className={`p-2 rounded-lg ${
                   delay.impact === 'high' ? 'bg-critical-50 text-critical-600' :
                   delay.impact === 'medium' ? 'bg-risk-50 text-risk-600' :
                   'bg-success-50 text-success-600'
                 }`}>
                   {delay.source === 'Waiting Parts' && <Package className="w-5 h-5" />}
                   {delay.source === 'Waiting Approvals' && <CheckCircle2 className="w-5 h-5" />}
                   {delay.source === 'Alignment Queue' && <AlertCircle className="w-5 h-5" />}
                   {delay.source === 'Wash Queue' && <Waves className="w-5 h-5" />}
                 </div>
                 <div>
                   <h4 className="text-card-title font-bold text-neutral-800">{delay.source}</h4>
                   <p className="text-caption text-neutral-500">{delay.affectedVehicles} vehicles impacted</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-space-6">
                <div className="text-right">
                   <div className="text-h3 font-bold text-neutral-900">{delay.timeLost}</div>
                   <div className="text-[10px] font-bold text-neutral-400 uppercase font-mono">Lost time</div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-400 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-space-6 pt-space-4 border-t border-dashed border-neutral-200">
        <div className="bg-neutral-50 p-space-4 rounded-xl flex items-center justify-between">
           <span className="text-[14px] font-semibold text-neutral-600">Total Operational Drag</span>
           <span className="text-h2 font-bold text-neutral-900 tracking-tight">7h 40m</span>
        </div>
      </div>
    </div>
  );
};
