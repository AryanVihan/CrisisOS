Build the incident timeline and audit log for CrisisOS.

1. Create src/components/Timeline/IncidentTimeline.jsx:
   A vertical timeline component showing every event in the crisis chronologically.
   
   Each entry has:
   - Exact timestamp
   - Event type icon (sensor, SOS, AI decision, dispatch, communication, external)
   - Color-coded left border (red = detection, amber = response, blue = AI agent, green = resolution, purple = external services)
   - Title and description
   - Source badge (which sensor, which agent, which staff member)
   - Duration since crisis start (T+0:00 format)
   
   Special entries that auto-generate:
   - T+0:00 — "Temperature spike detected, Sensor TH-301, Floor 3 Kitchen Annex — 47°C"
   - T+0:03 — "Smoke detected, Sensor SM-302, Floor 3 East — 450 PPM"
   - T+0:06 — "Motion surge detected, Camera CV-03, Floor 3 — 47 persons in frame"
   - T+0:10 — "Guest SOS received, Room 312, Floor 3 — 'There is smoke in the hallway'"
   - T+0:12 — "Detection Agent initiated — analyzing 4 concurrent signals"
   - T+0:18 — "SEVERITY THRESHOLD REACHED — Level 7 — EMERGENCY PROTOCOL ACTIVATED"
   - T+0:22 — "Coordination Agent initiated — generating response plan"
   - T+0:28 — "Emergency services notified — Fire Dept ETA 4 minutes"
   - T+0:31 — "Emergency Bridge Agent — transmitting first responder brief"
   - T+0:35 — "Staff dispatched: 6 personnel to Floor 3, 2 to lobby"
   - T+0:38 — "Speaker system activated — zone-specific evacuation instructions"
   - T+0:45 — "Evacuation commenced — 247 of 251 guests moving to exits"
   - T+0:52 — "4 guests unaccounted — search teams deployed to Floor 3 East"
   Subsequent events generate dynamically as simulation runs.
   
   New entries animate in smoothly. Timeline is scrollable, newest at bottom. Export as PDF button (just shows browser print dialog).

2. Create src/components/AuditLog/AuditLog.jsx:
   A separate legal-grade log view — monospace font, structured like a system log:
   [2024-01-15 14:32:07.234] [SENSOR] SM-302 CRITICAL smoke=450ppm floor=3 zone=east
[2024-01-15 14:32:10.891] [AGENT:DETECTION] analysis_started event_count=3
[2024-01-15 14:32:18.445] [SYSTEM] severity_threshold_crossed level=7 protocol=EMERGENCY
[2024-01-15 14:32:22.112] [AGENT:COORDINATION] response_plan_generated staff_assigned=8
[2024-01-15 14:32:28.778] [EXTERNAL] emergency_services_notified fire_dept=dispatched eta=4min
[2024-01-15 14:32:31.334] [AGENT:BRIDGE] responder_brief_transmitted recipients=3
   Color coded: sensors in cyan, agents in purple, system in amber, external in green, errors in red.
   Auto-scrolling. "EXPORT LOG" button copies all entries to clipboard.

3. Create src/components/Metrics/IncidentMetrics.jsx:
   Post-crisis (or live during) metrics panel:
   - Time to first detection: X seconds
   - Time to AI analysis complete: X seconds  
   - Time to emergency services notified: X seconds
   - Time to evacuation commenced: X seconds
   - Time to full accountability: X seconds
   - TOTAL COORDINATION TIME: XX seconds (shown large)
   - Below: "Industry average manual coordination: 8-12 minutes"
   - "CrisisOS improvement: 94% faster" — shown with a dramatic bar comparison
   
   These numbers come from the simulation timestamps. The comparison bar is the key visual — two bars side by side, the manual one extending way off screen compared to yours.

Add all three to a slide-up panel in the main UI accessible via a "INCIDENT TIMELINE" button in the header. The panel should be a full-width overlay that slides up from the bottom.