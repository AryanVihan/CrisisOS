Build a simulated CCTV surveillance panel for CrisisOS that makes the 
computer vision agent visually tangible. Uses canvas-based animation — 
no video files needed.

1. Create src/components/CCTVPanel/CCTVFeed.jsx:

A single camera feed component rendered on an HTML5 Canvas (320x240px).

Draw a simulated hotel scene procedurally:
  - Background: dark gray rectangle representing a corridor
  - Floor line: slightly lighter horizontal band at bottom 30%
  - Wall texture: subtle vertical lines
  - Ceiling elements: 2-3 small rectangles for light fixtures
  - Door rectangles on left and right walls

Person simulation:
  - Render 3-8 moving "persons" as simple shapes:
    Rectangle body (10x20px) + circle head (8px) in a neutral gray
  - Each person has: x, y, velocityX, velocityY, targetX, targetY
  - Normal state: persons wander slowly, random walk, bounce off walls
  - Alert state: persons move faster, cluster toward one edge (panic behavior)
  - Evacuation state: all persons move toward the same exit point, 
    speed increases, spacing decreases (crowd simulation)

Bounding box detection overlay:
  - Draw green rectangle around each person: "PERSON DETECTED"
  - In normal state: green boxes, label "TRACKING"
  - In alert state: yellow boxes, label "ELEVATED MOVEMENT"  
  - When crisis active: red boxes on persons near the crisis zone, 
    label "ANOMALY DETECTED"
  - Show person count: "PERSONS: X" in top-left corner in green monospace text

Camera UI overlay:
  - Corner brackets (4 L-shapes in the corners) — classic CCTV aesthetic
  - Top-left: camera ID ("CAM-03 · FL3-EAST-CORRIDOR")
  - Top-right: live timestamp updating every second
  - Bottom-left: REC indicator (red dot + "REC" blinking every second)
  - Bottom-right: resolution ("1080p")
  - Subtle scanline effect: very faint horizontal lines across entire canvas
  - Slight noise/grain: randomly change 0.1% of pixels each frame to 
    create film grain effect

2. Create src/components/CCTVPanel/CCTVGrid.jsx:

A 2x2 grid showing 4 camera feeds simultaneously.

Camera assignments:
  - CAM-01: Lobby (5-8 persons normal, 15+ during evacuation)
  - CAM-02: Floor 2 Corridor (2-4 persons normal)
  - CAM-03: Floor 3 East Corridor (CRISIS CAMERA — 4-6 persons, 
    anomaly triggers here first)
  - CAM-04: Main Exit (0-2 persons normal, fills during evacuation)

Each feed runs its own animation loop using requestAnimationFrame.
Canvas updates at 15fps to simulate real CCTV frame rate.

When simulation state changes:
  - severity 0-3: all cameras show normal wandering behavior
  - severity 4-6: CAM-03 shows alert behavior, yellow boxes
  - severity 7+: CAM-03 shows anomaly (red boxes, fast movement), 
    others show increasing traffic
  - evacuation active: CAM-04 shows stream of persons arriving at exit, 
    count rising — visually proves people are getting out

3. Add detection metrics overlay on each feed:

Small stats bar below each camera:
  - Person count (live number)
  - Movement score: 0-100 (how much motion is detected)
  - Anomaly score: 0-100
  - Status badge: NORMAL / ELEVATED / ANOMALY

When anomaly score > 70 on any camera: 
  - That camera feed gets a red border (CSS box-shadow)
  - An "ANOMALY DETECTED" badge flashes on the feed
  - The Vision Agent in the agent panel references this camera ID 
    in its analysis output

4. Create a camera expansion feature:

Clicking any camera feed expands it to fill the main area 
(replaces floor map temporarily). 
Show a back button to return to floor map.
In expanded view, bounding boxes are larger and more detailed.
Show a detection confidence percentage next to each bounding box.

5. Add a "VISION AGENT ACTIVE" indicator:

When the Vision Agent (from Prompt 4) is running:
  - All 4 camera feeds show a purple scanning line sweeping top to bottom
  - Text overlay: "AI ANALYSIS IN PROGRESS"
  - After analysis completes: show "ANALYSIS COMPLETE — 3 ANOMALIES FLAGGED"
    with the anomalous camera highlighted

6. Wire into the main layout:

Add the CCTV grid as a tab in the main content area alongside the floor map.
Tab labels: "FLOOR MAP" | "SURVEILLANCE" | "THERMAL" (thermal is placeholder)

On the floor map, clicking a room zone should switch to the nearest 
camera feed automatically.

This panel makes your Vision Agent claim completely real to judges. 
Instead of "we have computer vision," you show 4 live feeds with 
bounding boxes updating in real time. The grain, scanlines, REC indicator, 
and corner brackets make it look exactly like a real CCTV system.