import * as v from 'valibot';
import {usernameSchema, type Username} from './usernameSchema';

export default function parseUsername(input: unknown): Username {
  return v.parse(usernameSchema, input);
}
