Build a thermal camera simulation panel for CrisisOS. This is a canvas-based 
false-color heat visualization that shows a fire developing before any smoke 
sensor fires — the visual proof of predictive detection.

1. Create src/components/Thermal/ThermalCamera.jsx:

A single thermal camera feed rendered on HTML5 Canvas (320x240px).

False-color mapping (temperature → color):
  - 15-20°C: deep blue (#0a0a8f)
  - 20-25°C: blue (#1a3aff)
  - 25-30°C: cyan (#00cfcf)
  - 30-35°C: green (#00cc44)
  - 35-40°C: yellow (#ffee00)
  - 40-50°C: orange (#ff8800)
  - 50-65°C: red (#ff2200)
  - 65°C+:   white-red (#ffffff blending to #ff0000)

Floor plan thermal rendering:
  Draw a simplified floor plan as a grid of 64x48 temperature cells 
  (each cell = 5x5px on canvas).
  
  Initialize temperature grid:
  - Corridor cells: 22°C baseline
  - Room cells: 23°C baseline  
  - Kitchen zone (top-right quadrant): 28°C baseline (always warmer)
  - Stairwell cells: 21°C baseline
  - Exterior walls: 18°C
  
  Add natural variation: each cell gets ±0.5°C random noise per frame 
  (subtle flicker that makes it look real).

Heat source simulation:
  Define a HeatSource class: { x, y, intensity, radius, spreading }
  
  Pre-crisis phase (T-60s to T+0):
    At T-50s: spawn heat source at kitchen zone (x:48, y:12)
    intensity starts at 35°C, grows +0.3°C per second
    radius starts at 2 cells, expands +0.02 cells per second
    spreading: true
  
  Crisis phase (T+0 onwards):
    intensity jumps to 65°C, grows +1.2°C per second
    radius expands +0.15 cells per second
    spawn secondary heat source nearby at T+15s (fire spreading)
  
  Heat diffusion algorithm (run each frame):
    For each cell adjacent to a heat source:
      cell.temp = lerp(cell.temp, heatSource.intensity * falloff, 0.08)
    where falloff = 1 - (distance / heatSource.radius)
    This creates realistic heat bloom spreading outward from source.

Camera UI overlay (same aesthetic as CCTV):
  - Corner brackets in white
  - Top-left: "THERM-01 · FL3-KITCHEN" in monospace
  - Top-right: live timestamp
  - Bottom-left: "IR MODE" indicator
  - Bottom-right: temperature scale bar (vertical gradient strip with 
    °C labels: 15°C at bottom, 70°C at top, matching the false-color map)
  - Center crosshair on hottest detected point
  - "HOTSPOT: 47.3°C" label next to crosshair, updating live

Anomaly detection overlay:
  When any cell exceeds 42°C:
    Draw an amber dashed rectangle around the hot zone
    Label: "THERMAL ANOMALY — ZONE 3K"
  When any cell exceeds 55°C:
    Rectangle turns red, pulsing
    Label: "CRITICAL HEAT DETECTED"
    This triggers a pre-alert entry in the alert feed
  When any cell exceeds 65°C:
    Full border flashes red
    Label: "FIRE SIGNATURE CONFIRMED"

2. Create src/components/Thermal/ThermalGrid.jsx:

A 2x2 grid of thermal cameras covering different zones:
  - THERM-01: Floor 3 Kitchen (CRISIS CAMERA — hot zone develops here)
  - THERM-02: Floor 3 East Corridor (heat spreads here after T+15s)
  - THERM-03: Floor 2 (slight warmth from above, normal range)
  - THERM-04: Lobby (baseline temps, normal)

Each feed runs independently at 10fps.
Below each feed: min/max temp reading + anomaly score.

When THERM-01 detects anomaly before smoke sensors fire:
  Show banner above grid: 
  "THERMAL ANOMALY DETECTED — 23 SECONDS BEFORE SMOKE SENSOR TRIGGERED"
  This is your predictive proof moment. Make it prominent.

3. Add temperature timeline chart:

Below the camera grid, show a small SVG line chart:
  - X axis: last 90 seconds
  - 4 lines: one per camera, color coded
  - THERM-01 line climbs dramatically before crisis
  - Vertical dashed line marking "SMOKE SENSOR TRIGGER" point
  - The thermal line crossed the anomaly threshold visibly to the LEFT 
    of that marker — visual proof of early detection
  - Label: "Thermal detection lead time: 23s"

4. Add to the surveillance tab:

In the main content area tabs (FLOOR MAP | SURVEILLANCE | THERMAL):
  Wire the THERMAL tab to show ThermalGrid.
  
  Add a split view option: 50% CCTV grid, 50% thermal grid side by side.
  Label this view "MULTI-SENSOR VIEW" — it's your most impressive 
  single screen when presented to judges.

5. Wire into simulation and risk predictor:

In riskPredictor.js from Prompt 13:
  Add thermalAnomalyScore as a risk factor.
  When THERM-01 exceeds 42°C: add +20 to risk score.
  When THERM-01 exceeds 55°C: add +35 to risk score.
  These fire BEFORE the smoke sensor events in the scenario timeline.
  
In useCrisisSimulation:
  At T-50s: begin heat source growth on THERM-01.
  At T-23s: thermal anomaly threshold crossed, pre-alert fires.
  At T+0: smoke sensor fires (now visibly AFTER the thermal warning).
  
  This sequencing is everything. The demo story becomes:
  "Our thermal cameras detected abnormal heat 23 seconds before the 
   smoke alarm. The system had already begun pre-positioning staff 
   before a single traditional sensor triggered."