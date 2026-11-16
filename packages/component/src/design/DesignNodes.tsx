import type {DesignMolecule, DesignNode} from '@so/model';
import {designAtomPart} from './designAtomCatalog';
import {designContainerStyle, designFlexStyle} from './designLayoutStyle';

export interface DesignNodeValues {
  readonly [nodeId: string]: Readonly<Record<string, string | boolean>> | undefined;
}

export function DesignNodes({
  nodes,
  molecules,
  values,
  depth = 1,
}: {
  nodes: readonly DesignNode[];
  molecules: readonly DesignMolecule[];
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
          const part = designAtomPart(node.atom);
          if (part === undefined) {
            return <p key={node.id}>Unknown atom {node.atom}</p>;
          }
          const Component = part.Component;
          return <Component key={node.id} node={node} values={values?.[node.id]} />;
        }
        const molecule = molecules.find((item) => item.id === node.moleculeId);
        if (molecule === undefined) {
          return <p key={node.id}>Missing molecule {node.moleculeId}</p>;
        }
        return (
          <div key={node.id} style={{...designContainerStyle(molecule.document.container), ...designFlexStyle(molecule.document.layout)}}>
            <DesignNodes nodes={molecule.document.children} molecules={molecules} values={values} depth={depth + 1} />
          </div>
        );
      })}
    </>
  );
}
