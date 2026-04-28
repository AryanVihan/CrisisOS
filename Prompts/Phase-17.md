Build the edge compute and offline mode demonstration for CrisisOS.
This directly proves the real-world deployment argument: the system 
works even when internet goes down.

1. Create src/services/connectivityManager.js:

Manages the simulated connectivity state of the system.

State:
  - mode: 'cloud' | 'edge' | 'degraded'
  - cloudLatency: number (ms) — simulated API response time
  - edgeLatency: number (ms) — much lower, local processing
  - lastCloudSync: timestamp
  - offlineDuration: number (seconds since disconnect)
  - pendingSyncQueue: array of events that need to cloud sync

Functions:
  simulateDisconnect():
    Set mode to 'edge'
    Start offlineDuration counter
    Stop all Claude API calls (agents switch to cached/local responses)
    Show system notification: "CLOUD CONNECTIVITY LOST — SWITCHING TO EDGE"
    Log event to audit trail
  
  simulateReconnect():
    Set mode to 'cloud'
    Trigger sync of pendingSyncQueue to cloud
    Show: "CLOUD CONNECTIVITY RESTORED — SYNCING 47 EVENTS"
    Animate sync progress bar
  
  simulateDegraded():
    Set mode to 'degraded'
    Increase cloudLatency to 2000-5000ms
    Some cloud calls time out, fall back to edge
    Show: "DEGRADED CONNECTIVITY — EDGE FALLBACK ACTIVE"

2. Create src/components/EdgeMode/ConnectivityPanel.jsx:

A panel showing real-time connectivity status.

Main status display:
  Large status badge (green/amber/red):
    "CLOUD CONNECTED" — green, cloud icon
    "EDGE MODE ACTIVE" — amber, server icon  
    "DEGRADED — EDGE FALLBACK" — amber pulsing
  
  Connection metrics (update every second):
    Cloud API: [latency]ms | [status]
    Edge compute: [latency]ms | ACTIVE
    Kafka stream: [status]
    Last cloud sync: [timestamp]
  
  When in edge mode, show which systems are running locally:
    Checklist with green indicators:
    ✓ Sensor monitoring (edge)
    ✓ Anomaly detection (ONNX local)
    ✓ Floor map tracking (edge)
    ✓ Speaker control (edge)
    ✓ Staff dispatch (edge)
    ✗ Cloud AI agents (offline — using cached protocols)
    ✗ External notifications (queued for reconnect)
    ✗ Multi-venue federation (offline)
  
  Pending sync queue:
    "47 events queued for cloud sync"
    Small list of queued items with types

3. Build the offline demo sequence:

Create a "SIMULATE NETWORK FAILURE" button in the demo controller.

When clicked, trigger this sequence with visual drama:

  Step 1 (immediate):
    Screen-wide amber banner slides down from top:
    "⚠ NETWORK CONNECTIVITY LOST — ACTIVATING EDGE COMPUTE MODE"
    All cloud-connected indicators turn amber/red.
    Cloud latency display shows "TIMEOUT" then "OFFLINE".

  Step 2 (1 second later):
    Edge compute indicators turn green one by one (animated checklist).
    "LOCAL PROCESSING ACTIVE" badge appears.
    System status remains OPERATIONAL.
    Narration bar: "Internet connection lost. CrisisOS is now operating 
    entirely on local edge hardware. All critical functions remain active."

  Step 3 (2 seconds later):
    Show edge performance metrics:
    "Detection latency: 12ms (edge) vs 340ms (cloud)"
    "All 24 sensors: ACTIVE"
    "Speaker system: ACTIVE"
    "Staff dispatch: ACTIVE"
    The floor map, sensor grid, and speaker panels all continue 
    working normally — proving edge operation.

  Step 4 (if crisis is active during disconnect):
    Agents switch to pre-computed fallback responses 
    (cached crisis protocols, not Claude API).
    Show: "AI AGENTS: RUNNING CACHED EMERGENCY PROTOCOLS"
    The agents still output responses — just from a local decision tree 
    rather than the live API. This is architecturally honest and 
    demonstrates graceful degradation.

  Step 5 (when "RESTORE CONNECTION" is clicked):
    Green banner: "CLOUD CONNECTIVITY RESTORED"
    Sync animation: "SYNCING 47 QUEUED EVENTS TO CLOUD..."
    Progress bar fills over 3 seconds.
    "SYNC COMPLETE — All events logged to cloud audit trail"
    Agents switch back to live Claude API.

4. Create src/services/edgeFallback.js:

Pre-computed emergency protocols for when Claude API is unavailable.

const EDGE_PROTOCOLS = {
  fire: {
    detectionResponse: `EDGE PROTOCOL ACTIVE — Fire signature detected.
      Initiating standard fire emergency protocol.
      Location: Floor 3 East Wing.
      Classification: Kitchen fire, probable.
      Severity: CRITICAL (8/10).
      Confidence: 91% based on thermal + smoke + motion correlation.`,
    
    coordinationResponse: `EDGE COORDINATION PROTOCOL:
      FLOOR 3: Evacuate via Stairwell A immediately.
      FLOORS 1-2: Orderly evacuation via main stairwell.
      LOBBY: Clear to street, move 50m from building.
      STAFF: Security → Floor 3. Medical → Lobby. 
      Manager → Front entrance. All others → assist evacuation.`,
    
    bridgeResponse: JSON.stringify({
      incidentType: "fire",
      severity: 8,
      location: "Floor 3, East Wing, Kitchen Area",
      personsAffected: 23,
      accessRoute: "Main entrance, Stairwell A clear",
      timestamp: new Date().toISOString(),
      note: "Generated by edge compute — cloud sync pending"
    }, null, 2)
  },
  crowdSurge: { ... }
}

The fallback responses stream character-by-character using the same 
typewriter effect as live API — judges cannot tell the difference.
Show a small "EDGE PROTOCOL" badge instead of "AI RESPONSE" badge 
on the agent panels when using fallback — be transparent about it.

5. Add edge metrics to the main header:

In the header bar (next to the cloud sync status from earlier prompts):
  Small indicator showing:
  - When cloud: "CLOUD" with green dot + latency (e.g. "~340ms")
  - When edge: "EDGE" with amber dot + local latency ("~12ms")
  
  Tooltip on hover: "Click to simulate network failure"
  Clicking it triggers the offline sequence.
  
  This gives judges something to notice and ask about proactively.

6. Add to post-incident report:

A section: "SYSTEM RESILIENCE"
  "Duration of edge-only operation: 45 seconds"
  "Events processed on edge: 47"  
  "Critical functions maintained: 8/8"
  "Functions requiring cloud: 3/3 (queued and synced on reconnect)"
  "Data integrity: 100% — no events lost during disconnection"

This section directly answers the "what if the internet goes down 
during a real emergency" question that every practical judge will ask.
The answer is: nothing stops. Everything keeps working. 
And you can prove it live during the demo.