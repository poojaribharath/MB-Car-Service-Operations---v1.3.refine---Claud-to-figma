import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Search, 
  Filter,
  Inbox,
  Trash2,
  CheckCheck,
  Calendar,
  ChevronRight,
  Package,
  Wrench,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface NotificationCentreProps {
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotificationClick: (id: string) => void;
  onResolveActionable?: (id: string) => void;
}

type CategoryFilter = 'all' | AppNotification['category'] | 'actionable';

export const NotificationCentre: React.FC<NotificationCentreProps> = ({
  notifications,
  onMarkAllRead,
  onClearAll,
  onNotificationClick,
  onResolveActionable
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { id: CategoryFilter; label: string; icon: any }[] = [
    { id: 'all', label: 'All Notifications', icon: Inbox },
    { id: 'actionable', label: 'Critical Exceptions', icon: ShieldAlert },
    { id: 'operational', label: 'Workshop Floor', icon: Wrench },
    { id: 'approval', label: 'Client Approvals', icon: UserCheck },
    { id: 'parts', label: 'Parts & Logistics', icon: Package },
    { id: 'system', label: 'System Alarms', icon: Bell },
  ];

  const filteredNotifications = notifications.filter(n => {
    const matchesCategory = activeCategory === 'all' 
      ? true 
      : activeCategory === 'actionable' 
        ? n.isActionable 
        : n.category === activeCategory;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getIcon = (severity: AppNotification['severity']) => {
    switch (severity) {
      case 'warning': return <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>;
      case 'danger': return <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle className="w-5 h-5" /></div>;
      default: return <div className="p-2 bg-sky-50 text-sky-600 rounded-lg"><Info className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="flex-grow bg-neutral-50 min-h-screen">
      <div className="w-full px-4 sm:px-6 py-4 sm:py-6 pt-2">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-4 mb-space-8">
          <div>
            <div className="flex items-center gap-space-3 mb-space-2">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 border border-primary-100 rounded text-[10px] font-bold uppercase tracking-widest font-mono">
                Historical Archive
              </span>
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium font-mono">
                <Clock className="w-3 h-3" />
                Updated Real-time
              </div>
            </div>
            <h1 className="text-display-large font-bold text-neutral-950 tracking-tight">Notification Centre</h1>
            <p className="text-body text-neutral-500 mt-1 max-w-2xl">
              Centralized hub for all workshop floor signals, client approval requests, and supply chain updates.
            </p>
          </div>

          <div className="flex items-center gap-space-3">
             <button 
              onClick={onMarkAllRead}
              className="flex items-center gap-2 px-space-4 py-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-[12px] font-bold text-neutral-600 shadow-xs"
             >
               <CheckCheck className="w-4 h-4" /> Mark all as read
             </button>
             <button 
              onClick={onClearAll}
              className="flex items-center gap-2 px-space-4 py-2 bg-white border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors text-[12px] font-bold shadow-xs transition-all"
             >
               <Trash2 className="w-4 h-4" /> Clear archive
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-3 space-y-space-4">
             <div className="bg-white p-space-5 rounded-xl border border-neutral-200 custom-shadow-sm">
                <div className="flex items-center justify-between mb-space-4">
                  <h3 className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest font-mono">Categories</h3>
                  <Filter className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div className="space-y-1">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group",
                          isActive 
                            ? "bg-primary-50 text-primary-700" 
                            : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("w-4 h-4", isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600")} />
                          {cat.label}
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />}
                      </button>
                    );
                  })}
                </div>
             </div>

             <div className="bg-white p-space-5 rounded-xl border border-neutral-200 custom-shadow-sm">
                <h3 className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest font-mono mb-space-4">Search Activity</h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                  />
                </div>
             </div>
          </div>

          {/* Main List */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-xl border border-neutral-200 custom-shadow-sm overflow-hidden min-h-[600px] flex flex-col">
              <div className="px-space-6 py-space-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center justify-between">
                <span className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                  Showing {filteredNotifications.length} Notifications
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400">
                  <Calendar className="w-3.5 h-3.5" /> Latest First
                </div>
              </div>

              <div className="flex-grow">
                {filteredNotifications.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    <AnimatePresence mode="popLayout">
                      {filteredNotifications.map((n) => (
                        <motion.div
                          layout
                          key={n.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={cn(
                            "group p-space-6 hover:bg-neutral-50/80 transition-all cursor-pointer flex gap-space-5 items-start",
                            !n.read && "bg-primary-50/40 relative"
                          )}
                          onClick={() => onNotificationClick(n.id)}
                        >
                          {!n.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />
                          )}
                          
                          <div className="shrink-0 pt-1">
                            {getIcon(n.severity)}
                          </div>

                          <div className="flex-grow">
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className={cn("text-[16px] font-bold text-neutral-950", !n.read && "text-primary-900")}>
                                  {n.title}
                                </h4>
                                {n.isActionable && (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider font-mono border",
                                    n.status === 'resolved' 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : n.severity === 'danger'
                                        ? "bg-red-50 text-red-700 border-red-200 animate-pulse"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                  )}>
                                    {n.status === 'resolved' ? 'Resolved' : n.severity === 'danger' ? 'Critical Action' : 'Action Required'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border",
                                  n.severity === 'info' ? "bg-sky-50 text-sky-700 border-sky-100" :
                                  n.severity === 'warning' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                  n.severity === 'danger' ? "bg-red-50 text-red-700 border-red-100" :
                                  "bg-neutral-100 text-neutral-600 border-neutral-200"
                                )}>
                                  {n.category}
                                </span>
                                <span className="text-[12px] text-neutral-400 font-medium font-mono">
                                  {n.timestamp}
                                </span>
                              </div>
                            </div>
                            <p className="text-[14px] text-neutral-600 leading-relaxed mb-3">
                              {n.message}
                            </p>

                            {/* Action Required Callout Box */}
                            {n.isActionable && n.actionRequiredText && (
                              <div className={cn(
                                "mb-3 p-3 rounded-lg border text-xs flex items-center justify-between gap-4",
                                n.status === 'resolved'
                                  ? "bg-neutral-50 border-neutral-200 text-neutral-500"
                                  : "bg-amber-50/50 border-amber-150 text-amber-900"
                              )}>
                                <div className="font-sans">
                                  <span className="font-bold block text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Recommended Mitigation Strategy</span>
                                  <span className="font-semibold">{n.actionRequiredText}</span>
                                  {n.resolvedAt && (
                                    <span className="block text-[10px] text-emerald-600 font-bold mt-1 uppercase font-mono">
                                      ✔ Resolved at {n.resolvedAt}
                                    </span>
                                  )}
                                </div>
                                {n.isActionable && n.status !== 'resolved' && onResolveActionable && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onResolveActionable(n.id);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-mono transition-all shadow-sm shrink-0 cursor-pointer"
                                  >
                                    RESOLVE & RESUME
                                  </button>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4">
                               <button className="text-[12px] font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1 group/btn">
                                 View Details <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                               </button>
                               {!n.read && (
                                <span className="text-[11px] font-bold text-primary-500 uppercase tracking-widest flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" /> New Alert
                                </span>
                               )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-space-11 text-center h-full">
                    <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200 mb-space-5">
                      <Inbox className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">No notifications found</h3>
                    <p className="text-neutral-500 max-w-[280px]">
                      We couldn't find any notifications matching your current filters.
                    </p>
                    <button 
                      onClick={() => {setActiveCategory('all'); setSearchQuery('');}}
                      className="mt-space-6 text-primary-600 font-bold hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
