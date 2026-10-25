import tpStepModeFromLibrary from './tpStepModeFromLibrary';

describe('tpStepModeFromLibrary', () => {
  it('returns other for blank library mode', () => {
    expect(tpStepModeFromLibrary(null)).toBe('other');
    expect(tpStepModeFromLibrary(undefined)).toBe('other');
    expect(tpStepModeFromLibrary('')).toBe('other');
    expect(tpStepModeFromLibrary('   ')).toBe('other');
  });

  it('returns trimmed custom strings', () => {
    expect(tpStepModeFromLibrary('walk')).toBe('walk');
    expect(tpStepModeFromLibrary(' bus 123 ')).toBe('bus 123');
    expect(tpStepModeFromLibrary('JR Yamanote')).toBe('JR Yamanote');
  });
});
