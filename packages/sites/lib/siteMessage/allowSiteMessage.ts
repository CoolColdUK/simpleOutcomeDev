import {createHash} from 'node:crypto';

const HOUR_MS = 60 * 60 * 1000;
const IP_LIMIT = 5;
const SITE_LIMIT = 30;

interface MemoryBucket {
  readonly count: number;
  readonly resetAt: number;
}

const memoryBuckets = new Map<string, MemoryBucket>();

export function hashSiteMessageIp(ip: string, pepper: string): string {
  return createHash('sha256').update(`${pepper}:${ip}`).digest('hex');
}

function peekMemory(key: string, limit: number, now: number): boolean {
  const current = memoryBuckets.get(key);
  if (current === undefined || current.resetAt <= now) {
    return true;
  }
  return current.count < limit;
}

function takeMemory(key: string, limit: number, now: number): boolean {
  const current = memoryBuckets.get(key);
  if (current === undefined || current.resetAt <= now) {
    memoryBuckets.set(key, {count: 1, resetAt: now + HOUR_MS});
    return true;
  }
  if (current.count >= limit) {
    return false;
  }
  memoryBuckets.set(key, {count: current.count + 1, resetAt: current.resetAt});
  return true;
}

function upstashConfig(): {readonly url: string; readonly token: string; readonly pepper: string} | undefined {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? '';
  const pepper = process.env.SITES_IP_HASH_PEPPER?.trim() ?? '';
  const anySet = url.length > 0 || token.length > 0 || pepper.length > 0;
  if (!anySet) {
    return undefined;
  }
  if (url.length === 0 || token.length === 0 || pepper.length === 0) {
    throw new Error('incomplete');
  }
  return {url, token, pepper};
}

async function readUpstash(url: string, token: string, key: string): Promise<number | undefined> {
  const response = await fetch(`${url.replace(/\/$/, '')}/get/${encodeURIComponent(key)}`, {
    headers: {Authorization: `Bearer ${token}`},
  });
  if (!response.ok) {
    return undefined;
  }
  const payload = (await response.json()) as {readonly result?: unknown};
  if (payload.result === null || payload.result === undefined) {
    return 0;
  }
  const count = Number(payload.result);
  return Number.isNaN(count) ? undefined : count;
}

async function takeUpstash(url: string, token: string, key: string): Promise<number | undefined> {
  const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, '3600', 'NX'],
    ]),
  });
  if (!response.ok) {
    return undefined;
  }
  const payload = (await response.json()) as readonly {readonly result?: unknown}[];
  const count = payload[0]?.result;
  return typeof count === 'number' ? count : undefined;
}

export type SiteMessageLimit = 'allow' | 'limit' | 'unavailable';

export async function peekSiteMessage(siteKey: string, ip: string): Promise<SiteMessageLimit> {
  const config = upstashConfig();
  if (config === undefined) {
    const hash = hashSiteMessageIp(ip, 'local-dev');
    const now = Date.now();
    const ipAllowed = peekMemory(`site-message:${siteKey}:${hash}`, IP_LIMIT, now);
    const siteAllowed = peekMemory(`site-message:${siteKey}`, SITE_LIMIT, now);
    return ipAllowed && siteAllowed ? 'allow' : 'limit';
  }
  const hash = hashSiteMessageIp(ip, config.pepper);
  const ipCount = await readUpstash(config.url, config.token, `site-message:${siteKey}:${hash}`);
  const siteCount = await readUpstash(config.url, config.token, `site-message:${siteKey}`);
  if (ipCount === undefined || siteCount === undefined) {
    return 'unavailable';
  }
  if (ipCount >= IP_LIMIT || siteCount >= SITE_LIMIT) {
    return 'limit';
  }
  return 'allow';
}

export async function allowSiteMessage(siteKey: string, ip: string): Promise<SiteMessageLimit> {
  const config = upstashConfig();
  if (config === undefined) {
    const hash = hashSiteMessageIp(ip, 'local-dev');
    const now = Date.now();
    const ipAllowed = takeMemory(`site-message:${siteKey}:${hash}`, IP_LIMIT, now);
    const siteAllowed = takeMemory(`site-message:${siteKey}`, SITE_LIMIT, now);
    return ipAllowed && siteAllowed ? 'allow' : 'limit';
  }
  const hash = hashSiteMessageIp(ip, config.pepper);
  const ipCount = await takeUpstash(config.url, config.token, `site-message:${siteKey}:${hash}`);
  const siteCount = await takeUpstash(config.url, config.token, `site-message:${siteKey}`);
  if (ipCount === undefined || siteCount === undefined) {
    return 'unavailable';
  }
  if (ipCount > IP_LIMIT || siteCount > SITE_LIMIT) {
    return 'limit';
  }
  return 'allow';
}
