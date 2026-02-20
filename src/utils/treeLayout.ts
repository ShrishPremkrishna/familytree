import { graphlib, layout } from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { FamilyTree } from '../types';

const PERSON_W = 180;
const PERSON_H = 80;
const FAMILY_W = 20;
const FAMILY_H = 20;

export function buildTreeLayout(tree: FamilyTree): { nodes: Node[]; edges: Edge[] } {
  const g = new graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  // Add person nodes
  for (const person of tree.persons) {
    g.setNode(person.id, { width: PERSON_W, height: PERSON_H });
  }

  // Add family connector nodes and edges
  for (const family of tree.families) {
    const famNodeId = `fam-${family.id}`;
    g.setNode(famNodeId, { width: FAMILY_W, height: FAMILY_H });

    if (family.partner1Id) {
      g.setEdge(family.partner1Id, famNodeId);
    }
    if (family.partner2Id) {
      g.setEdge(family.partner2Id, famNodeId);
    }
    for (const childId of family.childIds) {
      g.setEdge(famNodeId, childId);
    }
  }

  layout(g);

  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];

  // Person nodes
  for (const person of tree.persons) {
    const n = g.node(person.id);
    if (!n) continue;
    rfNodes.push({
      id: person.id,
      type: 'personNode',
      position: { x: n.x - PERSON_W / 2, y: n.y - PERSON_H / 2 },
      data: { person },
    });
  }

  // Family connector nodes
  for (const family of tree.families) {
    const famNodeId = `fam-${family.id}`;
    const n = g.node(famNodeId);
    if (!n) continue;
    rfNodes.push({
      id: famNodeId,
      type: 'familyConnectorNode',
      position: { x: n.x - FAMILY_W / 2, y: n.y - FAMILY_H / 2 },
      data: { family },
    });
  }

  // Edges
  for (const edge of g.edges()) {
    rfEdges.push({
      id: `${edge.v}->${edge.w}`,
      source: edge.v,
      target: edge.w,
      type: 'smoothstep',
    });
  }

  return { nodes: rfNodes, edges: rfEdges };
}
