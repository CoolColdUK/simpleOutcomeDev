import {FeatureKind} from '../space/featureKind';
import {ApiKeyResource} from './apiKeyResource';

export default function featureKindForApiResource(resource: ApiKeyResource): FeatureKind | undefined {
  if (resource === ApiKeyResource.TODO) {
    return FeatureKind.TODO_LIST;
  }
  if (resource === ApiKeyResource.SHOPPING) {
    return FeatureKind.SHOPPING_LIST;
  }
  if (resource === ApiKeyResource.FP) {
    return FeatureKind.FINANCIAL_PLANNING;
  }
  if (resource === ApiKeyResource.TRIP) {
    return FeatureKind.TRIP_PLANNING;
  }
  return undefined;
}
