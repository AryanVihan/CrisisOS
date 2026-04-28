# CrisisOS

**Hotel Emergency Response Command Dashboard**
From detection to resolution in under 90 seconds.

CrisisOS is a real-time, agent-driven situational awareness platform built for the Horizon Grand Hotel.
It fuses sensor telemetry, multi-agent reasoning, voice announcements, CCTV vision, and guest/staff mobile companion apps into a single command surface that turns a six-minute manual evacuation into a 90-second coordinated response.

---

## Quick Start

```bash
npm install
npm run dev          # http://localhost:5000
```

Build & preview:

```bash
npm run build
npm run preview
```

The app is a static SPA — deploy the `dist/` folder to any static host.

---

## Surfaces

| Route             | Audience          | What it shows                                                     |
| ----------------- | ----------------- | ----------------------------------------------------------------- |
| `/`               | Command center    | Full operations dashboard (sensors, agents, alerts, CCTV, voice)  |
| `/#/guest`        | Hotel guests      | Mobile concierge view + emergency SOS / "I'm safe" buttons        |
| `/#/staff`        | Field staff       | Mobile dispatch view with status updates (en route / on scene)    |

All three surfaces are linked via `BroadcastChannel` + `localStorage` (see `src/services/simBus.js`),
so a guest tapping **SOS** on `/guest` instantly raises an alert in the command view and vice-versa — even across browser windows on the same device.

The command-view sidebar shows a **scannable QR code** that points to `/guest`,
so a presenter can scan it from a phone and demo the cross-tab sync live.

---

## Demo Controls

A floating **Demo Controller** (bottom-right) gives a presenter:

- **Presentation Mode** — collapses sidebars/chrome and enlarges the central stage.
- **Stats Overlay** — live KPI strip (severity, T+elapsed, AI agents, voice queue, accounted guests).
- **Narration Bar** — milestone-aware bottom ribbon describing what the system is doing right now.
- **Replay Intro** — re-runs the splash.
- **Speed control** — surfaced via the simulation hook (1× / 2× / 4× / 8×) for accelerated demos.
- **Scenario shortcuts** — one-click triggers for the canonical Phase-3 scenarios.

The **Intro Splash** auto-plays once per session (controlled via `sessionStorage` key `crisisos:introSeen`).

---

## Voice (Phase 11)

`src/services/voiceAnnouncer.js` wraps `window.speechSynthesis` with:

- A **FIFO queue** so milestones don't overlap.
- Auto-selection of the best English voice once `voiceschanged` fires.
- A persistent **mute** toggle (localStorage `crisisos:voice-muted`).
- Pub/sub for "speaking" / "queued" state, consumed by `VoicePanel` and the `ZoneCommunications` speaker indicators (`.eq-bar` equalizer animation).

The simulation fires announcements at well-defined T+milestones — fire detected, evacuation initiated, all guests accounted, etc. — via `voiceAnnouncer.speak(...)`.

---

## CCTV (Phase 12)

`CCTVGrid` renders a **2×2 canvas grid** of synthetic CCTV feeds at 15 fps:

- Scanlines, film grain, REC indicator, timecode, camera label.
- **Bounding boxes** populate dynamically based on `severity` + `evacuationActive`.
- **Vision-Agent sweep** — a moving purple gradient bar appears whenever a vision pass is active (severity ≥ 4 or evacuation in progress *and* the Surveillance tab is open).
- Click any feed to expand to a hero view with overlay metadata.

The central stage now has three tabs — **Floor Map · Surveillance · Thermal** (Thermal is a Phase-13 placeholder) — and auto-switches to Surveillance for ~6 seconds when an evacuation is first declared, for dramatic effect.

---

## Architecture

```
┌──────────────┬────────────────────┬──────────────────┬────────────────┐
│   Sidebar    │    Central Stage    │   Right Panel    │ Agent Orches-  │
│              │                     │                  │ trator         │
│ • Stats      │  Floor / CCTV /     │ • Severity gauge │                │
│ • Sensors    │  Thermal tabs       │ • Agent status   │ • LLM bridge   │
│ • Staff      │                     │ • Voice panel    │ • Plan / brief │
│ • QR badge   │                     │ • Alerts / logs  │ • Dispatch     │
└──────────────┴────────────────────┴──────────────────┴────────────────┘
        Crisis Bottom Panel  (Brief / Dispatch / Accountability / Comms)

   Overlays:  IntroSplash · NarrationBar · StatsOverlay · DemoController
              CountdownOverlay · IncidentReviewPanel · BeforeAfterComparison
```

### Key modules

| Path                                          | Purpose                                                              |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `src/hooks/useCrisisSimulation.js`            | Master simulation loop — clock, sensors, agents, voice, sim-bus pub  |
| `src/services/simBus.js`                      | Cross-tab pub/sub with snapshot + actions                            |
| `src/services/voiceAnnouncer.js`              | Web Speech queue + mute persistence                                  |
| `src/components/CCTVPanel/CCTVFeed.jsx`       | 15 fps canvas-rendered camera feed                                   |
| `src/components/CCTVPanel/CCTVGrid.jsx`       | 4-up grid + expanded hero                                            |
| `src/components/VoicePanel/VoicePanel.jsx`    | Now-speaking + queue depth + mute UI                                 |
| `src/components/Demo/*`                       | DemoController, NarrationBar, StatsOverlay, IntroSplash              |
| `src/components/QR/QRBadge.jsx`               | Sidebar QR pointing to `/#/guest`                                    |
| `src/pages/GuestView.jsx`                     | Mobile guest companion app                                           |
| `src/pages/StaffView.jsx`                     | Mobile staff dispatch app                                            |

---

## Tech

- **React 18** + **Vite 5**
- **Tailwind CSS** (custom dark theme — see `tailwind.config.js`)
- **Framer Motion** for overlays and micro-interactions
- **react-router-dom** with **HashRouter** for static-host friendly routing
- **Web Speech API**, **BroadcastChannel API**, **HTML Canvas** — all native, no extra deps

---

## Suggested Demo Script

1. Open `/` — splash plays, dashboard lands in NOMINAL state.
2. Open `/#/guest` and `/#/staff` in two extra tabs (or scan the sidebar QR).
3. Click **Trigger Simulation → Kitchen Grease Fire** in the right panel.
4. The 3-second countdown fires; the bottom crisis panel appears.
5. Voice announces detection. Severity climbs. Vision-Agent activates.
6. Tap **SOS** on the guest tab → alert appears in command view instantly.
7. Toggle **Presentation Mode** for the keynote-friendly view.
8. After resolution, open **Incident Timeline** and **Compare Response** to show the before/after delta.

---

## License

Internal demo project — Horizon Grand Hotel, 2026.
