import type {DesignCategory} from '@so/model';
import {NextResponse} from 'next/server';
import {adminApiDenied, requireAdminApi} from '@/lib/admin/requireAdminApi';
import {
  deleteDesignAtom,
  deleteDesignColourScheme,
  deleteDesignMolecule,
  deleteDesignOrganism,
  designNameOk,
  updateDesignAtom,
  updateDesignColourScheme,
  updateDesignMolecule,
  updateDesignOrganism,
} from '@/lib/admin/designLibraryAccess';

const LAYERS = ['atoms', 'colour-schemes', 'molecules', 'organisms'] as const;

type DesignLayer = (typeof LAYERS)[number];

function layerOf(value: string): DesignLayer | undefined {
  return LAYERS.find((layer) => layer === value);
}

function categoryOf(value: unknown): DesignCategory | undefined {
  if (value === 'header' || value === 'page' || value === 'footer') {
    return value;
  }
  return undefined;
}

export async function PUT(request: Request, context: {params: Promise<{layer: string; id: string}>}): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  const {layer: layerParam, id} = await context.params;
  const layer = layerOf(layerParam);
  if (layer === undefined) {
    return NextResponse.json({error: 'Unknown design layer'}, {status: 404});
  }
  const body = (await request.json().catch(() => undefined)) as
    | {name?: unknown; tokens?: unknown; document?: unknown; category?: unknown; base?: unknown; fields?: unknown; style?: unknown}
    | undefined;
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined;
  if (name !== undefined && !designNameOk(name)) {
    return NextResponse.json({error: 'Name is required'}, {status: 400});
  }
  try {
    if (layer === 'atoms') {
      const base = typeof body?.base === 'string' ? body.base : undefined;
      const atom = await updateDesignAtom(id, {name, base, fields: body?.fields, style: body?.style});
      return NextResponse.json({atom});
    }
    if (layer === 'colour-schemes') {
      const scheme = await updateDesignColourScheme(id, {name, tokens: body?.tokens});
      return NextResponse.json({scheme});
    }
    if (layer === 'molecules') {
      const molecule = await updateDesignMolecule(id, {name, document: body?.document});
      return NextResponse.json({molecule});
    }
    const category = categoryOf(body?.category);
    const organism = await updateDesignOrganism(id, {name, category, document: body?.document});
    return NextResponse.json({organism});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not update'}, {status: 400});
  }
}

export async function DELETE(_request: Request, context: {params: Promise<{layer: string; id: string}>}): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  const {layer: layerParam, id} = await context.params;
  const layer = layerOf(layerParam);
  if (layer === undefined) {
    return NextResponse.json({error: 'Unknown design layer'}, {status: 404});
  }
  try {
    if (layer === 'atoms') {
      await deleteDesignAtom(id);
    } else if (layer === 'colour-schemes') {
      await deleteDesignColourScheme(id);
    } else if (layer === 'molecules') {
      await deleteDesignMolecule(id);
    } else {
      await deleteDesignOrganism(id);
    }
    return NextResponse.json({ok: true});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not delete'}, {status: 400});
  }
}
