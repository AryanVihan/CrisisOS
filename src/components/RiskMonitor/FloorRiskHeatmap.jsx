import React from 'react'
import { RISK_LEVEL_COLOR } from '../../services/riskPredictor.js'

function levelFor(score) {
  if (score >= 86) return 'CRITICAL'
  if (score >= 71) return 'HIGH'
  if (score >= 51) return 'ELEVATED'
  if (score >= 26) return 'GUARDED'
  return 'LOW'
}

export default function FloorRiskHeatmap({ topFloors = [] }) {
  return (
    <div className="space-y-1.5">
      {topFloors.map((f) => {
        const lvl = levelFor(f.score)
        const color = RISK_LEVEL_COLOR[lvl]
        return (
          <div key={f.floor} className="flex items-center gap-3">
            <div className="w-16 text-[11px] text-text-secondary font-mono">{f.floor}</div>
            <div className="flex-1 h-3 bg-white/5 rounded overflow-hidden relative">
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, f.score)}%`,
                  background: `linear-gradient(90deg, ${color}55, ${color})`,
                  transition: 'width 0.6s ease, background 0.3s ease',
                }}
              />
            </div>
            <div className="w-16 text-right text-[11px] font-mono" style={{ color }}>
              {f.score} · {lvl}
            </div>
          </div>
        )
      })}
    </div>
  )
}
