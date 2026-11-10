import {FeatureKind} from '@so/model';

export default function featureKindLabel(kind: FeatureKind): string {
  if (kind === FeatureKind.TODO_LIST) {
    return 'Todo list';
  }
  if (kind === FeatureKind.FINANCIAL_PLANNING) {
    return 'Financial planning';
  }
  if (kind === FeatureKind.TRIP_PLANNING) {
    return 'Trip planning';
  }
  return 'Book';
}
