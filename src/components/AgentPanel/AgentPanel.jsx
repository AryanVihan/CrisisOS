import React, { useEffect, useRef } from 'react'

// ── Agent config ───────────────────────────────────────────────────────────

const AGENTS = [
  {
    key: 'detection',
    name: 'Detection Agent',
    subtitle: 'Incident Analysis',
    color: 'blue',
    accent: '#3b82f6',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.35)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="6" cy="6" r="4" stroke="#3b82f6" strokeWidth="1.5"/>
        <path d="M9 9l3 3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 4v4M4 6h4" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'coordination',
    name: 'Coordination Agent',
    subtitle: 'Response Planning',
    color: 'amber',
    accent: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.12)',
    accentBorder: 'rgba(245,158,11,0.35)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="3" r="1.5" stroke="#f59e0b" strokeWidth="1.3"/>
        <circle cx="2.5" cy="10.5" r="1.5" stroke="#f59e0b" strokeWidth="1.3"/>
        <circle cx="11.5" cy="10.5" r="1.5" stroke="#f59e0b" strokeWidth="1.3"/>
        <path d="M7 4.5V8M7 8L3.5 10M7 8L10.5 10" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'bridge',
    name: 'Emergency Bridge',
    subtitle: 'First Responder Brief',
    color: 'red',
    accent: '#ef4444',
    accentBg: 'rgba(239,68,68,0.12)',
    accentBorder: 'rgba(239,68,68,0.35)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L1.5 4.5v5L7 13l5.5-3.5v-5L7 1z" stroke="#ef4444" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M7 5v3M5.5 7h3" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status, accent }) {
  const cfg = {
    STANDBY:   { label: 'STANDBY',   bg: 'rgba(148,163,184,0.08)', color: '#64748b' },
    ANALYZING: { label: 'ANALYZING', bg: `rgba(245,158,11,0.15)`,  color: '#f59e0b', pulse: true },
    COMPLETE:  { label: 'COMPLETE',  bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
  }
  const c = cfg[status] ?? cfg.STANDBY
  return (
    <span
      className={c.pulse ? 'animate-pulse' : ''}
      style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
        padding: '2px 6px', borderRadius: 3,
        background: c.bg, color: c.color,
      }}
    >
      {c.label}
    </span>
  )
}

// ── Agent terminal ─────────────────────────────────────────────────────────

function AgentTerminal({ text, status, accent, agentKey }) {
  const ref = useRef(null)
  const isActive = status === 'ANALYZING'
  const isEmpty = !text

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [text])

  return (
    <div
      ref={ref}
      style={{
        background: '#06060a',
        border: `1px solid ${isActive ? accent : 'rgba(148,163,184,0.07)'}`,
        borderRadius: 4,
        padding: '8px 10px',
        fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        fontSize: 10.5,
        lineHeight: 1.65,
        color: '#cbd5e1',
        minHeight: 80,
        maxHeight: 180,
        overflowY: 'auto',
        overflowX: 'hidden',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        transition: 'border-color 0.3s',
        boxShadow: isActive ? `0 0 12px ${accent}22` : 'none',
        position: 'relative',
      }}
    >
      {isEmpty ? (
        <span style={{ color: '#334155', fontStyle: 'italic' }}>
          {status === 'STANDBY' ? '— awaiting previous agent —' : 'Initialising…'}
        </span>
      ) : (
        <>
          {agentKey === 'bridge' ? (
            <span style={{ color: '#86efac' }}>{text}</span>
          ) : (
            <HighlightedText text={text} accent={accent} />
          )}
          {isActive && <span className="agent-cursor" />}
        </>
      )}
    </div>
  )
}

// ── Text highlighter (bold section headers) ────────────────────────────────

function HighlightedText({ text, accent }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const isHeader = /^[A-Z][A-Z &()]+:/.test(line.trimStart()) || /^•/.test(line.trimStart())
        const isBullet = /^[•\-\*]/.test(line.trimStart())
        return (
          <span key={i}>
            {isHeader && !isBullet ? (
              <span style={{ color: accent, fontWeight: 600 }}>{line}</span>
            ) : isBullet ? (
              <span style={{ color: '#94a3b8' }}>{line}</span>
            ) : (
              line
            )}
            {i < lines.length - 1 && '\n'}
          </span>
        )
      })}
    </>
  )
}

// ── Timing chip ────────────────────────────────────────────────────────────

function TimingChip({ ms }) {
  if (!ms) return null
  return (
    <span style={{ fontSize: 9, color: '#22c55e', fontFamily: 'monospace', marginLeft: 6 }}>
      {(ms / 1000).toFixed(1)}s
    </span>
  )
}

// ── Agent card ─────────────────────────────────────────────────────────────

function AgentCard({ agent, output, status, timing }) {
  const isActive = status === 'ANALYZING'

  return (
    <div
      style={{
        borderLeft: `2px solid ${isActive ? agent.accent : 'rgba(148,163,184,0.1)'}`,
        paddingLeft: 10,
        transition: 'border-color 0.3s',
        animation: status !== 'STANDBY' ? 'fade-in 0.35s ease-out' : 'none',
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: agent.accentBg, border: `1px solid ${agent.accentBorder}`,
          }}>
            {agent.icon}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2 }}>{agent.name}</div>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.04em' }}>{agent.subtitle}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <StatusBadge status={status} accent={agent.accent} />
          <TimingChip ms={timing} />
        </div>
      </div>

      {/* Terminal */}
      <AgentTerminal
        text={output}
        status={status}
        accent={agent.accent}
        agentKey={agent.key}
      />
    </div>
  )
}

// ── Progress bar ───────────────────────────────────────────────────────────

function PipelineProgress({ currentStep }) {
  const steps = ['Detection', 'Coordination', 'Bridge']
  const pct = currentStep >= 4 ? 100 : (currentStep / 3) * 100

  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(148,163,184,0.07)' }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>
          AI AGENT PIPELINE
        </div>
        <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace' }}>
          {currentStep === 0 ? 'INITIALISING' :
           currentStep >= 4 ? 'COMPLETE' :
           `AGENT ${currentStep} OF 3`}
        </div>
      </div>

      {/* Progress track */}
      <div style={{ height: 3, background: 'rgba(148,163,184,0.1)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${pct}%`,
          background: currentStep >= 4
            ? 'linear-gradient(90deg, #3b82f6, #f59e0b, #ef4444)'
            : currentStep === 3 ? '#ef4444'
            : currentStep === 2 ? '#f59e0b'
            : '#3b82f6',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 4 }}>
        {steps.map((step, idx) => {
          const stepNum = idx + 1
          const done = currentStep > stepNum
          const active = currentStep === stepNum
          const color = idx === 0 ? '#3b82f6' : idx === 1 ? '#f59e0b' : '#ef4444'
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: done || active ? color : 'rgba(148,163,184,0.15)',
                boxShadow: active ? `0 0 6px ${color}` : 'none',
                flexShrink: 0,
                transition: 'background 0.3s, box-shadow 0.3s',
              }} />
              <span style={{
                fontSize: 9, color: done || active ? color : '#334155',
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.04em',
                transition: 'color 0.3s',
                whiteSpace: 'nowrap',
              }}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main AgentPanel ────────────────────────────────────────────────────────

export default function AgentPanel({ outputs, statuses, timings, currentStep }) {
  return (
    <aside
      className="panel border-l border-r-0 border-y-0 relative z-10 shrink-0 flex flex-col"
      style={{ width: 380, animation: 'fade-in 0.4s ease-out' }}
    >
      {/* Panel header */}
      <div style={{
        padding: '8px 14px',
        borderBottom: '1px solid rgba(148,163,184,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>Crisis Intelligence</div>
          <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.06em', marginTop: 1 }}>
            MULTI-AGENT AI PIPELINE
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.1em' }}>ACTIVE</span>
        </div>
      </div>

      {/* Pipeline progress */}
      <PipelineProgress currentStep={currentStep} />

      {/* Agent cards */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {AGENTS.map(agent => (
          <AgentCard
            key={agent.key}
            agent={agent}
            output={outputs[agent.key]}
            status={statuses[agent.key]}
            timing={timings[agent.key]}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 14px',
        borderTop: '1px solid rgba(148,163,184,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, color: '#1e293b', textAlign: 'center', letterSpacing: '0.05em' }}>
          claude-opus-4-5 · streaming · crisios v1.0
        </div>
      </div>
    </aside>
  )
}
