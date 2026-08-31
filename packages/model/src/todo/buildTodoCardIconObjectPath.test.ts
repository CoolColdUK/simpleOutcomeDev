import buildTodoCardIconObjectPath from './buildTodoCardIconObjectPath';
import {TodoImageMime} from './todoImageMime';

describe('buildTodoCardIconObjectPath', () => {
  it('starts with pod and card ids and an icon prefix', () => {
    const path = buildTodoCardIconObjectPath('pod-a', 'card-b', TodoImageMime.JPEG, 'x');
    expect(path.startsWith('pod-a/card-b/icon-')).toBe(true);
    expect(path.endsWith('.jpg')).toBe(true);
    expect(path.includes('-x.')).toBe(true);
  });
});
