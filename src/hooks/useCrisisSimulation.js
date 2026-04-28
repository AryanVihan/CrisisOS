import { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { SENSORS as BASE_SENSORS, GUESTS as BASE_GUESTS, STAFF as BASE_STAFF } from '../data/hotelData.js'
import { ALL_SCENARIOS } from '../data/crisisScenarios.js'

/* ── Helpers ─────────────────────────────────────────────────── */
const SENSOR_UNITS = { smoke: 'density', temperature: '°C', motion: 'persons', co2: 'ppm' }

function getBaselineValue(type) {
  return { smoke: 0.02, temperature: 22, motion: 1, co2: 420 }[type] ?? 0
}

function getSensorStatus(type, value) {
  if (type === 'smoke')       return value > 0.3  ? 'CRITICAL' : value > 0.1  ? 'ELEVATED' : 'NORMAL'
  if (type === 'temperature') return value > 80   ? 'CRITICAL' : value > 50   ? 'ELEVATED' : 'NORMAL'
  if (type === 'motion')      return value > 10   ? 'CRITICAL' : value > 5    ? 'ELEVATED' : 'NORMAL'
  if (type === 'co2')         return value > 1500 ? 'CRITICAL' : value > 800  ? 'ELEVATED' : 'NORMAL'
  return 'NORMAL'
}

function initSensors() {
  return BASE_SENSORS.map(s => {
    const base = getBaselineValue(s.type)
    return {
      ...s,
      currentValue: base,
      unit: SENSOR_UNITS[s.type] ?? '',
      history: Array(10).fill(base),
      sensorStatus: 'NORMAL',
      lastUpdated: Date.now(),
    }
  })
}

function pad2(n) { return String(n).padStart(2, '0') }
function formatElapsed(s) {
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
}

function calcSeverityScore(events) {
  if (!events.length) return 0
  const last = events[events.length - 1]
  const base = last.severityContribution / 10
  const recentTypes = new Set(events.filter(e => e.triggeredAt >= (last.triggeredAt - 30)).map(e => e.type))
  const compound = 1 + Math.max(0, recentTypes.size - 1) * 0.12
  return Math.min(10, base * compound)
}

const AGENT_TEMPLATES = {
  temperature: [
    e => ({ agent: 'SensorMonitor',    msg: `${e.sensorId} reads ${e.value}${e.unit} in ${e.zone} — anomaly flagged.`, level: 'warning' }),
    e => ({ agent: 'ThreatAssessor',   msg: `Thermal event on ${e.floor}: ${e.value > 100 ? 'FIRE CONFIRMED' : 'elevated heat signature detected'}.`, level: 'critical' }),
  ],
  smoke: [
    e => ({ agent: 'SensorMonitor',    msg: `Smoke density ${e.value} in ${e.zone}. Alert raised.`, level: 'warning' }),
    e => ({ agent: 'EvacPlanner',      msg: `Reviewing evacuation routes for ${e.floor}. Standby.`, level: 'warning' }),
  ],
  motion: [
    e => ({ agent: 'SensorMonitor',    msg: `Motion surge: ${e.value} persons detected at ${e.zone}.`, level: 'info' }),
    e => ({ agent: 'StaffCoordinator', msg: `Directing available staff toward ${e.zone}.`, level: 'warning' }),
  ],
  co2: [
    e => ({ agent: 'SensorMonitor',    msg: `CO₂ at ${e.value} ppm in ${e.zone}. Threshold exceeded.`, level: 'critical' }),
    e => ({ agent: 'ThreatAssessor',   msg: `Air quality degradation on ${e.floor}. Oxygen depletion risk assessed.`, level: 'critical' }),
  ],
  sos: [
    e => ({ agent: 'CrisisOrchestrator', msg: `SOS RECEIVED: ${e.zone}. Dispatching medical + security NOW.`, level: 'critical' }),
    e => ({ agent: 'StaffCoordinator',   msg: `Medical team redirected to ${e.zone}. ETA under 2 min.`, level: 'critical' }),
  ],
  cctv: [
    e => ({ agent: 'ThreatAssessor',   msg: `CCTV analysis: crowd anomaly detected at ${e.zone}.`, level: 'warning' }),
    e => ({ agent: 'EvacPlanner',      msg: `Updating crowd flow model. Rerouting guests away from ${e.zone}.`, level: 'warning' }),
  ],
}

const INITIAL_LOGS = [
  { id: 1, time: '00:00:01', agent: 'SensorMonitor',    msg: 'All 24 sensors online. Sweep initiated.', level: 'info' },
  { id: 2, time: '00:00:02', agent: 'ThreatAssessor',   msg: 'Baseline thresholds loaded. No anomalies.', level: 'info' },
  { id: 3, time: '00:00:03', agent: 'StaffCoordinator', msg: '12 staff members checked in. Shifts nominal.', level: 'info' },
  { id: 4, time: '00:00:05', agent: 'GuestTracker',     msg: '251 guests distributed across 5 floors.', level: 'info' },
  { id: 5, time: '00:00:06', agent: 'EvacPlanner',      msg: 'All 8 emergency exits confirmed clear.', level: 'success' },
  { id: 6, time: '00:00:09', agent: 'CrisisOrchestrator', msg: 'System ready. Awaiting scenario trigger.', level: 'success' },
]

/* ── Hook ────────────────────────────────────────────────────── */
export function useCrisisSimulation() {
  const [simulationStatus, setSimulationStatus] = useState('idle')
  const [elapsedSeconds, setElapsedSeconds]     = useState(0)
  const [sensors, setSensors]                   = useState(initSensors)
  const [crisisEvents, setCrisisEvents]         = useState([])
  const [severityScore, setSeverityScore]       = useState(0)
  const [activeFloor, setActiveFloor]           = useState('Lobby')
  const [evacuationActive, setEvacuationActive] = useState(false)
  const [accountedGuests, setAccountedGuests]   = useState(251)
  const [dispatchedStaff, setDispatchedStaff]   = useState([])
  const [agentLogs, setAgentLogs]               = useState(INITIAL_LOGS)
  const [incidentTimeline, setIncidentTimeline] = useState([])
  const [flashRed, setFlashRed]                 = useState(false)

  // Simulation metadata (no re-render needed)
  const scenarioRef        = useRef(null)
  const elapsedRef         = useRef(0)
  const triggeredRef       = useRef(new Set())
  const evacuationStartRef = useRef(null)
  const prevSeverityRef    = useRef(0)
  const logIdRef           = useRef(100)
  const intervalRef        = useRef(null)
  const crisisEventsRef    = useRef([])

  /* ── Tick ────────────────────────────────────────────────── */
  const tick = useCallback(() => {
    const scenario = scenarioRef.current
    if (!scenario) return

    elapsedRef.current += 1
    const t = elapsedRef.current
    setElapsedSeconds(t)

    const newEvents = scenario.timeline.filter(
      ev => ev.t === t && !triggeredRef.current.has(`${ev.t}-${ev.sensorId}`)
    )
    newEvents.forEach(ev => triggeredRef.current.add(`${ev.t}-${ev.sensorId}`))

    // Single setSensors call per tick (triggered + noise)
    setSensors(prev => prev.map(s => {
      const hit = newEvents.find(ev => ev.sensorId === s.id)
      if (hit) {
        const newVal    = typeof hit.value === 'number' ? hit.value : s.currentValue
        const newStatus = getSensorStatus(s.type, newVal)
        return {
          ...s,
          currentValue: newVal,
          history:      [...s.history.slice(1), newVal],
          sensorStatus: newStatus,
          status:       newStatus === 'CRITICAL' ? 'alert' : 'active',
          lastUpdated:  Date.now(),
        }
      }
      // Noise on normal sensors
      const base   = getBaselineValue(s.type)
      const noise  = (Math.random() - 0.5) * base * 0.08
      const newVal = Math.max(0, s.currentValue + noise)
      return { ...s, currentValue: newVal, history: [...s.history.slice(1), newVal] }
    }))

    // Process crisis events
    const newLogs = []

    if (newEvents.length > 0) {
      const nowEvents = newEvents.map(ev => ({
        ...ev, id: `evt-${t}-${ev.sensorId}`, triggeredAt: t, acknowledged: false,
      }))

      crisisEventsRef.current = [...crisisEventsRef.current, ...nowEvents]
      setCrisisEvents([...crisisEventsRef.current])

      const score = calcSeverityScore(crisisEventsRef.current)
      setSeverityScore(score)

      if (score >= 7 && prevSeverityRef.current < 7) {
        setFlashRed(true)
        setTimeout(() => setFlashRed(false), 900)
      }
      prevSeverityRef.current = score

      if (score >= 4 && evacuationStartRef.current === null) {
        const triggerFloor = newEvents[0].floor
        evacuationStartRef.current = t
        setEvacuationActive(true)
        setAccountedGuests(247)
        setSimulationStatus('crisis')
        newLogs.push(
          { id: logIdRef.current++, time: formatElapsed(t), agent: 'EvacPlanner',       msg: `EVACUATION INITIATED — ${triggerFloor}. All staff deploy to exits.`, level: 'critical' },
          { id: logIdRef.current++, time: formatElapsed(t), agent: 'CrisisOrchestrator', msg: 'All agents switching to CRISIS mode. Incident command activated.', level: 'critical' },
        )
      } else if (score >= 7 && simulationStatus !== 'crisis') {
        setSimulationStatus('crisis')
      }

      setIncidentTimeline(prev => [...prev, ...nowEvents.map(e => ({ ...e, timeLabel: formatElapsed(t) }))])

      nowEvents.forEach(ev => {
        const templates = AGENT_TEMPLATES[ev.type] ?? []
        templates.forEach(fn => {
          newLogs.push({ id: logIdRef.current++, ...fn(ev), time: formatElapsed(t) })
        })
      })
    }

    // Guest accounting during evacuation
    if (evacuationStartRef.current !== null) {
      const evElapsed = t - evacuationStartRef.current
      if (t >= 75) {
        setAccountedGuests(251)
        if (t === 75) {
          newLogs.push({ id: logIdRef.current++, time: formatElapsed(t), agent: 'GuestTracker', msg: 'All 4 unaccounted guests located. Full headcount: 251 / 251.', level: 'success' })
        }
      } else if (evElapsed <= 20) {
        const drop = Math.floor((evElapsed / 20) * 67)
        setAccountedGuests(Math.max(180, 247 - drop))
      } else {
        const recoverDur  = Math.max(1, 75 - evacuationStartRef.current - 20)
        const recoverElap = evElapsed - 20
        const recovered   = Math.floor((Math.min(recoverElap, recoverDur) / recoverDur) * 67)
        setAccountedGuests(Math.min(247, 180 + recovered))
      }
    }

    if (newLogs.length) {
      setAgentLogs(prev => [...prev, ...newLogs].slice(-60))
    }
  }, []) // tick deps are all refs — stable

  /* ── Controls ────────────────────────────────────────────── */
  const startSimulation = useCallback((scenarioName) => {
    const scenario = ALL_SCENARIOS.find(s => s.name === scenarioName) ?? ALL_SCENARIOS[0]
    scenarioRef.current        = scenario
    elapsedRef.current         = 0
    triggeredRef.current       = new Set()
    evacuationStartRef.current = null
    prevSeverityRef.current    = 0
    crisisEventsRef.current    = []

    setSensors(initSensors())
    setCrisisEvents([])
    setElapsedSeconds(0)
    setSeverityScore(0)
    setEvacuationActive(false)
    setAccountedGuests(251)
    setDispatchedStaff([])
    setIncidentTimeline([])
    setFlashRed(false)
    setSimulationStatus('running')
    setAgentLogs([
      ...INITIAL_LOGS,
      { id: logIdRef.current++, time: '00:00:00', agent: 'CrisisOrchestrator', msg: `Scenario loaded: "${scenario.name}". Simulation starting…`, level: 'warning' },
    ])
  }, [])

  const resetSimulation = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    scenarioRef.current        = null
    elapsedRef.current         = 0
    triggeredRef.current       = new Set()
    evacuationStartRef.current = null
    prevSeverityRef.current    = 0
    crisisEventsRef.current    = []

    setSensors(initSensors())
    setCrisisEvents([])
    setElapsedSeconds(0)
    setSeverityScore(0)
    setEvacuationActive(false)
    setAccountedGuests(251)
    setDispatchedStaff([])
    setIncidentTimeline([])
    setFlashRed(false)
    setSimulationStatus('idle')
    setAgentLogs(INITIAL_LOGS)
  }, [])

  const triggerManualSOS = useCallback((floor, room) => {
    const t  = elapsedRef.current
    const ev = {
      id: `sos-manual-${Date.now()}`, t, sensorId: 'SOS-MANUAL',
      type: 'sos', floor, zone: room, value: 1, unit: 'alert',
      message: `MANUAL SOS from ${room} on ${floor}. Immediate response required.`,
      severityContribution: 85, severity: 'CRITICAL', triggeredAt: t, acknowledged: false,
    }
    crisisEventsRef.current = [...crisisEventsRef.current, ev]
    setCrisisEvents([...crisisEventsRef.current])
    setIncidentTimeline(prev => [...prev, { ...ev, timeLabel: formatElapsed(t) }])
    setAgentLogs(prev => [
      ...prev,
      { id: logIdRef.current++, time: formatElapsed(t), agent: 'CrisisOrchestrator', msg: `Manual SOS: ${room} on ${floor}.`, level: 'critical' },
    ])
  }, [])

  const acknowledgeAlert = useCallback((alertId) => {
    setCrisisEvents(prev => prev.map(e => e.id === alertId ? { ...e, acknowledged: true } : e))
    crisisEventsRef.current = crisisEventsRef.current.map(e => e.id === alertId ? { ...e, acknowledged: true } : e)
  }, [])

  /* ── Interval management ─────────────────────────────────── */
  useEffect(() => {
    const running = simulationStatus === 'running' || simulationStatus === 'crisis'
    if (running && !intervalRef.current) {
      intervalRef.current = setInterval(tick, 1000)
    } else if (!running && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [simulationStatus, tick])

  return {
    simulationStatus,
    elapsedSeconds,
    sensors,
    guests: BASE_GUESTS,
    staff:  BASE_STAFF,
    crisisEvents,
    severityScore,
    activeFloor,
    setActiveFloor,
    evacuationActive,
    accountedGuests,
    dispatchedStaff,
    agentLogs,
    incidentTimeline,
    flashRed,
    startSimulation,
    resetSimulation,
    triggerManualSOS,
    acknowledgeAlert,
  }
}
