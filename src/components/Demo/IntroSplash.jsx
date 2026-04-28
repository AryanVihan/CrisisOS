import React, { useEffect, useState } from 'react'

const STAGES = [
  { delay: 0,    text: 'Initializing…' },
  { delay: 600,  text: 'Loading Horizon Grand Hotel…' },
  { delay: 1100, text: 'Connecting 24 sensors…' },
  { delay: 1600, text: 'Starting 6 specialized agents…' },
  { delay: 2100, text: 'Activating speaker system & vision…' },
  { delay: 2600, text: 'CrisisOS · Ready' },
]

const TOTAL_MS = 3300

export default function IntroSplash({ visible, onDismiss }) {
  const [stageIndex, setStageIndex] = useState(0)
  const [hidden, setHidden]         = useState(false)

  useEffect(() => {
    if (!visible) return
    setHidden(false)
    setStageIndex(0)
    const timers = STAGES.map((s, i) =>
      setTimeout(() => setStageIndex(i), s.delay)
    )
    const closeT = setTimeout(() => {
      setHidden(true)
      setTimeout(() => onDismiss?.(), 500)
    }, TOTAL_MS)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(closeT)
    }
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center transition-opacity duration-500 ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(20,20,30,0.98) 0%, rgba(8,8,12,1) 100%)',
      }}
    >
      <div className="splash-grid absolute inset-0 pointer-events-none" />
      <div className="relative text-center px-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-accent-red/20 border border-accent-red/50 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L2 5v6l6 4 6-4V5L8 1z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 6v4M6 8h4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-accent-red text-3xl font-bold tracking-tight glow-red">CrisisOS</div>
            <div className="text-text-secondary text-[10px] uppercase tracking-[0.4em] mt-0.5">Hotel emergency response</div>
          </div>
        </div>

        <div className="text-text-primary text-base font-semibold mt-6">From detection to resolution</div>
        <div className="text-text-primary text-3xl font-extrabold tracking-tight mt-1">in under 90 seconds.</div>

        <div className="mt-8 w-72 mx-auto">
          <div className="h-1 rounded bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-blue via-accent-amber to-accent-red"
              style={{
                width: '0%',
                animation: `splash-progress ${TOTAL_MS}ms linear forwards`,
              }}
            />
          </div>
          <div className="mt-3 text-[11px] font-mono text-text-secondary uppercase tracking-widest min-h-[14px]">
            {STAGES[stageIndex]?.text}
          </div>
        </div>

        <button
          onClick={() => { setHidden(true); setTimeout(() => onDismiss?.(), 300) }}
          className="mt-10 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-text-secondary text-[10px] uppercase tracking-widest hover:text-text-primary hover:bg-white/10"
        >
          Skip intro →
        </button>
      </div>
    </div>
  )
}
