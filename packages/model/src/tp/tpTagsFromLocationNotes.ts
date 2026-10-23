function tagLinePayload(line: string): string | undefined {
  const trimmed = line.trim();
  const match = /^tags\s*:(.*)$/i.exec(trimmed);
  if (match === null) {
    return undefined;
  }
  return match[1];
}

function tokensFromPayload(payload: string): readonly string[] {
  return payload
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t !== '');
}

export default function tpTagsFromLocationNotes(notesInOrder: readonly (string | undefined)[]): readonly string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const notes of notesInOrder) {
    if (notes === undefined || notes === '') {
      continue;
    }
    const lines = notes.split(/\r?\n/);
    for (const line of lines) {
      const payload = tagLinePayload(line);
      if (payload === undefined) {
        continue;
      }
      for (const token of tokensFromPayload(payload)) {
        const key = token.toLowerCase();
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        out.push(token);
      }
    }
  }
  return out;
}
