import React, { useState } from 'react'
import CCTVFeed from './CCTVFeed.jsx'

const CAMERAS = ['CAM-01', 'CAM-02', 'CAM-03', 'CAM-04']

export default function CCTVGrid({ severity, evacuationActive, visionAgentActive }) {
  const [expandedId, setExpandedId] = useState(null)

  if (expandedId) {
    return (
      <div className="h-full flex flex-col p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Surveillance · expanded</div>
            <div className="text-base font-semibold text-white">{expandedId}</div>
          </div>
          <button
            onClick={() => setExpandedId(null)}
            className="px-3 py-1.5 rounded bg-white/10 border border-white/15 text-text-secondary text-[10px] font-semibold uppercase tracking-widest hover:bg-white/15 hover:text-text-primary transition"
          >
            ← Back to grid
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <CCTVFeed
            cameraId={expandedId}
            severity={severity}
            evacuationActive={evacuationActive}
            visionAgentActive={visionAgentActive}
            expanded
          />
        </div>
        {visionAgentActive && (
          <div className="mt-2 text-[10px] text-purple-300 uppercase tracking-widest">
            ◯ Vision agent active — bounding boxes refreshed every frame
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Surveillance grid</div>
          <div className="text-base font-semibold text-white">4 cameras · 15 fps</div>
        </div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] uppercase tracking-widest ${
          visionAgentActive
            ? 'border border-purple-400/40 bg-purple-500/15 text-purple-300'
            : 'border border-white/10 bg-white/5 text-text-secondary'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${visionAgentActive ? 'bg-purple-300 animate-pulse' : 'bg-text-secondary/50'}`} />
          Vision Agent {visionAgentActive ? 'Active' : 'Standby'}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-3">
          {CAMERAS.map((cam) => (
            <div key={cam} onClick={() => setExpandedId(cam)}>
              <CCTVFeed
                cameraId={cam}
                severity={severity}
                evacuationActive={evacuationActive}
                visionAgentActive={visionAgentActive}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
