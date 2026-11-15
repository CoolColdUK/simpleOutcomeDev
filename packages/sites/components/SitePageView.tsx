import type {CSSProperties} from 'react';
import {siteMessageFormOffered} from '@so/model';
import type {LoadedSite} from '@/lib/site/loadSiteForHost';
import {documentWithoutContactForm} from '@/lib/site/mapSiteSection';
import SiteSalesBanner from '@/components/SiteSalesBanner';
import SiteSections from '@/components/SiteSections';

function presentedDocument(document: LoadedSite['document'], messagesEnabled: boolean): LoadedSite['document'] {
  if (siteMessageFormOffered(messagesEnabled)) {
    return document;
  }
  return documentWithoutContactForm(document);
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
      <SiteSections document={document} status={site.status} />
    </div>
  );
}
