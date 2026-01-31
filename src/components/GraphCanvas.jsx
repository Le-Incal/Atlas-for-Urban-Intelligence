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

// Calculate node positions using an organic spherical approach
function calculatePositions(nodes, edges) {
  const positions = {}

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

  // Create a more organic spherical distribution
  // Layers spiral around a central axis with varying radii
  const totalLayers = 7
  const baseRadius = 35

  Object.keys(nodesByLayer).forEach(layer => {
    const layerNodes = nodesByLayer[layer]
    const layerIndex = parseInt(layer)

    // Vertical position with gentle curve (not flat layers)
    const normalizedLayer = (layerIndex - 3) / 3 // -1 to 1
    const layerY = normalizedLayer * 45

    // Radius varies by layer - middle layers slightly larger
    const layerRadius = baseRadius + Math.cos(normalizedLayer * Math.PI * 0.5) * 15

    layerNodes.forEach((node, i) => {
      // Distribute nodes in a spiral pattern
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))
      const angle = i * goldenAngle + layerIndex * 0.5

      // Add organic variation
      const radiusVariation = (Math.random() - 0.5) * 20
      const heightVariation = (Math.random() - 0.5) * 15
      const angleVariation = (Math.random() - 0.5) * 0.3

      const r = layerRadius + radiusVariation
      const finalAngle = angle + angleVariation

      positions[node.id] = {
        x: Math.cos(finalAngle) * r,
        y: layerY + heightVariation,
        z: Math.sin(finalAngle) * r,
        connections: connectionCount[node.id] || 1
      }
    })
  })

  // Organic force simulation
  const iterations = 80
  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - (iter / iterations) * 0.5 // Gradually reduce forces

    // Soft repulsion between nodes
    nodes.forEach((nodeA, i) => {
      nodes.forEach((nodeB, j) => {
        if (i >= j) return
        const posA = positions[nodeA.id]
        const posB = positions[nodeB.id]

        const dx = posB.x - posA.x
        const dy = posB.y - posA.y
        const dz = posB.z - posA.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

        // Softer repulsion threshold
        if (dist < 18) {
          const force = (18 - dist) * 0.08 * cooling
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force * 0.5 // Allow more vertical movement
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

    // Gentle attraction along edges
    edges.forEach(edge => {
      const posA = positions[edge.source]
      const posB = positions[edge.target]
      if (!posA || !posB) return

      const dx = posB.x - posA.x
      const dy = posB.y - posA.y
      const dz = posB.z - posA.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

      // Softer attraction
      if (dist > 25) {
        const force = (dist - 25) * 0.008 * cooling
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force * 0.4
        const fz = (dz / dist) * force

        posA.x += fx
        posA.y += fy
        posA.z += fz
        posB.x -= fx
        posB.y -= fy
        posB.z -= fz
      }
    })

    // Gentle pull toward center to keep cluster cohesive
    nodes.forEach(node => {
      const pos = positions[node.id]
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
      if (dist > 60) {
        const pullForce = (dist - 60) * 0.01 * cooling
        pos.x -= (pos.x / dist) * pullForce
        pos.z -= (pos.z / dist) * pullForce
      }
    })
  }

  return { positions, connectionCount }
}

// Single Node component with gradient shading
function Node({ node, position, size, isVisible }) {
  const meshRef = useRef()
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode)
  const setHoveredNode = useGraphStore((state) => state.setHoveredNode)
  const selectedNode = useGraphStore((state) => state.selectedNode)
  const hoveredNode = useGraphStore((state) => state.hoveredNode)

  const isSelected = selectedNode?.id === node.id
  const isHovered = hoveredNode?.id === node.id

  const baseColor = useMemo(() => new THREE.Color(LAYER_COLORS[node.layer]), [node.layer])

  // Create slightly lighter and darker versions for gradient effect
  const colorLight = useMemo(() => {
    const c = baseColor.clone()
    c.offsetHSL(0, -0.05, 0.15) // Slightly lighter, less saturated
    return c
  }, [baseColor])

  const colorDark = useMemo(() => {
    const c = baseColor.clone()
    c.offsetHSL(0, 0.05, -0.1) // Slightly darker, more saturated
    return c
  }, [baseColor])

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
        <sphereGeometry args={[size, 48, 48]} />
        <meshPhysicalMaterial
          color={baseColor}
          roughness={0.6}
          metalness={0.05}
          clearcoat={0.1}
          clearcoatRoughness={0.8}
          envMapIntensity={0.3}
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

// Edge component with wave pulse animation
function Edge({ edge, sourcePos, targetPos, isVisible, sourceNode }) {
  const lineRef = useRef()
  const pulseLineRef = useRef()
  const [pulseProgress, setPulseProgress] = useState(null)

  const hoveredEdge = useGraphStore((state) => state.hoveredEdge)
  const setHoveredEdge = useGraphStore((state) => state.setHoveredEdge)
  const activeEdgeType = useGraphStore((state) => state.activeEdgeType)
  const selectedNode = useGraphStore((state) => state.selectedNode)
  const signaledEdge = useGraphStore((state) => state.signaledEdge)

  const isHovered = hoveredEdge?.id === edge.id
  const isSignaled = signaledEdge?.id === edge.id
  const isTypeActive = activeEdgeType === edge.edgeType
  const isConnectedToSelected = selectedNode &&
    (edge.source === selectedNode.id || edge.target === selectedNode.id)

  // Determine opacity and thickness
  let opacity = 0.4 // Default
  let tubeRadius = 0.15 // Base thickness

  if (isTypeActive || isConnectedToSelected) {
    opacity = 1
    tubeRadius = 0.25 // Thicker when active
  } else if (activeEdgeType || selectedNode) {
    opacity = 0.1 // Fade when something else is active
  }

  // Start pulse on hover or when signaled from panel
  useEffect(() => {
    if (isHovered || isSignaled) {
      setPulseProgress(0)
    } else {
      setPulseProgress(null)
    }
  }, [isHovered, isSignaled])

  // Animate pulse - loop while signaled, single pulse on hover
  useFrame((state, delta) => {
    if (pulseProgress !== null) {
      const newProgress = pulseProgress + delta * 0.8
      if (newProgress >= 1) {
        // If signaled from panel, loop the animation
        if (isSignaled) {
          setPulseProgress(0)
        } else {
          setPulseProgress(null)
        }
      } else {
        setPulseProgress(newProgress)
      }
    }
  })

  if (!isVisible || !sourcePos || !targetPos) return null

  const startPoint = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z)
  const endPoint = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)
  const points = [startPoint, endPoint]

  // Source node color for pulse
  const sourceColor = LAYER_COLORS[sourceNode?.layer] || '#C8E66E'

  // Create pulse wave segments
  const pulseSegments = useMemo(() => {
    if (pulseProgress === null) return null

    const segments = []
    const pulseWidth = 0.15 // Width of the pulse wave
    const pulseCenter = pulseProgress

    // Create multiple segments for the wave effect
    const numSegments = 8
    for (let i = 0; i < numSegments; i++) {
      const segStart = i / numSegments
      const segEnd = (i + 1) / numSegments

      // Calculate if this segment is within the pulse wave
      const segMid = (segStart + segEnd) / 2
      const distFromPulse = Math.abs(segMid - pulseCenter)

      if (distFromPulse < pulseWidth) {
        // Calculate intensity based on distance from pulse center
        const intensity = 1 - (distFromPulse / pulseWidth)
        const segOpacity = intensity * (1 - pulseProgress * 0.5)

        const p1 = new THREE.Vector3().lerpVectors(startPoint, endPoint, segStart)
        const p2 = new THREE.Vector3().lerpVectors(startPoint, endPoint, segEnd)

        segments.push({ p1, p2, opacity: segOpacity })
      }
    }

    return segments
  }, [pulseProgress, sourcePos, targetPos])

  // Create curve for tube geometry
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])

  return (
    <group>
      {/* Main edge - tube geometry for visible thickness */}
      <mesh ref={lineRef}>
        <tubeGeometry args={[curve, 1, tubeRadius, 8, false]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Pulse wave effect - thicker glowing tube segments */}
      {pulseSegments && pulseSegments.map((seg, i) => {
        const segCurve = new THREE.CatmullRomCurve3([seg.p1, seg.p2])
        return (
          <mesh key={i}>
            <tubeGeometry args={[segCurve, 1, 0.4, 8, false]} />
            <meshBasicMaterial
              color={sourceColor}
              transparent
              opacity={seg.opacity}
            />
          </mesh>
        )
      })}

      {/* Invisible thicker tube for easier hover detection */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredEdge(edge)
        }}
        onPointerOut={() => setHoveredEdge(null)}
      >
        <tubeGeometry args={[curve, 1, 1.5, 8, false]} />
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
