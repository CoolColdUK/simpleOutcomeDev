export default function readBearerToken(request: Request): string | undefined {
  const header = request.headers.get('authorization');
  if (header === null || !header.startsWith('Bearer ')) {
    return undefined;
  }
  const token = header.slice('Bearer '.length).trim();
  return token === '' ? undefined : token;
}
