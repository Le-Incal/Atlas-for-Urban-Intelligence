# Atlas for Urban Intelligence

An interactive 3D knowledge graph exploring the epistemic architecture of cities. Part of the "Parcel to Planet" book project.

## Overview

The Atlas for Urban Intelligence is a recursive, seven-layer epistemic stack that transforms urban concepts into an explorable visual network. It visualizes the hidden dependencies between physical matter (bedrock, parcels), regulatory constraints (zoning, entitlements), digital systems (sensors, robots), and governance structures.

**55 nodes · 72 edges · 7 layers**

## Features

- **3D Force-Directed Graph** - Navigate through interconnected urban concepts
- **Layer Toggle** - Show/hide the seven epistemic layers
- **Edge Type Filtering** - Illuminate specific relationship types (Energy, Memory, Data, Constraint, Intent, Validation, Reasoning)
- **Interactive Detail Panels** - Click nodes to explore descriptions and connections
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- React 18 + Vite
- Three.js via React Three Fiber
- Tailwind CSS
- Zustand (state management)
- Framer Motion (animations)

## Local Development

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

## Deployment on Railway

1. Push to GitHub repository
2. Connect repository to Railway
3. Railway auto-detects Vite and deploys

The `package.json` includes a `start` script configured for Railway:
```json
"start": "vite preview --host 0.0.0.0 --port $PORT"
```

## Data Structure

### Nodes (`src/data/nodes.json`)
```json
{
  "id": "l0-bedrock",
  "label": "Bedrock",
  "layer": 0,
  "layerName": "Bio-Physical Foundation",
  "color": "#2E2F2C",
  "nodeType": "Geological",
  "clusters": ["structural-L0", "metabolic-flow"],
  "description": "..."
}
```

### Edges (`src/data/edges.json`)
```json
{
  "id": "e-001",
  "source": "l0-energy-grid",
  "target": "l2-iot-sensors",
  "edgeType": "E",
  "edgeTypeName": "Energy",
  "isPrimary": true,
  "direction": "L0 → L2",
  "description": "..."
}
```

## Layer Colors

| Layer | Name | Color |
|-------|------|-------|
| L0 | Bio-Physical | `#2E2F2C` |
| L1 | Observable Reality | `#4A5A63` |
| L2 | Cyber-Physical | `#4F7A74` |
| L3 | Logic/Knowledge | `#5A5F8C` |
| L4 | Agentic Intelligence | `#7A6A9E` |
| L5 | Socio-Economic | `#9B6A5F` |
| L6 | Governance | `#B89A5A` |

## Edge Types

| Type | Name | Currency |
|------|------|----------|
| E | Energy | Metabolic Load / Joules |
| M | Memory | Historical Weight / Trauma |
| D | Data | Information / Telemetry |
| C | Constraint | Regulatory Limit / Geometry |
| I | Intent | Goal / Bias / Will |
| V | Validation | Truth / Confidence |
| R | Reasoning | Intelligence-as-Infrastructure |

## License

© 2025 Kyle MertensMeyer / MertensMeyer DnA
