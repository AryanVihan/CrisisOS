import React, { useMemo } from 'react'

// Small synthetic QR-style pattern. We render an SVG with a deterministic
// pseudo-random matrix so it looks the part for a demo screenshot. The label
// underneath tells the user where to navigate.
function makeMatrix(seed = 42, size = 21) {
  const m = []
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  for (let r = 0; r < size; r++) {
    const row = []
    for (let c = 0; c < size; c++) {
      row.push(rand() > 0.5 ? 1 : 0)
    }
    m.push(row)
  }
  // Add finder patterns in 3 corners
  const drawFinder = (rr, cc) => {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const r = rr + dr
        const c = cc + dc
        if (r < 0 || r >= size || c < 0 || c >= size) continue
        const onEdge = dr === 0 || dr === 6 || dc === 0 || dc === 6
        const inner  = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
        m[r][c] = onEdge || inner ? 1 : 0
      }
    }
  }
  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)
  return m
}

export default function QRBadge({ path = '/guest', label = 'Scan to open guest view' }) {
  const matrix = useMemo(() => makeMatrix(7, 21), [])
  const cell = 5
  const size = matrix.length * cell
  const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path

  return (
    <div className="rounded-xl border border-white/10 bg-bg-primary/70 p-3 flex items-center gap-3">
      <div className="rounded bg-white p-1.5">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect width={size} height={size} fill="#fff" />
          {matrix.map((row, r) =>
            row.map((v, c) =>
              v ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#0a0a0f" /> : null
            )
          )}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">{label}</div>
        <div className="text-[11px] text-text-primary font-semibold truncate mt-1">{path}</div>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1 px-2 py-1 rounded bg-accent-blue/15 border border-accent-blue/30 text-[10px] text-accent-blue uppercase tracking-widest hover:bg-accent-blue/25"
        >
          Open in new tab →
        </a>
        <div className="text-[9px] text-text-secondary truncate mt-1">{url}</div>
      </div>
    </div>
  )
}
