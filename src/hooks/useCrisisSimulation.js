import { useState, useEffect, useRef, useCallback } from 'react'
import { SENSORS as BASE_SENSORS, GUESTS as BASE_GUESTS, STAFF as BASE_STAFF } from '../data/hotelData.js'
import { ALL_SCENARIOS } from '../data/crisisScenarios.js'
import simBus from '../services/simBus.js'
import VoiceAnnouncer from '../services/voiceAnnouncer.js'
import { computeRiskSnapshot, PRE_ALERT_THRESHOLD, PRE_ACTIONS } from '../services/riskPredictor.js'
import {
  THERM_CAMERAS,
  makeAllGrids,
  diffuse,
  sourcesFor,
  hottestCell,
} from '../services/thermalSim.js'
import connectivity from '../services/connectivityManager.js'

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

/* ── Voice milestone definitions ───────────────────────────── */
const VOICE_MILESTONES = [
  { t: 1, zone: 'all', priority: 'calm',
    text: 'We are conducting a precautionary safety check. Please remain calm and await further instructions from hotel staff.' },
  { t: 18, zone: 'all', priority: 'critical',
    text: 'Emergency alert. An emergency has been detected on Floor 3. All guests please begin evacuating the building immediately. Do not use elevators. Proceed to the nearest stairwell.' },
  { t: 22, zone: 'Floor 3 guests', priority: 'critical',
    text: 'Please evacuate immediately using Stairwell A. Do not use Stairwell B or the elevators. Staff are guiding you to safety.' },
  { t: 23, zone: 'guests on Floors 1 and 2', priority: 'calm',
    text: 'Please proceed calmly to the main exit. Use the central stairwell. Hotel staff are available to assist you.' },
  { t: 24, zone: 'lobby guests', priority: 'calm',
    text: 'Please exit the building through the main entrance. Move away from the building and await instructions from emergency services.' },
  { t: 31, zone: 'all', priority: 'calm',
    text: 'Emergency services have been notified and are on their way. Estimated arrival in four minutes. Please continue evacuating calmly.' },
  { t: 75, zone: 'all', priority: 'calm',
    text: 'All guests have been successfully evacuated. Thank you for your cooperation. Emergency services are on scene.' },
]

const SPEED_INTERVAL_MS = { 1: 1000, 2: 500, 4: 250 }

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
  const [blockedExits, setBlockedExits]         = useState([])
  const [simulationSpeed, setSpeed]             = useState(1)
  const [aiDecisionsCount, setAIDecisions]      = useState(0)
  const [messagesCount, setMessagesCount]       = useState(0)
  const [staffCoordinatedCount, setStaffCoord]  = useState(0)
  const [safetyCheckIns, setSafetyCheckIns]     = useState(0)
  const [helpRequests, setHelpRequests]         = useState([])
  const [activeScenario, setActiveScenario]     = useState(null)
  const [currentVoiceZone, setCurrentVoiceZone] = useState('all')

  // Phase 13 — predictive risk
  const [risk, setRisk] = useState(() => computeRiskSnapshot({}))
  const [riskHistory, setRiskHistory] = useState(() => Array(60).fill(15))
  const [preAlertActive, setPreAlertActive] = useState(false)
  const [preAlertFiredAt, setPreAlertFiredAt] = useState(null) // seconds before crisis
  const [preStageSeconds, setPreStageSeconds] = useState(0) // 0..60
  const [preStageActive, setPreStageActive] = useState(false)

  // Phase 14 — thermal
  const [thermalGrids, setThermalGrids] = useState(() => makeAllGrids())
  const [thermalAnomaly, setThermalAnomaly] = useState(0)
  const [thermalAnomalyAt, setThermalAnomalyAt] = useState(null) // seconds before smoke trigger
  const [thermalHistory, setThermalHistory] = useState(() => ({
    'THERM-01': Array(90).fill(28),
    'THERM-02': Array(90).fill(24),
    'THERM-03': Array(90).fill(23),
    'THERM-04': Array(90).fill(22),
  }))

  // Phase 17 — connectivity
  const [connState, setConnState] = useState(() => connectivity.getState())

  // Simulation metadata (no re-render needed)
  const scenarioRef        = useRef(null)
  const elapsedRef         = useRef(0)
  const triggeredRef       = useRef(new Set())
  const evacuationStartRef = useRef(null)
  const prevSeverityRef    = useRef(0)
  const logIdRef           = useRef(100)
  const intervalRef        = useRef(null)
  const preStageIntervalRef = useRef(null)
  const crisisEventsRef    = useRef([])
  const firedVoiceRef      = useRef(new Set())
  const speedRef           = useRef(1)
  const preStageRef        = useRef(0)
  const preAlertRef        = useRef(false)
  const thermalAnomalyRef  = useRef(0)
  const thermalAnomalyAtRef = useRef(null)

  /* ── Speed control ──────────────────────────────────────── */
  const setSimulationSpeed = useCallback((mult) => {
    const safe = SPEED_INTERVAL_MS[mult] ? mult : 1
    speedRef.current = safe
    setSpeed(safe)
  }, [])

  /* ── Thermal tick (10 fps via rAF) ───────────────────── */
  useEffect(() => {
    let raf = null
    let running = true
    const loop = () => {
      if (!running) return
      const preStage = preStageRef.current
      const crisisT = (simulationStatus === 'crisis' || simulationStatus === 'running')
        ? elapsedRef.current
        : -1
      const grids = thermalGrids
      let anomalyCam = null
      let maxT = 0
      THERM_CAMERAS.forEach((cam) => {
        const grid = grids[cam.id]
        if (!grid) return
        const sources = sourcesFor(cam.id, preStage, crisisT)
        diffuse(grid, sources, cam.baseline)
        const hot = hottestCell(grid)
        if (cam.id === 'THERM-01' && hot.t > maxT) {
          maxT = hot.t
          anomalyCam = cam.id
        }
      })
      thermalAnomalyRef.current = maxT
      setThermalAnomaly(maxT)
      // Track when anomaly first crossed pre-alert threshold (42 °C)
      if (!thermalAnomalyAtRef.current && maxT >= 42) {
        thermalAnomalyAtRef.current = { preStage, crisisT }
        setThermalAnomalyAt({ preStage, crisisT })
      }
      raf = setTimeout(loop, 100)
    }
    loop()
    return () => { running = false; if (raf) clearTimeout(raf) }
  }, [thermalGrids, simulationStatus])

  /* ── Risk predictor + thermal history (1 Hz) ─────────── */
  useEffect(() => {
    const id = setInterval(() => {
      const snap = computeRiskSnapshot({
        sensors,
        thermalAnomaly: thermalAnomalyRef.current,
        preStageSeconds: preStageRef.current,
        simulationStatus,
      })
      setRisk(snap)
      setRiskHistory((prev) => [...prev.slice(1), snap.score])

      // Thermal history per camera
      setThermalHistory((prev) => {
        const next = { ...prev }
        THERM_CAMERAS.forEach((cam) => {
          const grid = thermalGrids[cam.id]
          if (!grid) return
          const hot = hottestCell(grid)
          next[cam.id] = [...prev[cam.id].slice(1), hot.t]
        })
        return next
      })

      // Pre-alert trigger
      if (snap.score >= PRE_ALERT_THRESHOLD && !preAlertRef.current && simulationStatus !== 'idle') {
        preAlertRef.current = true
        setPreAlertActive(true)
        // record when pre-alert fired relative to crisis start
        const lead = simulationStatus === 'pre-crisis'
          ? 60 - preStageRef.current
          : 0
        setPreAlertFiredAt(lead)
        const t = elapsedRef.current
        setAgentLogs((prev) => [
          ...prev,
          {
            id: logIdRef.current++,
            time: formatElapsed(Math.max(0, t)),
            agent: 'ThreatAssessor',
            msg: `PRE-ALERT — risk score ${snap.score}. Pre-positioning staff. ${PRE_ACTIONS[0]}.`,
            level: 'warning',
          },
          {
            id: logIdRef.current++,
            time: formatElapsed(Math.max(0, t)),
            agent: 'StaffCoordinator',
            msg: PRE_ACTIONS[1] + '. ' + PRE_ACTIONS[3] + '.',
            level: 'warning',
          },
        ])
      }
    }, 1000)
    return () => clearInterval(id)
  }, [sensors, thermalGrids, simulationStatus])

  /* ── Connectivity tick + subscription ─────────────────── */
  useEffect(() => {
    const unsub = connectivity.subscribe(setConnState)
    const id = setInterval(() => connectivity.tick(), 500)
    return () => { unsub(); clearInterval(id) }
  }, [])

  /* ── Tick ────────────────────────────────────────────────── */
  const tick = useCallback(() => {
    const scenario = scenarioRef.current
    if (!scenario) return

    elapsedRef.current += 1
    const t = elapsedRef.current
    setElapsedSeconds(t)

    // Voice milestones (only once per t, only after a scenario is loaded)
    VOICE_MILESTONES.forEach(m => {
      if (t === m.t && !firedVoiceRef.current.has(m.t)) {
        firedVoiceRef.current.add(m.t)
        setCurrentVoiceZone(m.zone)
        VoiceAnnouncer.announceZone(m.zone, m.text, m.priority)
        setMessagesCount(c => c + 1)
      }
    })

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
        setStaffCoord(8)
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
        setAIDecisions(c => c + Math.max(1, templates.length))
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
  }, [simulationStatus])

  /* ── Controls ────────────────────────────────────────────── */
  const startSimulation = useCallback((scenarioName) => {
    const scenario = ALL_SCENARIOS.find(s => s.name === scenarioName) ?? ALL_SCENARIOS[0]
    scenarioRef.current        = scenario
    elapsedRef.current         = 0
    triggeredRef.current       = new Set()
    evacuationStartRef.current = null
    prevSeverityRef.current    = 0
    crisisEventsRef.current    = []
    firedVoiceRef.current      = new Set()
    preStageRef.current        = 0
    preAlertRef.current        = false
    thermalAnomalyRef.current  = 0
    thermalAnomalyAtRef.current = null

    const isFire = /fire/i.test(scenario.name)

    setActiveScenario(scenario.name)
    setSensors(initSensors())
    setCrisisEvents([])
    setElapsedSeconds(0)
    setSeverityScore(0)
    setEvacuationActive(false)
    setAccountedGuests(251)
    setDispatchedStaff([])
    setIncidentTimeline([])
    setFlashRed(false)
    setAIDecisions(0)
    setMessagesCount(0)
    setStaffCoord(0)
    setSafetyCheckIns(0)
    setHelpRequests([])
    setBlockedExits([])
    setCurrentVoiceZone('all')
    setPreAlertActive(false)
    setPreAlertFiredAt(null)
    setPreStageSeconds(0)
    setThermalAnomaly(0)
    setThermalAnomalyAt(null)
    setThermalGrids(makeAllGrids())
    setRiskHistory(Array(60).fill(15))

    if (isFire) {
      setPreStageActive(true)
      setSimulationStatus('pre-crisis')
      setAgentLogs([
        ...INITIAL_LOGS,
        { id: logIdRef.current++, time: '-01:00', agent: 'CrisisOrchestrator', msg: `Scenario loaded: "${scenario.name}". Predictive monitoring engaged — pre-crisis stage.`, level: 'info' },
      ])
    } else {
      setPreStageActive(false)
      setSimulationStatus('running')
      setAgentLogs([
        ...INITIAL_LOGS,
        { id: logIdRef.current++, time: '00:00:00', agent: 'CrisisOrchestrator', msg: `Scenario loaded: "${scenario.name}". Simulation starting…`, level: 'warning' },
      ])
    }
  }, [])

  const resetSimulation = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (preStageIntervalRef.current) { clearInterval(preStageIntervalRef.current); preStageIntervalRef.current = null }
    scenarioRef.current        = null
    elapsedRef.current         = 0
    triggeredRef.current       = new Set()
    evacuationStartRef.current = null
    prevSeverityRef.current    = 0
    crisisEventsRef.current    = []
    firedVoiceRef.current      = new Set()
    speedRef.current           = 1
    preStageRef.current        = 0
    preAlertRef.current        = false
    thermalAnomalyRef.current  = 0
    thermalAnomalyAtRef.current = null

    VoiceAnnouncer.cancel()
    connectivity.reset()

    setActiveScenario(null)
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
    setAIDecisions(0)
    setMessagesCount(0)
    setStaffCoord(0)
    setSafetyCheckIns(0)
    setHelpRequests([])
    setBlockedExits([])
    setSpeed(1)
    setCurrentVoiceZone('all')
    setPreStageActive(false)
    setPreStageSeconds(0)
    setPreAlertActive(false)
    setPreAlertFiredAt(null)
    setThermalAnomaly(0)
    setThermalAnomalyAt(null)
    setThermalGrids(makeAllGrids())
    setRiskHistory(Array(60).fill(15))
    simBus.clearState()
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
    setAIDecisions(c => c + 2)
  }, [])

  const acknowledgeAlert = useCallback((alertId) => {
    setCrisisEvents(prev => prev.map(e => e.id === alertId ? { ...e, acknowledged: true } : e))
    crisisEventsRef.current = crisisEventsRef.current.map(e => e.id === alertId ? { ...e, acknowledged: true } : e)
  }, [])

  const blockExit = useCallback((exitId) => {
    setBlockedExits(prev => prev.includes(exitId) ? prev : [...prev, exitId])
    const t = elapsedRef.current
    setAgentLogs(prev => [
      ...prev,
      { id: logIdRef.current++, time: formatElapsed(t), agent: 'EvacPlanner', msg: `EXIT BLOCKED — ${exitId}. Recomputing routes and rerouting evacuees.`, level: 'critical' },
      { id: logIdRef.current++, time: formatElapsed(t), agent: 'StaffCoordinator', msg: `Redirecting staff away from ${exitId} toward alternate routes.`, level: 'warning' },
    ])
    setAIDecisions(c => c + 2)
  }, [])

  const findAllGuests = useCallback(() => {
    setAccountedGuests(251)
    const t = elapsedRef.current
    setAgentLogs(prev => [
      ...prev,
      { id: logIdRef.current++, time: formatElapsed(t), agent: 'GuestTracker', msg: 'All guests located. Full accountability: 251 / 251.', level: 'success' },
    ])
  }, [])

  const seekToTime = useCallback((targetSeconds) => {
    const target = Math.max(0, Math.min(120, Math.floor(targetSeconds)))
    if (!scenarioRef.current) return
    if (target === elapsedRef.current) return
    if (target < elapsedRef.current) {
      // Rewind: replay from current scenario
      const name = scenarioRef.current.name
      startSimulation(name)
      // In next tick run forward to target
      setTimeout(() => {
        for (let i = 0; i < target; i++) tick()
      }, 50)
    } else {
      const delta = target - elapsedRef.current
      for (let i = 0; i < delta; i++) tick()
    }
  }, [startSimulation, tick])

  const guestSafe = useCallback((label = 'Guest') => {
    setSafetyCheckIns(c => c + 1)
    const t = elapsedRef.current
    setAgentLogs(prev => [
      ...prev,
      { id: logIdRef.current++, time: formatElapsed(t), agent: 'GuestTracker', msg: `${label} confirmed safe via mobile check-in.`, level: 'success' },
    ])
  }, [])

  const guestNeedsHelp = useCallback((info = {}) => {
    const t = elapsedRef.current
    const entry = { id: `help-${Date.now()}`, t, ...info }
    setHelpRequests(prev => [...prev, entry])
    setAgentLogs(prev => [
      ...prev,
      { id: logIdRef.current++, time: formatElapsed(t), agent: 'CrisisOrchestrator', msg: `ASSISTANCE REQUEST — ${info.room ?? 'Mobile guest'} flagged need for physical help.`, level: 'critical' },
    ])
    setAIDecisions(c => c + 1)
  }, [])

  /* ── Interval management (speed-aware) ─────────────────── */
  useEffect(() => {
    const running = simulationStatus === 'running' || simulationStatus === 'crisis'
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (running) {
      const interval = SPEED_INTERVAL_MS[simulationSpeed] ?? 1000
      intervalRef.current = setInterval(tick, interval)
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [simulationStatus, simulationSpeed, tick])

  /* ── Pre-crisis stage interval ─────────────────────────── */
  useEffect(() => {
    if (preStageIntervalRef.current) {
      clearInterval(preStageIntervalRef.current)
      preStageIntervalRef.current = null
    }
    if (simulationStatus === 'pre-crisis') {
      const interval = SPEED_INTERVAL_MS[simulationSpeed] ?? 1000
      preStageIntervalRef.current = setInterval(() => {
        preStageRef.current += 1
        setPreStageSeconds(preStageRef.current)
        if (preStageRef.current >= 60) {
          // Transition into the actual scenario timeline
          setPreStageActive(false)
          setSimulationStatus('running')
        }
      }, interval)
    }
    return () => {
      if (preStageIntervalRef.current) { clearInterval(preStageIntervalRef.current); preStageIntervalRef.current = null }
    }
  }, [simulationStatus, simulationSpeed])

  /* ── Cross-tab broadcast ───────────────────────────────── */
  useEffect(() => {
    simBus.publishState({
      simulationStatus,
      activeScenario,
      elapsedSeconds,
      severityScore,
      evacuationActive,
      accountedGuests,
      activeFloor,
      lastEvent: crisisEvents[crisisEvents.length - 1] ?? null,
      crisisEventCount: crisisEvents.length,
      currentVoiceZone,
      blockedExits,
      messagesCount,
      aiDecisionsCount,
      safetyCheckIns,
      helpRequests,
      updatedAt: Date.now(),
    })
  }, [simulationStatus, activeScenario, elapsedSeconds, severityScore, evacuationActive,
      accountedGuests, activeFloor, crisisEvents, currentVoiceZone, blockedExits,
      messagesCount, aiDecisionsCount, safetyCheckIns, helpRequests])

  /* ── Subscribe to bus actions (from /guest, /staff tabs) ── */
  useEffect(() => {
    const unsub = simBus.subscribe((msg) => {
      if (!msg || msg.type !== 'action') return
      const a = msg.payload
      if (!a) return
      if (a.kind === 'guest-sos') {
        triggerManualSOS(a.floor || 'Floor 3', a.room || 'Room 312')
      } else if (a.kind === 'guest-safe') {
        guestSafe(a.label)
      } else if (a.kind === 'guest-help') {
        guestNeedsHelp(a.info ?? {})
      }
    })
    return unsub
  }, [triggerManualSOS, guestSafe, guestNeedsHelp])

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
    blockedExits,
    simulationSpeed,
    aiDecisionsCount,
    messagesCount,
    staffCoordinatedCount,
    safetyCheckIns,
    helpRequests,
    activeScenario,
    currentVoiceZone,
    startSimulation,
    resetSimulation,
    triggerManualSOS,
    acknowledgeAlert,
    blockExit,
    findAllGuests,
    seekToTime,
    setSimulationSpeed,
    guestSafe,
    guestNeedsHelp,
    // Phase 13 — predictive risk
    risk,
    riskHistory,
    preAlertActive,
    preAlertFiredAt,
    preStageSeconds,
    preStageActive,
    // Phase 14 — thermal
    thermalGrids,
    thermalAnomaly,
    thermalAnomalyAt,
    thermalHistory,
    // Phase 17 — connectivity
    connState,
    simulateDisconnect: () => connectivity.simulateDisconnect(),
    simulateReconnect:  () => connectivity.simulateReconnect(),
    simulateDegraded:   () => connectivity.simulateDegraded(),
  }
}
