import type {CSSProperties} from 'react';
import {siteMessageFormOffered, type SiteDocument} from '@so/model';
import type {LoadedSite} from '@/lib/site/loadSiteForHost';
import SiteFooter from '@/components/SiteFooter';
import SiteNav from '@/components/SiteNav';
import SiteSalesBanner from '@/components/SiteSalesBanner';
import SiteSections from '@/components/SiteSections';

function presentedDocument(document: SiteDocument, messagesEnabled: boolean): SiteDocument {
  if (siteMessageFormOffered(messagesEnabled)) {
    return document;
  }
  const hidden = new Set(document.sections.filter((section) => section.type === 'contactForm').map((section) => section.id));
  return {
    ...document,
    nav: {links: document.nav.links.filter((link) => !hidden.has(link.sectionId))},
    sections: document.sections.filter((section) => section.type !== 'contactForm'),
  };
}

export default function SitePageView({site}: {site: LoadedSite}) {
  const document = presentedDocument(site.document, site.messagesEnabled);
  const {theme} = document;
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
      {site.status === 'demo' ? <SiteSalesBanner businessName={document.businessName} messagesEnabled={site.messagesEnabled} /> : null}
      <SiteNav document={document} />
      <main>
        <SiteSections document={document} status={site.status} />
      </main>
      <SiteFooter text={document.footer.text} />
    </div>
  );
}
