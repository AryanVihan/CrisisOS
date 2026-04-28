import React, { useEffect, useRef, useState } from 'react'

const PALETTES = {
  TRACKING:  { box: '#22c55e', label: 'TRACKING' },
  ELEVATED:  { box: '#f59e0b', label: 'ELEVATED MOVEMENT' },
  ANOMALY:   { box: '#ef4444', label: 'ANOMALY DETECTED' },
}

function rand(min, max) {
  return Math.random() * (max - min) + min
}

function makePerson(width, height, side) {
  const startX = side === 'left' ? rand(20, 60) : rand(width - 60, width - 20)
  const startY = rand(height * 0.45, height - 30)
  return {
    x: startX,
    y: startY,
    vx: rand(-0.5, 0.5),
    vy: rand(-0.2, 0.2),
    targetX: rand(40, width - 40),
    targetY: rand(height * 0.45, height - 30),
    waitTicks: 0,
  }
}

const CAM_PROFILES = {
  'CAM-01': { label: 'CAM-01 · LOBBY',                normal: 6,  panic: 14, exitX: (w) => w * 0.5  },
  'CAM-02': { label: 'CAM-02 · FL2-CORRIDOR',         normal: 3,  panic: 6,  exitX: (w) => w - 30 },
  'CAM-03': { label: 'CAM-03 · FL3-EAST-CORRIDOR',    normal: 5,  panic: 10, exitX: (w) => 30, isCrisis: true },
  'CAM-04': { label: 'CAM-04 · MAIN-EXIT',            normal: 1,  panic: 18, exitX: (w) => w * 0.5,  isExit: true },
}

/**
 * @param {object} props
 * @param {string} props.cameraId
 * @param {number} props.severity   0-10
 * @param {boolean} props.evacuationActive
 * @param {boolean} props.visionAgentActive
 * @param {boolean} props.expanded   Big size for expanded view
 */
export default function CCTVFeed({
  cameraId,
  severity = 0,
  evacuationActive = false,
  visionAgentActive = false,
  expanded = false,
  onClick,
  hideUiChrome = false,
}) {
  const canvasRef = useRef(null)
  const personsRef = useRef([])
  const animRef    = useRef(null)
  const lastRef    = useRef(0)
  const blinkRef   = useRef(0)
  const sweepRef   = useRef(0)
  const [stats, setStats] = useState({ count: 0, movement: 0, anomaly: 0, status: 'NORMAL' })

  const profile = CAM_PROFILES[cameraId] ?? CAM_PROFILES['CAM-01']
  const W = expanded ? 720 : 320
  const H = expanded ? 480 : 240

  // Manage population
  useEffect(() => {
    const targetCount = (severity >= 7 || evacuationActive)
      ? profile.panic
      : profile.normal
    while (personsRef.current.length < targetCount) {
      personsRef.current.push(makePerson(W, H, Math.random() > 0.5 ? 'left' : 'right'))
    }
    while (personsRef.current.length > targetCount) {
      personsRef.current.pop()
    }
  }, [severity, evacuationActive, profile, W, H])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const draw = (ts) => {
      animRef.current = requestAnimationFrame(draw)
      // Throttle to ~15fps
      if (ts - lastRef.current < 66) return
      lastRef.current = ts

      // Background
      ctx.fillStyle = '#1a1a22'
      ctx.fillRect(0, 0, W, H)

      // Wall vertical stripes
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let i = 0; i < W; i += 32) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, H * 0.7)
        ctx.stroke()
      }

      // Floor band
      const floorY = H * 0.7
      const floorGrad = ctx.createLinearGradient(0, floorY, 0, H)
      floorGrad.addColorStop(0, '#2a2a34')
      floorGrad.addColorStop(1, '#1f1f28')
      ctx.fillStyle = floorGrad
      ctx.fillRect(0, floorY, W, H - floorY)

      // Floor lines (perspective)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      for (let i = 0; i < 5; i++) {
        const y = floorY + ((H - floorY) * i) / 5
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }

      // Ceiling fixtures
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      for (let i = 0; i < 3; i++) {
        const x = (W / 4) * (i + 1) - 12
        ctx.fillRect(x, 14, 24, 4)
        // Light glow
        const glow = ctx.createRadialGradient(x + 12, 18, 0, x + 12, 18, 60)
        glow.addColorStop(0, 'rgba(255,236,180,0.10)')
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.fillRect(x - 50, 0, 124, H * 0.6)
        ctx.fillStyle = 'rgba(255,255,255,0.06)'
      }

      // Side doors
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.fillRect(0, H * 0.45, 18, H * 0.5)
      ctx.fillRect(W - 18, H * 0.45, 18, H * 0.5)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.strokeRect(0, H * 0.45, 18, H * 0.5)
      ctx.strokeRect(W - 18, H * 0.45, 18, H * 0.5)

      // Update + draw persons
      const persons = personsRef.current
      const isAnomaly = profile.isCrisis && severity >= 7
      const isElevated = severity >= 4 && severity < 7
      let totalMotion = 0

      const exitX = profile.exitX(W)
      const exitY = profile.isExit ? H - 30 : H * 0.6
      persons.forEach((p) => {
        let speed = 0.6
        if (isElevated) speed = 1.3
        if (isAnomaly) speed = 2.2
        if (evacuationActive) speed = 2.4

        if (evacuationActive || isAnomaly) {
          // Move toward exit
          const dx = exitX - p.x
          const dy = exitY - p.y
          const len = Math.hypot(dx, dy) || 1
          p.vx = (dx / len) * speed
          p.vy = (dy / len) * speed
        } else {
          // Random wander, occasional retarget
          if (--p.waitTicks <= 0) {
            p.targetX = rand(40, W - 40)
            p.targetY = rand(H * 0.45, H - 30)
            p.waitTicks = Math.floor(rand(40, 90))
          }
          const dx = p.targetX - p.x
          const dy = p.targetY - p.y
          const len = Math.hypot(dx, dy) || 1
          p.vx = (dx / len) * speed
          p.vy = (dy / len) * speed
        }

        p.x += p.vx
        p.y += p.vy
        totalMotion += Math.hypot(p.vx, p.vy)

        // Wrap / clamp
        p.x = Math.max(15, Math.min(W - 15, p.x))
        p.y = Math.max(H * 0.4, Math.min(H - 15, p.y))

        // Body
        ctx.fillStyle = '#9ca3af'
        ctx.fillRect(p.x - 5, p.y - 10, 10, 20)
        // Head
        ctx.beginPath()
        ctx.arc(p.x, p.y - 14, 4, 0, Math.PI * 2)
        ctx.fill()

        // Bounding box
        let palette = PALETTES.TRACKING
        if (isAnomaly) palette = PALETTES.ANOMALY
        else if (isElevated) palette = PALETTES.ELEVATED

        ctx.strokeStyle = palette.box
        ctx.lineWidth = 1
        ctx.strokeRect(p.x - 8, p.y - 18, 16, 30)

        if (expanded) {
          const conf = isAnomaly ? Math.floor(rand(89, 99)) : Math.floor(rand(72, 92))
          ctx.fillStyle = palette.box
          ctx.font = '10px monospace'
          ctx.fillText(`${palette.label} ${conf}%`, p.x - 8, p.y - 22)
        }
      })

      // Scanline overlay
      ctx.fillStyle = 'rgba(255,255,255,0.025)'
      for (let y = 0; y < H; y += 2) {
        ctx.fillRect(0, y, W, 1)
      }

      // Vision agent purple sweep
      if (visionAgentActive) {
        sweepRef.current = (sweepRef.current + 4) % (H + 60)
        const grad = ctx.createLinearGradient(0, sweepRef.current - 30, 0, sweepRef.current + 30)
        grad.addColorStop(0, 'rgba(168,85,247,0.0)')
        grad.addColorStop(0.5, 'rgba(168,85,247,0.55)')
        grad.addColorStop(1, 'rgba(168,85,247,0.0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, sweepRef.current - 30, W, 60)
        ctx.fillStyle = 'rgba(168,85,247,0.85)'
        ctx.font = `bold ${expanded ? 14 : 11}px monospace`
        ctx.fillText('AI ANALYSIS IN PROGRESS', 14, H - 36)
      }

      // Film grain
      const grainAmount = Math.floor(W * H * 0.001)
      for (let i = 0; i < grainAmount; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
      }

      if (!hideUiChrome) {
        // Corner brackets
        const c = '#22c55e'
        ctx.strokeStyle = c
        ctx.lineWidth = 1.5
        const len = 14
        // TL
        ctx.beginPath(); ctx.moveTo(6, 6 + len); ctx.lineTo(6, 6); ctx.lineTo(6 + len, 6); ctx.stroke()
        // TR
        ctx.beginPath(); ctx.moveTo(W - 6 - len, 6); ctx.lineTo(W - 6, 6); ctx.lineTo(W - 6, 6 + len); ctx.stroke()
        // BL
        ctx.beginPath(); ctx.moveTo(6, H - 6 - len); ctx.lineTo(6, H - 6); ctx.lineTo(6 + len, H - 6); ctx.stroke()
        // BR
        ctx.beginPath(); ctx.moveTo(W - 6 - len, H - 6); ctx.lineTo(W - 6, H - 6); ctx.lineTo(W - 6, H - 6 - len); ctx.stroke()

        // Camera ID top-left
        ctx.fillStyle = '#22c55e'
        ctx.font = `bold ${expanded ? 13 : 10}px monospace`
        ctx.fillText(profile.label, 14, 22)

        // Person count
        ctx.fillStyle = '#22c55e'
        ctx.fillText(`PERSONS: ${persons.length}`, 14, 36)

        // Timestamp top-right
        const now = new Date()
        const tstr = now.toLocaleTimeString('en-US', { hour12: false })
        const tw = ctx.measureText(tstr).width
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(tstr, W - 14 - tw, 22)

        // REC blinking bottom-left
        blinkRef.current = (blinkRef.current + 1) % 30
        if (blinkRef.current < 18) {
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.arc(18, H - 16, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = '#ef4444'
        ctx.fillText('REC', 28, H - 12)

        // Resolution bottom-right
        const res = '1080p'
        const rw = ctx.measureText(res).width
        ctx.fillStyle = '#cbd5e1'
        ctx.fillText(res, W - 14 - rw, H - 12)
      }

      // Stats (throttled)
      const movement = Math.min(100, Math.floor((totalMotion / Math.max(1, persons.length)) * 35))
      let anomaly = 0
      if (isElevated) anomaly = 55 + Math.floor(rand(-5, 5))
      if (isAnomaly) anomaly = 88 + Math.floor(rand(-4, 6))
      if (evacuationActive && profile.isExit) anomaly = Math.max(anomaly, 60)
      const status = anomaly >= 70 ? 'ANOMALY' : anomaly >= 40 ? 'ELEVATED' : 'NORMAL'
      // Update stats less often to avoid React thrash
      if ((blinkRef.current % 6) === 0) {
        setStats({ count: persons.length, movement, anomaly, status })
      }
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [W, H, severity, evacuationActive, visionAgentActive, profile, expanded, hideUiChrome])

  const isAlerted = stats.anomaly >= 70

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl overflow-hidden transition cursor-pointer ${
        expanded ? 'w-full' : 'w-full'
      }`}
      style={{
        boxShadow: isAlerted
          ? '0 0 0 2px rgba(239,68,68,0.7), 0 0 24px rgba(239,68,68,0.35)'
          : '0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      <div className="relative bg-black">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full h-auto"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
        {isAlerted && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-accent-red text-[9px] font-bold uppercase tracking-widest text-white animate-pulse">
            Anomaly
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-px bg-white/5 text-[9px] font-mono">
        <div className="bg-bg-secondary px-2 py-1">
          <div className="text-text-secondary uppercase tracking-widest">Persons</div>
          <div className="text-accent-blue text-xs">{stats.count}</div>
        </div>
        <div className="bg-bg-secondary px-2 py-1">
          <div className="text-text-secondary uppercase tracking-widest">Motion</div>
          <div className="text-accent-amber text-xs">{stats.movement}</div>
        </div>
        <div className="bg-bg-secondary px-2 py-1">
          <div className="text-text-secondary uppercase tracking-widest">Anomaly</div>
          <div className={`text-xs ${stats.anomaly >= 70 ? 'text-accent-red' : 'text-text-primary'}`}>{stats.anomaly}</div>
        </div>
        <div className="bg-bg-secondary px-2 py-1">
          <div className="text-text-secondary uppercase tracking-widest">Status</div>
          <div className={`text-xs ${
            stats.status === 'ANOMALY' ? 'text-accent-red' :
            stats.status === 'ELEVATED' ? 'text-accent-amber' : 'text-accent-green'
          }`}>{stats.status}</div>
        </div>
      </div>
    </div>
  )
}
