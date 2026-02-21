import { useCallback, useEffect, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, NodeMouseHandler, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PersonNode } from './PersonNode';
import { FamilyConnectorNode } from './FamilyConnectorNode';
import { buildTreeLayout } from '../utils/treeLayout';
import type { FamilyTree, Person } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = Node<Record<string, any>>;

const nodeTypes: NodeTypes = {
  personNode: PersonNode as NodeTypes[string],
  familyConnectorNode: FamilyConnectorNode as NodeTypes[string],
};

interface TreeCanvasProps {
  tree: FamilyTree;
  onPersonSelect: (person: Person | null) => void;
}

export function TreeCanvas({ tree, onPersonSelect }: TreeCanvasProps) {
  const initialLayout = useMemo(() => buildTreeLayout(tree), []);
  const [nodes, setNodes, onNodesChange] = useNodesState<AnyNode>(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

  // Re-sync when tree data changes
  useEffect(() => {
    const { nodes: n, edges: e } = buildTreeLayout(tree);
    setNodes(n);
    setEdges(e);
  }, [tree]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      if (node.type === 'personNode') {
        const person = (node.data as { person: Person }).person;
        onPersonSelect(person);
      }
    },
    [onPersonSelect]
  );

  const onPaneClick = useCallback(() => {
    onPersonSelect(null);
  }, [onPersonSelect]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
