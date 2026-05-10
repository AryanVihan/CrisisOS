# CrisisOS — AI-Powered Hotel Emergency Response Command Platform

> **From detection to full coordinated response in under 90 seconds.**

CrisisOS is a real-time, multi-agent AI situational awareness platform built for large-scale hospitality emergency management. It fuses live sensor telemetry, chained LLM reasoning, thermal imaging simulation, synthetic CCTV surveillance, voice announcements, and cross-device guest/staff coordination into a single command surface — compressing a traditionally 6-minute manual evacuation into a sub-90-second AI-orchestrated response.

Built as a full-stack demo system (Firebase Hosting + Cloud Functions), it showcases production-quality architecture across 33 React components, 3 sequential LLM agents, 24 virtual sensors, and 3 distinct user surfaces communicating in real time via BroadcastChannel pub/sub.

---

## The Problem It Solves

In a hotel emergency, every second counts. Traditional manual response chains suffer from:

- **Delayed detection**: Staff must physically identify and report incidents
- **Communication bottlenecks**: Coordinating 12+ staff roles across 6+ floors over radio
- **Guest accountability gaps**: No real-time check-in tracking for 250+ guests
- **First-responder briefing delays**: Dispatchers lack structured incident data on arrival

CrisisOS eliminates all four gaps simultaneously through automated detection, AI-driven coordination, real-time accountability, and a machine-generated first-responder JSON brief — all in under 90 seconds.

---

## Key Metrics

| Metric | Value |
|---|---|
| Emergency response time improvement | **6 minutes → under 90 seconds** |
| LLM agents orchestrated in sequence | **3** (Detection → Coordination → Emergency Bridge) |
| Virtual sensors monitored | **24** (temperature, smoke, CO2, motion across 6 floors) |
| Guest occupancy tracked | **251 guests** distributed across Lobby, Floors 1–4, Roof |
| Staff roles coordinated | **12** (Security, Medical, Manager, Concierge, Housekeeping) |
| React components | **33 JSX files** across **26 directories** |
| Custom React hooks | **3** (simulation loop, derived timeline, animated counter) |
| Service modules | **7** (agents, simBus, voice, risk predictor, thermal sim, connectivity, edge fallback) |
| Codebase size | **~3,000 lines** (src/ + functions/) |
| Thermal imaging cameras | **4** with **64×48 heat diffusion grids** |
| CCTV feeds | **4 synthetic canvas feeds** at **15 fps** |
| Simulation speed modes | **1×, 2×, 4×, 8×** |
| Distinct user surfaces | **3** (Command Center, Guest Mobile, Staff Mobile) |
| LLM model | **Gemini 2.0 Flash** |

---

## Feature Highlights

### Multi-Agent LLM Pipeline
Three specialized Gemini 2.0 Flash agents are chained sequentially, each consuming the previous agent's output:

1. **Detection & Analysis Agent** — Ingests raw sensor readings from 24 sensors and generates a structured incident assessment: incident type, exact location, spread pattern, immediate threats, and confidence level.
2. **Coordination & Response Agent** — Takes the detection report and produces a full operational plan: per-floor evacuation routing, named staff assignments, zone PA announcement text, and prioritized action list with estimated coordination time.
3. **Emergency Bridge Agent** — Combines both reports to produce a machine-readable JSON first-responder brief containing incident type, severity score (1–10), hazard list (temperatures, gas readings), blocked and clear access routes, recommended entry points, on-scene staff contacts, and special considerations (trapped occupants, mobility-limited guests).

All three agents call a secure Firebase Cloud Function backend, with graceful fallback to curated demo responses if the API is unavailable.

### Real-Time Sensor Telemetry
- 24 virtual sensors across 6 floors continuously report temperature (°C), smoke density (g/m³), CO2 concentration (ppm), and motion activity
- The simulation clock ticks every 1,000ms (adjustable via speed multiplier) and evolves sensor readings based on the crisis scenario timeline
- Sensor states are color-coded (nominal / elevated / critical) and displayed in the sidebar sensor list
- Compound severity scoring increases when multiple distinct threat types are active simultaneously

### Thermal Imaging System
- 4 virtual thermal cameras (Floor 3 Kitchen, Floor 3 East Wing, Floor 2 Common Area, Lobby)
- Each camera renders a **64×48 Float32Array grid** with per-tick heat diffusion simulation
- Fire origin cells reach 312°C; heat propagates to neighbors each frame
- False-color mapping renders blues (15°C) through reds (80°C+) on HTML Canvas at 10 fps
- Anomaly detection highlights the hottest cell and displays a live temperature readout

### Synthetic CCTV Surveillance
- 4-up 2×2 canvas-rendered CCTV grid with scanlines, film grain, REC indicator, timecode, and camera labels
- Bounding boxes populate dynamically based on severity level and evacuation state
- Vision-Agent sweep: a moving gradient bar visualizes the AI scanning feeds (activates at severity ≥ 4 or when evacuation is declared)
- Click any feed to expand to a full hero view with overlay metadata
- Auto-switches to Surveillance tab for 6 seconds when evacuation is first declared

### Risk Prediction Engine
- Continuous ambient risk scorer (0–100) running independent of the crisis timeline
- Factors in: temperature trends, humidity anomalies, CO2 baseline drift, peak occupancy hours (07:00–09:00, 18:00–21:00), floor density vs. capacity ratios, and prior incident history per floor
- Generates a pre-alert 5–60 seconds before the smoke trigger by injecting synthetic environmental signals
- Pre-alert auto-opens the Risk Monitor modal and highlights the header risk chip without user interaction

### Cross-Device Real-Time Sync
- All three surfaces (Command, Guest, Staff) communicate via `BroadcastChannel` API with `localStorage` fallback for older browsers and privacy modes
- Guest taps **SOS** → command dashboard raises alert instantly, no page refresh
- Guest taps **I'm Safe** → accountability counter decrements in the sidebar in real time
- Staff updates their status (En Route / On Scene) → reflected in the Dispatch Board instantly
- Sidebar QR code points to `/#/guest` so presenters can scan and demo live cross-tab sync

### Voice Announcement System
- FIFO queue prevents announcement overlap across milestones (fire detected → evacuation initiated → all guests accounted)
- Three priority profiles: normal, calm, and critical — each with distinct rate, pitch, and volume settings
- Auto-selects the best available English voice when `voiceschanged` fires; falls back to system default
- Mute toggle persisted to `localStorage` across sessions
- Observer pattern notifies `VoicePanel` and `ZoneCommunications` equalizer animations of speaking state

### Interactive Floor Visualization
- 2D floor map with room-level annotations, sensor markers, evacuation route overlays, and staff position indicators
- 3D isometric view rendered with **Three.js**, switchable from the central stage tab bar
- Evacuation routes rendered dynamically based on which stairwells are marked blocked vs. clear

### Guest & Staff Mobile Companion Apps
- **Guest View** (`/#/guest`): Full-screen mobile-optimized UI with SOS button (red), I'm Safe button (green), real-time floor status, and emergency instructions
- **Staff View** (`/#/staff`): Task assignment display, floor status grid, status toggle (En Route / On Scene / Resolved), and escalation actions

### Incident Review & Comparison
- Incident Timeline: chronological log of all events with timestamps and severity contributions
- Before/After Comparison: side-by-side metrics contrasting CrisisOS response against a traditional manual response (6 min vs. 90 sec, 100% vs. ≈60% guest accountability, etc.)
- Counterfactual Analysis: projects what would have happened without AI intervention
- Audit Log: full immutable record of every system action for post-incident review

### Presentation & Demo Controls
- **Presentation Mode**: collapses sidebars and enlarges central stage to keynote-friendly layout
- **Stats Overlay**: live KPI strip showing severity, elapsed time, AI agent count, voice queue depth, and accounted guest count
- **Narration Bar**: milestone-aware bottom ribbon that describes what the system is doing in real time
- **Speed Control**: 1×, 2×, 4×, 8× simulation speed for accelerated demos
- **Drill Mode**: overlays a "Training Simulation" badge without affecting core logic — safe for live staff drills
- **Intro Splash**: plays once per session via `sessionStorage`, re-playable from Demo Controller

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CrisisOS Dashboard                             │
├──────────────┬─────────────────────────┬────────────────┬──────────────┤
│   Sidebar    │     Central Stage        │  Right Panel   │ Agent Panel  │
│              │                          │                │              │
│ • Live stats │  ┌──────────────────┐   │ • Severity     │ • Detection  │
│ • 24 sensors │  │  Floor Map (2D)  │   │   gauge        │   Agent      │
│ • 12 staff   │  │  Floor Map (3D)  │   │ • Agent status │ • Coord.     │
│ • QR badge   │  │  CCTV (4-up)     │   │ • Voice panel  │   Agent      │
│              │  │  Thermal Grid    │   │ • Alerts/logs  │ • Emerg.     │
│              │  └──────────────────┘   │                │   Bridge     │
├──────────────┴─────────────────────────┴────────────────┴──────────────┤
│            Crisis Bottom Panel                                          │
│  [ Responder Brief ] [ Dispatch Board ] [ Accountability ] [ Zone PA ] │
├─────────────────────────────────────────────────────────────────────────┤
│  Overlays: IntroSplash · NarrationBar · StatsOverlay · DemoController  │
│            CountdownOverlay · IncidentReview · BeforeAfterComparison   │
│            RiskMonitor · ConnectivityPanel                              │
└─────────────────────────────────────────────────────────────────────────┘

  /guest ◄──── BroadcastChannel + localStorage ────► /staff
                         ▲
                         │
                    / (command)
```

### Data Flow
```
Sensor Telemetry (24 sensors)
        │
        ▼
useCrisisSimulation.js  ──► simBus.js  ──► GuestView / StaffView
        │
        ├──► riskPredictor.js  ──► RiskMonitor overlay
        ├──► thermalSim.js     ──► ThermalCamera canvas
        ├──► voiceAnnouncer.js ──► Browser Speech Synthesis
        │
        ▼
agents.js
        │
        ├── Detection Agent ──► POST /api/gemini-agent (Firebase Function)
        │                              │
        ├── Coordination Agent ◄───────┘
        │          │
        └── Emergency Bridge Agent  ──► JSON first-responder brief
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18.3.1 (hooks-based, functional components only) |
| Build Tool | Vite 5.4.10 |
| Routing | React Router DOM 7.14.2 (HashRouter for static hosting) |
| Styling | Tailwind CSS 3.4.14 (custom dark theme, crisis animations) |
| Animation | Framer Motion 12.38.0 (overlays, micro-interactions) |
| 3D Rendering | Three.js 0.128.0 (isometric floor visualization) |
| Canvas Rendering | HTML5 Canvas API (CCTV synthetic feeds, thermal imaging) |
| LLM | Google Gemini 2.0 Flash via @google/genai SDK 1.13.0 |
| Backend | Firebase Cloud Functions v6.5.0 (Node.js 20 runtime) |
| Hosting | Firebase Hosting (static SPA + function rewrites) |
| Cross-Tab Comms | BroadcastChannel API + localStorage fallback |
| Voice | Web Speech API (SpeechSynthesis, queue-managed) |
| State Management | React useState / useReducer / custom hooks (no Redux) |
| PostCSS | postcss 8.4.47 + autoprefixer |

---

## Project Structure

```
CrisisOS/
├── src/
│   ├── App.jsx                          # Master dashboard layout & state orchestration
│   ├── main.jsx                         # React entry point with HashRouter
│   ├── components/                      # 33 JSX files across 26 directories
│   │   ├── AccountabilityTracker/       # Guest check-in status grid
│   │   ├── AgentFlow/                   # Visual LLM pipeline diagram
│   │   ├── AgentPanel/                  # LLM agent orchestration UI
│   │   ├── AlertFeed/                   # Live crisis alert stream
│   │   ├── AuditLog/                    # Immutable incident audit trail
│   │   ├── CCTVPanel/                   # CCTVGrid.jsx + CCTVFeed.jsx (canvas, 15 fps)
│   │   ├── Comparison/                  # Before/After response comparison
│   │   ├── Countdown/                   # 3-second pre-simulation countdown
│   │   ├── Counterfactual/              # "What if no AI" projection
│   │   ├── Demo/                        # DemoController, IntroSplash, NarrationBar, StatsOverlay
│   │   ├── DispatchBoard/               # Staff dispatch assignment UI
│   │   ├── EdgeMode/                    # Connectivity panel + offline mode chip
│   │   ├── FloorMap/                    # 2D interactive floor plan
│   │   ├── FloorMap3D/                  # Three.js isometric 3D floor view
│   │   ├── IncidentReview/              # Post-incident timeline + metrics panel
│   │   ├── Metrics/                     # IncidentMetrics KPI display
│   │   ├── PostIncident/                # Post-resolution summary view
│   │   ├── QR/                          # QRBadge sidebar (links to /#/guest)
│   │   ├── ResponderBrief/              # First-responder JSON brief renderer
│   │   ├── RiskMonitor/                 # Pre-alert risk heatmap overlay
│   │   ├── SensorGrid/                  # Sidebar sensor status list
│   │   ├── SeverityGauge/               # Radial severity indicator (0–10)
│   │   ├── Thermal/                     # ThermalGrid.jsx + ThermalCamera.jsx (canvas)
│   │   ├── Timeline/                    # Incident event timeline
│   │   ├── VoicePanel/                  # Speech queue depth + mute toggle UI
│   │   └── ZoneCommunications/          # Zone-by-zone PA broadcast text
│   ├── hooks/
│   │   ├── useCrisisSimulation.js       # Master simulation engine (~600 lines)
│   │   ├── useCountUp.js                # Animated number counter hook
│   │   └── useDerivedTimeline.js        # Derived timeline from event log
│   ├── services/
│   │   ├── agents.js                    # LLM agent pipeline (Detection, Coordination, Bridge)
│   │   ├── simBus.js                    # Cross-tab pub/sub (BroadcastChannel + localStorage)
│   │   ├── voiceAnnouncer.js            # Web Speech queue + priority profiles + mute
│   │   ├── riskPredictor.js             # Ambient risk scoring engine
│   │   ├── thermalSim.js                # Heat diffusion simulation + false-color mapping
│   │   ├── connectivityManager.js       # Edge mode + network state detection
│   │   └── edgeFallback.js              # Offline resilience + cached response logic
│   ├── pages/
│   │   ├── GuestView.jsx                # Mobile guest companion app
│   │   └── StaffView.jsx                # Mobile staff dispatch app
│   └── data/
│       ├── hotelData.js                 # 251 guests, 12 staff, 24 sensors, evacuation routes
│       └── crisisScenarios.js           # Kitchen Fire scenario timeline definition
├── functions/
│   ├── index.js                         # Firebase Cloud Function: Gemini API bridge
│   └── package.json                     # Node 20, firebase-functions, @google/genai
├── firebase.json                        # Hosting + Functions config, /api/* rewrites
├── .firebaserc                          # Firebase project binding
├── vite.config.js                       # Vite config (port 5000, React plugin)
├── tailwind.config.js                   # Dark theme colors + crisis animations
└── package.json                         # All frontend dependencies
```

---

## The LLM Agent Pipeline in Detail

```
                    ┌─────────────────────────────────┐
                    │       Detection Agent            │
                    │                                  │
  Sensor data  ───► │  • Incident type & location      │
  (24 sensors,      │  • Spread pattern analysis       │
   last 10 events)  │  • Immediate threats enumerated  │
                    │  • Confidence score              │
                    └──────────────┬──────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────┐
                    │      Coordination Agent          │
                    │                                  │
  Staff list   ───► │  • Per-floor evacuation routes  │
  (12 roles)        │  • Named staff assignments       │
  Guest count  ───► │  • PA announcement text          │
  Evac routes  ───► │  • Prioritized action list       │
                    │  • Estimated coordination time   │
                    └──────────────┬──────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────┐
                    │     Emergency Bridge Agent       │
                    │                                  │
  Hotel meta   ───► │  • Structured JSON brief         │
  (address,         │  • Severity score (1–10)         │
   floor count,     │  • Known hazards + readings      │
   guest total)     │  • Blocked & clear routes        │
                    │  • Recommended entry point       │
                    │  • On-scene staff contacts       │
                    │  • Special considerations        │
                    └──────────────┬──────────────────┘
                                   │
                                   ▼
                       First-Responder JSON Brief
                    (rendered in ResponderBrief.jsx)
```

All three agents share these settings: `model: gemini-2.0-flash`, `temperature: 0.25` (low randomness for deterministic crisis outputs). Responses are token-streamed to the UI via a `simulateStream` helper that chunks text at 3 characters per 18ms for a realistic LLM typing effect. A full hardcoded fallback response is included for each agent in case the API is unreachable.

---

## The Simulation Engine

`src/hooks/useCrisisSimulation.js` (~600 lines) is the heart of the system:

- **Clock**: Ticks every 1,000ms (real time) representing 1 simulated second; speed multiplier (1×/2×/4×/8×) applied via `setInterval` interval adjustment
- **Sensor Evolution**: Temperature readings rise from baseline, smoke density accumulates, CO2 climbs, motion detection surges in corridors near the fire origin
- **Severity Scoring**: Compound formula that multiplies base severity by a diversity coefficient — if multiple distinct threat types (thermal + smoke + gas) are active simultaneously, severity escalates faster than any single threat alone
- **Event Queue**: Crisis events are pre-scripted in `crisisScenarios.js` with T+offset timestamps; the engine dequeues and fires them at the appropriate simulated time
- **Evacuation State Machine**: Transitions through `pre-stage → active → resolving → all-accounted` states, each unlocking new UI panels and triggering voice milestones
- **Agent Invocation**: Calls the LLM agent pipeline at T+15s after fire detection (non-blocking, async)
- **Thermal Updates**: Pushes heat source coordinates to `thermalSim.js` on each tick
- **Voice Milestones**: Fires `voiceAnnouncer.speak()` at pre-defined T+offsets
- **simBus Publishing**: Broadcasts full state snapshot to guest/staff tabs after each tick

---

## User Surfaces

| Route | Audience | Description |
|---|---|---|
| `/` | Command Center Staff | Full operations dashboard — sensors, agents, CCTV, thermal, floor maps, voice, dispatch, accountability, responder brief |
| `/#/guest` | Hotel Guests | Mobile-optimized — SOS button, I'm Safe check-in, real-time floor status and emergency instructions |
| `/#/staff` | Field Staff | Mobile dispatch view — task assignments, room assignments, status toggle (En Route / On Scene), escalation tools |

All three surfaces stay in sync via `simBus.js` (BroadcastChannel API + localStorage fallback) — no server required for the cross-device communication.

---

## Getting Started

**Prerequisites**: Node.js 18+, npm 9+

```bash
# Clone and install
git clone <repo-url>
cd CrisisOS
npm install

# Start dev server at http://localhost:5000
npm run dev
```

Open two additional tabs:
- `http://localhost:5000/#/guest` — Guest companion app
- `http://localhost:5000/#/staff` — Staff dispatch app

Trigger the Kitchen Fire scenario from the right panel scenario picker to see all three surfaces synchronize in real time.

---

## Google Gemini Setup (Optional)

Without a Gemini API key, the system operates fully using built-in curated fallback responses. To enable live LLM inference:

```bash
# Frontend env (endpoint override — optional)
cp .env.example .env

# Cloud Function env (required for live Gemini calls)
cp functions/.env.example functions/.env
# Edit functions/.env and add your key:
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-2.0-flash
```

The frontend never touches the API key — all Gemini calls go through the Firebase Cloud Function, keeping the key server-side only.

---

## Firebase Deployment

```bash
# Install Firebase CLI
npm i -g firebase-tools
firebase login

# Install function dependencies
cd functions && npm install && cd ..

# Build frontend
npm run build

# Deploy hosting + functions
firebase deploy
```

The `firebase.json` rewrites `/api/gemini-agent` to the Cloud Function and falls back all other routes to `index.html` for SPA routing.

---

## Demo Script

1. **Open `/`** — the intro splash plays; dashboard initializes in NOMINAL state with all sensors green
2. **Open `/#/guest` and `/#/staff`** in two extra tabs (or scan the sidebar QR from a phone)
3. **Select "Kitchen Grease Fire"** from the scenario picker in the right panel and click Trigger
4. **Watch the 3-second countdown** → crisis bottom panel expands, severity gauge climbs
5. **Voice announces** fire detection; Vision Agent activates over CCTV feeds; floor map highlights Floor 3 East Wing
6. **LLM agents begin** — Detection result streams in, Coordination plan follows, Responder Brief generates
7. **Tap SOS** on the guest tab → alert appears in the command view immediately
8. **Toggle Drill Mode** — the Training Simulation overlay appears without disrupting the demo
9. **Toggle Presentation Mode** — sidebars collapse to a keynote-friendly single-stage view
10. **After resolution**, click "Incident Review" → timeline, metrics, before/after comparison

---

## Notable Engineering Decisions

- **No Redux or Zustand** — all state lives in `useCrisisSimulation.js` and flows down via props / context. The simulation is a single source of truth that guest/staff tabs replicate via simBus.
- **No WebSockets** — `BroadcastChannel` gives same-origin real-time cross-tab messaging with zero infrastructure. `localStorage` events provide fallback for Safari private mode.
- **Gemini temperature 0.25** — crisis response must be deterministic and authoritative; low temperature prevents hallucinated routes or fabricated staff names.
- **Fallback-first LLM design** — the UI never shows an error if Gemini is unavailable; it seamlessly serves the curated fallback, which is pre-validated against the hotel data.
- **Float32Array thermal grids** — typed arrays instead of plain objects for the 64×48 heat grid; reduces GC pressure during per-tick diffusion steps.
- **Canvas over SVG for CCTV** — 15 fps scanline + grain + bounding box rendering at this frame rate is more efficient with imperative Canvas than with React-managed SVG elements.

---

## License

Internal demo project — Horizon Grand Hotel, 2026.
