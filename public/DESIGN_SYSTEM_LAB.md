# Workshop Design System Lab Specification

Welcome to the **Workshop Design System Lab Specification**. This document details the visual components, UI tokens, and interactive elements used in the vehicle repair pipeline dashboard.

---

## 🎨 1. Theme Tokens & Color Palette

Our interface utilizes a custom high-contrast, professional, diagnostic-ready palette. These values are mapped using standard Tailwind CSS classes.

### Neutral System
- **Background Slate**: `bg-neutral-50` (soft off-white for main layout canvas)
- **Deep Charcoal**: `text-neutral-900` (primary typography, major headings)
- **Border Grays**: `border-neutral-200/80` (thin, desaturated container separation)
- **Subtle Muted Labels**: `text-neutral-400` (mono metrics, non-interactive indicators)

### Status Tokens (Operational Contexts)
- **Healthy / In-Progress**: `bg-teal-50` | `border-teal-200` | `text-teal-700`
- **At-Risk / Warning**: `bg-risk-50` | `border-risk-200` | `text-risk-700`
- **Critical / Blocked**: `bg-critical-50` | `border-critical-250` | `text-critical-700`
- **Waiting Approval**: `bg-warning-50` | `border-warning-200` | `text-warning-700`

---

## 🕹️ 2. Interactive Navigation Components

The design system incorporates modular, responsive navigation tabs to switch views across the application.

- **Active State**: Marked by elevated border outlines, deep text colors, and bold weights.
- **Micro-Badges**: Inline text labels supporting count summaries.
- **Hover Transitions**: Smooth `transition-colors duration-150` for mouse navigation.

---

## 🏷️ 3. Badges Matrix

We define custom semantic labels to track repair stages, vehicle statuses, and Service Level Agreement (SLA) status levels.

| Badge Variant | Semantic Code | visual Specs |
|---|---|---|
| **Healthy** | `'healthy'` | Soft emerald tint with dark green tracking |
| **At-Risk** | `'at-risk'` | Yellow-orange background with amber highlights |
| **Critical**| `'critical'`| Deep warning crimson with double-thickness borders |
| **Blocked** | `'blocked'` | Textured charcoal/amber warning boundaries |
| **Completed**| `'completed'`| Elegant pure slate-gray check indicators |

---

## 🔘 4. Buttons Matrix

The application leverages custom-designed button components supporting six essential variants.

1. **Primary**: Prominent solid slate-black styling for core system triggers.
2. **Secondary**: Bordered light-gray container with dark labels for passive operations.
3. **Danger**: Bright crimson-tinted interaction trigger for irreversible releases.
4. **Ghost**: Borderless layout that integrates seamlessly with background textures.
5. **Glass**: Translucent backdrop blur element ideal for overlapping overlay modals.
6. **Accent**: Dynamic teal highlight variant reserved for quick-action workflows.

---

## 🚗 5. Live Bays & Workshop Elements

The core of the vehicle operations system is the `ServiceBayCard` element, which supports 7 distinct live workflow states:

1. **Vacant / Free Bay**:
   - *Behavior*: Renders with dashed borders and initiates an auto-assign circular SVG countdown timer.
2. **In-Work (Standard Progress)**:
   - *Behavior*: Renders active technician info, task details, and a real-time relative progress bar.
3. **Waiting Approval**:
   - *Behavior*: Displays an amber highlight asking for customer authorization.
4. **Waiting Parts**:
   - *Behavior*: Lists parts logistics delays with estimated delivery times.
5. **Standard Blocked (Hold Applied)**:
   - *Behavior*: Applies amber hold warnings to prevent technicians from proceeding.
6. **Critical Blocked (> 2 Hours)**:
   - *Behavior*: Flashing red double-width borders alerting manager of SLA breach.
7. **At-Risk Schedule**:
   - *Behavior*: Warm sand backgrounds highlighting that the vehicle is overdue relative to the promise time.

---

## 📊 6. Manager Dashboard KPI Cards

These indicators represent telemetry on the manager’s command console:

- **State Transition**: desaturated gray under normal operation, transitioning automatically into alert states when a threshold is exceeded.
- **Visual Structure**: Upper monospace section for status category, large dynamic counter value, and custom-styled lower labels.

---

## ⚡ 7. Interactive Lab Sandbox

A full reactive testbed containing:
- Live button modifiers (adjusting variant, sizes, states, and icon layouts).
- Interactive clicking counters with automatic theme shifting.
- Responsive container layouts for quick diagnostic validation.
