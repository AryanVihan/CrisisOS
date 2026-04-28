I am building CrisisOS — a real-time AI-powered emergency response system for hospitality venues. This is for a national hackathon and needs to look and feel cinematic and professional.

Set up the complete project foundation:

1. Configure Tailwind with a custom dark theme. Primary background #0a0a0f, secondary #111118, accent red #ef4444, accent amber #f59e0b, accent green #22c55e, accent blue #3b82f6, text primary #f1f5f9, text secondary #94a3b8. Add custom CSS variables for these.

2. Create a global CSS file with:
   - A subtle animated grid background (CSS grid lines, very faint, dark)
   - Pulsing red glow keyframe animation called "crisis-pulse"
   - Smooth fade-in animation called "fade-in"
   - A "scanning" animation for sensor readings (horizontal sweep)
   - Custom scrollbar styles (dark, thin)
   - Font: Inter from Google Fonts

3. Create the main App.jsx with a full-screen dark layout. Left sidebar (280px) for system status, main content area (flex-1) for the floor map, right panel (320px) for agent activity. Header bar showing "CrisisOS" logo in red, hotel name "Horizon Grand Hotel", current time updating every second, and a status badge that says "ALL SYSTEMS NOMINAL" in green.

4. Create a constants file src/data/hotelData.js with:
   - Hotel floors: Lobby, Floor 1, Floor 2, Floor 3, Floor 4, Roof
   - 12 staff members with names, roles (Security, Medical, Manager, Concierge, Housekeeping), current floor, and status (available/dispatched)
   - 251 guests distributed across floors with room numbers
   - 24 sensors: smoke detectors, motion sensors, temperature sensors, CO2 sensors — distributed across all floors with x/y coordinates
   - 8 emergency exits with coordinates and floor assignments
   - Pre-defined evacuation routes per floor (primary and secondary)

5. Create src/data/crisisScenarios.js with one complete fire scenario:
   - name: "Kitchen Fire — Floor 3 East Wing"
   - A timeline array of events at T+0, T+3, T+6, T+10, T+15, T+25, T+40, T+60, T+90 seconds
   - Each event has: sensorId, type (smoke/motion/temperature/sos/cctv), floor, zone, value, message, severity contribution
   - Make the scenario realistic: starts with a temperature spike, then smoke, then motion surge, then a guest SOS from room 312, then CCTV detects crowd movement
   - Also include a second scenario: "Crowd Surge — Lobby"

Make sure everything compiles cleanly. Use proper ES module imports throughout.