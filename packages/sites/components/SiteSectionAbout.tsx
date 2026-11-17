import {Box, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteMediaBlock from '@/components/SiteMediaBlock';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionAbout({section}: {section: Extract<SiteSection, {type: 'about'}>}) {
  return (
    <SiteSectionFrame id={section.id} display={{lg: 'grid'}} gridTemplateColumns={{lg: '1.1fr 1fr'}} alignItems={{lg: 'center'}} gap={{lg: 10}}>
      {section.props.media ? <SiteMediaBlock media={section.props.media} tall /> : null}
      <Box>
        <Text color="siteAccent" fontSize="xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase">
          {section.props.eyebrow}
        </Text>
        <SiteHeading as="h2">{section.props.title}</SiteHeading>
        <Text>{section.props.body}</Text>
      </Box>
    </SiteSectionFrame>
  );
}
