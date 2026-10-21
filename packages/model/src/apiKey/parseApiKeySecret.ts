const API_KEY_SECRET = /^so_[0-9a-f]{24}_[0-9a-f]{48}$/;

export const API_KEY_PREFIX_LENGTH = 27;

export default function parseApiKeySecret(input: string): {readonly secret: string; readonly prefix: string} | undefined {
  const secret = input.trim();
  if (!API_KEY_SECRET.test(secret)) {
    return undefined;
  }
  return {secret, prefix: secret.slice(0, API_KEY_PREFIX_LENGTH)};
}
