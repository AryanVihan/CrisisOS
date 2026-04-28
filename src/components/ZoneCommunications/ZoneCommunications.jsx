import React, { useMemo } from 'react'

const ZONE_LIST = [
  { id: 'Lobby', label: 'Lobby' },
  { id: 'Floor 1', label: 'Floor 1' },
  { id: 'Floor 2', label: 'Floor 2' },
  { id: 'Floor 3 East', label: 'Floor 3 East' },
  { id: 'Floor 3 West', label: 'Floor 3 West' },
  { id: 'Floor 4', label: 'Floor 4' },
  { id: 'Stairwell A', label: 'Stairwell A' },
  { id: 'Stairwell B', label: 'Stairwell B' },
]

const typeStyles = {
  calm: 'bg-accent-green/10 text-accent-green border-accent-green/20',
  urgent: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
  critical: 'bg-accent-red/10 text-accent-red border-accent-red/20',
}

const normalizeZone = (raw) => {
  const value = raw.toLowerCase()
  if (value.includes('lobby')) return 'Lobby'
  if (value.includes('floor 1')) return 'Floor 1'
  if (value.includes('floor 2')) return 'Floor 2'
  if (value.includes('floor 3')) return value.includes('west') ? 'Floor 3 West' : 'Floor 3 East'
  if (value.includes('floor 4')) return 'Floor 4'
  if (value.includes('stairwell a')) return 'Stairwell A'
  if (value.includes('stairwell b')) return 'Stairwell B'
  if (value.includes('pa')) return 'Lobby'
  return raw
}

const getTypeFromMessage = (message) => {
  if (!message) return 'calm'
  if (/evacuate|do not use elevators|emergency/i.test(message)) return 'critical'
  if (/precautionary|please proceed calmly|alert|alert/i.test(message)) return 'urgent'
  return 'calm'
}

const defaults = {
  Lobby: {
    message: 'Emergency services have been notified. Staff are guiding guests to safety.',
    type: 'calm',
  },
  'Floor 1': {
    message: 'Precautionary evacuation in progress. Please proceed calmly to nearest exit.',
    type: 'urgent',
  },
  'Floor 2': {
    message: 'Precautionary evacuation in progress. Please proceed calmly to nearest exit.',
    type: 'urgent',
  },
  'Floor 3 East': {
    message: 'EMERGENCY — Evacuate immediately via Stairwell A. Do NOT use elevators.',
    type: 'critical',
  },
  'Floor 3 West': {
    message: 'Precautionary evacuation in progress. Please proceed calmly to nearest exit.',
    type: 'urgent',
  },
  'Floor 4': {
    message: 'Precautionary evacuation in progress. Please proceed calmly to nearest exit.',
    type: 'urgent',
  },
  'Stairwell A': {
    message: 'Priority evacuation route open. Direct guests down safely.',
    type: 'urgent',
  },
  'Stairwell B': {
    message: 'Secondary evacuation route active. Assist guests toward lobby assembly point.',
    type: 'urgent',
  },
}

export default function ZoneCommunications({ communications = [] }) {
  const zoneMap = useMemo(() => {
    const map = {}
    communications.forEach((item) => {
      const key = normalizeZone(item.zone)
      map[key] = {
        zone: key,
        message: item.message,
        type: item.type || getTypeFromMessage(item.message),
      }
    })
    return map
  }, [communications])

  return (
    <div className="space-y-4 slide-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-text-secondary">Zone broadcast</div>
          <div className="text-lg font-semibold text-white">Speaker communications</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-text-secondary">Live audio feed</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ZONE_LIST.map((zone) => {
          const data = zoneMap[zone.id] ?? defaults[zone.id]
          const style = typeStyles[data.type] || typeStyles.calm
          return (
            <div key={zone.id} className="rounded-3xl border border-white/10 bg-bg-primary/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-text-secondary">{zone.label}</div>
                  <div className="text-sm font-semibold text-white">{data.type.toUpperCase()}</div>
                </div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                  <span className="block h-3.5 w-3.5 rounded-full bg-white/70" />
                  <span className="speaker-wave absolute -inset-1 rounded-full" />
                </div>
              </div>
              <div className={`mt-3 rounded-2xl border px-3 py-3 text-sm ${style}`}>{data.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
