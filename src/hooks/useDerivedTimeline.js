import { useMemo } from 'react'

/* ── Time helpers ─────────────────────────────────────────────── */
function pad2(n) { return String(n).padStart(2, '0') }
function pad3(n) { return String(n).padStart(3, '0') }

export function timeToSeconds(t) {
  if (typeof t !== 'string') return 0
  const parts = t.split(':').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 0
  const [h, m, s] = parts
  return h * 3600 + m * 60 + s
}

export function secondsToElapsedLabel(s) {
  const total = Math.max(0, Math.floor(s))
  const m = Math.floor(total / 60)
  const sec = total % 60
  return `T+${m}:${pad2(sec)}`
}

export function secondsToHHMMSS(s) {
  const total = Math.max(0, Math.floor(s))
  return `${pad2(Math.floor(total / 3600))}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`
}

/* ── Categorization ───────────────────────────────────────────── */
export const CATEGORY_STYLES = {
  detection:  { color: '#ef4444', label: 'DETECTION',  cssBorder: 'border-l-accent-red',     cssText: 'text-accent-red',    cssBg: 'bg-accent-red/10'    },
  response:   { color: '#f59e0b', label: 'RESPONSE',   cssBorder: 'border-l-accent-amber',   cssText: 'text-accent-amber',  cssBg: 'bg-accent-amber/10'  },
  agent:      { color: '#3b82f6', label: 'AI AGENT',   cssBorder: 'border-l-accent-blue',    cssText: 'text-accent-blue',   cssBg: 'bg-accent-blue/10'   },
  resolution: { color: '#22c55e', label: 'RESOLUTION', cssBorder: 'border-l-accent-green',   cssText: 'text-accent-green',  cssBg: 'bg-accent-green/10'  },
  external:   { color: '#a855f7', label: 'EXTERNAL',   cssBorder: 'border-l-purple-400',     cssText: 'text-purple-400',    cssBg: 'bg-purple-500/10'    },
}

const SENSOR_TYPES = new Set(['temperature', 'smoke', 'motion', 'co2', 'cctv'])

function eventToTimelineEntry(ev) {
  const isSensor = SENSOR_TYPES.has(ev.type)
  const isSOS    = ev.type === 'sos'

  let title
  if (ev.type === 'temperature') title = `Temperature reading — ${ev.value}${ev.unit ?? '°C'}`
  else if (ev.type === 'smoke')  title = `Smoke detected — density ${ev.value}`
  else if (ev.type === 'motion') title = `Motion surge — ${ev.value} persons`
  else if (ev.type === 'co2')    title = `CO₂ spike — ${ev.value} ppm`
  else if (ev.type === 'cctv')   title = `CCTV anomaly — ${String(ev.value).replace(/_/g, ' ')}`
  else if (ev.type === 'sos')    title = `Guest SOS — ${ev.zone}`
  else                            title = ev.message

  return {
    id: `evt-${ev.id}`,
    t: ev.triggeredAt ?? ev.t ?? 0,
    category: 'detection',
    icon: isSOS ? 'sos' : isSensor ? 'sensor' : 'alert',
    title,
    description: ev.message,
    source: ev.sensorId ? `${ev.sensorId} · ${ev.floor}${ev.zone ? ' · ' + ev.zone : ''}` : ev.floor,
    severity: ev.severity,
  }
}

function logToTimelineEntry(log) {
  const t = timeToSeconds(log.time)

  let category = 'agent'
  let icon = 'agent'

  const msg = log.msg ?? ''
  const agent = log.agent ?? ''

  if (agent === 'StaffCoordinator') {
    category = 'response'
    icon = 'dispatch'
  } else if (agent === 'GuestTracker') {
    if (log.level === 'success' || /accounted|located/i.test(msg)) {
      category = 'resolution'
      icon = 'resolution'
    } else {
      category = 'agent'
      icon = 'agent'
    }
  } else if (agent === 'CrisisOrchestrator') {
    if (/SOS RECEIVED|Manual SOS/i.test(msg)) {
      category = 'detection'
      icon = 'sos'
    } else if (/CRISIS mode|EMERGENCY|incident command/i.test(msg)) {
      category = 'response'
      icon = 'protocol'
    } else {
      category = 'agent'
      icon = 'agent'
    }
  } else if (agent === 'EvacPlanner') {
    if (/EVACUATION INITIATED|evacuat/i.test(msg)) {
      category = 'response'
      icon = 'evac'
    } else {
      category = 'agent'
      icon = 'agent'
    }
  } else if (agent === 'ThreatAssessor' || agent === 'SensorMonitor') {
    category = 'agent'
    icon = 'agent'
  }

  return {
    id: `log-${log.id}`,
    t,
    category,
    icon,
    title: `${agent} — ${log.level?.toUpperCase() ?? 'INFO'}`,
    description: msg,
    source: agent,
    level: log.level,
  }
}

/* ── Synthetic external/protocol events ───────────────────────── */
function buildSyntheticEntries(logs) {
  const entries = []
  const evacLog = logs.find(l => l.agent === 'EvacPlanner' && /EVACUATION INITIATED/i.test(l.msg))
  if (evacLog) {
    const t0 = timeToSeconds(evacLog.time)

    entries.push({
      id: 'syn-emergency-services',
      t: t0 + 6,
      category: 'external',
      icon: 'external',
      title: 'Emergency services notified',
      description: 'Fire Dept dispatched. ETA 4 minutes. Police and EMS standing by.',
      source: '911 Bridge · Fire Dept',
    })

    entries.push({
      id: 'syn-responder-brief',
      t: t0 + 9,
      category: 'external',
      icon: 'external',
      title: 'Responder brief transmitted',
      description: 'First-responder situational brief delivered to inbound units (3 recipients).',
      source: 'CrisisOS Bridge',
    })

    entries.push({
      id: 'syn-speakers',
      t: t0 + 12,
      category: 'response',
      icon: 'speaker',
      title: 'Speaker system activated',
      description: 'Zone-specific evacuation instructions broadcast on affected floors.',
      source: 'PA System',
    })
  }
  return entries
}

/* ── Derived hook ─────────────────────────────────────────────── */
export function useDerivedTimeline(sim) {
  return useMemo(() => {
    const eventEntries = sim.incidentTimeline.map(eventToTimelineEntry)
    const logEntries   = sim.agentLogs
      .filter(l => l.id >= 100) // skip the constant initial-state logs
      .map(logToTimelineEntry)
    const synthetic    = buildSyntheticEntries(sim.agentLogs)

    const entries = [...eventEntries, ...logEntries, ...synthetic]
      .sort((a, b) => a.t - b.t || a.id.localeCompare(b.id))

    /* ── Audit log lines ───────────────────────────────────── */
    const baseDate = new Date()
    baseDate.setMilliseconds(0)

    function fmtAbsolute(elapsedSec, msOffset = 0) {
      const d = new Date(baseDate.getTime() - sim.elapsedSeconds * 1000 + elapsedSec * 1000 + msOffset)
      const yyyy = d.getFullYear()
      const mm = pad2(d.getMonth() + 1)
      const dd = pad2(d.getDate())
      const hh = pad2(d.getHours())
      const mi = pad2(d.getMinutes())
      const ss = pad2(d.getSeconds())
      const ms = pad3(d.getMilliseconds())
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`
    }

    const auditLines = []

    sim.incidentTimeline.forEach((ev, idx) => {
      const tag = `SENSOR`
      const sev = (ev.severity ?? 'INFO').toUpperCase()
      const detail = [
        `${ev.sensorId ?? 'UNKNOWN'}`,
        sev,
        ev.type ? `${ev.type}=${ev.value}${ev.unit ? ev.unit.replace(/[^\w%°]/g, '') : ''}` : '',
        ev.floor ? `floor=${ev.floor.replace(/\s+/g, '_')}` : '',
        ev.zone ? `zone=${ev.zone.replace(/\s+/g, '_').toLowerCase()}` : '',
      ].filter(Boolean).join(' ')
      auditLines.push({
        id: `audit-evt-${ev.id}`,
        t: ev.triggeredAt ?? ev.t,
        ts: fmtAbsolute(ev.triggeredAt ?? ev.t, idx * 17),
        tag,
        tagColor: 'cyan',
        detail,
        levelColor: sev === 'CRITICAL' ? 'red' : sev === 'HIGH' ? 'amber' : 'cyan',
      })
    })

    sim.agentLogs.filter(l => l.id >= 100).forEach((log, idx) => {
      const t = timeToSeconds(log.time)
      const tag = `AGENT:${(log.agent ?? 'UNKNOWN').toUpperCase()}`
      const detail = (log.msg ?? '').replace(/\s+/g, ' ').trim()
      auditLines.push({
        id: `audit-log-${log.id}`,
        t,
        ts: fmtAbsolute(t, 200 + idx * 23),
        tag,
        tagColor: 'purple',
        detail,
        levelColor: log.level === 'critical' ? 'red' : log.level === 'warning' ? 'amber' : log.level === 'success' ? 'green' : 'purple',
      })
    })

    // Synthetic system + external lines
    const evacLog = sim.agentLogs.find(l => l.agent === 'EvacPlanner' && /EVACUATION INITIATED/i.test(l.msg))
    if (evacLog) {
      const t0 = timeToSeconds(evacLog.time)
      auditLines.push({
        id: 'audit-syn-system-1',
        t: t0,
        ts: fmtAbsolute(t0, 50),
        tag: 'SYSTEM',
        tagColor: 'amber',
        detail: 'severity_threshold_crossed level=7 protocol=EMERGENCY',
        levelColor: 'amber',
      })
      auditLines.push({
        id: 'audit-syn-external-1',
        t: t0 + 6,
        ts: fmtAbsolute(t0 + 6, 80),
        tag: 'EXTERNAL',
        tagColor: 'green',
        detail: 'emergency_services_notified fire_dept=dispatched eta=4min ems=standby',
        levelColor: 'green',
      })
      auditLines.push({
        id: 'audit-syn-bridge-1',
        t: t0 + 9,
        ts: fmtAbsolute(t0 + 9, 110),
        tag: 'AGENT:BRIDGE',
        tagColor: 'purple',
        detail: 'responder_brief_transmitted recipients=3',
        levelColor: 'purple',
      })
      auditLines.push({
        id: 'audit-syn-system-2',
        t: t0 + 12,
        ts: fmtAbsolute(t0 + 12, 140),
        tag: 'SYSTEM',
        tagColor: 'amber',
        detail: 'pa_system_activated zones=affected_floor instructions=zone_specific_evac',
        levelColor: 'amber',
      })
    }

    auditLines.sort((a, b) => a.t - b.t || a.ts.localeCompare(b.ts))

    /* ── Milestones for metrics ────────────────────────────── */
    const firstDetection = eventEntries[0]?.t ?? null

    const aiAnalysisLog = sim.agentLogs.find(l =>
      l.agent === 'ThreatAssessor' && (l.level === 'critical' || l.level === 'warning')
    )
    const aiAnalysisComplete = aiAnalysisLog ? timeToSeconds(aiAnalysisLog.time) : null

    const evacuationCommenced = evacLog ? timeToSeconds(evacLog.time) : null
    const emergencyNotified   = evacuationCommenced != null ? evacuationCommenced + 6 : null

    const accountabilityLog = sim.agentLogs.find(l =>
      l.agent === 'GuestTracker' && /accounted|located/i.test(l.msg ?? '')
    )
    const fullAccountability = accountabilityLog ? timeToSeconds(accountabilityLog.time) : null

    const totalCoordinationTime =
      fullAccountability ??
      (evacuationCommenced != null ? Math.max(sim.elapsedSeconds, evacuationCommenced) : sim.elapsedSeconds)

    const milestones = {
      firstDetection,
      aiAnalysisComplete,
      emergencyNotified,
      evacuationCommenced,
      fullAccountability,
      totalCoordinationTime,
      hasCompleted: fullAccountability != null,
    }

    return { entries, auditLines, milestones }
  }, [sim.incidentTimeline, sim.agentLogs, sim.elapsedSeconds])
}
