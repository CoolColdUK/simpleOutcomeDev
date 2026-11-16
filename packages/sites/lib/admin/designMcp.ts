import {designLibraryGuide, parseDesignCategory, parseDesignId, type DesignCategory} from '@so/model';
import {
  createDesignColourScheme,
  createDesignMolecule,
  createDesignOrganism,
  deleteDesignColourScheme,
  deleteDesignMolecule,
  deleteDesignOrganism,
  designNameOk,
  listDesignLibrary,
  updateDesignColourScheme,
  updateDesignMolecule,
  updateDesignOrganism,
} from '@/lib/admin/designLibraryAccess';

interface DesignMcpTool {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

const idSchema = {type: 'string', description: 'Lowercase id, letters, numbers, and hyphens.'};
const nameSchema = {type: 'string'};

export const DESIGN_MCP_TOOLS: readonly DesignMcpTool[] = [
  {
    name: 'sites_list_design',
    description:
      'List design atoms, Chakra colour schemes, molecules, and sections (organisms). Read this before creating a component. Atoms are fixed. Molecules and sections are saved compositions. Colour schemes are Chakra token maps.',
    inputSchema: {type: 'object', properties: {}, additionalProperties: false},
  },
  {
    name: 'sites_save_colour_scheme',
    description:
      'Create or replace a Chakra colour scheme. tokens uses {value} for each colour, font, and radius. Link it to a template with sites_update_template colourSchemeId.',
    inputSchema: {
      type: 'object',
      properties: {id: idSchema, name: nameSchema, tokens: {type: 'object'}},
      required: ['id', 'name', 'tokens'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_delete_colour_scheme',
    description: 'Delete a colour scheme. Fails when a template still uses it.',
    inputSchema: {type: 'object', properties: {id: idSchema}, required: ['id'], additionalProperties: false},
  },
  {
    name: 'sites_save_molecule',
    description:
      'Create or replace a molecule. document is {pattern:"tree"|"combine", layout:{direction,gapPx,align,valign,wrap}, container:{widthPx,heightPx,minWidthPx,minHeightPx,maxWidthPx,maxHeightPx,paddingPx,background,radiusPx,borderWidthPx,borderColor}, children}. layout is flex. container is the box. Children are atoms {atom, style, slots} or {kind:"molecule", moleculeId}. Atoms include switch and checkbox. slots are content names filled on a template item, not values.',
    inputSchema: {
      type: 'object',
      properties: {id: idSchema, name: nameSchema, document: {type: 'object'}},
      required: ['id', 'name', 'document'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_delete_molecule',
    description: 'Delete a molecule. Fails when a section or another molecule still uses it.',
    inputSchema: {type: 'object', properties: {id: idSchema}, required: ['id'], additionalProperties: false},
  },
  {
    name: 'sites_save_organism',
    description:
      'Create or replace a section (organism). category is header, page, or footer. document is {children:[nodes]} using atoms and molecules.',
    inputSchema: {
      type: 'object',
      properties: {
        id: idSchema,
        name: nameSchema,
        category: {type: 'string', enum: ['header', 'page', 'footer']},
        document: {type: 'object'},
      },
      required: ['id', 'name', 'category', 'document'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_delete_organism',
    description: 'Delete a section (organism).',
    inputSchema: {type: 'object', properties: {id: idSchema}, required: ['id'], additionalProperties: false},
  },
];

function designId(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return parseDesignId(raw);
}

function designName(value: unknown): string {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!designNameOk(name)) {
    throw new Error('Name is required');
  }
  return name;
}

function designCategory(value: unknown): DesignCategory {
  return parseDesignCategory(value);
}

export async function callDesignMcpTool(name: string, args: Record<string, unknown>): Promise<unknown | undefined> {
  if (!DESIGN_MCP_TOOLS.some((tool) => tool.name === name)) {
    return undefined;
  }
  if (name === 'sites_list_design') {
    const library = await listDesignLibrary();
    return {guide: designLibraryGuide(), ...library};
  }
  if (name === 'sites_save_colour_scheme') {
    const id = designId(args.id);
    const schemeName = designName(args.name);
    const library = await listDesignLibrary();
    const exists = library.colourSchemes.some((scheme) => scheme.id === id);
    const scheme = exists
      ? await updateDesignColourScheme(id, {name: schemeName, tokens: args.tokens})
      : await createDesignColourScheme({id, name: schemeName, tokens: args.tokens});
    return {scheme};
  }
  if (name === 'sites_delete_colour_scheme') {
    await deleteDesignColourScheme(designId(args.id));
    return {ok: true};
  }
  if (name === 'sites_save_molecule') {
    const id = designId(args.id);
    const moleculeName = designName(args.name);
    if (args.document === undefined) {
      throw new Error('document is required');
    }
    const library = await listDesignLibrary();
    const exists = library.molecules.some((molecule) => molecule.id === id);
    const molecule = exists
      ? await updateDesignMolecule(id, {name: moleculeName, document: args.document})
      : await createDesignMolecule({id, name: moleculeName, document: args.document});
    return {molecule};
  }
  if (name === 'sites_delete_molecule') {
    await deleteDesignMolecule(designId(args.id));
    return {ok: true};
  }
  if (name === 'sites_save_organism') {
    const id = designId(args.id);
    const organismName = designName(args.name);
    const category = designCategory(args.category);
    if (args.document === undefined) {
      throw new Error('document is required');
    }
    const library = await listDesignLibrary();
    const exists = library.organisms.some((organism) => organism.id === id);
    const organism = exists
      ? await updateDesignOrganism(id, {name: organismName, category, document: args.document})
      : await createDesignOrganism({id, name: organismName, category, document: args.document});
    return {organism};
  }
  if (name === 'sites_delete_organism') {
    await deleteDesignOrganism(designId(args.id));
    return {ok: true};
  }
  return undefined;
}
