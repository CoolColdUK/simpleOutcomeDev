import {Box, Flex, Link, Text} from '@chakra-ui/react';

export interface SiteFooterProps {
  readonly text: string;
  readonly links: readonly {readonly label: string; readonly sectionId: string}[];
}

export default function SiteFooter({text, links}: SiteFooterProps) {
  return (
    <Box as="footer" px={{base: 5, lg: 16}} pt="6" pb="8" borderTopWidth="1px" borderColor="color-mix(in srgb, var(--chakra-colors-siteForeground) 20%, transparent)" fontSize="sm" opacity="0.75">
      <Text m="0">{text}</Text>
      {links.length === 0 ? null : (
        <Flex as="nav" wrap="wrap" gap="3" mt="3">
          {links.map((link) => (
            <Link key={link.sectionId} href={`#${link.sectionId}`} color="inherit">
              {link.label}
            </Link>
          ))}
        </Flex>
      )}
    </Box>
  );
}
