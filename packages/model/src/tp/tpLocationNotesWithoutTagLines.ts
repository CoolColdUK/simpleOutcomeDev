function isTagLine(line: string): boolean {
  return /^\s*tags\s*:/i.test(line);
}

export default function tpLocationNotesWithoutTagLines(notes: string | undefined): string | undefined {
  if (notes === undefined || notes === '') {
    return undefined;
  }
  const kept = notes.split(/\r?\n/).filter((line) => !isTagLine(line));
  const joined = kept.join('\n').trim();
  if (joined === '') {
    return undefined;
  }
  return joined;
}
