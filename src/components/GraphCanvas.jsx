import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
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

const WHITE = new THREE.Color('#ffffff')

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

// Bundled curve for inter-cluster edges (shared bridges between islands)
function createBundledCurve(start, end, viaPoints) {
  const pts = [
    new THREE.Vector3(start.x, start.y, start.z),
    ...viaPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    new THREE.Vector3(end.x, end.y, end.z),
  ]
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.4)
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

// Calculate node positions with separated clusters (\"islands\") like your reference.
// Macro-layout: cluster centroids are far apart.
// Micro-layout: nodes are arranged within each cluster, with light layer stratification.
function calculatePositions(nodes, edges) {
  const positions = {}

  // Count connections for each node (for sizing)
  const connectionCount = {}
  nodes.forEach(node => {
    connectionCount[node.id] = 0
  })
  edges.forEach(edge => {
    connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1
    connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1
  })

  const clusterKeyForNode = (node) => {
    const key = node?.clusters?.[0]
    return key || `layer-${node.layer}`
  }

  // Deterministic \"random\" in [0,1) for stable layout per reload
  const rand01 = (key) => {
    const r = hashEdgeId(String(key))
    return r < 0 ? r + 1 : r
  }

  // Group nodes by cluster key
  const nodesByCluster = {}
  const clusterKeyByNodeId = {}
  nodes.forEach((node) => {
    const clusterKey = clusterKeyForNode(node)
    if (!nodesByCluster[clusterKey]) nodesByCluster[clusterKey] = []
    nodesByCluster[clusterKey].push(node)
    clusterKeyByNodeId[node.id] = clusterKey
  })

  const clusterKeys = Object.keys(nodesByCluster).sort()
  const clusterCount = clusterKeys.length || 1
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  // Predefined cluster positions based on conceptual X,Y,Z coordinate map
  // Coordinates are on 0-10 scale, centered at 5, scaled by 30 for world space
  const PREDEFINED_CLUSTER_POSITIONS = {
    'structural-L0': { x: 1, y: 6, z: 3 },   // Bio-Physical (gray)
    'structural-L1': { x: 5, y: 0, z: 0 },   // Observable Reality (steel)
    'structural-L2': { x: 10, y: 3, z: 4 },  // Cyber-Physical (lime)
    'structural-L3': { x: 5, y: 5, z: 5 },   // Logic/Knowledge (blue) - center
    'structural-L4': { x: 10, y: 7, z: 8 },  // Agentic Intelligence (purple)
    'structural-L5': { x: 3, y: 2, z: 6 },   // Socio-Economic (teal)
    'structural-L6': { x: 5, y: 5, z: 10 },  // Governance (tan)
  }
  const SCALE = 30  // Scale factor for 0-10 → world coordinates
  const CENTER = 5  // Center of the 0-10 coordinate system

  const clusterCenters = {}
  const clusterSizes = {}
  clusterKeys.forEach((key, idx) => {
    clusterSizes[key] = nodesByCluster[key]?.length || 0

    // Use predefined position if available, otherwise fall back to ring layout
    const predefined = PREDEFINED_CLUSTER_POSITIONS[key]
    if (predefined) {
      clusterCenters[key] = {
        x: (predefined.x - CENTER) * SCALE,
        y: (predefined.y - CENTER) * SCALE,
        z: (predefined.z - CENTER) * SCALE
      }
    } else {
      // Fallback for cross-layer clusters (capital-value, metabolic-flow, etc.)
      const angle = idx * goldenAngle
      const jitter = (rand01(`${key}-j`) - 0.5) * 40
      const yJitter = (rand01(`${key}-y`) - 0.5) * 60
      const r = 120 + jitter
      clusterCenters[key] = {
        x: Math.cos(angle) * r,
        y: yJitter,
        z: Math.sin(angle) * r
      }
    }
  })

  // Initial per-node placement inside its cluster
  clusterKeys.forEach((key) => {
    const clusterNodes = nodesByCluster[key]
    const center = clusterCenters[key]
    const n = clusterNodes.length

    // Cluster radius scales with cluster size
    const clusterRadius = 18 + Math.sqrt(n) * 7

    clusterNodes.forEach((node, i) => {
      const t = (i + 0.5) / Math.max(1, n)
      const a = i * goldenAngle + (rand01(`${node.id}-a`) - 0.5) * 0.6
      const rr = clusterRadius * Math.sqrt(t) + (rand01(`${node.id}-r`) - 0.5) * 10

      // Keep layers lightly separated within the cluster (so L0–L6 still read)
      const layerYOffset = (node.layer - 3) * 6
      const yVar = (rand01(`${node.id}-y`) - 0.5) * 6

      positions[node.id] = {
        x: center.x + Math.cos(a) * rr,
        y: center.y + layerYOffset + yVar,
        z: center.z + Math.sin(a) * rr,
        connections: connectionCount[node.id] || 1,
        clusterKey: key
      }
    })
  })

  // Force simulation (reduced iterations for performance)
  const iterations = 60
  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - (iter / iterations) * 0.6

    // Repulsion: strong within cluster, gentle across clusters (maintains separation)
    nodes.forEach((nodeA, i) => {
      nodes.forEach((nodeB, j) => {
        if (i >= j) return
        const posA = positions[nodeA.id]
        const posB = positions[nodeB.id]
        if (!posA || !posB) return

        const dx = posB.x - posA.x
        const dy = posB.y - posA.y
        const dz = posB.z - posA.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

        const sameCluster = posA.clusterKey === posB.clusterKey
        const threshold = sameCluster ? 20 : 70
        const strength = sameCluster ? 0.14 : 0.035

        if (dist < threshold) {
          const force = (threshold - dist) * strength * cooling
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force * (sameCluster ? 0.7 : 0.4)
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

    // Edge attraction: normal within cluster, very weak across clusters
    edges.forEach(edge => {
      const posA = positions[edge.source]
      const posB = positions[edge.target]
      if (!posA || !posB) return

      const dx = posB.x - posA.x
      const dy = posB.y - posA.y
      const dz = posB.z - posA.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

      const sameCluster = posA.clusterKey === posB.clusterKey
      const minDist = sameCluster ? 26 : 140
      const strength = sameCluster ? 0.006 : 0.0012

      if (dist > minDist) {
        const force = (dist - minDist) * strength * cooling
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force * 0.45
        const fz = (dz / dist) * force

        posA.x += fx
        posA.y += fy
        posA.z += fz
        posB.x -= fx
        posB.y -= fy
        posB.z -= fz
      }
    })

    // Cluster gravity: keep nodes grouped around their cluster center
    nodes.forEach((node) => {
      const pos = positions[node.id]
      if (!pos) return
      const center = clusterCenters[pos.clusterKey]
      if (!center) return

      const dx = center.x - pos.x
      const dy = center.y - pos.y
      const dz = center.z - pos.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

      // Slightly stronger early, weaker later
      const pull = 0.0025 * (0.6 + 0.4 * cooling)
      pos.x += (dx / dist) * dist * pull
      pos.y += (dy / dist) * dist * pull * 0.8
      pos.z += (dz / dist) * dist * pull
    })
  }

  // Positions are now defined by predefined cluster coordinates - no layer remapping needed

  return { positions, connectionCount, clusterCenters, clusterSizes, clusterKeyByNodeId }
}

// Single Node component with gradient shading
function Node({ node, position, size, isVisible, focusAlpha = 1 }) {
  const meshRef = useRef()
  const materialRef = useRef()
  const outlineMaterialRef = useRef()
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode)
  const setHoveredNode = useGraphStore((state) => state.setHoveredNode)
  const setMousePosition = useGraphStore((state) => state.setMousePosition)
  const selectedNode = useGraphStore((state) => state.selectedNode)
  const hoveredNode = useGraphStore((state) => state.hoveredNode)
  const setNodeOverride = useGraphStore((state) => state.setNodeOverride)
  const controlsRef = useGraphStore((state) => state.controlsRef)
  const { camera, gl } = useThree()

  const isSelected = selectedNode?.id === node.id
  const isHovered = hoveredNode?.id === node.id

  // Drag state (manual arrangement)
  const draggingRef = useRef(false)
  const didDragRef = useRef(false)
  const pointerIdRef = useRef(null)
  const dragPlaneRef = useRef(new THREE.Plane())
  const dragStartRef = useRef(new THREE.Vector3())
  const raycasterRef = useRef(new THREE.Raycaster())

  const baseColor = useMemo(() => new THREE.Color(LAYER_COLORS[node.layer]), [node.layer])
  const displayColor = useMemo(() => baseColor.clone().lerp(WHITE, 1 - focusAlpha), [baseColor, focusAlpha])

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
      // Focus mode: soften non-neighborhood nodes via opacity (higher base for legibility)
      materialRef.current.opacity = 0.88 + 0.12 * focusAlpha
    }
    if (outlineMaterialRef.current) {
      outlineMaterialRef.current.opacity = 0.85 * focusAlpha
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

  const handlePointerDown = (e) => {
    // Left button only
    if (e.button !== 0) return
    e.stopPropagation()

    draggingRef.current = true
    didDragRef.current = false
    pointerIdRef.current = e.pointerId

    document.body.style.cursor = 'grabbing'

    // Disable orbit controls while dragging so the scene doesn't rotate
    if (controlsRef?.current) controlsRef.current.enabled = false

    // Plane facing camera through the node position (screen-plane drag)
    const nodePos = new THREE.Vector3(position.x, position.y, position.z)
    dragStartRef.current.copy(nodePos)
    const normal = new THREE.Vector3().subVectors(camera.position, nodePos).normalize()
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, nodePos)

    // Capture pointer so we continue to receive move/up
    if (gl?.domElement?.setPointerCapture) {
      try { gl.domElement.setPointerCapture(e.pointerId) } catch {}
    }

    const onMove = (ev) => {
      if (!draggingRef.current) return
      if (pointerIdRef.current !== null && ev.pointerId !== pointerIdRef.current) return

      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -(((ev.clientY - rect.top) / rect.height) * 2 - 1)
      )
      raycasterRef.current.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, hit)) {
        if (hit.distanceTo(dragStartRef.current) > 0.5) didDragRef.current = true
        setNodeOverride(node.id, { x: hit.x, y: hit.y, z: hit.z })
      }
    }

    const onUp = (ev) => {
      if (pointerIdRef.current !== null && ev.pointerId !== pointerIdRef.current) return
      draggingRef.current = false
      pointerIdRef.current = null

      document.body.style.cursor = hoveredNode?.id === node.id ? 'pointer' : 'default'

      if (controlsRef?.current) controlsRef.current.enabled = true
      if (gl?.domElement?.releasePointerCapture) {
        try { gl.domElement.releasePointerCapture(e.pointerId) } catch {}
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
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
          ref={outlineMaterialRef}
          color={outlineColor}
          transparent
          opacity={0.85}
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
          // Suppress click toggle if this was a drag
          if (didDragRef.current) {
            didDragRef.current = false
            return
          }
          setSelectedNode(isSelected ? null : node)
        }}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
      >
        <sphereGeometry args={[size, 48, 48]} />
        <meshStandardMaterial
          ref={materialRef}
          color={displayColor}
          roughness={0.75}
          metalness={0}
          emissive={emissiveColor}
          emissiveIntensity={0}
          transparent
          opacity={0.88 + 0.12 * focusAlpha}
        />
      </mesh>

    </group>
  )
}

// Create partial tube geometry for the flowing current effect
function createPartialTube(curve, progress, baseRadius, tubularSegments = 28, radialSegments = 6) {
  if (progress <= 0) return null

  const vertices = []
  const indices = []
  const up = new THREE.Vector3(0, 1, 0)

  // Only render segments up to the current progress
  const activeSegments = Math.max(1, Math.floor(tubularSegments * progress))

  for (let i = 0; i <= activeSegments; i++) {
    const u = (i / tubularSegments) * progress
    const point = curve.getPoint(u)
    const tangent = curve.getTangent(u).normalize()

    let normal = new THREE.Vector3().crossVectors(tangent, up)
    if (normal.lengthSq() < 0.01) normal.set(1, 0, 0)
    normal.normalize()
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize()

    // Glow radius - slightly larger than base edge
    const radius = baseRadius * 2.5

    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const offset = new THREE.Vector3().addScaledVector(normal, x).addScaledVector(binormal, y)
      vertices.push(point.x + offset.x, point.y + offset.y, point.z + offset.z)
    }
  }

  for (let i = 0; i < activeSegments; i++) {
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

// Edge component: neural pathway style (organic curve + variable-radius tube)
function Edge({ edge, sourcePos, targetPos, isVisible, sourceNode, focusAlpha = 1, viaPoints = null }) {
  const pulseProgressRef = useRef(null)
  const [pulseProgress, setPulseProgress] = useState(0)
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
  let opacity = 0.52
  let baseRadius = 0.07

  if (isTypeActive || isConnectedToSelected) {
    opacity = 1
    baseRadius = 0.18
  } else if (activeEdgeType || selectedNode) {
    opacity = 0.28
  }
  opacity *= focusAlpha

  // Organic curve: stable per edge, slight irregularity + asymmetry
  const curve = useMemo(() => {
    if (!sourcePos || !targetPos) return null
    if (viaPoints && viaPoints.length > 0) {
      return createBundledCurve(sourcePos, targetPos, viaPoints)
    }
    return createOrganicCurve(sourcePos, targetPos, edge.id)
  }, [
    sourcePos?.x, sourcePos?.y, sourcePos?.z,
    targetPos?.x, targetPos?.y, targetPos?.z,
    edge.id,
    viaPoints?.length,
    viaPoints?.[0]?.x, viaPoints?.[0]?.y, viaPoints?.[0]?.z,
    viaPoints?.[1]?.x, viaPoints?.[1]?.y, viaPoints?.[1]?.z,
  ])

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

  // Flowing current geometry - updates as pulse progresses
  const currentGeometry = useMemo(() => {
    if (!curve || !pulseActive || pulseProgress <= 0) return null
    return createPartialTube(curve, pulseProgress, baseRadius, 28, 6)
  }, [curve, pulseActive, pulseProgress, baseRadius])

  // Start pulse on hover or when signaled
  useEffect(() => {
    if (isHovered || isSignaled) {
      pulseProgressRef.current = 0
      setPulseProgress(0)
      setPulseActive(true)
    } else {
      pulseProgressRef.current = null
      setPulseActive(false)
      setPulseProgress(0)
    }
  }, [isHovered, isSignaled])

  // Animate the flowing current
  useFrame((state, delta) => {
    if (pulseProgressRef.current === null || !curve) return

    const newProgress = pulseProgressRef.current + delta * 1.2
    if (newProgress >= 1) {
      if (isSignaled) {
        pulseProgressRef.current = 0
        setPulseProgress(0)
      } else {
        pulseProgressRef.current = null
        setPulseActive(false)
        setPulseProgress(0)
      }
    } else {
      pulseProgressRef.current = newProgress
      // Update state less frequently for performance (every ~3 frames)
      if (Math.floor(newProgress * 30) !== Math.floor(pulseProgress * 30)) {
        setPulseProgress(newProgress)
      }
    }
  })

  if (!isVisible || !curve || !tubeGeometry) return null

  return (
    <group>
      {/* Base neural pathway tube */}
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial
          color="#808080"
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Flowing electric current - illuminates the edge from source to target */}
      {pulseActive && currentGeometry && (
        <>
          {/* Outer glow */}
          <mesh geometry={currentGeometry}>
            <meshBasicMaterial
              color="#00e600"
              transparent
              opacity={0.4}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Inner bright core */}
          <mesh geometry={currentGeometry}>
            <meshBasicMaterial
              color="#00ff00"
              transparent
              opacity={0.9}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}

      {/* Invisible tube for hover detection */}
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

// Draggable Cluster Hull - grab and drag to move all nodes in the cluster
function DraggableClusterHull({ clusterKey, center, radius, count, alpha, setActiveClusterKey }) {
  const { camera, gl } = useThree()
  const updateClusterOffset = useGraphStore((state) => state.updateClusterOffset)
  const controlsRef = useGraphStore((state) => state.controlsRef)

  const [isHovered, setIsHovered] = useState(false)
  const draggingRef = useRef(false)
  const didDragRef = useRef(false)
  const pointerIdRef = useRef(null)
  const dragPlaneRef = useRef(new THREE.Plane())
  const lastHitRef = useRef(new THREE.Vector3())
  const raycasterRef = useRef(new THREE.Raycaster())

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return
    e.stopPropagation()

    draggingRef.current = true
    didDragRef.current = false
    pointerIdRef.current = e.pointerId

    gl.domElement.style.cursor = 'grabbing'

    // Disable orbit controls while dragging
    if (controlsRef?.current) controlsRef.current.enabled = false

    // Create drag plane facing camera through cluster center
    const clusterPos = new THREE.Vector3(center.x, center.y, center.z)
    const normal = new THREE.Vector3().subVectors(camera.position, clusterPos).normalize()
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, clusterPos)
    lastHitRef.current.copy(clusterPos)

    // Capture pointer
    if (gl?.domElement?.setPointerCapture) {
      try { gl.domElement.setPointerCapture(e.pointerId) } catch {}
    }

    const onMove = (ev) => {
      if (!draggingRef.current) return
      if (pointerIdRef.current !== null && ev.pointerId !== pointerIdRef.current) return

      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -(((ev.clientY - rect.top) / rect.height) * 2 - 1)
      )
      raycasterRef.current.setFromCamera(ndc, camera)
      const hit = new THREE.Vector3()
      if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, hit)) {
        const delta = {
          x: hit.x - lastHitRef.current.x,
          y: hit.y - lastHitRef.current.y,
          z: hit.z - lastHitRef.current.z
        }
        if (Math.abs(delta.x) > 0.5 || Math.abs(delta.y) > 0.5 || Math.abs(delta.z) > 0.5) {
          didDragRef.current = true
          updateClusterOffset(clusterKey, delta)
          lastHitRef.current.copy(hit)
        }
      }
    }

    const onUp = (ev) => {
      if (pointerIdRef.current !== null && ev.pointerId !== pointerIdRef.current) return
      draggingRef.current = false
      pointerIdRef.current = null

      gl.domElement.style.cursor = 'default'

      if (controlsRef?.current) controlsRef.current.enabled = true
      if (gl?.domElement?.releasePointerCapture) {
        try { gl.domElement.releasePointerCapture(e.pointerId) } catch {}
      }

      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }, [camera, gl, controlsRef, clusterKey, updateClusterOffset, center])

  const handlePointerOver = useCallback(() => {
    setIsHovered(true)
    if (!draggingRef.current) {
      gl.domElement.style.cursor = 'grab'
    }
  }, [gl])

  const handlePointerOut = useCallback(() => {
    setIsHovered(false)
    if (!draggingRef.current) {
      gl.domElement.style.cursor = 'default'
    }
  }, [gl])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    // Only toggle cluster filter if we didn't drag
    if (!didDragRef.current) {
      setActiveClusterKey(clusterKey)
    }
    didDragRef.current = false
  }, [clusterKey, setActiveClusterKey])

  return (
    <group position={[center.x, center.y, center.z]}>
      {/* Soft hull hint */}
      <mesh>
        <sphereGeometry args={[radius, 18, 18]} />
        <meshBasicMaterial
          color="#808080"
          transparent
          opacity={(isHovered ? 0.08 : 0.04) * alpha}
          depthWrite={false}
        />
      </mesh>
      {/* Draggable/clickable target */}
      <mesh
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[radius + 6, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
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
  const selectedNode = useGraphStore((state) => state.selectedNode)
  const activeEdgeType = useGraphStore((state) => state.activeEdgeType)
  const edgeVisibilityMode = useGraphStore((state) => state.edgeVisibilityMode)
  const activeClusterKey = useGraphStore((state) => state.activeClusterKey)
  const setActiveClusterKey = useGraphStore((state) => state.setActiveClusterKey)
  const nodeOverrides = useGraphStore((state) => state.nodeOverrides)
  const setCurrentLayoutPositions = useGraphStore((state) => state.setCurrentLayoutPositions)
  const clusterOffsets = useGraphStore((state) => state.clusterOffsets)
  
  // Calculate positions once
  const { positions, connectionCount, clusterCenters, clusterSizes, clusterKeyByNodeId } = useMemo(
    () => calculatePositions(nodes, edges),
    [nodes, edges]
  )

  // Apply cluster offsets and manual overrides on top of computed layout
  const resolvedPositions = useMemo(() => {
    const out = { ...positions }
    // First apply cluster offsets to all nodes
    Object.keys(out).forEach((id) => {
      const clusterKey = clusterKeyByNodeId?.[id]
      const offset = clusterOffsets?.[clusterKey]
      if (offset) {
        out[id] = {
          ...out[id],
          x: out[id].x + offset.x,
          y: out[id].y + offset.y,
          z: out[id].z + offset.z,
        }
      }
    })
    // Then apply individual node overrides (drag takes precedence)
    Object.entries(nodeOverrides || {}).forEach(([id, p]) => {
      const base = out[id] || { x: 0, y: 0, z: 0, connections: 0 }
      out[id] = { ...base, x: p.x, y: p.y, z: p.z }
    })
    return out
  }, [positions, nodeOverrides, clusterOffsets, clusterKeyByNodeId])

  // Keep latest positions in store for \"Save layout\" (admin)
  useEffect(() => {
    setCurrentLayoutPositions(resolvedPositions)
  }, [resolvedPositions, setCurrentLayoutPositions])
  
  // Create node lookup for edges
  const nodeMap = useMemo(() => {
    const map = {}
    nodes.forEach(node => {
      map[node.id] = node
    })
    return map
  }, [nodes])

  // Neighbor lookup for focus mode
  const neighborsById = useMemo(() => {
    const map = {}
    nodes.forEach((n) => { map[n.id] = new Set() })
    edges.forEach((e) => {
      map[e.source]?.add(e.target)
      map[e.target]?.add(e.source)
    })
    return map
  }, [nodes, edges])

  const focusSet = useMemo(() => {
    if (!selectedNode?.id) return null
    const set = new Set([selectedNode.id])
    const nbrs = neighborsById[selectedNode.id]
    if (nbrs) nbrs.forEach((id) => set.add(id))
    return set
  }, [selectedNode?.id, neighborsById])

  // Calculate actual cluster centroids and radii from resolved node positions
  const actualClusterBounds = useMemo(() => {
    const bounds = {}
    Object.keys(clusterCenters || {}).forEach(key => {
      const clusterNodes = nodes.filter(n => clusterKeyByNodeId?.[n.id] === key)
      if (clusterNodes.length === 0) {
        bounds[key] = { center: clusterCenters[key], radius: 20 }
        return
      }

      // Calculate centroid from actual node positions
      let sumX = 0, sumY = 0, sumZ = 0
      clusterNodes.forEach(node => {
        const pos = resolvedPositions[node.id]
        if (pos) {
          sumX += pos.x
          sumY += pos.y
          sumZ += pos.z
        }
      })
      const center = {
        x: sumX / clusterNodes.length,
        y: sumY / clusterNodes.length,
        z: sumZ / clusterNodes.length
      }

      // Calculate radius to encompass all nodes
      let maxDist = 0
      clusterNodes.forEach(node => {
        const pos = resolvedPositions[node.id]
        if (pos) {
          const dx = pos.x - center.x
          const dy = pos.y - center.y
          const dz = pos.z - center.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist > maxDist) maxDist = dist
        }
      })

      // Add padding for node sizes
      bounds[key] = { center, radius: maxDist + 8 }
    })
    return bounds
  }, [clusterCenters, nodes, clusterKeyByNodeId, resolvedPositions])

  return (
    <group>
      {/* Cluster labels + soft hulls (click to isolate, drag to move) */}
      {actualClusterBounds && Object.entries(actualClusterBounds).map(([key, { center, radius }]) => {
        const count = clusterSizes?.[key] ?? 0
        const alpha = !activeClusterKey ? 1 : (activeClusterKey === key ? 1 : 0.18)
        return (
          <DraggableClusterHull
            key={key}
            clusterKey={key}
            center={center}
            radius={radius}
            count={count}
            alpha={alpha}
            setActiveClusterKey={setActiveClusterKey}
          />
        )
      })}

      {/* Render edges first (behind nodes) */}
      {edges.map(edge => {
        const sourceNode = nodeMap[edge.source]
        const targetNode = nodeMap[edge.target]
        const sourcePos = resolvedPositions[edge.source]
        const targetPos = resolvedPositions[edge.target]
        
        const inVisibleLayers =
          visibleLayers[sourceNode?.layer] && 
          visibleLayers[targetNode?.layer]

        const inActiveCluster = !activeClusterKey || (
          (clusterKeyByNodeId?.[edge.source] === activeClusterKey) &&
          (clusterKeyByNodeId?.[edge.target] === activeClusterKey)
        )

        let isVisible = inVisibleLayers && inActiveCluster

        // Progressive disclosure: primary-only by default (unless filtering/focusing)
        if (
          edgeVisibilityMode === 'primary' &&
          !selectedNode &&
          !activeEdgeType &&
          !activeClusterKey
        ) {
          isVisible = isVisible && !!edge.isPrimary
        }

        // Edge-type filter: hide non-matching for cleanliness
        if (activeEdgeType && edge.edgeType !== activeEdgeType) {
          isVisible = false
        }

        const edgeFocusAlpha = !focusSet ? 1 : (
          (edge.source === selectedNode?.id || edge.target === selectedNode?.id)
            ? 1
            : (focusSet.has(edge.source) && focusSet.has(edge.target))
              ? 0.45
              : 0.08
        )

        // Inter-cluster edge bundling: route via cluster \"ports\" so links form bridges
        const sourceCluster = clusterKeyByNodeId?.[edge.source]
        const targetCluster = clusterKeyByNodeId?.[edge.target]
        let viaPoints = null
        if (sourceCluster && targetCluster && sourceCluster !== targetCluster) {
          const cA = clusterCenters?.[sourceCluster]
          const cB = clusterCenters?.[targetCluster]
          if (cA && cB) {
            // Apply cluster offsets to centers
            const offsetA = clusterOffsets?.[sourceCluster] || { x: 0, y: 0, z: 0 }
            const offsetB = clusterOffsets?.[targetCluster] || { x: 0, y: 0, z: 0 }
            const cAOffset = { x: cA.x + offsetA.x, y: cA.y + offsetA.y, z: cA.z + offsetA.z }
            const cBOffset = { x: cB.x + offsetB.x, y: cB.y + offsetB.y, z: cB.z + offsetB.z }

            const dx = cBOffset.x - cAOffset.x
            const dy = cBOffset.y - cAOffset.y
            const dz = cBOffset.z - cAOffset.z
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
            const ux = dx / dist
            const uy = dy / dist
            const uz = dz / dist
            const offA = 18 + Math.sqrt(clusterSizes?.[sourceCluster] ?? 0) * 2
            const offB = 18 + Math.sqrt(clusterSizes?.[targetCluster] ?? 0) * 2
            const portA = { x: cAOffset.x + ux * offA, y: cAOffset.y + uy * offA, z: cAOffset.z + uz * offA }
            const portB = { x: cBOffset.x - ux * offB, y: cBOffset.y - uy * offB, z: cBOffset.z - uz * offB }
            viaPoints = [portA, portB]
          }
        }
        
        return (
          <Edge
            key={edge.id}
            edge={edge}
            sourcePos={sourcePos}
            targetPos={targetPos}
            sourceNode={sourceNode}
            isVisible={isVisible}
            focusAlpha={edgeFocusAlpha}
            viaPoints={viaPoints}
          />
        )
      })}
      
      {/* Render nodes */}
      {nodes.map(node => {
        const pos = resolvedPositions[node.id]
        const connections = connectionCount[node.id] || 1
        const baseSize = 1.5 + Math.min(connections * 0.3, 3)
        const size = baseSize * (node.scale ?? 1.0)

        const nodeFocusAlpha = !focusSet ? 1 : (focusSet.has(node.id) ? 1 : 0.18)
        const inActiveCluster = !activeClusterKey || (clusterKeyByNodeId?.[node.id] === activeClusterKey)
        const isVisible = visibleLayers[node.layer] && inActiveCluster

        return (
          <Node
            key={node.id}
            node={node}
            position={pos}
            size={size}
            isVisible={isVisible}
            focusAlpha={nodeFocusAlpha}
          />
        )
      })}
    </group>
  )
}

export default GraphCanvas
