# Multi-Bay Car Service Centre — Workflow Clarity & Operational Blueprint

This document details the layout, information hierarchy, and decision-support mechanisms of the desensitized, low-fidelity operational wireframes designed for the Centre Manager. It details how the 12 key boards turn messy floor operations into a coordinated workshop flow.

---

## PAGE 02 — OPERATIONAL COMMAND CENTER (DASHBOARD)
The Dashboard provides the starting point for daily manager navigation. It serves as a real-time monitor to answer: *What is happening now? Which bays are blocked? Which actions require immediate attention?*

### 1. Layout & Grid Setup
* **Structure**: Tri-column layout with a prominent header, top KPI strip, central workspace, and a right-hand risk escalation panel.
* **Header**: Large 24px mono Title with a persistent simulated clock (`HH:MM`).
* **KPI Strip (Top)**: Five equally spaced status cards displaying count markers for Active Vehicles, At-Risk Vehicles, Blocked Bays, Waiting Approvals, and Waiting Parts.
* **Workspace (Center Left)**: Divided into 8 block compartments representing the service bays (4x2 grid) alongside horizontal blocks for alignment and washing.
* **Escalations Panel (Right)**: Pinned 1/3-width vertical pane for high-priority alerts and suggested dispatch recommendations card stacks.
* **Queue Strips (Bottom)**: Horizontal container blocks showing active pipelines.

### 2. Information Hierarchy
1. **Primary Focus**: Status of the 8 bays. Is work moving or is a slot dead?
2. **Secondary Focus**: The next immediate operational bottlenecks. Are customer quotes aging out?
3. **Tertiary Focus**: Vehicles parked in wait patterns without bay allocation.

### 3. Decision Support & Actions
* **Spotting Bottlenecks**: High-contrast, heavy borders indicate a bay is `BLOCKED` due to approvals or parts delay.
* **Auto-Dispatch**: Suggested action cards outline the best move (e.g., *"Bay 5 is vacant; assign Swift TN-09"* or *"ALN-01 is free; pull Honda City"*). Clicking dispatch acts on the state directly.

---

## PAGE 03 — VEHICLE OPERATIONS BOARD
A card-based operational monitoring screen centering wholly on the tracked vehicle inventory.

### 1. Layout & Grid Setup
* **List Workspace**: Multi-column responsive flex grid displaying cards for all tracked vehicles in the system.
* **Top Ribbon**: Five status tab filters: All (Total), At Risk, Waiting Approval, Waiting Parts, Completed.
* **Sorting Toolbar**: Inline selectors to arrange cards by *Dispatch time*, *Risk level*, or *Work progression (%)*.

### 2. Information Hierarchy
Within each vehicle card:
* **Row 1**: Large, heavy font for registration number and current location indicator.
* **Row 2**: Dispatch Commitment (e.g. `Promised Time: 17:00`) alongside active overall operational status text.
* **Row 3**: Service job timeline summary (e.g. *"AC compressor servicing"* or *"Periodic lube inspect"*).
* **Row 4**: Progress tracker progress bar indicating elapsed vs. total expected service time.
* **Row 5**: Assigned field staff technician name and current bay placeholder.

### 3. Decision Support & Actions
* Hover states highlight cards to enable one-click access into deep details.
* The tab filters instantly weed out normally progressing cars, showing only units requiring manager intervention.

---

## PAGE 04 — VEHICLE DETAIL PAGE
A clean workspace designed for thorough operational diagnosis of a single vehicle's lifecycle, blockers, and dependencies.

### 1. Layout & Grid Setup
* **Two-Column Split**: 
  * Left Column: Vehicle Overview + Interactive Job Progress timeline tracker.
  * Right Column: Blocking log, Active Approval requests, and Parts eta.

### 2. Information Hierarchy
1. **Vehicle Header**: Heavy display fonts for Brand, Model, Plate, Customer Contact, and commitments.
2. **Milestone Tracker (Timeline)**: Grayscale linear chart displaying six operational steps: *Listed → Assigned → In Progress → Waiting Approval → Waiting Part → Completed*. Completed steps use neutral fills, active steps have inverse text, and blocked steps use dashed borders.
3. **Job Specification List**: Grid displaying individual tasks, progress values, assigned technician, and individual status fields.
4. **Impact Blocks**: Prominent alerts detailing extra customer costs, order descriptions, or age duration in statuses.

### 3. Decision Support & Actions
* Allows deep state overrides: manual reassignment of technician, approval state adjustments, and direct trigger actions for parts arrival to immediately update the master database.

---

## PAGE 05 — BAY MANAGEMENT BOARD
A specialized panel centered exclusively on workshop capacity, bay utilization, and physical workspace layout.

### 1. Layout & Grid Setup
* **Responsive Grid Layout**: 8 large grid blocks representing bays, split according to bay design types (Standard, Diagnostics, Heavy, Fast-track).
* **Upper Ribbon Controls**: Toggle filters: *All Bays*, *Free Bays*, *Occupied Bays*, *Blocked Bays*.

### 2. Information Hierarchy
* **Bay Identity**: Displayed in heavy mono font alongside type characteristics.
* **State Metrics**: Active vehicle registration number, assigned technician name, time in bay clock tracker, and active task progress.
* **Utilization Status Badge**: Free (no borders), Occupied (neutral borders), Blocked (heavy black border with alert icons).

### 3. Decision Support
* **Capacity Tracking**: Visualizes which bays are being blocked by vehicles waiting for parts or approvals.
* **Reassignment Dispatch**: Direct controls on each bay card allow the manager to release the bay or transfer the vehicle back to waitlists to free up physical space.

---

## PAGE 06 — APPROVAL CENTER
A Kanban-style triage board focused on preventing approval delay bottlenecks from stalling bay throughput.

### 1. Layout & Grid Setup
* **Kanban Columns**: Four vertical dropzones:
  1. *Newly Requested*: Discovered supplemental repairs requiring quotes.
  2. *Waiting Response*: Contact made, awaiting final customer auth.
  3. *Escalated*: Overdue thresholds exceeded, requiring manager call.
  4. *Approved*: Quotes signed off, ready to merge into shop timeline.

### 2. Information Hierarchy
* **Card Details**: Plate, customer cell, additional discovered repairs and cost estimates, and exact request time.
* **Aging Indicators**: A calculated "Waiting Duration" timer showing how long the vehicle has spent stalled waiting for authorization.

### 3. Workflow Clarity
* Prevents cars from sitting in service bays while managers forget to chase clients for job approval.
* Provides quick actions to log contacts, override approvals, or officially decline work to get the repair rolling.

---

## PAGE 07 — PARTS DEPENDENCY CENTER
A dedicated board designed to manage logistics backlogs.

### 1. Layout & Grid Setup
* **Tabular Categories**: Quadrant layout of lists:
  * *Waiting Parts*: Orders awaiting processing.
  * *Ordered*: Active transits on the road.
  * *Arriving Today*: Checked into local warehouses, close to site.
  * *Delayed*: Sourced supplier backlogs.

### 2. Information Hierarchy
* **Parts Card**: Vehicle info, required OEM component description, ETA countdown timer, affected diagnostic jobs, and dispatch commitment hazard risk warnings.
* **Top Metric Bar**: Operational impact summary displaying overall active parts delay count and total blocked hours.

### 3. Decision Support
* Allows parts technicians and managers to view exactly which arrivals will unblock the most bays instantly.

---

## PAGE 08 — ALIGNMENT QUEUE
A dedicated dashboard interface to manage the workshop's highly requested, single wheel-alignment resource rig.

### 1. Layout & Grid Setup
* **Dual Section Split**:
  * Left: Active alignment bay occupant card.
  * Right: Scrollable vertical list showing lined-up waiting vehicles.
* **Header Indicators**: Labeled Metrics display (e.g. *Vehicles Waiting*, *Average Wait Time*).

### 2. Information Hierarchy
1. **Active Rig Slot**: Displays the car currently on the alignment elevator, starting time, and real-time completion countdown.
2. **Timeline Queue**: Sequential listing of upcoming vehicles with corresponding plate, wait times, and dispatch deadline alerts.

### 3. Workflow Clarity & Power Actions
* **Reordering controls**: Simple UP/DOWN button controls on waitlist items allow manual swap scheduling to prioritize soon-to-be-late vehicles.

---

## PAGE 09 — WASH BAY QUEUE
A final-stage delivery dashboard to ensure completing final details aligns with promised client dispatch commitments.

### 1. Layout & Grid Setup
* **Functional Queue View**: Horizontal timeline flow displaying the sequence of vehicles currently prepped or waiting for cleaning.
* **Metrics Top-Bar**: Active counts of vehicles completed today vs. cars waiting in wash lane.

### 2. Information Hierarchy
* **Wash Card**: Registration plate number, wash level type (Standard Express vs. Full Detail), ETA values, and customer promised dispatch commitments.
* **Delay risks**: Visual warnings flag any vehicle whose wash cycle length exceeds its promised delivery threshold.

### 3. Workflow Clarity
* Provides prioritizers like "Pull Next" and "Rush Delivery" to jump urgent cars to the front of the wash bay.

---

## PAGE 10 — MECHANIC WORKLOAD VIEW
A workspace designed to balance human resources and prevent operational task fatigue.

### 1. Layout & Grid Setup
* **Resource Cards Layout3**: Centered catalog cards representing individual active garage and floor technicians.

### 2. Information Hierarchy
Within each technician profile:
* **Left section**: Name, level, and active workbay assignments.
* **Right section**: List of assigned active/pending service jobs.
* **Bottom metrics bar**: Allocation utilization percentages and status fields (Available, Heavily Assigned, Bottlenecked).

### 3. Decision Support
* Prevents scheduling bottlenecks by clearly showing which technicians have too many jobs, allowing fast reassignment placeholders.

---

## PAGE 11 — DAILY OPERATIONS REVIEW
An analytical dashboard detailing daily operational metrics to evaluate overall quality of throughput.

### 1. Layout & Grid Setup
* **Overview KPI Panel**: 6 major KPIs: *On-Time Dispatch Rate*, *Vehicles Completed*, *Missed Dispatches*, *Blocked Bay Time*, *Approval Delay Time*, and *Parts Delay Time*.
* **Tri-chart layout**: Grayscale SVG charts showing:
  1. Utilization rate trends.
  2. Delay breakdowns.
  3. Mechanic efficiency indices.

### 2. Workflow Clarity
* Evaluates why workshop throughput fell behind (e.g. *"Total approval delay hours: 8.5h"* vs. *"Total parts delay: 3.2h"*). This helps pinpoint future logistics upgrades.

---

## PAGE 12 — SYSTEM ALERTS & RISK CENTER
An operational risk radar page showing all active flags from a single dedicated dispatch board.

### 1. Layout & Grid Setup
* **Alarm Dashboard Panels**: Five alert columns grouped by severity and risk category:
  1. *At-Risk Vehicles* (Breaching schedules).
  2. *Blocked Bays* (Stagnated jobs).
  3. *Waiting Approvals* (Overdue customer quotes).
  4. *Parts Delays* (Supply chain jams).
  5. *Queue Bottlenecks* (Alignment/wash blockages).

### 3. Decision Support
* Each alert card outlines the severity level, affected vehicle, estimated timing impact, and recommended operational dispatch button to address the problem in one tap.

---
*Created by UX Design Lead · Multi-Bay Service Systems*
