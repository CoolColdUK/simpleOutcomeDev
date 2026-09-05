import fpCategoryDirectionLabel from './fpCategoryDirectionLabel';
import {FpCategoryDirection} from './fpCategoryDirection';

describe('fpCategoryDirectionLabel', () => {
  it('labels transfer', () => {
    expect(fpCategoryDirectionLabel(FpCategoryDirection.TRANSFER)).toBe('Transfer');
  });
});
