import normalizeTodoImageMimeFromBlobType from './normalizeTodoImageMimeFromBlobType';
import {TodoImageMime} from './todoImageMime';

describe('normalizeTodoImageMimeFromBlobType', () => {
  it('accepts jpeg', () => {
    expect(normalizeTodoImageMimeFromBlobType('image/jpeg')).toBe(TodoImageMime.JPEG);
  });

  it('rejects unknown', () => {
    expect(normalizeTodoImageMimeFromBlobType('image/gif')).toBeUndefined();
  });
});
