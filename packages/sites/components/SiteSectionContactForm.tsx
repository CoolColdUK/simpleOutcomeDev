import {Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteContactForm from '@/components/SiteContactForm';
import SiteHeading from '@/components/SiteHeading';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionContactForm({
  section,
  status,
}: {
  section: Extract<SiteSection, {type: 'contactForm'}>;
  status: 'demo' | 'draft' | 'live' | 'archived';
}) {
  const formStatus = status === 'demo' ? 'demo' : 'live';
  return (
    <SiteSectionFrame id={section.id}>
      <SiteHeading as="h2">{section.props.title}</SiteHeading>
      {section.props.intro ? <Text mb="3">{section.props.intro}</Text> : null}
      <SiteContactForm status={formStatus} submitLabel={section.props.submitLabel} />
    </SiteSectionFrame>
  );
}
