import {parseFpName, type FpColumnMap} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';
import throwIfSupabaseError from '@/lib/api/db/throwIfSupabaseError';

export interface UpdateDbFpParserInput {
  readonly name?: string;
  readonly identifier?: string | undefined;
  readonly hasHeader?: boolean;
  readonly skipRows?: number;
  readonly delimiter?: string;
  readonly columnMap?: FpColumnMap;
}

export default async function updateDbFpParser(parserId: string, input: UpdateDbFpParserInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const patch: {
    name?: string;
    identifier?: string | null;
    has_header?: boolean;
    skip_rows?: number;
    delimiter?: string;
    column_map?: FpColumnMap;
  } = {};
  if (input.name !== undefined) {
    patch.name = parseFpName(input.name);
  }
  if (input.identifier !== undefined) {
    patch.identifier = input.identifier === '' ? null : input.identifier;
  }
  if (input.hasHeader !== undefined) {
    patch.has_header = input.hasHeader;
  }
  if (input.skipRows !== undefined) {
    patch.skip_rows = input.skipRows;
  }
  if (input.delimiter !== undefined) {
    patch.delimiter = input.delimiter;
  }
  if (input.columnMap !== undefined) {
    patch.column_map = input.columnMap;
  }
  const {error} = await supabase.from('fp_parser').update(patch).eq('id', parserId);
  throwIfSupabaseError(error);
}
