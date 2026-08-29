import getTodoImageFileExtension, {TodoImageMime} from './todoImageMime';

describe('getTodoImageFileExtension', () => {
  it('maps jpeg', () => {
    expect(getTodoImageFileExtension(TodoImageMime.JPEG)).toBe('jpg');
  });

  it('maps png', () => {
    expect(getTodoImageFileExtension(TodoImageMime.PNG)).toBe('png');
  });
});
