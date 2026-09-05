import listDbFpImportFiles from '@/lib/api/db/listDbFpImportFiles';
import listDbFpImports from '@/lib/api/db/listDbFpImports';

export default async function hasDbFpImportHash(podId: string, sha256: string): Promise<boolean> {
  const [files, imports] = await Promise.all([listDbFpImportFiles(podId), listDbFpImports(podId)]);
  const active = new Set(imports.filter((i) => i.undoneAt === undefined).map((i) => i.id));
  return files.some((f) => f.contentSha256 === sha256 && active.has(f.importId));
}
