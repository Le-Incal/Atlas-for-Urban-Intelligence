import { create } from 'zustand'

const useGraphStore = create((set, get) => ({
  // View state
  currentView: 'landing', // 'landing' | 'atlas'
  setCurrentView: (view) => set({ currentView: view }),

  // Node state
  selectedNode: null,
  hoveredNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  setHoveredNode: (node) => set({ hoveredNode: node }),

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
    selectedNode: null,
    hoveredNode: null,
    hoveredEdge: null,
    activeEdgeType: null,
    signaledEdge: null,
    visibleLayers: {
      0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true
    }
  }),

  // Camera state (for smooth transitions)
  cameraTarget: [0, 0, 0],
  setCameraTarget: (target) => set({ cameraTarget: target }),
}))

export default useGraphStore
