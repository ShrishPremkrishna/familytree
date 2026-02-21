import { readGedcom } from 'read-gedcom';
import { v4 as uuidv4 } from 'uuid';
import type { FamilyTree, Person, Family } from '../types';

function parseName(raw: string): { firstName: string; lastName: string } {
  // GEDCOM name format: "Given /Surname/ Suffix"
  const match = raw.match(/^(.*?)\s*\/([^/]*)\/?(.*)$/);
  if (match) {
    const given = (match[1] + (match[3] ? ' ' + match[3] : '')).trim();
    return { firstName: given, lastName: match[2].trim() };
  }
  return { firstName: raw.trim(), lastName: '' };
}

export async function importGedcom(buffer: ArrayBuffer, treeName: string): Promise<FamilyTree> {
  const gedcom = await readGedcom(buffer);
  const treeId = uuidv4();

  const xrefToPersonId = new Map<string, string>();
  const persons: Person[] = [];
  const families: Family[] = [];

  // Iterate via pointer() to get per-record Selection objects
  const allIndis = gedcom.getIndividualRecord();
  const indiPointers = allIndis.pointer() as (string | null)[];

  for (const xref of indiPointers) {
    if (!xref) continue;

    const indi = gedcom.getIndividualRecord(xref);
    const personId = uuidv4();
    xrefToPersonId.set(xref, personId);

    // Name
    const nameSelection = indi.getName();
    let firstName = '';
    let lastName = '';
    if (nameSelection.length > 0) {
      const givenName = nameSelection.getGivenName().value()[0];
      const surname = nameSelection.getSurname().value()[0];
      if (givenName || surname) {
        firstName = (givenName as string | null) ?? '';
        lastName = (surname as string | null) ?? '';
      } else {
        const rawName = nameSelection.value()[0];
        if (rawName) {
          const parsed = parseName(rawName as string);
          firstName = parsed.firstName;
          lastName = parsed.lastName;
        }
      }
    }

    // Sex
    const sexValues = indi.getSex().value();
    let gender: Person['gender'] = 'U';
    if (sexValues[0] === 'M') gender = 'M';
    else if (sexValues[0] === 'F') gender = 'F';

    // Birth
    const birth = indi.getEventBirth();
    const birthDate = (birth.getDate().value()[0] as string | null) ?? undefined;
    const birthPlace = (birth.getPlace().value()[0] as string | null) ?? undefined;

    // Death
    const death = indi.getEventDeath();
    const deathDate = (death.getDate().value()[0] as string | null) ?? undefined;
    const deathPlace = (death.getPlace().value()[0] as string | null) ?? undefined;

    persons.push({
      id: personId,
      treeId,
      firstName,
      lastName,
      gender,
      birthDate,
      birthPlace,
      deathDate,
      deathPlace,
    });
  }

  // Process families
  const allFams = gedcom.getFamilyRecord();
  const famPointers = allFams.pointer() as (string | null)[];

  for (const famXref of famPointers) {
    if (!famXref) continue;

    const fam = gedcom.getFamilyRecord(famXref);
    const husbRef = fam.getHusband().value()[0] as string | null;
    const wifeRef = fam.getWife().value()[0] as string | null;
    const childRefs = fam.getChild().value() as (string | null)[];

    const partner1Id = husbRef ? xrefToPersonId.get(husbRef) : undefined;
    const partner2Id = wifeRef ? xrefToPersonId.get(wifeRef) : undefined;
    const childIds = childRefs
      .filter((ref): ref is string => ref !== null)
      .map((ref) => xrefToPersonId.get(ref))
      .filter((id): id is string => id !== undefined);

    families.push({
      id: uuidv4(),
      treeId,
      partner1Id,
      partner2Id,
      childIds,
    });
  }

  return {
    id: treeId,
    name: treeName,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    persons,
    families,
  };
}
