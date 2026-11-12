import {headers} from 'next/headers';

export default async function readRequestHost(): Promise<string> {
  const headerList = await headers();
  return headerList.get('x-site-host') ?? headerList.get('host') ?? '';
}
