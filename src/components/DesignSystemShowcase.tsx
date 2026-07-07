import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  DSIcon, 
  DSIconFrame, 
  DSStatusBadge, 
  DSVisualCard, 
  DSButton, 
  DSStatWidget, 
  DSSlaProgressBar, 
  DS_COLORS,
  DSVariantType
} from './DesignSystem';
import * as Lucide from 'lucide-react';
import { ServiceBayCard } from './ServiceBayCard';
import { Car, ServiceBay, ServiceJob } from '../types';

export const DesignSystemShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'colors' | 'menu' | 'icons' | 'badges' | 'buttons' | 'cards' | 'widgets' | 'interactive' | 'bay_dashboard_cards'>('all');
  
  // Interactive Button playground state
  const [btnVariant, setBtnVariant] = useState<'primary' | 'secondary' | 'danger' | 'ghost' | 'glass' | 'accent'>('primary');
  const [btnSize, setBtnSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [btnIsLoading, setBtnIsLoading] = useState(false);
  const [btnIcon, setBtnIcon] = useState<string>('vehicle');
  const [btnIconPos, setBtnIconPos] = useState<'left' | 'right'>('left');
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [btnText, setBtnText] = useState('Interactive Action');

  // Interactive SLA progress state
  const [slaElapsed, setSlaElapsed] = useState(45);
  const [slaTotal, setSlaTotal] = useState(120);
  const [slaWarning, setSlaWarning] = useState(70);
  const [slaCritical, setSlaCritical] = useState(90);
  const [slaStripes, setSlaStripes] = useState(true);

  const [clickCount, setClickCount] = useState(0);

  const toggleLoading = () => {
    setBtnIsLoading(true);
    setTimeout(() => {
      setBtnIsLoading(false);
    }, 1500);
  };

  const tabs = [
    { id: 'all', label: 'All Components' },
    { id: 'colors', label: '1. Colors & Typography' },
    { id: 'menu', label: '📱 App Menu & Icons' },
    { id: 'icons', label: '2. Icons & Frames' },
    { id: 'badges', label: '3. Badges & Progress' },
    { id: 'buttons', label: '4. Buttons Matrix' },
    { id: 'cards', label: '5. Visual Cards' },
    { id: 'widgets', label: '6. KPI Widgets' },
    { id: 'bay_dashboard_cards', label: '🚗 Live Bays & KPI Cards' },
    { id: 'interactive', label: '⚡ Interactive Lab' },
  ];

  return (
    <div className="flex-grow p-4 sm:p-6 pt-2 bg-neutral-50/40 space-y-8 overflow-y-auto select-none w-full">
      
      {/* Title block with deep design-system specs */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <Lucide.Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
                AutoTrack Design System & Spec Lab
              </h2>
              <p className="text-xs font-semibold text-teal-600">
                Unified token matrix, micro-animations, color presets, and component playground
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-neutral-400 bg-neutral-100/80 px-2.5 py-1 rounded-md border">
              <Lucide.Sliders className="w-3.5 h-3.5" />
              <span>VERSION 1.4.0 (STABLE)</span>
            </div>
            <a 
              href="/DESIGN_SYSTEM_LAB.md" 
              download="DESIGN_SYSTEM_LAB.md"
              className="flex items-center gap-1.5 font-sans text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100/80 transition-all px-3 py-1.5 rounded-lg border border-teal-200/60 shadow-xs cursor-pointer active:scale-95"
              title="Download Design System Lab Specification Document (.md)"
            >
              <Lucide.FileDown className="w-4 h-4 text-teal-600" />
              <span>Download Spec (.md)</span>
            </a>
          </div>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed max-w-4xl">
          An exhaustive spec sheet demonstrating all configurations, properties, and states of the custom Design System. 
          Use this panel to audit color alignments, text densities, bounding radii, and interactive physics variables.
        </p>
      </div>

      {/* Tabs navigation bar */}
      <div className="flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: COLORS & TYPOGRAPHY */}
      {(activeTab === 'all' || activeTab === 'colors') && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Lucide.Palette className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">1. Style Variables & Color Token Matrix</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">DS_COLORS Map</span>
          </div>

          <p className="text-xs text-neutral-500 max-w-3xl">
            Each preset in the palette controls typography contrast and border shades. Colors are dynamically resolved via mapping structures to support dark-accent overlays and critical operational statuses.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(DS_COLORS).map(([name, colors]) => (
              <div 
                key={name} 
                className={`rounded-xl border p-4 ${colors.bg} ${colors.border} space-y-3 flex flex-col justify-between shadow-xs`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-black uppercase text-neutral-400">Preset Token</span>
                    <span className={`w-3.5 h-3.5 rounded-full ${colors.iconBg} border border-neutral-300/30 inline-block`} />
                  </div>
                  <h4 className="text-sm font-extrabold text-neutral-800 capitalize font-sans">{name.replace('-', ' ')}</h4>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-neutral-200/50">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">BG:</span>
                    <span className="text-neutral-600 bg-white/70 px-1.5 py-0.5 rounded truncate max-w-[140px]">{colors.bg}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">Border:</span>
                    <span className="text-neutral-600 bg-white/70 px-1.5 py-0.5 rounded truncate max-w-[140px]">{colors.border}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">Text:</span>
                    <span className="text-neutral-600 bg-white/70 px-1.5 py-0.5 rounded truncate max-w-[140px]">{colors.text}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">Accent:</span>
                    <span className="text-neutral-600 bg-white/70 px-1.5 py-0.5 rounded truncate max-w-[140px]">{colors.accent}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">Icon BG:</span>
                    <span className="text-neutral-600 bg-white/70 px-1.5 py-0.5 rounded truncate max-w-[140px]">{colors.iconBg}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">Icon Text:</span>
                    <span className="text-neutral-600 bg-white/70 px-1.5 py-0.5 rounded truncate max-w-[140px]">{colors.iconText}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Typography details */}
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/60 space-y-3">
            <h4 className="text-[11px] font-mono font-black text-neutral-400 uppercase">Aesthetic Pairings & Font Specs</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1">
                <span className="font-mono text-[9px] font-black text-neutral-400 block uppercase">Standard Font Sans</span>
                <span className="font-sans text-sm font-bold text-neutral-800">Inter UI Header & Body</span>
                <p className="text-[11px] text-neutral-500 font-sans mt-1">ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1">
                <span className="font-mono text-[9px] font-black text-neutral-400 block uppercase">Technical Font Mono</span>
                <span className="font-mono text-sm font-bold text-teal-800">JetBrains Mono Typeface</span>
                <p className="text-[11px] text-neutral-500 font-mono mt-1">ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1">
                <span className="font-mono text-[9px] font-black text-neutral-400 block uppercase">Elevations (Shadows)</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="bg-white border text-[10px] font-mono font-bold text-neutral-600 px-1.5 py-0.5 rounded shadow-xs">shadow-xs</span>
                  <span className="bg-white border text-[10px] font-mono font-bold text-neutral-600 px-1.5 py-0.5 rounded shadow-sm">shadow-sm</span>
                  <span className="bg-white border text-[10px] font-mono font-bold text-neutral-600 px-1.5 py-0.5 rounded shadow-md">shadow-md</span>
                  <span className="bg-white border text-[10px] font-mono font-bold text-neutral-600 px-1.5 py-0.5 rounded shadow-lg">shadow-lg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APP MENU & ICONS DIRECTORY */}
      {(activeTab === 'all' || activeTab === 'menu') && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Lucide.Menu className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">Application Navigation & Unified Icons Catalog</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">14 Menu Screens Registered</span>
          </div>

          <p className="text-xs text-neutral-500 max-w-4xl leading-relaxed">
            This module provides a comprehensive map of all functional routes, sidebar navigation anchors, and interactive dashboards configured inside <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-teal-700 font-bold">App.tsx</code>. 
            All menu selections are mapped to high-contrast vector icons from the <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-teal-700 font-bold">lucide-react</code> framework.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Sidebar Live Preview */}
            <div className="xl:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">Live Sidebar Preview Representation</h4>
                <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">Simulated Layout</span>
              </div>
              <div className="bg-neutral-900 rounded-2xl p-4 text-neutral-300 border border-neutral-800 space-y-4 shadow-md">
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Lucide.Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-neutral-500 font-bold leading-none uppercase">WORKSPACE</div>
                    <div className="text-xs font-black text-white tracking-wide mt-1 animate-pulse">AUTOTRACK MERCEDES</div>
                  </div>
                </div>

                <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                  {[
                    { id: 'floor', icon: Lucide.LayoutGrid, label: 'Live Floor View' },
                    { id: 'home', icon: Lucide.Home, label: 'Manager Dashboard' },
                    { id: 'design_system', icon: Lucide.Palette, label: 'Design System Lab', isNested: true },
                    { id: 'operations_board', icon: Lucide.SlidersHorizontal, label: 'Vehicle Operations Board' },
                    { id: 'vehicle_detail', icon: Lucide.FileText, label: 'Vehicle Diagnostic Profiler' },
                    { id: 'bay_management', icon: Lucide.Wrench, label: 'Workshop Bay Board' },
                    { id: 'approval_center', icon: Lucide.CheckSquare, label: 'Supplementary Estimates CRM' },
                    { id: 'parts_dependency', icon: Lucide.Truck, label: 'Parts Dependency & Logistics' },
                    { id: 'alignment_queue', icon: Lucide.Compass, label: 'Wheel Alignment Queue' },
                    { id: 'wash_queue', icon: Lucide.Sparkles, label: 'Wash Bay Queue' },
                    { id: 'mechanic_workload', icon: Lucide.Users, label: 'Mechanic Workload capacity' },
                    { id: 'daily_review', icon: Lucide.BarChart3, label: 'Production KPI Review' },
                    { id: 'notification_centre', icon: Lucide.Bell, label: 'Notification Centre' },
                    { id: 'alerts_risk', icon: Lucide.ShieldAlert, label: 'Risks & System Alarms Desk' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isNested = item.isNested;
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold select-none transition-colors ${
                          item.id === 'design_system'
                            ? 'bg-teal-500/10 text-teal-400 font-bold border border-teal-500/20' 
                            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {isNested ? (
                          <span className="text-teal-500 font-mono text-xs">└─</span>
                        ) : null}
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Menu Items Directory Specs */}
            <div className="xl:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">Active Modules Spec Sheet & Metadata</h4>
                <span className="text-[9px] text-neutral-400 font-mono font-bold">Mapping: App.tsx Route state</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  { 
                    id: 'floor', 
                    icon: Lucide.LayoutGrid, 
                    label: 'Live Floor View', 
                    desc: 'Primary real-time workshop tracking lane matrix, displaying active bay operations, vehicle progress indicators, and visual mechanics counters.',
                    theme: 'Teal Focus',
                    badge: 'Interactive Canvas'
                  },
                  { 
                    id: 'home', 
                    icon: Lucide.Home, 
                    label: 'Manager Dashboard', 
                    desc: 'Operational command console with automated performance gauges, service bay allocations, SLA threshold dials, and immediate actions.',
                    theme: 'Charcoal/Green',
                    badge: 'KPI Heavy'
                  },
                  { 
                    id: 'design_system', 
                    icon: Lucide.Palette, 
                    label: 'Design System Lab', 
                    desc: 'Strict component and typography audit workstation. Contains live render nodes, sandbox playground interfaces, and component style documentation.',
                    theme: 'Teal/Neutral',
                    badge: 'Dev Tool'
                  },
                  { 
                    id: 'operations_board', 
                    icon: Lucide.SlidersHorizontal, 
                    label: 'Vehicle Operations Board', 
                    desc: 'Comprehensive multi-stage pipeline flow managing vehicles from Staged, Diagnostic DVI, Estimating, Parts Pending, to Detailing queues.',
                    theme: 'Industrial Grey',
                    badge: 'Pipeline Matrix'
                  },
                  { 
                    id: 'vehicle_detail', 
                    icon: Lucide.FileText, 
                    label: 'Vehicle Diagnostic Profiler', 
                    desc: 'Diagnostic investigation desk featuring detailed Mercedes DVI inspections, severe fault diagnostics, live sensor logs, and recommendation editors.',
                    theme: 'Blue Tech',
                    badge: 'DVI Engine'
                  },
                  { 
                    id: 'bay_management', 
                    icon: Lucide.Wrench, 
                    label: 'Workshop Bay Board', 
                    desc: 'Live allocation tracker for mechanical service bays, displaying active bay numbers, assigned master technicians, and current vehicle jobs.',
                    theme: 'Amber Safety',
                    badge: 'Resource Board'
                  },
                  { 
                    id: 'approval_center', 
                    icon: Lucide.CheckSquare, 
                    label: 'Supplementary Estimates CRM', 
                    desc: 'High-trust customer-facing portal managing supplementary repair estimates, insurance claims status, and client authorization audit logging.',
                    theme: 'Emerald Trust',
                    badge: 'CRM Approval'
                  },
                  { 
                    id: 'parts_dependency', 
                    icon: Lucide.Truck, 
                    label: 'Parts Dependency & Logistics', 
                    desc: 'Supply chain tracker with parts inventory flags, shipping ETAs, critical delayed backorders, and automated inventory flags.',
                    theme: 'Orange Freight',
                    badge: 'Logistics Desk'
                  },
                  { 
                    id: 'alignment_queue', 
                    icon: Lucide.Compass, 
                    label: 'Wheel Alignment Queue', 
                    desc: 'Wheel balancing and toe/camber correction tracking queue featuring specialized hardware diagnostics and alignment state.',
                    theme: 'Violet Alignment',
                    badge: 'Calibration Desk'
                  },
                  { 
                    id: 'wash_queue', 
                    icon: Lucide.Sparkles, 
                    label: 'Wash Bay Queue', 
                    desc: 'Staged final cleanup, interior detailing, and client hand-off quality checklists. Represents the final step in the vehicle repair pipeline.',
                    theme: 'Sky Cleanup',
                    badge: 'Quality Clean'
                  },
                  { 
                    id: 'mechanic_workload', 
                    icon: Lucide.Users, 
                    label: 'Mechanic Workload capacity', 
                    desc: 'Technician workload scheduling, active timesheets, task capacities, certified skill rosters, and dynamic technician assignment workflows.',
                    theme: 'Indigo HR',
                    badge: 'Staff Planner'
                  },
                  { 
                    id: 'daily_review', 
                    icon: Lucide.BarChart3, 
                    label: 'Production KPI Review', 
                    desc: 'Retrospective daily reporting portal capturing hours billed, average cycle times, parts utilization rates, and service advisor performance statistics.',
                    theme: 'Fuchsia Metrics',
                    badge: 'Daily Reports'
                  },
                  { 
                    id: 'notification_centre', 
                    icon: Lucide.Bell, 
                    label: 'Notification Centre', 
                    desc: 'Central timeline tracking real-time client confirmations, parts arrival notifications, and system events across the workshop.',
                    theme: 'Zinc Alarm',
                    badge: 'History Logs'
                  },
                  { 
                    id: 'alerts_risk', 
                    icon: Lucide.ShieldAlert, 
                    label: 'Risks & System Alarms Desk', 
                    desc: 'Consolidated console for severe SLA breaches, overdue technician updates, unresolved parts backorders, and critical safety hazards.',
                    theme: 'Crimson Emergency',
                    badge: 'SLA Alarms'
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.id} 
                      className="bg-neutral-50/50 hover:bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 transition-all flex flex-col justify-between space-y-3 shadow-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-neutral-400">ID: {item.id}</span>
                          <span className="text-[9px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{item.badge}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 shadow-xs">
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-neutral-800 leading-tight">{item.label}</h5>
                            <span className="text-[9px] text-neutral-400 font-bold block">{item.theme} Preset</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-relaxed pt-1 font-sans">
                          {item.desc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-neutral-200/50 flex items-center justify-between font-mono text-[9px] text-neutral-400">
                        <span>Lucide Component:</span>
                        <span className="text-neutral-700 font-bold">{"<"}{Icon.displayName || "Icon"}{" />"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 2: ICONS & FRAMES */}
      {(activeTab === 'all' || activeTab === 'icons') && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Lucide.Wrench className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">2. Icons Registry & Frame Shapes</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">DSIcon & DSIconFrame</span>
          </div>

          <p className="text-xs text-neutral-500">
            The Design System provides standard vector hooks with built-in animations. DSIcon supports any Lucide identifier alongside dedicated shorthand system aliases.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Registered Shorthands */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">Custom Shorthand Registry ({'<DSIcon name="..." />'})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'vehicle', label: 'vehicle (Car)', desc: 'Vehicles, fleet' },
                  { name: 'alert', label: 'alert (Triangle)', desc: 'Breaches, delays' },
                  { name: 'timer', label: 'timer (Clock)', desc: 'SLA counters, logs' },
                  { name: 'parts', label: 'parts (Wrench)', desc: 'Supplies, repairs' },
                  { name: 'approval', label: 'approval (CheckCircle)', desc: 'Releases, CRM OK' },
                  { name: 'bay', label: 'bay (LayoutGrid)', desc: 'Service bay cells' },
                  { name: 'mechanic', label: 'mechanic (User)', desc: 'Workshop staff' },
                  { name: 'status', label: 'status (Activity)', desc: 'Live telemetries' },
                ].map((item) => (
                  <div key={item.name} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 flex flex-col items-center justify-center text-center gap-2">
                    <DSIcon name={item.name as any} size="lg" className="text-neutral-700" />
                    <div>
                      <span className="text-[11px] font-bold text-neutral-800 block font-mono">"{item.name}"</span>
                      <span className="text-[9px] text-neutral-400 font-sans block">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Animation Spectrum */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">Animation Engine ({'animate="..."'})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'spin', icon: 'timer', desc: 'Continuous spin' },
                  { name: 'pulse', icon: 'parts', desc: 'Heartbeat scale' },
                  { name: 'float', icon: 'vehicle', desc: 'Smooth bounce wave' },
                  { name: 'shake', icon: 'alert', desc: 'Vibrational alarm' },
                  { name: 'bounce', icon: 'approval', desc: 'Y-axis jumping' },
                  { name: 'none', icon: 'status', desc: 'Static rendering' },
                ].map((item) => (
                  <div key={item.name} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 flex flex-col items-center justify-center text-center gap-2">
                    <div className="h-10 flex items-center justify-center">
                      <DSIcon name={item.icon as any} size="lg" animate={item.name as any} className="text-teal-600" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-neutral-800 block font-mono">"{item.name}"</span>
                      <span className="text-[9px] text-neutral-400 font-sans block">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Sizing Spectrum */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">Scale Spectrum ({'size="..."'})</h4>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 flex items-end justify-around gap-2">
                {['xs', 'sm', 'md', 'lg', 'xl'].map((sz) => (
                  <div key={sz} className="flex flex-col items-center gap-2">
                    <div className="h-12 flex items-center justify-center">
                      <DSIcon name="vehicle" size={sz as any} className="text-neutral-700" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-neutral-500 bg-white px-2 py-0.5 rounded border uppercase">{sz}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Icon Frame Variants & Shapes */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">Icon Frame Shapes, Glow, & Variants ({'<DSIconFrame />'})</h4>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <DSIconFrame name="vehicle" variant="primary" frameShape="circle" />
                    <span className="text-[9px] font-mono text-neutral-400">circle</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <DSIconFrame name="parts" variant="success" frameShape="rounded" />
                    <span className="text-[9px] font-mono text-neutral-400">rounded</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <DSIconFrame name="alert" variant="critical-over-2h" frameShape="square" />
                    <span className="text-[9px] font-mono text-neutral-400">square</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <DSIconFrame name="timer" variant="warning" frameShape="rounded" glow={true} />
                    <span className="text-[9px] font-mono text-neutral-400">glow: true</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-neutral-200/50">
                  {Object.keys(DS_COLORS).map((variant) => (
                    <DSIconFrame 
                      key={variant} 
                      name="approval" 
                      variant={variant as any} 
                      size="sm" 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: STATUS BADGES & PROGRESS */}
      {(activeTab === 'all' || activeTab === 'badges') && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Lucide.CheckCircle2 className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">3. Uniform Status Badges & SLA Progress Bars</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">DSStatusBadge & DSSlaProgressBar</span>
          </div>

          <p className="text-xs text-neutral-500">
            Automated alerts, workshop statuses, and SLA timelines must use uniform representations to preserve client confidence and avoid system-slop fatigue.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Badges spectrum */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">Uniform Status Badges</h4>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { status: 'healthy', label: 'completed / healthy' },
                    { status: 'completed', label: 'completed (alt)' },
                    { status: 'queued', label: 'queued / in progress' },
                    { status: 'at-risk', label: 'at-risk' },
                    { status: 'blocked', label: 'blocked / hold' },
                    { status: 'critical', label: 'critical breach' },
                    { status: 'blocked-over-2h', label: 'blocked over 2 hours' },
                    { status: 'idle', label: 'idle (neutral fallback)' },
                  ].map((item) => (
                    <div key={item.status} className="p-2.5 bg-white rounded-lg border border-neutral-200/50 flex flex-col gap-1.5 justify-between">
                      <span className="text-[9px] font-mono text-neutral-400 uppercase font-black">{item.label}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <DSStatusBadge status={item.status} />
                        <DSStatusBadge status={item.status} pulseDot={true} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-2">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase font-black block">Custom Label Option</span>
                  <div className="flex flex-wrap gap-2">
                    <DSStatusBadge status="healthy" customLabel="OPERATIONAL OK" />
                    <DSStatusBadge status="blocked-over-2h" customLabel="BAY LOCKDOWN" />
                    <DSStatusBadge status="queued" customLabel="DIAGNOSTIC QUEUED" />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress spectrum */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">SLA Threshold Progress Bars</h4>
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 space-y-4">
                <div className="space-y-3 bg-white p-3.5 rounded-lg border border-neutral-200/50">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 font-bold block">1. HEALTHY STATE (25%)</span>
                    <DSSlaProgressBar elapsed={30} total={120} />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 font-bold block">2. AT WARNING THRESHOLD (80% &gt;= 75% warning)</span>
                    <DSSlaProgressBar elapsed={96} total={120} warningThreshold={75} />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 font-bold block">3. CRITICAL SLA BREACH (95% &gt;= 90% critical)</span>
                    <DSSlaProgressBar elapsed={114} total={120} criticalThreshold={90} />
                  </div>
                </div>

                <div className="space-y-3 bg-white p-3.5 rounded-lg border border-neutral-200/50">
                  <div>
                    <span className="text-[9px] font-mono text-neutral-400 font-bold block">Striped Animation vs Static</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                      <DSSlaProgressBar elapsed={85} total={100} animateStripes={true} />
                      <DSSlaProgressBar elapsed={85} total={100} animateStripes={false} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 4: BUTTONS MATRIX */}
      {(activeTab === 'all' || activeTab === 'buttons') && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Lucide.Sliders className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">4. Interactive Buttons Spec Matrix</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">DSButton Matrix</span>
          </div>

          <p className="text-xs text-neutral-500">
            Buttons are fitted with micro-interactive animations, responsive layouts, and automatic state changes. Audit the entire system layout across variants and sizes below.
          </p>

          <div className="overflow-x-auto border border-neutral-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 font-mono text-[10px] font-black text-neutral-400 uppercase">
                  <th className="p-4">Variant Type</th>
                  <th className="p-4">Size: sm</th>
                  <th className="p-4">Size: md</th>
                  <th className="p-4">Size: lg</th>
                  <th className="p-4">Loading State</th>
                  <th className="p-4">Disabled State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-sans">
                {[
                  { id: 'primary', label: 'Primary' },
                  { id: 'secondary', label: 'Secondary' },
                  { id: 'danger', label: 'Danger' },
                  { id: 'ghost', label: 'Ghost' },
                  { id: 'glass', label: 'Glass' },
                  { id: 'accent', label: 'Accent' },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-bold text-neutral-800 capitalize">
                      {row.label}
                      <span className="block text-[9px] font-mono text-neutral-400 font-medium lowercase">variant="{row.id}"</span>
                    </td>
                    <td className="p-4">
                      <DSButton variant={row.id as any} size="sm">Action</DSButton>
                    </td>
                    <td className="p-4">
                      <DSButton variant={row.id as any} size="md">Action Button</DSButton>
                    </td>
                    <td className="p-4">
                      <DSButton variant={row.id as any} size="lg">Large Call</DSButton>
                    </td>
                    <td className="p-4">
                      <DSButton variant={row.id as any} size="sm" isLoading={true}>Action</DSButton>
                    </td>
                    <td className="p-4">
                      <DSButton variant={row.id as any} size="sm" disabled={true}>Disabled</DSButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Icon Position Options */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/60 space-y-3">
            <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase">Icon Positioning & Composition</h4>
            <div className="flex flex-wrap gap-4">
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1.5">
                <span className="text-[9px] font-mono text-neutral-400 block uppercase">Left Icon Position</span>
                <DSButton variant="secondary" size="sm" icon="vehicle" iconPosition="left">
                  Left aligned icon
                </DSButton>
              </div>
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1.5">
                <span className="text-[9px] font-mono text-neutral-400 block uppercase">Right Icon Position</span>
                <DSButton variant="secondary" size="sm" icon="approval" iconPosition="right">
                  Right aligned icon
                </DSButton>
              </div>
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1.5">
                <span className="text-[9px] font-mono text-neutral-400 block uppercase">Action Counter Demo</span>
                <DSButton variant="accent" size="sm" onClick={() => setClickCount(c => c + 1)}>
                  Secondary Click Counter: {clickCount}
                </DSButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: VISUAL CARDS */}
      {(activeTab === 'all' || activeTab === 'cards') && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Lucide.LayoutGrid className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">5. Visual Cards & Layout Containers</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">DSVisualCard Spec</span>
          </div>

          <p className="text-xs text-neutral-500">
            Visual cards provide deep structure. Interactive physics support both "hover" shadow offsets and "active" micro-spring scale triggers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(Object.keys(DS_COLORS) as DSVariantType[]).map((variant) => (
              <DSVisualCard 
                key={variant} 
                variant={variant} 
                interaction={variant === 'critical-over-2h' ? 'active' : 'hover'}
              >
                <div className="space-y-2 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-black uppercase text-neutral-400">Variant</span>
                      <DSStatusBadge status={variant} className="scale-75 origin-right" />
                    </div>
                    <h5 className="text-xs font-bold text-neutral-800 capitalize mt-1">
                      {variant.replace('-', ' ')} Layout Card
                    </h5>
                    <p className="text-[10px] text-neutral-500 leading-relaxed mt-1">
                      Integrated layout container with color mapping matching the {variant} token preset.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[9px] font-mono text-neutral-400">
                    <span>Interaction: {variant === 'critical-over-2h' ? 'active' : 'hover'}</span>
                    <span className="underline">Specs Info</span>
                  </div>
                </div>
              </DSVisualCard>
            ))}
          </div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/60 space-y-3">
            <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase">Interaction Mechanics Spec</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1">
                <span className="font-mono text-[9px] font-black text-neutral-400 block uppercase">static</span>
                <span className="font-semibold text-neutral-700">No Cursor Physics</span>
                <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">Card stays entirely flat. Ideal for standard dashboards and passive forms.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1">
                <span className="font-mono text-[9px] font-black text-neutral-400 block uppercase">hover</span>
                <span className="font-semibold text-neutral-700">Shadow Offset Lift</span>
                <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">Card elevates by 2px and gains medium depth shadows on hover states.</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-neutral-200/50 space-y-1">
                <span className="font-mono text-[9px] font-black text-neutral-400 block uppercase">active</span>
                <span className="font-semibold text-neutral-700">Spring Press scale</span>
                <p className="text-[11px] text-neutral-500 leading-relaxed mt-1">Fires subtle elastic scale reduction down to 98% on pointer click events.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: KPI WIDGETS */}
      {(activeTab === 'all' || activeTab === 'widgets') && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Lucide.BarChart3 className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">6. KPI Metric Widgets Matrix</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">DSStatWidget Spec</span>
          </div>

          <p className="text-xs text-neutral-500">
            Auditing throughput, delay statistics, and queue volumes. The stat widget can automatically resolve trends and render appropriate layout borders.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <DSStatWidget
              title="neutral throughput"
              value="142 units"
              subtitle="Standard daily quota pace"
              variant="neutral"
              iconName="vehicle"
              trend={{ value: "+2.1% today", direction: 'up' }}
            />
            <DSStatWidget
              title="primary queue"
              value="18 vehicles"
              subtitle="Registered and queued in staging"
              variant="primary"
              iconName="status"
              trend={{ value: "+4.5% vs yesterday", direction: 'up' }}
            />
            <DSStatWidget
              title="success completed"
              value="34 repair sessions"
              subtitle="Ahead of planned floor metrics"
              variant="success"
              iconName="approval"
              trend={{ value: "KPI target green", direction: 'up' }}
            />
            <DSStatWidget
              title="warning holding"
              value="5 bays hold"
              subtitle="Awaiting client parts verification"
              variant="warning"
              iconName="parts"
              trend={{ value: "-1.0% change", direction: 'down' }}
            />
            <DSStatWidget
              title="at-risk timer"
              value="4 vehicles"
              subtitle="Promised slot buffer under 30m"
              variant="risk"
              iconName="timer"
              trend={{ value: "SLA attention required", direction: 'neutral' }}
            />
            <DSStatWidget
              title="critical delay"
              value="3 critical locks"
              subtitle="Bays obstructed on core diagnostic"
              variant="critical"
              iconName="alert"
              trend={{ value: "Warning state", direction: 'down' }}
            />
            <DSStatWidget
              title="severe delay"
              value="1 bay stuck"
              subtitle="Diagnostic lockout over 2 hours"
              variant="critical-over-2h"
              iconName="alert"
              trend={{ value: "Urgent dispatch", direction: 'neutral' }}
            />
            <DSStatWidget
              title="clickable demo"
              value="Click Me"
              subtitle="Lifts on hover and registers clicks"
              variant="primary"
              iconName="status"
              onClick={() => alert("KPI spec click registered successfully")}
            />
          </div>
        </div>
      )}

      {/* SECTION 7: INTERACTIVE SPEC PLAYGROUND / LAB */}
      {(activeTab === 'all' || activeTab === 'interactive') && (
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Lucide.Zap className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">⚡ Interactive Specification Playground</h3>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">Live sandbox</span>
          </div>

          <p className="text-xs text-neutral-500">
            Customize props dynamically to test alignments, padding constraints, layout overflow, and container sizing on simulated hardware devices.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Interactive controls */}
            <div className="lg:col-span-1 bg-neutral-50 p-4 rounded-xl border border-neutral-200/60 space-y-4">
              <h4 className="text-[11px] font-mono font-black text-neutral-400 uppercase pb-2 border-b">Sandbox Parameters</h4>
              
              {/* Button controllers */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-600 block mb-1">Button Variant</label>
                  <select 
                    value={btnVariant} 
                    onChange={(e) => setBtnVariant(e.target.value as any)}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-2 font-mono font-bold text-neutral-700 outline-none"
                  >
                    <option value="primary">primary</option>
                    <option value="secondary">secondary</option>
                    <option value="danger">danger</option>
                    <option value="ghost">ghost</option>
                    <option value="glass">glass</option>
                    <option value="accent">accent</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-600 block mb-1">Button Size</label>
                    <select 
                      value={btnSize} 
                      onChange={(e) => setBtnSize(e.target.value as any)}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2 font-mono font-bold text-neutral-700 outline-none"
                    >
                      <option value="sm">sm</option>
                      <option value="md">md</option>
                      <option value="lg">lg</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-neutral-600 block mb-1">Button Icon</label>
                    <select 
                      value={btnIcon} 
                      onChange={(e) => setBtnIcon(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2 font-mono font-bold text-neutral-700 outline-none"
                    >
                      <option value="vehicle">vehicle (Car)</option>
                      <option value="alert">alert (Triangle)</option>
                      <option value="timer">timer (Clock)</option>
                      <option value="parts">parts (Wrench)</option>
                      <option value="approval">approval (Check)</option>
                      <option value="bay">bay (Grid)</option>
                      <option value="mechanic">mechanic (User)</option>
                      <option value="status">status (Activity)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-600 block mb-1">Icon Position</label>
                    <select 
                      value={btnIconPos} 
                      onChange={(e) => setBtnIconPos(e.target.value as any)}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2 font-mono font-bold text-neutral-700 outline-none"
                    >
                      <option value="left">left</option>
                      <option value="right">right</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-neutral-600 block mb-1">Label Text</label>
                    <input 
                      type="text"
                      value={btnText}
                      onChange={(e) => setBtnText(e.target.value)}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-2 font-bold text-neutral-700 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t">
                  <label className="flex items-center gap-2 font-bold text-neutral-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={btnDisabled} 
                      onChange={(e) => setBtnDisabled(e.target.checked)} 
                    />
                    <span>disabled state</span>
                  </label>
                  <label className="flex items-center gap-2 font-bold text-neutral-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={btnIsLoading} 
                      onChange={(e) => setBtnIsLoading(e.target.checked)} 
                    />
                    <span>isLoading state</span>
                  </label>
                </div>
              </div>

              {/* Progress controller */}
              <div className="space-y-3 text-xs pt-3 border-t">
                <h5 className="font-mono font-black text-neutral-400 uppercase tracking-wide">SLA PROGRESS SLIDERS</h5>
                
                <div>
                  <div className="flex items-center justify-between text-neutral-600 font-bold mb-1">
                    <span>Elapsed Time:</span>
                    <span>{slaElapsed}m</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={slaTotal}
                    value={slaElapsed} 
                    onChange={(e) => setSlaElapsed(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-600 block mb-1">Warning %</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      value={slaWarning} 
                      onChange={(e) => setSlaWarning(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 font-bold text-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-600 block mb-1">Critical %</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100"
                      value={slaCritical} 
                      onChange={(e) => setSlaCritical(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 font-bold text-neutral-700"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 font-bold text-neutral-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={slaStripes} 
                    onChange={(e) => setSlaStripes(e.target.checked)} 
                  />
                  <span>Animate stripes</span>
                </label>
              </div>

            </div>

            {/* Sandbox Live renders */}
            <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
              
              <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-200/60 space-y-5 flex-1 flex flex-col justify-center">
                <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wide mb-2">Live Output Container</h4>
                
                {/* Live Button Output */}
                <div className="bg-white p-6 rounded-lg border border-neutral-200 flex flex-col items-center justify-center gap-3">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Rendered DSButton</span>
                  <DSButton 
                    variant={btnVariant}
                    size={btnSize}
                    isLoading={btnIsLoading}
                    icon={btnIcon as any}
                    iconPosition={btnIconPos}
                    disabled={btnDisabled}
                    onClick={toggleLoading}
                  >
                    {btnText}
                  </DSButton>
                  <p className="text-[10px] text-neutral-400 font-mono text-center">
                    Click custom button to trigger temporary 1.5s loading state.
                  </p>
                </div>

                {/* Live Progress Bar Output */}
                <div className="bg-white p-6 rounded-lg border border-neutral-200 space-y-3">
                  <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider block">Rendered DSSlaProgressBar</span>
                  <DSSlaProgressBar 
                    elapsed={slaElapsed}
                    total={slaTotal}
                    warningThreshold={slaWarning}
                    criticalThreshold={slaCritical}
                    animateStripes={slaStripes}
                  />
                  <div className="flex flex-wrap gap-2 pt-2 border-t text-[10px] font-mono text-neutral-400">
                    <span>Warning: &gt;={slaWarning}% ({Math.round(slaTotal * slaWarning / 100)}m)</span>
                    <span className="mx-1">|</span>
                    <span>Critical: &gt;={slaCritical}% ({Math.round(slaTotal * slaCritical / 100)}m)</span>
                  </div>
                </div>

              </div>

              {/* Code output blocks */}
              <div className="bg-neutral-900 rounded-xl p-4 text-white font-mono text-xs space-y-2 border border-neutral-800">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-neutral-400 text-[10px] font-black">
                  <span>DYNAMIC REACT JSX INVOCATIONS</span>
                  <span className="text-teal-400">spec-code.tsx</span>
                </div>
                <div className="text-[10px] text-neutral-300 leading-normal space-y-2.5 overflow-x-auto">
                  <div>
                    <span className="text-neutral-500 font-bold block">// Button invocation snippet</span>
                    <code>
                      {`<DSButton variant="${btnVariant}" size="${btnSize}"`}
                      {btnIsLoading ? ' isLoading={true}' : ''}
                      {btnIcon ? ` icon="${btnIcon}"` : ''}
                      {btnIconPos !== 'left' ? ` iconPosition="${btnIconPos}"` : ''}
                      {btnDisabled ? ' disabled={true}' : ''}
                      {`>\n  ${btnText}\n</DSButton>`}
                    </code>
                  </div>
                  <div className="pt-2 border-t border-neutral-800">
                    <span className="text-neutral-500 font-bold block">// SLA progress bar invocation snippet</span>
                    <code>
                      {`<DSSlaProgressBar \n  elapsed={${slaElapsed}} \n  total={${slaTotal}} \n  warningThreshold={${slaWarning}} \n  criticalThreshold={${slaCritical}} \n  animateStripes={${slaStripes}} \n/>`}
                    </code>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SECTION 7: LIVE BAYS & MANAGER KPI CARDS */}
      {(activeTab === 'all' || activeTab === 'bay_dashboard_cards') && (
        <div className="space-y-8">
          
          {/* A. MANAGER DASHBOARD KPI CARDS SPEC */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Lucide.LayoutDashboard className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">Manager Dashboard KPI Cards Spec</h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 font-bold">5 State Matrix</span>
            </div>

            <p className="text-xs text-neutral-500 max-w-4xl leading-relaxed">
              These low-fidelity indicators act as live telemetry displays on the manager’s command console. When values are within safe boundaries, they remain in a clean, desaturated gray state. If a threshold is crossed or critical issues occur (e.g. at-risk dispatches, blocked bays), they automatically transition to specialized alert status colors.
            </p>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono font-black text-neutral-400 uppercase tracking-wider">Interactive Live KPI Cards Showcase</h4>
                <div className="text-[9px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50 font-mono">Dynamic State Representation</div>
              </div>

              {/* Grid of live dashboard KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Active Vehicles', val: 5, prefix: 'ON FLOOR', theme: 'bg-primary-50/50 border-primary-200 text-primary-700', isTriggered: true },
                  { label: 'At-Risk Vehicles', val: 2, prefix: 'DISPATCH RISK', theme: 'bg-risk-50 border-risk-200 text-risk-700', isTriggered: true },
                  { label: 'Blocked Bays', val: 1, prefix: 'REPAIR HALT', theme: 'bg-critical-50 border-critical-250 text-critical-700', isTriggered: true },
                  { label: 'Waiting Approvals', val: 3, prefix: 'QUOTES OUT', theme: 'bg-warning-50 border-warning-200 text-warning-700', isTriggered: true },
                  { label: 'Waiting Parts', val: 4, prefix: 'LANE OUTAGE', theme: 'bg-neutral-50 border-neutral-200 text-neutral-600', isTriggered: false }
                ].map((kpi, kIdx) => {
                  const cardClass = kpi.isTriggered 
                    ? kpi.theme 
                    : 'bg-white border-neutral-200 text-neutral-500';

                  return (
                    <div 
                      key={kIdx}
                      className={`border-2 p-4 rounded-xl flex flex-col justify-between transition-all duration-150 shadow-xs ${cardClass}`}
                    >
                      <div>
                        <span className={`text-[9px] uppercase font-mono font-bold tracking-wider ${kpi.isTriggered ? 'opacity-90' : 'text-neutral-400'}`}>
                          {kpi.prefix}
                        </span>
                        <h3 className="text-xs font-bold uppercase tracking-tight mt-1 text-neutral-800">
                          {kpi.label}
                        </h3>
                      </div>
                      <div className="flex items-baseline justify-between pt-5 mt-auto">
                        <span className="text-neutral-950 text-2xl md:text-3xl font-extrabold tracking-tight font-mono">
                          {String(kpi.val).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-60">UNITS</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Side-by-Side Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 p-4 rounded-xl border border-neutral-200/50">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-black text-neutral-400 uppercase">1. Passive state (Standard limit)</span>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
                    Uses desaturated grays (<code className="font-mono bg-white px-1 border rounded text-[10px]">border-neutral-200</code>) to maintain zero visual noise in standard operation.
                  </p>
                  <div className="bg-white border-2 border-neutral-200 p-3 rounded-xl flex justify-between items-center max-w-sm">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase">REPAIR HALT</span>
                      <h4 className="text-xs font-bold text-neutral-800">Blocked Bays</h4>
                    </div>
                    <span className="text-xl font-mono font-black text-neutral-900">00</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-black text-red-500 uppercase">2. Active Alert state (Alarm Triggered)</span>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
                    Instantly highlights in alert shades (<code className="font-mono bg-white px-1 border rounded text-[10px] text-red-600">bg-critical-50</code>) when resource blocks are detected.
                  </p>
                  <div className="bg-red-50/60 border-2 border-red-200 p-3 rounded-xl flex justify-between items-center max-w-sm text-red-700">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase">REPAIR HALT</span>
                      <h4 className="text-xs font-bold text-neutral-800">Blocked Bays</h4>
                    </div>
                    <span className="text-xl font-mono font-black text-red-950">03</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* B. WORKSHOP LIVE BAY ELEMENTS SPEC */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Lucide.Wrench className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-black text-neutral-800 tracking-wider uppercase">Live Workshop Bay Elements & States</h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 font-bold font-sans">Interactive Component Matrix</span>
            </div>

            <p className="text-xs text-neutral-500 max-w-4xl leading-relaxed">
              The <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-teal-700 font-bold">ServiceBayCard</code> is the core element of the vehicle repair pipeline. It handles drag-and-drop operations, dynamic SVG timing indicators, and responds to 7 distinct workflow states depending on repair approvals, logistics delays, or SLA milestones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* 1. Vacant State */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-neutral-400 uppercase">1. VACANT / FREE BAY</span>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded">Automatic</span>
                </div>
                <p className="text-[11px] text-neutral-500 min-h-[44px]">
                  Renders with a dashed layout. A specialized circular SVG timer displays the remaining auto-assign countdown.
                </p>
                <div className="border border-neutral-100 rounded-xl p-1 bg-neutral-50/50">
                  <ServiceBayCard
                    bay={{ id: 'b1', name: 'Service Bay 01', type: 'standard', currentCarId: null, becameFreeAt: '12:00' }}
                    car={null}
                    onSelectCar={() => {}}
                    onReleaseBay={() => {}}
                    onAssignCar={() => {}}
                    availableWaitlistCars={[
                      { id: 'c1', make: 'Mercedes', model: 'C63 AMG', year: 2021, plateNumber: 'W205-AMG', customerName: 'Marcus Vance', customerPhone: '555-0199', promisedTime: '15:30', promisedDateTime: '', overallStatus: 'healthy', currentBayId: null, jobs: [], approvalPending: false, approvalRequestedAt: null, approvalRequiredWork: null, approvalRequiredCost: null, approvalContactLogged: false, partsOnOrder: false }
                    ]}
                    currentTime="12:05"
                    secondsInMinute={30}
                    availableStagedCars={[]}
                  />
                </div>
              </div>

              {/* 2. Standard Active State */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-neutral-400 uppercase">2. IN-WORK (STANDARD)</span>
                  <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 border border-teal-100 rounded">60% Complete</span>
                </div>
                <p className="text-[11px] text-neutral-500 min-h-[44px]">
                  Renders standard solid borders and displays active service technician, task description, and a real-time progress bar.
                </p>
                <div className="border border-neutral-100 rounded-xl p-1 bg-neutral-50/50">
                  <ServiceBayCard
                    bay={{ id: 'b2', name: 'Service Bay 02', type: 'standard', currentCarId: 'c2', becameFreeAt: null }}
                    car={{
                      id: 'c2', make: 'Mercedes', model: 'E63 S AMG', year: 2022, plateNumber: 'W213-E63', customerName: 'John Doe', customerPhone: '555-1234', promisedTime: '16:00', promisedDateTime: '', overallStatus: 'healthy', currentBayId: 'b2',
                      jobs: [{ id: 'j1', title: 'Routine Maintenance & Oil Flush', durationMins: 60, elapsedMins: 36, status: 'in-progress', technicianName: 'Albert Wright', cost: 150 }],
                      approvalPending: false, approvalRequestedAt: null, approvalRequiredWork: null, approvalRequiredCost: null, approvalContactLogged: false, partsOnOrder: false
                    }}
                    onSelectCar={() => {}}
                    onReleaseBay={() => {}}
                    onAssignCar={() => {}}
                    currentTime="12:00"
                    availableStagedCars={[]}
                  />
                </div>
              </div>

              {/* 3. Waiting Approval State */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-neutral-400 uppercase">3. WAITING APPROVAL</span>
                  <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 border border-amber-100 rounded font-mono">Estimated</span>
                </div>
                <p className="text-[11px] text-neutral-500 min-h-[44px]">
                  Highlights with an amber label. Renders with an active "Call Customer for Auth" step suggested below.
                </p>
                <div className="border border-neutral-100 rounded-xl p-1 bg-neutral-50/50">
                  <ServiceBayCard
                    bay={{ id: 'b3', name: 'Service Bay 03', type: 'standard', currentCarId: 'c3', becameFreeAt: null }}
                    car={{
                      id: 'c3', make: 'Mercedes', model: 'A45 AMG', year: 2021, plateNumber: 'W177-A45', customerName: 'Sophia Lin', customerPhone: '555-8833', promisedTime: '17:00', promisedDateTime: '', overallStatus: 'healthy', currentBayId: 'b3',
                      jobs: [{ id: 'j2', title: 'Front Brake Pads & Rotor Reface', durationMins: 45, elapsedMins: 0, status: 'pending', technicianName: 'Albert Wright', cost: 280 }],
                      approvalPending: true, approvalRequestedAt: '11:15', approvalRequiredWork: 'Rotors worn beyond minimum safety thickness spec', approvalRequiredCost: 280, approvalContactLogged: false, partsOnOrder: false
                    }}
                    onSelectCar={() => {}}
                    onReleaseBay={() => {}}
                    onAssignCar={() => {}}
                    currentTime="12:00"
                    availableStagedCars={[]}
                  />
                </div>
              </div>

              {/* 4. Waiting Parts State */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-neutral-400 uppercase">4. WAITING PARTS</span>
                  <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 border border-orange-100 rounded font-mono">ETA 14:30</span>
                </div>
                <p className="text-[11px] text-neutral-500 min-h-[44px]">
                  Displays expected delivery timeline prominently and suggests expediting or checking status on delayed freight.
                </p>
                <div className="border border-neutral-100 rounded-xl p-1 bg-neutral-50/50">
                  <ServiceBayCard
                    bay={{ id: 'b4', name: 'Service Bay 04', type: 'standard', currentCarId: 'c4', becameFreeAt: null }}
                    car={{
                      id: 'c4', make: 'Mercedes', model: 'GLC 43 SUV', year: 2020, plateNumber: 'X253-GLC', customerName: 'Robert Lang', customerPhone: '555-7721', promisedTime: '18:00', promisedDateTime: '', overallStatus: 'healthy', currentBayId: 'b4',
                      jobs: [{ id: 'j3', title: 'Suspension Air Spring Replacement', durationMins: 90, elapsedMins: 0, status: 'pending', technicianName: 'Albert Wright', cost: 450 }],
                      approvalPending: false, approvalRequestedAt: null, approvalRequiredWork: null, approvalRequiredCost: null, approvalContactLogged: false, partsOnOrder: true, partsExpectedTime: '14:30'
                    }}
                    onSelectCar={() => {}}
                    onReleaseBay={() => {}}
                    onAssignCar={() => {}}
                    currentTime="12:00"
                    availableStagedCars={[]}
                  />
                </div>
              </div>

              {/* 5. Blocked (Hold) State */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-neutral-400 uppercase">5. STANDARD BLOCKED</span>
                  <span className="text-[9px] font-bold text-amber-750 bg-amber-50 px-1.5 py-0.5 border border-amber-200 rounded font-mono">Hold Applied</span>
                </div>
                <p className="text-[11px] text-neutral-500 min-h-[44px]">
                  Renders with amber highlight borders and a warning banner. Used when an immediate query prevents progress.
                </p>
                <div className="border border-neutral-100 rounded-xl p-1 bg-neutral-50/50">
                  <ServiceBayCard
                    bay={{ id: 'b5', name: 'Service Bay 05', type: 'standard', currentCarId: 'c5', becameFreeAt: null }}
                    car={{
                      id: 'c5', make: 'Mercedes', model: 'AMG GT R Roadster', year: 2021, plateNumber: 'C190-GTR', customerName: 'Lewis Hamilton', customerPhone: '555-4422', promisedTime: '16:30', promisedDateTime: '', overallStatus: 'blocked', blockedAt: '11:30', currentBayId: 'b5',
                      jobs: [{ id: 'j4', title: 'Twin Turbo Wastegate Diagnostics', durationMins: 120, elapsedMins: 30, status: 'hold', technicianName: 'Master Tech Carl', cost: 800 }],
                      approvalPending: false, approvalRequestedAt: null, approvalRequiredWork: null, approvalRequiredCost: null, approvalContactLogged: false, partsOnOrder: false
                    }}
                    onSelectCar={() => {}}
                    onReleaseBay={() => {}}
                    onAssignCar={() => {}}
                    currentTime="12:00"
                    availableStagedCars={[]}
                  />
                </div>
              </div>

              {/* 6. Critical Blocked Over 2 Hours */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-red-600 uppercase animate-pulse">⚠️ 6. CRITICAL BLOCKED &gt; 2H</span>
                  <span className="text-[9px] font-bold text-red-100 bg-red-600 px-1.5 py-0.5 rounded animate-pulse font-mono">SLA Breach</span>
                </div>
                <p className="text-[11px] text-neutral-500 min-h-[44px]">
                  Flashing red border with double width. Used for bay outages where a car is stuck for more than 2 hours.
                </p>
                <div className="border border-neutral-100 rounded-xl p-1 bg-neutral-50/50">
                  <ServiceBayCard
                    bay={{ id: 'b6', name: 'Service Bay 06', type: 'standard', currentCarId: 'c6', becameFreeAt: null }}
                    car={{
                      id: 'c6', make: 'Mercedes', model: 'S65 V12 Biturbo', year: 2019, plateNumber: 'W222-S65', customerName: 'Arthur Dent', customerPhone: '555-4242', promisedTime: '14:30', promisedDateTime: '', overallStatus: 'blocked', blockedAt: '09:00', currentBayId: 'b6',
                      jobs: [{ id: 'j5', title: 'V12 Fuel Rail Pressure Leak Search', durationMins: 180, elapsedMins: 180, status: 'hold', technicianName: 'Master Tech Carl', cost: 1200 }],
                      approvalPending: false, approvalRequestedAt: null, approvalRequiredWork: null, approvalRequiredCost: null, approvalContactLogged: false, partsOnOrder: false
                    }}
                    onSelectCar={() => {}}
                    onReleaseBay={() => {}}
                    onAssignCar={() => {}}
                    currentTime="12:00"
                    availableStagedCars={[]}
                  />
                </div>
              </div>

              {/* 7. At-Risk State */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-neutral-400 uppercase">7. AT-RISK SCHEDULE</span>
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 border border-rose-200 rounded font-mono">Time Overdue</span>
                </div>
                <p className="text-[11px] text-neutral-500 min-h-[44px]">
                  Renders warm sand backgrounds and warning text indicating how far behind schedule the active repair is.
                </p>
                <div className="border border-neutral-100 rounded-xl p-1 bg-neutral-50/50">
                  <ServiceBayCard
                    bay={{ id: 'b7', name: 'Service Bay 07', type: 'standard', currentCarId: 'c7', becameFreeAt: null }}
                    car={{
                      id: 'c7', make: 'Mercedes', model: 'G63 AMG G-Wagon', year: 2022, plateNumber: 'W463-G63', customerName: 'Zaphod Beeblebrox', customerPhone: '555-8811', promisedTime: '11:30', promisedDateTime: '', overallStatus: 'at-risk', currentBayId: 'b7',
                      jobs: [{ id: 'j6', title: 'Steering Stabilizer Damper Install', durationMins: 60, elapsedMins: 55, status: 'in-progress', technicianName: 'Master Tech Carl', cost: 350 }],
                      approvalPending: false, approvalRequestedAt: null, approvalRequiredWork: null, approvalRequiredCost: null, approvalContactLogged: false, partsOnOrder: false
                    }}
                    onSelectCar={() => {}}
                    onReleaseBay={() => {}}
                    onAssignCar={() => {}}
                    currentTime="12:00"
                    availableStagedCars={[]}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
