import fpImportLogRaw from './fpImportLogRaw';

describe('fpImportLogRaw', () => {
  it('returns short json as-is', () => {
    expect(fpImportLogRaw({Date: '01/01/2025'})).toBe('{"Date":"01/01/2025"}');
  });

  it('truncates long json', () => {
    const raw = fpImportLogRaw({notes: 'a'.repeat(500)});
    expect(raw.endsWith('…')).toBe(true);
    expect(raw.length).toBe(401);
  });
});
