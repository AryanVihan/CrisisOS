import React, { useEffect, useRef, useState } from 'react'
import { GRID_W, GRID_H, colorForTemp, hottestCell } from '../../services/thermalSim.js'

const SCALE = 7 // px per cell → 448 × 336 internal canvas

/**
 * Renders a single thermal camera feed onto a canvas. The grid data is
 * recomputed by the simulation hook; we just paint and detect the hot cell.
 */
export default function ThermalCamera({ camera, grid, height: hist = [], compact = false }) {
  const canvasRef = useRef(null)
  const [hot, setHot] = useState({ t: 0, x: 0, y: 0 })

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs || !grid) return
    const ctx = cvs.getContext('2d')
    const img = ctx.createImageData(GRID_W, GRID_H)
    for (let i = 0; i < grid.length; i++) {
      const [r, g, b] = colorForTemp(grid[i])
      const idx = i * 4
      img.data[idx] = r
      img.data[idx + 1] = g
      img.data[idx + 2] = b
      img.data[idx + 3] = 255
    }
    // Render at 1:1 then upscale via CSS (canvas image-rendering: pixelated)
    ctx.putImageData(img, 0, 0)
    const h = hottestCell(grid)
    setHot(h)
  }, [grid])

  const aspect = GRID_W / GRID_H

  let alertColor = '#22c55e'
  let alertText = 'NORMAL'
  if (hot.t >= 65) { alertColor = '#ef4444'; alertText = 'FIRE DETECTED' }
  else if (hot.t >= 55) { alertColor = '#fb923c'; alertText = 'CRITICAL HEAT' }
  else if (hot.t >= 42) { alertColor = '#f59e0b'; alertText = 'WARM ANOMALY' }

  return (
    <div className="rounded border border-white/10 bg-black overflow-hidden flex flex-col">
      <div className="px-2 py-1 flex items-center justify-between bg-bg-primary/80 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse" />
          <span className="text-[10px] font-mono text-text-primary tracking-wider">{camera.id} · {camera.label}</span>
        </div>
        <span className="text-[9px] font-mono" style={{ color: alertColor }}>{alertText}</span>
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: aspect }}>
        <canvas
          ref={canvasRef}
          width={GRID_W}
          height={GRID_H}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
          }}
        />
        {/* Crosshair on hottest cell */}
        {hot.t >= 38 && (
          <div
            style={{
              position: 'absolute',
              left: `${(hot.x / GRID_W) * 100}%`,
              top: `${(hot.y / GRID_H) * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 22,
              height: 22,
              border: `1.5px solid ${alertColor}`,
              borderRadius: '50%',
              boxShadow: `0 0 8px ${alertColor}`,
              animation: 'pulse 1s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Reading overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 4, left: 4,
            background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${alertColor}55`,
            padding: '2px 6px',
            fontSize: 10,
            color: alertColor,
            fontFamily: 'monospace',
          }}
        >
          {hot.t.toFixed(1)} °C
        </div>
      </div>
      {!compact && hist.length > 1 && (
        <div className="px-2 py-1 border-t border-white/5">
          <div className="text-[9px] uppercase tracking-widest text-text-secondary mb-0.5">90 s history</div>
          <Spark data={hist} color={alertColor} />
        </div>
      )}
    </div>
  )
}

function Spark({ data, color = '#22c55e' }) {
  const max = 80, min = 15
  const w = 200, h = 24
  const step = w / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${h - ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * h}`).join(' ')
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  )
}
