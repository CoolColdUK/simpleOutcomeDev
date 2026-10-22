import canWriteTpPod from './canWriteTpPod';
import {PodRole} from '../space/podRole';

describe('canWriteTpPod', () => {
  it('denies viewer', () => {
    expect(canWriteTpPod(PodRole.VIEWER, false)).toBe(false);
  });

  it('allows space owner', () => {
    expect(canWriteTpPod(undefined, true)).toBe(true);
  });
});
