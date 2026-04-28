Polish the entire CrisisOS application and wire everything together into a final production-ready demo.

1. Main layout final assembly in App.jsx:
   
   HEADER (60px):
   - Left: CrisisOS logo (red text, monospace font) + "HORIZON GRAND HOTEL" subtitle
   - Center: Live clock (HH:MM:SS updating every second) + current date + "SIMULATION MODE" amber badge
   - Right: System status indicator, Settings icon, "START CRISIS SIMULATION" button (red, prominent)
   - When crisis active: header background pulses subtly red, status changes to "EMERGENCY ACTIVE"
   
   LEFT PANEL (280px, scrollable):
   - Severity gauge (top, prominent)
   - Accountability tracker
   - Sensor grid (compact, 2 columns)
   - Quick stats: Active sensors, Staff deployed, Exits clear, Services notified
   
   MAIN AREA (flex-1):
   - Floor map takes 65% of height
   - Alert feed below it (35% height, scrollable)
   
   RIGHT PANEL (340px, scrollable):
   - Agent panel (all 3 agents, collapsible)
   - Zone communications
   - Dispatch board
   
   BOTTOM BAR:
   - "INCIDENT TIMELINE" button → slides up the timeline panel
   - "RESPONDER BRIEF" button → shows the brief overlay
   - "COMPARE" button → shows before/after modal
   - "COUNTERFACTUAL" button → shows what-if panel
   - Incident metrics (inline: Detection: 3s | Coordination: 52s | Accountability: 75s)

2. Crisis simulation button behavior:
   - Idle state: big red "INITIATE CRISIS SIMULATION" button, centered if no crisis
   - Click: 3-second countdown with dramatic animation ("CRISIS SIMULATION STARTING IN 3... 2... 1...")
   - During crisis: button becomes "RESET SIMULATION" in gray
   - Auto-trigger all agents at appropriate thresholds
   - Auto-open relevant panels as the crisis unfolds (brief slides in automatically at T+31s)

3. Add these polish details:
   - Framer-motion page transitions for panel slides
   - All numbers that change should animate (use a counting animation hook)
   - Add subtle sound indicators: a visual "beep" flash when new alerts arrive (just a CSS flash, no actual sound needed)
   - Sensor cards that go critical should shake briefly (CSS animation)
   - The floor map should have a subtle CRT scanline overlay effect (CSS)
   - All timestamps should be real — use actual Date.now() relative to simulation start
   - Add a "LIVE" red blinking dot next to the floor map title
   - Loading skeleton states for agent panels before they activate

4. Mobile responsiveness:
   - On screens under 1200px, collapse left and right panels into tab navigation
   - Floor map remains full width
   - This lets you demo on a laptop without horizontal scrolling

5. Final data wiring check:
   - useCrisisSimulation hook drives ALL state
   - Floor map receives and displays real guest/staff/sensor positions
   - Agent panel receives crisis data and calls Claude API at right thresholds
   - Accountability tracker counts down and up correctly
   - Timeline auto-populates from simulation events
   - Before/after comparison shows real timing data from the simulation
   - All panels update reactively as simulation state changes
   
6. Add a demo reset that cleanly wipes all state and returns to the idle beautiful "all systems nominal" view. The contrast between the calm idle state and the active crisis state should be dramatic and immediate.

Make sure there are zero console errors, the app loads cleanly, and a first-time viewer can understand what they are looking at within 5 seconds. The UI should be impressive enough that judges say "what is this?" before you even start explaining.