import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import useGraphStore from '../stores/graphStore'
import nodesData from '../data/nodes.json'
import edgesData from '../data/edges.json'

// Layer colors
const LAYER_COLORS = {
  0: '#8B8682', // Grey Olive
  1: '#9DACB3', // Cool Steel
  2: '#C1ED93', // Lime Cream
  3: '#68D3F0', // Sky Blue
  4: '#BF7BE6', // Bright Lavender
  5: '#6ECBB1', // Pearl Aqua
  6: '#D49174', // Toasted Almond
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
  const materialRef = useRef()
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode)
  const setHoveredNode = useGraphStore((state) => state.setHoveredNode)
  const setMousePosition = useGraphStore((state) => state.setMousePosition)
  const selectedNode = useGraphStore((state) => state.selectedNode)
  const hoveredNode = useGraphStore((state) => state.hoveredNode)

  const isSelected = selectedNode?.id === node.id
  const isHovered = hoveredNode?.id === node.id

  const baseColor = useMemo(() => new THREE.Color(LAYER_COLORS[node.layer]), [node.layer])

  // Create emissive color (slightly brighter version of base)
  const emissiveColor = useMemo(() => {
    const c = baseColor.clone()
    c.offsetHSL(0, 0.1, 0.2)
    return c
  }, [baseColor])

  // Scale and glow based on state
  const targetScale = isSelected ? 1.3 : isHovered ? 1.15 : 1
  const targetEmissive = isHovered || isSelected ? 0.2 : 0
  const [currentScale, setCurrentScale] = useState(1)
  const [currentEmissive, setCurrentEmissive] = useState(0)

  useFrame(() => {
    if (meshRef.current) {
      // Smooth scale transition
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1)
      setCurrentScale(newScale)
      meshRef.current.scale.setScalar(newScale)
    }
    if (materialRef.current) {
      // Smooth emissive (glow) transition
      const newEmissive = THREE.MathUtils.lerp(currentEmissive, targetEmissive, 0.1)
      setCurrentEmissive(newEmissive)
      materialRef.current.emissiveIntensity = newEmissive
    }
  })

  // Handle pointer events more robustly
  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHoveredNode(node)
    setMousePosition({ x: e.clientX, y: e.clientY })
    document.body.style.cursor = 'pointer'
  }

  const handlePointerMove = (e) => {
    if (hoveredNode?.id === node.id) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handlePointerOut = (e) => {
    // Only clear if this node is currently hovered
    if (hoveredNode?.id === node.id) {
      setHoveredNode(null)
      document.body.style.cursor = 'default'
    }
  }

  const handlePointerLeave = (e) => {
    // Backup clear on pointer leave
    if (hoveredNode?.id === node.id) {
      setHoveredNode(null)
      document.body.style.cursor = 'default'
    }
  }

  // Create a darker version of the base color for the outline
  const outlineColor = useMemo(() => {
    const c = baseColor.clone()
    c.offsetHSL(0, 0, -0.15) // Darken by 15%
    return c
  }, [baseColor])

  if (!isVisible) return null

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Dark outline sphere (slightly larger, behind main sphere) */}
      <mesh scale={1.06}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={outlineColor}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Glow sphere (larger, semi-transparent) */}
      {(isHovered || isSelected) && (
        <mesh scale={1.25}>
          <sphereGeometry args={[size, 32, 32]} />
          <meshBasicMaterial
            color={emissiveColor}
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </mesh>
      )}

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          setSelectedNode(isSelected ? null : node)
        }}
        onPointerOver={handlePointerOver}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial
          ref={materialRef}
          color={baseColor}
          roughness={0.75}
          metalness={0}
          emissive={emissiveColor}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Node initials - 3D text that properly occludes */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 0, size + 0.5]}
          fontSize={1.2}
          color="#00e600"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {node.label.split(' ').map(word => word.charAt(0)).join('')}
        </Text>
      </Billboard>
    </group>
  )
}

// Edge component using cylinder geometry for reliable rendering
function Edge({ edge, sourcePos, targetPos, isVisible, sourceNode }) {
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
  let opacity = 0.4
  let radius = 0.08

  if (isTypeActive || isConnectedToSelected) {
    opacity = 1
    radius = 0.18
  } else if (activeEdgeType || selectedNode) {
    opacity = 0.1
  }

  // Start pulse on hover or when signaled from panel
  useEffect(() => {
    if (isHovered || isSignaled) {
      setPulseProgress(0)
    } else {
      setPulseProgress(null)
    }
  }, [isHovered, isSignaled])

  // Animate pulse
  useFrame((state, delta) => {
    if (pulseProgress !== null) {
      const newProgress = pulseProgress + delta * 0.8
      if (newProgress >= 1) {
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

  // Calculate cylinder position and rotation
  const cylinderProps = useMemo(() => {
    if (!sourcePos || !targetPos) return null

    const start = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z)
    const end = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)

    // Midpoint for position
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)

    // Length of the edge
    const length = start.distanceTo(end)

    // Direction and rotation
    const direction = new THREE.Vector3().subVectors(end, start).normalize()

    // Create quaternion to rotate cylinder from Y-axis to edge direction
    const quaternion = new THREE.Quaternion()
    const yAxis = new THREE.Vector3(0, 1, 0)
    quaternion.setFromUnitVectors(yAxis, direction)

    // Convert quaternion to euler
    const euler = new THREE.Euler().setFromQuaternion(quaternion)

    return {
      position: [midpoint.x, midpoint.y, midpoint.z],
      rotation: [euler.x, euler.y, euler.z],
      length
    }
  }, [sourcePos?.x, sourcePos?.y, sourcePos?.z, targetPos?.x, targetPos?.y, targetPos?.z])

  if (!isVisible || !cylinderProps) return null

  const sourceColor = LAYER_COLORS[sourceNode?.layer] || '#C8E66E'

  // Calculate pulse position along the edge
  const pulsePosition = useMemo(() => {
    if (pulseProgress === null || !sourcePos || !targetPos) return null

    const start = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z)
    const end = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z)

    // Interpolate position along the edge based on progress
    const pos = new THREE.Vector3().lerpVectors(start, end, pulseProgress)
    return [pos.x, pos.y, pos.z]
  }, [pulseProgress, sourcePos?.x, sourcePos?.y, sourcePos?.z, targetPos?.x, targetPos?.y, targetPos?.z])

  return (
    <group>
      {/* Main edge cylinder */}
      <mesh
        position={cylinderProps.position}
        rotation={cylinderProps.rotation}
      >
        <cylinderGeometry args={[radius, radius, cylinderProps.length, 8]} />
        <meshBasicMaterial
          color="#595959"
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>

      {/* Pulse effect - sphere that travels along the edge */}
      {pulseProgress !== null && pulsePosition && (
        <mesh position={pulsePosition}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial
            color={sourceColor}
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Invisible cylinder for hover detection */}
      <mesh
        position={cylinderProps.position}
        rotation={cylinderProps.rotation}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredEdge(edge)
        }}
        onPointerOut={() => setHoveredEdge(null)}
      >
        <cylinderGeometry args={[1.5, 1.5, cylinderProps.length, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
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
