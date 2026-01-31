# Atlas for Urban Intelligence

## Master Framework Document

**Version:** 1.0
**Date:** January 30, 2026
**Author:** Kyle MertensMeyer / MertensMeyer DnA
**Project Type:** Interactive 3D Knowledge Graph / Digital Exhibit
**Associated Publication:** "Parcel to Planet" (Book)

---

## Part I: Project Narrative

### What We Are Building

The **Atlas for Urban Intelligence** is an interactive 3D knowledge graph that visualizes the hidden epistemic architecture of cities. Unlike traditional digital twins that render static conditions, the Atlas reveals the *dependency structure* between urban concepts—showing how physical matter (bedrock, parcels) connects to regulatory constraints (zoning, entitlements), digital nervous systems (sensors, robots), socio-economic memory (historical trauma, market cycles), and governance regimes (contested vs. directed).

The visualization renders **55 nodes** and **72 edges** organized into a **seven-layer vertical stack**, where each layer acts as a logic gate for the layer above. Users can orbit, zoom, and fly through this structure, clicking nodes to reveal descriptions and toggling edge types to illuminate specific relationship patterns.

### The Deliverable

A browser-based 3D experience accessible via:
- QR code (mobile/tablet)
- Direct URL (desktop/laptop)
- Museum exhibit display (large format touchscreen)

### The Experience

1. **Landing Page:** Clean white screen with project title, description, and "Enter the Atlas" button
2. **3D Graph:** Force-directed knowledge graph floating in white void
3. **Interactions:**
   - Click node → Glass panel slides in with description, type, clusters, and connections
   - Hover edge → Pulse animation flows from source to target node
   - Click legend item → All edges of that type illuminate (black, thickened)
   - Toggle layer → Show/hide entire epistemic layer

---

### Why We Are Building It

#### 1. Portfolio Exhibit for Wheelwright Prize Jury

The Atlas serves as a portfolio piece demonstrating the intersection of:
- Architectural research methodology
- Computational ontology design
- Interactive data visualization
- Systems thinking about urban complexity

The work must "stand up to the likes of someone like Alex Karp or Elon Musk"—meaning it must be intellectually rigorous, visually sophisticated, and technically bulletproof.

#### 2. Digital Augmented Reality Component for "Parcel to Planet"

The Atlas is the interactive companion to the book, allowing readers to explore the conceptual framework in three dimensions. The QR code in the book links directly to this experience.

#### 3. Proving the Ontology Before Simulation

Phase 01 is explicitly a **structural map of knowledge**, not a live simulator. By rendering the 11 clusters (7 structural + 4 thematic) in 3D space, we prove that the ontology is internally consistent before building the simulation engine in future phases.

#### 4. Making the Invisible Visible

Cities are governed by hidden dependencies that planners, developers, and citizens rarely see:
- How a zoning code (L3) constrains a parcel (L1)
- How historical trauma (L5) brakes agent decisions (L4)
- How energy flows (L0) metabolically limit robot fleets (L2)

The Atlas makes these connections tangible and explorable.

---

### Design Philosophy

#### Visual Hierarchy

Based on reference imagery from co-occurrence networks in physics research:

| Element | Priority | Treatment |
|---------|----------|-----------|
| Nodes | Primary | Colorful, matte, dense, sized by connectivity |
| Edges | Secondary | Thin gray lines (40% black), visible but receding |
| Background | Tertiary | Pure white (#FFFFFF), creating void for graph to float |

#### Nodes Are Primary Meaning

- Each layer has a distinct, sophisticated color
- Colors progress from geological darkness (L0) through analytical cool tones to warm human agency (L5-L6)
- Nodes are matte spheres with 95% opacity
- Size varies by connection count (more connected = larger)

#### Edges Are Secondary Meaning

- Default state: Thin gray lines (black at 40% opacity)
- On hover: Pulse animation from source → target using source node's color
- On type click: All edges of that type turn black and thicken; others fade to 15%
- Edges feel like "forces, traces, currents—not objects"

---

### Color Palette

| Layer | Name | Color | Hex | Description |
|-------|------|-------|-----|-------------|
| L0 | Bio-Physical | Deep Slate / Basalt | `#2E2F2C` | Geological, grounded, pre-instrumental |
| L1 | Observable Reality | Blue-Gray / Atmospheric Steel | `#4A5A63` | Perception, measurement, sensing |
| L2 | Cyber-Physical | Desaturated Teal | `#4F7A74` | Coupling of matter + data |
| L3 | Logic / Knowledge | Muted Indigo | `#5A5F8C` | Abstraction, inference, reasoning |
| L4 | Agentic Intelligence | Soft Amethyst | `#7A6A9E` | Intentionality, agency, deliberation |
| L5 | Socio-Economic | Burnt Umber / Rose-Brown | `#9B6A5F` | Human exchange, value, friction |
| L6 | Governance | Warm Brass / Ochre-Gold | `#B89A5A` | Authority, legitimacy, power |

#### Accent Color

- **Lime Gradient:** `#C8E66E` → `#E8F5C8`
- Used sparingly for pulse animations and highlights
- Creates energy and life without overwhelming the scholarly palette

---

## Part II: Theoretical Framework

### The Epistemic Stack

The Atlas is structured as a **Vertical Epistemic Ladder**. Each layer acts as a logic gate for the layer above, ensuring that abstract intelligence remains grounded in physical and historical reality.

```
┌─────────────────────────────────────────────────────────────┐
│ L6: GOVERNANCE (The "Who")                                  │
│     Regimes, Jurisdictions, Policy-as-Code                  │
├─────────────────────────────────────────────────────────────┤
│ L5: SOCIO-ECONOMIC MEMORY (The "People")                    │
│     Stakeholders, Social Friction, Historical Shocks        │
├─────────────────────────────────────────────────────────────┤
│ L4: AGENTIC INTELLIGENCE (The "Council")                    │
│     Market, Policy, Climate, Infra, Community Agents        │
├─────────────────────────────────────────────────────────────┤
│ L3: LOGIC & KNOWLEDGE (The "Meaning")                       │
│     Zoning Codes, Constraint Objects, Voids                 │
├─────────────────────────────────────────────────────────────┤
│ L2: CYBER-PHYSICAL (The "Nervous System")                   │
│     IoT Sensors, Robots, Drones, AVs                        │
├─────────────────────────────────────────────────────────────┤
│ L1: OBSERVABLE REALITY (The "Identity Spine")               │
│     Parcels, Building Footprints, Rights-of-Way             │
├─────────────────────────────────────────────────────────────┤
│ L0: BIO-PHYSICAL FOUNDATION (The "Earth")                   │
│     Bedrock, Water Tables, Energy Grid, Climate             │
└─────────────────────────────────────────────────────────────┘
```

---

### The Seven Edge Types

Edges represent the "physics" of how information, energy, and authority flow through the urban system.

| Type | Name | Currency | Direction | Function |
|------|------|----------|-----------|----------|
| **E** | Energy | Metabolic Load / Joules | L0 ↔ L2 | Physical power required to run the city |
| **M** | Memory | Historical Weight / Trauma | L5 → L4 | Systemic brake from past shocks |
| **D** | Data | Information / Telemetry | L2 → L3 | Raw observations becoming "City Facts" |
| **C** | Constraint | Regulatory Limit / Geometry | L3 → L1 | Rules that shape physical form |
| **I** | Intent | Goal / Bias / Will | L6 → L4 | Motivation and optimization targets |
| **V** | Validation | Truth / Confidence | L0/L1 → L4 | Reality checks against predictions |
| **R** | Reasoning | Intelligence-as-Infrastructure | L4 → L2 | Brain-to-body connection for robots |

---

### The Eleven Clusters

#### Structural Clusters (7)

1. **Metabolic Cluster (L0):** Bedrock, Water Tables, Solar Potential, Material Reservoirs
2. **Identity Cluster (L1):** Parcels, Building Footprints, Stable IDs, Rights-of-Way
3. **Nervous System Cluster (L2):** IoT Sensors, Actuators, Robots, Drones, Edge Nodes
4. **Logic Cluster (L3):** Zoning Codes, Constraint Objects, Void Markers, Knowledge Graphs
5. **Agency Cluster (L4):** 5 Core Agents, Consensus Artifacts, Probability Cones
6. **Memory Cluster (L5):** Stakeholders, Social Friction Index, Historical Shocks
7. **Governance Cluster (L6):** Regimes, Jurisdictions, Policy-as-Code

#### Thematic Clusters (4)

8. **Risk & Resilience:** L0 Hydrography + L3 Zoning + L5 Fear + L4 Climate Agent
9. **Capital & Value:** L1 Parcels + L4 Market Agent + L5 Economic Memory + L3 Entitlements
10. **Synthetic Labor:** L2 Robots + L3 Voids + L4 Infra Agent + L5 Displacement Risk
11. **Metabolic Flow:** L0 Energy + L2 Actuators + L1 Infrastructure + L4 Infra Agent

---

## Part III: Technical Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18 + Vite | Fast builds, modern DX |
| 3D Engine | Three.js via React Three Fiber | Industry-standard WebGL |
| 3D Helpers | @react-three/drei | Camera controls, HTML overlays |
| State | Zustand | Lightweight reactive state |
| Animation | Framer Motion | UI transitions |
| Styling | Tailwind CSS | Glassmorphism, responsive |
| Deployment | Railway | One-click from GitHub |

### Project Structure

```
atlas-urban-intelligence/
├── public/
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx      # Entry with "Enter the Atlas" button
│   │   ├── AtlasScene.jsx       # Main 3D container + UI overlays
│   │   ├── GraphCanvas.jsx      # Force-directed 3D graph rendering
│   │   ├── LegendPanel.jsx      # Layer + edge type toggles
│   │   └── NodeDetailPanel.jsx  # Glass panel for node info
│   ├── data/
│   │   ├── nodes.json           # 55 nodes with metadata
│   │   └── edges.json           # 72 edges with relationships
│   ├── stores/
│   │   └── graphStore.js        # Zustand state management
│   ├── styles/
│   │   └── globals.css          # Tailwind + custom styles
│   ├── App.jsx                  # View switching
│   └── main.jsx                 # Entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── railway.json                 # Deployment config
├── README.md
├── LICENSE
└── .gitignore
```

---

### Data Schema

#### Node Schema

```json
{
  "id": "l0-bedrock",
  "label": "Bedrock",
  "layer": 0,
  "layerName": "Bio-Physical Foundation",
  "color": "#2E2F2C",
  "nodeType": "Geological",
  "clusters": ["structural-L0", "metabolic-flow"],
  "description": "The lithospheric substrate upon which all urban form rests..."
}
```

#### Edge Schema

```json
{
  "id": "e-001",
  "source": "l0-energy-grid",
  "target": "l2-iot-sensors",
  "edgeType": "E",
  "edgeTypeName": "Energy",
  "isPrimary": true,
  "direction": "L0 → L2",
  "description": "Electrical power flows from the grid to distributed sensors..."
}
```

#### State Management

```javascript
// graphStore.js
{
  currentView: 'landing' | 'atlas',
  selectedNode: null | NodeObject,
  hoveredNode: null | NodeObject,
  hoveredEdge: null | EdgeObject,
  activeEdgeType: null | 'E' | 'M' | 'D' | 'C' | 'I' | 'V' | 'R',
  visibleLayers: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true }
}
```

---

## Part IV: Claude Code Reference

### Key Commands

#### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

#### Deployment

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/USERNAME/atlas-urban-intelligence.git
git branch -M main
git push -u origin main

# Railway auto-deploys from main branch
```

---

### Levers and Triggers

#### Adding New Nodes

1. Edit `src/data/nodes.json`
2. Add node object with required fields: id, label, layer, layerName, color, nodeType, clusters, description
3. Rebuild/redeploy

#### Adding New Edges

1. Edit `src/data/edges.json`
2. Add edge object with required fields: id, source, target, edgeType, edgeTypeName, isPrimary, direction, description
3. Ensure source and target IDs exist in nodes.json
4. Rebuild/redeploy

#### Adjusting Visual Parameters

| Parameter | File | Location |
|-----------|------|----------|
| Layer colors | `tailwind.config.js` | `theme.extend.colors` |
| Node size | `GraphCanvas.jsx` | `size` calculation in node map |
| Edge opacity | `GraphCanvas.jsx` | `opacity` variable in Edge component |
| Force layout | `GraphCanvas.jsx` | `calculatePositions()` function |
| Glass panel styling | `globals.css` | `.glass-panel` class |

#### Changing Layout Algorithm

The force-directed layout is in `GraphCanvas.jsx` → `calculatePositions()`. Key parameters:

```javascript
const layerHeight = 20    // Vertical spacing between layers
const radius = 25         // Base radius for circular arrangement
const iterations = 50     // Force simulation iterations
const repulsionThreshold = 15   // Minimum distance between nodes
const attractionThreshold = 30  // Ideal edge length
```

#### Common Modifications

**Add a new edge type:**
1. Add to `edges.json` → edgeTypes object
2. Add to `LegendPanel.jsx` → EDGE_TYPES array
3. Add color to edge type if needed

**Change node sizing logic:**
```javascript
// In GraphCanvas.jsx
const size = 1.5 + Math.min(connections * 0.3, 3)
// Adjust 1.5 (base size), 0.3 (growth rate), 3 (max bonus)
```

**Adjust pulse animation speed:**
```javascript
// In GraphCanvas.jsx → Edge component → useFrame
setPulseProgress(prev => Math.min(prev + delta * 0.5, 1))
// Adjust 0.5 to change speed (higher = faster)
```

---

## Part V: Layer Definitions

### Layer 6: Governance, Rights, and Policy (The "Who")

- **Functional Scope:** This layer defines enforceable authority, jurisdictions, and the operating rulebook for the city.
- **Regime Type Attribute:** Distinguishes between **Contested** (prioritizing litigation and pluralist friction) and **Directed** (prioritizing state-led scaling and metabolic efficiency) governance models.
- **Historical Integration:** Models "Legacy Governance" to track how firewalled societies create divergent urban equilibria over time.
- **Core Systems:** Neo-Governance, International Organizations, Jurisdictions, and Tort Law.
- **Function:** Enforces **Policy-as-Code**, managing permissions for both humans and agents.

### Layer 5: Socio-Economic and Human Memory (The "People")

- **Functional Scope:** Maps demand, equity, labor, and market feasibility drivers.
- **Stakes & Distribution:** Foregrounding "Who Benefits / Who Bears Costs" through explicit stakeholder nodes (e.g., community caregivers vs. logistics corporations).
- **Psychographic Logic:** Houses the **Fear/Preparation Index** (Social Friction Index), which uses historical shocks like market crashes or displacement events to modulate present density acceptance.
- **Core Systems:** Demography, Market Potential, Income Distribution, and Sociological Memory.
- **Function:** Houses the **Fear/Preparation Index**, modeling how historical shocks (bubbles, layoffs) create current social friction.

### Layer 4: Agentic Intelligence Overlay (The "Inference Council")

- **Functional Scope:** A multi-agent council (Market, Policy, Climate, Infra, Community) that debates plural urban futures rather than seeking a single "optimized" answer.
- **Reasoning Bridge (R):** Provides the cognitive infrastructure for Layer 2 actors, enabling physical systems to navigate complex social and legal environments.
- **Spatial Logic:** Disagreements between agents are visualized spatially to reveal "Scenario Fields" and probability cones.
- **Core Systems:** Multi-Agent Coordination, LLMs, and Task Executors.
- **Function:** Five core agents (Market, Policy, Climate, Infra, Community) debate competing urban futures.

### Layer 3: Logic, Processing, and Knowledge (The "Meaning")

- **Functional Scope:** Translates unreadable text and laws into computable "Constraint Objects" (e.g., FAR, setbacks, and height limits).
- **Constraint Resolution:** Operates as a "Zoning Graph" where metrics are clickable, auditable, and bound to physical parcels.
- **Regulatory Voids:** Identifies "Structural Gaps" where emerging synthetic occupancy (e.g., high-density battery storage or autonomous flows) currently lacks established code protocols.
- **Core Systems:** Knowledge Graphs, Computable Constraints, and Entity Resolution.
- **Function:** Translates raw data and PDF codes into a **Golden Record** of "City Facts".

### Layer 2: Technical and Cyber-Physical (The "Nervous System")

- **Functional Scope:** The city's sensory network, including IoT actuators, telecommunications, and robotic channels for Embodied AI.
- **Embodied Action:** Enables urban service robots and actuators to move through and respond to the physical environment in real-time.
- **Latency & Lineage:** Tracks every technical shift and sensor event with a timestamp and audit trail for historical verification.
- **Core Systems:** IoT Sensors, Urban Actuators, and Telecommunications.
- **Function:** Enables **Embodied AI** (robots, drones) to sense and move through the city.

### Layer 1: Observable Reality and Built Environment (The "Hardware")

- **Functional Scope:** The "Place Graph" backbone consisting of parcels, building footprints, and infrastructure.
- **Identity Spine:** Enforces stable IDs across every asset, ensuring all other layers "snap" to the same physical world coordinate.
- **The 3Cs Spatial Mode:** Classifies nodes based on their human-synthetic interaction typology: **Contest** (friction), **Coexist** (negotiation), or **Converge** (integration).
- **Core Systems:** Parcels, Building Footprints, Infrastructure, and Transit Networks.
- **Function:** Provides the **Identity Spine** (Place Graph) where every asset has a Stable ID.

### Layer 0: Bio-Physical Foundation and Metabolism (The "Earth")

- **Functional Scope:** Models the planetary conditions making urbanization possible: bedrock, hydrography, and material reservoirs (sand, steel, timber).
- **Geospatial Substrate:** Integrates soil chemistry and energy circulation into a shared coordinate truth.
- **Evolutionary Logic:** Uses historical flood depths and climate cycles to establish the "Baseline City" constraints before any form is proposed.
- **Core Systems:** Geology, Hydrography, Energy Potentials, and Material Reservoirs.
- **Function:** Tracks the **Planetary Boundaries** and "Material Metabolism" (carbon, soil, water).

---

## Part VI: Edge Type Definitions

### 1. Energy (E)

- **Currency:** Metabolic Load / Joules
- **Direction:** L0 (Grid/Earth) ↔ L2 (Embodied AI)
- **Function:** Represents the physical power required to run the city. It flows from the grid to the robot/sensor. If a robot fleet (L2) scales up, the Energy edge thickens, potentially overloading the L0 node.

### 2. Memory (M)

- **Currency:** Historical Weight / Trauma
- **Direction:** L5 (Past Events) → L4 (Agentic Logic)
- **Function:** This is the "Systemic Brake." It carries the weight of past shocks (e.g., "2008 Crash"). If the Memory edge is heavy (High Fear), it forces the Agents to reject risky growth scenarios.

### 3. Data (D)

- **Currency:** Information / Telemetry
- **Direction:** L2 (Sensing) → L3 (Logic)
- **Function:** Raw observations (e.g., "lidar point cloud") flowing up to be translated into "City Facts" (e.g., "There is a wall here").

### 4. Constraint (C)

- **Currency:** Regulatory Limit / Geometry
- **Direction:** L3 (Law) → L1 (Physical Form)
- **Function:** The "Shape Maker." This edge transmits the rules (FAR, Setbacks) that physically mold the massing of buildings and parcels.

### 5. Intent (I)

- **Currency:** Goal / Bias / Will
- **Direction:** L6 (Policy) → L4 (Agentic Council)
- **Function:** Represents the "Motivation." It tells the agents what to optimize for (e.g., "Maximize Profit" or "Maximize Equity"). It is the driver of action.

### 6. Validation (V)

- **Currency:** Truth / Confidence
- **Direction:** L0/L1 (Reality) → L4 (Agent Prediction)
- **Function:** The "Reality Check." It compares the Agent's prediction against the actual sensor readings. If they don't match, the agent's confidence score drops.

### 7. Reasoning (R)

- **Currency:** Intelligence-as-Infrastructure
- **Direction:** L4 (Agentic Council) → L2 (Embodied AI)
- **Function:** The "Brain-to-Body" connection. Physical robots (L2) subscribe to this edge to access the high-level ethical and navigational logic of the Council (L4). Without this edge, robots are just dumb hardware.

---

## Part VII: Node Connectivity Map

### Layer 0: Bio-Physical Foundation (The Earth)

**1. Geological & Hydrographic Nodes**
- → Connects To: L1 Parcels (via C Constraint), L4 Agents (via V Validation)
- ← Connects From: L0 Evolutionary Logic (via M Memory)

**2. Atmospheric/Energy Nodes**
- → Connects To: L2 Compute/Robots (via E Energy), L4 Climate Agent (via V Validation)
- ← Connects From: Planetary Systems (via E Energy)

### Layer 1: Observable Reality (The Identity Spine)

**3. Land Assets (Parcels)**
- → Connects To: L4 Agents (via V Validation), L5 Stakeholders (via D Data)
- ← Connects From: L3 Zoning (via C Constraint)

**4. Mobility Assets & Spatial Modes**
- → Connects To: L2 Embodied AI (via C Constraint), L4 Infrastructure Agent (via V Validation)
- ← Connects From: L1 Parcels (via D Data)

### Layer 2: Technical & Cyber-Physical (The Nervous System)

**5. Embodied AI Nodes (Robots/Drones)**
- → Connects To: L1 Physical Space (via I Intent), L5 Stakeholders (via M Memory)
- ← Connects From: L4 Agentic Council (via R Reasoning), L0 Grid (via E Energy)

**6. Sensing Nodes**
- → Connects To: L3 Logic (via D Data), L4 Agents (via V Validation)
- ← Connects From: L1 Built Environment (via C Host)

### Layer 3: Logic & Informational (The Meaning)

**7. Constraint Nodes (Zoning/Code)**
- → Connects To: L1 Parcels (via C Constraint)
- ← Connects From: L6 Policy (via I Intent), L2 Sensors (via D Data)

**8. Structural Gap Nodes (Voids)**
- → Connects To: L4 Agents (via M Memory), L6 Governance (via V Validation)
- ← Connects From: L3 Constraints (via C Absence/Failure)

### Layer 4: Agentic Intelligence (The Council)

**9. The 5 Core Agents**
- → Connects To: L2 Embodied AI (via R Reasoning), L3 Logic (via I Intent), L6 Governance (via D Data)
- ← Connects From: L5 Memory (via M Memory), L0/L1 (via V Validation)

### Layer 5: Socio-Economic (Memory)

**10. Psychographic & Stakeholder Nodes**
- → Connects To: L4 Agents (via M Memory), L6 Governance (via I Intent)
- ← Connects From: L1 Assets (via D Data), L2 Embodied AI (via I Intent)

### Layer 6: Governance (The Who)

**11. Regime & Policy Nodes**
- → Connects To: L4 Agents (via I Intent), L3 Constraints (via I Intent)
- ← Connects From: L5 Stakeholders (via I Intent), L4 Agents (via V Validation)

---

## Part VIII: Future Phases

### Phase 02: Simulation Engine

- Real urban data integration (parcel databases, zoning APIs)
- Agent deliberation with actual LLM reasoning
- Time-series simulation of shock propagation
- Scenario comparison tools

### Phase 03: Collaborative Platform

- Multi-user exploration
- Annotation and commenting
- Export to planning documents
- Integration with GIS tools

---

## Part IX: Deployment Reference

### Railway Configuration

**File:** `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npx serve dist -s -l ${PORT:-3000}",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Environment

- **Node.js:** 18+
- **Build Output:** `dist/` directory
- **Server:** `serve` (static file server)
- **Port:** Dynamically assigned by Railway via `$PORT`

### URLs

- **Production:** `atlas-for-urban-intelligence-production.up.railway.app`
- **QR Code Target:** Same as production URL

---

## Part X: Ontology Statistics

### Node Count by Layer

| Layer | Count |
|-------|-------|
| L0: Bio-Physical | 8 |
| L1: Observable Reality | 10 |
| L2: Cyber-Physical | 7 |
| L3: Logic/Knowledge | 9 |
| L4: Agentic Intelligence | 7 |
| L5: Socio-Economic | 9 |
| L6: Governance | 8 |
| **Total** | **55** |

### Edge Count by Type

| Type | Count |
|------|-------|
| E (Energy) | 7 |
| M (Memory) | 12 |
| D (Data) | 13 |
| C (Constraint) | 12 |
| I (Intent) | 11 |
| V (Validation) | 10 |
| R (Reasoning) | 8 |
| **Total** | **72** |

---

*Document generated: January 30, 2026*
*Atlas for Urban Intelligence v1.0*
