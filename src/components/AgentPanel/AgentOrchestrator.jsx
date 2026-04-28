import React, { useEffect, useRef, useState } from 'react'
import AgentPanel from './AgentPanel.jsx'
import { runDetectionAgent, runCoordinationAgent, runEmergencyBridgeAgent } from '../../services/agents.js'
import { FLOORS, GUESTS, STAFF, EVACUATION_ROUTES } from '../../data/hotelData.js'

const HOTEL_META = {
  address: '1 Horizon Plaza, Grand Avenue, City Center',
  floors: FLOORS.length,
  staff: STAFF,
  totalGuests: GUESTS.length,
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AgentOrchestrator({ sim }) {
  const [outputs, setOutputs] = useState({ detection: '', coordination: '', bridge: '' })
  const [statuses, setStatuses] = useState({ detection: 'STANDBY', coordination: 'STANDBY', bridge: 'STANDBY' })
  const [timings, setTimings] = useState({ detection: 0, coordination: 0, bridge: 0 })
  const [currentStep, setCurrentStep] = useState(0)

  const startedRef = useRef(false)
  const abortControllersRef = useRef({})
  const mountedRef = useRef(true)
  const streamBufferRef = useRef({ detection: '', coordination: '', bridge: '' })

  useEffect(() => {
    return () => {
      mountedRef.current = false
      Object.values(abortControllersRef.current).forEach((ctrl) => ctrl.abort())
    }
  }, [])

  useEffect(() => {
    if (sim.simulationStatus === 'idle') {
      startedRef.current = false
      Object.values(abortControllersRef.current).forEach((ctrl) => ctrl.abort())
      abortControllersRef.current = {}
      setOutputs({ detection: '', coordination: '', bridge: '' })
      setStatuses({ detection: 'STANDBY', coordination: 'STANDBY', bridge: 'STANDBY' })
      setTimings({ detection: 0, coordination: 0, bridge: 0 })
      setCurrentStep(0)
    }
  }, [sim.simulationStatus])

  useEffect(() => {
    if (sim.simulationStatus !== 'idle' && sim.severityScore >= 5 && sim.crisisEvents.length > 0 && !startedRef.current) {
      startedRef.current = true
      startPipeline()
    }
  }, [sim.simulationStatus, sim.severityScore, sim.crisisEvents.length])

  const runAgent = async (key, fn, args) => {
    const controller = new AbortController()
    abortControllersRef.current[key] = controller
    const startTime = Date.now()
    let buffer = ''

    setStatuses((prev) => ({ ...prev, [key]: 'ANALYZING' }))
    setOutputs((prev) => ({ ...prev, [key]: '' }))
    streamBufferRef.current[key] = ''

    try {
      await fn(...args, (chunk) => {
        if (controller.signal.aborted) return
        buffer += chunk
        streamBufferRef.current[key] += chunk
        setOutputs((prev) => ({ ...prev, [key]: prev[key] + chunk }))
      }, controller.signal)
    } catch (error) {
      if (error?.name === 'AbortError') {
        return buffer
      }
    } finally {
      if (!mountedRef.current) return buffer
      setStatuses((prev) => ({ ...prev, [key]: 'COMPLETE' }))
      setTimings((prev) => ({ ...prev, [key]: Date.now() - startTime }))
    }

    return buffer
  }

  const startPipeline = async () => {
    setCurrentStep(1)

    const detectionPromise = runAgent(
      'detection',
      runDetectionAgent,
      [sim.crisisEvents, sim.sensors, { activeFloor: sim.activeFloor }]
    )
    const detectBuffer = await Promise.race([detectionPromise, delay(8000)])
    const liveDetection = detectBuffer ?? streamBufferRef.current.detection

    setCurrentStep(2)
    const coordinationPromise = runAgent(
      'coordination',
      runCoordinationAgent,
      [
        liveDetection,
        sim.staff,
        sim.accountedGuests,
        EVACUATION_ROUTES,
      ]
    )
    const coordBuffer = await Promise.race([coordinationPromise, delay(8000)])

    setCurrentStep(3)
    const bridgePromise = runAgent(
      'bridge',
      runEmergencyBridgeAgent,
      [
        liveDetection,
        coordBuffer ?? streamBufferRef.current.coordination,
        HOTEL_META,
      ]
    )
    await Promise.race([bridgePromise, delay(8000)])

    setCurrentStep(4)
  }

  return (
    <div className="w-[380px] flex flex-col panel border-l border-y-0 border-r-0 relative z-10 shrink-0">
      <AgentPanel
        outputs={outputs}
        statuses={statuses}
        timings={timings}
        currentStep={currentStep}
      />
    </div>
  )
}
