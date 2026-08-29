import buildTodoCardImageObjectPath from './buildTodoCardImageObjectPath';
import {TodoImageMime} from './todoImageMime';

describe('buildTodoCardImageObjectPath', () => {
  it('starts with pod and card ids', () => {
    const path = buildTodoCardImageObjectPath('pod-a', 'card-b', TodoImageMime.PNG, 'x');
    expect(path.startsWith('pod-a/card-b/img-')).toBe(true);
    expect(path.endsWith('.png')).toBe(true);
    expect(path.includes('-x.')).toBe(true);
  });
});
