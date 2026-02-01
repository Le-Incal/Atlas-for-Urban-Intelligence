import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGraphStore from '../stores/graphStore'
import ViewToggle from './ViewToggle'
import nodesData from '../data/nodes.json'
import edgesData from '../data/edges.json'

function normalizeLabel(s) {
  if (!s) return ''
  return String(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[()]/g, ' ')
    .replace(/[-/,:.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Index taxonomy: Layer → Primary → Secondary (display-only grouping)
const INDEX_TAXONOMY = {
  0: {
    title: 'Bio-Physical (The Earth)',
    subtitle: 'The metabolic foundation and planetary constraints.',
    groups: [
      {
        primary: 'Geology',
        secondary: [
          'Earth', 'Ground', 'Bedrock', 'Clay', 'Sand', 'Gravel', 'Marl', 'Land Soils - Geology',
          'Geological Processes', 'Fault Lines', 'Mines',
        ],
      },
      {
        primary: 'Topography',
        secondary: ['Elevation Data', 'Elevations', 'Slope Heat Map', 'Topography'],
      },
      {
        primary: 'Hydrography',
        secondary: ['Water', 'Water Table', 'Wetlands (NWI)', 'Flood Zone', 'FEMA Flood Hazard Zones'],
      },
      {
        primary: 'Atmosphere & Nature',
        secondary: [
          'Air', 'Vegetation', 'Natural Habitats', 'Nature', 'Bio Environmental', 'Biophilic',
          'Ecological Factors', 'Cosmic Ecology', 'Anthropological',
        ],
      },
      {
        primary: 'Hazards',
        secondary: ['FEMA Wildfire Risk', 'FEMA Strong Wind Risk', 'FEMA Earthquake Risk'],
      },
      {
        primary: 'Resources',
        secondary: ['Raw Materials', 'Resources Endowments', 'Agricultural/Agriculture'],
      },
    ],
  },
  1: {
    title: 'Observable Reality (The Hardware)',
    subtitle: 'The physical assets, built environment, and “Identity Spine”.',
    groups: [
      {
        primary: 'Land & Spatial',
        secondary: [
          'Parcels', 'Parcel Framework', 'Parcel ID', 'Estates', 'Site Addresses', 'Site Areas',
          'Site Conditions', 'Site Restrictions', 'Lot Coverage', 'Boundaries', 'Land Base',
          'Basemap', 'Orthoimagery', 'Tile/Raster',
        ],
      },
      {
        primary: 'Built Form',
        secondary: ['Building Footprints', 'Building Area', 'Building Height', 'Structures', 'Density'],
      },
      {
        primary: 'Asset Types',
        secondary: [
          'Housing', 'Single Family Residential', 'Commercial Real Estate', 'Industrial', 'Retail',
          'Office', 'Mixed Use', 'Hospitality', 'Civic', 'Secure Sites', 'Open Space',
        ],
      },
      {
        primary: 'Infrastructure (Physical)',
        secondary: [
          'Hard Infra', 'Domestic Infrastructure', 'Transmission Lines', 'Waste', 'Parking', 'Streets',
          'Circulation', 'Right of Way', 'Transportation', 'Transit-Oriented Development',
          'Smelters', 'Refiners',
        ],
      },
      {
        primary: 'Supply Chain',
        secondary: ['Component Manufacturers', 'Assemblers', 'Distributors', 'Shipping'],
      },
    ],
  },
  2: {
    title: 'Cyber-Physical (The Nervous System)',
    subtitle: 'Sensors, actuators, hardware, and embodied AI.',
    groups: [
      {
        primary: 'Hardware',
        secondary: [
          'Technical Infrastructure', 'Internet Infrastructure', 'Internet of Things (IoT)', 'Devices',
          'Chips', 'Hardware', 'Telecommunications', 'Network Infra',
        ],
      },
      {
        primary: 'Sensing',
        secondary: ['Sensors', 'Urban Sensing Network', 'Eye-Tracking', 'Live Streams', 'Real-Time Responsiveness'],
      },
      {
        primary: 'Actuation',
        secondary: ['Urban Actuators', 'Smart Home Technologies', 'Robotization', 'Embodied AI', 'Physical Actors'],
      },
    ],
  },
  3: {
    title: 'Logic/Knowledge (The Meaning)',
    subtitle: 'Computation, data structures, software, and translation of constraints.',
    groups: [
      {
        primary: 'Constraints (Computable)',
        secondary: ['Setbacks', 'Floor Area Ratio (FAR)', 'Zoning Regulations (as code)', 'Detailed Controls'],
      },
      {
        primary: 'Data Structure',
        secondary: [
          'System of Record', 'Master Data', 'Golden Record', 'Meta Data', 'Data Layers',
          'Real World Data Set', 'Transactional Data', 'Interaction Logs', 'Application Events',
          'Vector Stores', 'Structured Database', 'Semantic Database', 'Knowledge Graph',
        ],
      },
      {
        primary: 'Processing',
        secondary: [
          'Data Processing', 'Data Mining Layer', 'Data Preparation and Labeling', 'Data Retrieval',
          'Document Processing', 'Document Generation', 'Speech to Text', 'Natural Language Processing (NLP)',
        ],
      },
      {
        primary: 'Infrastructure (Soft)',
        secondary: [
          'Cloud', 'Cloud Infrastructure', 'Data Lake', 'Data Storage Infra', 'Generator Server',
          'Back End Resources', 'Middleware', 'API Layer', 'Microservice',
          'Technical Middle Platform PaaS Layers', 'Compute (Hadoop Cluster Apps)',
        ],
      },
      {
        primary: 'AI Models (Tools)',
        secondary: [
          'Algorithms and Machine Learning', 'LLM', 'Pretraining', 'Model Customization', 'AI Training',
          'AI Model', 'AI Engine', 'Reinforcement Learning', 'GraphRAG', 'Prompt Engineering', 'Chain of Thought',
        ],
      },
      {
        primary: 'Logic & Apps',
        secondary: [
          'Rules and Logic Processing', 'Business Rules', 'Logical Network Layer', 'Application Layer',
          'Software', 'Email', 'Communications Vendor Platform', 'External Firm Intranet Platform',
          'External Partners', 'User Accounts', 'Interface', 'User Interface', 'Info Display',
          'Data Visualization', 'Dashboard',
        ],
      },
    ],
  },
  4: {
    title: 'Agentic Intelligence (The Council)',
    subtitle: 'Active reasoning agents and decision-making systems.',
    groups: [
      {
        primary: 'Agents',
        secondary: ['Infrastructure AI Agent', 'Health AI Agent', 'Safety AI Agent', 'Municipal AI Agent', 'Traffic AI Agent'],
      },
      {
        primary: 'Architecture',
        secondary: [
          'Agentic AI Architecture', 'Urban Agentic Systems', 'Agent Orchestration', 'Multi Agent Coordination',
          'Task Executor', 'Copilot',
        ],
      },
      {
        primary: 'Generative Actions',
        secondary: [
          'Action-Based Generators', 'Content-Based Generators', 'Intelligent Recommendations',
          'Decision Making and Adaptation', 'Sensemaking',
        ],
      },
      {
        primary: 'Synthetic Ecology',
        secondary: [
          'Cyber/Synthetic Persona Layer', 'Partnership AI Models', 'Human-AI Interactions',
          'SuperAMI in Advance of Super Intelligence', 'More-than-human capabilities',
        ],
      },
    ],
  },
  5: {
    title: 'Socio-Economic (The People)',
    subtitle: 'Memory, demographics, values, and human perception.',
    groups: [
      {
        primary: 'Demographics',
        secondary: [
          'Population', 'Total Population', 'Total Households',
          'Age Groups (Greatest Generation, Baby Boomers, Gen-X, Gen-Z, Gen Alpha, Gen Beta, Above 65 Years Old)',
        ],
      },
      {
        primary: 'Economics',
        secondary: [
          'Economy', 'Income Distribution', 'Household Income', 'Median Household Income', 'Gross Rent',
          'Median Rent', 'Home Value', 'Median Unit Value', 'Real Estate Market', 'Market Intelligence',
          'Market Potential', 'Development Economics', 'Employment Status',
        ],
      },
      {
        primary: 'Human Actors',
        secondary: ['Human', 'User', 'Stakeholders', 'Actors', 'Human Operator', 'Analytics Users', 'Civil Societies'],
      },
      {
        primary: 'Community',
        secondary: [
          'Neighborhood', 'Village', 'Town', 'City', 'County', 'State', 'National', 'Continent', 'World',
          'Administrative Area',
        ],
      },
      {
        primary: 'Culture & Values',
        secondary: [
          'Culture/Economy/Mobility', 'Social Values', 'Cultural Dimensions of AI', 'Cultural Landscape',
          'Public Attitudes', 'Public Engagement', 'Advocacy and Ethical Oversight', 'Truth',
          'Metaphysical', 'Spiritual', 'Metaphysical Spiritual',
        ],
      },
      {
        primary: 'Experience',
        secondary: [
          'User Experiences', 'Experience', 'Needs', 'Requirements', 'Learning Management Sub-System',
          'Learning Grouping Sub-System', 'Sub-System of Content Assignment',
        ],
      },
    ],
  },
  6: {
    title: 'Governance (The Rules)',
    subtitle: 'Policy, rights, authority, and compliance.',
    groups: [
      {
        primary: 'Legal',
        secondary: [
          'Establish Law', 'Tort Law', 'Legislation and Implementation', 'Compliance', 'Enforcement',
          'Litigation (Risks)', 'Rights and Interests', 'Incidental Rights', 'Permissions',
        ],
      },
      {
        primary: 'Authority',
        secondary: [
          'Governance', 'Neo-Governance', 'Regulatory Governance', 'AI Regulatory Authority',
          'International Organizations', 'International Collaboration', 'Supranational',
        ],
      },
      {
        primary: 'Planning',
        secondary: [
          'Urban Planning', 'Spatial Planning', 'Land-Use Planning', 'Zoning Districts', 'Zoning Overlays',
          'Land Use', 'Density Bonuses',
        ],
      },
      {
        primary: 'Public Sector',
        secondary: ['Public Finance and Taxation', 'Tax', 'Public Access', 'Public Control', 'Public Record', 'Assessor Data'],
      },
      {
        primary: 'Specific Designations',
        secondary: [
          'Qualified Census Tracts', 'Qualified Opportunity Zones (HUD)', 'Difficult Development Zones (HUD)',
          'Neighborhood Change/Opportunity (CA)', 'NCES School Districts', 'Jurisdiction(s)',
        ],
      },
      {
        primary: 'Ethics & Validation',
        secondary: [
          'Ethical Framework', 'Guardrails', 'Transparency and Accountability', 'Social Regulations',
          'Environmental Regulations', 'Goal and Value Layer', 'Outcome and Validation', 'Continuous Learning',
          'Patterns and Relationships', 'Context', 'Boundaries', 'Clarifications', 'Elements', 'Missing Factors',
        ],
      },
    ],
  },
}

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
  const taxonomy = INDEX_TAXONOMY[layer]
  const nodeByKey = useMemo(() => {
    const map = new Map()
    layerNodes.forEach((n) => {
      const k = normalizeLabel(n.label)
      if (k && !map.has(k)) map.set(k, n)
    })
    return map
  }, [layerNodes])
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

  const grouped = useMemo(() => {
    if (!taxonomy?.groups?.length) return null

    const usedNodeIds = new Set()
    const groups = taxonomy.groups.map(({ primary, secondary }) => {
      const primaryKey = normalizeLabel(primary)
      const primaryNode = nodeByKey.get(primaryKey) || null
      if (primaryNode) usedNodeIds.add(primaryNode.id)

      const secList = (secondary || [])
        .filter(Boolean)
        // remove duplicates and avoid repeating the primary label
        .filter((s) => normalizeLabel(s) !== primaryKey)

      const secondaryItems = secList.map((label) => {
        const n = nodeByKey.get(normalizeLabel(label)) || null
        if (n) usedNodeIds.add(n.id)
        return { label, node: n }
      })

      return { primary, primaryNode, secondaryItems }
    })

    const otherNodes = layerNodes.filter((n) => !usedNodeIds.has(n.id))

    return { groups, otherNodes }
  }, [taxonomy, nodeByKey, layerNodes])

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
              L{layer}: {taxonomy?.title ?? LAYER_NAMES[layer]}
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
                  {taxonomy?.subtitle ?? LAYER_DESCRIPTIONS[layer]}
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

              {/* Nodes List (grouped by Primary → Secondary) */}
              <div className="pl-8 space-y-3">
                {grouped?.groups?.length ? (
                  <>
                    {grouped.groups.map((g) => (
                      <div key={`${layer}-${g.primary}`} className="space-y-2">
                        <div className="text-[11px] font-semibold text-gray-700 tracking-wide">
                          {g.primary}
                        </div>

                        {g.primaryNode ? (
                          <NodeRow
                            key={g.primaryNode.id}
                            node={g.primaryNode}
                            edges={edges}
                            role="primary"
                            isExpanded={expandedNodes.has(g.primaryNode.id)}
                            onToggle={() => toggleNode(g.primaryNode.id)}
                          />
                        ) : (
                          <div className="ml-2 text-xs text-gray-400 italic">
                            (Primary category — no node currently in model)
                          </div>
                        )}

                        {g.secondaryItems.length > 0 && (
                          <div className="ml-3 space-y-2">
                            {g.secondaryItems.map((item) => (
                              item.node ? (
                                <NodeRow
                                  key={item.node.id}
                                  node={item.node}
                                  edges={edges}
                                  role="secondary"
                                  isExpanded={expandedNodes.has(item.node.id)}
                                  onToggle={() => toggleNode(item.node.id)}
                                />
                              ) : (
                                <div
                                  key={`${layer}-${g.primary}-${item.label}`}
                                  className="ml-2 text-xs text-gray-400"
                                >
                                  {item.label}
                                </div>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {grouped.otherNodes.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-gray-500 tracking-wide">
                          Other nodes ({grouped.otherNodes.length})
                        </div>
                        <div className="mt-2 space-y-2">
                          {grouped.otherNodes.map((node) => (
                            <NodeRow
                              key={node.id}
                              node={node}
                              edges={edges}
                              role="other"
                              isExpanded={expandedNodes.has(node.id)}
                              onToggle={() => toggleNode(node.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
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
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NodeRow({ node, edges, isExpanded, onToggle, role }) {
  const incomingEdges = edges.filter(e => e.target === node.id)
  const outgoingEdges = edges.filter(e => e.source === node.id)

  // Get unique edge types
  const inTypes = [...new Set(incomingEdges.map(e => e.edgeType))].sort()
  const outTypes = [...new Set(outgoingEdges.map(e => e.edgeType))].sort()

  const computedRole = role || ((node.scale ?? 1.0) >= 1.0 ? 'primary' : 'secondary')
  const isPrimary = computedRole === 'primary'
  const isSecondary = computedRole === 'secondary'

  // Darken color for primary nodes
  const nodeColor = LAYER_COLORS[node.layer]
  const dotStyle = isPrimary
    ? { backgroundColor: nodeColor, boxShadow: `0 0 0 2px ${nodeColor}40` }
    : { backgroundColor: nodeColor, opacity: isSecondary ? 0.6 : 0.45 }

  return (
    <div
      className={`rounded-lg p-3 cursor-pointer transition-colors ${
        isPrimary
          ? 'bg-gray-100 hover:bg-gray-150 border-l-2'
          : isSecondary
            ? 'bg-gray-50 hover:bg-gray-100 ml-2'
            : 'bg-white hover:bg-gray-50 ml-2 border border-gray-100'
      }`}
      style={isPrimary ? { borderLeftColor: nodeColor } : {}}
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
          className={`rounded-full mt-1.5 flex-shrink-0 ${isPrimary ? 'w-2.5 h-2.5' : 'w-2 h-2'}`}
          style={dotStyle}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-sm text-gray-900 ${isPrimary ? 'font-semibold' : 'font-medium'}`}>
              {node.label}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {node.nodeType}
            </span>
            {isPrimary && (
              <span className="text-[9px] font-medium text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                PRIMARY
              </span>
            )}
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
      <main className="max-w-4xl mx-auto pt-4 pb-20">
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

      {/* View Toggle */}
      <ViewToggle />
    </div>
  )
}

export default IndexPage
