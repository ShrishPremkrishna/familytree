export interface Person {
  id: string;
  treeId: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  gender?: 'M' | 'F' | 'U';
  photoUrl?: string; // base64 DataURL
  notes?: string;
}

export interface Family {
  id: string;
  treeId: string;
  partner1Id?: string;
  partner2Id?: string;
  childIds: string[];
}

export interface FamilyTree {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  persons: Person[];
  families: Family[];
}
