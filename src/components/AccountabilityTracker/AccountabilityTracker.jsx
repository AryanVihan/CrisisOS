import React, { useMemo } from 'react'

const DEFAULT_UNACCOUNTED = [
  { room: '312', name: 'John M.', lastSeen: 'Floor 3 East Wing', eta: 'T-01:45' },
  { room: '314', name: 'Sarah K.', lastSeen: 'Floor 3 East Wing', eta: 'T-01:16' },
  { room: '318', name: '2 guests', lastSeen: 'Floor 3 East Wing', eta: 'T-01:10' },
  { room: '315', name: 'Elderly guest', lastSeen: 'Floor 3 East Wing', eta: 'T-00:55' },
]

export default function AccountabilityTracker({ accountedGuests, totalGuests = 251, evacuationActive }) {
  const allAccounted = accountedGuests >= totalGuests
  const progress = useMemo(() => Math.min(100, Math.max(0, Math.round((accountedGuests / totalGuests) * 100))), [accountedGuests, totalGuests])

  return (
    <div className="rounded-3xl border border-white/10 bg-bg-primary/80 p-4 slide-up">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Guest accountability</div>
          <div className="text-sm font-semibold text-white">251 GUESTS REGISTERED</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-4xl font-bold text-accent-green">{accountedGuests}</div>
            <div className="text-xs uppercase tracking-[0.3em] text-text-secondary">ACCOUNTED</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-accent-red">{Math.max(0, totalGuests - accountedGuests)}</div>
            <div className="text-xs uppercase tracking-[0.3em] text-text-secondary">UNACCOUNTED</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-text-secondary">
          <span>Accountability progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-accent-green transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-bg-secondary/90 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-text-secondary mb-3">Unaccounted guest locations</div>
          <div className="space-y-3">
            {allAccounted ? (
              <div className="rounded-2xl border border-accent-green/20 bg-accent-green/5 p-4 text-sm text-accent-green">
                ALL GUESTS ACCOUNTED
              </div>
            ) : DEFAULT_UNACCOUNTED.map((item) => (
              <div key={item.room} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold text-white">Room {item.room} ({item.name})</div>
                <div className="mt-1 text-xs text-text-secondary">Last seen: {item.lastSeen}</div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.25em] text-accent-amber">{item.eta}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-bg-secondary/90 p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-text-secondary">Search team status</div>
            <div className="mt-4 text-2xl font-semibold text-white">{evacuationActive ? 'SEARCH TEAMS DEPLOYED' : 'PENDING DEPLOYMENT'}</div>
            <div className="mt-3 text-sm text-text-secondary">
              {allAccounted
                ? 'All guests have been confirmed. Accountability operation complete.'
                : 'Search teams are actively sweeping Floor 3 East Wing and surrounding corridors until all guests are located.'}
            </div>
          </div>
          <div className={`mt-4 inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] ${allAccounted ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-amber/15 text-accent-amber'}`}>
            {allAccounted ? 'ALL ACCOUNTED' : 'SEARCH DEPLOYED'}
          </div>
        </div>
      </div>
    </div>
  )
}
