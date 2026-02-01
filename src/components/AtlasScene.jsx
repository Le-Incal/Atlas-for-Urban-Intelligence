import React, { Suspense, useRef, useEffect, useCallback, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import GraphCanvas from './GraphCanvas'
import LegendPanel from './LegendPanel'
import NodeDetailPanel from './NodeDetailPanel'
import ViewToggle from './ViewToggle'
import useGraphStore from '../stores/graphStore'

// Mobile breakpoint hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-mono">Loading Atlas...</p>
      </div>
    </div>
  )
}

function Title() {
  const setCurrentView = useGraphStore((state) => state.setCurrentView)
  const resetFilters = useGraphStore((state) => state.resetFilters)
  const isMobile = useIsMobile()

  const handleBack = () => {
    resetFilters()
    setCurrentView('landing')
  }

  return (
    <button
      onClick={handleBack}
      className={`fixed z-50 text-center cursor-pointer hover:opacity-70 transition-opacity duration-200
                  ${isMobile ? 'top-4 left-4 text-left' : 'top-6 left-1/2 -translate-x-1/2'}`}
    >
      <h1 className={`font-medium text-gray-900 tracking-wide ${isMobile ? 'text-xs' : 'text-sm'}`}>
        Atlas for Urban Intelligence
      </h1>
      {!isMobile && (
        <p className="text-xs text-gray-400 font-mono mt-1">
          Epistemic Knowledge Graph
        </p>
      )}
    </button>
  )
}

function CursorTooltip() {
  const hoveredNode = useGraphStore((state) => state.hoveredNode)
  const hoveredCluster = useGraphStore((state) => state.hoveredCluster)
  const mousePosition = useGraphStore((state) => state.mousePosition)
  const isMobile = useIsMobile()

  // Don't show hover tooltips on mobile (no cursor)
  if (isMobile) return null
  if (!hoveredNode && !hoveredCluster) return null

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: mousePosition.x + 12,
        top: mousePosition.y + 12,
      }}
    >
      <div className="max-w-[14rem] px-2 py-1.5 rounded-md bg-black text-white shadow-lg">
        {hoveredNode ? (
          <>
            <div className="text-xs font-semibold mb-0.5">
              {hoveredNode.label}
            </div>
            {hoveredNode.description && (
              <div className="text-[10px] text-gray-300 leading-snug">
                {hoveredNode.description}
              </div>
            )}
          </>
        ) : hoveredCluster ? (
          <>
            <div className="text-xs font-semibold mb-0.5">
              {hoveredCluster.key}
            </div>
            <div className="text-[10px] text-gray-300">
              {hoveredCluster.count} nodes
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

// Continuous slow auto-rotate
function AutoRotate({ controlsRef }) {
  const { camera } = useThree()

  useFrame(() => {
    if (!controlsRef.current) return

    // Slow rotation from right to left (positive theta)
    const rotateSpeed = 0.0008

    const offset = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)

    spherical.theta += rotateSpeed

    offset.setFromSpherical(spherical)
    camera.position.copy(controlsRef.current.target).add(offset)
    camera.lookAt(controlsRef.current.target)

    controlsRef.current.update()
  })

  return null
}

// Custom trackpad handler for two-finger rotate + pinch zoom (simultaneous)
function TrackpadControls({ controlsRef }) {
  const { camera, gl } = useThree()
  const lastPointerRef = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback((event) => {
    if (!controlsRef.current) return
    // Skip when orbit controls disabled (cluster/node drag in progress) - prevents zoom/rotate fighting with drag
    if (!controlsRef.current.enabled) return
    event.preventDefault()

    const rotateSpeed = 0.005
    const zoomSpeed = 0.01
    const mouseWheelZoomSpeed = 0.001

    // Get current spherical coordinates
    const offset = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)

    // Detect if this is a regular mouse wheel (no horizontal component) vs trackpad
    const isMouseWheel = Math.abs(event.deltaX) < 1 && !event.ctrlKey

    // Helper function for zoom-to-cursor
    const zoomToCursor = (delta, speed) => {
      const oldRadius = spherical.radius
      const newRadius = oldRadius * (1 + delta * speed)

      // Clamp distance (match OrbitControls)
      if (newRadius >= 40 && newRadius <= 1200) {
        // Zoom-to-cursor: move target toward the point under the pointer
        const dom = gl.domElement
        const rect = dom.getBoundingClientRect()
        const px = lastPointerRef.current.x
        const py = lastPointerRef.current.y
        const ndc = new THREE.Vector2(
          ((px - rect.left) / rect.width) * 2 - 1,
          -(((py - rect.top) / rect.height) * 2 - 1)
        )

        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(ndc, camera)

        const target = controlsRef.current.target
        const planeNormal = new THREE.Vector3().subVectors(camera.position, target).normalize()
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, target)
        const hit = new THREE.Vector3()

        if (raycaster.ray.intersectPlane(plane, hit)) {
          const zoomFactor = newRadius / oldRadius
          const t = 1 - zoomFactor
          target.lerp(hit, Math.max(0, Math.min(1, t)))
        }

        spherical.radius = newRadius
      }
    }

    if (isMouseWheel) {
      // Regular mouse wheel: zoom toward cursor
      zoomToCursor(event.deltaY, mouseWheelZoomSpeed)
    } else if (event.ctrlKey) {
      // Trackpad pinch zoom
      zoomToCursor(event.deltaY, zoomSpeed)
    } else {
      // Trackpad two-finger scroll: rotate
      spherical.theta -= event.deltaX * rotateSpeed
      spherical.phi -= event.deltaY * rotateSpeed
    }

    // Clamp phi to prevent flipping
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

    // Convert back to Cartesian and apply
    offset.setFromSpherical(spherical)
    camera.position.copy(controlsRef.current.target).add(offset)
    camera.lookAt(controlsRef.current.target)

    controlsRef.current.update()
  }, [camera, controlsRef, gl])

  useEffect(() => {
    const domElement = gl.domElement
    const handlePointerMove = (e) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
    }
    domElement.addEventListener('pointermove', handlePointerMove, { passive: true })
    domElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      domElement.removeEventListener('pointermove', handlePointerMove)
      domElement.removeEventListener('wheel', handleWheel)
    }
  }, [gl, handleWheel])

  return null
}

function SceneContent({ controlsRef }) {
  const autoRotateEnabled = useGraphStore((state) => state.autoRotateEnabled)

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[320, 200, 320]}
        fov={50}
        near={0.1}
        far={2000}
      />

      {/* Depth fog - softer falloff to reduce distant fuzz */}
      <fog attach="fog" args={['#ffffff', 500, 1800]} />

      {/* Lighting - low ambient + strong directional for 3D sphere definition */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[150, 120, 100]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-100, 60, -80]} intensity={1} color="#ffffff" />
      <directionalLight position={[-50, 30, 80]} intensity={0.6} color="#ffffff" />

      {/* Controls - click+drag to rotate, right-click to pan */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={40}
        maxDistance={1200}
        dampingFactor={0.08}
        enableDamping={true}
        rotateSpeed={1}
        panSpeed={1}
        screenSpacePanning={true}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
      />

      {/* Continuous slow auto-rotate */}
      {autoRotateEnabled && <AutoRotate controlsRef={controlsRef} />}

      {/* Custom trackpad: two-finger drag = rotate, pinch = zoom */}
      <TrackpadControls controlsRef={controlsRef} />

      {/* Graph */}
      <GraphCanvas />
    </>
  )
}

function AtlasScene() {
  const controlsRef = useRef()
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode)
  const setActiveEdgeType = useGraphStore((state) => state.setActiveEdgeType)
  const clearActiveClusterKey = useGraphStore((state) => state.clearActiveClusterKey)
  const setCurrentView = useGraphStore((state) => state.setCurrentView)
  const setControlsRef = useGraphStore((state) => state.setControlsRef)
  const setNodeOverrides = useGraphStore((state) => state.setNodeOverrides)

  useEffect(() => {
    setControlsRef(controlsRef)
    return () => setControlsRef(null)
  }, [setControlsRef])

  // Load persisted layout: prefer user's localStorage, else server default
  const clearClusterOffsets = useGraphStore((state) => state.clearClusterOffsets)
  useEffect(() => {
    const STORAGE_KEY = 'atlas-layout'
    const parseAndApply = (data) => {
      let positions = null
      if (data && typeof data === 'object') {
        if (data.positions && typeof data.positions === 'object') {
          positions = data.positions
        } else if (!Array.isArray(data) && !data.version) {
          positions = data
        }
      }
      if (positions && typeof positions === 'object') {
        clearClusterOffsets()
        setNodeOverrides(positions)
        return true
      }
      return false
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parseAndApply(parsed)) return
      }
    } catch {
      // ignore invalid or missing localStorage
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/layout')
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) parseAndApply(data)
      } catch {
        // ignore (no backend in dev or first run)
      }
    })()
    return () => { cancelled = true }
  }, [setNodeOverrides, clearClusterOffsets])

  return (
    <div className="absolute inset-0 w-full h-full min-h-screen relative bg-white">
      {/* 3D Canvas - explicit size so it has dimensions when view switches */}
      <div className="absolute inset-0 w-full h-full">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              stencil: false,
              depth: true
            }}
            dpr={[1, 2]}
            style={{ background: '#FFFFFF', width: '100%', height: '100%', display: 'block' }}
            onPointerMissed={() => {
              setSelectedNode(null)
              setActiveEdgeType(null)
              clearActiveClusterKey()
            }}
          >
            <SceneContent controlsRef={controlsRef} />
          </Canvas>
        </Suspense>
      </div>

      {/* UI Overlays */}
      <Title />
      <LegendPanel />
      <NodeDetailPanel />
      <CursorTooltip />
      <ViewToggle />
    </div>
  )
}

export default AtlasScene
