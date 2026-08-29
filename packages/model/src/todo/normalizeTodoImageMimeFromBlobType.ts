import {TodoImageMime} from './todoImageMime';

export default function normalizeTodoImageMimeFromBlobType(mimeType: string): TodoImageMime | undefined {
  if (mimeType === TodoImageMime.JPEG) {
    return TodoImageMime.JPEG;
  }
  if (mimeType === TodoImageMime.PNG) {
    return TodoImageMime.PNG;
  }
  return undefined;
}
