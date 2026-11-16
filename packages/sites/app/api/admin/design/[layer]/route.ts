import type {DesignCategory} from '@so/model';
import {NextResponse} from 'next/server';
import {adminApiDenied, requireAdminApi} from '@/lib/admin/requireAdminApi';
import {
  createDesignAtom,
  createDesignColourScheme,
  createDesignMolecule,
  createDesignOrganism,
  designNameOk,
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

export async function POST(request: Request, context: {params: Promise<{layer: string}>}): Promise<Response> {
  const session = await requireAdminApi();
  if (adminApiDenied(session)) {
    return session;
  }
  const {layer: layerParam} = await context.params;
  const layer = layerOf(layerParam);
  if (layer === undefined) {
    return NextResponse.json({error: 'Unknown design layer'}, {status: 404});
  }
  const body = (await request.json().catch(() => undefined)) as
    | {id?: unknown; name?: unknown; tokens?: unknown; document?: unknown; category?: unknown; base?: unknown; fields?: unknown; style?: unknown}
    | undefined;
  const id = typeof body?.id === 'string' ? body.id.trim().toLowerCase() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!designNameOk(name)) {
    return NextResponse.json({error: 'Name is required'}, {status: 400});
  }
  try {
    if (layer === 'atoms') {
      const base = typeof body?.base === 'string' ? body.base : '';
      const atom = await createDesignAtom({id, name, base, fields: body?.fields, style: body?.style});
      return NextResponse.json({atom});
    }
    if (layer === 'colour-schemes') {
      const scheme = await createDesignColourScheme({id, name, tokens: body?.tokens});
      return NextResponse.json({scheme});
    }
    if (layer === 'molecules') {
      const molecule = await createDesignMolecule({id, name, document: body?.document});
      return NextResponse.json({molecule});
    }
    const organism = await createDesignOrganism({id, name, category: categoryOf(body?.category), document: body?.document});
    return NextResponse.json({organism});
  } catch (err) {
    return NextResponse.json({error: err instanceof Error ? err.message : 'Could not create'}, {status: 400});
  }
}
