import {
  blankMoleculeDocument,
  blankOrganismDocument,
  designAtomParentError,
  designAtomUsedBy,
  designLibraryError,
  designMoleculeUsedBy,
  designPresetError,
  parseDesignAtomPreset,
  parseDesignCategory,
  parseDesignColourTokens,
  parseDesignId,
  parseDesignMoleculeDocument,
  parseDesignOrganismDocument,
  type DesignAtomPreset,
  type DesignCategory,
  type DesignColourScheme,
  type DesignMolecule,
  type DesignOrganism,
} from '@so/model';
import {assertDesignAtomPreset, assertDesignNodes} from '@so/component';
import createSitesServiceClient from '@/lib/supabase/createSitesServiceClient';

export interface DesignLibrary {
  readonly atoms: readonly DesignAtomPreset[];
  readonly colourSchemes: readonly DesignColourScheme[];
  readonly molecules: readonly DesignMolecule[];
  readonly organisms: readonly DesignOrganism[];
}

export function designNameOk(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 80;
}

function libraryError(message: string | undefined): void {
  if (message !== undefined) {
    throw new Error(message);
  }
}

function atomFromRow(row: {id: string; name: string; base: string; parent_id?: string | null; fields: unknown; style: unknown}): DesignAtomPreset {
  return parseDesignAtomPreset({
    id: row.id,
    name: row.name,
    base: row.base,
    ...(typeof row.parent_id === 'string' ? {parentId: row.parent_id} : {}),
    fields: row.fields,
    style: row.style,
  });
}

function colourFromRow(row: {id: string; name: string; tokens: unknown}): DesignColourScheme {
  return {id: row.id, name: row.name, tokens: parseDesignColourTokens(row.tokens)};
}

function moleculeFromRow(row: {id: string; name: string; document: unknown}): DesignMolecule {
  return {id: row.id, name: row.name, document: parseDesignMoleculeDocument(row.document)};
}

function organismFromRow(row: {id: string; name: string; category: string; document: unknown}): DesignOrganism {
  return {
    id: row.id,
    name: row.name,
    category: parseDesignCategory(row.category),
    document: parseDesignOrganismDocument(row.document),
  };
}

export async function listDesignLibrary(): Promise<DesignLibrary> {
  const supabase = createSitesServiceClient();
  const [atoms, colours, molecules, organisms] = await Promise.all([
    supabase.from('design_atom').select('id, name, base, parent_id, fields, style').order('name'),
    supabase.from('design_colour_scheme').select('id, name, tokens').order('name'),
    supabase.from('design_molecule').select('id, name, document').order('name'),
    supabase.from('design_organism').select('id, name, category, document').order('name'),
  ]);
  if (atoms.error) {
    throw new Error(atoms.error.message || 'Could not list atoms');
  }
  if (colours.error) {
    throw new Error(colours.error.message || 'Could not list colour schemes');
  }
  if (molecules.error) {
    throw new Error(molecules.error.message || 'Could not list molecules');
  }
  if (organisms.error) {
    throw new Error(organisms.error.message || 'Could not list sections');
  }
  return {
    atoms: (atoms.data ?? []).map((row) => atomFromRow(row as {id: string; name: string; base: string; fields: unknown; style: unknown})),
    colourSchemes: (colours.data ?? []).map((row) => colourFromRow(row as {id: string; name: string; tokens: unknown})),
    molecules: (molecules.data ?? []).map((row) => moleculeFromRow(row as {id: string; name: string; document: unknown})),
    organisms: (organisms.data ?? []).map((row) =>
      organismFromRow(row as {id: string; name: string; category: string; document: unknown}),
    ),
  };
}

export async function listDesignColourSchemes(): Promise<readonly DesignColourScheme[]> {
  const library = await listDesignLibrary();
  return library.colourSchemes;
}

async function assertComposition(molecules: readonly DesignMolecule[], organisms: readonly DesignOrganism[]): Promise<void> {
  libraryError(designLibraryError({molecules, organisms}));
}

export async function createDesignColourScheme(input: {id: string; name: string; tokens: unknown}): Promise<DesignColourScheme> {
  const id = parseDesignId(input.id);
  const tokens = parseDesignColourTokens(input.tokens);
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('design_colour_scheme')
    .insert({id, name: input.name.trim(), tokens})
    .select('id, name, tokens')
    .single();
  if (error || data === null) {
    if (error?.code === '23505') {
      throw new Error('Id already exists');
    }
    throw new Error(error?.message || 'Could not create colour scheme');
  }
  return colourFromRow(data as {id: string; name: string; tokens: unknown});
}

export async function updateDesignColourScheme(id: string, input: {name?: string; tokens?: unknown}): Promise<DesignColourScheme> {
  const tokens = input.tokens === undefined ? undefined : parseDesignColourTokens(input.tokens);
  const patch = {
    ...(input.name === undefined ? {} : {name: input.name.trim()}),
    ...(tokens === undefined ? {} : {tokens}),
  };
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase.from('design_colour_scheme').update(patch).eq('id', id).select('id, name, tokens').maybeSingle();
  if (error || data === null) {
    throw new Error(error?.message || 'Colour scheme not found');
  }
  return colourFromRow(data as {id: string; name: string; tokens: unknown});
}

export async function deleteDesignColourScheme(id: string): Promise<void> {
  const supabase = createSitesServiceClient();
  const {error} = await supabase.from('design_colour_scheme').delete().eq('id', id);
  if (error?.code === '23503') {
    throw new Error('A template still uses this colour scheme');
  }
  if (error) {
    throw new Error(error.message || 'Could not delete colour scheme');
  }
}

export async function createDesignMolecule(input: {id: string; name: string; document?: unknown}): Promise<DesignMolecule> {
  const id = parseDesignId(input.id);
  const document = input.document === undefined ? blankMoleculeDocument() : parseDesignMoleculeDocument(input.document);
  assertDesignNodes(document.children);
  const library = await listDesignLibrary();
  libraryError(designPresetError(document.children, library.atoms));
  if (library.molecules.some((molecule) => molecule.id === id)) {
    throw new Error('Id already exists');
  }
  await assertComposition([...library.molecules, {id, name: input.name.trim(), document}], library.organisms);
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase.from('design_molecule').insert({id, name: input.name.trim(), document}).select('id, name, document').single();
  if (error || data === null) {
    throw new Error(error?.message || 'Could not create molecule');
  }
  return moleculeFromRow(data as {id: string; name: string; document: unknown});
}

export async function updateDesignMolecule(id: string, input: {name?: string; document?: unknown}): Promise<DesignMolecule> {
  const library = await listDesignLibrary();
  const current = library.molecules.find((molecule) => molecule.id === id);
  if (current === undefined) {
    throw new Error('Molecule not found');
  }
  const next: DesignMolecule = {
    id,
    name: input.name === undefined ? current.name : input.name.trim(),
    document: input.document === undefined ? current.document : parseDesignMoleculeDocument(input.document),
  };
  assertDesignNodes(next.document.children);
  libraryError(designPresetError(next.document.children, library.atoms));
  const molecules = library.molecules.map((molecule) => (molecule.id === id ? next : molecule));
  await assertComposition(molecules, library.organisms);
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('design_molecule')
    .update({name: next.name, document: next.document})
    .eq('id', id)
    .select('id, name, document')
    .maybeSingle();
  if (error || data === null) {
    throw new Error(error?.message || 'Molecule not found');
  }
  return moleculeFromRow(data as {id: string; name: string; document: unknown});
}

export async function deleteDesignMolecule(id: string): Promise<void> {
  const library = await listDesignLibrary();
  const usedBy = designMoleculeUsedBy(id, {molecules: library.molecules, organisms: library.organisms});
  if (usedBy !== undefined) {
    throw new Error(`Used by ${usedBy}`);
  }
  const supabase = createSitesServiceClient();
  const {error} = await supabase.from('design_molecule').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Could not delete molecule');
  }
}

export async function createDesignOrganism(input: {
  id: string;
  name: string;
  category?: DesignCategory;
  document?: unknown;
}): Promise<DesignOrganism> {
  const id = parseDesignId(input.id);
  const category = input.category ?? 'page';
  const document = input.document === undefined ? blankOrganismDocument() : parseDesignOrganismDocument(input.document);
  assertDesignNodes(document.children);
  const library = await listDesignLibrary();
  libraryError(designPresetError(document.children, library.atoms));
  if (library.organisms.some((organism) => organism.id === id)) {
    throw new Error('Id already exists');
  }
  await assertComposition(library.molecules, [...library.organisms, {id, name: input.name.trim(), category, document}]);
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('design_organism')
    .insert({id, name: input.name.trim(), category, document})
    .select('id, name, category, document')
    .single();
  if (error || data === null) {
    throw new Error(error?.message || 'Could not create section');
  }
  return organismFromRow(data as {id: string; name: string; category: string; document: unknown});
}

export async function updateDesignOrganism(
  id: string,
  input: {name?: string; category?: DesignCategory; document?: unknown},
): Promise<DesignOrganism> {
  const library = await listDesignLibrary();
  const current = library.organisms.find((organism) => organism.id === id);
  if (current === undefined) {
    throw new Error('Section not found');
  }
  const next: DesignOrganism = {
    id,
    name: input.name === undefined ? current.name : input.name.trim(),
    category: input.category ?? current.category,
    document: input.document === undefined ? current.document : parseDesignOrganismDocument(input.document),
  };
  assertDesignNodes(next.document.children);
  libraryError(designPresetError(next.document.children, library.atoms));
  const organisms = library.organisms.map((organism) => (organism.id === id ? next : organism));
  await assertComposition(library.molecules, organisms);
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('design_organism')
    .update({name: next.name, category: next.category, document: next.document})
    .eq('id', id)
    .select('id, name, category, document')
    .maybeSingle();
  if (error || data === null) {
    throw new Error(error?.message || 'Section not found');
  }
  return organismFromRow(data as {id: string; name: string; category: string; document: unknown});
}

export async function createDesignAtom(input: {id: string; name: string; base: string; parentId?: string; fields: unknown; style?: unknown}): Promise<DesignAtomPreset> {
  const preset = parseDesignAtomPreset({
    id: input.id,
    name: input.name,
    base: input.base,
    ...(input.parentId === undefined ? {} : {parentId: input.parentId}),
    fields: input.fields,
    style: input.style ?? {},
  });
  assertDesignAtomPreset(preset);
  const library = await listDesignLibrary();
  if (library.atoms.some((atom) => atom.id === preset.id)) {
    throw new Error('Id already exists');
  }
  libraryError(designAtomParentError(preset, library.atoms));
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('design_atom')
    .insert({id: preset.id, name: preset.name, base: preset.base, parent_id: preset.parentId ?? null, fields: preset.fields, style: preset.style})
    .select('id, name, base, parent_id, fields, style')
    .single();
  if (error || data === null) {
    throw new Error(error?.message || 'Could not create atom');
  }
  return atomFromRow(data as {id: string; name: string; base: string; parent_id: string | null; fields: unknown; style: unknown});
}

export async function updateDesignAtom(
  id: string,
  input: {name?: string; base?: string; parentId?: string | null; fields?: unknown; style?: unknown},
): Promise<DesignAtomPreset> {
  const library = await listDesignLibrary();
  const current = library.atoms.find((atom) => atom.id === id);
  if (current === undefined) {
    throw new Error('Atom not found');
  }
  const parentId = input.parentId === undefined ? current.parentId : input.parentId === null ? undefined : input.parentId;
  const preset = parseDesignAtomPreset({
    id,
    name: input.name ?? current.name,
    base: input.base ?? current.base,
    ...(parentId === undefined ? {} : {parentId}),
    fields: input.fields ?? current.fields,
    style: input.style ?? current.style,
  });
  assertDesignAtomPreset(preset);
  libraryError(designAtomParentError(preset, library.atoms));
  const usedWithOtherBase = [...library.molecules.flatMap((molecule) => molecule.document.children), ...library.organisms.flatMap((organism) => organism.document.children)].some(
    (node) => node.kind === 'atom' && node.presetId === id && node.atom !== preset.base,
  );
  if (usedWithOtherBase) {
    throw new Error('This atom is already used with a different base');
  }
  const supabase = createSitesServiceClient();
  const {data, error} = await supabase
    .from('design_atom')
    .update({name: preset.name, base: preset.base, parent_id: preset.parentId ?? null, fields: preset.fields, style: preset.style})
    .eq('id', id)
    .select('id, name, base, parent_id, fields, style')
    .maybeSingle();
  if (error || data === null) {
    throw new Error(error?.message || 'Atom not found');
  }
  return atomFromRow(data as {id: string; name: string; base: string; parent_id: string | null; fields: unknown; style: unknown});
}

export async function deleteDesignAtom(id: string): Promise<void> {
  const library = await listDesignLibrary();
  const usedBy = designAtomUsedBy(id, {atoms: library.atoms, molecules: library.molecules, organisms: library.organisms});
  if (usedBy !== undefined) {
    throw new Error(`Used by ${usedBy}`);
  }
  const supabase = createSitesServiceClient();
  const {error} = await supabase.from('design_atom').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Could not delete atom');
  }
}

export async function deleteDesignOrganism(id: string): Promise<void> {
  const supabase = createSitesServiceClient();
  const {error} = await supabase.from('design_organism').delete().eq('id', id);
  if (error) {
    throw new Error(error.message || 'Could not delete section');
  }
}
