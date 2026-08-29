'use client';

import Link from 'next/link';
import {Badge, Box, Heading, HStack, Icon, Tooltip, useSlotRecipe} from '@chakra-ui/react';
import {spaceRoleLabel} from '@so/model';
import type {SpaceListItem} from '@/lib/api/db/spaceListItem';

export interface AppHomeSpacesCardProps {
  readonly space: SpaceListItem;
}

export default function AppHomeSpacesCard({space}: AppHomeSpacesCardProps) {
  const recipe = useSlotRecipe({key: 'spaceCard'});
  const styles = recipe();
  const description = space.description ?? 'No description';

  return (
    <Box asChild css={styles.root}>
      <Link href={`/app/spaces/${space.id}`}>
        <HStack justify="space-between" align="start" gap={3}>
          <Heading as="h2" size="md">
            {space.name}
          </Heading>
          <HStack gap={2} flexShrink={0}>
            <Badge colorPalette="brand" variant="subtle">
              {spaceRoleLabel(space.role)}
            </Badge>
            <Tooltip.Root openDelay={200}>
              <Tooltip.Trigger asChild>
                <Box
                  as="span"
                  display="inline-flex"
                  color="fg.muted"
                  aria-label="Space description"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Icon viewBox="0 0 24 24" boxSize={5}>
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 11v5M12 8h.01"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </Icon>
                </Box>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content maxW="xs">{description}</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </HStack>
        </HStack>
      </Link>
    </Box>
  );
}
