'use client';

import Link from 'next/link';
import {Badge, Box, Heading, HStack, Stack, Text, useSlotRecipe} from '@chakra-ui/react';
import {podRoleLabel, type PodRole} from '@so/model';
import type {DbPod} from '@/lib/api/db/listDbPods';
import featureKindLabel from '@/lib/pod/featureKindLabel';

export interface SpaceWorkspacePodCardProps {
  readonly spaceId: string;
  readonly pod: DbPod;
  readonly role: PodRole | undefined;
}

export default function SpaceWorkspacePodCard({spaceId, pod, role}: SpaceWorkspacePodCardProps) {
  const recipe = useSlotRecipe({key: 'spaceCard'});
  const styles = recipe();
  const title = pod.name ?? featureKindLabel(pod.feature);

  return (
    <Box asChild css={styles.root}>
      <Link href={`/app/spaces/${spaceId}/pods/${pod.id}`}>
        <HStack justify="space-between" align="start" gap={3}>
          <Stack gap={1}>
            <Heading as="h3" size="md">
              {title}
            </Heading>
            {pod.name !== undefined ? (
              <Text fontSize="sm" color="fg.muted">
                {featureKindLabel(pod.feature)}
              </Text>
            ) : null}
          </Stack>
          <HStack gap={2} flexShrink={0} flexWrap="wrap" justify="end">
            {role !== undefined ? (
              <Badge colorPalette="brand" variant="subtle">
                {podRoleLabel(role)}
              </Badge>
            ) : null}
            <Badge colorPalette="brand" variant="outline">
              {pod.visibility}
            </Badge>
            {pod.status === 'archived' ? (
              <Badge colorPalette="gray" variant="subtle">
                archived
              </Badge>
            ) : null}
          </HStack>
        </HStack>
      </Link>
    </Box>
  );
}
