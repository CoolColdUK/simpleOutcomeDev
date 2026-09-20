import matchFpAutoAssignCategory from './matchFpAutoAssignCategory';

const tx = {description: 'NETFLIX', recipient: '', amount: -15.99};

describe('matchFpAutoAssignCategory', () => {
  it('assigns when exactly one category matches', () => {
    expect(
      matchFpAutoAssignCategory(tx, [
        {id: 'c1', filters: [{descriptionContains: ['netflix']}]},
        {id: 'c2', filters: [{descriptionContains: ['tesco']}]},
      ]),
    ).toBe('c1');
  });

  it('matches when any pattern in the array is found', () => {
    expect(
      matchFpAutoAssignCategory(
        {description: 'DARTFORD CROSSING', recipient: '', amount: -2.5},
        [{id: 'c1', filters: [{descriptionContains: ['toll', 'dartford']}]}],
      ),
    ).toBe('c1');
  });

  it('leaves uncategorised when two categories match', () => {
    expect(
      matchFpAutoAssignCategory(tx, [
        {id: 'c1', filters: [{descriptionContains: ['net']}]},
        {id: 'c2', filters: [{descriptionContains: ['flix']}]},
      ]),
    ).toBeUndefined();
  });

  it('requires amount when the filter has one', () => {
    expect(
      matchFpAutoAssignCategory(tx, [{id: 'c1', filters: [{descriptionContains: ['netflix'], amount: -10}]}]),
    ).toBeUndefined();
  });

  it('skips group categories even when filters would match', () => {
    expect(
      matchFpAutoAssignCategory(tx, [
        {id: 'g1', isGroup: true, filters: [{descriptionContains: ['netflix']}]},
        {id: 'c1', filters: [{descriptionContains: ['netflix']}]},
      ]),
    ).toBe('c1');
  });
});
