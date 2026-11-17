import {Flex, Link, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionContact({section}: {section: Extract<SiteSection, {type: 'contact'}>}) {
  return (
    <SiteSectionFrame id={section.id}>
      <SiteHeading as="h2">{section.props.title}</SiteHeading>
      {section.props.intro ? <Text mb="3">{section.props.intro}</Text> : null}
      <Flex direction="column" gap="2">
        {section.props.channels.map((channel) => (
          <Link key={channel.href} href={channel.href} color="siteAccent" {...(channel.href.startsWith('http') ? {target: '_blank', rel: 'noopener noreferrer'} : {})}>
            {channel.label}
          </Link>
        ))}
      </Flex>
    </SiteSectionFrame>
  );
}
