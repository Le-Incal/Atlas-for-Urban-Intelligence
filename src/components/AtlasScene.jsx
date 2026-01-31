import React, { Suspense, useRef, useEffect, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import GraphCanvas from './GraphCanvas'
import LegendPanel from './LegendPanel'
import NodeDetailPanel from './NodeDetailPanel'
import useGraphStore from '../stores/graphStore'

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

  const handleBack = () => {
    resetFilters()
    setCurrentView('landing')
  }

  return (
    <button
      onClick={handleBack}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-center cursor-pointer
                 hover:opacity-70 transition-opacity duration-200"
    >
      <h1 className="text-sm font-medium text-gray-900 tracking-wide">
        Atlas for Urban Intelligence
      </h1>
      <p className="text-xs text-gray-400 font-mono mt-1">
        Epistemic Knowledge Graph
      </p>
    </button>
  )
}

function CursorTooltip() {
  const hoveredNode = useGraphStore((state) => state.hoveredNode)
  const mousePosition = useGraphStore((state) => state.mousePosition)

  if (!hoveredNode) return null

  return (
    <div
      className="fixed z-[100] pointer-events-none"
      style={{
        left: mousePosition.x + 10,
        top: mousePosition.y - 6,
      }}
    >
      <div className="whitespace-nowrap px-1 py-0.5 rounded text-[8px] font-medium
                      bg-gray-900/90 text-white">
        {hoveredNode.label}
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

  const handleWheel = useCallback((event) => {
    if (!controlsRef.current) return
    event.preventDefault()

    const rotateSpeed = 0.005
    const zoomSpeed = 0.01

    // Get current spherical coordinates
    const offset = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target)
    const spherical = new THREE.Spherical().setFromVector3(offset)

    // Always apply horizontal rotation from deltaX
    spherical.theta -= event.deltaX * rotateSpeed

    // If pinching (ctrlKey), deltaY is zoom; otherwise it's vertical rotation
    if (event.ctrlKey) {
      // Pinch zoom
      const delta = event.deltaY * zoomSpeed
      const newRadius = spherical.radius * (1 + delta)
      // Clamp distance
      if (newRadius >= 30 && newRadius <= 300) {
        spherical.radius = newRadius
      }
    } else {
      // Vertical rotation
      spherical.phi -= event.deltaY * rotateSpeed
    }

    // Clamp phi to prevent flipping
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

    // Convert back to Cartesian and apply
    offset.setFromSpherical(spherical)
    camera.position.copy(controlsRef.current.target).add(offset)
    camera.lookAt(controlsRef.current.target)

    controlsRef.current.update()
  }, [camera, controlsRef])

  useEffect(() => {
    const domElement = gl.domElement
    domElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => domElement.removeEventListener('wheel', handleWheel)
  }, [gl, handleWheel])

  return null
}

function SceneContent({ controlsRef }) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 160]}
        fov={50}
        near={0.1}
        far={1000}
      />

      {/* Lighting - top right to bottom left */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[100, 50, 80]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-60, -30, -40]} intensity={0.6} color="#ffffff" />
      <directionalLight position={[-40, 20, 60]} intensity={0.4} color="#ffffff" />

      {/* Controls - click+drag to rotate, right-click to pan */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan={true}
        enableZoom={false}
        enableRotate={true}
        minDistance={30}
        maxDistance={300}
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
      <AutoRotate controlsRef={controlsRef} />

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

  return (
    <div className="absolute inset-0 w-full h-full min-h-screen relative bg-white">
      {/* 3D Canvas - explicit size so it has dimensions when view switches */}
      <div className="absolute inset-0 w-full h-full">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance'
            }}
            dpr={[1, 2]}
            style={{ background: '#FFFFFF', width: '100%', height: '100%', display: 'block' }}
            onPointerMissed={() => setSelectedNode(null)}
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
    </div>
  )
}

export default AtlasScene
