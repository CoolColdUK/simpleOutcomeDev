import matchFpAutoAssignCategory from './matchFpAutoAssignCategory';

const tx = {description: 'NETFLIX', recipient: '', amount: -15.99};

describe('matchFpAutoAssignCategory', () => {
  it('assigns when exactly one category matches', () => {
    expect(
      matchFpAutoAssignCategory(tx, [
        {id: 'c1', filters: ['DESCRIPTION=netflix']},
        {id: 'c2', filters: ['DESCRIPTION=tesco']},
      ]),
    ).toBe('c1');
  });

  it('matches partial description when any rule matches', () => {
    expect(
      matchFpAutoAssignCategory(
        {description: 'DARTFORD CROSSING', recipient: '', amount: -2.5},
        [{id: 'c1', filters: ['DESCRIPTION=toll', 'DESCRIPTION=dartford']}],
      ),
    ).toBe('c1');
  });

  it('matches partial recipient', () => {
    expect(
      matchFpAutoAssignCategory(
        {description: '', recipient: 'HSBC BANK', amount: -10},
        [{id: 'c1', filters: ['RECIPIENT=H']}],
      ),
    ).toBe('c1');
  });

  it('leaves uncategorised when two categories match', () => {
    expect(
      matchFpAutoAssignCategory(tx, [
        {id: 'c1', filters: ['DESCRIPTION=net']},
        {id: 'c2', filters: ['DESCRIPTION=flix']},
      ]),
    ).toBeUndefined();
  });

  it('requires amount condition when the rule has one', () => {
    expect(
      matchFpAutoAssignCategory(tx, [{id: 'c1', filters: ['DESCRIPTION=netflix,AMOUNT=-10']}]),
    ).toBeUndefined();
  });

  it('matches amount with comparison operators', () => {
    expect(
      matchFpAutoAssignCategory(tx, [{id: 'c1', filters: ['AMOUNT<-10']}]),
    ).toBe('c1');
    expect(
      matchFpAutoAssignCategory(tx, [{id: 'c1', filters: ['AMOUNT>=-15.99']}]),
    ).toBe('c1');
  });

  it('ANDs fields within one rule string', () => {
    expect(
      matchFpAutoAssignCategory(
        {description: 'NETFLIX', recipient: 'NETFLIX', amount: -15.99},
        [{id: 'c1', filters: ['DESCRIPTION=net,RECIPIENT=flix,AMOUNT=-15.99']}],
      ),
    ).toBe('c1');
    expect(
      matchFpAutoAssignCategory(
        {description: 'NETFLIX', recipient: 'OTHER', amount: -15.99},
        [{id: 'c1', filters: ['DESCRIPTION=net,RECIPIENT=flix']}],
      ),
    ).toBeUndefined();
  });

  it('skips group categories even when filters would match', () => {
    expect(
      matchFpAutoAssignCategory(tx, [
        {id: 'g1', isGroup: true, filters: ['DESCRIPTION=netflix']},
        {id: 'c1', filters: ['DESCRIPTION=netflix']},
      ]),
    ).toBe('c1');
  });
});
