import {Button} from '@chakra-ui/react';
import type {SiteDocument} from '@so/model';

export interface SiteCtaProps {
  readonly label: string;
  readonly target: string;
  readonly booking: SiteDocument['booking'];
  readonly secondary?: boolean;
  readonly light?: boolean;
}

export default function SiteCta({label, target, booking, secondary, light}: SiteCtaProps) {
  const bookingLink = target === 'booking';
  const accent = light ? 'white' : 'siteAccent';
  return (
    <Button
      asChild
      variant="plain"
      minH="44px"
      px="5"
      fontWeight="700"
      borderWidth="2px"
      borderStyle="solid"
      borderColor={accent}
      borderRadius="full"
      bg={secondary ? 'transparent' : accent}
      color={secondary ? accent : light ? 'siteForeground' : 'siteButtonForeground'}
    >
      <a href={bookingLink ? booking.href : `#${target}`} {...(bookingLink ? {target: '_blank', rel: 'noopener noreferrer'} : {})}>
        {label}
      </a>
    </Button>
  );
}
