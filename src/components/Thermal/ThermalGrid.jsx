import React from 'react'
import ThermalCamera from './ThermalCamera.jsx'
import { THERM_CAMERAS } from '../../services/thermalSim.js'

function fmtLead(s) {
  if (s == null) return null
  if (s < 60) return `${Math.round(s)} s`
  return `${Math.floor(s / 60)} m ${Math.round(s % 60)} s`
}

export default function ThermalGrid({ sim }) {
  const { thermalGrids, thermalHistory, thermalAnomaly, thermalAnomalyAt, simulationStatus, elapsedSeconds, preStageSeconds } = sim

  // Lead time = how long thermal saw the fire before smoke sensor fires.
  // We assume smoke trigger happens at scenario t=0 (first sensor in fire scenario).
  // Pre-stage is 60s long, so thermal-detect-at-preStage X gives lead = (60 - X)
  let leadBanner = null
  if (thermalAnomalyAt && simulationStatus === 'pre-crisis') {
    const lead = 60 - thermalAnomalyAt.preStage
    if (lead > 0) leadBanner = `Thermal detected anomaly ${lead}s before any smoke signal`
  } else if (thermalAnomalyAt && (simulationStatus === 'running' || simulationStatus === 'crisis')) {
    // If anomaly was detected pre-crisis, show how much earlier
    if (thermalAnomalyAt.crisisT < 0) {
      const lead = 60 - thermalAnomalyAt.preStage
      leadBanner = `Thermal detected ${lead}s before smoke sensor — early-warning advantage`
    }
  }

  return (
    <div className="h-full w-full overflow-y-auto p-3 bg-bg-primary/40">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-accent-amber">Thermal imaging — IR cameras</div>
          <div className="text-[11px] text-text-secondary mt-0.5">4 thermal sensors · 64 × 48 grid · 10 fps · false-color (15-80 °C)</div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-text-secondary">peak:</span>
          <span style={{ color: thermalAnomaly >= 65 ? '#ef4444' : thermalAnomaly >= 42 ? '#fb923c' : '#22c55e' }}>
            {thermalAnomaly.toFixed(1)} °C
          </span>
        </div>
      </div>

      {leadBanner && (
        <div className="mb-2 px-3 py-2 rounded border border-amber-400/40 bg-amber-500/10 text-amber-200 text-[11px] font-semibold">
          ⚠ {leadBanner}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {THERM_CAMERAS.map((cam) => (
          <ThermalCamera
            key={cam.id}
            camera={cam}
            grid={thermalGrids[cam.id]}
            height={thermalHistory[cam.id]}
          />
        ))}
      </div>

      {/* Color scale legend */}
      <div className="mt-3 rounded border border-white/10 bg-bg-primary/60 px-3 py-2">
        <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-1">Temperature scale</div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-text-secondary w-6">15°</span>
          <div
            className="flex-1 h-3 rounded"
            style={{
              background: 'linear-gradient(90deg, rgb(10,10,143), rgb(26,58,255), rgb(0,207,207), rgb(0,204,68), rgb(255,238,0), rgb(255,136,0), rgb(255,34,0), rgb(255,255,255))',
            }}
          />
          <span className="text-[9px] font-mono text-text-secondary w-8 text-right">80°+</span>
        </div>
      </div>
    </div>
  )
}
