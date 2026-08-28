import parseFeatureKind from './parseFeatureKind';

describe('parseFeatureKind', () => {
  it('accepts todo_list', () => {
    expect(parseFeatureKind('todo_list')).toBe('todo_list');
  });

  it('rejects unknown kinds', () => {
    expect(() => parseFeatureKind('calendar')).toThrow();
  });
});
