# CrisisOS — Build Progress

## Phase 1: Project Foundation
**Status:** Complete
**Date:** 2026-04-28

### What was built

#### 1. Project Scaffold
- Initialized Vite + React 18 project with ES modules
- Installed Tailwind CSS v3, PostCSS, Autoprefixer, `@vitejs/plugin-react`
- Configured `vite.config.js` and `postcss.config.js`

#### 2. Tailwind Dark Theme (`tailwind.config.js`)
Custom color palette registered as Tailwind tokens:
- `bg-primary` → `#0a0a0f`
- `bg-secondary` → `#111118`
- `accent-red` → `#ef4444`
- `accent-amber` → `#f59e0b`
- `accent-green` → `#22c55e`
- `accent-blue` → `#3b82f6`
- `text-primary` → `#f1f5f9`
- `text-secondary` → `#94a3b8`

Custom keyframes registered: `crisis-pulse`, `fade-in`, `scanning`.

#### 3. Global CSS (`src/index.css`)
- CSS variables for all palette colors + `--border-dim`, `--grid-line`
- Animated grid background (`.grid-bg`) — slow-drifting 48px grid lines
- `@keyframes crisis-pulse` — red glow box-shadow pulse on 2s loop
- `@keyframes fade-in` — opacity + translateY(6px) entrance
- `@keyframes scanning` — horizontal sweep for sensor reading bars
- Custom scrollbar styles — 4px, dark track, dim thumb
- Utility classes: `.glow-red/amber/green/blue`, `.panel`, `.border-dim`
- Inter font loaded via Google Fonts

#### 4. Main Layout (`src/App.jsx`)
Full-screen dark layout with three regions:

**Header bar (56px)**
- CrisisOS logo (red hex icon + glow text)
- Hotel name "Horizon Grand Hotel" centered
- Live clock updating every second (HH:MM:SS) + formatted date
- "ALL SYSTEMS NOMINAL" status badge in green (toggles to red crisis-pulse on alerts)

**Left Sidebar (280px)**
- 4-stat grid: Sensors Online, Staff Available, Guests Tracked, Active Alerts
- Tab switcher: Sensors / Staff
- Sensor rows: ID, type abbreviation, floor, status dot
- Staff rows: avatar initial, name, role color, available/dispatched badge
- Footer scanning bar with sweep animation

**Main Content (flex-1)**
- Floor selector buttons: Lobby, Floor 1–4, Roof
- Interactive floor map with sensor dots positioned by x/y %
- Hover tooltips showing sensor ID, type, zone
- Color-coded dots: green (active), red (alert), grey (offline)
- Legend and sensor count per floor

**Right Panel (320px)**
- LIVE badge with pulse indicator
- Agent status cards: SensorMonitor, ThreatAssessor, StaffCoordinator, EvacPlanner
- Scrollable log stream with timestamps, agent names color-coded, fade-in stagger
- Scenario trigger section showing both available scenarios

#### 5. Hotel Data (`src/data/hotelData.js`)
- **6 floors:** Lobby, Floor 1, Floor 2, Floor 3, Floor 4, Roof
- **12 staff members** with names, roles (Security, Medical, Manager, Concierge, Housekeeping), current floor, status
- **251 guests** programmatically generated and distributed across floors with room numbers
- **24 sensors** across all floors: smoke, motion, temperature, CO2 — each with x/y map coordinates and zone names
- **8 emergency exits** with floor, zone, coordinates, type (primary/secondary)
- **Evacuation routes** per floor: primary and secondary paths to ground

#### 6. Crisis Scenarios (`src/data/crisisScenarios.js`)

**Scenario 1 — Kitchen Fire, Floor 3 East Wing**
9 timeline events from T+0s to T+90s:
- T+0: Temperature spike 187°C in east wing kitchen
- T+3: Escalation to 312°C — thermal runaway
- T+6: Smoke detector triggered, density 0.78
- T+10: Motion surge in corridor, 14 persons detected
- T+15: Smoke reaches rooms 308–315
- T+25: Guest SOS from Room 312
- T+40: CO₂ at 4200 ppm — oxygen depletion risk
- T+60: CCTV detects crowd bottleneck at north stairwell
- T+90: Heat migration to Floor 4 via ventilation

**Scenario 2 — Crowd Surge, Lobby**
7 timeline events from T+0s to T+60s:
- T+0: Unusual crowd density at reception (38 persons)
- T+5: 74 persons in main entrance zone
- T+12: CO₂ rising in lobby bar — 1800 ppm
- T+20: CCTV detects crowd compression, crush risk
- T+30: Staff SOS — guest collapsed in crowd
- T+45: Surge migrating to Floor 1 stairwell
- T+60: CCTV confirms stairwell congestion

### Build Output
- Production build: 159 KB JS (50 KB gzip), 15 KB CSS (4 KB gzip)
- Dev server: `npm run dev` → `http://localhost:5173`
- Zero compilation errors or warnings

---

## Phase 2: Interactive Hotel Floor Map
**Status:** Complete
**Date:** 2026-04-28

### What was built

#### `src/components/FloorMap/FloorMap.jsx` (~430 lines)

**SVG floor layouts (800×480 viewBox):**
- `makeStandardFloor(n)` — generates Floor 1–4: stairwells A/B, elevator bank, 20 rooms (5 NW/NE/SW/SE), central corridor
- Lobby — named zones: Grand Ballroom, Reception, Lobby Lounge, Bar Lounge, Concierge, Service, WC, Main Entrance + corridor
- Roof — HVAC units A/B, circular helipad (H marker), Roof Access hatch, Solar Array, Water Tank
- All floors: dark navy fills, cyan/blue stroke outlines, command-centre aesthetic

**Guest dots (GuestDot):**
- 3.5px filled circles; status colors: white=safe, amber=moving, red=unaccounted, green=evacuated
- Deterministic positions via `hash(id, seed)` within correct wing/zone
- When `isEvacuating=true`, dots transition smoothly (CSS `cx/cy 0.8s ease`) into corridor with randomised status distribution

**Sensor diamonds (SensorDiamond):**
- Diamond `<polygon>` at sensor x/y% mapped to SVG coords
- Colors: green=active, amber=elevated, red=alert, grey=offline
- Alert sensors: animated outer pulse ring + SVG `glow-red` filter
- Hover scales diamond; SVG tooltip shows ID, type, zone, simulated reading, status

**Staff dots (StaffDot):**
- 9px circles with 2-letter role initials; border color = status (blue=available, amber=dispatched, red=on-scene)
- Hover scales + SVG tooltip shows name, role, status

**Emergency exits (ExitArrow):**
- Chevron arrows (`<path>`) at floor edges pointing left/right/up/down
- Label: EXIT A / EXIT B / HATCH
- When `isEvacuating=true`: `<animate>` pulses opacity 1→0.15→1 at 0.7s

**Evacuation route overlay (EvacuationOverlay):**
- Primary route: animated green dashed line across corridor with forward-pointing chevrons
- Secondary route: amber dashed line flowing in reverse
- Both use SVG `<animate>` on `strokeDashoffset` for continuous motion

**Crisis zone highlights:**
- East Wing / West Wing overlays: semi-transparent red fill + animated dashed red border + ⚠ HAZARD text
- Lobby: per-zone crisis overlay matched by label/id from `crisisZones` prop

**Floor status bar (FloorStatusBar):**
- One mini-button per floor: G (guests) / S (staff) / alert count
- Color-coded: blue=active floor, red=alert floor, muted=normal
- Clicking switches floor view

**Floor selector tabs:**
- LOBBY / F1–F4 / ROOF buttons; active = accent-blue; live counters (guests/staff/sensors) in header row

**App.jsx wiring:**
- Removed inline FloorMap; imports `FloorMap` from `./components/FloorMap/FloorMap.jsx`
- Passes `sensors={SENSORS}`, `guests={GUESTS}`, `staff={STAFF}`, `evacuationRoutes`, `crisisZones=[]`, `isEvacuating=false`

### Build Output
- Production build: 179 KB JS (55 KB gzip), 15 KB CSS (4 KB gzip)
- Zero compilation errors or warnings

---

## Phase 3: Sensor Monitoring & Crisis Simulation Engine
**Status:** Complete
**Date:** 2026-04-28

### What was built

#### 1. `src/hooks/useCrisisSimulation.js`
The simulation brain. Manages all real-time state via a 1-second `setInterval` tick.

**State managed:**
- `simulationStatus`: `'idle' | 'running' | 'crisis'`
- `elapsedSeconds`, `severityScore` (0–10), `evacuationActive`, `accountedGuests`
- `sensors`: live array with `currentValue`, `history[10]`, `sensorStatus`, `lastUpdated`
- `crisisEvents`, `agentLogs`, `incidentTimeline`, `dispatchedStaff`
- `flashRed`: brief boolean to trigger full-screen red overlay

**Simulation loop (tick):**
- Advances `elapsedSeconds`; checks scenario timeline for events due at current T
- On event: updates sensor reading + history, recalculates severity score
- Severity formula: `(highestContribution / 10) × compound` — compound multiplier adds 12% per additional signal type active within last 30 s
- Flash overlay fires when severity crosses 7 for the first time
- Evacuation auto-triggers at severity ≥ 4: `accountedGuests` drops 247 → 180 (in-transit drama) then climbs back to 247 over ~55 s; at T+75 all 4 "unaccounted" are found → 251
- Agent logs generated from `AGENT_TEMPLATES` per event type (SensorMonitor, ThreatAssessor, EvacPlanner, StaffCoordinator, CrisisOrchestrator)
- All mutable metadata stored in `useRef` (scenario, elapsed, triggered events set, evacuation start T) to avoid stale closures; state setters used for UI-visible values
- Sensor noise applied every tick for non-triggered sensors (±8% baseline fluctuation)

**Exposed functions:** `startSimulation(scenarioName)`, `resetSimulation()`, `triggerManualSOS(floor, room)`, `acknowledgeAlert(alertId)`

#### 2. `src/components/SensorGrid/SensorGrid.jsx`
Compact 24-sensor grid in the left sidebar (sensors tab).

- 6-column grid, each card ~44 px wide × ~74 px tall
- Per-card: SVG sensor icon (smoke cloud / thermometer / person / CO₂ ellipse), sensor ID, current value + unit, **SVG sparkline** (10-bar mini chart with opacity ramp), status badge (OK / ELV / CRT), last-updated label
- Status badge colours: green NORMAL, amber ELEVATED, red CRITICAL
- CRITICAL cards get `crisis-pulse` red border animation
- Clicking a card sets `selectedSensorId` highlight + jumps FloorMap to that floor
- Summary bar shows counts of CRITICAL / ELEVATED sensors

#### 3. `src/components/SeverityGauge/SeverityGauge.jsx`
270° SVG arc gauge, 0–10.

- Score zones: 0–3 green MONITORING, 4–6 amber ELEVATED, 7–8 red CRITICAL, 9–10 deep-red pulsing EMERGENCY
- Smooth needle animation via `requestAnimationFrame` easing (ease-in-out, 600 ms)
- Tick marks at 0, 2, 4, 6, 8, 10; SVG glow filter on fill arc
- Large numeric score (1 decimal) rendered in center with zone colour
- `crisis-pulse` class applied on EMERGENCY zone

#### 4. `src/components/AlertFeed/AlertFeed.jsx`
Live scrolling feed of triggered crisis events.

- Framer-motion `AnimatePresence` + `motion.div` — new entries slide in from top (y: -16 → 0, scale 0.97 → 1, 250 ms ease-out)
- Max 20 visible; auto-scrolls to newest entry
- Per-entry: HH:MM:SS timestamp, SVG type icon, severity pill (CRITICAL/HIGH/MEDIUM/LOW colour-coded), floor badge, zone text, message body
- Acknowledged events rendered at 45% opacity
- Empty state with placeholder until first scenario runs

#### 5. `src/App.jsx` — full rewire
- `useCrisisSimulation()` is the single source of truth for all live data
- `Sidebar` now receives live `sensors` from simulation; sensor tab renders `SensorGrid`
- Stats row live-bound: Sensors Online, Staff Available, **Guests Accounted** (colour shifts amber when < 251), Active Alerts
- Header shows `T+HH:MM:SS` elapsed timer and toggles `CRISIS ACTIVE` badge
- `FloorMap` receives live sensors, `crisisZones` derived from active events on the current floor (East/West wing strings for standard floors; lobby zone ids for lobby), `isEvacuating` flag, synced `activeFloor`
- `FloorMap` patched: added `onFloorChange` prop + `changeFloor` helper so sensor-click can jump map floor
- Right panel replaced by `RightPanel`: SeverityGauge → agent status grid → tab switcher (ALERTS/AGENTS) → AlertFeed or agent log stream → scenario picker + RESET controls
- Full-screen red flash overlay: radial gradient div with `flash-in` CSS keyframe, rendered for ~900 ms when severity crosses 7
- `TRIGGER SIMULATION →` button opens scenario picker; RESET returns to idle

#### 6. `framer-motion` dependency added (v12.38.0)

### Build Output
- Production build: 333 KB JS (106 KB gzip), 17 KB CSS (4.4 KB gzip)
- Zero compilation errors or warnings
