'use client';

import {Button, Field, Heading, HStack, Input, Stack, Text} from '@chakra-ui/react';
import {useState} from 'react';
import {PodRole} from '@so/model';
import type {DbPodMember} from '@/lib/api/db/listDbPodMembers';
import type {DbPodJoinRequest} from '@/lib/api/db/listDbPodJoinRequests';
import addDbPodMemberByUsername from '@/lib/api/db/addDbPodMemberByUsername';
import approveDbPodJoinRequest from '@/lib/api/db/approveDbPodJoinRequest';
import denyDbPodJoinRequest from '@/lib/api/db/denyDbPodJoinRequest';

export interface PodWorkspaceAccessProps {
  readonly podId: string;
  readonly members: readonly DbPodMember[];
  readonly requests: readonly DbPodJoinRequest[];
  readonly canAddMembers: boolean;
  readonly canApprove: boolean;
  readonly onChanged: () => void;
  readonly onError: (message: string) => void;
}

export default function PodWorkspaceAccess({
  podId,
  members,
  requests,
  canAddMembers,
  canApprove,
  onChanged,
  onError,
}: PodWorkspaceAccessProps) {
  const [addUsername, setAddUsername] = useState('');

  const addMember = async (): Promise<void> => {
    try {
      await addDbPodMemberByUsername(podId, addUsername.trim(), PodRole.USER);
      setAddUsername('');
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={4}>
      {canAddMembers ? (
        <Stack maxW="sm" gap={2}>
          <Field.Root>
            <Field.Label>Add space member by username</Field.Label>
            <Input value={addUsername} onChange={(e) => setAddUsername(e.target.value)} />
          </Field.Root>
          <Button colorPalette="brand" onClick={() => void addMember()}>
            Add as pod user
          </Button>
        </Stack>
      ) : null}
      <Stack gap={2}>
        <Heading as="h2" size="md">
          Members
        </Heading>
        {members.map((m) => (
          <Text key={m.userId}>
            {m.username ?? m.userId.slice(0, 8)} · {m.role.replaceAll('_', ' ')}
          </Text>
        ))}
      </Stack>
      {canApprove && requests.length > 0 ? (
        <Stack gap={2}>
          <Heading as="h2" size="md">
            Join requests
          </Heading>
          {requests.map((req) => (
            <HStack key={req.id}>
              <Text>{req.username ?? req.userId.slice(0, 8)}</Text>
              <Button size="sm" colorPalette="brand" onClick={() => void approveDbPodJoinRequest(req.id).then(onChanged)}>
                Approve
              </Button>
              <Button size="sm" variant="outline" colorPalette="brand" onClick={() => void denyDbPodJoinRequest(req.id).then(onChanged)}>
                Deny
              </Button>
            </HStack>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
