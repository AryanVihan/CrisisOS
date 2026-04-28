import Anthropic from '@anthropic-ai/sdk'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const MODEL = 'claude-opus-4-5'

const client = API_KEY
  ? new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true })
  : null

// ── Fallback responses ─────────────────────────────────────────────────────

const FALLBACK_DETECTION = `INCIDENT TYPE: Kitchen Fire — Thermal Runaway (Class B)

LOCATION: Floor 3 East Wing Kitchen — Multi-sensor confirmation across zones T-3A (312°C), SM-3B (density 0.78 g/m³), CO-3A (4,200 ppm). Epicentre localised to commercial kitchen, east corridor junction.

SPREAD PATTERN: Radial expansion from ignition point. HVAC thermal migration confirmed to Floor 4 ceiling cavity. Smoke column tracking north-south corridor axis — primary escape route compromised. Convective heat rise indicates 8–14 minute window before full corridor saturation.

IMMEDIATE THREATS:
• Thermal runaway active — surface temps 312°C+ at origin, expanding
• Carbon monoxide 4,200 ppm east wing — IDLH threshold exceeded
• Guest SOS received Room 312 — possible trapped occupant
• 14 persons detected in compromised north corridor (motion sensors)
• Floor 4 at secondary risk via ventilation shaft heat transfer

CONFIDENCE LEVEL: 94% — Four independent sensor modalities corroborating. Direct SOS confirmation received. Signature matches Class B commercial kitchen fire with accelerant involvement.`

const FALLBACK_COORDINATION = `EVACUATION PLAN:
• Floor 3 [CRITICAL]: Immediate full-floor evacuation. East wing route blocked — all guests route via West Stairwell B only. Rooms 301–315 priority sweep. Estimated 62 persons to clear.
• Floor 4 [ELEVATED]: Precautionary evacuation via both stairwells. Heat migration confirmed. 4-minute target for full clearance.
• Floors 1–2 [STANDBY]: Shelter-in-place. Pre-position evacuation teams at stairwell heads pending escalation.
• Lobby [STAGING]: Clear main entrance zone. Assembly point: Grand Avenue North — 30m clear perimeter. Reception acts as guest accounting checkpoint.

STAFF ASSIGNMENTS:
• Marcus Reid — Security: Floor 3, West Stairwell B entrance — guest flow control, mobility assistance, Room 312 SOS follow-up
• Sarah Chen — Medical: Lobby triage station — receive evacuees, injury assessment, triage tagging
• James Okafor — Security: Floor 4 sweep — door-to-door confirmation, target 4 minutes
• Maria Santos — Manager: Reception coordination — fire department liaison, master key handover, guest accounting oversight

ZONE COMMUNICATIONS:
• Floor 3 PA: "Emergency evacuation order — all Floor 3 guests, evacuate immediately via the WEST stairwell. Do not use north stairwell or elevators. Proceed to lobby assembly point. Staff are en route to assist."
• Floor 4 PA: "Precautionary evacuation — all Floor 4 guests, please proceed to nearest stairwell now. Do not use elevators. This is a precautionary measure."
• Lobby/All-call PA: "Horizon Grand Hotel emergency evacuation in progress. All guests proceed to Grand Avenue assembly point outside main entrance. Staff will direct you."

PRIORITY ACTIONS:
1. Confirm Room 312 SOS — dispatch Marcus Reid immediately after stairwell position established
2. Isolate Floor 3 elevator access — prevent guests attempting elevator use
3. Activate sprinkler zone 3E (kitchen + east corridor)
4. Gas isolation — service corridor switch adjacent to east wing kitchen
5. Complete Floor 3 guest accountability sweep (62 guests registered)

ESTIMATED COORDINATION TIME: 4 minutes to floor clearance — 11 minutes full hotel evacuation`

const FALLBACK_BRIDGE = `{
  "incidentType": "Kitchen Fire — Thermal Runaway, Class B Commercial",
  "severity": 8,
  "confirmedLocation": "Floor 3 East Wing Kitchen, Horizon Grand Hotel, 1 Horizon Plaza, Grand Avenue",
  "affectedZones": ["Floor 3 East Wing Kitchen", "Floor 3 North Corridor", "Floor 4 (secondary — heat migration via HVAC)"],
  "estimatedPersonsAffected": 78,
  "unaccountedPersons": 4,
  "knownHazards": [
    "Thermal runaway active — 312°C+ at origin zone",
    "CO₂ 4200 ppm east wing — IDLH exceeded, oxygen depletion risk",
    "Smoke density 0.78 g/m³ north corridor — near-zero visibility",
    "HVAC heat migration to Floor 4 ceiling cavity confirmed"
  ],
  "blockedRoutes": ["Floor 3 North Stairwell — smoke-filled", "Floor 3 East Corridor — fire zone, impassable"],
  "clearAccessRoutes": ["Floor 3 West Stairwell B — confirmed clear", "Floor 3 South Fire Escape — confirmed clear", "Lobby Main Entrance — clear"],
  "recommendedEntryPoint": "Main Entrance — Grand Avenue South. Fire apparatus lane unobstructed. West service entrance available for secondary apparatus and ambulance staging.",
  "staffContactOnScene": "Marcus Reid (Security, Floor 3, Radio Ch.7), Sarah Chen (Medical, Lobby Triage, Ch.3), James Okafor (Security, Floor 4, Ch.7), Maria Santos (Manager, Reception, Ch.1)",
  "specialConsiderations": "SOS active Room 312 — possible trapped occupant, unconfirmed. Room 315 elderly guest, flagged mobility-limited. Gas isolation switch located in service corridor immediately adjacent east wing kitchen — manual shutoff required. Commercial fryer system may contain residual accelerant.",
  "timestampGenerated": "LIVE",
  "hotelAddress": "1 Horizon Plaza, Grand Avenue, City Center — GPS: CrisisOS auto-transmit",
  "floorPlanNote": "Full digital floor plans transmitted via CrisisOS secure channel. Physical laminated copies at main reception desk, drawer 2. Elevator shaft positions marked — all isolated. Sprinkler zone map available on-site."
}`

// ── Stream helper ──────────────────────────────────────────────────────────

async function streamResponse(system, userMessage, onToken, signal) {
  let fullText = ''
  const stream = await client.messages.create(
    { model: MODEL, max_tokens: 900, stream: true, system, messages: [{ role: 'user', content: userMessage }] },
    { signal }
  )
  for await (const event of stream) {
    if (signal?.aborted) break
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      onToken(event.delta.text)
      fullText += event.delta.text
    }
  }
  return fullText
}

async function simulateStream(text, onToken, signal, chunkSize = 3, delayMs = 18) {
  let fullText = ''
  for (let i = 0; i < text.length; i += chunkSize) {
    if (signal?.aborted) break
    const chunk = text.slice(i, i + chunkSize)
    onToken(chunk)
    fullText += chunk
    await new Promise(r => setTimeout(r, delayMs))
  }
  return fullText
}

// ── Agent 1 — Detection & Analysis ────────────────────────────────────────

const DETECTION_SYSTEM = `You are the Detection and Analysis Agent for CrisisOS, an emergency response system at the Horizon Grand Hotel. You receive raw sensor data and events and your job is to rapidly assess what type of emergency is occurring, its severity, exact location, how it is spreading, and immediate threats. Be concise, clinical, and precise. Respond in structured sections: INCIDENT TYPE, LOCATION, SPREAD PATTERN, IMMEDIATE THREATS, CONFIDENCE LEVEL. Use professional emergency response language.`

export async function runDetectionAgent(crisisEvents, sensorReadings, floorMap, onToken, signal) {
  const eventLines = crisisEvents.slice(-10).map(e =>
    `[T+${e.t ?? 0}s] ${(e.type ?? '').toUpperCase()} | ${e.floor} — ${e.zone} | ${e.message} | Severity: ${e.severity}`
  ).join('\n')

  const sensorLines = sensorReadings
    .filter(s => s.sensorStatus && s.sensorStatus !== 'normal')
    .slice(0, 12)
    .map(s => {
      const val = typeof s.currentValue === 'number' ? s.currentValue.toFixed(1) : s.currentValue
      return `${s.id} (${s.type}) @ ${s.floor}/${s.zone}: ${val} ${s.unit ?? ''} [${(s.sensorStatus ?? '').toUpperCase()}]`
    }).join('\n')

  const userMessage = `LIVE CRISIS DATA — Horizon Grand Hotel Emergency Systems

TRIGGERED EVENTS (most recent):
${eventLines || 'Monitoring — no events triggered yet.'}

SENSOR READINGS (anomalous only):
${sensorLines || 'All sensors nominal.'}

Provide your incident assessment now.`

  if (!client) return simulateStream(FALLBACK_DETECTION, onToken, signal)

  try {
    return await streamResponse(DETECTION_SYSTEM, userMessage, onToken, signal)
  } catch (err) {
    if (err.name === 'AbortError') return ''
    return simulateStream(FALLBACK_DETECTION, onToken, signal)
  }
}

// ── Agent 2 — Coordination & Response ─────────────────────────────────────

const COORDINATION_SYSTEM = `You are the Coordination and Response Agent for CrisisOS. You receive an incident assessment and must immediately generate a coordinated response plan. You control staff dispatch, guest evacuation routing, and zone-by-zone communication. Output sections: EVACUATION PLAN (per floor instructions), STAFF ASSIGNMENTS (name: task: location), ZONE COMMUNICATIONS (what to broadcast on speakers in each zone), PRIORITY ACTIONS (ordered list), ESTIMATED COORDINATION TIME.`

export async function runCoordinationAgent(detectionResult, staffList, guestCount, evacuationRoutes, onToken, signal) {
  const staffLines = staffList.slice(0, 12).map(s =>
    `${s.name} — ${s.role} — Floor: ${s.floor} — Status: ${s.status}`
  ).join('\n')

  const routeLines = Object.entries(evacuationRoutes).map(([floor, routes]) => {
    const pri = routes.primary?.join(' → ') ?? ''
    const sec = routes.secondary?.join(' → ') ?? ''
    return `${floor}: Primary: ${pri} | Secondary: ${sec}`
  }).join('\n')

  const userMessage = `INCIDENT ASSESSMENT FROM DETECTION AGENT:
${detectionResult}

CURRENT HOTEL STATE:
Total guests on premises: ${guestCount}

Staff on duty:
${staffLines}

Established evacuation routes:
${routeLines}

Generate the coordinated response plan now.`

  if (!client) return simulateStream(FALLBACK_COORDINATION, onToken, signal)

  try {
    return await streamResponse(COORDINATION_SYSTEM, userMessage, onToken, signal)
  } catch (err) {
    if (err.name === 'AbortError') return ''
    return simulateStream(FALLBACK_COORDINATION, onToken, signal)
  }
}

// ── Agent 3 — Emergency Bridge ─────────────────────────────────────────────

const BRIDGE_SYSTEM = `You are the Emergency Bridge Agent for CrisisOS. You generate the official first responder brief that gets transmitted to fire department, police, and ambulance services the moment they are dispatched. This brief must be precise, structured, and contain everything responders need before they arrive. Output a JSON object with fields: incidentType, severity (1-10), confirmedLocation, affectedZones, estimatedPersonsAffected, unaccountedPersons, knownHazards, blockedRoutes, clearAccessRoutes, recommendedEntryPoint, staffContactOnScene, specialConsiderations, timestampGenerated, hotelAddress, floorPlanNote. Output valid JSON only.`

export async function runEmergencyBridgeAgent(detectionResult, coordinationResult, hotelData, onToken, signal) {
  const userMessage = `INCIDENT ASSESSMENT:
${detectionResult}

COORDINATION PLAN:
${coordinationResult}

HOTEL DATA:
Address: ${hotelData.address}
Total floors: ${hotelData.floors}
Total guests on premises: ${hotelData.totalGuests}
Staff count: ${hotelData.staff?.length ?? 0}

Generate the emergency services JSON brief now. Output JSON only.`

  if (!client) return simulateStream(FALLBACK_BRIDGE, onToken, signal, 2, 12)

  try {
    return await streamResponse(BRIDGE_SYSTEM, userMessage, onToken, signal)
  } catch (err) {
    if (err.name === 'AbortError') return ''
    return simulateStream(FALLBACK_BRIDGE, onToken, signal, 2, 12)
  }
}
