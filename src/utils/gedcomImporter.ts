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

  // Map from GEDCOM xref (@I1@) to our Person id
  const xrefToPersonId = new Map<string, string>();

  const persons: Person[] = [];
  const families: Family[] = [];

  // Process individuals
  const individuals = gedcom.getIndividualRecord();
  for (let i = 0; i < individuals.length; i++) {
    const indi = individuals[i];
    const xrefs = indi.pointer();
    const xref = xrefs[0];
    if (!xref) continue;

    const personId = uuidv4();
    xrefToPersonId.set(xref, personId);

    // Name
    const nameSelection = indi.getName();
    let firstName = '';
    let lastName = '';
    if (nameSelection.length > 0) {
      // Try GIVN/SURN sub-tags first
      const givenName = nameSelection.getGivenName().value()[0];
      const surname = nameSelection.getSurname().value()[0];
      if (givenName || surname) {
        firstName = givenName ?? '';
        lastName = surname ?? '';
      } else {
        // Fall back to parsing raw value
        const rawName = nameSelection.value()[0];
        if (rawName) {
          const parsed = parseName(rawName);
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
    const birthDate = birth.getDate().value()[0] ?? undefined;
    const birthPlace = birth.getPlace().value()[0] ?? undefined;

    // Death
    const death = indi.getEventDeath();
    const deathDate = death.getDate().value()[0] ?? undefined;
    const deathPlace = death.getPlace().value()[0] ?? undefined;

    persons.push({
      id: personId,
      treeId,
      firstName,
      lastName,
      gender,
      birthDate: birthDate?.toString(),
      birthPlace: birthPlace?.toString(),
      deathDate: deathDate?.toString(),
      deathPlace: deathPlace?.toString(),
    });
  }

  // Process families
  const famRecords = gedcom.getFamilyRecord();
  for (let i = 0; i < famRecords.length; i++) {
    const fam = famRecords[i];

    const husbRef = fam.getHusband().value()[0];
    const wifeRef = fam.getWife().value()[0];
    const childRefs = fam.getChild().value();

    const partner1Id = husbRef ? xrefToPersonId.get(husbRef as string) : undefined;
    const partner2Id = wifeRef ? xrefToPersonId.get(wifeRef as string) : undefined;
    const childIds = (childRefs as string[])
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
