import {FeatureKind} from './featureKind';

/** Pod types users may create in the app. Legacy `shopping_list` remains in DB only. */
const CREATABLE_POD_FEATURE_KINDS: readonly FeatureKind[] = [
  FeatureKind.TODO_LIST,
  FeatureKind.FINANCIAL_PLANNING,
  FeatureKind.TRIP_PLANNING,
];

export default function creatablePodFeatureKinds(): readonly FeatureKind[] {
  return CREATABLE_POD_FEATURE_KINDS;
}
