import canManageTodoColumns from './canManageTodoColumns';
import {PodRole} from '../space/podRole';

describe('canManageTodoColumns', () => {
  it('allows pod admin', () => {
    expect(canManageTodoColumns(PodRole.ADMIN, false)).toBe(true);
  });

  it('allows space owner without pod role', () => {
    expect(canManageTodoColumns(undefined, true)).toBe(true);
  });

  it('denies pod user', () => {
    expect(canManageTodoColumns(PodRole.USER, false)).toBe(false);
  });
});
