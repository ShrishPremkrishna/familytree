import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import type { FamilyTree, Person, Family } from '../types';

export const treeService = {
  async listTrees(): Promise<FamilyTree[]> {
    return db.trees.orderBy('updatedAt').reverse().toArray();
  },

  async getTree(id: string): Promise<FamilyTree | undefined> {
    return db.trees.get(id);
  },

  async createTree(name: string): Promise<FamilyTree> {
    const tree: FamilyTree = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      persons: [],
      families: [],
    };
    await db.trees.put(tree);
    return tree;
  },

  async renameTree(id: string, name: string): Promise<void> {
    const tree = await db.trees.get(id);
    if (!tree) throw new Error('Tree not found');
    await db.trees.put({ ...tree, name, updatedAt: Date.now() });
  },

  async deleteTree(id: string): Promise<void> {
    await db.trees.delete(id);
  },

  async addPerson(treeId: string, data: Omit<Person, 'id' | 'treeId'>): Promise<Person> {
    const tree = await db.trees.get(treeId);
    if (!tree) throw new Error('Tree not found');
    const person: Person = { ...data, id: uuidv4(), treeId };
    tree.persons.push(person);
    tree.updatedAt = Date.now();
    await db.trees.put(tree);
    return person;
  },

  async updatePerson(treeId: string, personId: string, data: Partial<Omit<Person, 'id' | 'treeId'>>): Promise<void> {
    const tree = await db.trees.get(treeId);
    if (!tree) throw new Error('Tree not found');
    const idx = tree.persons.findIndex((p) => p.id === personId);
    if (idx === -1) throw new Error('Person not found');
    tree.persons[idx] = { ...tree.persons[idx], ...data };
    tree.updatedAt = Date.now();
    await db.trees.put(tree);
  },

  async deletePerson(treeId: string, personId: string): Promise<void> {
    const tree = await db.trees.get(treeId);
    if (!tree) throw new Error('Tree not found');
    tree.persons = tree.persons.filter((p) => p.id !== personId);
    // Remove from all families
    tree.families = tree.families
      .map((f) => ({
        ...f,
        partner1Id: f.partner1Id === personId ? undefined : f.partner1Id,
        partner2Id: f.partner2Id === personId ? undefined : f.partner2Id,
        childIds: f.childIds.filter((c) => c !== personId),
      }))
      // Remove empty families (no partners, no children)
      .filter((f) => f.partner1Id || f.partner2Id || f.childIds.length > 0);
    tree.updatedAt = Date.now();
    await db.trees.put(tree);
  },

  async addFamily(treeId: string, data: Omit<Family, 'id' | 'treeId'>): Promise<Family> {
    const tree = await db.trees.get(treeId);
    if (!tree) throw new Error('Tree not found');
    const family: Family = { ...data, id: uuidv4(), treeId };
    tree.families.push(family);
    tree.updatedAt = Date.now();
    await db.trees.put(tree);
    return family;
  },

  async updateFamily(treeId: string, familyId: string, data: Partial<Omit<Family, 'id' | 'treeId'>>): Promise<void> {
    const tree = await db.trees.get(treeId);
    if (!tree) throw new Error('Tree not found');
    const idx = tree.families.findIndex((f) => f.id === familyId);
    if (idx === -1) throw new Error('Family not found');
    tree.families[idx] = { ...tree.families[idx], ...data };
    tree.updatedAt = Date.now();
    await db.trees.put(tree);
  },

  async deleteFamily(treeId: string, familyId: string): Promise<void> {
    const tree = await db.trees.get(treeId);
    if (!tree) throw new Error('Tree not found');
    tree.families = tree.families.filter((f) => f.id !== familyId);
    tree.updatedAt = Date.now();
    await db.trees.put(tree);
  },

  async importTree(tree: FamilyTree): Promise<void> {
    await db.trees.put({ ...tree, updatedAt: Date.now() });
  },
};
