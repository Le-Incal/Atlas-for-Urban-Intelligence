import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import useGraphStore from '../stores/graphStore'
import nodesData from '../data/nodes.json'
import edgesData from '../data/edges.json'

// Layer colors
const LAYER_COLORS = {
  0: '#2E2F2C',
  1: '#4A5A63',
  2: '#4F7A74',
  3: '#5A5F8C',
  4: '#7A6A9E',
  5: '#9B6A5F',
  6: '#B89A5A',
}

// Calculate node positions using a layered force-directed approach
function calculatePositions(nodes, edges) {
  const positions = {}
  const layerHeight = 20 // Vertical spacing between layers
  
  // Group nodes by layer
  const nodesByLayer = {}
  nodes.forEach(node => {
    if (!nodesByLayer[node.layer]) {
      nodesByLayer[node.layer] = []
    }
    nodesByLayer[node.layer].push(node)
  })

  // Count connections for each node (for sizing)
  const connectionCount = {}
  nodes.forEach(node => {
    connectionCount[node.id] = 0
  })
  edges.forEach(edge => {
    connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1
    connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1
  })

  // Position nodes in a layered layout with some randomization for organic feel
  Object.keys(nodesByLayer).forEach(layer => {
    const layerNodes = nodesByLayer[layer]
    const layerY = (parseInt(layer) - 3) * layerHeight // Center around 0
    
    // Arrange nodes in a circular pattern within each layer
    const radius = 25 + layerNodes.length * 2
    layerNodes.forEach((node, i) => {
      const angle = (i / layerNodes.length) * Math.PI * 2
      const jitter = (Math.random() - 0.5) * 10
      const radiusJitter = (Math.random() - 0.5) * 15
      
      positions[node.id] = {
        x: Math.cos(angle) * (radius + radiusJitter) + jitter,
        y: layerY + (Math.random() - 0.5) * 8,
        z: Math.sin(angle) * (radius + radiusJitter) + jitter,
        connections: connectionCount[node.id] || 1
      }
    })
  })

  // Simple force simulation to spread out nodes
  const iterations = 50
  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between nodes
    nodes.forEach((nodeA, i) => {
      nodes.forEach((nodeB, j) => {
        if (i >= j) return
        const posA = positions[nodeA.id]
        const posB = positions[nodeB.id]
        
        const dx = posB.x - posA.x
        const dy = posB.y - posA.y
        const dz = posB.z - posA.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
        
        if (dist < 15) {
          const force = (15 - dist) * 0.1
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force * 0.3 // Less vertical movement
          const fz = (dz / dist) * force
          
          posA.x -= fx
          posA.y -= fy
          posA.z -= fz
          posB.x += fx
          posB.y += fy
          posB.z += fz
        }
      })
    })

    // Attraction along edges
    edges.forEach(edge => {
      const posA = positions[edge.source]
      const posB = positions[edge.target]
      if (!posA || !posB) return
      
      const dx = posB.x - posA.x
      const dy = posB.y - posA.y
      const dz = posB.z - posA.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
      
      if (dist > 30) {
        const force = (dist - 30) * 0.01
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force * 0.2
        const fz = (dz / dist) * force
        
        posA.x += fx
        posA.y += fy
        posA.z += fz
        posB.x -= fx
        posB.y -= fy
        posB.z -= fz
      }
    })
  }

  return { positions, connectionCount }
}

// Single Node component
function Node({ node, position, size, isVisible }) {
  const meshRef = useRef()
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode)
  const setHoveredNode = useGraphStore((state) => state.setHoveredNode)
  const selectedNode = useGraphStore((state) => state.selectedNode)
  const hoveredNode = useGraphStore((state) => state.hoveredNode)
  
  const isSelected = selectedNode?.id === node.id
  const isHovered = hoveredNode?.id === node.id

  const color = useMemo(() => new THREE.Color(LAYER_COLORS[node.layer]), [node.layer])
  
  // Scale based on state
  const targetScale = isSelected ? 1.3 : isHovered ? 1.15 : 1
  const [currentScale, setCurrentScale] = useState(1)
  
  useFrame(() => {
    if (meshRef.current) {
      // Smooth scale transition
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1)
      setCurrentScale(newScale)
      meshRef.current.scale.setScalar(newScale)
    }
  })

  if (!isVisible) return null

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedNode(isSelected ? null : node)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredNode(node)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHoveredNode(null)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.8}
          metalness={0.1}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* Label on hover */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, size + 1.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="node-label whitespace-nowrap px-2 py-1 rounded bg-white/90 backdrop-blur-sm shadow-sm">
            {node.label}
          </div>
        </Html>
      )}
    </group>
  )
}

// Edge component with pulse animation
function Edge({ edge, sourcePos, targetPos, isVisible, sourceNode }) {
  const lineRef = useRef()
  const pulseRef = useRef()
  const [pulseProgress, setPulseProgress] = useState(null)
  
  const hoveredEdge = useGraphStore((state) => state.hoveredEdge)
  const setHoveredEdge = useGraphStore((state) => state.setHoveredEdge)
  const activeEdgeType = useGraphStore((state) => state.activeEdgeType)
  const selectedNode = useGraphStore((state) => state.selectedNode)
  
  const isHovered = hoveredEdge?.id === edge.id
  const isTypeActive = activeEdgeType === edge.edgeType
  const isConnectedToSelected = selectedNode && 
    (edge.source === selectedNode.id || edge.target === selectedNode.id)
  
  // Determine opacity and thickness
  let opacity = 0.4 // Default
  let lineWidth = 1
  
  if (isTypeActive || isConnectedToSelected) {
    opacity = 1
    lineWidth = 2
  } else if (activeEdgeType || selectedNode) {
    opacity = 0.1 // Fade when something else is active
  }
  
  // Start pulse on hover
  useEffect(() => {
    if (isHovered) {
      setPulseProgress(0)
    } else {
      setPulseProgress(null)
    }
  }, [isHovered])
  
  // Animate pulse
  useFrame((state, delta) => {
    if (pulseProgress !== null && pulseProgress < 1) {
      setPulseProgress(prev => Math.min(prev + delta * 0.5, 1))
    }
  })

  if (!isVisible || !sourcePos || !targetPos) return null

  const points = [
    new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z),
    new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
  ]
  
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
  
  // Calculate pulse position
  let pulsePosition = null
  if (pulseProgress !== null && pulseProgress < 1) {
    pulsePosition = new THREE.Vector3().lerpVectors(
      points[0],
      points[1],
      pulseProgress
    )
  }

  // Source node color for pulse
  const sourceColor = LAYER_COLORS[sourceNode?.layer] || '#C8E66E'

  return (
    <group>
      {/* Main edge line */}
      <line ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial 
          color={isTypeActive || isConnectedToSelected ? '#000000' : '#000000'}
          transparent
          opacity={opacity}
          linewidth={lineWidth}
        />
      </line>
      
      {/* Pulse sphere */}
      {pulsePosition && (
        <mesh position={pulsePosition}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial 
            color={sourceColor}
            transparent
            opacity={1 - pulseProgress}
          />
        </mesh>
      )}
      
      {/* Invisible thicker line for easier hover detection */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredEdge(edge)
        }}
        onPointerOut={() => setHoveredEdge(null)}
      >
        <tubeGeometry args={[
          new THREE.CatmullRomCurve3(points),
          1,
          2,
          8,
          false
        ]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

// Main GraphCanvas component
function GraphCanvas() {
  const { nodes } = nodesData
  const { edges } = edgesData
  
  const visibleLayers = useGraphStore((state) => state.visibleLayers)
  
  // Calculate positions once
  const { positions, connectionCount } = useMemo(
    () => calculatePositions(nodes, edges),
    [nodes, edges]
  )
  
  // Create node lookup for edges
  const nodeMap = useMemo(() => {
    const map = {}
    nodes.forEach(node => {
      map[node.id] = node
    })
    return map
  }, [nodes])

  // Click on empty space to deselect
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode)
  const { camera } = useThree()

  return (
    <group
      onClick={(e) => {
        if (e.object.type === 'Scene' || !e.object.parent) {
          setSelectedNode(null)
        }
      }}
    >
      {/* Render edges first (behind nodes) */}
      {edges.map(edge => {
        const sourceNode = nodeMap[edge.source]
        const targetNode = nodeMap[edge.target]
        const sourcePos = positions[edge.source]
        const targetPos = positions[edge.target]
        
        const isVisible = 
          visibleLayers[sourceNode?.layer] && 
          visibleLayers[targetNode?.layer]
        
        return (
          <Edge
            key={edge.id}
            edge={edge}
            sourcePos={sourcePos}
            targetPos={targetPos}
            sourceNode={sourceNode}
            isVisible={isVisible}
          />
        )
      })}
      
      {/* Render nodes */}
      {nodes.map(node => {
        const pos = positions[node.id]
        const connections = connectionCount[node.id] || 1
        const size = 1.5 + Math.min(connections * 0.3, 3) // Size based on connectivity
        
        return (
          <Node
            key={node.id}
            node={node}
            position={pos}
            size={size}
            isVisible={visibleLayers[node.layer]}
          />
        )
      })}
    </group>
  )
}

export default GraphCanvas
