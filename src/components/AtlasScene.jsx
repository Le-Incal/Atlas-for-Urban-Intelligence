import React, { Suspense, useRef, useEffect, useCallback, useState } from 'react'
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

// Auto-rotate on load (stops when user interacts)
function AutoRotate({ controlsRef, enabled }) {
  const { camera } = useThree()

  useFrame(() => {
    if (!enabled || !controlsRef.current) return

    // Slow rotation from right to left (positive theta)
    const rotateSpeed = 0.001

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
function TrackpadControls({ controlsRef, onInteraction }) {
  const { camera, gl } = useThree()

  const handleWheel = useCallback((event) => {
    if (!controlsRef.current) return
    event.preventDefault()
    if (onInteraction) onInteraction()

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
  }, [camera, controlsRef, onInteraction])

  useEffect(() => {
    const domElement = gl.domElement
    domElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => domElement.removeEventListener('wheel', handleWheel)
  }, [gl, handleWheel])

  return null
}

function SceneContent({ controlsRef }) {
  const [autoRotate, setAutoRotate] = useState(true)

  const stopAutoRotate = useCallback(() => {
    setAutoRotate(false)
  }, [])

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
        onStart={stopAutoRotate}
      />

      {/* Auto-rotate on load */}
      <AutoRotate controlsRef={controlsRef} enabled={autoRotate} />

      {/* Custom trackpad: two-finger drag = rotate, pinch = zoom */}
      <TrackpadControls controlsRef={controlsRef} onInteraction={stopAutoRotate} />

      {/* Graph */}
      <GraphCanvas />
    </>
  )
}

function AtlasScene() {
  const controlsRef = useRef()

  return (
    <div className="w-full h-full relative bg-white">
      {/* 3D Canvas */}
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          dpr={[1, 2]}
          style={{ background: '#FFFFFF' }}
        >
          <SceneContent controlsRef={controlsRef} />
        </Canvas>
      </Suspense>

      {/* UI Overlays */}
      <Title />
      <LegendPanel />
      <NodeDetailPanel />
      <CursorTooltip />
    </div>
  )
}

export default AtlasScene
