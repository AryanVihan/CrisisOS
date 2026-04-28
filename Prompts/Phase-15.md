Build a visual agent communication flow diagram for CrisisOS that shows 
data moving between AI agents in real time. Makes the multi-agent 
architecture immediately obvious to non-technical judges.

1. Create src/components/AgentFlow/AgentFlowVisualizer.jsx:

An animated SVG diagram (680px wide, 320px tall) showing the three agents 
as nodes with data flowing between them.

Node layout (horizontal, left to right):
  
  Left node — Detection Agent (blue):
    Rounded rect, 140x80px, at x=40, y=120
    Label: "Detection Agent"
    Sublabel: "Analyzes signals"
    Status indicator dot (green/amber/red)
    Input feeds shown as small arrows coming from LEFT:
      - "Sensor data" arrow from x=0
      - "SOS signals" arrow from x=0  
      - "Camera feed" arrow from x=0
    These 3 small input arrows animate (dashed, moving right) 
    when agent is active.

  Center node — Coordination Agent (amber):
    Rounded rect, 140x80px, at x=270, y=120
    Label: "Coordination Agent"
    Sublabel: "Plans response"
    Status indicator dot

  Right node — Emergency Bridge Agent (red):
    Rounded rect, 140x80px, at x=500, y=120
    Label: "Emergency Bridge"
    Sublabel: "Contacts services"
    Output arrows going RIGHT toward x=680:
      - "Fire dept" arrow
      - "Police" arrow
      - "Ambulance" arrow
    These animate when agent completes.

2. Data packet animation between nodes:

Create an animated "data packet" that travels along the connection lines.

Packet appearance: small rounded rect (24x14px), filled with the 
source node color, containing abbreviated text of what's being passed.

Connection 1: Detection → Coordination
  When Detection Agent completes:
    Animate a packet traveling from right edge of Detection node 
    to left edge of Coordination node along a straight horizontal path.
    Packet label: "INCIDENT: FIRE · FLOOR 3 · SEV:8"
    Animation: 1.2 seconds, ease-in-out
    Leave a fading trail behind the packet (3 ghost copies at 30%, 
    20%, 10% opacity following it)
    
Connection 2: Coordination → Emergency Bridge
  When Coordination Agent completes:
    Animate packet: "PLAN READY · 8 STAFF · ROUTES SET"
    Same animation style, 1.2 seconds

Connection 3: All agents → Shared Memory (optional center element):
  Show a small database cylinder in the center-bottom area
  Dashed lines from all 3 agents pointing down to it
  Label: "Shared context"
  This represents the agents sharing state — a technically accurate 
  detail that impresses engineers.

3. Payload inspector panel:

Below the flow diagram, show a panel that reveals the actual data 
being passed between agents.

When Detection → Coordination packet fires:
  Expand a code block showing the actual JSON being passed:
  {
    "incidentType": "fire",
    "confidence": 0.94,
    "location": { "floor": 3, "zone": "east", "room": "312-area" },
    "activeSensors": ["SM-302", "TH-301", "CV-03"],
    "severityScore": 8,
    "spreadRisk": "HIGH",
    "timestamp": "14:32:18.445"
  }
  
  Syntax-highlighted (JSON keys in blue, strings in green, 
  numbers in amber) — looks like a real IDE.
  
  Label above: "AGENT HANDOFF PAYLOAD — Detection → Coordination"
  Animate the JSON appearing character by character (typewriter, 8ms/char).

When Coordination → Bridge packet fires:
  Show coordination plan JSON:
  {
    "evacuationPlan": {
      "floor3": "stairwellA_primary",
      "floor2": "stairwellA_secondary", 
      "floor1": "mainExit",
      "lobby": "frontEntrance"
    },
    "staffAssignments": [...],
    "estimatedEvacTime": "4m30s",
    "servicesRequired": ["fire", "ambulance"]
  }

4. Agent timing metrics:

Below each node, show:
  - "Started: T+0:12"
  - "Completed: T+0:19" 
  - "Duration: 7.2s"
  
  And between nodes:
  - "Handoff latency: 0.3s"
  
  This proves the system is fast and measurable.

5. Add "PARALLEL EXECUTION" indicator:

When all 3 agents have been triggered and are running:
  Show a banner above the diagram:
  "3 AGENTS EXECUTING IN PARALLEL — Total wall time: 8.4s"
  
  Show a Gantt-style mini chart (3 horizontal bars, stacked):
  |--Detection (7.2s)--|
       |--Coordination (6.8s)--|
            |--Bridge (5.1s)--|
  
  Total sequential would be: 19.1s
  Parallel actual: 8.4s
  Show: "PARALLELIZATION ADVANTAGE: 2.3x faster"
  
  This is technically accurate and conceptually impressive.

6. Wire into AgentPanel from Prompt 4:

Add a toggle at the top of the AgentPanel:
  [TERMINAL VIEW] [FLOW VIEW]
  
  Terminal view: existing streaming text output (Prompt 4)
  Flow view: this new AgentFlowVisualizer component
  
  Default to Flow view when severity first hits 5 
  (more visually impressive for the crucial first moments).
  Switch to Terminal view when a judge asks "show me what the AI is saying."
  
  Both views receive the same underlying agent state — 
  they are just two presentations of the same data.

The flow visualizer answers the question every judge will ask: 
"How do the agents actually talk to each other?" 
Show them this diagram and the question is answered before they ask it.