import {FeatureKind} from './featureKind';
import parseFeatureKind from './parseFeatureKind';

describe('parseFeatureKind', () => {
  it('accepts todo_list', () => {
    expect(parseFeatureKind('todo_list')).toBe(FeatureKind.TODO_LIST);
  });

  it('rejects unknown kinds', () => {
    expect(() => parseFeatureKind('calendar')).toThrow();
  });
});
