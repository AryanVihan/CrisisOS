Add the final demo presentation layer to CrisisOS that makes it judge-proof and presentation-ready.

1. Create a Demo Control Panel (src/components/Demo/DemoController.jsx):
   A floating panel (bottom-right corner, collapsible) that only shows in demo mode.
   Contains:
   - "START SCENARIO: Kitchen Fire" button
   - "START SCENARIO: Crowd Surge" button
   - A timeline scrubber: drag to any point in the simulation (T+0 to T+120 seconds)
   - "TRIGGER SOS — Room 312" button (manual SOS injection)
   - "BLOCK EXIT B" button (demonstrates dynamic rerouting)
   - "FIND ALL GUESTS" button (resolves accountability, for demo endings)
   - Speed control: 1x / 2x / 4x simulation speed
   This lets you control the demo perfectly if a judge asks "can you show me X"

2. Create a Presentation Mode (full-screen, no browser chrome):
   When "PRESENTATION MODE" is activated:
   - All panels auto-arrange for maximum visual impact
   - Font sizes increase 10%
   - The floor map takes center stage
   - A subtle "CRISISIOS" watermark appears bottom right
   - All debug info is hidden
   - The simulation auto-runs its best path
   - A subtle narration bar at the bottom shows what is happening in plain English ("Smoke detected on Floor 3... AI agents activating... Emergency services being notified...")

3. Narration bar:
   Auto-generates human-readable narration based on simulation state:
   - "System monitoring 251 guests across 6 floors. All sensors nominal."
   - "ALERT: Smoke sensor SM-302 detecting elevated readings on Floor 3."
   - "Multiple signals confirmed. AI Detection Agent analyzing incident..."
   - "EMERGENCY DECLARED: Coordinated response activating across all systems."
   - "First responders notified. Guest evacuation underway. 247 of 251 accounted."
   This gives judges context without you needing to speak constantly.

4. Statistics overlay that auto-updates:
   A sleek overlay in the corner showing live stats:
   - Sensors monitored: 24
   - AI decisions made: [counter]
   - Messages sent: [counter]  
   - Staff coordinated: [counter]
   - Time since detection: [live clock]
   
5. Add an intro splash screen:
   When the app first loads, show a 3-second cinematic intro:
   - Black screen
   - "CrisisOS" fades in (red text)
   - Subtitle: "Intelligent Emergency Response"  
   - "Powered by Multi-Agent AI" fades in below
   - Then the main dashboard fades in
   Skip button available.

6. Final checks — run through this entire list and fix anything broken:
   - App loads without errors
   - Start simulation button works and triggers the full scenario
   - Floor map shows moving dots during evacuation
   - All 3 AI agents activate and stream responses
   - Severity gauge climbs from 0 to 9
   - Accountability tracker shows 4 unaccounted then resolves
   - First responder brief generates and displays
   - Before/after comparison shows correctly
   - Guest view at /guest route works
   - Demo controller lets you scrub through time
   - Reset brings everything back to idle state cleanly
   - No console errors
   - Looks good on a 1920x1080 presentation screen

7. README.md with:
   - Project name and tagline
   - The problem it solves (2 sentences)
   - Key features (bullet list)
   - How to run: npm install && npm run dev
   - Demo instructions: "Press START CRISIS SIMULATION to begin"
   - Tech stack
   - Team name placeholder

The final app should be something a judge can sit in front of for 5 minutes and be genuinely impressed by, even without anyone explaining it.