import Dexie, { type Table } from 'dexie';
import type { FamilyTree } from '../types';

class FamilyTreeDB extends Dexie {
  trees!: Table<FamilyTree, string>;

  constructor() {
    super('FamilyTreeDB');
    this.version(1).stores({
      trees: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new FamilyTreeDB();
