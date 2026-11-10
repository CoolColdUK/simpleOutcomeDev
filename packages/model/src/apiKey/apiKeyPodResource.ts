import {ApiKeyResource} from './apiKeyResource';

export default function apiKeyPodResource(resource: ApiKeyResource): boolean {
  return resource === ApiKeyResource.TODO || resource === ApiKeyResource.FP || resource === ApiKeyResource.TRIP;
}
