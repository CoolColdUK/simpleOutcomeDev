import type {SiteHostResolution} from '@so/model';
import type {LoadedSiteStatus} from '@/lib/site/loadSiteForHost';

export default function siteIsIndexable(kind: SiteHostResolution['kind'], status: LoadedSiteStatus | undefined): boolean {
  return kind === 'custom-domain' && status === 'live';
}
