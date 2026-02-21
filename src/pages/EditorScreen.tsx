import { useState, useEffect, useCallback, useRef } from 'react';
import { treeService } from '../db/treeService';
import { TreeCanvas } from '../components/TreeCanvas';
import { PersonPanel } from '../components/PersonPanel';
import { ExportMenu } from '../components/ExportMenu';
import type { FamilyTree, Person } from '../types';

interface EditorScreenProps {
  treeId: string;
  onBack: () => void;
}

export function EditorScreen({ treeId, onBack }: EditorScreenProps) {
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  async function loadTree() {
    const t = await treeService.getTree(treeId);
    setTree(t ?? null);
  }

  useEffect(() => {
    loadTree();
  }, [treeId]);

  const handleTreeChange = useCallback(() => {
    loadTree();
    // If the selected person was deleted or updated, re-sync from fresh tree data
    setSelectedPerson((prev) => prev); // triggers re-render; panel will get fresh person via tree
  }, [treeId]);

  async function handleAddPerson() {
    if (!tree) return;
    const person = await treeService.addPerson(treeId, {
      firstName: 'New',
      lastName: 'Person',
      gender: 'U',
    });
    await loadTree();
    setSelectedPerson(person);
  }

  // Keep selectedPerson in sync with latest tree data
  useEffect(() => {
    if (!tree || !selectedPerson) return;
    const fresh = tree.persons.find((p) => p.id === selectedPerson.id);
    if (fresh) setSelectedPerson(fresh);
    else setSelectedPerson(null);
  }, [tree]);

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <header className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 text-sm">
          ← Back
        </button>
        <h1 className="font-semibold text-gray-800 flex-1 truncate">{tree.name}</h1>
        <button
          onClick={handleAddPerson}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
        >
          + Add Person
        </button>
        <ExportMenu tree={tree} canvasRef={canvasRef} />
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <div ref={canvasRef} className="flex-1 overflow-hidden">
          <TreeCanvas
            tree={tree}
            onPersonSelect={setSelectedPerson}
          />
        </div>
        {selectedPerson && (
          <PersonPanel
            person={selectedPerson}
            tree={tree}
            onClose={() => setSelectedPerson(null)}
            onTreeChange={handleTreeChange}
          />
        )}
      </div>
    </div>
  );
}
