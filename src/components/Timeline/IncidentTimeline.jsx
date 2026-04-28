import React, { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useDerivedTimeline,
  CATEGORY_STYLES,
  secondsToElapsedLabel,
  secondsToHHMMSS,
} from '../../hooks/useDerivedTimeline.js'

/* ── Icons ────────────────────────────────────────────────────── */
function Icon({ name, color }) {
  const fill = color
  switch (name) {
    case 'sensor':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="2" fill={fill}/>
          <circle cx="8" cy="8" r="5" stroke={fill} strokeWidth="1" opacity="0.5"/>
        </svg>
      )
    case 'sos':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke={fill} strokeWidth="1.4"/>
          <text x="8" y="11" textAnchor="middle" fontSize="6" fontWeight="700" fill={fill} fontFamily="sans-serif">!</text>
        </svg>
      )
    case 'agent':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="2" stroke={fill} strokeWidth="1.4"/>
          <circle cx="6" cy="7" r="0.9" fill={fill}/>
          <circle cx="10" cy="7" r="0.9" fill={fill}/>
          <path d="M6 10.5 Q8 11.8 10 10.5" stroke={fill} strokeWidth="1" fill="none" strokeLinecap="round"/>
        </svg>
      )
    case 'dispatch':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 11h12M5 11V6l3-3 3 3v5" stroke={fill} strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      )
    case 'evac':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h7M7 5l3 3-3 3" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 3v10" stroke={fill} strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )
    case 'protocol':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5 2 4v5c0 3 2.6 5 6 5.5C11.4 14 14 12 14 9V4z" stroke={fill} strokeWidth="1.4" fill="none"/>
          <path d="M5.5 8l2 2 3-3.5" stroke={fill} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'speaker':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 6v4h2l3 3V3L5 6H3z" fill={fill}/>
          <path d="M11 5.5c1 .8 1 4.2 0 5M13 4c2 1.5 2 6.5 0 8" stroke={fill} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        </svg>
      )
    case 'external':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v6m0 0l-2.5-2.5M8 8l2.5-2.5" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 11v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke={fill} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        </svg>
      )
    case 'resolution':
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke={fill} strokeWidth="1.4"/>
          <path d="M5 8.5l2 2 4-4.5" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      )
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" fill={fill}/>
        </svg>
      )
  }
}

/* ── Single entry ────────────────────────────────────────────── */
function TimelineEntry({ entry, isLast }) {
  const style = CATEGORY_STYLES[entry.category] ?? CATEGORY_STYLES.detection

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative pl-6"
    >
      {/* Spine */}
      {!isLast && (
        <div className="absolute left-[7px] top-3 bottom-[-12px] w-px bg-white/10" />
      )}
      {/* Dot */}
      <div
        className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full flex items-center justify-center border"
        style={{ borderColor: style.color, background: 'rgba(10,10,15,0.95)' }}
      >
        <span className="block w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />
      </div>

      <div
        className={`rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors p-3 border-l-[3px]`}
        style={{ borderLeftColor: style.color }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon name={entry.icon} color={style.color} />
            <span className={`text-[10px] font-mono font-semibold tracking-widest uppercase`} style={{ color: style.color }}>
              {style.label}
            </span>
            <span className="text-[10px] font-mono text-text-secondary">
              {secondsToElapsedLabel(entry.t)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-text-secondary">
            {secondsToHHMMSS(entry.t)}
          </span>
        </div>

        <div className="mt-1.5 text-sm font-semibold text-text-primary leading-snug">
          {entry.title}
        </div>
        {entry.description && entry.description !== entry.title && (
          <div className="mt-1 text-xs text-text-secondary leading-snug">
            {entry.description}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={`text-[9px] px-1.5 py-px rounded font-mono ${style.cssBg} ${style.cssText}`}>
            {entry.source}
          </span>
          {entry.severity && (
            <span className="text-[9px] px-1.5 py-px rounded font-mono bg-white/10 text-text-secondary">
              {entry.severity}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Component ───────────────────────────────────────────────── */
export default function IncidentTimeline({ sim }) {
  const { entries } = useDerivedTimeline(sim)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [entries.length])

  const handleExport = () => {
    window.print()
  }

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-white/10 bg-bg-primary/80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Incident timeline</div>
          <div className="text-sm font-semibold text-white">
            {entries.length} chronological events
          </div>
        </div>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 border border-white/15 text-[10px] font-semibold uppercase tracking-widest text-text-primary transition-colors"
        >
          Export PDF
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-secondary">
            <div className="text-3xl opacity-25 mb-2">⏱</div>
            <div className="text-xs">Awaiting first event</div>
            <div className="text-[10px] mt-1 opacity-60">Trigger a scenario to populate the timeline</div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {entries.map((e, idx) => (
                <TimelineEntry key={e.id} entry={e} isLast={idx === entries.length - 1} />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  )
}
