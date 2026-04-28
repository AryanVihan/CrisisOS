import React, { useState } from 'react'

const SPEEDS = [1, 2, 4]
const TIME_PRESETS = [
  { label: 'T+0',  t: 0 },
  { label: 'T+15', t: 15 },
  { label: 'T+30', t: 30 },
  { label: 'T+60', t: 60 },
  { label: 'T+90', t: 90 },
]

export default function DemoController({
  visible,
  onToggleVisible,
  sim,
  presentationMode,
  onTogglePresentation,
  onToggleStats,
  statsVisible,
  onToggleNarration,
  narrationVisible,
  onReplayIntro,
}) {
  const [open, setOpen] = useState(true)
  const isRunning = sim.simulationStatus === 'running' || sim.simulationStatus === 'crisis'

  if (!visible) {
    return (
      <button
        onClick={onToggleVisible}
        className="fixed bottom-3 right-3 z-[60] px-3 py-1.5 rounded-full border border-white/20 bg-bg-secondary/90 text-text-secondary text-[10px] uppercase tracking-widest hover:text-text-primary hover:bg-bg-secondary"
        title="Show demo controller"
      >
        ⚙ Demo
      </button>
    )
  }

  return (
    <div className="fixed bottom-3 right-3 z-[60] w-[300px] rounded-2xl border border-white/10 bg-bg-secondary/95 backdrop-blur shadow-2xl">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 border-b border-white/10"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs uppercase tracking-[0.3em] text-purple-300 font-semibold">Demo Control</span>
        </div>
        <span className="text-[10px] text-text-secondary">{open ? '▼' : '▲'}</span>
      </button>

      {open && (
        <div className="p-3 space-y-3 max-h-[80vh] overflow-y-auto">
          {/* Speed */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-1.5">Sim speed</div>
            <div className="grid grid-cols-3 gap-1">
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => sim.setSimulationSpeed(s)}
                  className={`py-1.5 rounded text-[11px] font-bold ${
                    sim.simulationSpeed === s
                      ? 'bg-accent-blue text-white'
                      : 'bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Jump to time */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-1.5">Jump to T+</div>
            <div className="grid grid-cols-5 gap-1">
              {TIME_PRESETS.map(p => (
                <button
                  key={p.t}
                  disabled={!isRunning}
                  onClick={() => sim.seekToTime(p.t)}
                  className="py-1.5 rounded text-[10px] bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Twists */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-1.5">Mid-crisis twists</div>
            <div className="space-y-1">
              <button
                disabled={!isRunning}
                onClick={() => sim.blockExit('EX-05 (North Stairwell)')}
                className="w-full py-1.5 rounded bg-accent-amber/15 text-accent-amber border border-accent-amber/30 text-[11px] hover:bg-accent-amber/25 disabled:opacity-40"
              >
                Block Stairwell A (EX-05)
              </button>
              <button
                disabled={!isRunning}
                onClick={() => sim.triggerManualSOS('Floor 4', 'Room 420')}
                className="w-full py-1.5 rounded bg-accent-red/15 text-accent-red border border-accent-red/30 text-[11px] hover:bg-accent-red/25 disabled:opacity-40"
              >
                Inject SOS — Room 420
              </button>
              <button
                disabled={!isRunning}
                onClick={() => sim.findAllGuests()}
                className="w-full py-1.5 rounded bg-accent-green/15 text-accent-green border border-accent-green/30 text-[11px] hover:bg-accent-green/25 disabled:opacity-40"
              >
                Find all missing guests
              </button>
            </div>
          </div>

          {/* Edge / connectivity */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-1.5">Network resilience</div>
            <div className="space-y-1">
              {sim.connState?.mode === 'cloud' ? (
                <button
                  onClick={sim.simulateDisconnect}
                  className="w-full py-1.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 text-[11px] hover:bg-amber-500/25"
                >
                  ⚡ Simulate Network Failure
                </button>
              ) : (
                <button
                  onClick={sim.simulateReconnect}
                  className="w-full py-1.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-[11px] hover:bg-emerald-500/25"
                >
                  ☁ Restore Cloud Connection
                </button>
              )}
              {sim.connState?.mode === 'cloud' && (
                <button
                  onClick={sim.simulateDegraded}
                  className="w-full py-1.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-400/20 text-[11px] hover:bg-yellow-500/20"
                >
                  ⚠ Simulate Degraded Conn
                </button>
              )}
            </div>
          </div>

          {/* Overlays */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mb-1.5">Overlays</div>
            <div className="space-y-1">
              <ToggleRow label="Presentation mode"  on={presentationMode}  onToggle={onTogglePresentation} />
              <ToggleRow label="Narration bar"      on={narrationVisible}  onToggle={onToggleNarration} />
              <ToggleRow label="Stats overlay"      on={statsVisible}      onToggle={onToggleStats} />
            </div>
          </div>

          {/* Misc */}
          <div className="space-y-1">
            <button
              onClick={onReplayIntro}
              className="w-full py-1.5 rounded bg-white/5 text-text-secondary border border-white/10 text-[11px] hover:bg-white/10"
            >
              Replay intro splash
            </button>
            {isRunning && (
              <button
                onClick={sim.resetSimulation}
                className="w-full py-1.5 rounded bg-white/5 text-text-secondary border border-white/10 text-[11px] hover:bg-white/10"
              >
                Reset simulation
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-secondary border-t border-white/5 pt-2">
            <span>Speed {sim.simulationSpeed}× · T+{sim.elapsedSeconds}s</span>
            <button onClick={onToggleVisible} className="hover:text-text-primary">Hide</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleRow({ label, on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition ${
        on ? 'bg-purple-500/15 text-purple-200 border border-purple-400/30' : 'bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10'
      }`}
    >
      <span>{label}</span>
      <span className={`px-1.5 py-px rounded text-[9px] font-bold ${on ? 'bg-purple-400/30 text-purple-100' : 'bg-white/10 text-text-secondary'}`}>
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  )
}
