import type {DesignAtomPreset, DesignMolecule, DesignNode} from '@so/model';
import {designAtomPart} from './designAtomCatalog';
import {designContainerStyle, designFlexStyle} from './designLayoutStyle';
import {resolveDesignAtom} from './resolveDesignAtom';

export interface DesignNodeValues {
  readonly [nodeId: string]: Readonly<Record<string, string | boolean>> | undefined;
}

export function DesignNodes({
  nodes,
  molecules,
  atoms = [],
  values,
  depth = 1,
}: {
  nodes: readonly DesignNode[];
  molecules: readonly DesignMolecule[];
  atoms?: readonly DesignAtomPreset[];
  values?: DesignNodeValues;
  depth?: number;
}) {
  if (depth > 4) {
    return <p>This composition is nested too deeply.</p>;
  }
  return (
    <>
      {nodes.map((node) => {
        if (node.kind === 'atom') {
          const resolved = resolveDesignAtom(node, atoms);
          const part = designAtomPart(resolved.atom);
          if (part === undefined) {
            return <p key={node.id}>Unknown atom {node.atom}</p>;
          }
          const Component = part.Component;
          return <Component key={node.id} node={resolved} values={values?.[node.id]} />;
        }
        const molecule = molecules.find((item) => item.id === node.moleculeId);
        if (molecule === undefined) {
          return <p key={node.id}>Missing molecule {node.moleculeId}</p>;
        }
        return (
          <div key={node.id} style={{...designContainerStyle(molecule.document.container), ...designFlexStyle(molecule.document.layout)}}>
            <DesignNodes nodes={molecule.document.children} molecules={molecules} atoms={atoms} values={scopeValues(values, node.id)} depth={depth + 1} />
          </div>
        );
      })}
    </>
  );
}

function scopeValues(values: DesignNodeValues | undefined, nodeId: string): DesignNodeValues | undefined {
  if (values === undefined) {
    return undefined;
  }
  const prefix = `${nodeId}.`;
  return Object.fromEntries(
    Object.entries(values)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, value]) => [key.slice(prefix.length), value]),
  );
}
