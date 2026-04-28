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
- `src/App.jsx` — Root command-center dashboard with central tabs (Floor / Surveillance / Thermal)
- `src/pages/GuestView.jsx`, `src/pages/StaffView.jsx` — Mobile companion surfaces (Phase 9)
- `src/components/` — UI components
  - `CCTVPanel/` — canvas-rendered CCTV grid with vision-agent sweep (Phase 12)
  - `VoicePanel/` — Web Speech announcer UI (Phase 11)
  - `Demo/` — DemoController, NarrationBar, StatsOverlay, IntroSplash (Phase 10)
  - `QR/QRBadge.jsx` — sidebar QR pointing at `/#/guest`
- `src/services/`
  - `simBus.js` — cross-tab pub/sub via BroadcastChannel + localStorage
  - `voiceAnnouncer.js` — queued Web Speech wrapper with persistent mute
- `src/hooks/useCrisisSimulation.js` — master sim loop (clock, sensors, agents, voice milestones, sim-bus)
- `vite.config.js` — Vite configuration (Replit-friendly host/port settings)
- `tailwind.config.js`, `postcss.config.js` — Styling configuration

## Phases Implemented

- **Phase 9** — Guest/Staff mobile views, cross-tab sync, QR badge
- **Phase 10** — Demo controller, presentation mode, narration bar, stats overlay, intro splash, README
- **Phase 11** — Web Speech voice announcer + VoicePanel + speaker indicators on ZoneCommunications
- **Phase 12** — Canvas CCTV grid (4 feeds, expand, vision-agent sweep) + central-stage tabs

## Replit Setup

- Workflow **Start application** runs `npm run dev` and serves the Vite dev server on port **5000** (`0.0.0.0`).
- `vite.config.js` sets `server.host = '0.0.0.0'`, `server.port = 5000`, and `server.allowedHosts = true` so Replit's iframe proxy can reach the dev server.

## Deployment

Configured as a **static** deployment:

- Build: `npm run build`
- Public directory: `dist`

Use the Publish action in Replit to deploy.
