# CrisisOS

Emergency Response System — a React + Vite single-page application that visualizes a multi-agent AI pipeline for hotel/venue crisis management.

## Tech Stack

- **Framework**: React 18 with Vite 5
- **Styling**: Tailwind CSS + PostCSS + Autoprefixer
- **Animation**: Framer Motion
- **AI**: Pre-scripted narrative responses in `src/services/agents.js` (live LLM calls were removed during the Replit migration to avoid shipping API keys to the browser; a backend would be required to re-enable streaming)
- **Language**: JavaScript (JSX)

## Project Layout

- `index.html` — Vite entry HTML
- `src/main.jsx` — React entry (HashRouter; routes `/`, `/guest`, `/staff`)
- `src/App.jsx` — Root command-center dashboard with central tabs (Floor 2D/3D / CCTV / Thermal / Multi-Sensor) plus header risk + connectivity chips
- `src/pages/GuestView.jsx`, `src/pages/StaffView.jsx` — Mobile companion surfaces (Phase 9)
- `src/components/` — UI components
  - `CCTVPanel/` — canvas-rendered CCTV grid with vision-agent sweep (Phase 12)
  - `VoicePanel/` — Web Speech announcer UI (Phase 11)
  - `Demo/` — DemoController, NarrationBar, StatsOverlay, IntroSplash (Phase 10)
  - `RiskMonitor/` — predictive risk score panel + per-floor heatmap + header chip (Phase 13)
  - `Thermal/` — false-color canvas thermal cameras + 2x2 grid + lead-time banner (Phase 14)
  - `AgentFlow/` — animated 3-node agent flow visualizer with packet animation, payload inspector, Gantt (Phase 15)
  - `FloorMap3D/` — Three.js isometric 6-floor stack with fire particles, evac tubes, drag-orbit (Phase 16)
  - `EdgeMode/` — connectivity panel + chip + banner for cloud/edge/degraded resilience (Phase 17)
  - `QR/QRBadge.jsx` — sidebar QR pointing at `/#/guest`
- `src/services/`
  - `simBus.js` — cross-tab pub/sub via BroadcastChannel + localStorage
  - `voiceAnnouncer.js` — queued Web Speech wrapper with persistent mute
  - `riskPredictor.js` — composite risk scoring engine (env / occupancy / behavioral / external) with pre-alert threshold (Phase 13)
  - `thermalSim.js` — 64x48 heat-grid sim with diffusion + camera sources + false-color palette (Phase 14)
  - `connectivityManager.js` — pub/sub state machine for cloud/edge/degraded mode + sync queue (Phase 17)
  - `edgeFallback.js` — pre-cached crisis protocols used when cloud is unreachable (Phase 17)
- `src/hooks/useCrisisSimulation.js` — master sim loop (clock, sensors, agents, voice milestones, sim-bus)
- `vite.config.js` — Vite configuration (Replit-friendly host/port settings)
- `tailwind.config.js`, `postcss.config.js` — Styling configuration

## Phases Implemented

- **Phase 9** — Guest/Staff mobile views, cross-tab sync, QR badge
- **Phase 10** — Demo controller, presentation mode, narration bar, stats overlay, intro splash, README
- **Phase 11** — Web Speech voice announcer + VoicePanel + speaker indicators on ZoneCommunications
- **Phase 12** — Canvas CCTV grid (4 feeds, expand, vision-agent sweep) + central-stage tabs
- **Phase 13** — Predictive risk monitor: 60s pre-crisis stage, composite risk score (env/occupancy/behavioral/external), header chip, modal with per-floor heatmap, pre-alert at score ≥ 71
- **Phase 14** — Thermal cameras: 4 simulated IR cams in 2x2 grid, false-color heat-map canvas, lead-time banner showing how many seconds the IR anomaly preceded smoke detection, plus Multi-Sensor split (CCTV + Thermal)
- **Phase 15** — Agent flow visualizer: 3-node graph with animated packets between agents, payload inspector, Gantt timeline, plus Terminal/Flow toggle in agent panel that auto-switches to Flow at severity ≥ 5
- **Phase 16** — 3D isometric floor map: Three.js scene of 6-floor hotel stack, fire particles + evac tubes on the crisis floor, drag-orbit, 2D / 3D ISO toggle in the floor map header
- **Phase 17** — Edge / offline mode: connectivity manager (cloud / edge / degraded), header chip, modal with system checklist + sync queue, banner on mode change, Demo Controller "Simulate Network Failure / Restore" buttons, Edge fallback badge in agent panel + post-incident System Resilience section

## Replit Setup

- Workflow **Start application** runs `npm run dev` and serves the Vite dev server on port **5000** (`0.0.0.0`).
- `vite.config.js` sets `server.host = '0.0.0.0'`, `server.port = 5000`, and `server.allowedHosts = true` so Replit's iframe proxy can reach the dev server.

## Deployment

Configured as a **static** deployment:

- Build: `npm run build`
- Public directory: `dist`

Use the Publish action in Replit to deploy.
