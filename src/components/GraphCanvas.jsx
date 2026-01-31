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

// --- Neural pathway edge helpers ---
// Deterministic hash from edge id for stable organic variation
function hashEdgeId(edgeId, seed = '') {
  let h = 0
  const s = edgeId + seed
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return (h % 10000) / 10000
}

// Organic curve from source to target: quadratic Bezier with offset control point (slight irregularity + asymmetry)
function createOrganicCurve(start, end, edgeId) {
  const startV = new THREE.Vector3(start.x, start.y, start.z)
  const endV = new THREE.Vector3(end.x, end.y, end.z)
  const midpoint = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5)
  const direction = new THREE.Vector3().subVectors(endV, startV).normalize()
  const length = startV.distanceTo(endV)

  // Perpendicular axes for control-point offset (stable, not aligned to world)
  const up = new THREE.Vector3(0, 1, 0)
  let perp1 = new THREE.Vector3().crossVectors(direction, up)
  if (perp1.lengthSq() < 0.01) perp1.set(1, 0, 0)
  perp1.normalize()
  const perp2 = new THREE.Vector3().crossVectors(direction, perp1).normalize()

  // Gentle curve: slight organic bulge, minimal asymmetry (cleaner lines)
  const bulge = 0.035 + 0.025 * hashEdgeId(edgeId)
  const asymA = (hashEdgeId(edgeId, 'a') - 0.5) * 0.04
  const asymB = (hashEdgeId(edgeId, 'b') - 0.5) * 0.03
  const control = new THREE.Vector3()
    .copy(midpoint)
    .addScaledVector(perp1, length * (bulge + asymA))
    .addScaledVector(perp2, length * asymB)

  return new THREE.QuadraticBezierCurve3(startV, control, endV)
}

// Variable-radius tube along curve: taper at ends, swell in middle (neural pathway look)
function createVariableRadiusTube(curve, baseRadius, tubularSegments = 28, radialSegments = 6) {
  const vertices = []
  const indices = []
  const up = new THREE.Vector3(0, 1, 0)

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments
    const point = curve.getPoint(u)
    const tangent = curve.getTangent(u).normalize()

    let normal = new THREE.Vector3().crossVectors(tangent, up)
    if (normal.lengthSq() < 0.01) normal.set(1, 0, 0)
    normal.normalize()
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize()

    // Subtle taper: mostly uniform thickness, gentle swell in middle (cleaner look)
    const swell = Math.sin(Math.PI * u)
    const taper = 0.78 + 0.22 * swell
    const radius = baseRadius * taper

    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const offset = new THREE.Vector3().addScaledVector(normal, x).addScaledVector(binormal, y)
      vertices.push(point.x + offset.x, point.y + offset.y, point.z + offset.z)
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j
      const b = a + radialSegments + 1
      const c = a + 1
      const d = b + 1
      indices.push(a, c, b, c, d, b)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
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

  // Layer-clustered layout: larger globe — distinct Y bands + radius rings
  const totalLayers = 7
  const baseRadius = 82

  Object.keys(nodesByLayer).forEach(layer => {
    const layerNodes = nodesByLayer[layer]
    const layerIndex = parseInt(layer)

    // Tighter vertical bands — layers clustered
    const normalizedLayer = (layerIndex - 3) / 3 // -1 to 1
    const layerY = normalizedLayer * 72

    // Each layer its own radius ring, closer together
    const layerRadiusOffset = (layerIndex - 3) * 14
    const layerRadius = baseRadius + layerRadiusOffset + Math.cos(normalizedLayer * Math.PI * 0.5) * 8

    layerNodes.forEach((node, i) => {
      const goldenAngle = Math.PI * (3 - Math.sqrt(5))
      const angle = i * goldenAngle + layerIndex * 0.5

      // More variation so nodes don’t sit on top of each other
      const radiusVariation = (Math.random() - 0.5) * 28
      const heightVariation = (Math.random() - 0.5) * 14
      const angleVariation = (Math.random() - 0.5) * 0.45

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

  // Force simulation: strong repulsion to keep layers/nodes separated, weak attraction
  const iterations = 120
  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - (iter / iterations) * 0.5

    // Strong repulsion — keep nodes and layers well separated
    nodes.forEach((nodeA, i) => {
      nodes.forEach((nodeB, j) => {
        if (i >= j) return
        const posA = positions[nodeA.id]
        const posB = positions[nodeB.id]

        const dx = posB.x - posA.x
        const dy = posB.y - posA.y
        const dz = posB.z - posA.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

        if (dist < 42) {
          const force = (42 - dist) * 0.16 * cooling
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force * 0.75
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

    // Weak attraction — only when far, so edges don't collapse the spread
    edges.forEach(edge => {
      const posA = positions[edge.source]
      const posB = positions[edge.target]
      if (!posA || !posB) return

      const dx = posB.x - posA.x
      const dy = posB.y - posA.y
      const dz = posB.z - posA.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

      if (dist > 58) {
        const force = (dist - 58) * 0.004 * cooling
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force * 0.5
        const fz = (dz / dist) * force

        posA.x += fx
        posA.y += fy
        posA.z += fz
        posB.x -= fx
        posB.y -= fy
        posB.z -= fz
      }
    })

    // Soft center pull (tighter globe)
    nodes.forEach(node => {
      const pos = positions[node.id]
      const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
      if (dist > 128) {
        const pullForce = (dist - 128) * 0.01 * cooling
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

      {/* Node initials - high-contrast so readable on all layer colors */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 0, size + 0.5]}
          fontSize={0.35}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.03}
          outlineColor="#1a1a1a"
        >
          {node.label.split(' ').map(word => word.charAt(0)).join('')}
        </Text>
      </Billboard>
    </group>
  )
}

// Edge component: neural pathway style (organic curve + variable-radius tube)
function Edge({ edge, sourcePos, targetPos, isVisible, sourceNode }) {
  const pulseGroupRef = useRef()
  const pulseProgressRef = useRef(null)
  const [pulseActive, setPulseActive] = useState(false)

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

  // Determine opacity and base radius (tube will taper/swell from this)
  // Lower default opacity reduces central clutter; focus state stays strong
  let opacity = 0.16
  let baseRadius = 0.055

  if (isTypeActive || isConnectedToSelected) {
    opacity = 1
    baseRadius = 0.18
  } else if (activeEdgeType || selectedNode) {
    opacity = 0.08
  }

  // Organic curve: stable per edge, slight irregularity + asymmetry
  const curve = useMemo(() => {
    if (!sourcePos || !targetPos) return null
    return createOrganicCurve(sourcePos, targetPos, edge.id)
  }, [sourcePos?.x, sourcePos?.y, sourcePos?.z, targetPos?.x, targetPos?.y, targetPos?.z, edge.id])

  // Variable-radius tube geometry (taper at ends, swell in middle)
  const tubeGeometry = useMemo(() => {
    if (!curve) return null
    const geom = createVariableRadiusTube(curve, baseRadius, 28, 6)
    return geom
  }, [curve, baseRadius])

  // Hover hit area: same curve, larger radius tube (invisible)
  const hitTubeGeometry = useMemo(() => {
    if (!curve) return null
    return createVariableRadiusTube(curve, 1.2, 16, 6)
  }, [curve])

  // Start pulse on hover or when signaled from panel (state only for show/hide)
  useEffect(() => {
    if (isHovered || isSignaled) {
      pulseProgressRef.current = 0
      setPulseActive(true)
    } else {
      pulseProgressRef.current = null
      setPulseActive(false)
    }
  }, [isHovered, isSignaled])

  // Animate pulse along curve: update position via ref, no setState per frame
  useFrame((state, delta) => {
    if (pulseProgressRef.current === null || !curve || !pulseGroupRef.current) return
    const newProgress = pulseProgressRef.current + delta * 0.8
    if (newProgress >= 1) {
      if (isSignaled) {
        pulseProgressRef.current = 0
      } else {
        pulseProgressRef.current = null
        setPulseActive(false)
      }
    } else {
      pulseProgressRef.current = newProgress
    }
    const pos = curve.getPoint(Math.min(1, Math.max(0, pulseProgressRef.current ?? 0)))
    pulseGroupRef.current.position.set(pos.x, pos.y, pos.z)
  })

  if (!isVisible || !curve || !tubeGeometry) return null

  return (
    <group>
      {/* Neural pathway tube: organic curve, variable thickness */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color="#808080"
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pulse: travels along the curved path (position updated in useFrame via ref) */}
      {pulseActive && (
        <group ref={pulseGroupRef}>
          <mesh>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#00e600" transparent opacity={0.3} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color="#00e600" transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* Invisible tube for hover (follows same curve) */}
      <mesh
        geometry={hitTubeGeometry}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredEdge(edge)
        }}
        onPointerOut={() => setHoveredEdge(null)}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Main GraphCanvas component
function GraphCanvas() {
  // Support both raw array and { nodes } / { edges } shapes
  const nodes = Array.isArray(nodesData) ? nodesData : (nodesData?.nodes ?? [])
  const edges = Array.isArray(edgesData) ? edgesData : (edgesData?.edges ?? [])
  
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

  const { camera } = useThree()

  return (
    <group>
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
        const baseSize = 1.5 + Math.min(connections * 0.3, 3)
        const size = baseSize * (node.scale ?? 1.0)
        
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
