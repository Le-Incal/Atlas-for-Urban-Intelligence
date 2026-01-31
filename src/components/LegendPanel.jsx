import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGraphStore from '../stores/graphStore'

const LAYERS = [
  { id: 0, name: 'Bio-Physical', color: '#5D554C', shortName: 'L0' },
  { id: 1, name: 'Observable Reality', color: '#4A5A63', shortName: 'L1' },
  { id: 2, name: 'Cyber-Physical', color: '#4F7A74', shortName: 'L2' },
  { id: 3, name: 'Logic/Knowledge', color: '#5A658C', shortName: 'L3' },
  { id: 4, name: 'Agentic Intelligence', color: '#8B6A9E', shortName: 'L4' },
  { id: 5, name: 'Socio-Economic', color: '#9C615F', shortName: 'L5' },
  { id: 6, name: 'Governance', color: '#B89A5A', shortName: 'L6' },
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

  return (
    <motion.div
      className="fixed right-6 top-32 z-50
                 glass-panel rounded-2xl p-4 w-56"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* Layers Section */}
      <div className="mb-6">
        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
          Layers
        </h3>
        <div className="space-y-1">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg
                         transition-all duration-200 text-left
                         ${visibleLayers[layer.id] 
                           ? 'bg-gray-50 hover:bg-gray-100' 
                           : 'opacity-40 hover:opacity-60'}`}
            >
              <div 
                className={`w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-200
                           ${visibleLayers[layer.id] ? 'scale-100' : 'scale-75'}`}
                style={{ backgroundColor: layer.color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-700 block truncate">
                  {layer.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                {layer.shortName}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 mb-6" />

      {/* Edge Types Section */}
      <div>
        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
          Edge Types
        </h3>
        <div className="space-y-1">
          {EDGE_TYPES.map((edgeType) => (
            <button
              key={edgeType.id}
              onClick={() => setActiveEdgeType(edgeType.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg
                         transition-all duration-200 text-left
                         ${activeEdgeType === edgeType.id 
                           ? 'bg-gray-900 text-white' 
                           : 'hover:bg-gray-50'}`}
            >
              <div 
                className={`w-6 h-px flex-shrink-0 transition-all duration-200
                           ${activeEdgeType === edgeType.id 
                             ? 'bg-white h-0.5' 
                             : 'bg-gray-400'}`}
              />
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium block truncate
                               ${activeEdgeType === edgeType.id 
                                 ? 'text-white' 
                                 : 'text-gray-700'}`}>
                  {edgeType.name}
                </span>
              </div>
              <span className={`text-[10px] font-mono
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
              className="mt-3 overflow-hidden"
            >
              <p className="text-[10px] text-gray-500 px-3 py-2 bg-gray-50 rounded-lg">
                {EDGE_TYPES.find(e => e.id === activeEdgeType)?.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          setActiveEdgeType(null)
          LAYERS.forEach(l => {
            if (!visibleLayers[l.id]) toggleLayer(l.id)
          })
        }}
        className="w-full mt-4 py-2 text-xs text-gray-400 hover:text-gray-600 
                   transition-colors duration-200"
      >
        Reset filters
      </button>
    </motion.div>
  )
}

export default LegendPanel
