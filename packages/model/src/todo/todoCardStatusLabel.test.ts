import todoCardStatusLabel from './todoCardStatusLabel';

describe('todoCardStatusLabel', () => {
  it('uses column title', () => {
    expect(todoCardStatusLabel('Doing')).toBe('Doing');
  });

  it('uses Archive when missing', () => {
    expect(todoCardStatusLabel(undefined)).toBe('Archive');
  });
});
