/* ── Floors ─────────────────────────────────────────────── */
export const FLOORS = ['Lobby', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Roof']

/* ── Staff ──────────────────────────────────────────────── */
export const STAFF = [
  { id: 'S01', name: 'Marcus Reid',     role: 'Security',    floor: 'Lobby',   status: 'available' },
  { id: 'S02', name: 'Dana Cho',        role: 'Security',    floor: 'Floor 1', status: 'available' },
  { id: 'S03', name: 'Troy Vasquez',    role: 'Security',    floor: 'Floor 3', status: 'available' },
  { id: 'S04', name: 'Priya Mehta',     role: 'Medical',     floor: 'Lobby',   status: 'available' },
  { id: 'S05', name: 'Lena Fischer',    role: 'Medical',     floor: 'Floor 2', status: 'available' },
  { id: 'S06', name: 'James Okafor',    role: 'Manager',     floor: 'Lobby',   status: 'available' },
  { id: 'S07', name: 'Sofia Reyes',     role: 'Manager',     floor: 'Floor 4', status: 'available' },
  { id: 'S08', name: 'Ben Hartley',     role: 'Concierge',   floor: 'Lobby',   status: 'available' },
  { id: 'S09', name: 'Aiko Tanaka',     role: 'Concierge',   floor: 'Lobby',   status: 'dispatched' },
  { id: 'S10', name: 'Yusuf Al-Amin',  role: 'Housekeeping', floor: 'Floor 2', status: 'available' },
  { id: 'S11', name: 'Clara Novak',     role: 'Housekeeping', floor: 'Floor 3', status: 'available' },
  { id: 'S12', name: 'Dev Patel',       role: 'Security',    floor: 'Roof',    status: 'available' },
]

/* ── Guests ─────────────────────────────────────────────── */
// 251 guests distributed: Lobby 12, Floor1 35, Floor2 58, Floor3 62, Floor4 68, Roof 16
const buildGuests = () => {
  const guests = []
  let id = 1

  const distribution = [
    { floor: 'Lobby',   prefix: 'L',  count: 12, roomStart: 100 },
    { floor: 'Floor 1', prefix: '1',  count: 35, roomStart: 101 },
    { floor: 'Floor 2', prefix: '2',  count: 58, roomStart: 201 },
    { floor: 'Floor 3', prefix: '3',  count: 62, roomStart: 301 },
    { floor: 'Floor 4', prefix: '4',  count: 68, roomStart: 401 },
    { floor: 'Roof',    prefix: 'R',  count: 16, roomStart: 501 },
  ]

  const firstNames = ['Alex','Jordan','Morgan','Taylor','Casey','Riley','Quinn','Drew','Sage','Blake','River','Avery','Logan','Dakota','Skylar']
  const lastNames  = ['Kim','Chen','Patel','Garcia','Smith','Johnson','Lee','Martinez','Brown','Wilson','Davis','Lopez','Miller','Taylor','Anderson']

  distribution.forEach(({ floor, prefix, count, roomStart }) => {
    for (let i = 0; i < count; i++) {
      const fname = firstNames[(id * 7) % firstNames.length]
      const lname = lastNames[(id * 13) % lastNames.length]
      guests.push({
        id: `G${String(id).padStart(3,'0')}`,
        name: `${fname} ${lname}`,
        floor,
        room: `${prefix}${roomStart + (i % 30)}`,
      })
      id++
    }
  })
  return guests
}

export const GUESTS = buildGuests()

/* ── Sensors ─────────────────────────────────────────────── */
export const SENSORS = [
  // Lobby (4 sensors)
  { id: 'SMK-L01', type: 'smoke',       floor: 'Lobby',   zone: 'Main Entrance',      x: 20, y: 25, status: 'active' },
  { id: 'MOT-L01', type: 'motion',      floor: 'Lobby',   zone: 'Reception Desk',     x: 50, y: 40, status: 'active' },
  { id: 'TMP-L01', type: 'temperature', floor: 'Lobby',   zone: 'Lobby Center',       x: 70, y: 55, status: 'active' },
  { id: 'CO2-L01', type: 'co2',         floor: 'Lobby',   zone: 'Bar Lounge',         x: 35, y: 70, status: 'active' },

  // Floor 1 (4 sensors)
  { id: 'SMK-F101', type: 'smoke',      floor: 'Floor 1', zone: 'Corridor A',         x: 15, y: 30, status: 'active' },
  { id: 'MOT-F101', type: 'motion',     floor: 'Floor 1', zone: 'Stairwell N',        x: 45, y: 20, status: 'active' },
  { id: 'TMP-F101', type: 'temperature',floor: 'Floor 1', zone: 'Room 115',           x: 75, y: 45, status: 'active' },
  { id: 'CO2-F101', type: 'co2',        floor: 'Floor 1', zone: 'Gym',                x: 60, y: 75, status: 'active' },

  // Floor 2 (4 sensors)
  { id: 'SMK-F201', type: 'smoke',      floor: 'Floor 2', zone: 'Kitchen Prep',       x: 25, y: 35, status: 'active' },
  { id: 'MOT-F201', type: 'motion',     floor: 'Floor 2', zone: 'Corridor B',         x: 55, y: 50, status: 'active' },
  { id: 'TMP-F201', type: 'temperature',floor: 'Floor 2', zone: 'Room 218',           x: 80, y: 30, status: 'active' },
  { id: 'CO2-F201', type: 'co2',        floor: 'Floor 2', zone: 'Conference Room',    x: 40, y: 65, status: 'active' },

  // Floor 3 (5 sensors — kitchen fire starts here)
  { id: 'SMK-F301', type: 'smoke',      floor: 'Floor 3', zone: 'East Wing Kitchen',  x: 78, y: 30, status: 'active' },
  { id: 'TMP-F301', type: 'temperature',floor: 'Floor 3', zone: 'East Wing Kitchen',  x: 82, y: 40, status: 'active' },
  { id: 'MOT-F301', type: 'motion',     floor: 'Floor 3', zone: 'Corridor C',         x: 50, y: 55, status: 'active' },
  { id: 'CO2-F301', type: 'co2',        floor: 'Floor 3', zone: 'East Wing Hall',     x: 65, y: 70, status: 'active' },
  { id: 'SMK-F302', type: 'smoke',      floor: 'Floor 3', zone: 'Room 312 Vicinity',  x: 30, y: 45, status: 'active' },

  // Floor 4 (4 sensors)
  { id: 'SMK-F401', type: 'smoke',      floor: 'Floor 4', zone: 'Penthouse Corridor', x: 20, y: 40, status: 'active' },
  { id: 'MOT-F401', type: 'motion',     floor: 'Floor 4', zone: 'Stairwell S',        x: 50, y: 25, status: 'active' },
  { id: 'TMP-F401', type: 'temperature',floor: 'Floor 4', zone: 'Room 420',           x: 72, y: 60, status: 'active' },
  { id: 'CO2-F401', type: 'co2',        floor: 'Floor 4', zone: 'Suite Lounge',       x: 38, y: 70, status: 'active' },

  // Roof (3 sensors)
  { id: 'SMK-R01',  type: 'smoke',      floor: 'Roof',    zone: 'HVAC Unit A',        x: 30, y: 35, status: 'active' },
  { id: 'TMP-R01',  type: 'temperature',floor: 'Roof',    zone: 'HVAC Unit B',        x: 60, y: 50, status: 'active' },
  { id: 'MOT-R01',  type: 'motion',     floor: 'Roof',    zone: 'Helipad',            x: 75, y: 65, status: 'active' },
]

/* ── Emergency Exits ─────────────────────────────────────── */
export const EMERGENCY_EXITS = [
  { id: 'EX-01', floor: 'Lobby',   zone: 'Main Entrance',       x: 50, y: 90, type: 'primary' },
  { id: 'EX-02', floor: 'Lobby',   zone: 'Service Corridor',    x: 10, y: 50, type: 'secondary' },
  { id: 'EX-03', floor: 'Floor 1', zone: 'North Stairwell',     x: 15, y: 15, type: 'primary' },
  { id: 'EX-04', floor: 'Floor 2', zone: 'South Stairwell',     x: 85, y: 85, type: 'primary' },
  { id: 'EX-05', floor: 'Floor 3', zone: 'North Stairwell',     x: 15, y: 15, type: 'primary' },
  { id: 'EX-06', floor: 'Floor 3', zone: 'East Fire Escape',    x: 90, y: 50, type: 'secondary' },
  { id: 'EX-07', floor: 'Floor 4', zone: 'South Stairwell',     x: 85, y: 85, type: 'primary' },
  { id: 'EX-08', floor: 'Roof',    zone: 'Roof Access Hatch',   x: 50, y: 10, type: 'secondary' },
]

/* ── Evacuation Routes ───────────────────────────────────── */
export const EVACUATION_ROUTES = {
  'Lobby': {
    primary:   ['Main Entrance EX-01', 'Onto Grand Avenue'],
    secondary: ['Service Corridor EX-02', 'Rear parking lot'],
  },
  'Floor 1': {
    primary:   ['North Stairwell → Lobby → EX-01'],
    secondary: ['South Stairwell → Lobby → EX-02'],
  },
  'Floor 2': {
    primary:   ['North Stairwell → Floor 1 → Lobby → EX-01'],
    secondary: ['South Stairwell EX-04 → Lobby → EX-02'],
  },
  'Floor 3': {
    primary:   ['North Stairwell EX-05 → Floor 2 → Floor 1 → Lobby → EX-01'],
    secondary: ['East Fire Escape EX-06 → External stairs → Ground'],
  },
  'Floor 4': {
    primary:   ['South Stairwell EX-07 → Floor 3 → Floor 2 → Floor 1 → Lobby → EX-01'],
    secondary: ['North Stairwell → Floor 3 east escape EX-06'],
  },
  'Roof': {
    primary:   ['Roof Hatch EX-08 → Floor 4 → South Stairwell → Ground'],
    secondary: ['Emergency helicopter landing if necessary'],
  },
}
