import React, { Suspense, useRef, useCallback } from 'react'
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

function Instructions() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none">
      <p className="text-xs text-gray-400 font-mono">
        Drag to rotate · Scroll to zoom · Click nodes to explore
      </p>
    </div>
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
        left: mousePosition.x + 12,
        top: mousePosition.y - 8,
      }}
    >
      <div className="whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-medium
                      bg-white/95 backdrop-blur-sm shadow-sm border border-gray-200 text-gray-700">
        {hoveredNode.label}
      </div>
    </div>
  )
}

// Custom zoom component that zooms toward mouse position
function ZoomToMouse({ controlsRef, minDistance = 30, maxDistance = 300 }) {
  const { camera, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const zoomTarget = useRef(new THREE.Vector3())

  const handleWheel = useCallback((event) => {
    event.preventDefault()

    if (!controlsRef.current) return

    // Get mouse position in normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect()
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // Cast ray from camera through mouse position
    raycaster.current.setFromCamera(mouse.current, camera)

    // Calculate a point along the ray at a reasonable distance
    const currentDistance = camera.position.length()
    const targetPoint = raycaster.current.ray.at(currentDistance, zoomTarget.current)

    // Zoom factor
    const zoomSpeed = 0.1
    const delta = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed

    // Calculate new camera distance
    const currentCamDistance = camera.position.distanceTo(controlsRef.current.target)
    const newDistance = currentCamDistance * delta

    // Clamp to min/max distance
    if (newDistance < minDistance || newDistance > maxDistance) return

    // Calculate the direction from target point to camera
    const direction = new THREE.Vector3().subVectors(camera.position, targetPoint).normalize()

    // Move camera toward/away from the target point
    const moveAmount = (1 - delta) * currentCamDistance * 0.5
    const offset = new THREE.Vector3().copy(raycaster.current.ray.direction).multiplyScalar(moveAmount)

    camera.position.add(offset)
    controlsRef.current.target.add(offset.multiplyScalar(0.5))

    controlsRef.current.update()
  }, [camera, gl, controlsRef, minDistance, maxDistance])

  // Add wheel event listener
  React.useEffect(() => {
    const domElement = gl.domElement
    domElement.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      domElement.removeEventListener('wheel', handleWheel)
    }
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

      {/* Controls - zoom disabled, handled by ZoomToMouse */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={false}
        enableRotate={true}
        minDistance={30}
        maxDistance={300}
        dampingFactor={0.05}
        enableDamping={true}
      />

      {/* Custom zoom toward mouse */}
      <ZoomToMouse controlsRef={controlsRef} minDistance={30} maxDistance={300} />

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
      <Instructions />
    </div>
  )
}

export default AtlasScene
