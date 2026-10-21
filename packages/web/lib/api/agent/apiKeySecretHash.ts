import {createHash, timingSafeEqual} from 'node:crypto';

export default function apiKeySecretHashMatches(secret: string, hashHex: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(hashHex)) {
    return false;
  }
  const actual = createHash('sha256').update(secret, 'utf8').digest();
  const expected = Buffer.from(hashHex, 'hex');
  return timingSafeEqual(actual, expected);
}
