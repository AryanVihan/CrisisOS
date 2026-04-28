Build the sensor monitoring system and crisis simulation engine for CrisisOS.

1. Create src/components/SensorGrid/SensorGrid.jsx:
   A panel showing all 24 sensors in a compact grid. Each sensor card shows:
   - Sensor icon (flame for smoke, thermometer for temp, person for motion, cloud for CO2)
   - Sensor ID and location (e.g. "SM-301 · Floor 3 East")
   - Current reading with unit (ppm, °C, count, %)
   - A small sparkline (last 10 readings as a mini bar chart — build this with SVG, no library needed)
   - Status badge: NORMAL / ELEVATED / CRITICAL
   - Last updated timestamp
   - Red pulsing border when in CRITICAL state
   Cards should be compact (fit 6 per row on the left panel). Click a sensor to highlight it on the floor map.

2. Create src/hooks/useCrisisSimulation.js — the main simulation engine:
   This is the brain of the demo. It manages all real-time state.
   
   State it manages:
   - simulationStatus: 'idle' | 'running' | 'crisis' | 'resolving'
   - elapsedSeconds: number
   - sensors: array with current readings
   - guests: array with positions
   - staff: array with assignments  
   - crisisEvents: array of triggered events so far
   - severityScore: 0-10
   - activeFloor: string
   - evacuationActive: boolean
   - accountedGuests: number (starts at 251, decreases then increases as evacuation happens)
   - dispatchedStaff: array
   - agentLogs: array of agent activity entries
   - incidentTimeline: array

   Functions it exposes:
   - startSimulation(scenarioName): begins the crisis scenario
   - resetSimulation(): returns to idle state
   - triggerManualSOS(floor, room): adds an SOS event
   - acknowledgeAlert(alertId): marks alert as seen

   Core simulation loop (useInterval at 1 second):
   - Advance elapsedSeconds
   - Check crisisScenarios timeline — trigger any events due at this elapsed time
   - For each triggered event: update the relevant sensor reading dramatically, add to crisisEvents, recalculate severityScore
   - Severity score formula: base from event types + compound multiplier when multiple signal types fire simultaneously
   - Move guest dots: during evacuation, each second move guests 1 step closer to their assigned exit
   - Update accountedGuests as guests reach exits
   - Generate agentLog entries automatically as events trigger (the agents are "responding")
   - Keep 4 guests permanently unaccounted until T+75 seconds (creates drama)

3. Create src/components/SeverityGauge/SeverityGauge.jsx:
   A dramatic circular gauge (SVG arc) showing 0-10.
   - 0-3: green, label "MONITORING"
   - 4-6: amber, label "ELEVATED"  
   - 7-8: red, label "CRITICAL"
   - 9-10: deep red pulsing, label "EMERGENCY"
   Animate the needle smoothly when value changes. Show the number large in the center. Add small status text below. When it hits 7+, trigger a full-screen flash effect (brief red flash overlay on the whole app).

4. Create src/components/AlertFeed/AlertFeed.jsx:
   A live scrolling feed of triggered events. Each entry:
   - Timestamp (HH:MM:SS)
   - Icon based on type
   - Color-coded severity pill
   - Message text
   - Floor/Zone badge
   New entries animate in from the top (framer-motion). Maximum 20 visible, older ones fade out. Auto-scroll to newest.

Wire useCrisisSimulation into App.jsx and pass state down to FloorMap and SensorGrid.