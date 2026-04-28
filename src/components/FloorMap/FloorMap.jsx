import React, { useState, useMemo } from 'react'
import { FLOORS, GUESTS, STAFF, SENSORS, EMERGENCY_EXITS } from '../../data/hotelData.js'

const VW = 800
const VH = 480

/* ── Utilities ───────────────────────────────────────────────── */
function hash(str, seed = 0) {
  let h = (seed * 2654435761) >>> 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h ^ str.charCodeAt(i), 2246822519)) >>> 0
  }
  return (h % 10000) / 10000
}

/* ── Floor layout builder ────────────────────────────────────── */
function makeStandardFloor(n) {
  // n = 1–4; rooms: 5 west + 5 east per row (north + south)
  const westX = [82, 138, 194, 250, 306]
  const eastX = [444, 500, 556, 612, 668]
  const base  = n * 100
  const rooms = []

  westX.forEach((x, i) => {
    rooms.push({ id: `nw${i}`, num: `${base + i + 1}`,  x, y: 10,  w: 52, h: 192 })
    rooms.push({ id: `sw${i}`, num: `${base + i + 11}`, x, y: 296, w: 52, h: 172 })
  })
  eastX.forEach((x, i) => {
    rooms.push({ id: `ne${i}`, num: `${base + i + 6}`,  x, y: 10,  w: 52, h: 192 })
    rooms.push({ id: `se${i}`, num: `${base + i + 16}`, x, y: 296, w: 52, h: 172 })
  })

  return {
    type: 'standard',
    rooms,
    stairwells: [
      { id: 'sa', label: 'STAIR A', x: 10,  y: 10, w: 68, h: 458 },
      { id: 'sb', label: 'STAIR B', x: 722, y: 10, w: 68, h: 458 },
    ],
    elevator:  { x: 360, y: 10, w: 80, h: 192 },
    corridor:  { x: 10,  y: 207, w: 780, h: 84 },
    exitArrows: [
      { x: 44,  y: 249, dir: 'left',  label: 'EXIT A' },
      { x: 756, y: 249, dir: 'right', label: 'EXIT B' },
    ],
  }
}

const FLOOR_LAYOUTS = {
  'Lobby': {
    type: 'lobby',
    zones: [
      { id: 'main-entrance', label: 'MAIN ENTRANCE', x: 265, y: 355, w: 270, h: 115, accent: '#0ea5e9' },
      { id: 'reception',     label: 'RECEPTION',      x: 78,  y: 135, w: 205, h: 115, accent: '#3b82f6' },
      { id: 'lobby-lounge',  label: 'LOBBY LOUNGE',   x: 295, y: 140, w: 210, h: 120, accent: '#8b5cf6' },
      { id: 'bar-lounge',    label: 'BAR LOUNGE',     x: 520, y: 135, w: 195, h: 130, accent: '#f59e0b' },
      { id: 'concierge',     label: 'CONCIERGE',      x: 10,  y: 285, w: 135, h: 105, accent: '#3b82f6' },
      { id: 'service',       label: 'SERVICE',        x: 10,  y: 10,  w: 62,  h: 268, accent: '#475569' },
      { id: 'restrooms',     label: 'WC',             x: 645, y: 10,  w: 145, h: 105, accent: '#475569' },
      { id: 'ballroom',      label: 'GRAND BALLROOM', x: 78,  y: 10,  w: 555, h: 115, accent: '#a855f7' },
    ],
    corridor: { x: 10, y: 268, w: 780, h: 78 },
    exitArrows: [
      { x: 400, y: 470, dir: 'down', label: 'EXIT A' },
      { x: 42,  y: 330, dir: 'left', label: 'EXIT B' },
    ],
  },
  'Floor 1': makeStandardFloor(1),
  'Floor 2': makeStandardFloor(2),
  'Floor 3': makeStandardFloor(3),
  'Floor 4': makeStandardFloor(4),
  'Roof': {
    type: 'roof',
    zones: [
      { id: 'hvac-a',      label: 'HVAC UNIT A',  x: 40,  y: 40,  w: 175, h: 145, accent: '#64748b', isCircle: false },
      { id: 'hvac-b',      label: 'HVAC UNIT B',  x: 585, y: 40,  w: 175, h: 145, accent: '#64748b', isCircle: false },
      { id: 'helipad',     label: 'HELIPAD',       x: 290, y: 120, w: 220, h: 220, accent: '#f59e0b', isCircle: true  },
      { id: 'roof-access', label: 'ROOF ACCESS',   x: 330, y: 10,  w: 140, h: 72,  accent: '#22c55e', isCircle: false },
      { id: 'solar',       label: 'SOLAR ARRAY',   x: 40,  y: 225, w: 185, h: 185, accent: '#eab308', isCircle: false },
      { id: 'water-tank',  label: 'WATER TANK',    x: 575, y: 225, w: 185, h: 165, accent: '#06b6d4', isCircle: false },
    ],
    exitArrows: [
      { x: 400, y: 14, dir: 'up', label: 'HATCH' },
    ],
  },
}

/* ── Color maps ──────────────────────────────────────────────── */
const GUEST_COLOR = {
  safe:        '#e2e8f0',
  moving:      '#f59e0b',
  unaccounted: '#ef4444',
  evacuated:   '#22c55e',
}

const SENSOR_COLOR = {
  active:   '#22c55e',
  alert:    '#ef4444',
  elevated: '#f59e0b',
  offline:  '#475569',
}

const STAFF_ROLE_COLOR = {
  Security:    '#ef4444',
  Medical:     '#22c55e',
  Manager:     '#f59e0b',
  Concierge:   '#3b82f6',
  Housekeeping:'#94a3b8',
}

const STAFF_STATUS_COLOR = {
  available:  '#3b82f6',
  dispatched: '#f59e0b',
  'en-route': '#f59e0b',
  'on-scene': '#ef4444',
}

/* ── Position helpers ────────────────────────────────────────── */
function getGuestPos(guest, layout) {
  const h1 = hash(guest.id, 1)
  const h2 = hash(guest.id, 2)
  if (layout.type === 'standard') {
    const side = h1 < 0.5 ? 'west' : 'east'
    const row  = h2 < 0.5 ? 'north' : 'south'
    const m    = 10
    if (side === 'west'  && row === 'north') return { x: 82  + m + h1 * (276 - 2*m), y: 10  + m + h2 * (192 - 2*m) }
    if (side === 'west'  && row === 'south') return { x: 82  + m + h1 * (276 - 2*m), y: 296 + m + h2 * (172 - 2*m) }
    if (side === 'east'  && row === 'north') return { x: 444 + m + h1 * (276 - 2*m), y: 10  + m + h2 * (192 - 2*m) }
    return                                         { x: 444 + m + h1 * (276 - 2*m), y: 296 + m + h2 * (172 - 2*m) }
  }
  if (layout.type === 'lobby') return { x: 80  + h1 * 640, y: 140 + h2 * 275 }
  return                              { x: 60  + h1 * 680, y: 60  + h2 * 360 }
}

function getStaffPos(member, layout) {
  const h1 = hash(member.id, 5)
  const h2 = hash(member.id, 6)
  if (layout.type === 'standard') {
    if (h1 < 0.3) return { x: 90 + h1 * 600, y: 215 + h2 * 60 }
    return h1 < 0.65
      ? { x: 100 + h1 * 220, y: 30  + h2 * 160 }
      : { x: 460 + h1 * 220, y: 30  + h2 * 160 }
  }
  if (layout.type === 'lobby') return { x: 100 + h1 * 600, y: 150 + h2 * 250 }
  return { x: 80 + h1 * 640, y: 60 + h2 * 360 }
}

/* ── SVG sub-components ──────────────────────────────────────── */

function StandardFloor({ layout, crisisZones }) {
  const { rooms, stairwells, elevator, corridor } = layout
  return (
    <g>
      {/* Floor boundary */}
      <rect x="10" y="10" width="780" height="458" fill="#0b1220" stroke="#1e3a5f" strokeWidth="1.5" rx="2" />

      {/* Stairwells */}
      {stairwells.map(s => (
        <g key={s.id}>
          <rect x={s.x} y={s.y} width={s.w} height={s.h}
            fill="#080e1a" stroke="#1e40af" strokeWidth="1" rx="1" />
          <text x={s.x + s.w/2} y={s.y + s.h/2 - 8}
            textAnchor="middle" fill="#2563eb" fontSize="7.5"
            fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="0.5">
            {s.label.split(' ')[0]}
          </text>
          <text x={s.x + s.w/2} y={s.y + s.h/2 + 7}
            textAnchor="middle" fill="#2563eb" fontSize="7.5"
            fontFamily="Inter,sans-serif" fontWeight="700">
            {s.label.split(' ')[1]}
          </text>
          {/* Stair step lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={i}
              x1={s.x + 6} y1={s.y + 100 + i * 16}
              x2={s.x + s.w - 6} y2={s.y + 100 + i * 16}
              stroke="#1e40af" strokeWidth="0.5" strokeDasharray="3,2" />
          ))}
        </g>
      ))}

      {/* Elevator bank */}
      <rect x={elevator.x} y={elevator.y} width={elevator.w} height={elevator.h}
        fill="#060f1e" stroke="#0ea5e9" strokeWidth="1" rx="1" />
      <text x={elevator.x + elevator.w/2} y={elevator.y + elevator.h/2 - 7}
        textAnchor="middle" fill="#0ea5e9" fontSize="8"
        fontFamily="Inter,sans-serif" fontWeight="600" letterSpacing="1">ELEV</text>
      <text x={elevator.x + elevator.w/2} y={elevator.y + elevator.h/2 + 8}
        textAnchor="middle" fill="#0ea5e9" fontSize="8"
        fontFamily="Inter,sans-serif" fontWeight="600" letterSpacing="1">BANK</text>
      {/* Elevator door lines */}
      <line x1={elevator.x + elevator.w/2} y1={elevator.y + elevator.h/2 + 18}
            x2={elevator.x + elevator.w/2} y2={elevator.y + elevator.h - 6}
            stroke="#0ea5e9" strokeWidth="0.75" strokeDasharray="2,2" opacity="0.5" />

      {/* Corridor */}
      <rect x={corridor.x} y={corridor.y} width={corridor.w} height={corridor.h}
        fill="#0c1d34" stroke="#1e3a5f" strokeWidth="1" />
      <text x={VW / 2} y={corridor.y + corridor.h / 2 + 4}
        textAnchor="middle" fill="#1e3a5f" fontSize="10"
        fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="5">
        MAIN CORRIDOR
      </text>

      {/* Rooms */}
      {rooms.map(room => (
        <g key={room.id}>
          <rect x={room.x} y={room.y} width={room.w} height={room.h}
            fill="#090e1c" stroke="#1e3a5f66" strokeWidth="0.75" />
          <text
            x={room.x + room.w / 2}
            y={room.y + room.h / 2 + 4}
            textAnchor="middle"
            fill="#1e3a5f"
            fontSize="7.5"
            fontFamily="Inter,sans-serif"
            fontWeight="500"
            transform={`rotate(-90,${room.x + room.w / 2},${room.y + room.h / 2})`}
          >
            {room.num}
          </text>
        </g>
      ))}

      {/* Wing labels */}
      {[
        { x: 220, label: 'WEST WING' },
        { x: 582, label: 'EAST WING' },
      ].map(({ x, label }) => (
        <g key={label}>
          <text x={x} y={corridor.y - 8} textAnchor="middle"
            fill="#1e40af66" fontSize="8.5" fontFamily="Inter,sans-serif"
            fontWeight="700" letterSpacing="3">{label}</text>
          <text x={x} y={corridor.y + corridor.h + 18} textAnchor="middle"
            fill="#1e40af66" fontSize="8.5" fontFamily="Inter,sans-serif"
            fontWeight="700" letterSpacing="3">{label}</text>
        </g>
      ))}

      {/* Crisis zone overlays */}
      {crisisZones?.includes('East Wing') && (
        <g>
          <rect x={444} y={10} width={276} height={192}
            fill="#ef444412" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,3" rx="1">
            <animate attributeName="strokeOpacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <text x={582} y={107} textAnchor="middle" fill="#ef4444"
            fontSize="13" fontFamily="Inter,sans-serif" fontWeight="800">⚠ HAZARD</text>
        </g>
      )}
      {crisisZones?.includes('West Wing') && (
        <g>
          <rect x={82} y={10} width={276} height={192}
            fill="#ef444412" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,3" rx="1">
            <animate attributeName="strokeOpacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <text x={220} y={107} textAnchor="middle" fill="#ef4444"
            fontSize="13" fontFamily="Inter,sans-serif" fontWeight="800">⚠ HAZARD</text>
        </g>
      )}
    </g>
  )
}

function LobbyFloor({ layout, crisisZones }) {
  const { zones, corridor } = layout
  return (
    <g>
      <rect x="10" y="10" width="780" height="458" fill="#0b1220" stroke="#1e3a5f" strokeWidth="1.5" rx="2" />

      {/* Corridor / hallway */}
      <rect x={corridor.x} y={corridor.y} width={corridor.w} height={corridor.h}
        fill="#0c1d34" stroke="#1e3a5f" strokeWidth="1" />
      <text x={VW / 2} y={corridor.y + corridor.h / 2 + 4}
        textAnchor="middle" fill="#1e3a5f" fontSize="10"
        fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="5">
        LOBBY CONCOURSE
      </text>

      {/* Zone blocks */}
      {zones.map(zone => (
        <g key={zone.id}>
          <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h}
            fill={zone.accent + '12'} stroke={zone.accent + '55'} strokeWidth="1" rx="2" />
          <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 + 4}
            textAnchor="middle" fill={zone.accent + 'bb'} fontSize="8"
            fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1.5">
            {zone.label}
          </text>
        </g>
      ))}

      {/* Crisis overlays */}
      {crisisZones?.map(z => {
        const zone = zones.find(zo => zo.label === z || zo.id === z)
        if (!zone) return null
        return (
          <g key={`crisis-${z}`}>
            <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h}
              fill="#ef444414" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6,3" rx="2">
              <animate attributeName="strokeOpacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
            </rect>
            <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 + 4}
              textAnchor="middle" fill="#ef4444" fontSize="12"
              fontFamily="Inter,sans-serif" fontWeight="800">⚠</text>
          </g>
        )
      })}
    </g>
  )
}

function RoofFloor({ layout }) {
  const { zones } = layout
  return (
    <g>
      <rect x="10" y="10" width="780" height="458" fill="#0b1220" stroke="#1e3a5f" strokeWidth="1.5" rx="2" />
      {/* Roof surface texture lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={10} y1={70 + i * 52} x2={790} y2={70 + i * 52}
          stroke="#1e3a5f22" strokeWidth="0.5" strokeDasharray="8,6" />
      ))}

      {zones.map(zone => (
        <g key={zone.id}>
          {zone.isCircle ? (
            <>
              <circle cx={zone.x + zone.w / 2} cy={zone.y + zone.h / 2} r={zone.w / 2}
                fill={zone.accent + '10'} stroke={zone.accent + '55'}
                strokeWidth="1.5" strokeDasharray="8,4" />
              {/* Helipad H */}
              <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 + 5}
                textAnchor="middle" fill={zone.accent + 'aa'} fontSize="48"
                fontFamily="Inter,sans-serif" fontWeight="800">H</text>
              <circle cx={zone.x + zone.w / 2} cy={zone.y + zone.h / 2} r={zone.w / 2 - 10}
                fill="none" stroke={zone.accent + '33'} strokeWidth="1" />
            </>
          ) : (
            <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h}
              fill={zone.accent + '10'} stroke={zone.accent + '55'} strokeWidth="1" rx="2" />
          )}
          {!zone.isCircle && (
            <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 + 4}
              textAnchor="middle" fill={zone.accent + 'bb'} fontSize="9"
              fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="1.5">
              {zone.label}
            </text>
          )}
          {zone.isCircle && (
            <text x={zone.x + zone.w / 2} y={zone.y + zone.h / 2 + zone.h / 2 - 12}
              textAnchor="middle" fill={zone.accent + 'bb'} fontSize="8"
              fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="2">
              {zone.label}
            </text>
          )}
        </g>
      ))}
    </g>
  )
}

function GuestDot({ guest }) {
  const color = GUEST_COLOR[guest.status] || GUEST_COLOR.safe
  return (
    <circle
      cx={guest.x} cy={guest.y} r="3.5"
      fill={color} fillOpacity="0.82"
      stroke={guest.status === 'unaccounted' ? '#ef4444' : 'none'}
      strokeWidth="0.5"
      style={{ transition: 'cx 0.8s ease, cy 0.8s ease' }}
    />
  )
}

function SensorDiamond({ sensor, isHovered, onHover }) {
  const sx = (sensor.x / 100) * VW
  const sy = (sensor.y / 100) * VH
  const color = SENSOR_COLOR[sensor.status] || '#475569'
  const s = isHovered ? 10 : 7

  const pts = `0,${-s} ${s},0 0,${s} ${-s},0`
  const outerPts = `0,${-(s+5)} ${s+5},0 0,${s+5} ${-(s+5)},0`

  return (
    <g
      transform={`translate(${sx},${sy})`}
      onMouseEnter={() => onHover(sensor)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      {/* Pulse ring for alerts */}
      {sensor.status === 'alert' && (
        <polygon points={outerPts} fill="none" stroke={color} strokeWidth="1" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0;0.4" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="points"
            values={`0,${-(s+5)} ${s+5},0 0,${s+5} ${-(s+5)},0;0,${-(s+9)} ${s+9},0 0,${s+9} ${-(s+9)},0;0,${-(s+5)} ${s+5},0 0,${s+5} ${-(s+5)},0`}
            dur="1.2s" repeatCount="indefinite" />
        </polygon>
      )}
      <polygon
        points={pts}
        fill={color + '30'}
        stroke={color}
        strokeWidth="1.5"
        style={{ transition: 'all 0.15s ease' }}
        filter={sensor.status === 'alert' ? 'url(#glow-red)' : undefined}
      />
    </g>
  )
}

function StaffDot({ member, layout, isHovered, onHover }) {
  const pos  = getStaffPos(member, layout)
  const color = STAFF_STATUS_COLOR[member.status] || '#3b82f6'
  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2)
  const r = isHovered ? 13 : 9

  return (
    <g
      transform={`translate(${pos.x},${pos.y})`}
      onMouseEnter={() => onHover({ ...member, pos })}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      <circle r={r} fill={color + '25'} stroke={color} strokeWidth="1.5"
        style={{ transition: 'all 0.15s ease' }} />
      <text textAnchor="middle" y="4" fill={color}
        fontSize="7" fontFamily="Inter,sans-serif" fontWeight="800">
        {initials}
      </text>
    </g>
  )
}

function ExitArrow({ exit, isEvacuating }) {
  const { x, y, dir, label } = exit
  const color = '#22c55e'

  const arrow = {
    left:  { path: `M ${x+18},${y-8} L ${x+4},${y} L ${x+18},${y+8}`, tx: x+28, ty: y+4,  anchor: 'start'  },
    right: { path: `M ${x-18},${y-8} L ${x-4},${y} L ${x-18},${y+8}`, tx: x-28, ty: y+4,  anchor: 'end'    },
    down:  { path: `M ${x-8},${y-18} L ${x},${y-4}   L ${x+8},${y-18}`, tx: x,   ty: y-26, anchor: 'middle' },
    up:    { path: `M ${x-8},${y+18} L ${x},${y+4}   L ${x+8},${y+18}`, tx: x,   ty: y+30, anchor: 'middle' },
  }[dir] || { path: '', tx: x, ty: y, anchor: 'middle' }

  return (
    <g>
      <path d={arrow.path} fill="none" stroke={color}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {isEvacuating && (
          <animate attributeName="opacity" values="1;0.15;1" dur="0.7s" repeatCount="indefinite" />
        )}
      </path>
      <text x={arrow.tx} y={arrow.ty} textAnchor={arrow.anchor}
        fill={color} fontSize="7.5" fontFamily="Inter,sans-serif"
        fontWeight="800" letterSpacing="1">
        {label}
      </text>
    </g>
  )
}

function EvacuationOverlay({ layout }) {
  const { corridor } = layout
  if (!corridor) return null
  const cy = corridor.y + corridor.h / 2
  const arrowXs = [180, 310, 450, 580, 690]

  return (
    <g>
      {/* Primary route → right */}
      <line x1={corridor.x + 30} y1={cy - 10} x2={corridor.x + corridor.w - 30} y2={cy - 10}
        stroke="#22c55e" strokeWidth="2" strokeDasharray="14,7" opacity="0.75">
        <animate attributeName="strokeDashoffset" from="21" to="0" dur="0.9s" repeatCount="indefinite" />
      </line>
      {arrowXs.map(ax => (
        <polygon key={ax}
          points={`${ax},${cy - 16} ${ax + 14},${cy - 10} ${ax},${cy - 4}`}
          fill="#22c55e" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.1s" repeatCount="indefinite" />
        </polygon>
      ))}

      {/* Secondary route ← left (amber) */}
      <line x1={corridor.x + corridor.w - 30} y1={cy + 10} x2={corridor.x + 30} y2={cy + 10}
        stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="9,6" opacity="0.6">
        <animate attributeName="strokeDashoffset" from="0" to="15" dur="0.9s" repeatCount="indefinite" />
      </line>
      {arrowXs.map(ax => (
        <polygon key={ax}
          points={`${ax + 14},${cy + 4} ${ax},${cy + 10} ${ax + 14},${cy + 16}`}
          fill="#f59e0b" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.1s" repeatCount="indefinite" />
        </polygon>
      ))}
    </g>
  )
}

function SensorTooltip({ sensor }) {
  const sx = (sensor.x / 100) * VW
  const sy = (sensor.y / 100) * VH
  const tx = Math.min(sx + 14, VW - 158)
  const ty = Math.max(sy - 68, 8)
  const color = SENSOR_COLOR[sensor.status] || '#475569'

  const readings = {
    smoke:       { value: sensor.status === 'alert' ? '0.78 obs/m' : '0.02 obs/m', unit: 'density' },
    temperature: { value: sensor.status === 'alert' ? '312 °C' : '22 °C',          unit: 'temp'    },
    motion:      { value: sensor.status === 'alert' ? '14 persons' : '0 persons',  unit: 'count'   },
    co2:         { value: sensor.status === 'alert' ? '4200 ppm' : '420 ppm',      unit: 'co2'     },
  }[sensor.type] || { value: '—', unit: '—' }

  return (
    <g>
      <rect x={tx} y={ty} width="155" height="66" rx="4"
        fill="#070c16" stroke={color + '60'} strokeWidth="1" opacity="0.97" />
      <text x={tx + 9} y={ty + 16} fill="#f1f5f9" fontSize="10"
        fontFamily="Inter,sans-serif" fontWeight="700">{sensor.id}</text>
      <text x={tx + 9} y={ty + 30} fill="#94a3b8" fontSize="8.5"
        fontFamily="Inter,sans-serif">{sensor.type.toUpperCase()} · {sensor.zone}</text>
      <text x={tx + 9} y={ty + 44} fill="#94a3b8" fontSize="8.5" fontFamily="Inter,sans-serif">
        {'Reading: '}
        <tspan fill={color}>{readings.value}</tspan>
      </text>
      <text x={tx + 9} y={ty + 57} fill="#334155" fontSize="8" fontFamily="Inter,sans-serif">
        Status: <tspan fill={color}>{sensor.status.toUpperCase()}</tspan> · Updated: now
      </text>
    </g>
  )
}

function StaffTooltip({ member }) {
  if (!member?.pos) return null
  const { pos } = member
  const tx = Math.min(pos.x + 14, VW - 145)
  const ty = Math.max(pos.y - 60, 8)
  const roleColor = STAFF_ROLE_COLOR[member.role] || '#94a3b8'
  const statusColor = STAFF_STATUS_COLOR[member.status] || '#3b82f6'

  return (
    <g>
      <rect x={tx} y={ty} width="140" height="56" rx="4"
        fill="#070c16" stroke="#1e3a5f" strokeWidth="1" opacity="0.97" />
      <text x={tx + 9} y={ty + 16} fill="#f1f5f9" fontSize="10"
        fontFamily="Inter,sans-serif" fontWeight="700">{member.name}</text>
      <text x={tx + 9} y={ty + 30} fill={roleColor} fontSize="8.5"
        fontFamily="Inter,sans-serif" fontWeight="600">{member.role}</text>
      <text x={tx + 9} y={ty + 44} fill="#94a3b8" fontSize="8.5" fontFamily="Inter,sans-serif">
        {'Status: '}
        <tspan fill={statusColor}>{member.status.toUpperCase()}</tspan>
      </text>
    </g>
  )
}

function MapLegend() {
  const guestItems = [
    { color: GUEST_COLOR.safe,        label: 'Safe'        },
    { color: GUEST_COLOR.moving,      label: 'Moving'      },
    { color: GUEST_COLOR.unaccounted, label: 'Unaccounted' },
    { color: GUEST_COLOR.evacuated,   label: 'Evacuated'   },
  ]
  const sensorItems = [
    { color: SENSOR_COLOR.active,  label: 'Normal'   },
    { color: SENSOR_COLOR.alert,   label: 'Critical' },
    { color: SENSOR_COLOR.offline, label: 'Offline'  },
  ]

  return (
    <g transform={`translate(${VW - 12}, ${VH - 12})`}>
      <rect x="-145" y={-(guestItems.length + sensorItems.length + 2) * 14 - 12}
        width="140" height={(guestItems.length + sensorItems.length + 2) * 14 + 18}
        rx="3" fill="#040810" stroke="#1e3a5f55" strokeWidth="1" opacity="0.9" />

      <text x="-137" y={-(guestItems.length + sensorItems.length + 1) * 14 - 4}
        fill="#334155" fontSize="7.5" fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="2">
        LEGEND
      </text>

      {/* Guest dot legend */}
      {guestItems.map((item, i) => (
        <g key={item.label} transform={`translate(0, ${-(guestItems.length - i) * 14 - sensorItems.length * 14 - 16})`}>
          <circle cx="-133" cy="0" r="3.5" fill={item.color} fillOpacity="0.85" />
          <text x="-124" y="4" fill="#64748b" fontSize="8.5" fontFamily="Inter,sans-serif">{item.label}</text>
        </g>
      ))}

      {/* Sensor diamond legend */}
      {sensorItems.map((item, i) => (
        <g key={item.label} transform={`translate(0, ${-(sensorItems.length - i) * 14 - 2})`}>
          <polygon points={`-133,-5 -128,0 -133,5 -138,0`}
            fill={item.color + '30'} stroke={item.color} strokeWidth="1.2" />
          <text x="-124" y="4" fill="#64748b" fontSize="8.5" fontFamily="Inter,sans-serif">{item.label}</text>
        </g>
      ))}
    </g>
  )
}

/* ── Floor Status Bar ────────────────────────────────────────── */
function FloorStatusBar({ stats, currentFloor, onFloorSelect }) {
  return (
    <div className="shrink-0 border-t border-white/5 bg-bg-secondary/70 px-3 py-2 flex gap-1.5">
      {stats.map(({ floor, guestCount, staffCount, alertCount }) => {
        const isActive = floor === currentFloor
        const hasAlert = alertCount > 0
        return (
          <button
            key={floor}
            onClick={() => onFloorSelect(floor)}
            className={`flex-1 rounded px-2 py-1.5 text-left transition-all border ${
              isActive
                ? 'border-accent-blue/50 bg-accent-blue/10'
                : hasAlert
                ? 'border-accent-red/30 bg-accent-red/5 hover:bg-accent-red/10'
                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-xs font-bold truncate ${isActive ? 'text-accent-blue' : hasAlert ? 'text-accent-red' : 'text-text-secondary'}`}>
                {floor === 'Lobby' ? 'LBY' : floor === 'Roof' ? 'ROOF' : floor.replace('Floor ', 'F')}
              </span>
              {hasAlert && <span className="text-accent-red text-xs font-bold leading-none">⚠</span>}
            </div>
            <div className="flex gap-1.5 text-xs font-mono">
              <span className="text-accent-blue">{guestCount}G</span>
              <span className="text-accent-amber">{staffCount}S</span>
              <span className={hasAlert ? 'text-accent-red font-bold' : 'text-accent-green'}>
                {hasAlert ? `${alertCount}!` : 'OK'}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────── */
export default function FloorMap({
  activeFloor,
  onFloorChange,
  sensors,
  guests,
  staff,
  crisisZones   = [],
  evacuationRoutes,
  isEvacuating  = false,
}) {
  const [selectedFloor, setSelectedFloor] = useState('Lobby')
  const [hoveredSensor, setHoveredSensor] = useState(null)
  const [hoveredStaff,  setHoveredStaff]  = useState(null)

  const changeFloor = (floor) => {
    setSelectedFloor(floor)
    onFloorChange?.(floor)
  }

  // External activeFloor prop overrides local selection
  const currentFloor = activeFloor || selectedFloor
  const layout = FLOOR_LAYOUTS[currentFloor] || FLOOR_LAYOUTS['Floor 1']

  const floorSensors = sensors.filter(s => s.floor === currentFloor)
  const floorGuests  = guests.filter(g  => g.floor  === currentFloor)
  const floorStaff   = staff.filter(m  => m.floor  === currentFloor)

  // Guest positions — transition smoothly toward exits during evacuation
  const guestPositions = useMemo(() => {
    return floorGuests.map(guest => {
      if (isEvacuating) {
        const h  = hash(guest.id, 7)
        const h2 = hash(guest.id, 8)
        const cy = layout.corridor
          ? layout.corridor.y + 10 + h2 * (layout.corridor.h - 20)
          : 240
        return {
          ...guest,
          x: 90 + h * 600,
          y: cy,
          status: h > 0.72 ? 'evacuated' : h > 0.42 ? 'moving' : 'unaccounted',
        }
      }
      return { ...guest, ...getGuestPos(guest, layout), status: 'safe' }
    })
  }, [floorGuests, isEvacuating, layout])

  // Per-floor summary for the status bar
  const floorStats = FLOORS.map(floor => ({
    floor,
    guestCount: guests.filter(g => g.floor === floor).length,
    staffCount:  staff.filter(m => m.floor === floor).length,
    alertCount:  sensors.filter(s => s.floor === floor && s.status === 'alert').length,
  }))

  return (
    <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
      {/* ── Floor selector tabs ── */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5 bg-bg-secondary/50 shrink-0">
        <span className="text-text-secondary text-xs font-semibold uppercase tracking-widest mr-2">FLOOR</span>
        {FLOORS.map(floor => (
          <button
            key={floor}
            onClick={() => changeFloor(floor)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              currentFloor === floor
                ? 'bg-accent-blue text-white shadow shadow-accent-blue/30'
                : 'bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10'
            }`}
          >
            {floor === 'Lobby' ? 'LOBBY' : floor === 'Roof' ? 'ROOF' : `F${floor.slice(-1)}`}
          </button>
        ))}

        {/* Live counters */}
        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="text-accent-blue font-mono">{floorGuests.length} guests</span>
          <span className="text-accent-amber font-mono">{floorStaff.length} staff</span>
          <span className="text-text-secondary font-mono">{floorSensors.length} sensors</span>
          {isEvacuating && (
            <span className="text-accent-red font-bold uppercase tracking-wider animate-pulse">
              ⚠ EVACUATION ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* ── SVG map ── */}
      <div className="flex-1 overflow-hidden p-3">
        <div className="w-full h-full rounded-xl overflow-hidden border border-white/[0.07]"
          style={{ background: '#05080f' }}>
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <pattern id="fp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30,58,92,0.35)" strokeWidth="0.5" />
              </pattern>
              <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Background + grid */}
            <rect width={VW} height={VH} fill="#060a14" />
            <rect width={VW} height={VH} fill="url(#fp-grid)" />

            {/* Floor layouts */}
            {layout.type === 'standard' && (
              <StandardFloor layout={layout} crisisZones={crisisZones} />
            )}
            {layout.type === 'lobby' && (
              <LobbyFloor layout={layout} crisisZones={crisisZones} />
            )}
            {layout.type === 'roof' && (
              <RoofFloor layout={layout} />
            )}

            {/* Evacuation route overlay */}
            {isEvacuating && layout.corridor && (
              <EvacuationOverlay layout={layout} />
            )}

            {/* Guest dots (cap at 70 for perf) */}
            {guestPositions.slice(0, 70).map(g => (
              <GuestDot key={g.id} guest={g} />
            ))}

            {/* Sensor diamonds */}
            {floorSensors.map(s => (
              <SensorDiamond
                key={s.id}
                sensor={s}
                isHovered={hoveredSensor?.id === s.id}
                onHover={setHoveredSensor}
              />
            ))}

            {/* Staff dots */}
            {floorStaff.map(m => (
              <StaffDot
                key={m.id}
                member={m}
                layout={layout}
                isHovered={hoveredStaff?.id === m.id}
                onHover={setHoveredStaff}
              />
            ))}

            {/* Exit arrows */}
            {(layout.exitArrows || []).map(e => (
              <ExitArrow key={e.label} exit={e} isEvacuating={isEvacuating} />
            ))}

            {/* Floor name watermark */}
            <text x="18" y="28" fill="#1e3a5f" fontSize="11"
              fontFamily="Inter,sans-serif" fontWeight="700" letterSpacing="2">
              {currentFloor.toUpperCase()}
            </text>

            {/* Legend */}
            <MapLegend />

            {/* Hover tooltips — rendered last so they're on top */}
            {hoveredSensor && <SensorTooltip sensor={hoveredSensor} />}
            {hoveredStaff  && <StaffTooltip  member={hoveredStaff}  />}
          </svg>
        </div>
      </div>

      {/* ── Per-floor status bar ── */}
      <FloorStatusBar
        stats={floorStats}
        currentFloor={currentFloor}
        onFloorSelect={changeFloor}
      />
    </main>
  )
}
