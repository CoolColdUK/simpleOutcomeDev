import {Box, Stack, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionFaq({section}: {section: Extract<SiteSection, {type: 'faq'}>}) {
  return (
    <SiteSectionFrame id={section.id}>
      <SiteHeading as="h2">{section.props.title}</SiteHeading>
      <Stack gap="4">
        {section.props.items.map((item) => (
          <Box as="article" key={item.question} bg="siteCard" borderRadius="site" p="4">
            <SiteHeading as="h3">{item.question}</SiteHeading>
            <Text>{item.answer}</Text>
          </Box>
        ))}
      </Stack>
    </SiteSectionFrame>
  );
}
