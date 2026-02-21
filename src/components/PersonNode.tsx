import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { Person } from '../types';

export type PersonNodeType = Node<{ person: Person }, 'personNode'>;

export function PersonNode({ data, selected }: NodeProps<PersonNodeType>) {
  const { person } = data;
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unknown';
  const years = [person.birthDate, person.deathDate].filter(Boolean).join(' – ');

  return (
    <div
      className={`w-[180px] bg-white rounded-lg shadow border-2 cursor-pointer select-none overflow-hidden
        ${selected ? 'border-blue-500' : 'border-gray-200'}
      `}
      style={{
        borderTopWidth: 4,
        borderTopColor: person.gender === 'M' ? '#60a5fa' : person.gender === 'F' ? '#f472b6' : '#9ca3af',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="flex items-center gap-2 p-2">
        {person.photoUrl ? (
          <img src={person.photoUrl} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 text-lg font-medium">
            {name[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium text-sm text-gray-800 truncate">{name}</div>
          {years && <div className="text-xs text-gray-400 truncate">{years}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}
