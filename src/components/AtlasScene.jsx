import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
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

function BackButton() {
  const setCurrentView = useGraphStore((state) => state.setCurrentView)
  const resetFilters = useGraphStore((state) => state.resetFilters)

  const handleBack = () => {
    resetFilters()
    setCurrentView('landing')
  }

  return (
    <button
      onClick={handleBack}
      className="fixed top-6 left-6 z-50 glass-panel px-4 py-2 rounded-full
                 flex items-center gap-2 text-sm font-medium text-gray-700
                 hover:bg-white/90 transition-all duration-200"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  )
}

function Title() {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none">
      <h1 className="text-sm font-medium text-gray-900 tracking-wide">
        Atlas for Urban Intelligence
      </h1>
      <p className="text-xs text-gray-400 font-mono mt-1">
        Epistemic Knowledge Graph
      </p>
    </div>
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

function AtlasScene() {
  const selectedNode = useGraphStore((state) => state.selectedNode)

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
          <PerspectiveCamera 
            makeDefault 
            position={[0, 0, 150]} 
            fov={50}
            near={0.1}
            far={1000}
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={0.5} />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
          
          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={30}
            maxDistance={300}
            dampingFactor={0.05}
            enableDamping={true}
          />
          
          {/* Graph */}
          <GraphCanvas />
        </Canvas>
      </Suspense>

      {/* UI Overlays */}
      <BackButton />
      <Title />
      <LegendPanel />
      {selectedNode && <NodeDetailPanel />}
      <Instructions />
    </div>
  )
}

export default AtlasScene
