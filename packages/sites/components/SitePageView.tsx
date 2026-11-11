import type {CSSProperties} from 'react';
import type {LoadedSite} from '@/lib/site/loadSiteForHost';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import SiteSalesBanner from '@/components/SiteSalesBanner';
import SiteSections from '@/components/SiteSections';

export default function SitePageView({site, salesEmail}: {site: LoadedSite; salesEmail: string}) {
  const {theme} = site.document;
  const style = {
    '--site-bg': theme.background,
    '--site-fg': theme.foreground,
    '--site-accent': theme.accent,
    '--site-btn-fg': theme.buttonForeground,
    '--site-card': theme.cardBackground,
    '--site-heading': theme.headingFont,
    '--site-body': theme.bodyFont,
    '--site-radius': `${theme.radiusPx}px`,
    '--site-hero': theme.heroBackground === 'none' ? 'transparent' : theme.heroBackground,
  } as CSSProperties;
  return (
    <div className="site" data-uppercase={theme.uppercaseHeadings ? 'true' : 'false'} style={style}>
      {site.status === 'demo' ? <SiteSalesBanner businessName={site.document.businessName} email={salesEmail} /> : null}
      <SiteNav document={site.document} />
      <main>
        <SiteSections document={site.document} />
      </main>
      <SiteFooter text={site.document.footer.text} />
    </div>
  );
}
