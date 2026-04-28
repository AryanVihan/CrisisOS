import React, { useMemo } from 'react'

const COLUMN_LABELS = [
  { key: 'available', label: 'AVAILABLE', color: 'bg-accent-blue/10 text-accent-blue' },
  { key: 'enRoute', label: 'EN ROUTE', color: 'bg-accent-amber/10 text-accent-amber' },
  { key: 'onScene', label: 'ON SCENE', color: 'bg-accent-red/10 text-accent-red' },
  { key: 'evacuating', label: 'EVACUATING', color: 'bg-accent-green/10 text-accent-green' },
]

const getStatus = (assignment) => {
  const text = `${assignment.assignment ?? ''} ${assignment.location ?? ''}`.toLowerCase()
  if (/(evacuate|evacuation|stairwell|triage|guest flow|sweep|dispatch|wing entrance|follow-up|door-to-door)/i.test(text)) {
    if (/(triage|lobby|reception|assembly|staging|guest accounting|medical)/i.test(text)) return 'onScene'
    return 'enRoute'
  }
  if (/(assist|escort|guide|evacuating)/i.test(text)) return 'evacuating'
  return 'available'
}

const initials = (name) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()

export default function DispatchBoard({ assignments = [] }) {
  const columns = useMemo(() => {
    const mapped = {
      available: [],
      enRoute: [],
      onScene: [],
      evacuating: [],
    }

    assignments.forEach((assignment) => {
      const status = assignment.status || getStatus(assignment)
      mapped[status]?.push({ ...assignment, status })
    })

    return COLUMN_LABELS.map((col) => ({ ...col, cards: mapped[col.key] || [] }))
  }, [assignments])

  return (
    <div className="space-y-4 slide-up">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-white">
        <div>Staff dispatch board</div>
        <div className="text-text-secondary text-xs uppercase tracking-[0.3em]">Real-time assignments</div>
      </div>
      <div className="grid gap-3 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.key} className="rounded-3xl border border-white/10 bg-bg-primary/80 p-3">
            <div className={`mb-3 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] ${column.color}`}>{column.label}</div>
            <div className="space-y-3 min-h-[160px]">
              {column.cards.length === 0 ? (
                <div className="rounded-2xl border border-dim bg-white/5 p-3 text-[11px] text-text-secondary">No staff assigned here yet.</div>
              ) : column.cards.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-transform hover:-translate-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">{initials(item.name)}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                        <div className="text-[10px] uppercase tracking-[0.25em] text-text-secondary">{item.role}</div>
                      </div>
                    </div>
                    <div className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${column.color.replace('/10', '/20')}`}>{column.label}</div>
                  </div>
                  <div className="mt-3 text-[12px] text-text-secondary">{item.assignment}</div>
                  {item.location && <div className="mt-2 text-xs text-white/80">{item.location}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
