import type {SiteHostResolution} from '@so/model';

export default function siteIsIndexable(kind: SiteHostResolution['kind'], status: 'demo' | 'live' | undefined): boolean {
  return kind === 'custom-domain' && status === 'live';
}
