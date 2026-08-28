import type {SpaceRole} from '@so/model';

export interface SpaceListItem {
  readonly id: string;
  readonly name: string;
  readonly role: SpaceRole;
}
