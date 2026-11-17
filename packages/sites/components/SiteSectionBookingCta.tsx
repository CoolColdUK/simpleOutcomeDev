import {Box, Button} from '@chakra-ui/react';
import type {SiteDocument, SiteSection} from '@so/model';
import SiteHeading from '@/components/SiteHeading';
import SiteSectionFrame from '@/components/SiteSectionFrame';

export default function SiteSectionBookingCta({
  section,
  booking,
}: {
  section: Extract<SiteSection, {type: 'bookingCta'}>;
  booking: SiteDocument['booking'];
}) {
  return (
    <SiteSectionFrame id={section.id} display="flex" flexDirection={{base: 'column', lg: 'row'}} alignItems={{base: 'flex-start', lg: 'center'}} justifyContent={{lg: 'space-between'}} gap="4">
      <Box>
        <SiteHeading as="h2">{section.props.title}</SiteHeading>
        {section.props.body ? <Box>{section.props.body}</Box> : null}
      </Box>
      <Button asChild variant="plain" minH="44px" px="5" fontWeight="700" borderWidth="2px" borderColor="siteAccent" borderRadius="full" bg="siteAccent" color="siteButtonForeground">
        <a href={booking.href} target="_blank" rel="noopener noreferrer">
          {booking.label}
        </a>
      </Button>
    </SiteSectionFrame>
  );
}
