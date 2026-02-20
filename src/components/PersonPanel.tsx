import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { treeService } from '../db/treeService';
import type { Person, FamilyTree } from '../types';

interface PersonPanelProps {
  person: Person;
  tree: FamilyTree;
  onClose: () => void;
  onTreeChange: () => void;
}

export function PersonPanel({ person, tree, onClose, onTreeChange }: PersonPanelProps) {
  const [form, setForm] = useState<Omit<Person, 'id' | 'treeId'>>({
    firstName: person.firstName,
    lastName: person.lastName,
    gender: person.gender,
    birthDate: person.birthDate ?? '',
    birthPlace: person.birthPlace ?? '',
    deathDate: person.deathDate ?? '',
    deathPlace: person.deathPlace ?? '',
    notes: person.notes ?? '',
    photoUrl: person.photoUrl,
  });
  const [saving, setSaving] = useState(false);
  const [partnerTargetId, setPartnerTargetId] = useState('');
  const [childFamilyId, setChildFamilyId] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      firstName: person.firstName,
      lastName: person.lastName,
      gender: person.gender,
      birthDate: person.birthDate ?? '',
      birthPlace: person.birthPlace ?? '',
      deathDate: person.deathDate ?? '',
      deathPlace: person.deathPlace ?? '',
      notes: person.notes ?? '',
      photoUrl: person.photoUrl,
    });
  }, [person.id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await treeService.updatePerson(tree.id, person.id, {
        ...form,
        birthDate: form.birthDate || undefined,
        birthPlace: form.birthPlace || undefined,
        deathDate: form.deathDate || undefined,
        deathPlace: form.deathPlace || undefined,
        notes: form.notes || undefined,
      });
      onTreeChange();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${person.firstName} ${person.lastName}?`)) return;
    await treeService.deletePerson(tree.id, person.id);
    onClose();
    onTreeChange();
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      set('photoUrl', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleAddPartner() {
    if (!partnerTargetId) return;
    await treeService.addFamily(tree.id, {
      partner1Id: person.id,
      partner2Id: partnerTargetId,
      childIds: [],
    });
    setPartnerTargetId('');
    onTreeChange();
  }

  async function handleAddToFamily() {
    if (!childFamilyId) return;
    const family = tree.families.find((f) => f.id === childFamilyId);
    if (!family) return;
    if (family.childIds.includes(person.id)) return;
    await treeService.updateFamily(tree.id, childFamilyId, {
      childIds: [...family.childIds, person.id],
    });
    setChildFamilyId('');
    onTreeChange();
  }

  const otherPersons = tree.persons.filter((p) => p.id !== person.id);

  // Families this person is already a partner in
  const partnerFamilies = tree.families.filter(
    (f) => f.partner1Id === person.id || f.partner2Id === person.id
  );

  // IDs of current partners
  const currentPartnerIds = new Set(
    partnerFamilies.flatMap((f) => [f.partner1Id, f.partner2Id]).filter((id): id is string => !!id && id !== person.id)
  );

  const availablePartners = otherPersons.filter((p) => !currentPartnerIds.has(p.id));

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 text-sm truncate">
          {person.firstName || person.lastName ? `${person.firstName} ${person.lastName}`.trim() : 'Person'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Photo */}
        <div className="flex flex-col items-center gap-2">
          {form.photoUrl ? (
            <img src={form.photoUrl} alt="Photo" className="w-20 h-20 rounded-full object-cover border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-3xl border">
              {(form.firstName?.[0] ?? '?').toUpperCase()}
            </div>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <button
            onClick={() => photoInputRef.current?.click()}
            className="text-xs text-blue-600 hover:underline"
          >
            {form.photoUrl ? 'Change photo' : 'Add photo'}
          </button>
          {form.photoUrl && (
            <button onClick={() => set('photoUrl', undefined)} className="text-xs text-red-400 hover:underline">
              Remove
            </button>
          )}
        </div>

        {/* Basic Info */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Basic Info</h3>
          <div className="space-y-2">
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              placeholder="First name"
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
            />
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
            />
            <select
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              value={form.gender ?? 'U'}
              onChange={(e) => set('gender', e.target.value as Person['gender'])}
            >
              <option value="U">Unknown gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </section>

        {/* Birth */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Birth</h3>
          <div className="space-y-2">
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              placeholder="Birth date"
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
            />
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              placeholder="Birth place"
              value={form.birthPlace}
              onChange={(e) => set('birthPlace', e.target.value)}
            />
          </div>
        </section>

        {/* Death */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Death</h3>
          <div className="space-y-2">
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              placeholder="Death date"
              value={form.deathDate}
              onChange={(e) => set('deathDate', e.target.value)}
            />
            <input
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
              placeholder="Death place"
              value={form.deathPlace}
              onChange={(e) => set('deathPlace', e.target.value)}
            />
          </div>
        </section>

        {/* Notes */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</h3>
          <textarea
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm resize-none"
            rows={3}
            placeholder="Notes..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </section>

        {/* Relationships */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Relationships</h3>

          {/* Add partner */}
          {availablePartners.length > 0 && (
            <div className="flex gap-1 mb-2">
              <select
                className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm"
                value={partnerTargetId}
                onChange={(e) => setPartnerTargetId(e.target.value)}
              >
                <option value="">Add partner...</option>
                {availablePartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddPartner}
                disabled={!partnerTargetId}
                className="px-2 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-40"
              >
                Link
              </button>
            </div>
          )}

          {/* Add as child of existing family */}
          {tree.families.length > 0 && (
            <div className="flex gap-1">
              <select
                className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm"
                value={childFamilyId}
                onChange={(e) => setChildFamilyId(e.target.value)}
              >
                <option value="">Add as child of...</option>
                {tree.families.map((f) => {
                  const p1 = tree.persons.find((p) => p.id === f.partner1Id);
                  const p2 = tree.persons.find((p) => p.id === f.partner2Id);
                  const label = [p1, p2]
                    .filter(Boolean)
                    .map((p) => `${p!.firstName} ${p!.lastName}`.trim())
                    .join(' & ') || 'Unnamed family';
                  return (
                    <option key={f.id} value={f.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={handleAddToFamily}
                disabled={!childFamilyId}
                className="px-2 py-1.5 bg-blue-600 text-white rounded text-sm disabled:opacity-40"
              >
                Link
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Footer actions */}
      <div className="border-t border-gray-200 px-4 py-3 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded py-1.5 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded text-sm border border-red-200"
        >
          Delete
        </button>
      </div>
    </aside>
  );
}
