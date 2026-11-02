import {TpActionKind} from './tpActionKind';
import {tpActionKindBackgroundColor, tpParseActionKindColors} from './tpActionKindColors';

describe('tpActionKindColors', () => {
  it('parses valid hex map and ignores invalid entries', () => {
    expect(tpParseActionKindColors({activity: '#abc', stay: 'red', note: '#112233'})).toEqual({
      activity: '#abc',
      note: '#112233',
    });
  });

  it('returns background only for valid kind colour', () => {
    const colors = tpParseActionKindColors({[TpActionKind.ACTIVITY]: '#ffeeaa'});
    expect(tpActionKindBackgroundColor(colors, TpActionKind.ACTIVITY)).toBe('#ffeeaa');
    expect(tpActionKindBackgroundColor(colors, TpActionKind.TRAVEL)).toBeUndefined();
  });
});
