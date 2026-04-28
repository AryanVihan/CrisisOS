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
- `src/main.jsx` — React entry
- `src/App.jsx` — Root component
- `src/components/` — UI components (sensor grid, agent panel, floor map, etc.)
- `src/data/`, `src/hooks/`, `src/services/` — Domain data, hooks, and services
- `vite.config.js` — Vite configuration (Replit-friendly host/port settings)
- `tailwind.config.js`, `postcss.config.js` — Styling configuration

## Replit Setup

- Workflow **Start application** runs `npm run dev` and serves the Vite dev server on port **5000** (`0.0.0.0`).
- `vite.config.js` sets `server.host = '0.0.0.0'`, `server.port = 5000`, and `server.allowedHosts = true` so Replit's iframe proxy can reach the dev server.

## Deployment

Configured as a **static** deployment:

- Build: `npm run build`
- Public directory: `dist`

Use the Publish action in Replit to deploy.
