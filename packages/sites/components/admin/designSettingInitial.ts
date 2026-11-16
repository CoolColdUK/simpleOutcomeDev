import type {DesignOptionDefinition} from '@so/component';
import type {DesignStyle} from '@so/model';

export function designSettingInitial(option: DesignOptionDefinition): DesignStyle[string] {
  if (option.initial !== undefined) {
    return option.initial;
  }
  if (option.kind === 'number') {
    return option.min ?? 0;
  }
  if (option.kind === 'boolean') {
    return false;
  }
  if (option.kind === 'choice') {
    return option.values?.[0] ?? '';
  }
  if (option.kind === 'colour') {
    return 'siteAccent';
  }
  return '';
}
