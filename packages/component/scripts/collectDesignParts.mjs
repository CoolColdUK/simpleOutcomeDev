import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const designRoot = join(dirname(fileURLToPath(import.meta.url)), '../src/design');

const folders = [
  {folder: 'atoms', list: 'DESIGN_ATOM_DEFINITIONS'},
  {folder: 'molecules', list: 'DESIGN_MOLECULE_SEED'},
  {folder: 'organisms', list: 'DESIGN_ORGANISM_SEED'},
  {folder: 'templates', list: 'DESIGN_TEMPLATE_SEED'},
];

folders.forEach((entry) => writeFolder(entry.folder, entry.list));

function writeFolder(folder, list) {
  const dir = join(designRoot, folder);
  if (!existsSync(dir)) {
    return;
  }
  const files = readdirSync(dir)
    .filter((file) => (file.endsWith('.ts') || file.endsWith('.tsx')) && file !== 'index.ts')
    .sort();
  if (files.length === 0) {
    return;
  }
  const entries = files.map((file) => {
    const base = file.replace(/\.tsx?$/, '');
    const source = readFileSync(join(dir, file), 'utf8');
    const match = source.match(/export const (\w+)/);
    if (match === null) {
      throw new Error(`${folder}/${file} must export a const definition`);
    }
    return {base, name: match[1]};
  });
  const imports = entries.map((entry) => `import {${entry.name}} from './${entry.base}';`).join('\n');
  const names = entries.map((entry) => entry.name).join(', ');
  const atoms =
    folder === 'atoms'
      ? `\nexport const DESIGN_ATOMS = [${entries.map((entry) => `${entry.name}.atom`).join(', ')}] as const;\n\nexport type DesignAtom = (typeof DESIGN_ATOMS)[number];\n`
      : '';
  writeFileSync(join(dir, 'index.ts'), `${imports}\n\nexport const ${list} = [${names}] as const;\n${atoms}`);
}
