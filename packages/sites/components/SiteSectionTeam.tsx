import {Box, Grid, Text} from '@chakra-ui/react';
import type {SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteMediaBlock from '@/components/SiteMediaBlock';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionTeam({section}: {section: Extract<SiteSection, {type: 'team'}>}) {
  return (
    <SiteSectionFrame id={section.id}>
      <SiteHeading as="h2">{section.props.title}</SiteHeading>
      <Grid gap="4" templateColumns={{base: '1fr', lg: 'repeat(4, minmax(0, 1fr))'}}>
        {section.props.members.map((member) => (
          <Box as="article" key={member.role}>
            <SiteMediaBlock media={member.media} />
            <Text mt="2">
              <strong>{member.name}</strong>
              <br />
              <Box as="small" opacity="0.7" fontSize="sm">
                {member.role}
              </Box>
            </Text>
          </Box>
        ))}
      </Grid>
    </SiteSectionFrame>
  );
}
