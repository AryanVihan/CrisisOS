import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Lightweight isometric 3D floor stack.
 * 6 floors stacked vertically, persons as little spheres on each floor.
 * If `crisisFloor` is set, fire particles + red glow appear on that floor.
 */

const FLOOR_NAMES = ['Lobby', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Roof']
const FLOOR_OCCUPANCY = { Lobby: 12, 'Floor 1': 35, 'Floor 2': 58, 'Floor 3': 62, 'Floor 4': 68, Roof: 16 }

const FLOOR_W = 16
const FLOOR_D = 10
const FLOOR_H = 0.4
const STORY_H = 2.6

export default function FloorMap3D({
  activeFloor = 'Floor 3',
  crisisFloor = null,
  evacuationActive = false,
  severityScore = 0,
}) {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const personsRef = useRef([])
  const fireRef = useRef(null)
  const evacTubesRef = useRef([])
  const animRef = useRef(null)
  const stateRef = useRef({ activeFloor, crisisFloor, evacuationActive, severityScore })
  const dragRef = useRef({ down: false, x: 0, y: 0, rotY: 0.6, rotX: 0.5 })

  // Keep latest props in a ref for the animation loop
  useEffect(() => {
    stateRef.current = { activeFloor, crisisFloor, evacuationActive, severityScore }
  }, [activeFloor, crisisFloor, evacuationActive, severityScore])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth
    const h = mount.clientHeight

    // ── Scene ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a14)
    scene.fog = new THREE.Fog(0x0a0a14, 25, 80)
    sceneRef.current = scene

    // ── Camera (isometric-ish perspective) ──
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 200)
    camera.position.set(22, 18, 22)
    camera.lookAt(0, 6, 0)
    cameraRef.current = camera

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.setSize(w, h)
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x404060, 0.6))
    const sun = new THREE.DirectionalLight(0xffffff, 0.9)
    sun.position.set(15, 25, 10)
    scene.add(sun)
    const blueRim = new THREE.PointLight(0x3b82f6, 0.7, 60)
    blueRim.position.set(-15, 8, -10)
    scene.add(blueRim)

    // ── Build building ──
    const building = new THREE.Group()
    scene.add(building)

    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a2030, transparent: true, opacity: 0.88 })
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x0e1422, transparent: true, opacity: 0.18, side: THREE.DoubleSide })
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.55 })

    const floorMeshes = []
    FLOOR_NAMES.forEach((name, i) => {
      const y = i * STORY_H
      // Slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(FLOOR_W, FLOOR_H, FLOOR_D), floorMat)
      slab.position.set(0, y, 0)
      slab.userData.floor = name
      building.add(slab)
      floorMeshes.push(slab)

      // Outline
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(FLOOR_W, FLOOR_H, FLOOR_D))
      const line = new THREE.LineSegments(edges, edgeMat)
      line.position.copy(slab.position)
      building.add(line)

      // Translucent walls (just 4 verticals around the floor)
      const wallH = STORY_H - FLOOR_H
      const wallY = y + STORY_H / 2
      // front + back
      ;[-FLOOR_D / 2, FLOOR_D / 2].forEach((z) => {
        const w1 = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W, wallH), wallMat)
        w1.position.set(0, wallY, z)
        if (z > 0) w1.rotation.y = Math.PI
        building.add(w1)
      })
      // left + right
      ;[-FLOOR_W / 2, FLOOR_W / 2].forEach((x) => {
        const w1 = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_D, wallH), wallMat)
        w1.position.set(x, wallY, 0)
        w1.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2
        building.add(w1)
      })

      // Floor label sprite
      const label = makeLabel(name)
      label.position.set(-FLOOR_W / 2 - 1.5, y + 0.4, FLOOR_D / 2 + 0.3)
      building.add(label)
    })

    // Center building
    building.position.y = -STORY_H * 1.5

    // ── Persons ──
    const persons = []
    const personGeo = new THREE.SphereGeometry(0.18, 8, 8)

    FLOOR_NAMES.forEach((floor, i) => {
      const occ = FLOOR_OCCUPANCY[floor] ?? 10
      // Cap to 30 persons per floor for perf
      const count = Math.min(30, occ)
      for (let k = 0; k < count; k++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x60a5fa })
        const m = new THREE.Mesh(personGeo, mat)
        const x = (Math.random() - 0.5) * (FLOOR_W - 1.5)
        const z = (Math.random() - 0.5) * (FLOOR_D - 1.5)
        const y = i * STORY_H + FLOOR_H / 2 + 0.25
        m.position.set(x, y, z)
        m.userData = { floor, baseX: x, baseZ: z, vx: 0, vz: 0, isStaff: false }
        building.add(m)
        persons.push(m)
      }
      // 2 staff per floor (red dots)
      for (let s = 0; s < 2; s++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0xef4444 })
        const m = new THREE.Mesh(personGeo, mat)
        const x = (Math.random() - 0.5) * (FLOOR_W - 2)
        const z = (Math.random() - 0.5) * (FLOOR_D - 2)
        const y = i * STORY_H + FLOOR_H / 2 + 0.25
        m.position.set(x, y, z)
        m.userData = { floor, baseX: x, baseZ: z, vx: 0, vz: 0, isStaff: true }
        building.add(m)
        persons.push(m)
      }
    })
    personsRef.current = persons

    // ── Fire particles (initially hidden) ──
    const fireGeo = new THREE.BufferGeometry()
    const fireCount = 80
    const positions = new Float32Array(fireCount * 3)
    fireGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const fireMat = new THREE.PointsMaterial({
      color: 0xff5500,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const fire = new THREE.Points(fireGeo, fireMat)
    fire.visible = false
    fire.userData = { count: fireCount, ages: new Float32Array(fireCount) }
    building.add(fire)
    fireRef.current = fire

    // Fire glow light
    const fireLight = new THREE.PointLight(0xff4500, 0, 18)
    fireLight.position.set(0, 0, 0)
    building.add(fireLight)
    fireRef.current.light = fireLight

    // ── Evac tube (downward path) ──
    const tubes = []
    const tubeGeo = new THREE.CylinderGeometry(0.12, 0.12, STORY_H, 6, 1, true)
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
    })
    for (let i = 0; i < FLOOR_NAMES.length - 1; i++) {
      const t = new THREE.Mesh(tubeGeo, tubeMat)
      t.position.set(-FLOOR_W / 2 + 1.2, i * STORY_H + STORY_H / 2, -FLOOR_D / 2 + 1)
      t.visible = false
      building.add(t)
      tubes.push(t)
    }
    evacTubesRef.current = tubes

    // ── Resize ──
    const onResize = () => {
      const wW = mount.clientWidth
      const hH = mount.clientHeight
      camera.aspect = wW / hH
      camera.updateProjectionMatrix()
      renderer.setSize(wW, hH)
    }
    window.addEventListener('resize', onResize)

    // ── Mouse interaction (orbit) ──
    const onMouseDown = (e) => { dragRef.current.down = true; dragRef.current.x = e.clientX; dragRef.current.y = e.clientY }
    const onMouseUp   = () => { dragRef.current.down = false }
    const onMouseMove = (e) => {
      if (!dragRef.current.down) return
      const dx = e.clientX - dragRef.current.x
      const dy = e.clientY - dragRef.current.y
      dragRef.current.x = e.clientX
      dragRef.current.y = e.clientY
      dragRef.current.rotY += dx * 0.01
      dragRef.current.rotX = Math.max(0.1, Math.min(1.2, dragRef.current.rotX + dy * 0.005))
    }
    renderer.domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)

    // ── Animate ──
    const clock = new THREE.Clock()
    const animate = () => {
      const dt = clock.getDelta()
      const t = clock.getElapsedTime()
      const { crisisFloor, evacuationActive, severityScore, activeFloor } = stateRef.current

      // Camera orbit follows drag
      const r = 32
      camera.position.x = Math.cos(dragRef.current.rotY) * r * Math.cos(dragRef.current.rotX)
      camera.position.z = Math.sin(dragRef.current.rotY) * r * Math.cos(dragRef.current.rotX)
      camera.position.y = 8 + Math.sin(dragRef.current.rotX) * r * 0.7
      camera.lookAt(0, 4, 0)

      // Highlight active floor
      floorMeshes.forEach((slab) => {
        const isActive = slab.userData.floor === activeFloor
        const isCrisis = slab.userData.floor === crisisFloor
        if (isCrisis) {
          slab.material.color.lerp(new THREE.Color(0xef4444), 0.05)
          slab.material.opacity = 0.95
        } else if (isActive) {
          slab.material.color.lerp(new THREE.Color(0x1e3a5f), 0.05)
          slab.material.opacity = 0.92
        } else {
          slab.material.color.lerp(new THREE.Color(0x1a2030), 0.05)
          slab.material.opacity = 0.85
        }
      })

      // Fire particles
      if (crisisFloor) {
        const idx = FLOOR_NAMES.indexOf(crisisFloor)
        if (idx >= 0) {
          fire.visible = true
          const baseY = idx * STORY_H + FLOOR_H / 2 + 0.2
          fire.position.set(FLOOR_W * 0.3, 0, -FLOOR_D * 0.25)
          const pos = fire.geometry.attributes.position.array
          const ages = fire.userData.ages
          for (let i = 0; i < fire.userData.count; i++) {
            ages[i] -= dt
            if (ages[i] <= 0) {
              ages[i] = 0.5 + Math.random() * 1.0
              pos[i * 3]     = (Math.random() - 0.5) * 1.5
              pos[i * 3 + 1] = baseY
              pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5
            } else {
              pos[i * 3 + 1] += dt * (0.6 + Math.random() * 0.4)
              pos[i * 3]     += (Math.random() - 0.5) * 0.04
              pos[i * 3 + 2] += (Math.random() - 0.5) * 0.04
            }
          }
          fire.geometry.attributes.position.needsUpdate = true
          fire.userData.light.position.set(FLOOR_W * 0.3, baseY + 1, -FLOOR_D * 0.25)
          fire.userData.light.intensity = 1.5 + Math.sin(t * 12) * 0.5
        }
      } else {
        fire.visible = false
        fire.userData.light.intensity = 0
      }

      // Evac tubes pulse when evacuation active
      tubes.forEach((tb, i) => {
        tb.visible = evacuationActive
        if (evacuationActive) {
          tb.material.opacity = 0.25 + 0.25 * Math.sin(t * 3 + i * 0.7)
        }
      })

      // Persons: random walk; if crisis on their floor, drift toward stairwell (low x, low z)
      personsRef.current.forEach((p) => {
        const fIdx = FLOOR_NAMES.indexOf(p.userData.floor)
        const inCrisis = p.userData.floor === crisisFloor || (evacuationActive && fIdx <= FLOOR_NAMES.indexOf(crisisFloor || 'Floor 3'))
        const targetX = inCrisis ? -FLOOR_W / 2 + 1.2 : p.userData.baseX
        const targetZ = inCrisis ? -FLOOR_D / 2 + 1.2 : p.userData.baseZ
        p.position.x += (targetX - p.position.x) * (inCrisis ? 0.012 : 0.003) + (Math.random() - 0.5) * 0.02
        p.position.z += (targetZ - p.position.z) * (inCrisis ? 0.012 : 0.003) + (Math.random() - 0.5) * 0.02

        if (inCrisis && !p.userData.isStaff) {
          p.material.color.lerp(new THREE.Color(0xfbbf24), 0.02)
        } else if (p.userData.isStaff) {
          p.material.color.set(0xef4444)
        } else {
          p.material.color.lerp(new THREE.Color(0x60a5fa), 0.02)
        }
      })

      renderer.render(scene, camera)
      animRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 border border-white/10 text-[9px] uppercase tracking-widest text-text-secondary font-mono">
        3D · Drag to orbit
      </div>
      {crisisFloor && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-accent-red/20 border border-accent-red/40 text-[10px] uppercase tracking-widest text-accent-red font-mono">
          ▲ Crisis on {crisisFloor}
        </div>
      )}
    </div>
  )
}

/* ── Helper: text label as canvas sprite ──────────────────── */
function makeLabel(text) {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 64
  const ctx = canvas.getContext('2d')
  ctx.font = 'bold 28px monospace'
  ctx.fillStyle = '#94a3b8'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 4, 32)
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(2.4, 0.6, 1)
  return sprite
}
