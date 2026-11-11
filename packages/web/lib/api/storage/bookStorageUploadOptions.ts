import {BOOK_POD_PRIVATE_UPLOAD_CACHE_CONTROL} from '@so/model';

export default function bookStorageUploadOptions(contentType: string, upsert = false): {
  readonly contentType: string;
  readonly upsert: boolean;
  readonly cacheControl: string;
} {
  return {contentType, upsert, cacheControl: BOOK_POD_PRIVATE_UPLOAD_CACHE_CONTROL};
}
