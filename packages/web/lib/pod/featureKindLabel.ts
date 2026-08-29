import {FeatureKind} from '@so/model';

export default function featureKindLabel(kind: FeatureKind): string {
  if (kind === FeatureKind.TODO_LIST) {
    return 'Todo list';
  }
  return 'Shopping list';
}
