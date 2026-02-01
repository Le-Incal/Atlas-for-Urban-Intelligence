import React, { useState, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGraphStore from '../stores/graphStore'

const LAYERS = [
  { id: 6, name: 'Governance', color: '#D49174', shortName: 'L6' },
  { id: 5, name: 'Socio-Economic', color: '#6ECBB1', shortName: 'L5' },
  { id: 4, name: 'Agentic Intelligence', color: '#BF7BE6', shortName: 'L4' },
  { id: 3, name: 'Logic/Knowledge', color: '#68D3F0', shortName: 'L3' },
  { id: 2, name: 'Cyber-Physical', color: '#C1ED93', shortName: 'L2' },
  { id: 1, name: 'Observable Reality', color: '#9DACB3', shortName: 'L1' },
  { id: 0, name: 'Bio-Physical', color: '#8B8682', shortName: 'L0' },
]

const EDGE_TYPES = [
  { id: 'E', name: 'Energy', description: 'Metabolic Load / Joules' },
  { id: 'M', name: 'Memory', description: 'Historical Weight / Trauma' },
  { id: 'D', name: 'Data', description: 'Information / Telemetry' },
  { id: 'C', name: 'Constraint', description: 'Regulatory Limit / Geometry' },
  { id: 'I', name: 'Intent', description: 'Goal / Bias / Will' },
  { id: 'V', name: 'Validation', description: 'Truth / Confidence' },
  { id: 'R', name: 'Reasoning', description: 'Intelligence-as-Infrastructure' },
]

function LegendPanel() {
  const visibleLayers = useGraphStore((state) => state.visibleLayers)
  const toggleLayer = useGraphStore((state) => state.toggleLayer)
  const activeEdgeType = useGraphStore((state) => state.activeEdgeType)
  const setActiveEdgeType = useGraphStore((state) => state.setActiveEdgeType)
  const activeClusterKey = useGraphStore((state) => state.activeClusterKey)
  const clearActiveClusterKey = useGraphStore((state) => state.clearActiveClusterKey)
  const clearNodeOverrides = useGraphStore((state) => state.clearNodeOverrides)
  const loadDefaultLayout = useGraphStore((state) => state.loadDefaultLayout)
  const currentLayoutPositions = useGraphStore((state) => state.currentLayoutPositions)
  const autoRotateEnabled = useGraphStore((state) => state.autoRotateEnabled)
  const toggleAutoRotate = useGraphStore((state) => state.toggleAutoRotate)

  const [saveError, setSaveError] = useState(null)
  const STORAGE_KEY = 'atlas-layout'

  return (
    <motion.div
      className="fixed right-6 top-32 z-50
                 glass-panel rounded-2xl p-4 w-56"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Layers Section */}
      <div className="mb-4">
        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
          Layers
        </h3>
        <div className="space-y-0.5">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => startTransition(() => toggleLayer(layer.id))}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                         transition-all duration-200 text-left
                         ${visibleLayers[layer.id]
                           ? 'bg-gray-50 hover:bg-gray-100'
                           : 'opacity-40 hover:opacity-60'}`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform duration-200
                           ${visibleLayers[layer.id] ? 'scale-100' : 'scale-75'}`}
                style={{ backgroundColor: layer.color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-gray-700 block truncate">
                  {layer.name}
                </span>
              </div>
              <span className="text-[9px] font-mono text-gray-400">
                {layer.shortName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 mb-4" />

      {/* Edge Types Section */}
      <div className="mb-4">
        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
          Edge Types
        </h3>
        <div className="space-y-0.5">
          {EDGE_TYPES.map((edgeType) => (
            <button
              key={edgeType.id}
              onClick={() => setActiveEdgeType(edgeType.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                         transition-all duration-200 text-left
                         ${activeEdgeType === edgeType.id
                           ? 'bg-gray-900 text-white'
                           : 'hover:bg-gray-50'}`}
            >
              <div
                className={`w-5 h-px flex-shrink-0 transition-all duration-200
                           ${activeEdgeType === edgeType.id
                             ? 'bg-white h-0.5'
                             : 'bg-gray-400'}`}
              />
              <div className="flex-1 min-w-0">
                <span className={`text-[11px] font-medium block truncate
                               ${activeEdgeType === edgeType.id
                                 ? 'text-white'
                                 : 'text-gray-700'}`}>
                  {edgeType.name}
                </span>
              </div>
              <span className={`text-[9px] font-mono
                             ${activeEdgeType === edgeType.id
                               ? 'text-gray-300'
                               : 'text-gray-400'}`}>
                {edgeType.id}
              </span>
            </button>
          ))}
        </div>

        {/* Active edge type description */}
        <AnimatePresence>
          {activeEdgeType && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 overflow-hidden"
            >
              <p className="text-[9px] text-gray-500 px-2 py-1.5 bg-gray-50 rounded-lg">
                {EDGE_TYPES.find(e => e.id === activeEdgeType)?.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 mb-4" />

      {/* Layout Section */}
      <div>
        {/* Auto-rotate toggle */}
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-[10px] font-medium text-gray-500">Auto-rotate</span>
          <button
            onClick={toggleAutoRotate}
            className={`w-7 h-3.5 rounded-full transition-colors relative
                        ${autoRotateEnabled ? 'bg-gray-700' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform
                            ${autoRotateEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {activeClusterKey && (
          <div className="mb-2 px-2 py-1.5 bg-gray-50 rounded-lg flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-mono text-gray-400 uppercase">Cluster</p>
              <p className="text-[10px] text-gray-700 truncate">{activeClusterKey}</p>
            </div>
            <button
              onClick={clearActiveClusterKey}
              className="text-[9px] font-mono text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        )}

        {/* Stacked Reset/Save buttons */}
        <div className="space-y-1.5">
          <button
            onClick={() => {
              setSaveError(null)
              try {
                localStorage.removeItem(STORAGE_KEY)
              } catch {}
              clearNodeOverrides()
              loadDefaultLayout()
            }}
            className="w-full px-2 py-1.5 rounded-lg bg-gray-50 text-left text-[10px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Reset Layout
          </button>
          <button
            onClick={() => {
              setSaveError(null)
              if (!currentLayoutPositions) {
                setSaveError('Layout not ready yet.')
                return
              }
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(currentLayoutPositions))
              } catch (e) {
                setSaveError(e?.message || 'Save failed.')
              }
            }}
            className="w-full px-2 py-1.5 rounded-lg bg-gray-50 text-left text-[10px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Save Layout
          </button>
        </div>

        {saveError && (
          <p className="mt-1 text-[9px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
            {saveError}
          </p>
        )}

        {/* Reset filters link */}
        <button
          onClick={() => startTransition(() => {
            setActiveEdgeType(null)
            clearActiveClusterKey()
            clearNodeOverrides()
            LAYERS.forEach(l => {
              if (!visibleLayers[l.id]) toggleLayer(l.id)
            })
          })}
          className="w-full mt-2 py-1 text-[10px] text-gray-400 hover:text-gray-600
                     transition-colors duration-200"
        >
          Reset all filters
        </button>
      </div>
    </motion.div>
  )
}

export default LegendPanel
