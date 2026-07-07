import React from 'react';
import { Lightbulb, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface Recommendation {
  id: string;
  title: string;
  finding: string;
  action: string;
  impactType: 'SLA' | 'Bay Time' | 'Revenue';
  severity: 'high' | 'medium' | 'low';
}

export const ReviewRecommendations: React.FC = () => {
  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Alignment Queue Optimization',
      finding: 'Alignment Queue caused 25% of delays today.',
      action: 'Reserve alignment slots earlier in the job lifecycle.',
      impactType: 'SLA',
      severity: 'high'
    },
    {
      id: '2',
      title: 'Stalled Vehicle Protocol',
      finding: 'Bay 03 remained blocked for 1h 45m due to pending authorizations.',
      action: 'Move stalled vehicles to Holding Area after 30 minutes of wait time.',
      impactType: 'Bay Time',
      severity: 'high'
    },
    {
      id: '3',
      title: 'Approval Escalation Policy',
      finding: 'Approval delays impacted 4 vehicles, pushing handback past 4 PM.',
      action: 'Escalate approvals to Centre Manager after 30 minutes of CRM inactivity.',
      impactType: 'SLA',
      severity: 'medium'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="bg-white p-space-6 rounded-xl border border-neutral-200 custom-shadow-sm h-full">
      <div className="flex items-center gap-space-3 border-b border-neutral-100 pb-space-4 mb-space-5">
        <div className="p-2 bg-primary-50 rounded-lg">
          <Zap className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-h3 font-bold text-neutral-900 tracking-tight">Tomorrow's Risks & Recommendations</h3>
          <p className="text-body text-neutral-500 mt-1">Intelligent operational adjustments based on today's performance</p>
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-space-4"
      >
        {recommendations.map((rec) => (
          <motion.div 
            key={rec.id} 
            variants={item}
            className="group relative p-space-5 rounded-xl border border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all overflow-hidden"
          >
            {/* Visual indicator corner */}
            <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 ${
              rec.severity === 'high' ? 'bg-critical-500/10' : 'bg-primary-500/10'
            }`} />

            <div className="flex flex-col md:flex-row md:items-start gap-space-6">
              <div className="flex-grow space-y-space-3">
                <div className="flex items-center gap-space-3">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                    rec.impactType === 'SLA' ? 'bg-critical-50 text-critical-700' :
                    rec.impactType === 'Bay Time' ? 'bg-warning-50 text-warning-700' :
                    'bg-primary-50 text-primary-700'
                  }`}>
                    {rec.impactType} Impact
                  </span>
                  <h4 className="text-card-title font-bold text-neutral-900">{rec.title}</h4>
                </div>
                
                <div className="flex gap-space-3 items-start">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
                  <p className="text-[14px] text-neutral-600 font-medium">{rec.finding}</p>
                </div>

                <div className="flex gap-space-3 items-center bg-white border border-neutral-100 p-space-3 rounded-lg shadow-xs group-hover:border-primary-200 group-hover:shadow-sm transition-all">
                  <div className="p-1.5 bg-success-50 rounded-lg text-success-600">
                     <Lightbulb className="w-4 h-4" />
                  </div>
                  <p className="text-[13.5px] font-bold text-neutral-800">{rec.action}</p>
                  <ArrowRight className="w-4 h-4 text-neutral-300 ml-auto group-hover:translate-x-1 group-hover:text-primary-500 transition-all" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-space-8 pt-space-6 border-t border-neutral-100 flex items-center justify-between">
         <div className="flex items-center gap-space-4">
            <div className="flex -space-x-space-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-space-8 h-space-8 rounded-full border-2 border-white bg-neutral-200" />
               ))}
               <div className="w-space-8 h-space-8 rounded-full border-2 border-white bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold">+2</div>
            </div>
            <span className="text-caption text-neutral-500">Shared with Service Advisors & Shop Foreman</span>
         </div>
         <button className="text-[12px] font-bold text-primary-700 hover:text-primary-800 flex items-center gap-2 uppercase tracking-widest font-mono">
           Review All Patterns <ChevronRight className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
};

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
