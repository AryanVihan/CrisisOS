Build the first responder brief display and staff dispatch system for CrisisOS.

1. Create src/components/ResponderBrief/ResponderBrief.jsx:
   When the Emergency Bridge Agent completes, parse its JSON output and display as a dramatic "TRANSMISSION ACTIVE" card.
   
   Layout:
   - Header: red banner "EMERGENCY TRANSMISSION — DISPATCHING TO FIRST RESPONDERS" with blinking indicator
   - Three recipient badges: FIRE DEPT, POLICE, AMBULANCE — each with a "RECEIVED" confirmation that appears after 2 seconds
   - Main brief displayed as structured sections with icons:
     * Incident classification (large, prominent)
     * Severity score with color
     * Confirmed location with building diagram icon
     * Persons affected / unaccounted (shown as numbers prominently)
     * Known hazards (red warning pills)
     * Clear access routes (green pills)
     * Recommended entry point
     * Staff contact on scene
   - A "COPY TO CLIPBOARD" button that copies the JSON
   - Transmission timestamp
   - Animated: card slides in from bottom, each section fades in sequentially

2. Create src/components/DispatchBoard/DispatchBoard.jsx:
   Shows real-time staff assignments as a board with columns:
   - AVAILABLE (blue)
   - EN ROUTE (amber, with destination)
   - ON SCENE (red)
   - EVACUATING (green, with guest count they're guiding)
   
   Each staff card shows: name, role badge, current assignment, floor/zone, a small avatar circle with initials. Cards animate between columns as the simulation progresses. When coordination agent runs, parse its STAFF ASSIGNMENTS section and populate this board automatically.

3. Create src/components/AccountabilityTracker/AccountabilityTracker.jsx:
   The emotional centrepiece of the demo.
   
   Large display showing:
   - "251 GUESTS REGISTERED" (static)
   - Large animated number: "247 ACCOUNTED" in green
   - "4 UNACCOUNTED" in pulsing red
   - A progress bar filling from 0% to current accountability percentage
   - Below: a list of the 4 unaccounted guests: Room 312 (John M.), Room 314 (Sarah K.), Room 318 (2 guests) — last seen Floor 3 East Wing, T-minus timestamp
   - "SEARCH TEAMS DEPLOYED" badge appearing after dispatch
   - At T+75 seconds: one by one, the unaccounted guests get found — number ticks up to 251, bar goes full green, "ALL GUESTS ACCOUNTED" appears with a pulse

4. Create src/components/ZoneCommunications/ZoneCommunications.jsx:
   Shows what is being broadcast on speakers in each zone right now.
   - Grid of zone cards: Lobby, Floor 1, Floor 2, Floor 3 East, Floor 3 West, Floor 4, Stairwell A, Stairwell B
   - Each card shows: zone name, speaker icon (animated sound waves when active), current message, message type (CALM / URGENT / CRITICAL)
   - Color: green = normal, amber = alert, red = evacuate now
   - Zone 3 East: "EMERGENCY — Evacuate immediately via Stairwell A. Do NOT use elevators."
   - Other floors: "Precautionary evacuation in progress. Please proceed calmly to nearest exit."
   - Lobby: "Emergency services have been notified. Staff are guiding guests to safety."
   - Messages update as coordination agent output is parsed

Wire all these into App.jsx. They should appear in a tabbed bottom panel or modal overlay when crisis is active — don't clutter the main view during normal operation.