import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* Visual layout — 3 nodes in a row, animated packets travel between them */

const NODES = [
  { key: 'detection',    label: 'DetectionAgent',    sub: 'Sensor → Decision',      x: 80,  y: 100, color: '#3b82f6' },
  { key: 'coordination', label: 'CoordinationAgent', sub: 'Plan dispatch + comms',  x: 280, y: 100, color: '#f59e0b' },
  { key: 'bridge',       label: 'BridgeAgent',       sub: 'Responder briefing',     x: 480, y: 100, color: '#ef4444' },
]
const VIEW_W = 560
const VIEW_H = 230

function nodeStatusFromStep(currentStep, statusMap) {
  // statusMap from AgentOrchestrator: STANDBY/ANALYZING/COMPLETE
  return {
    detection:    statusMap.detection    ?? 'STANDBY',
    coordination: statusMap.coordination ?? 'STANDBY',
    bridge:       statusMap.bridge       ?? 'STANDBY',
  }
}

function statusColor(status, baseColor) {
  if (status === 'ANALYZING') return baseColor
  if (status === 'COMPLETE') return '#22c55e'
  return '#475569'
}

export default function AgentFlowVisualizer({
  outputs, statuses, timings, currentStep,
}) {
  const status = nodeStatusFromStep(currentStep, statuses)
  const [selectedPayload, setSelectedPayload] = useState(null)

  // Animated packets: when a node is ANALYZING, fire a packet from prev → this node every ~1.2s
  const packetIdRef = useRef(0)
  const [packets, setPackets] = useState([])

  useEffect(() => {
    const id = setInterval(() => {
      const newPackets = []
      // detection → coordination if coordination ANALYZING
      if (status.coordination === 'ANALYZING') {
        newPackets.push({ id: packetIdRef.current++, from: 0, to: 1, color: '#3b82f6', t: Date.now() })
      }
      if (status.bridge === 'ANALYZING') {
        newPackets.push({ id: packetIdRef.current++, from: 1, to: 2, color: '#f59e0b', t: Date.now() })
      }
      // Sensor packets streaming into Detection while ANALYZING
      if (status.detection === 'ANALYZING') {
        newPackets.push({ id: packetIdRef.current++, from: -1, to: 0, color: '#3b82f6', t: Date.now() })
      }
      if (newPackets.length) setPackets((p) => [...p, ...newPackets].slice(-12))
    }, 1100)
    return () => clearInterval(id)
  }, [status.detection, status.coordination, status.bridge])

  // Cleanup old packets
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - 2500
      setPackets((p) => p.filter((pk) => pk.t > cutoff))
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Gantt: parallel execution lanes
  const ganttRows = useMemo(() => {
    const rows = []
    NODES.forEach((n) => {
      const s = status[n.key]
      const ms = timings[n.key] ?? 0
      let bar = null
      if (s === 'ANALYZING') {
        bar = { start: 0, end: 100, color: n.color, animate: true }
      } else if (s === 'COMPLETE') {
        // Simulate a bar based on timing (clamp to 30s = 100%)
        const w = Math.min(100, (ms / 5000) * 100)
        bar = { start: 0, end: w || 30, color: '#22c55e' }
      }
      rows.push({ key: n.key, label: n.label, color: n.color, bar })
    })
    return rows
  }, [status, timings])

  return (
    <div className="flex flex-col h-full bg-bg-primary/40">
      {/* SVG Flow */}
      <div className="px-2 pt-2">
        <svg width="100%" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Sensor source label (left of detection) */}
          <g>
            <rect x="6" y="80" width="48" height="40" rx="6" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.3)" />
            <text x="30" y="96" textAnchor="middle" fontSize="8" fill="#94a3b8" letterSpacing="1">SENSORS</text>
            <text x="30" y="110" textAnchor="middle" fontSize="9" fill="#3b82f6" fontFamily="monospace">120 hz</text>
          </g>

          {/* Connector lines */}
          <line x1="54" y1="100" x2="56" y2="100" stroke="#3b82f6" strokeWidth="0.8" />
          {NODES.slice(0, -1).map((n, i) => {
            const next = NODES[i + 1]
            const active = status[next.key] === 'ANALYZING'
            return (
              <line
                key={n.key + '-line'}
                x1={n.x + 48}
                y1={n.y}
                x2={next.x - 48}
                y2={next.y}
                stroke={active ? next.color : 'rgba(148,163,184,0.18)'}
                strokeWidth={active ? 1.6 : 1}
                strokeDasharray={active ? '0' : '4 4'}
              />
            )
          })}

          {/* Connector from sensors to detection */}
          <line
            x1="54"
            y1="100"
            x2={NODES[0].x - 48}
            y2={NODES[0].y}
            stroke={status.detection === 'ANALYZING' ? '#3b82f6' : 'rgba(148,163,184,0.18)'}
            strokeWidth="1"
            strokeDasharray={status.detection === 'ANALYZING' ? '0' : '4 4'}
          />

          {/* Packets */}
          {packets.map((pk) => {
            const fromX = pk.from < 0 ? 54 : NODES[pk.from].x + 48
            const toX = NODES[pk.to].x - 48
            const y = 100
            return (
              <motion.circle
                key={pk.id}
                initial={{ cx: fromX, cy: y, opacity: 0 }}
                animate={{ cx: toX, cy: y, opacity: [0, 1, 0] }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
                r={3}
                fill={pk.color}
                filter="url(#glow)"
              />
            )
          })}

          {/* Nodes */}
          {NODES.map((n) => {
            const s = status[n.key]
            const isActive = s === 'ANALYZING'
            const isDone = s === 'COMPLETE'
            const fill = isActive ? n.color + '22' : isDone ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.06)'
            const stroke = statusColor(s, n.color)
            return (
              <g key={n.key} style={{ cursor: outputs[n.key] ? 'pointer' : 'default' }}
                onClick={() => outputs[n.key] && setSelectedPayload({ key: n.key, label: n.label, text: outputs[n.key] })}>
                <rect
                  x={n.x - 48}
                  y={n.y - 28}
                  width="96"
                  height="56"
                  rx="8"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isActive ? 2 : 1}
                  filter={isActive ? 'url(#glow)' : ''}
                  style={{ transition: 'all 0.3s' }}
                />
                <text x={n.x} y={n.y - 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="#e2e8f0">{n.label}</text>
                <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="8" fill="#94a3b8">{n.sub}</text>
                <text x={n.x} y={n.y + 20} textAnchor="middle" fontSize="9" fontFamily="monospace" fill={stroke}>
                  {s}
                </text>
                {isActive && (
                  <circle cx={n.x + 38} cy={n.y - 18} r="3" fill={n.color}>
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            )
          })}

          {/* Output label */}
          {currentStep >= 4 && (
            <g>
              <text x={VIEW_W - 10} y="190" textAnchor="end" fontSize="10" fill="#22c55e" letterSpacing="2">
                ✓ PIPELINE COMPLETE
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Gantt — parallel execution lanes */}
      <div className="px-3 pt-2 pb-2 border-t border-white/5">
        <div className="text-[9px] uppercase tracking-widest text-text-secondary mb-1.5">Execution timeline</div>
        <div className="space-y-1">
          {ganttRows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <div className="w-24 text-[9px] text-text-secondary truncate">{row.label}</div>
              <div className="flex-1 h-2.5 bg-white/5 rounded relative overflow-hidden">
                {row.bar && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${row.bar.start}%`,
                      width: `${row.bar.end - row.bar.start}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${row.bar.color}55, ${row.bar.color})`,
                      animation: row.bar.animate ? 'pulse 1.4s ease-in-out infinite' : 'none',
                      transition: 'width 0.5s ease',
                    }}
                  />
                )}
              </div>
              <div className="w-10 text-right text-[9px] font-mono text-text-secondary">
                {timings[row.key] ? `${(timings[row.key] / 1000).toFixed(1)}s` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payload inspector */}
      <AnimatePresence>
        {selectedPayload && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="border-t border-white/10 bg-black/70"
          >
            <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">
                Payload · {selectedPayload.label}
              </span>
              <button
                className="text-[10px] text-text-secondary hover:text-text-primary"
                onClick={() => setSelectedPayload(null)}
              >
                ✕
              </button>
            </div>
            <pre
              className="text-[10px] text-emerald-300 font-mono whitespace-pre-wrap p-3 max-h-40 overflow-y-auto"
            >
              {selectedPayload.text}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
