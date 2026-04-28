import React, { useEffect, useRef, useState } from 'react'

/* ── Constants ───────────────────────────────────────────────── */
const CX = 80, CY = 80, R = 60
const START_ANGLE = 225  // degrees, 7-o'clock
const SWEEP       = 270  // total arc degrees

function degToRad(d) { return (d * Math.PI) / 180 }

function arcPath(cx, cy, r, startDeg, endDeg) {
  const s   = degToRad(startDeg)
  const e   = degToRad(endDeg)
  const x1  = cx + r * Math.cos(s)
  const y1  = cy + r * Math.sin(s)
  const x2  = cx + r * Math.cos(e)
  const y2  = cy + r * Math.sin(e)
  const lg  = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2}`
}

function needlePoint(cx, cy, r, deg) {
  const rad = degToRad(deg)
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/* ── Gauge config per zone ───────────────────────────────────── */
function getZone(score) {
  if (score >= 9) return { color: '#dc2626', label: 'EMERGENCY',  pulse: true  }
  if (score >= 7) return { color: '#ef4444', label: 'CRITICAL',   pulse: false }
  if (score >= 4) return { color: '#f59e0b', label: 'ELEVATED',   pulse: false }
  return              { color: '#22c55e', label: 'MONITORING', pulse: false }
}

/* ── SeverityGauge ───────────────────────────────────────────── */
export default function SeverityGauge({ score = 0 }) {
  const [displayScore, setDisplayScore] = useState(score)
  const animRef = useRef(null)
  const fromRef = useRef(score)

  // Smooth animation toward target score
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    const from  = fromRef.current
    const to    = score
    const start = performance.now()
    const dur   = 600 // ms

    function step(now) {
      const p = Math.min(1, (now - start) / dur)
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      const cur = from + (to - from) * eased
      setDisplayScore(cur)
      if (p < 1) animRef.current = requestAnimationFrame(step)
      else fromRef.current = to
    }
    animRef.current = requestAnimationFrame(step)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [score])

  const zone        = getZone(score)
  const needleDeg   = START_ANGLE + (displayScore / 10) * SWEEP
  const needleTip   = needlePoint(CX, CY, R - 8, needleDeg)
  const needleBase1 = needlePoint(CX, CY, 7, needleDeg + 90)
  const needleBase2 = needlePoint(CX, CY, 7, needleDeg - 90)

  // Arc segments: grey track + colored fill
  const trackPath = arcPath(CX, CY, R, START_ANGLE, START_ANGLE + SWEEP)
  const fillDeg   = START_ANGLE + (displayScore / 10) * SWEEP
  const fillPath  = displayScore > 0.01 ? arcPath(CX, CY, R, START_ANGLE, fillDeg) : null

  // Tick marks at 0,2,4,6,8,10
  const ticks = [0, 2, 4, 6, 8, 10].map(v => {
    const deg = START_ANGLE + (v / 10) * SWEEP
    const inner = needlePoint(CX, CY, R - 12, deg)
    const outer = needlePoint(CX, CY, R + 2, deg)
    return { v, inner, outer, deg }
  })

  const dispRounded = Math.round(displayScore * 10) / 10

  return (
    <div className="flex flex-col items-center py-3 px-2">
      <svg
        width={160} height={130}
        viewBox="0 0 160 120"
        className={zone.pulse ? 'crisis-pulse rounded-full' : ''}
      >
        <defs>
          <filter id="glow-gauge">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Track (grey) */}
        <path d={trackPath} fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round"/>

        {/* Fill arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={zone.color}
            strokeWidth="10"
            strokeLinecap="round"
            filter="url(#glow-gauge)"
            style={{ transition: 'stroke 0.4s ease' }}
          />
        )}

        {/* Tick marks */}
        {ticks.map(({ v, inner, outer }) => (
          <line
            key={v}
            x1={inner.x} y1={inner.y}
            x2={outer.x} y2={outer.y}
            stroke="#334155" strokeWidth="1.5"
          />
        ))}

        {/* Needle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
          fill={zone.color}
          style={{ filter: `drop-shadow(0 0 3px ${zone.color})`, transition: 'fill 0.4s ease' }}
        />
        <circle cx={CX} cy={CY} r="5" fill="#0f172a" stroke={zone.color} strokeWidth="1.5"/>

        {/* Score text */}
        <text
          x={CX} y={CY + 22}
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fontFamily="monospace"
          fill={zone.color}
          style={{ transition: 'fill 0.4s ease' }}
        >
          {dispRounded.toFixed(1)}
        </text>

        {/* Label */}
        <text x={CX} y={CY + 36} textAnchor="middle" fontSize="7" fontWeight="600" fontFamily="sans-serif" fill={zone.color} letterSpacing="2" style={{ transition: 'fill 0.4s ease' }}>
          {zone.label}
        </text>

        {/* Min/Max labels */}
        <text x={14} y={108} textAnchor="middle" fontSize="8" fill="#475569" fontFamily="monospace">0</text>
        <text x={146} y={108} textAnchor="middle" fontSize="8" fill="#475569" fontFamily="monospace">10</text>
      </svg>

      {/* Severity label below */}
      <div
        className="text-[10px] font-semibold tracking-widest uppercase mt-1"
        style={{ color: zone.color, transition: 'color 0.4s ease' }}
      >
        SEVERITY INDEX
      </div>
    </div>
  )
}
