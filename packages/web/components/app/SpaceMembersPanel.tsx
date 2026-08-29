'use client';

import {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Heading, HStack, Stack, Text} from '@chakra-ui/react';
import {SpaceRole, spaceRoleLabel} from '@so/model';
import listDbSpaceMembers, {type DbSpaceMember} from '@/lib/api/db/listDbSpaceMembers';
import updateDbSpaceMemberRole from '@/lib/api/db/updateDbSpaceMemberRole';

export interface SpaceMembersPanelProps {
  readonly spaceId: string;
}

export default function SpaceMembersPanel({spaceId}: SpaceMembersPanelProps) {
  const [members, setMembers] = useState<readonly DbSpaceMember[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    setMembers(await listDbSpaceMembers(spaceId));
  }, [spaceId]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => load())
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [load]);

  const setRole = async (userId: string, role: Exclude<SpaceRole, SpaceRole.OWNER>): Promise<void> => {
    setError('');
    try {
      await updateDbSpaceMemberRole(spaceId, userId, role);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={3}>
      <Heading as="h2" size="md">
        Members
      </Heading>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      {members.map((member) => (
        <HStack key={member.userId} justify="space-between" flexWrap="wrap">
          <Text>
            {member.username ?? member.userId.slice(0, 8)} · {spaceRoleLabel(member.role)}
          </Text>
          {member.role !== SpaceRole.OWNER ? (
            <HStack>
              <Button size="xs" colorPalette="brand" onClick={() => void setRole(member.userId, SpaceRole.ADMIN)}>
                Admin
              </Button>
              <Button size="xs" variant="outline" colorPalette="brand" onClick={() => void setRole(member.userId, SpaceRole.USER)}>
                User
              </Button>
            </HStack>
          ) : null}
        </HStack>
      ))}
    </Stack>
  );
}
