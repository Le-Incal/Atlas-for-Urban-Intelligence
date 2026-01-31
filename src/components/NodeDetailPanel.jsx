import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGraphStore from '../stores/graphStore'
import edgesData from '../data/edges.json'
import nodesData from '../data/nodes.json'

const LAYER_NAMES = {
  0: 'Bio-Physical Foundation',
  1: 'Observable Reality',
  2: 'Cyber-Physical Systems',
  3: 'Logic & Knowledge',
  4: 'Agentic Intelligence',
  5: 'Socio-Economic Memory',
  6: 'Governance',
}

const LAYER_COLORS = {
  0: '#8B8682', // Grey Olive
  1: '#9DACB3', // Cool Steel
  2: '#C1ED93', // Lime Cream
  3: '#68D3F0', // Sky Blue
  4: '#BF7BE6', // Bright Lavender
  5: '#6ECBB1', // Pearl Aqua
  6: '#D49174', // Toasted Almond
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

function WelcomeContent() {
  const nodes = Array.isArray(nodesData) ? nodesData : (nodesData?.nodes ?? [])
  const edges = Array.isArray(edgesData) ? edgesData : (edgesData?.edges ?? [])
  const nodeCount = nodes.length
  const edgeCount = edges.length
  const layerCount = useMemo(
    () => new Set(nodes.map((n) => n.layer)).size,
    [nodes]
  )

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Welcome to the Atlas
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Epistemic Knowledge Graph
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Description */}
        <div className="mb-6">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
            About
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            An interactive exploration of the epistemic architecture that binds
            physical matter to digital intelligence, regulatory constraint to
            social memory, and human intent to synthetic agency.
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
            Navigation
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Drag</span>
              <span>to rotate the view</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Scroll</span>
              <span>to zoom in and out</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Click</span>
              <span>on nodes to explore</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
            Structure
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-lg font-semibold text-gray-900">{nodeCount}</p>
              <p className="text-[10px] text-gray-500 uppercase">Nodes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-lg font-semibold text-gray-900">{edgeCount}</p>
              <p className="text-[10px] text-gray-500 uppercase">Edges</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-lg font-semibold text-gray-900">{layerCount}</p>
              <p className="text-[10px] text-gray-500 uppercase">Layers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-[10px] text-gray-400 text-center font-mono">
          From Parcel to Planet
        </p>
      </div>
    </>
  )
}

function NodeContent({ selectedNode, nodeMap, onClose }) {
  const signalEdge = useGraphStore((state) => state.signalEdge)
  const clearSignaledEdge = useGraphStore((state) => state.clearSignaledEdge)
  const setActiveClusterKey = useGraphStore((state) => state.setActiveClusterKey)
  const edges = Array.isArray(edgesData) ? edgesData : (edgesData?.edges ?? [])

  const handleConnectionHover = (edge) => {
    signalEdge(edge)
  }

  const handleConnectionLeave = () => {
    clearSignaledEdge()
  }

  // Find connected edges
  const connectedEdges = edges.filter(
    edge => edge.source === selectedNode.id || edge.target === selectedNode.id
  )

  // Group by incoming/outgoing
  const incomingEdges = connectedEdges.filter(e => e.target === selectedNode.id)
  const outgoingEdges = connectedEdges.filter(e => e.source === selectedNode.id)

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: LAYER_COLORS[selectedNode.layer] }}
              />
              <span className="text-[10px] font-mono text-gray-400 uppercase">
                Layer {selectedNode.layer}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedNode.label}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {LAYER_NAMES[selectedNode.layer]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* Description */}
        <div className="mb-6">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {selectedNode.description}
          </p>
        </div>

        {/* Node Type */}
        <div className="mb-6">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
            Type
          </h3>
          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
            {selectedNode.nodeType}
          </span>
        </div>

        {/* Clusters */}
        {selectedNode.clusters && selectedNode.clusters.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              Clusters
            </h3>
            <div className="flex flex-wrap gap-1">
              {selectedNode.clusters.map(cluster => (
                <button
                  key={cluster}
                  onClick={() => setActiveClusterKey(cluster)}
                  className="inline-block px-2 py-1 bg-gray-50 border border-gray-200
                             rounded text-[10px] font-mono text-gray-600
                             hover:bg-gray-100 transition-colors"
                >
                  {cluster}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        {connectedEdges.length > 0 && (
          <div>
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
              Connections ({connectedEdges.length})
            </h3>

            {/* Incoming */}
            {incomingEdges.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1 font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  Incoming ({incomingEdges.length})
                </p>
                <div className="space-y-2">
                  {incomingEdges.map(edge => {
                    const sourceNode = nodeMap[edge.source]
                    return (
                      <div
                        key={edge.id}
                        onMouseEnter={() => handleConnectionHover(edge)}
                        onMouseLeave={handleConnectionLeave}
                        className="w-full text-left bg-gray-50 rounded-lg p-2
                                   hover:bg-gray-100 transition-colors cursor-pointer
                                   border border-transparent hover:border-gray-200"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: LAYER_COLORS[sourceNode?.layer] }}
                          />
                          <span className="text-xs font-medium text-gray-700 truncate flex-1">
                            {sourceNode?.label || edge.source}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            L{sourceNode?.layer}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <span className="font-mono bg-gray-200 px-1 rounded">
                            {edge.edgeType}
                          </span>
                          <span>{EDGE_TYPE_NAMES[edge.edgeType]}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-400">this node</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Outgoing */}
            {outgoingEdges.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1 font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  Outgoing ({outgoingEdges.length})
                </p>
                <div className="space-y-2">
                  {outgoingEdges.map(edge => {
                    const targetNode = nodeMap[edge.target]
                    return (
                      <div
                        key={edge.id}
                        onMouseEnter={() => handleConnectionHover(edge)}
                        onMouseLeave={handleConnectionLeave}
                        className="w-full text-left bg-gray-50 rounded-lg p-2
                                   hover:bg-gray-100 transition-colors cursor-pointer
                                   border border-transparent hover:border-gray-200"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: LAYER_COLORS[targetNode?.layer] }}
                          />
                          <span className="text-xs font-medium text-gray-700 truncate flex-1">
                            {targetNode?.label || edge.target}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            L{targetNode?.layer}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <span className="text-gray-400">this node</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-mono bg-gray-200 px-1 rounded">
                            {edge.edgeType}
                          </span>
                          <span>{EDGE_TYPE_NAMES[edge.edgeType]}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-[10px] text-gray-400 text-center font-mono">
          {selectedNode.id}
        </p>
      </div>
    </>
  )
}

function NodeDetailPanel() {
  const selectedNode = useGraphStore((state) => state.selectedNode)
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode)
  const infoPanelOpen = useGraphStore((state) => state.infoPanelOpen)
  const setInfoPanelOpen = useGraphStore((state) => state.setInfoPanelOpen)
  const nodes = Array.isArray(nodesData) ? nodesData : (nodesData?.nodes ?? [])

  // Create node lookup map
  const nodeMap = useMemo(() => {
    const map = {}
    nodes.forEach(node => {
      map[node.id] = node
    })
    return map
  }, [nodes])

  const handleClose = () => {
    setSelectedNode(null)
    setInfoPanelOpen(false)
  }

  // Don't render if panel is closed and no node selected
  if (!infoPanelOpen && !selectedNode) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed left-6 top-32 z-50
                   glass-panel rounded-2xl w-72 max-h-[75vh] overflow-hidden
                   flex flex-col"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {selectedNode ? (
          <NodeContent
            selectedNode={selectedNode}
            nodeMap={nodeMap}
            onClose={handleClose}
          />
        ) : (
          <>
            <WelcomeContent />
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default NodeDetailPanel
