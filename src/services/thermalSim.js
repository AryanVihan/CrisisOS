/* ── Thermal Camera Simulation ─────────────────────────────────
   A simple heat-grid + diffusion simulator used by ThermalCamera.
   Cameras tick independently at ~10 fps. Provides false-color
   data + hottest-cell tracking + anomaly thresholds.
*/

export const THERM_CAMERAS = [
  { id: 'THERM-01', label: 'F3-KITCHEN',  floor: 'Floor 3', baseline: 28, isCrisisCam: true },
  { id: 'THERM-02', label: 'F3-EAST',     floor: 'Floor 3', baseline: 24, isCrisisCam: false },
  { id: 'THERM-03', label: 'F2-COMMON',   floor: 'Floor 2', baseline: 23, isCrisisCam: false },
  { id: 'THERM-04', label: 'LOBBY',       floor: 'Lobby',   baseline: 22, isCrisisCam: false },
]

export const GRID_W = 64
export const GRID_H = 48

export function makeGrid(baseline) {
  const arr = new Float32Array(GRID_W * GRID_H)
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      let t = baseline
      // Walls (perimeter) cooler
      if (x === 0 || x === GRID_W - 1 || y === 0 || y === GRID_H - 1) t = 18
      // Kitchen quadrant warmer
      if (x > GRID_W * 0.55 && y < GRID_H * 0.4) t = baseline + 6
      arr[y * GRID_W + x] = t
    }
  }
  return arr
}

export function makeAllGrids() {
  const map = {}
  THERM_CAMERAS.forEach((c) => { map[c.id] = makeGrid(c.baseline) })
  return map
}

/* ── False-color mapping (15 °C → 70 °C) ───────────────────── */
const STOPS = [
  [15, [10, 10, 143]],
  [20, [26, 58, 255]],
  [25, [0, 207, 207]],
  [30, [0, 204, 68]],
  [35, [255, 238, 0]],
  [40, [255, 136, 0]],
  [50, [255, 34, 0]],
  [65, [255, 255, 255]],
  [80, [255, 0, 0]],
]

export function colorForTemp(t) {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, c0] = STOPS[i]
    const [t1, c1] = STOPS[i + 1]
    if (t <= t1) {
      const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)))
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * u)
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * u)
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * u)
      return [r, g, b]
    }
  }
  return [255, 255, 255]
}

/* ── Heat source state per camera ──────────────────────────── */
export function makeSources() {
  return {
    'THERM-01': [],
    'THERM-02': [],
    'THERM-03': [],
    'THERM-04': [],
  }
}

/**
 * Compute heat-source list for a camera at a given pre-stage and crisis time.
 * preStage: 0..60 (negative not allowed); crisisT: -1 if not yet started, else seconds since smoke trigger
 */
export function sourcesFor(camId, preStage, crisisT) {
  if (camId === 'THERM-01') {
    // Pre-crisis bloom from kitchen at (48,12)
    if (preStage >= 10 || crisisT >= 0) {
      const elapsed = crisisT >= 0 ? 60 + crisisT : preStage
      const intensity = elapsed < 60
        ? 35 + 0.3 * Math.max(0, elapsed - 10)
        : 65 + 1.2 * Math.min(30, elapsed - 60)
      const radius = elapsed < 60
        ? 2 + 0.02 * Math.max(0, elapsed - 10)
        : 5 + 0.15 * Math.min(30, elapsed - 60)
      const sources = [{ x: 48, y: 12, intensity, radius }]
      if (crisisT >= 15) {
        sources.push({ x: 52, y: 18, intensity: intensity * 0.85, radius: radius * 0.7 })
      }
      return sources
    }
  }
  if (camId === 'THERM-02' && crisisT >= 15) {
    const elapsed = crisisT - 15
    return [{ x: 12, y: 24, intensity: 38 + elapsed * 0.5, radius: 3 + elapsed * 0.05 }]
  }
  return []
}

/* ── One diffusion step ─────────────────────────────────────── */
export function diffuse(grid, sources, baseline) {
  const w = GRID_W, h = GRID_H
  // Pull cells toward heat-source-influenced target
  for (let i = 0; i < grid.length; i++) {
    const x = i % w
    const y = (i / w) | 0
    let target = baseline
    for (const s of sources) {
      const dx = x - s.x
      const dy = y - s.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < s.radius) {
        const falloff = 1 - d / s.radius
        const candidate = s.intensity * falloff
        if (candidate > target) target = candidate
      }
    }
    grid[i] = grid[i] + (target - grid[i]) * 0.18
    grid[i] += (Math.random() - 0.5) * 0.4
  }
}

/* ── Hottest-cell helper ─────────────────────────────────── */
export function hottestCell(grid) {
  let best = -Infinity
  let bx = 0, by = 0
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > best) {
      best = grid[i]
      bx = i % GRID_W
      by = (i / GRID_W) | 0
    }
  }
  return { x: bx, y: by, t: best }
}
