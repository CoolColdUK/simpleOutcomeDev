'use client';

import {Button, Text} from '@chakra-ui/react';
import type {PodVisibility} from '@so/model';

export interface SpaceFindPodsPageJoinActionProps {
  readonly podId: string;
  readonly visibility: PodVisibility;
  readonly isMember: boolean;
  readonly isRequested: boolean;
  readonly onJoin: (podId: string, visibility: PodVisibility) => void;
}

export default function SpaceFindPodsPageJoinAction({
  podId,
  visibility,
  isMember,
  isRequested,
  onJoin,
}: SpaceFindPodsPageJoinActionProps) {
  if (isMember) {
    return (
      <Text fontSize="sm" color="fg.muted">
        Already a member
      </Text>
    );
  }
  if (isRequested) {
    return (
      <Text fontSize="sm" color="fg.muted">
        Requested
      </Text>
    );
  }
  return (
    <Button size="sm" colorPalette="brand" alignSelf="start" onClick={() => onJoin(podId, visibility)}>
      {visibility === 'open' ? 'Join' : 'Request to join'}
    </Button>
  );
}
