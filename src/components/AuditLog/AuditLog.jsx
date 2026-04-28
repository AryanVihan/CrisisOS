import React, { useEffect, useRef, useState } from 'react'
import { useDerivedTimeline } from '../../hooks/useDerivedTimeline.js'

const TAG_COLORS = {
  cyan:   'text-cyan-400',
  purple: 'text-purple-400',
  amber:  'text-accent-amber',
  green:  'text-accent-green',
  red:    'text-accent-red',
}

const LEVEL_COLORS = {
  cyan:   'text-cyan-300',
  purple: 'text-purple-300',
  amber:  'text-accent-amber',
  green:  'text-accent-green',
  red:    'text-accent-red',
}

function lineToText(line) {
  return `[${line.ts}] [${line.tag}] ${line.detail}`
}

export default function AuditLog({ sim }) {
  const { auditLines } = useDerivedTimeline(sim)
  const bottomRef = useRef(null)
  const [copyState, setCopyState] = useState('idle')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [auditLines.length])

  const handleExport = async () => {
    const txt = auditLines.map(lineToText).join('\n')
    try {
      await navigator.clipboard.writeText(txt)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('failed')
      setTimeout(() => setCopyState('idle'), 1600)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-black/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 bg-bg-primary/70">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Audit log</div>
          <div className="text-sm font-semibold text-white">
            Legal-grade system journal · {auditLines.length} entries
          </div>
        </div>
        <button
          onClick={handleExport}
          className={`px-3 py-1.5 rounded-md border text-[10px] font-semibold uppercase tracking-widest transition-colors ${
            copyState === 'copied'
              ? 'bg-accent-green/15 border-accent-green/40 text-accent-green'
              : copyState === 'failed'
              ? 'bg-accent-red/15 border-accent-red/40 text-accent-red'
              : 'bg-white/10 border-white/15 text-text-primary hover:bg-white/15'
          }`}
        >
          {copyState === 'copied' ? 'Copied ✓' : copyState === 'failed' ? 'Copy failed' : 'Export Log'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed">
        {auditLines.length === 0 ? (
          <div className="text-text-secondary opacity-70">[ awaiting events — trigger a scenario to populate the audit log ]</div>
        ) : (
          <pre className="whitespace-pre-wrap break-words">
            {auditLines.map((line) => (
              <div key={line.id} className="flex flex-wrap gap-x-2">
                <span className="text-text-secondary">[{line.ts}]</span>
                <span className={`font-semibold ${TAG_COLORS[line.tagColor] ?? 'text-text-secondary'}`}>
                  [{line.tag}]
                </span>
                <span className={LEVEL_COLORS[line.levelColor] ?? 'text-text-primary'}>
                  {line.detail}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </pre>
        )}
      </div>
    </div>
  )
}
