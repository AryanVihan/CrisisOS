/* ── Predictive Risk Engine ───────────────────────────────────
   Computes a 0-100 ambient risk score from environmental,
   occupancy, behavioral, and external signals. Runs continuously
   BEFORE a crisis is declared and keeps running through it.
*/

const FLOORS = ['Lobby', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Roof']

const FLOOR_OCCUPANCY = {
  Lobby: 12, 'Floor 1': 35, 'Floor 2': 58, 'Floor 3': 62, 'Floor 4': 68, Roof: 16,
}
const FLOOR_CAPACITY = {
  Lobby: 80, 'Floor 1': 50, 'Floor 2': 70, 'Floor 3': 75, 'Floor 4': 80, Roof: 25,
}

const PRIOR_INCIDENTS = {
  'Floor 3': 2,
  Lobby: 1,
}

function inPeakHours(date = new Date()) {
  const h = date.getHours()
  return (h >= 7 && h < 9) || (h >= 18 && h < 21)
}

/**
 * Compute a risk score given the current sim snapshot.
 * @param {object} ctx - { sensors, thermalAnomaly, preStageSeconds, simulationStatus, weatherSeverity, timeSinceLastDrillSec }
 * @returns {object} { score, level, factors:[], confidence, predictionWindowSec, topFloors:[] }
 */
export function computeRiskSnapshot(ctx = {}) {
  const {
    sensors = [],
    thermalAnomaly = 0, // hottest cell temp across all therm cams
    preStageSeconds = 0, // 0..60 ramps risk for fire scenario pre-stage
    simulationStatus = 'idle',
    weatherSeverity = 6,
    timeSinceLastDrillSec = 86400 * 12,
    occupancyOverride = null,
  } = ctx

  const factors = []

  /* ── Environmental ─────────────────────────────────── */
  const tempSensors = sensors.filter((s) => s.type === 'temperature')
  let maxTempRise = 0
  tempSensors.forEach((s) => {
    if (!s.history || s.history.length < 2) return
    const rise = s.history[s.history.length - 1] - s.history[0]
    if (rise > maxTempRise) maxTempRise = rise
  })
  if (maxTempRise > 2) {
    factors.push({ key: 'temp-trend', label: 'Temperature trend rising', score: 15, trend: 'up' })
  }

  // Pre-stage drives synthetic env signals to make the predictive layer visible
  if (preStageSeconds > 5) {
    const pct = Math.min(1, (preStageSeconds - 5) / 55)
    factors.push({
      key: 'humidity-anomaly',
      label: 'Humidity drop in F3 East',
      score: Math.round(10 * pct),
      trend: 'down',
    })
    factors.push({
      key: 'co2-drift',
      label: 'CO₂ baseline drift',
      score: Math.round(8 * pct),
      trend: 'up',
    })
  }

  if (inPeakHours()) {
    factors.push({ key: 'peak-hours', label: 'Peak occupancy window', score: 5, trend: 'flat' })
  }

  /* ── Occupancy ─────────────────────────────────────── */
  const occ = occupancyOverride || FLOOR_OCCUPANCY
  let densityHotFloor = null
  Object.entries(occ).forEach(([floor, count]) => {
    if (count / FLOOR_CAPACITY[floor] > 0.8) densityHotFloor = floor
  })
  if (densityHotFloor) {
    factors.push({
      key: 'density',
      label: `Density >80 % on ${densityHotFloor}`,
      score: 12,
      trend: 'up',
    })
  }

  if (preStageSeconds > 25) {
    factors.push({
      key: 'crowd-velocity',
      label: 'Crowd velocity Floor 3 +44 %',
      score: 18,
      trend: 'up',
    })
  }

  if (preStageSeconds > 35) {
    factors.push({
      key: 'zone-cluster',
      label: 'Zone clustering — F3 east',
      score: 15,
      trend: 'up',
    })
  }

  /* ── Behavioral ────────────────────────────────────── */
  if (preStageSeconds > 40) {
    factors.push({
      key: 'rapid-motion',
      label: 'CCTV: rapid motion F3 corridor',
      score: 20,
      trend: 'up',
    })
  }

  /* ── External ──────────────────────────────────────── */
  factors.push({
    key: 'weather',
    label: `Weather severity ${weatherSeverity}/15`,
    score: weatherSeverity,
    trend: 'flat',
  })
  const drillScore = Math.min(10, Math.floor(timeSinceLastDrillSec / 86400))
  factors.push({
    key: 'last-drill',
    label: `${Math.floor(timeSinceLastDrillSec / 86400)} d since last drill`,
    score: drillScore,
    trend: 'flat',
  })

  /* ── Thermal anomaly (Phase 14 wiring) ─────────────── */
  if (thermalAnomaly >= 42 && thermalAnomaly < 55) {
    factors.push({ key: 'thermal-warm', label: 'Thermal anomaly THERM-01', score: 20, trend: 'up' })
  } else if (thermalAnomaly >= 55 && thermalAnomaly < 65) {
    factors.push({ key: 'thermal-hot', label: 'Critical heat — THERM-01', score: 35, trend: 'up' })
  } else if (thermalAnomaly >= 65) {
    factors.push({ key: 'thermal-fire', label: 'FIRE signature — THERM-01', score: 45, trend: 'up' })
  }

  /* ── Compose ───────────────────────────────────────── */
  const elevatedFactors = factors.filter((f) => f.score >= 8)
  let total = factors.reduce((a, f) => a + f.score, 0)
  if (elevatedFactors.length >= 3) total *= 1.4

  // During an actively running crisis, force the score to stay high
  if (simulationStatus === 'crisis') total = Math.max(total, 88)

  const score = Math.max(0, Math.min(100, Math.round(total)))

  let level = 'LOW'
  if (score >= 86) level = 'CRITICAL'
  else if (score >= 71) level = 'HIGH'
  else if (score >= 51) level = 'ELEVATED'
  else if (score >= 26) level = 'GUARDED'

  let confidence = 0
  let predictionWindowSec = null
  if (score >= 65 && score <= 85) {
    confidence = 64 + Math.round((score - 65) * 1.2)
    predictionWindowSec = Math.max(15, 75 - Math.round(score * 0.7))
  }

  const topFloors = [
    {
      floor: 'Floor 3',
      score: Math.min(100, Math.round(score * 1.0 + (preStageSeconds > 0 ? 8 : 0))),
      breakdown: factors.slice(0, 4),
    },
    { floor: 'Floor 4', score: Math.round(score * 0.42), breakdown: [] },
    { floor: 'Floor 2', score: Math.round(score * 0.28), breakdown: [] },
    { floor: 'Floor 1', score: Math.round(score * 0.18), breakdown: [] },
    { floor: 'Lobby',   score: Math.round(score * 0.22), breakdown: [] },
    { floor: 'Roof',    score: Math.round(score * 0.10), breakdown: [] },
  ]

  return {
    score,
    level,
    factors,
    confidence,
    predictionWindowSec,
    topFloors,
    priorIncidents: PRIOR_INCIDENTS,
  }
}

export const RISK_LEVEL_COLOR = {
  LOW:      '#22c55e',
  GUARDED:  '#3b82f6',
  ELEVATED: '#f59e0b',
  HIGH:     '#fb923c',
  CRITICAL: '#ef4444',
}

export const PRE_ALERT_THRESHOLD = 71

export const PRE_ACTIONS = [
  'Security notified — Floor 3 patrol increased',
  'Evacuation routes pre-loaded for Stairwell A',
  'Emergency services on standby alert',
  'Sensor polling frequency increased: 500 ms',
]

export { FLOORS }
