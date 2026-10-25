/** Persisted step mode when linked to a transport library row (blank library mode → other). */
export default function tpStepModeFromLibrary(mode: string | undefined | null): string {
  const trimmed = mode?.trim() ?? '';
  if (trimmed === '') {
    return 'other';
  }
  return trimmed;
}
