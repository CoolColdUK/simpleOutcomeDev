import {ApiKeyAction, ApiKeyResource} from '@so/model';

export function bookCall(podId: string, action: ApiKeyAction) {
  return {podId, resource: ApiKeyResource.BOOK, action};
}
