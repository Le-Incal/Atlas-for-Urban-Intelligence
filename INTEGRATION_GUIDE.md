# Atlas v2.2 Integration Guide

## Files Generated

| File | Nodes | Edges | Description |
|------|-------|-------|-------------|
| `nodes.json` | 235 | - | Full ontology with scale factors |
| `edges.json` | - | 557 | All relationships with 7 edge types |

## Installation

1. Replace existing data files:
```bash
cp nodes.json src/data/nodes.json
cp edges.json src/data/edges.json
```

## GraphCanvas.jsx Modification

Find the node sizing calculation (likely in a `useMemo` or render loop) and update to use `scale`:

### Before (typical pattern)
```jsx
const size = 1.5 + Math.min(connections * 0.3, 3)
```

### After (with scale factor)
```jsx
// Base size from connectivity, modulated by scale factor
const baseSize = 1.5 + Math.min(connections * 0.3, 3)
const size = baseSize * (node.scale || 1.0)
```

Or for pure scale-driven sizing:
```jsx
// Pure scale-driven (ignores connectivity)
const size = 2.0 * (node.scale || 1.0)
```

## Scale Factor Tiers

| Tier | Range | Count | % | Visual Effect |
|------|-------|-------|---|---------------|
| T1 | 1.5-2.0 | 18 | 7.7% | Hub nodes: Parcels, Energy Grid, Knowledge Graph |
| T2 | 1.2-1.49 | 52 | 22.1% | Major infrastructure and key agents |
| T3 | 0.85-1.19 | 149 | 63.4% | Standard nodes (baseline) |
| T4 | 0.5-0.84 | 16 | 6.8% | Detail/leaf nodes |

## Key Hub Nodes (T1)

These nodes anchor the visual hierarchy:

- `l1-001` Parcels (1.8) - Identity Spine anchor
- `l0-020` Energy Grid (1.8) - Metabolic hub
- `l3-017` Knowledge Graph (1.7) - Logic layer hub
- `l4-001` Market Agent (1.6) - Agentic council lead
- `l6-009` Governance Systems (1.6) - Policy anchor
- `l5-015` Stakeholders (1.5) - Social layer hub

## Validation Checklist

- [ ] All 235 nodes render
- [ ] All 557 edges connect valid nodes
- [ ] No orphan nodes (verified: 0)
- [ ] Scale factors produce visual hierarchy
- [ ] Layer colors match specification:
  - L0: #2E2F2C (Deep Slate)
  - L1: #4A5A63 (Blue-Gray)
  - L2: #4F7A74 (Desaturated Teal)
  - L3: #5A5F8C (Muted Indigo)
  - L4: #7A6A9E (Soft Amethyst)
  - L5: #9B6A5F (Burnt Umber)
  - L6: #B89A5A (Warm Brass)

## Edge Type Distribution

| Type | Count | Description |
|------|-------|-------------|
| E (Energy) | 34 | Metabolic flows L0↔L2 |
| M (Memory) | 68 | Historical brake L5→L4 |
| D (Data) | 133 | Telemetry flows |
| C (Constraint) | 106 | Regulatory limits L3/L6→L1 |
| I (Intent) | 116 | Goal/will flows |
| V (Validation) | 68 | Reality checks L0/L1→L4 |
| R (Reasoning) | 32 | Brain-to-body L4→L2 |

---
*Generated: January 31, 2026*
*Atlas for Urban Intelligence v2.2*
