import parseFpCsvTable from './parseFpCsvTable';

describe('parseFpCsvTable', () => {
  it('uses the first row as headers', () => {
    const table = parseFpCsvTable('Date,Amount\n01/01/2025,3', ',', true, 0);
    expect(table.headers).toEqual(['Date', 'Amount']);
    expect(table.rows[0]?.Date).toBe('01/01/2025');
  });

  it('skips leading rows', () => {
    const table = parseFpCsvTable('meta\nDate,Amount\n01/01/2025,3', ',', true, 1);
    expect(table.headers).toEqual(['Date', 'Amount']);
    expect(table.rows).toHaveLength(1);
  });
});
