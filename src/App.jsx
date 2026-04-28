import React, { useState, useEffect, useMemo } from 'react'
import { EVACUATION_ROUTES } from './data/hotelData.js'
import { ALL_SCENARIOS } from './data/crisisScenarios.js'
import FloorMap from './components/FloorMap/FloorMap.jsx'
import SensorGrid from './components/SensorGrid/SensorGrid.jsx'
import SeverityGauge from './components/SeverityGauge/SeverityGauge.jsx'
import AlertFeed from './components/AlertFeed/AlertFeed.jsx'
import { useCrisisSimulation } from './hooks/useCrisisSimulation.js'

function formatTime(d) {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
function pad2(n) { return String(n).padStart(2, '0') }
function fmtElapsed(s) {
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
}

/* ── Crisis zone deriver ─────────────────────────────────────── */
const LOBBY_ZONE_MAP = {
  'Reception Desk':  'reception',
  'Main Entrance':   'main-entrance',
  'Bar Lounge':      'bar-lounge',
  'Lobby Bar':       'bar-lounge',
  'Grand Ballroom':  'ballroom',
  'Concierge':       'concierge',
}

function deriveCrisisZones(crisisEvents, activeFloor) {
  const zones = new Set()
  crisisEvents.forEach(ev => {
    if (!ev.floor || ev.floor !== activeFloor || !ev.zone) return
    const z = ev.zone
    if (z.toLowerCase().includes('east'))  { zones.add('East Wing'); return }
    if (z.toLowerCase().includes('west'))  { zones.add('West Wing'); return }
    if (LOBBY_ZONE_MAP[z])                 { zones.add(LOBBY_ZONE_MAP[z]); return }
    zones.add(z)
  })
  return [...zones]
}

/* ── Header ───────────────────────────────────────────────────── */
function Header({ time, date, status, elapsedSeconds, simulationStatus }) {
  const isCrisis  = status !== 'NOMINAL'
  const isRunning = simulationStatus === 'running' || simulationStatus === 'crisis'

  return (
    <header className="relative z-10 flex items-center justify-between px-6 h-14 panel border-b border-t-0 border-x-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-accent-red/20 border border-accent-red/50 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L2 5v6l6 4 6-4V5L8 1z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 6v4M6 8h4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <span className="text-accent-red font-bold text-lg tracking-tight glow-red">CrisisOS</span>
          <span className="text-text-secondary text-xs ml-2 font-medium">v1.0.0</span>
        </div>
      </div>

      {/* Center */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center">
        <div className="text-text-primary font-semibold text-sm tracking-wide">Horizon Grand Hotel</div>
        <div className="text-text-secondary text-xs">
          Emergency Response Command
          {isRunning && (
            <span className="ml-2 font-mono text-accent-amber">T+{fmtElapsed(elapsedSeconds)}</span>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-text-primary font-mono font-semibold text-base">{time}</div>
          <div className="text-text-secondary text-xs">{date}</div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold tracking-widest uppercase border ${
          isCrisis
            ? 'border-accent-red/50 text-accent-red bg-accent-red/10 crisis-pulse'
            : 'border-accent-green/30 text-accent-green bg-accent-green/10'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isCrisis ? 'bg-accent-red' : 'bg-accent-green'}`}/>
          {isCrisis ? 'CRISIS ACTIVE' : 'ALL SYSTEMS NOMINAL'}
        </div>
      </div>
    </header>
  )
}

/* ── Sidebar ──────────────────────────────────────────────────── */
function Sidebar({ sensors, staff, accountedGuests, crisisEvents, onSensorClick, selectedSensorId }) {
  const [activeTab, setActiveTab] = useState('sensors')

  const onlineCount    = sensors.filter(s => s.status !== 'offline').length
  const availableStaff = staff.filter(s => s.status === 'available').length
  const alertCount     = crisisEvents.filter(e => !e.acknowledged).length

  const roleColor = { Security: 'text-accent-red', Medical: 'text-accent-green', Manager: 'text-accent-amber', Concierge: 'text-accent-blue', Housekeeping: 'text-text-secondary' }

  return (
    <aside className="w-[280px] flex flex-col panel border-r border-l-0 border-y-0 relative z-10 shrink-0">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5 shrink-0">
        <div className="bg-bg-secondary p-3">
          <div className="text-2xl font-bold text-accent-green">{onlineCount}</div>
          <div className="text-text-secondary text-xs mt-0.5">Sensors Online</div>
        </div>
        <div className="bg-bg-secondary p-3">
          <div className="text-2xl font-bold text-accent-amber">{availableStaff}</div>
          <div className="text-text-secondary text-xs mt-0.5">Staff Available</div>
        </div>
        <div className="bg-bg-secondary p-3">
          <div className={`text-2xl font-bold ${accountedGuests < 251 ? 'text-accent-amber' : 'text-accent-blue'}`}>{accountedGuests}</div>
          <div className="text-text-secondary text-xs mt-0.5">Guests Accounted</div>
        </div>
        <div className="bg-bg-secondary p-3">
          <div className={`text-2xl font-bold ${alertCount > 0 ? 'text-accent-red' : 'text-text-secondary'}`}>{alertCount}</div>
          <div className="text-text-secondary text-xs mt-0.5">Active Alerts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {['sensors', 'staff'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === tab ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-text-primary'
          }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'sensors' ? (
          <SensorGrid
            sensors={sensors}
            onSensorClick={onSensorClick}
            selectedSensorId={selectedSensorId}
          />
        ) : (
          <div className="overflow-y-auto h-full py-1 px-1">
            {staff.map(m => (
              <div key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">{m.name[0]}</div>
                  <span className="text-text-primary text-xs truncate">{m.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-medium ${roleColor[m.role] ?? 'text-text-secondary'}`}>{m.role.slice(0, 3).toUpperCase()}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    m.status === 'available' ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-amber/15 text-accent-amber'
                  }`}>
                    {m.status === 'available' ? 'AVL' : 'DSP'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 p-3 shrink-0">
        <div className="scanning rounded bg-bg-primary/60 border border-white/5 p-2">
          <div className="text-text-secondary text-xs">Sensor sweep cycle</div>
          <div className="text-accent-blue text-xs font-mono mt-0.5">— scanning all floors —</div>
        </div>
      </div>
    </aside>
  )
}

/* ── Right Panel ──────────────────────────────────────────────── */
const AGENT_COLOR = {
  SensorMonitor: 'text-accent-blue', ThreatAssessor: 'text-accent-red',
  StaffCoordinator: 'text-accent-amber', GuestTracker: 'text-accent-green',
  EvacPlanner: 'text-purple-400', CrisisOrchestrator: 'text-accent-red',
}
const LEVEL_STYLE = {
  info: 'text-text-secondary', success: 'text-accent-green',
  warning: 'text-accent-amber', critical: 'text-accent-red',
}
const AGENT_STATUS = [
  { name: 'SensorMonitor',    color: 'accent-blue' },
  { name: 'ThreatAssessor',   color: 'accent-red'  },
  { name: 'StaffCoordinator', color: 'accent-amber' },
  { name: 'EvacPlanner',      color: 'purple-400'  },
]

function RightPanel({ sim, onStartScenario }) {
  const [tab, setTab]               = useState('alerts')
  const [showPicker, setShowPicker] = useState(false)
  const agentLogsRef                = React.useRef(null)

  const isRunning = sim.simulationStatus === 'running' || sim.simulationStatus === 'crisis'

  useEffect(() => {
    if (tab === 'agents' && agentLogsRef.current) {
      agentLogsRef.current.scrollTop = agentLogsRef.current.scrollHeight
    }
  }, [sim.agentLogs, tab])

  const agentRunning = (name) => {
    if (!isRunning) return false
    if (name === 'SensorMonitor' || name === 'StaffCoordinator') return true
    if (name === 'ThreatAssessor') return sim.crisisEvents.length > 0
    if (name === 'EvacPlanner') return sim.evacuationActive
    return false
  }

  return (
    <aside className="w-[320px] flex flex-col panel border-l border-r-0 border-y-0 relative z-10 shrink-0">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <div className="text-text-primary font-semibold text-sm">Crisis Intelligence</div>
          <div className="text-text-secondary text-xs mt-0.5">Sensor · Agent · Alert feed</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-accent-red animate-pulse' : 'bg-accent-green animate-pulse'}`}/>
          <span className={`text-xs font-medium ${isRunning ? 'text-accent-red' : 'text-accent-green'}`}>
            {isRunning ? 'LIVE' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Severity Gauge */}
      <div className="border-b border-white/5 shrink-0 bg-bg-primary/30">
        <SeverityGauge score={sim.severityScore} />
      </div>

      {/* Agent Status row */}
      <div className="grid grid-cols-2 gap-1 p-2 border-b border-white/5 shrink-0">
        {AGENT_STATUS.map(ag => {
          const running = agentRunning(ag.name)
          return (
            <div key={ag.name} className="flex items-center justify-between py-1 px-1.5 rounded bg-white/5">
              <span className={`text-[10px] font-medium text-${ag.color} truncate`}>{ag.name}</span>
              <span className={`text-[9px] px-1 py-px rounded font-mono ml-1 shrink-0 ${
                running ? 'bg-accent-green/15 text-accent-green' : 'bg-white/5 text-text-secondary'
              }`}>
                {running ? 'RUN' : 'STBY'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-white/5 shrink-0">
        {[['alerts', 'ALERTS'], ['agents', 'AGENTS']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
            tab === key ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-text-primary'
          }`}>
            {label}
            {key === 'alerts' && sim.crisisEvents.length > 0 && (
              <span className="ml-1 text-[9px] bg-accent-red/20 text-accent-red px-1 rounded">{sim.crisisEvents.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Feed area */}
      <div className="flex-1 overflow-hidden">
        {tab === 'alerts' ? (
          <AlertFeed events={sim.crisisEvents} />
        ) : (
          <div ref={agentLogsRef} className="h-full overflow-y-auto px-3 py-2 space-y-2">
            {sim.agentLogs.map(log => (
              <div key={log.id} className="fade-in">
                <div className="flex items-start gap-2">
                  <span className="text-text-secondary font-mono text-[9px] shrink-0 mt-0.5">{log.time}</span>
                  <div>
                    <span className={`text-[10px] font-semibold ${AGENT_COLOR[log.agent] ?? 'text-text-secondary'}`}>[{log.agent}]</span>
                    <span className={`text-[10px] ml-1 ${LEVEL_STYLE[log.level]}`}>{log.msg}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sim controls */}
      <div className="border-t border-white/5 p-3 shrink-0">
        {!isRunning ? (
          <div className="space-y-1.5">
            {showPicker ? (
              <>
                <div className="text-text-secondary text-[10px] mb-1.5 font-semibold uppercase tracking-widest">SELECT SCENARIO</div>
                {ALL_SCENARIOS.map(s => (
                  <button key={s.id} onClick={() => { onStartScenario(s.name); setShowPicker(false) }}
                    className="w-full text-left py-2 px-2.5 rounded bg-accent-red/10 border border-accent-red/30 hover:bg-accent-red/20 transition-colors">
                    <div className="text-accent-red text-[11px] font-semibold">{s.name}</div>
                    <div className="text-text-secondary text-[9px] mt-0.5 leading-snug">{s.description.slice(0, 60)}…</div>
                  </button>
                ))}
                <button onClick={() => setShowPicker(false)} className="w-full py-1.5 text-[10px] text-text-secondary hover:text-text-primary">Cancel</button>
              </>
            ) : (
              <button onClick={() => setShowPicker(true)}
                className="w-full py-2 rounded bg-accent-red/20 border border-accent-red/30 text-accent-red text-xs font-semibold hover:bg-accent-red/30 transition-colors">
                TRIGGER SIMULATION →
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="flex-1 text-center">
              <div className="text-text-secondary text-[9px] uppercase tracking-wider">Elapsed</div>
              <div className="text-accent-amber font-mono text-sm">{fmtElapsed(sim.elapsedSeconds)}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-text-secondary text-[9px] uppercase tracking-wider">Guests</div>
              <div className={`font-mono text-sm ${sim.accountedGuests < 251 ? 'text-accent-amber' : 'text-accent-green'}`}>
                {sim.accountedGuests}/251
              </div>
            </div>
            <button onClick={sim.resetSimulation}
              className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-text-secondary text-[10px] font-semibold hover:bg-white/15 hover:text-text-primary transition-colors">
              RESET
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}

/* ── App Root ─────────────────────────────────────────────────── */
export default function App() {
  const [time, setTime]               = useState(formatTime(new Date()))
  const [date, setDate]               = useState(formatDate(new Date()))
  const [selectedSensor, setSelectedSensor] = useState(null)
  const sim = useCrisisSimulation()

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setTime(formatTime(now))
      setDate(formatDate(now))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const crisisZones = useMemo(
    () => deriveCrisisZones(sim.crisisEvents, sim.activeFloor),
    [sim.crisisEvents, sim.activeFloor]
  )

  const isCrisis = sim.simulationStatus !== 'idle'

  const handleSensorClick = (sensor) => {
    setSelectedSensor(prev => prev?.id === sensor.id ? null : sensor)
    sim.setActiveFloor(sensor.floor)
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg-primary flex flex-col">
      {/* Animated grid background */}
      <div className="grid-bg" />

      {/* Full-screen red flash when severity crosses 7 */}
      {sim.flashRed && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.12) 60%, transparent 100%)',
            animation: 'flash-in 0.9s ease-out forwards',
          }}
        />
      )}

      {/* Header */}
      <Header
        time={time}
        date={date}
        status={isCrisis ? 'CRISIS' : 'NOMINAL'}
        elapsedSeconds={sim.elapsedSeconds}
        simulationStatus={sim.simulationStatus}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          sensors={sim.sensors}
          staff={sim.staff}
          accountedGuests={sim.accountedGuests}
          crisisEvents={sim.crisisEvents}
          onSensorClick={handleSensorClick}
          selectedSensorId={selectedSensor?.id}
        />
        <FloorMap
          sensors={sim.sensors}
          guests={sim.guests}
          staff={sim.staff}
          crisisZones={crisisZones}
          evacuationRoutes={EVACUATION_ROUTES}
          isEvacuating={sim.evacuationActive}
          activeFloor={sim.activeFloor}
          onFloorChange={sim.setActiveFloor}
        />
        <RightPanel sim={sim} onStartScenario={sim.startSimulation} />
      </div>
    </div>
  )
}
