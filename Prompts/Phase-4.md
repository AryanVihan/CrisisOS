Build the multi-agent AI pipeline for CrisisOS. This is the technical showpiece — three specialized AI agents that reason in parallel and display their thinking visibly on screen.

Create src/services/agents.js:

This file exports three agent functions that call the Anthropic API. Use the API key from import.meta.env.VITE_ANTHROPIC_API_KEY. Use model claude-opus-4-5. Each call uses streaming so responses appear word by word.

Agent 1 — Detection & Analysis Agent:
Function: runDetectionAgent(crisisEvents, sensorReadings, floorMap)
System prompt: "You are the Detection and Analysis Agent for CrisisOS, an emergency response system at the Horizon Grand Hotel. You receive raw sensor data and events and your job is to rapidly assess what type of emergency is occurring, its severity, exact location, how it is spreading, and immediate threats. Be concise, clinical, and precise. Respond in structured sections: INCIDENT TYPE, LOCATION, SPREAD PATTERN, IMMEDIATE THREATS, CONFIDENCE LEVEL. Use professional emergency response language."
User message: Dynamically constructed from the actual crisis events and sensor readings passed in.
Stream the response token by token.

Agent 2 — Coordination & Response Agent:  
Function: runCoordinationAgent(detectionResult, staffList, guestCount, evacuationRoutes)
System prompt: "You are the Coordination and Response Agent for CrisisOS. You receive an incident assessment and must immediately generate a coordinated response plan. You control staff dispatch, guest evacuation routing, and zone-by-zone communication. Output sections: EVACUATION PLAN (per floor instructions), STAFF ASSIGNMENTS (name: task: location), ZONE COMMUNICATIONS (what to broadcast on speakers in each zone), PRIORITY ACTIONS (ordered list), ESTIMATED COORDINATION TIME."
User message: Built from detection result and hotel state.
Stream the response.

Agent 3 — Emergency Bridge Agent:
Function: runEmergencyBridgeAgent(detectionResult, coordinationResult, hotelData)
System prompt: "You are the Emergency Bridge Agent for CrisisOS. You generate the official first responder brief that gets transmitted to fire department, police, and ambulance services the moment they are dispatched. This brief must be precise, structured, and contain everything responders need before they arrive. Output a JSON object with fields: incidentType, severity (1-10), confirmedLocation, affectedZones, estimatedPersonsAffected, unaccountedPersons, knownHazards, blockedRoutes, clearAccessRoutes, recommendedEntryPoint, staffContactOnScene, specialConsiderations, timestampGenerated, hotelAddress, floorPlanNote."
Output valid JSON only.
Stream the response.

Create src/components/AgentPanel/AgentPanel.jsx:
A right-side panel showing all three agents. Each agent has:
- Header with agent name, role icon, and status badge (STANDBY / ANALYZING / ACTIVE / COMPLETE)
- A terminal-style output area with monospace font, dark background
- Text streams in character by character (typewriter effect using the stream)
- A subtle animated border when the agent is actively running
- Color coding: Detection = blue, Coordination = amber, Emergency Bridge = red

Create src/components/AgentPanel/AgentOrchestrator.jsx:
This manages the sequencing:
1. When severity hits 5, auto-trigger Detection Agent with current crisis data
2. When Detection Agent finishes (or after 8 seconds), trigger Coordination Agent
3. When Coordination Agent finishes (or after 8 seconds), trigger Emergency Bridge Agent
4. All three run visibly on screen, their outputs building in real time
5. Show a progress indicator: "Agent 1 of 3 — Detection Analysis" with timing

Important: Use actual streaming from the Anthropic SDK. The text must visibly type itself onto the screen. This is your most impressive technical demo moment.

Handle API errors gracefully — if the call fails, show a realistic-looking fallback response so the demo never breaks.