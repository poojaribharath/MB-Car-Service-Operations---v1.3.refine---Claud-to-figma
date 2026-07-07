import React from 'react';
import { motion } from 'motion/react';
import * as Lucide from 'lucide-react';
import { cn } from '../lib/utils';

// ==========================================
// 1. STYLE VARIABLES & COLOR TOKENS Map
// ==========================================

export const DS_COLORS = {
  neutral: {
    bg: 'bg-neutral-50/50',
    border: 'border-neutral-200',
    text: 'text-neutral-700',
    accent: 'text-neutral-500',
    iconBg: 'bg-neutral-100',
    iconText: 'text-neutral-600',
  },
  primary: {
    bg: 'bg-primary-50/40',
    border: 'border-primary-200',
    text: 'text-primary-800',
    accent: 'text-primary-600',
    iconBg: 'bg-primary-100/80',
    iconText: 'text-primary-700',
  },
  success: {
    bg: 'bg-success-50/50',
    border: 'border-success-100',
    text: 'text-success-700',
    accent: 'text-success-600',
    iconBg: 'bg-success-100',
    iconText: 'text-success-700',
  },
  warning: {
    bg: 'bg-warning-50/60',
    border: 'border-warning-200',
    text: 'text-warning-700',
    accent: 'text-warning-600',
    iconBg: 'bg-warning-100',
    iconText: 'text-warning-700',
  },
  risk: {
    bg: 'bg-risk-50/50',
    border: 'border-risk-200',
    text: 'text-risk-700',
    accent: 'text-risk-600',
    iconBg: 'bg-risk-100',
    iconText: 'text-risk-700',
  },
  critical: {
    bg: 'bg-critical-50/60',
    border: 'border-critical-200',
    text: 'text-critical-700',
    accent: 'text-critical-600',
    iconBg: 'bg-critical-100',
    iconText: 'text-critical-700',
  },
  'critical-over-2h': {
    bg: 'bg-red-50/80',
    border: 'border-red-500 border-2',
    text: 'text-red-900',
    accent: 'text-red-700',
    iconBg: 'bg-red-600',
    iconText: 'text-white',
  }
};

export type DSVariantType = keyof typeof DS_COLORS;

// ==========================================
// 2. DESIGN SYSTEM ICON REGISTRY
// ==========================================

export interface DSIconProps {
  name: keyof typeof Lucide.icons | 'vehicle' | 'alert' | 'timer' | 'parts' | 'approval' | 'bay' | 'mechanic' | 'status';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: DSVariantType;
  animate?: 'spin' | 'pulse' | 'float' | 'shake' | 'bounce' | 'none';
  className?: string;
  strokeWidth?: number;
}

const IconMap: Record<string, React.ComponentType<any>> = {
  vehicle: Lucide.Car,
  alert: Lucide.AlertTriangle,
  timer: Lucide.Clock,
  parts: Lucide.Wrench,
  approval: Lucide.CheckCircle2,
  bay: Lucide.LayoutGrid,
  mechanic: Lucide.User,
  status: Lucide.Activity,
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const animationClasses = {
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  float: 'animate-[bounce_2.5s_infinite]',
  shake: 'animate-shake',
  bounce: 'animate-bounce',
  none: '',
};

export const DSIcon: React.FC<DSIconProps> = ({
  name,
  size = 'md',
  variant,
  animate = 'none',
  className,
  strokeWidth = 2,
}) => {
  // Resolve component
  const Component = IconMap[name] || (Lucide as any)[name] || Lucide.HelpCircle;

  // Resolve color wrapper if variant is specified
  const colorClass = variant ? DS_COLORS[variant]?.iconText : '';

  return (
    <Component
      className={cn(
        iconSizes[size],
        animationClasses[animate],
        colorClass,
        className
      )}
      strokeWidth={strokeWidth}
    />
  );
};

// Elegant icon container with subtle circular or rounded frames
export interface DSIconFrameProps extends DSIconProps {
  frameShape?: 'circle' | 'square' | 'rounded';
  glow?: boolean;
}

export const DSIconFrame: React.FC<DSIconFrameProps> = ({
  name,
  size = 'md',
  variant = 'neutral',
  animate = 'none',
  frameShape = 'rounded',
  glow = false,
  className,
  strokeWidth = 2,
}) => {
  const styles = DS_COLORS[variant] || DS_COLORS.neutral;
  
  const frameShapes = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const frameSizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
    xl: 'p-4',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center transition-all duration-300',
        styles.iconBg,
        frameShapes[frameShape],
        frameSizes[size],
        glow && 'shadow-[0_0_12px_rgba(var(--color-primary-500),0.15)]',
        className
      )}
    >
      <DSIcon
        name={name}
        size={size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'}
        variant={variant}
        animate={animate}
        strokeWidth={strokeWidth}
      />
    </div>
  );
};

// ==========================================
// 3. REUSABLE STATUS BADGE COMPONENT
// ==========================================

export interface DSStatusBadgeProps {
  status: 'healthy' | 'at-risk' | 'critical' | 'blocked' | 'blocked-over-2h' | 'completed' | 'queued' | 'idle' | string;
  customLabel?: string;
  pulseDot?: boolean;
  className?: string;
}

export const DSStatusBadge: React.FC<DSStatusBadgeProps> = ({
  status,
  customLabel,
  pulseDot = false,
  className,
}) => {
  let label = customLabel || status.toUpperCase();
  let colorStyles = DS_COLORS.neutral;
  let textClass = 'text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border';
  let shouldPulse = false;
  let customBadgeStyle = '';

  switch (status.toLowerCase()) {
    case 'healthy':
    case 'completed':
    case 'success':
      colorStyles = DS_COLORS.success;
      label = customLabel || 'COMPLETED';
      break;
    case 'at-risk':
    case 'at_risk':
      colorStyles = DS_COLORS.risk;
      label = customLabel || 'AT RISK';
      break;
    case 'critical':
      colorStyles = DS_COLORS.critical;
      shouldPulse = true;
      break;
    case 'blocked-over-2h':
    case 'critical-over-2h':
    case 'bay blocked > 2hrs':
    case 'danger':
      colorStyles = DS_COLORS['critical-over-2h'];
      label = customLabel || '🚨 CRITICAL DELAY > 2HRS';
      customBadgeStyle = 'font-extrabold animate-pulse';
      shouldPulse = true;
      break;
    case 'blocked':
    case 'hold':
      colorStyles = DS_COLORS.warning;
      label = customLabel || 'BLOCKED';
      break;
    case 'queued':
    case 'in-progress':
    case 'in_progress':
    case 'in work':
      colorStyles = DS_COLORS.primary;
      label = customLabel || 'IN WORK';
      break;
    default:
      colorStyles = DS_COLORS.neutral;
      break;
  }

  return (
    <span
      className={cn(
        textClass,
        colorStyles.bg,
        colorStyles.border,
        colorStyles.text,
        customBadgeStyle,
        'inline-flex items-center gap-1.5 transition-all duration-300',
        className
      )}
    >
      {(pulseDot || shouldPulse) && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          status.includes('2h') || status === 'danger' ? "bg-red-700 animate-ping" : 
          status === 'critical' ? "bg-red-500 animate-ping" :
          status === 'healthy' || status === 'completed' ? "bg-emerald-500" : "bg-amber-500"
        )} />
      )}
      {label}
    </span>
  );
};

// ==========================================
// 4. REUSABLE VISUAL CARD CONTAINER
// ==========================================

export interface DSVisualCardProps {
  variant?: DSVariantType;
  interaction?: 'static' | 'hover' | 'active';
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export const DSVisualCard: React.FC<DSVisualCardProps> = ({
  variant = 'neutral',
  interaction = 'static',
  children,
  className,
  id,
  onClick,
}) => {
  const styles = DS_COLORS[variant] || DS_COLORS.neutral;

  const interactionClasses = {
    static: '',
    hover: 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
    active: 'active:scale-[0.98] cursor-pointer',
  };

  return (
    <motion.div
      id={id}
      onClick={onClick}
      layout="position"
      className={cn(
        'rounded-xl p-4 border transition-all duration-500 flex flex-col justify-between min-h-[140px] shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] bg-white',
        styles.border,
        interactionClasses[interaction],
        variant === 'critical-over-2h' && 'shadow-[0_0_15px_rgba(239,68,68,0.18)] ring-2 ring-red-500/10 bg-red-50/30',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

// ==========================================
// 5. MICRO-INTERACTIVE CTA BUTTON
// ==========================================

export interface DSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: keyof typeof Lucide.icons | 'vehicle' | 'alert' | 'timer' | 'parts' | 'approval' | 'bay' | 'mechanic';
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const DSButton: React.FC<DSButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  children,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-sans font-semibold rounded-lg transition-all duration-300 cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm border border-primary-700/50 hover:shadow-md hover:scale-[1.01]',
    secondary: 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200/90 shadow-xs',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-red-700/50 hover:shadow-md hover:scale-[1.01]',
    ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700',
    glass: 'bg-white/40 backdrop-blur-sm border border-white/20 hover:bg-white/60 text-neutral-800',
    accent: 'bg-neutral-900 hover:bg-neutral-950 text-white border border-neutral-950 shadow-sm'
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Lucide.Loader2 className="w-4 h-4 animate-spin text-current" />}
      {!isLoading && icon && iconPosition === 'left' && (
        <DSIcon name={icon} size={size === 'sm' ? 'xs' : 'sm'} className="text-current" />
      )}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && (
        <DSIcon name={icon} size={size === 'sm' ? 'xs' : 'sm'} className="text-current" />
      )}
    </button>
  );
};

// ==========================================
// 6. NUMERIC STAT / KPI WIDGET COMPONENT
// ==========================================

export interface DSStatWidgetProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: DSVariantType;
  iconName?: keyof typeof Lucide.icons | 'vehicle' | 'alert' | 'timer' | 'parts' | 'approval' | 'bay' | 'mechanic';
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  onClick?: () => void;
}

export const DSStatWidget: React.FC<DSStatWidgetProps> = ({
  id,
  title,
  value,
  subtitle,
  variant = 'neutral',
  iconName,
  trend,
  onClick,
}) => {
  const styles = DS_COLORS[variant] || DS_COLORS.neutral;
  const isClickable = !!onClick;

  return (
    <motion.div
      id={id}
      whileHover={isClickable ? { translateY: -2 } : undefined}
      onClick={onClick}
      className={cn(
        'p-4 bg-white rounded-xl border flex items-center justify-between transition-colors shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]',
        styles.border,
        isClickable ? 'cursor-pointer hover:bg-neutral-50/40 border-l-4' : '',
        variant !== 'neutral' && isClickable ? `border-l-${variant}-500` : '',
        variant === 'critical-over-2h' && 'border-l-red-600 bg-red-50/60 ring-1 ring-red-500/10'
      )}
    >
      <div className="space-y-1">
        <p className={cn(
          "text-[10px] font-mono font-bold tracking-wider uppercase",
          variant === 'critical-over-2h' ? 'text-red-700 animate-pulse' : 'text-neutral-400'
        )}>
          {title}
        </p>
        <h3 className={cn(
          "text-2xl font-bold font-mono tracking-tight",
          variant === 'critical-over-2h' ? 'text-red-700 font-extrabold' : 'text-neutral-900'
        )}>
          {value}
        </h3>
        
        {trend && (
          <div className="flex items-center gap-1">
            {trend.direction === 'up' ? (
              <Lucide.TrendingUp className="w-3.5 h-3.5 text-success-500" />
            ) : trend.direction === 'down' ? (
              <Lucide.TrendingDown className="w-3.5 h-3.5 text-critical-500" />
            ) : (
              <Lucide.Minus className="w-3.5 h-3.5 text-neutral-400" />
            )}
            <span className={cn(
              "text-[10px] font-mono font-bold",
              trend.direction === 'up' ? "text-success-600" :
              trend.direction === 'down' ? "text-critical-600" : "text-neutral-500"
            )}>
              {trend.value}
            </span>
          </div>
        )}

        {subtitle && !trend && (
          <p className="text-[11px] font-medium text-neutral-500 font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {iconName && (
        <DSIconFrame
          name={iconName}
          size="md"
          variant={variant}
          animate={variant === 'critical-over-2h' ? 'bounce' : 'none'}
          className={cn(
            variant === 'critical-over-2h' ? 'bg-red-200' : ''
          )}
        />
      )}
    </motion.div>
  );
};

// ==========================================
// 7. SLA THRESHOLD PROGRESS BAR
// ==========================================

export interface DSSlaProgressBarProps {
  elapsed: number;
  total: number;
  warningThreshold?: number; // percentage, e.g. 70
  criticalThreshold?: number; // percentage, e.g. 90
  animateStripes?: boolean;
  className?: string;
}

export const DSSlaProgressBar: React.FC<DSSlaProgressBarProps> = ({
  elapsed,
  total,
  warningThreshold = 75,
  criticalThreshold = 90,
  animateStripes = true,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  
  let barColor = 'bg-primary-500';
  let glowColor = 'shadow-[0_0_8px_rgba(20,184,166,0.2)]';
  
  if (percentage >= criticalThreshold) {
    barColor = 'bg-critical-500';
    glowColor = 'shadow-[0_0_12px_rgba(220,38,38,0.35)]';
  } else if (percentage >= warningThreshold) {
    barColor = 'bg-risk-500';
    glowColor = 'shadow-[0_0_10px_rgba(249,115,22,0.25)]';
  }

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
        <span>SLA Progress</span>
        <span className={cn(
          percentage >= criticalThreshold ? "text-critical-600 font-extrabold animate-pulse" :
          percentage >= warningThreshold ? "text-risk-600" : "text-primary-600"
        )}>
          {percentage}% ({elapsed}/{total}m)
        </span>
      </div>
      
      <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50 p-[1px]">
        <div
          style={{ width: `${percentage}%` }}
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden",
            barColor,
            glowColor
          )}
        >
          {animateStripes && percentage >= warningThreshold && (
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]" />
          )}
        </div>
      </div>
    </div>
  );
};
