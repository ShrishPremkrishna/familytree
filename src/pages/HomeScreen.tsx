import { useState, useEffect } from 'react';
import { treeService } from '../db/treeService';
import { importGedcom } from '../utils/gedcomImporter';
import type { FamilyTree } from '../types';

interface HomeScreenProps {
  onOpenTree: (id: string) => void;
}

export function HomeScreen({ onOpenTree }: HomeScreenProps) {
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadTrees() {
    setTrees(await treeService.listTrees());
    setLoading(false);
  }

  useEffect(() => {
    loadTrees();
  }, []);

  async function handleCreate() {
    const name = newName.trim() || 'My Family Tree';
    const tree = await treeService.createTree(name);
    setNewName('');
    onOpenTree(tree.id);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await treeService.deleteTree(id);
    loadTrees();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const tree = await importGedcom(buffer, file.name.replace(/\.ged$/i, ''));
    await treeService.importTree(tree);
    loadTrees();
    e.target.value = '';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Family Tree Builder</h1>
      <p className="text-gray-500 mb-10 text-sm">All data stored locally in your browser.</p>

      {/* New tree form */}
      <div className="flex gap-2 mb-8 w-full max-w-md">
        <input
          className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm"
          placeholder="New tree name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
        >
          Create
        </button>
        <label className="px-4 py-2 bg-white border border-gray-200 rounded text-sm cursor-pointer hover:bg-gray-50">
          Import .ged
          <input type="file" accept=".ged" className="hidden" onChange={handleImport} />
        </label>
      </div>

      {/* Tree list */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : trees.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">
          <p className="text-lg mb-1">No trees yet.</p>
          <p className="text-sm">Create one above or import a GEDCOM file.</p>
        </div>
      ) : (
        <ul className="w-full max-w-md space-y-2">
          {trees.map((tree) => (
            <li
              key={tree.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
            >
              <button
                onClick={() => onOpenTree(tree.id)}
                className="flex-1 text-left"
              >
                <div className="font-medium text-gray-800">{tree.name}</div>
                <div className="text-xs text-gray-400">
                  {tree.persons.length} people · {tree.families.length} families ·{' '}
                  {new Date(tree.updatedAt).toLocaleDateString()}
                </div>
              </button>
              <button
                onClick={() => handleDelete(tree.id, tree.name)}
                className="ml-4 text-gray-300 hover:text-red-400 text-xl leading-none"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
