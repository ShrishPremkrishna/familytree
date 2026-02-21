# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # tsc -b && vite build (type-check + bundle)
npm run lint      # eslint
npm run preview   # serve the production build locally
```

There are no tests currently.

## Architecture

Frontend-only SPA. No backend, no auth. All data lives in IndexedDB via Dexie.

### Data model (`src/types/index.ts`)

Three types: `Person`, `Family`, `FamilyTree`.

- A `FamilyTree` is the unit of storage — it embeds all `persons[]` and `families[]` arrays directly. Dexie stores one document per tree (no normalized tables).
- `Family` is a join record: up to two `partner1Id`/`partner2Id` plus `childIds[]`. Person objects never embed relationship pointers — all relationships live in Family records.
- `Person.photoUrl` stores photos as base64 DataURLs directly on the person object.

### Data layer (`src/db/`)

- `database.ts` — Dexie schema. Single table: `trees`, keyed by `id`.
- `treeService.ts` — **the only place that touches IndexedDB**. All reads/writes go through this object. Mutation pattern: fetch whole tree → mutate in memory → `db.trees.put(tree)`. `deletePerson` also cleans up all Family references to that person.

### State management

No global state library. `EditorScreen` owns the `FamilyTree` object in React state and passes it down. After any mutation via `treeService`, `EditorScreen.loadTree()` re-fetches the whole tree and re-renders. `TreeCanvas` detects the changed tree prop via a `useEffect` and rebuilds the layout.

### Layout engine (`src/utils/treeLayout.ts`)

Converts a `FamilyTree` into React Flow nodes + edges using Dagre for automatic top-down layout. Two node types:
- `personNode` — the 180×80 person cards
- `familyConnectorNode` — 20×20 dot that sits between partners and their children

Partners connect *down* to the connector node; the connector node connects *down* to children. `buildTreeLayout` is called fresh on every tree change (no incremental updates).

**Dagre import quirk**: `@dagrejs/dagre`'s ESM bundle only exports `default`, so `vite.config.ts` aliases the package to its CJS file so named imports (`dagre.graphlib`, `dagre.layout`) work correctly in both dev and production builds.

### React Flow (`src/components/TreeCanvas.tsx`)

Custom node types must be declared outside the component (the `nodeTypes` constant) to avoid React Flow re-registering them on every render. NodeProps generics require `Node<DataShape, 'nodeTypeName'>` as the type argument — not just `{ data: DataShape }`.

### GEDCOM import (`src/utils/gedcomImporter.ts`)

Uses `read-gedcom`. The API is selection-based: `gedcom.getIndividualRecord()` returns a collection; iterate via `.pointer()` to get xref strings, then call `gedcom.getIndividualRecord(xref)` to get a typed `SelectionIndividualRecord` with methods like `.getName()`, `.getSex()`, `.getEventBirth()`. Direct array indexing (`individuals[i]`) gives raw `TreeNode` objects without those methods.

### Exports (`src/utils/exporters.ts`)

PNG/PDF use `html-to-image@1.11.11` (version pinned — do not upgrade, later versions have breaking changes) on the canvas DOM element ref passed down from `EditorScreen`. JSON/CSV work directly from the `FamilyTree` object.
