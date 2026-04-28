import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { EVACUATION_ROUTES } from './data/hotelData.js'
import { ALL_SCENARIOS } from './data/crisisScenarios.js'
import FloorMap from './components/FloorMap/FloorMap.jsx'
import SensorGrid from './components/SensorGrid/SensorGrid.jsx'
import SeverityGauge from './components/SeverityGauge/SeverityGauge.jsx'
import AlertFeed from './components/AlertFeed/AlertFeed.jsx'
import ResponderBrief from './components/ResponderBrief/ResponderBrief.jsx'
import DispatchBoard from './components/DispatchBoard/DispatchBoard.jsx'
import AccountabilityTracker from './components/AccountabilityTracker/AccountabilityTracker.jsx'
import ZoneCommunications from './components/ZoneCommunications/ZoneCommunications.jsx'
import { useCrisisSimulation } from './hooks/useCrisisSimulation.js'
import AgentOrchestrator from './components/AgentPanel/AgentOrchestrator.jsx'
import IncidentReviewPanel from './components/IncidentReview/IncidentReviewPanel.jsx'
import BeforeAfterComparison from './components/Comparison/BeforeAfterComparison.jsx'
import CountdownOverlay from './components/Countdown/CountdownOverlay.jsx'
import { useCountUp } from './hooks/useCountUp.js'
import VoicePanel from './components/VoicePanel/VoicePanel.jsx'
import CCTVGrid from './components/CCTVPanel/CCTVGrid.jsx'
import QRBadge from './components/QR/QRBadge.jsx'
import DemoController from './components/Demo/DemoController.jsx'
import NarrationBar from './components/Demo/NarrationBar.jsx'
import StatsOverlay from './components/Demo/StatsOverlay.jsx'
import IntroSplash from './components/Demo/IntroSplash.jsx'
import RiskMonitor, { RiskHeaderChip } from './components/RiskMonitor/RiskMonitor.jsx'
import ThermalGrid from './components/Thermal/ThermalGrid.jsx'
import FloorMap3D from './components/FloorMap3D/FloorMap3D.jsx'
import ConnectivityPanel, { ConnectivityChip, ConnectivityBanner } from './components/EdgeMode/ConnectivityPanel.jsx'

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
function Header({ time, date, status, elapsedSeconds, simulationStatus, onOpenReview, reviewBadgeCount, onOpenCompare, drillMode, onToggleDrill, sim, onOpenRisk, onOpenConnectivity }) {
  const isCrisis  = status !== 'NOMINAL'
  const isRunning = simulationStatus === 'running' || simulationStatus === 'crisis'

  return (
    <header className="relative z-10 flex items-center justify-between px-6 h-14 panel border-b border-t-0 border-x-0 shrink-0">
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

      <div className="absolute left-1/2 -translate-x-1/2 text-center hidden 2xl:block pointer-events-none">
        <div className="text-text-primary font-semibold text-sm tracking-wide">Horizon Grand Hotel</div>
        <div className="text-text-secondary text-xs">
          Emergency Response Command
          {isRunning && (
            <span className="ml-2 font-mono text-accent-amber">T+{fmtElapsed(elapsedSeconds)}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {sim && (
          <RiskHeaderChip
            score={sim.risk.score}
            level={sim.risk.level}
            preAlert={sim.preAlertActive}
            onClick={onOpenRisk}
          />
        )}
        {sim && (
          <ConnectivityChip mode={sim.connState.mode} onClick={onOpenConnectivity} />
        )}
        <button
          onClick={onToggleDrill}
          className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-semibold uppercase tracking-widest transition-colors ${
            drillMode
              ? 'border-purple-400/60 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25'
              : 'border-white/15 bg-white/5 text-text-secondary hover:text-text-primary hover:bg-white/10'
          }`}
          title="Toggle Drill Mode"
        >
          <span className={`w-2 h-2 rounded-full ${drillMode ? 'bg-purple-300 animate-pulse' : 'bg-text-secondary/50'}`} />
          Drill Mode
        </button>

        <button
          onClick={onOpenCompare}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
          title="Compare CrisisOS response vs traditional"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M3 4l4-3 4 3M3 10l4 3 4-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Compare Response
        </button>

        <button
          onClick={onOpenReview}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-accent-amber/40 bg-accent-amber/10 text-accent-amber text-xs font-semibold uppercase tracking-widest hover:bg-accent-amber/20 transition-colors"
          title="Open incident timeline, audit log and metrics"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M7 4.5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Incident Timeline
          {reviewBadgeCount > 0 && (
            <span className="ml-0.5 px-1.5 py-px rounded-full bg-accent-amber/30 text-[10px] font-mono text-accent-amber">
              {reviewBadgeCount}
            </span>
          )}
        </button>
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

function StatTile({ value, label, valueClass, flash }) {
  const animated = useCountUp(value)
  return (
    <div className={`bg-bg-secondary p-3 ${flash ? 'beep-flash' : ''}`}>
      <div className={`text-2xl font-bold tabular-nums ${valueClass}`}>{animated}</div>
      <div className="text-text-secondary text-xs mt-0.5">{label}</div>
    </div>
  )
}

/* ── Sidebar ──────────────────────────────────────────────────── */
function Sidebar({ sensors, staff, accountedGuests, crisisEvents, onSensorClick, selectedSensorId }) {
  const [activeTab, setActiveTab] = useState('sensors')

  const onlineCount    = sensors.filter(s => s.status !== 'offline').length
  const availableStaff = staff.filter(s => s.status === 'available').length
  const alertCount     = crisisEvents.filter(e => !e.acknowledged).length

  const prevAlertCount = useRef(alertCount)
  const [alertFlash, setAlertFlash] = useState(false)
  useEffect(() => {
    if (alertCount > prevAlertCount.current) {
      setAlertFlash(true)
      const t = setTimeout(() => setAlertFlash(false), 750)
      prevAlertCount.current = alertCount
      return () => clearTimeout(t)
    }
    prevAlertCount.current = alertCount
  }, [alertCount])

  const roleColor = { Security: 'text-accent-red', Medical: 'text-accent-green', Manager: 'text-accent-amber', Concierge: 'text-accent-blue', Housekeeping: 'text-text-secondary' }

  return (
    <aside className="sidebar-collapsible w-[280px] flex flex-col panel border-r border-l-0 border-y-0 relative z-10 shrink-0">
      <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5 shrink-0">
        <StatTile value={onlineCount}    label="Sensors Online"   valueClass="text-accent-green" />
        <StatTile value={availableStaff} label="Staff Available"  valueClass="text-accent-amber" />
        <StatTile value={accountedGuests} label="Guests Accounted" valueClass={accountedGuests < 251 ? 'text-accent-amber' : 'text-accent-blue'} />
        <StatTile value={alertCount}     label="Active Alerts"    valueClass={alertCount > 0 ? 'text-accent-red' : 'text-text-secondary'} flash={alertFlash} />
      </div>

      <div className="flex border-b border-white/5 shrink-0">
        {['sensors', 'staff'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === tab ? 'text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-text-primary'
          }`}>
            {tab}
          </button>
        ))}
      </div>

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

      <div className="border-t border-white/5 p-3 shrink-0 space-y-3">
        <QRBadge path="/#/guest" label="Scan to open guest view" />
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
    <aside className="right-panel-collapsible w-[320px] flex flex-col panel border-l border-r-0 border-y-0 relative z-10 shrink-0">
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

      <div className="border-b border-white/5 shrink-0 bg-bg-primary/30">
        <SeverityGauge score={sim.severityScore} />
      </div>

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

      <div className="px-2 pt-2 shrink-0">
        <VoicePanel />
      </div>

      <div className="flex border-b border-white/5 shrink-0 mt-2">
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

/* ── Central Stage with tabs (Floor map / Surveillance / Thermal / Multi-Sensor) ─ */
function CentralStage({ sim, crisisZones, centralTab, setCentralTab, mapMode, setMapMode, crisisFloor }) {
  const visionAgentActive = centralTab === 'surveillance' && (sim.severityScore >= 4 || sim.evacuationActive)

  return (
    <div className="central-stage flex-1 flex flex-col min-w-0 relative">
      <div className="tab-strip">
        <button className={centralTab === 'floor' ? 'active' : ''} onClick={() => setCentralTab('floor')}>
          Floor
        </button>
        <button className={centralTab === 'surveillance' ? 'active' : ''} onClick={() => setCentralTab('surveillance')}>
          CCTV
          {sim.evacuationActive && <span className="badge">LIVE</span>}
        </button>
        <button className={centralTab === 'thermal' ? 'active' : ''} onClick={() => setCentralTab('thermal')}>
          Thermal
          {sim.thermalAnomaly >= 42 && <span className="badge">HOT</span>}
        </button>
        <button className={centralTab === 'multi' ? 'active' : ''} onClick={() => setCentralTab('multi')}>
          Multi
        </button>
      </div>
      {centralTab === 'floor' && (
        <div className="flex items-center justify-end gap-1 px-3 py-1 border-b border-white/5 bg-bg-primary/40">
          <span className="text-[9px] uppercase tracking-[0.2em] text-text-secondary mr-1">View:</span>
          {[['2d', '2D'], ['3d', '3D ISO']].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMapMode(k)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest transition ${
                mapMode === k
                  ? 'bg-accent-blue/25 text-accent-blue border border-accent-blue/40'
                  : 'bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden relative">
        {centralTab === 'floor' && mapMode === '2d' && (
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
        )}
        {centralTab === 'floor' && mapMode === '3d' && (
          <FloorMap3D
            activeFloor={sim.activeFloor}
            crisisFloor={crisisFloor}
            evacuationActive={sim.evacuationActive}
            severityScore={sim.severityScore}
          />
        )}
        {centralTab === 'surveillance' && (
          <CCTVGrid
            severity={sim.severityScore}
            evacuationActive={sim.evacuationActive}
            visionAgentActive={visionAgentActive}
          />
        )}
        {centralTab === 'thermal' && (
          <ThermalGrid sim={sim} />
        )}
        {centralTab === 'multi' && (
          <div className="h-full grid grid-cols-1 md:grid-cols-2">
            <div className="border-r border-white/10 overflow-hidden">
              <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase tracking-[0.3em] text-accent-blue bg-bg-primary/60">
                Visible spectrum (CCTV)
              </div>
              <div className="h-[calc(100%-30px)]">
                <CCTVGrid
                  severity={sim.severityScore}
                  evacuationActive={sim.evacuationActive}
                  visionAgentActive
                />
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase tracking-[0.3em] text-accent-amber bg-bg-primary/60">
                Thermal infrared
              </div>
              <div className="h-[calc(100%-30px)] overflow-y-auto">
                <ThermalGrid sim={sim} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── App Root ─────────────────────────────────────────────────── */
export default function App() {
  const [time, setTime]               = useState(formatTime(new Date()))
  const [date, setDate]               = useState(formatDate(new Date()))
  const [selectedSensor, setSelectedSensor] = useState(null)
  const [bridgeBrief, setBridgeBrief] = useState(null)
  const [bridgeRawJson, setBridgeRawJson] = useState('')
  const [staffAssignments, setStaffAssignments] = useState([])
  const [zoneCommunications, setZoneCommunications] = useState([])
  const [dashboardTab, setDashboardTab] = useState('brief')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [drillMode, setDrillMode] = useState(false)
  const [countdownActive, setCountdownActive] = useState(false)
  const [pendingScenario, setPendingScenario] = useState(null)
  const [centralTab, setCentralTab] = useState('floor')
  const [mapMode, setMapMode] = useState('2d')
  const [riskOpen, setRiskOpen] = useState(false)
  const [connectivityOpen, setConnectivityOpen] = useState(false)
  const [demoVisible, setDemoVisible] = useState(true)
  const [presentationMode, setPresentationMode] = useState(false)
  const [statsVisible, setStatsVisible] = useState(true)
  const [narrationVisible, setNarrationVisible] = useState(true)
  const [introVisible, setIntroVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      if (window.location.hash.includes('skipIntro')) return false
      if (window.location.search.includes('skipIntro')) return false
      return window.sessionStorage.getItem('crisisos:introSeen') !== '1'
    } catch { return true }
  })

  const sim = useCrisisSimulation()

  const handleBridgeBrief = useCallback((brief, raw) => {
    setBridgeBrief(brief)
    setBridgeRawJson(raw ?? '')
  }, [])
  const handleStaffAssignments = useCallback((a) => setStaffAssignments(a), [])
  const handleZoneCommunications = useCallback((z) => setZoneCommunications(z), [])

  const handleStartScenario = useCallback((scenarioName) => {
    setPendingScenario(scenarioName)
    setCountdownActive(true)
  }, [])

  const handleCountdownComplete = useCallback(() => {
    setCountdownActive(false)
    if (pendingScenario) {
      sim.startSimulation(pendingScenario)
      setPendingScenario(null)
    }
  }, [pendingScenario, sim])

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setTime(formatTime(now))
      setDate(formatDate(now))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (sim.simulationStatus === 'idle') {
      setBridgeBrief(null)
      setBridgeRawJson('')
      setStaffAssignments([])
      setZoneCommunications([])
      setDashboardTab('brief')
    }
  }, [sim.simulationStatus])

  // Auto-switch to surveillance during high-severity crises (one-shot)
  const switchedToCCTV = useRef(false)
  useEffect(() => {
    if (sim.evacuationActive && !switchedToCCTV.current) {
      switchedToCCTV.current = true
      // Briefly show CCTV grid for dramatic effect
      setCentralTab('surveillance')
      const back = setTimeout(() => setCentralTab('floor'), 6000)
      return () => clearTimeout(back)
    }
    if (!sim.evacuationActive && sim.simulationStatus === 'idle') {
      switchedToCCTV.current = false
    }
  }, [sim.evacuationActive, sim.simulationStatus])

  // Toggle presentation mode body class
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('presentation-mode', presentationMode)
    return () => document.body.classList.remove('presentation-mode')
  }, [presentationMode])

  const crisisZones = useMemo(
    () => deriveCrisisZones(sim.crisisEvents, sim.activeFloor),
    [sim.crisisEvents, sim.activeFloor]
  )

  const crisisFloor = useMemo(() => {
    const ev = sim.crisisEvents.find((e) => e.severity === 'critical') || sim.crisisEvents[0]
    return ev?.floor || null
  }, [sim.crisisEvents])

  // Auto-open risk monitor on first pre-alert
  const preAlertSeenRef = useRef(false)
  useEffect(() => {
    if (sim.preAlertActive && !preAlertSeenRef.current) {
      preAlertSeenRef.current = true
      setRiskOpen(true)
      setTimeout(() => setRiskOpen(false), 5500)
    }
    if (sim.simulationStatus === 'idle') {
      preAlertSeenRef.current = false
    }
  }, [sim.preAlertActive, sim.simulationStatus])

  const isCrisis = sim.simulationStatus !== 'idle'

  const handleSensorClick = (sensor) => {
    setSelectedSensor(prev => prev?.id === sensor.id ? null : sensor)
    sim.setActiveFloor(sensor.floor)
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg-primary flex flex-col">
      <div className="grid-bg" />

      {sim.flashRed && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.35) 0%, rgba(239,68,68,0.12) 60%, transparent 100%)',
            animation: 'flash-in 0.9s ease-out forwards',
          }}
        />
      )}

      <Header
        time={time}
        date={date}
        status={isCrisis ? 'CRISIS' : 'NOMINAL'}
        elapsedSeconds={sim.elapsedSeconds}
        simulationStatus={sim.simulationStatus}
        onOpenReview={() => setReviewOpen(true)}
        reviewBadgeCount={sim.incidentTimeline.length}
        onOpenCompare={() => setCompareOpen(true)}
        drillMode={drillMode}
        onToggleDrill={() => setDrillMode(v => !v)}
        sim={sim}
        onOpenRisk={() => setRiskOpen(true)}
        onOpenConnectivity={() => setConnectivityOpen(true)}
      />

      <ConnectivityBanner banner={sim.connState.banner} />

      {drillMode && (
        <div className="relative z-10 flex items-center justify-center gap-3 px-6 py-2 border-b border-purple-500/30 bg-purple-500/15 text-purple-200 text-xs font-semibold uppercase tracking-[0.3em] shrink-0">
          <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" />
          Drill Mode Active — This is a Training Simulation
          <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          sensors={sim.sensors}
          staff={sim.staff}
          accountedGuests={sim.accountedGuests}
          crisisEvents={sim.crisisEvents}
          onSensorClick={handleSensorClick}
          selectedSensorId={selectedSensor?.id}
        />
        <CentralStage
          sim={sim}
          crisisZones={crisisZones}
          centralTab={centralTab}
          setCentralTab={setCentralTab}
          mapMode={mapMode}
          setMapMode={setMapMode}
          crisisFloor={crisisFloor}
        />
        <RightPanel sim={sim} onStartScenario={handleStartScenario} />
        <div className="agent-orchestrator-panel">
          <AgentOrchestrator
            sim={sim}
            onBridgeBrief={handleBridgeBrief}
            onStaffAssignments={handleStaffAssignments}
            onZoneCommunications={handleZoneCommunications}
          />
        </div>
      </div>

      {isCrisis && (
        <section className="crisis-bottom-panel absolute inset-x-6 bottom-6 z-20 mx-auto max-w-[calc(100%-3rem)] rounded-[2rem] border border-white/10 bg-bg-secondary/95 shadow-2xl backdrop-blur-xl overflow-hidden ring-1 ring-white/5 slide-up">
          <div className="flex flex-col gap-3 border-b border-white/10 bg-bg-secondary/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-text-secondary">Phase 5 crisis panel</div>
              <div className="text-base font-semibold text-white">Responder brief & dispatch dashboard</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'brief', label: 'BRIEF' },
                { key: 'dispatch', label: 'DISPATCH' },
                { key: 'accountability', label: 'ACCOUNTABILITY' },
                { key: 'zones', label: 'COMMUNICATIONS' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDashboardTab(tab.key)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${dashboardTab === tab.key ? 'bg-white text-bg-primary' : 'bg-white/5 text-text-secondary hover:bg-white/10'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[52vh] overflow-y-auto p-4">
            {dashboardTab === 'brief' && <ResponderBrief brief={bridgeBrief} rawJson={bridgeRawJson} />}
            {dashboardTab === 'dispatch' && <DispatchBoard assignments={staffAssignments} />}
            {dashboardTab === 'accountability' && (
              <AccountabilityTracker
                accountedGuests={sim.accountedGuests}
                totalGuests={251}
                evacuationActive={sim.evacuationActive}
              />
            )}
            {dashboardTab === 'zones' && <ZoneCommunications communications={zoneCommunications} activeVoiceZone={sim.currentVoiceZone} />}
          </div>
        </section>
      )}

      <IncidentReviewPanel
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        sim={sim}
        drillMode={drillMode}
        onCompare={() => setCompareOpen(true)}
      />

      <BeforeAfterComparison
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />

      <CountdownOverlay
        active={countdownActive}
        onComplete={handleCountdownComplete}
      />

      {/* Phase 10 overlays */}
      <NarrationBar visible={narrationVisible && isCrisis} sim={sim} />
      <StatsOverlay visible={statsVisible && isCrisis} sim={sim} />
      <DemoController
        visible={demoVisible}
        onToggleVisible={() => setDemoVisible(v => !v)}
        sim={sim}
        presentationMode={presentationMode}
        onTogglePresentation={() => setPresentationMode(v => !v)}
        statsVisible={statsVisible}
        onToggleStats={() => setStatsVisible(v => !v)}
        narrationVisible={narrationVisible}
        onToggleNarration={() => setNarrationVisible(v => !v)}
        onReplayIntro={() => setIntroVisible(true)}
      />

      <IntroSplash
        visible={introVisible}
        onDismiss={() => {
          setIntroVisible(false)
          try { window.sessionStorage.setItem('crisisos:introSeen', '1') } catch {}
        }}
      />

      <RiskMonitor open={riskOpen} onClose={() => setRiskOpen(false)} sim={sim} />
      <ConnectivityPanel open={connectivityOpen} onClose={() => setConnectivityOpen(false)} sim={sim} />
    </div>
  )
}
