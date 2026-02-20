import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

export function FamilyConnectorNode(_props: NodeProps) {
  return (
    <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-gray-400">
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
