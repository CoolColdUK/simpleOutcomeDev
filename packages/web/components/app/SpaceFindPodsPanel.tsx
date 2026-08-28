'use client';

import {useState} from 'react';
import {Alert, Button, Field, Heading, Input, Stack, Text} from '@chakra-ui/react';
import type {PodVisibility} from '@so/model';
import searchDbPods from '@/lib/api/db/searchDbPods';
import joinDbOpenPod from '@/lib/api/db/joinDbOpenPod';
import createDbPodJoinRequest from '@/lib/api/db/createDbPodJoinRequest';
import featureKindLabel from '@/lib/pod/featureKindLabel';

export interface SpaceFindPodsPanelProps {
  readonly spaceId: string;
  readonly memberPodIds: readonly string[];
  readonly onChanged: () => void;
}

export default function SpaceFindPodsPanel({spaceId, memberPodIds, onChanged}: SpaceFindPodsPanelProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [rows, setRows] = useState<
    readonly {id: string; feature: 'todo_list' | 'shopping_list'; name: string | undefined; visibility: PodVisibility}[]
  >([]);

  const search = async (): Promise<void> => {
    setError('');
    try {
      const safe = query.replace(/[%_,()]/g, '');
      setRows(await searchDbPods(spaceId, safe));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const join = async (podId: string, visibility: PodVisibility): Promise<void> => {
    setError('');
    try {
      if (visibility === 'open') {
        await joinDbOpenPod(podId);
      } else {
        await createDbPodJoinRequest(podId);
      }
      onChanged();
      await search();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Stack gap={3}>
      <Heading as="h2" size="md">
        Find pods
      </Heading>
      <Field.Root>
        <Field.Label>Search</Field.Label>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or feature" />
      </Field.Root>
      <Button colorPalette="brand" alignSelf="start" onClick={() => void search()}>
        Search
      </Button>
      {error !== '' ? (
        <Alert.Root status="error">
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      ) : null}
      {rows.map((row) => (
        <Stack key={row.id} borderWidth="1px" borderColor="border.subtle" p={3} borderRadius="md">
          <Text>
            {row.name ?? featureKindLabel(row.feature)} · {row.visibility}
          </Text>
          {memberPodIds.includes(row.id) ? (
            <Text fontSize="sm" color="fg.muted">
              Already a member
            </Text>
          ) : (
            <Button
              size="sm"
              colorPalette="brand"
              alignSelf="start"
              onClick={() => void join(row.id, row.visibility)}
            >
              {row.visibility === 'open' ? 'Join' : 'Request to join'}
            </Button>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
