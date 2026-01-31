import { create } from 'zustand'

const useGraphStore = create((set, get) => ({
  // View state
  currentView: 'landing', // 'landing' | 'atlas'
  setCurrentView: (view) => set({ currentView: view }),

  // Panel state
  infoPanelOpen: true, // Panel starts open with welcome message
  setInfoPanelOpen: (open) => set({ infoPanelOpen: open }),

  // Node state
  selectedNode: null,
  hoveredNode: null,
  hoveredCluster: null,
  mousePosition: { x: 0, y: 0 },
  setSelectedNode: (node) => set({ selectedNode: node }),
  setHoveredNode: (node) => set({ hoveredNode: node }),
  setHoveredCluster: (cluster) => set({ hoveredCluster: cluster }),
  setMousePosition: (pos) => set({ mousePosition: pos }),

  // Manual layout overrides (drag-to-arrange)
  // Stored in world coordinates: { [nodeId]: { x, y, z } }
  nodeOverrides: {},
  setNodeOverride: (nodeId, pos) => set((state) => ({
    nodeOverrides: { ...state.nodeOverrides, [nodeId]: pos }
  })),
  setNodeOverrides: (overrides) => set({ nodeOverrides: overrides || {} }),
  clearNodeOverrides: () => set({ nodeOverrides: {} }),

  // Load default layout from server (used after Reset)
  loadDefaultLayout: () => {
    fetch('/api/layout')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const positions = data?.positions
        if (positions && typeof positions === 'object') get().setNodeOverrides(positions)
        else get().setNodeOverrides({})
      })
      .catch(() => get().setNodeOverrides({}))
  },

  // Latest resolved positions (used for Save layout to localStorage)
  currentLayoutPositions: null,
  setCurrentLayoutPositions: (positions) => set({ currentLayoutPositions: positions }),

  // Edge state
  hoveredEdge: null,
  activeEdgeType: null, // When user clicks edge type in legend
  signaledEdge: null, // Edge to pulse when clicked in detail panel
  setHoveredEdge: (edge) => set({ hoveredEdge: edge }),
  setActiveEdgeType: (type) => set((state) => ({
    activeEdgeType: state.activeEdgeType === type ? null : type
  })),
  signalEdge: (edge) => set({ signaledEdge: edge }),
  clearSignaledEdge: () => set({ signaledEdge: null }),

  // Visibility / disclosure controls
  // - 'primary': show primary edges by default, expand on focus/filter
  // - 'all': show all edges (focus/fog still apply)
  edgeVisibilityMode: 'primary',
  setEdgeVisibilityMode: (mode) => set({ edgeVisibilityMode: mode }),

  // Cluster focus (island filtering)
  activeClusterKey: null,
  setActiveClusterKey: (key) => set((state) => ({
    activeClusterKey: state.activeClusterKey === key ? null : key
  })),
  clearActiveClusterKey: () => set({ activeClusterKey: null }),

  // Layer visibility
  visibleLayers: {
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
  },
  toggleLayer: (layer) => set((state) => ({
    visibleLayers: {
      ...state.visibleLayers,
      [layer]: !state.visibleLayers[layer]
    }
  })),
  
  // Reset all filters
  resetFilters: () => set({
    infoPanelOpen: true,
    selectedNode: null,
    hoveredNode: null,
    hoveredEdge: null,
    activeEdgeType: null,
    signaledEdge: null,
    edgeVisibilityMode: 'primary',
    activeClusterKey: null,
    nodeOverrides: {},
    clusterOffsets: {},
    visibleLayers: {
      0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true
    }
  }),

  // Camera state (for smooth transitions)
  cameraTarget: [0, 0, 0],
  setCameraTarget: (target) => set({ cameraTarget: target }),

  // Auto-rotate toggle
  autoRotateEnabled: true,
  setAutoRotateEnabled: (enabled) => set({ autoRotateEnabled: enabled }),
  toggleAutoRotate: () => set((state) => ({ autoRotateEnabled: !state.autoRotateEnabled })),

  // OrbitControls ref (used to disable controls while dragging nodes)
  controlsRef: null,
  setControlsRef: (ref) => set({ controlsRef: ref }),

  // Cluster drag offsets (keyed by cluster key)
  clusterOffsets: {},
  updateClusterOffset: (clusterKey, delta) => set((state) => {
    const current = state.clusterOffsets[clusterKey] || { x: 0, y: 0, z: 0 }
    return {
      clusterOffsets: {
        ...state.clusterOffsets,
        [clusterKey]: {
          x: current.x + delta.x,
          y: current.y + delta.y,
          z: current.z + delta.z,
        }
      }
    }
  }),
  setClusterOffset: (clusterKey, offset) => set((state) => ({
    clusterOffsets: {
      ...state.clusterOffsets,
      [clusterKey]: offset
    }
  })),
  clearClusterOffsets: () => set({ clusterOffsets: {} }),
}))

export default useGraphStore
