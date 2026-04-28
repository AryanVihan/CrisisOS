import React, { useCallback, useEffect, useRef, useState } from 'react'

/* ── Sensor icons (SVG) ──────────────────────────────────────── */
function SmokeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2 C5 2 4 3.5 4.5 5 C3 5 2 6.5 3 8 C2 8 1.5 9 2.5 10 H11 C12 9 11.5 8 10.5 8 C11.5 6.5 10.5 5 9 5 C9.5 3.5 8.5 2 7 2Z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  )
}

function TempIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="5.5" y="1" width="3" height="8" rx="1.5" stroke="currentColor" strokeWidth="1"/>
      <circle cx="7" cy="11" r="2" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1"/>
      <path d="M8 7.5V9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
}

function MotionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="3.5" r="1.5" fill="currentColor" fillOpacity="0.6"/>
      <path d="M4.5 6 C4.5 5 5.5 4.5 7 4.5 C8.5 4.5 9.5 5 9.5 6 L9.5 9 L8 9 L8 12.5 H6 L6 9 L4.5 9 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="0.5"/>
    </svg>
  )
}

function CO2Icon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <ellipse cx="7" cy="7" rx="5.5" ry="4" stroke="currentColor" strokeWidth="1"/>
      <text x="7" y="10" textAnchor="middle" fontSize="3.5" fill="currentColor" fontFamily="monospace" fontWeight="bold">CO₂</text>
    </svg>
  )
}

const SENSOR_ICONS = { smoke: SmokeIcon, temperature: TempIcon, motion: MotionIcon, co2: CO2Icon }

/* ── Icon colors by type ─────────────────────────────────────── */
const TYPE_COLOR = {
  smoke:       'text-accent-amber',
  temperature: 'text-accent-red',
  motion:      'text-accent-blue',
  co2:         'text-accent-green',
}

/* ── Status badge ────────────────────────────────────────────── */
const STATUS_STYLE = {
  NORMAL:   'bg-accent-green/15 text-accent-green',
  ELEVATED: 'bg-accent-amber/15 text-accent-amber',
  CRITICAL: 'bg-accent-red/15 text-accent-red',
}

/* ── Sparkline ───────────────────────────────────────────────── */
function Sparkline({ history, status }) {
  const W = 44, H = 12, BAR_W = 3, GAP = 1.4
  const max = Math.max(...history, 0.0001)
  const barColor = status === 'CRITICAL' ? '#ef4444' : status === 'ELEVATED' ? '#f59e0b' : '#22c55e'

  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      {history.map((v, i) => {
        const barH = Math.max(1, (v / max) * (H - 1))
        const x    = i * (BAR_W + GAP)
        return (
          <rect
            key={i}
            x={x} y={H - barH}
            width={BAR_W} height={barH}
            fill={barColor}
            opacity={0.5 + (i / history.length) * 0.5}
            rx="0.5"
          />
        )
      })}
    </svg>
  )
}

/* ── Sensor card ─────────────────────────────────────────────── */
function SensorCard({ sensor, isSelected, onClick }) {
  const Icon = SENSOR_ICONS[sensor.type] ?? SmokeIcon
  const isCritical = sensor.sensorStatus === 'CRITICAL'

  // Trigger a shake whenever this sensor *transitions into* CRITICAL
  const prevStatus = useRef(sensor.sensorStatus)
  const [shake, setShake] = useState(false)
  useEffect(() => {
    if (prevStatus.current !== 'CRITICAL' && sensor.sensorStatus === 'CRITICAL') {
      setShake(true)
      const t = setTimeout(() => setShake(false), 550)
      prevStatus.current = sensor.sensorStatus
      return () => clearTimeout(t)
    }
    prevStatus.current = sensor.sensorStatus
  }, [sensor.sensorStatus])

  const formatVal = (v, type) => {
    if (type === 'smoke')       return v.toFixed(2)
    if (type === 'temperature') return Math.round(v)
    if (type === 'motion')      return Math.round(v)
    if (type === 'co2')         return Math.round(v)
    return v
  }

  const elapsed = Math.round((Date.now() - sensor.lastUpdated) / 1000)
  const updatedLabel = elapsed < 5 ? 'just now' : `${elapsed}s ago`

  return (
    <div
      onClick={() => onClick?.(sensor)}
      className={`
        relative flex flex-col gap-0.5 p-1.5 rounded cursor-pointer select-none
        transition-all duration-300
        ${isSelected ? 'bg-accent-blue/20 border border-accent-blue/40' : 'bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10'}
        ${isCritical ? 'border-accent-red/50 crisis-pulse' : ''}
        ${shake ? 'sensor-shake' : ''}
      `}
      title={`${sensor.id} · ${sensor.zone} · ${formatVal(sensor.currentValue, sensor.type)} ${sensor.unit}`}
    >
      {/* Icon + type */}
      <div className={`flex items-center justify-between ${TYPE_COLOR[sensor.type]}`}>
        <Icon />
        <span className={`text-[7px] font-bold px-0.5 py-px rounded ${STATUS_STYLE[sensor.sensorStatus]}`}>
          {sensor.sensorStatus === 'NORMAL' ? 'OK' : sensor.sensorStatus === 'ELEVATED' ? 'ELV' : 'CRT'}
        </span>
      </div>

      {/* ID */}
      <div className="text-[7.5px] font-mono text-text-secondary leading-tight truncate">{sensor.id}</div>

      {/* Value */}
      <div className={`text-[9px] font-bold leading-tight ${isCritical ? 'text-accent-red' : 'text-text-primary'}`}>
        {formatVal(sensor.currentValue, sensor.type)}
        <span className="text-[6.5px] text-text-secondary ml-0.5">{sensor.unit}</span>
      </div>

      {/* Sparkline */}
      <Sparkline history={sensor.history} status={sensor.sensorStatus} />

      {/* Updated */}
      <div className="text-[6px] text-text-secondary leading-tight">{updatedLabel}</div>
    </div>
  )
}

/* ── SensorGrid ──────────────────────────────────────────────── */
export default function SensorGrid({ sensors, onSensorClick, selectedSensorId }) {
  const handleClick = useCallback((sensor) => {
    onSensorClick?.(sensor)
  }, [onSensorClick])

  const criticalCount  = sensors.filter(s => s.sensorStatus === 'CRITICAL').length
  const elevatedCount  = sensors.filter(s => s.sensorStatus === 'ELEVATED').length

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar */}
      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-white/5 shrink-0">
        <span className="text-text-secondary text-[10px]">{sensors.length} sensors</span>
        {criticalCount > 0 && (
          <span className="text-[9px] px-1.5 py-px rounded bg-accent-red/20 text-accent-red font-semibold">
            {criticalCount} CRITICAL
          </span>
        )}
        {elevatedCount > 0 && (
          <span className="text-[9px] px-1.5 py-px rounded bg-accent-amber/20 text-accent-amber font-semibold">
            {elevatedCount} ELEVATED
          </span>
        )}
      </div>

      {/* Grid: 6 columns */}
      <div className="flex-1 overflow-y-auto py-1.5 px-1.5">
        <div className="grid grid-cols-6 gap-1">
          {sensors.map(sensor => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              isSelected={sensor.id === selectedSensorId}
              onClick={handleClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
