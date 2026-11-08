import {FeatureKind} from './featureKind';
import parseFeatureKind from './parseFeatureKind';

describe('parseFeatureKind', () => {
  it('accepts todo_list', () => {
    expect(parseFeatureKind('todo_list')).toBe(FeatureKind.TODO_LIST);
  });

  it('accepts financial_planning', () => {
    expect(parseFeatureKind('financial_planning')).toBe(FeatureKind.FINANCIAL_PLANNING);
  });

  it('accepts trip_planning', () => {
    expect(parseFeatureKind('trip_planning')).toBe(FeatureKind.TRIP_PLANNING);
  });

  it('accepts legacy shopping_list for existing pods', () => {
    expect(parseFeatureKind('shopping_list')).toBe(FeatureKind.SHOPPING_LIST);
  });

  it('rejects unknown kinds', () => {
    expect(() => parseFeatureKind('calendar')).toThrow();
  });
});
