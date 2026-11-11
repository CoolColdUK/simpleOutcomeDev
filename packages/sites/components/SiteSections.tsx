import type {SiteDocument, SiteSection} from '@so/model';
import SiteSectionAbout from '@/components/SiteSectionAbout';
import SiteSectionBookingCta from '@/components/SiteSectionBookingCta';
import SiteSectionContact from '@/components/SiteSectionContact';
import SiteSectionFaq from '@/components/SiteSectionFaq';
import SiteSectionGallery from '@/components/SiteSectionGallery';
import SiteSectionHero from '@/components/SiteSectionHero';
import SiteSectionHighlights from '@/components/SiteSectionHighlights';
import SiteSectionHours from '@/components/SiteSectionHours';
import SiteSectionReviews from '@/components/SiteSectionReviews';
import SiteSectionServices from '@/components/SiteSectionServices';
import SiteSectionSplitCta from '@/components/SiteSectionSplitCta';
import SiteSectionTeam from '@/components/SiteSectionTeam';

function renderSection(section: SiteSection, document: SiteDocument) {
  if (section.type === 'hero') {
    return <SiteSectionHero section={section} booking={document.booking} />;
  }
  if (section.type === 'highlights') {
    return <SiteSectionHighlights section={section} />;
  }
  if (section.type === 'services') {
    return <SiteSectionServices section={section} />;
  }
  if (section.type === 'about') {
    return <SiteSectionAbout section={section} />;
  }
  if (section.type === 'gallery') {
    return <SiteSectionGallery section={section} />;
  }
  if (section.type === 'reviews') {
    return <SiteSectionReviews section={section} />;
  }
  if (section.type === 'bookingCta') {
    return <SiteSectionBookingCta section={section} booking={document.booking} />;
  }
  if (section.type === 'hoursLocation') {
    return <SiteSectionHours section={section} />;
  }
  if (section.type === 'contact') {
    return <SiteSectionContact section={section} />;
  }
  if (section.type === 'faq') {
    return <SiteSectionFaq section={section} />;
  }
  if (section.type === 'team') {
    return <SiteSectionTeam section={section} />;
  }
  return <SiteSectionSplitCta section={section} />;
}

export default function SiteSections({document}: {document: SiteDocument}) {
  return document.sections.map((section) => <div key={section.id}>{renderSection(section, document)}</div>);
}
