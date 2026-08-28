import type {FeatureKind} from '@so/model';

export default function featureKindLabel(kind: FeatureKind): string {
  if (kind === 'todo_list') {
    return 'Todo list';
  }
  return 'Shopping list';
}
