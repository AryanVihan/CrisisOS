Build the predictive risk monitoring system for CrisisOS — the feature that 
proves the system is proactive, not just reactive. This runs continuously 
BEFORE any crisis is declared and shows risk building up over time.

1. Create src/services/riskPredictor.js:

A predictive scoring engine that runs every 2 seconds during normal operation.

Risk factor calculations (each scored 0-100, weighted and summed):

  Environmental risk factors:
  - Temperature trend: if any sensor's temp has risen >2°C in last 60 seconds: +15
  - Humidity anomaly: sudden drop in humidity (fire dries air): +10
  - CO2 baseline drift: gradual rise above normal: +8
  - Time of day factor: peak hours (7-9am, 6-9pm) add +5 baseline risk

  Occupancy risk factors:
  - Floor density: if any floor exceeds 80% capacity: +12
  - Crowd velocity: if average movement speed on a floor increases >40%: +18
  - Zone clustering: if >60% of a floor's guests are in one zone: +15
  - Lobby congestion: if lobby count exceeds threshold: +10

  Behavioral signals:
  - Rapid movement detected (camera): +20
  - Multiple guests accessing same emergency exit: +25
  - Unusual silence in normally active zones: +8

  External factors (simulated):
  - Weather severity (imported from weather data): 0-15
  - Time since last drill: longer = higher baseline: 0-10
  - Maintenance flags: any sensor in test mode: +5

  Compound multiplier: 
  If 3+ risk factors are elevated simultaneously, multiply total by 1.4

  Final risk score: weighted average, clamped 0-100
  Risk level thresholds:
  - 0-25: LOW (green)
  - 26-50: GUARDED (blue)  
  - 51-70: ELEVATED (amber)
  - 71-85: HIGH (orange)
  - 86-100: CRITICAL (red — triggers pre-alert)

2. Create src/components/RiskMonitor/RiskMonitor.jsx:

A pre-crisis monitoring panel showing ambient risk at all times.

Main display:
  - Large risk score number (animated counting)
  - Risk level label with color
  - Horizontal risk bar with color gradient
  - "PREDICTIVE RISK ASSESSMENT" header with AI badge

Risk factor breakdown:
  - Compact list of all active risk factors
  - Each factor shows: name, contribution score, small trend arrow
  - Factors that are elevated pulse amber
  - Factors that just changed animate briefly

Risk trend chart:
  - A small line chart (SVG, no library) showing risk score over last 
    60 seconds — 60 data points, updates every second
  - X axis: time (last 60s)
  - Y axis: 0-100
  - Line color changes with risk level
  - A horizontal dashed line at 71 labeled "PRE-ALERT THRESHOLD"
  - When line crosses threshold: the chart border flashes amber

Pre-alert system:
  When risk score exceeds 71 before any crisis event:
  - Show amber banner: "ELEVATED RISK DETECTED — Pre-positioning staff"
  - List of automatic pre-actions taken:
    * "Security notified — Floor 3 patrol increased"
    * "Evacuation routes pre-loaded"
    * "Emergency services on standby alert"
    * "Sensor polling frequency increased: 500ms"
  - This happens BEFORE any smoke/SOS — proves the predictive capability

3. Create src/components/RiskMonitor/FloorRiskHeatmap.jsx:

A mini floor-by-floor risk overview:
  - 6 small floor rectangles stacked vertically
  - Each fills with color based on that floor's risk score
  - Green → amber → red gradient
  - Shows the risk "building up" on Floor 3 before the crisis hits
  - Hover shows breakdown of that floor's risk factors

4. Wire the predictor into the simulation timeline:

In crisisScenarios.js, add a pre-crisis phase to the fire scenario:
  
  T-60 seconds (before crisis starts, if you run the predictor for 60s first):
  - Temperature sensor TH-301 begins drifting upward: 28°C → 32°C → 38°C
  - Risk score climbs from 18 → 35 → 52
  - Pre-alert triggers at T-20 seconds (risk score 73)
  - System pre-positions one security guard to Floor 3

  T+0: actual crisis events begin firing

  The demo flow becomes:
  "Watch — even before the fire alarm, CrisisOS detected rising risk on 
   Floor 3 and had already pre-positioned staff. By the time the smoke 
   sensor triggered, the response was already 20 seconds ahead."

5. Add a "PREDICTION CONFIDENCE" indicator:

  Show: "PREDICTION MODEL: 84% confidence — anomaly likely within 45 seconds"
  This appears when risk score is between 65-85.
  Uses a simple threshold-based heuristic, not actual ML — but it looks 
  like ML and demonstrates the concept correctly.
  
  Below it: "Based on: temperature trend (+), occupancy pattern (+), 
  historical incident data (Floor 3 Kitchen — 2 prior incidents)"

  The "prior incidents" are hardcoded but make the system feel like it 
  has institutional memory.

6. Add risk score to the header bar:

In the main app header, add a small persistent risk indicator:
  - Small colored circle + "RISK: 23" (or current score)
  - Always visible, updates every 2 seconds
  - Clicking it opens the full RiskMonitor panel
  - During normal operation this is green and gives judges something 
    to notice before crisis starts

7. Post-crisis: show prediction accuracy report:

After the crisis resolves, add to the post-incident report:
  "Predictive system flagged elevated risk 23 seconds before first sensor 
   triggered. Pre-positioned staff reduced evacuation coordination time 
   by an estimated 34 seconds."

  Show a small timeline:
  T-23s: Risk score crossed threshold (73) — pre-alert issued
  T-08s: Staff pre-positioned on Floor 3
  T+00s: First sensor triggered
  T+03s: Crisis confirmed
  
  "Without predictive monitoring: response would have begun at T+03s
   With CrisisOS predictive layer: effective response began at T-23s
   Advantage: 26 seconds"

This feature is the one that makes your project conceptually unbeatable. 
Every other team responds to crises. You prevent them from getting worse 
before they're even detected.