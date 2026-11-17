import {Box} from '@chakra-ui/react';
import {siteMessageFormOffered} from '@so/model';
import type {LoadedSite} from '@/lib/site/loadSiteForHost';
import {documentWithoutContactForm} from '@/lib/site/mapSiteSection';
import SiteSalesBanner from '@/components/SiteSalesBanner';
import SiteSections from '@/components/SiteSections';
import SiteThemeProvider from '@/components/SiteThemeProvider';

function presentedDocument(document: LoadedSite['document'], messagesEnabled: boolean): LoadedSite['document'] {
  if (siteMessageFormOffered(messagesEnabled)) {
    return document;
  }
  return documentWithoutContactForm(document);
}

export default function SitePageView({site}: {site: LoadedSite}) {
  const document = presentedDocument(site.document, site.messagesEnabled);
  return (
    <SiteThemeProvider theme={document.theme}>
      <Box bg="siteBackground" color="siteForeground" fontFamily="siteBody" fontSize="md" lineHeight="1.5" minH="100vh">
        {site.status === 'demo' ? <SiteSalesBanner businessName={document.businessName} messagesEnabled={site.messagesEnabled} /> : null}
        <SiteSections document={document} status={site.status} />
      </Box>
    </SiteThemeProvider>
  );
}
