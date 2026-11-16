import {designLibraryGuide} from '@so/component';
import {parseDesignCategory, parseDesignId, type DesignCategory} from '@so/model';
import {
  createDesignAtom,
  createDesignColourScheme,
  createDesignMolecule,
  createDesignOrganism,
  deleteDesignAtom,
  deleteDesignColourScheme,
  deleteDesignMolecule,
  deleteDesignOrganism,
  designNameOk,
  listDesignLibrary,
  updateDesignAtom,
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
      'List built-in atom fields, saved atom presets, Chakra colour schemes, molecules, and sections. Read this before creating a component. guide.atoms are the components. atoms are presets an admin can edit. Colour names on style may be siteBackground, siteForeground, siteAccent, siteButtonForeground, siteCard, or hero.',
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
    name: 'sites_save_atom',
    description:
      'Create or replace an atom. base is a built-in component from guide.atoms, such as button or text. parentId extends another saved atom with the same base, so a button variant inherits that atom and can add fields later. fields may be empty. style stores this atom’s own setting values. Colours may be a theme name.',
    inputSchema: {
      type: 'object',
      properties: {
        id: idSchema,
        name: nameSchema,
        base: {type: 'string'},
        parentId: idSchema,
        fields: {type: 'array'},
        style: {type: 'object'},
      },
      required: ['id', 'name', 'base', 'fields'],
      additionalProperties: false,
    },
  },
  {
    name: 'sites_delete_atom',
    description: 'Delete an atom preset. Fails when a molecule or section still uses it.',
    inputSchema: {type: 'object', properties: {id: idSchema}, required: ['id'], additionalProperties: false},
  },
  {
    name: 'sites_save_molecule',
    description:
      'Create or replace a molecule. document is {pattern:"tree"|"combine", layout:{direction,gapPx,align,valign,wrap}, container:{widthPx,heightPx,minWidthPx,minHeightPx,maxWidthPx,maxHeightPx,paddingPx,marginPx,background,radiusPx,borderWidthPx,borderColor}, children}. layout is flex. container is the box. background and borderColor may be a theme colour name. Children are atoms {atom, presetId, style, slots} or {kind:"molecule", moleculeId}. presetId points at a saved atom. slots are content names filled on a template item. Every atom accepts spacing and border settings: paddingPx, marginPx, gapPx, radiusPx, borderWidthPx, borderColor, fontSizePx, align.',
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
  if (name === 'sites_save_atom') {
    const id = designId(args.id);
    const atomName = designName(args.name);
    const base = typeof args.base === 'string' ? args.base : '';
    const parentId = 'parentId' in args ? (typeof args.parentId === 'string' && args.parentId !== '' ? args.parentId : null) : undefined;
    const library = await listDesignLibrary();
    const exists = library.atoms.some((atom) => atom.id === id);
    const atom = exists
      ? await updateDesignAtom(id, {name: atomName, base, ...(parentId === undefined ? {} : {parentId}), fields: args.fields, style: args.style})
      : await createDesignAtom({id, name: atomName, base, ...(typeof parentId === 'string' ? {parentId} : {}), fields: args.fields, style: args.style});
    return {atom};
  }
  if (name === 'sites_delete_atom') {
    await deleteDesignAtom(designId(args.id));
    return {ok: true};
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
