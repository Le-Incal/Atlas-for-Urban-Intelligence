import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGraphStore from '../stores/graphStore'
import nodesData from '../data/nodes.json'
import edgesData from '../data/edges.json'

const LAYER_COLORS = {
  0: '#8B8682',
  1: '#9DACB3',
  2: '#C1ED93',
  3: '#68D3F0',
  4: '#BF7BE6',
  5: '#6ECBB1',
  6: '#D49174',
}

const LAYER_NAMES = {
  0: 'Bio-Physical Foundation',
  1: 'Observable Reality',
  2: 'Cyber-Physical Systems',
  3: 'Logic & Knowledge',
  4: 'Agentic Intelligence',
  5: 'Socio-Economic Memory',
  6: 'Governance',
}

const LAYER_DESCRIPTIONS = {
  0: 'The foundational geological, hydrological, and atmospheric systems that underpin all urban form. These elements determine what can be built and where.',
  1: 'The visible, measurable phenomena of the city - parcels, buildings, streets, vegetation, and human activity patterns that can be directly observed.',
  2: 'The technical infrastructure connecting physical and digital realms - sensors, networks, IoT devices, and the systems that monitor and control urban operations.',
  3: 'The regulatory frameworks, zoning codes, design standards, and knowledge systems that encode urban rules and constraints.',
  4: 'AI agents, machine learning systems, and automated decision-makers that process information and take actions within the urban system.',
  5: 'The economic forces, market dynamics, demographic patterns, and social memory that shape urban development over time.',
  6: 'The legal frameworks, planning authorities, policy instruments, and governance structures that direct urban transformation.',
}

const EDGE_TYPE_NAMES = {
  E: 'Energy',
  M: 'Memory',
  D: 'Data',
  C: 'Constraint',
  I: 'Intent',
  V: 'Validation',
  R: 'Reasoning',
}

function LayerSection({ layer, nodes, edges, isExpanded, onToggle }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set())
  const layerNodes = nodes.filter(n => n.layer === layer)
  const nodeIds = new Set(layerNodes.map(n => n.id))

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // Calculate layer-level edge stats
  const incomingEdges = edges.filter(e => nodeIds.has(e.target) && !nodeIds.has(e.source))
  const outgoingEdges = edges.filter(e => nodeIds.has(e.source) && !nodeIds.has(e.target))
  const internalEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))

  // Group edges by type
  const groupByType = (edgeList) => {
    const counts = {}
    edgeList.forEach(e => {
      counts[e.edgeType] = (counts[e.edgeType] || 0) + 1
    })
    return counts
  }

  const incomingByType = groupByType(incomingEdges)
  const outgoingByType = groupByType(outgoingEdges)

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Layer Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Expand/Collapse Icon */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Layer Color Dot */}
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: LAYER_COLORS[layer] }}
        />

        {/* Layer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-900">
              L{layer}: {LAYER_NAMES[layer]}
            </span>
            <span className="text-xs text-gray-400">
              {layerNodes.length} nodes
            </span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            <span className="text-green-600">{incomingEdges.length} in</span>
            {' · '}
            <span className="text-blue-600">{outgoingEdges.length} out</span>
            {' · '}
            <span>{internalEdges.length} internal</span>
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              {/* Layer Description */}
              <div className="mb-4 pl-8">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {LAYER_DESCRIPTIONS[layer]}
                </p>
              </div>

              {/* Edge Summary */}
              <div className="mb-4 pl-8 flex gap-6 text-xs">
                <div>
                  <span className="text-gray-400">Inputs: </span>
                  {Object.entries(incomingByType).map(([type, count], i) => (
                    <span key={type} className="text-gray-600">
                      {i > 0 && ', '}
                      <span className="font-mono">{type}</span>:{count}
                    </span>
                  ))}
                  {Object.keys(incomingByType).length === 0 && <span className="text-gray-400">none</span>}
                </div>
                <div>
                  <span className="text-gray-400">Outputs: </span>
                  {Object.entries(outgoingByType).map(([type, count], i) => (
                    <span key={type} className="text-gray-600">
                      {i > 0 && ', '}
                      <span className="font-mono">{type}</span>:{count}
                    </span>
                  ))}
                  {Object.keys(outgoingByType).length === 0 && <span className="text-gray-400">none</span>}
                </div>
              </div>

              {/* Nodes List */}
              <div className="pl-8 space-y-2">
                {layerNodes.map(node => (
                  <NodeRow
                    key={node.id}
                    node={node}
                    edges={edges}
                    isExpanded={expandedNodes.has(node.id)}
                    onToggle={() => toggleNode(node.id)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NodeRow({ node, edges, isExpanded, onToggle }) {
  const incomingEdges = edges.filter(e => e.target === node.id)
  const outgoingEdges = edges.filter(e => e.source === node.id)

  // Get unique edge types
  const inTypes = [...new Set(incomingEdges.map(e => e.edgeType))].sort()
  const outTypes = [...new Set(outgoingEdges.map(e => e.edgeType))].sort()

  return (
    <div
      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        {/* Expand/collapse indicator */}
        <svg
          className={`w-3 h-3 text-gray-400 mt-1 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <div
          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
          style={{ backgroundColor: LAYER_COLORS[node.layer] }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-gray-900">
              {node.label}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {node.nodeType}
            </span>
            <div className="flex gap-4 text-[10px] ml-auto">
              <div>
                <span className="text-gray-400">In: </span>
                <span className="text-green-600 font-medium">{incomingEdges.length}</span>
                {inTypes.length > 0 && (
                  <span className="text-gray-400 ml-1">
                    [{inTypes.join(', ')}]
                  </span>
                )}
              </div>
              <div>
                <span className="text-gray-400">Out: </span>
                <span className="text-blue-600 font-medium">{outgoingEdges.length}</span>
                {outTypes.length > 0 && (
                  <span className="text-gray-400 ml-1">
                    [{outTypes.join(', ')}]
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expandable description */}
          <AnimatePresence>
            {isExpanded && node.description && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-gray-500 leading-relaxed mt-2 pt-2 border-t border-gray-200">
                  {node.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function IndexPage() {
  const setCurrentView = useGraphStore((state) => state.setCurrentView)
  const [expandedLayers, setExpandedLayers] = useState(new Set())

  const nodes = Array.isArray(nodesData) ? nodesData : (nodesData?.nodes ?? [])
  const edges = Array.isArray(edgesData) ? edgesData : (edgesData?.edges ?? [])

  const toggleLayer = (layer) => {
    setExpandedLayers(prev => {
      const next = new Set(prev)
      if (next.has(layer)) {
        next.delete(layer)
      } else {
        next.add(layer)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedLayers(new Set([0, 1, 2, 3, 4, 5, 6]))
  }

  const collapseAll = () => {
    setExpandedLayers(new Set())
  }

  return (
    <div className="h-screen overflow-y-auto bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Atlas for Urban Intelligence
              </h1>
              <p className="text-xs text-gray-400 font-mono">
                Layer Index · {nodes.length} nodes · {edges.length} edges
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={expandAll}
                className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Expand all
              </button>
              <span className="text-gray-200">|</span>
              <button
                onClick={collapseAll}
                className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Collapse all
              </button>
              <button
                onClick={() => setCurrentView('atlas')}
                className="ml-4 px-4 py-1.5 rounded-full bg-gray-900 text-white text-xs font-medium
                           hover:bg-gray-800 transition-colors"
              >
                Back to Atlas
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Edge Type Legend */}
      <div className="max-w-4xl mx-auto px-6 py-3 border-b border-gray-50">
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-gray-400 font-medium">Edge Types:</span>
          {Object.entries(EDGE_TYPE_NAMES).map(([code, name]) => (
            <span key={code} className="text-gray-500">
              <span className="font-mono font-medium">{code}</span> = {name}
            </span>
          ))}
        </div>
      </div>

      {/* Layer Sections */}
      <main className="max-w-4xl mx-auto pb-20">
        {[0, 1, 2, 3, 4, 5, 6].map(layer => (
          <LayerSection
            key={layer}
            layer={layer}
            nodes={nodes}
            edges={edges}
            isExpanded={expandedLayers.has(layer)}
            onToggle={() => toggleLayer(layer)}
          />
        ))}
      </main>

      {/* Footer Toggle */}
      <div className="sticky bottom-0 py-4 flex justify-center">
        <button
          onClick={() => setCurrentView('atlas')}
          className="px-5 py-2 rounded-full bg-white/90 backdrop-blur
                     border border-gray-200 shadow-sm
                     text-xs font-medium text-gray-600 hover:bg-white hover:border-gray-300
                     transition-all"
        >
          View Atlas
        </button>
      </div>
    </div>
  )
}

export default IndexPage
