'use client';

import {useEffect, useState} from 'react';
import {Button, Field, HStack, Image, Input, Stack, Text} from '@chakra-ui/react';
import loadDbBookWorkspace from '@/lib/api/db/book/loadDbBookWorkspace';
import updateDbBkBook from '@/lib/api/db/book/updateDbBkBook';
import uploadStorageBookCover from '@/lib/api/storage/uploadStorageBookCover';
import resolveStorageBookImageSignedUrls from '@/lib/api/storage/resolveStorageBookImageSignedUrls';
import {BUCKET_POD_PRIVATE} from '@so/model';
import getSupabaseBrowserClient from '@/lib/supabase/getSupabaseBrowserClient';

export interface BookPodSettingsSectionProps {
  readonly podId: string;
  readonly canManage: boolean;
}

export default function BookPodSettingsSection({podId, canManage}: BookPodSettingsSectionProps) {
  const [subtitle, setSubtitle] = useState('');
  const [coverPath, setCoverPath] = useState<string | undefined>(undefined);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadDbBookWorkspace(podId).then((workspace) => {
      if (workspace === undefined) {
        return;
      }
      setSubtitle(workspace.book.subtitle);
      setCoverPath(workspace.book.coverStoragePath);
    });
  }, [podId]);

  useEffect(() => {
    if (coverPath === undefined) {
      return;
    }
    let cancelled = false;
    void resolveStorageBookImageSignedUrls(`![](soimg:${encodeURIComponent(coverPath)})`).then((resolved) => {
      const match = resolved.match(/\]\(<([^>]+)>\)/);
      if (!cancelled && match?.[1] !== undefined) {
        setCoverPreview(match[1]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [coverPath]);

  const save = async (): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      await updateDbBkBook(podId, {subtitle, coverStoragePath: coverPath ?? null});
    } catch (unknown: unknown) {
      setError(unknown instanceof Error ? unknown.message : String(unknown));
    } finally {
      setSaving(false);
    }
  };

  const removeCover = async (): Promise<void> => {
    if (coverPath !== undefined) {
      const supabase = getSupabaseBrowserClient();
      await supabase.storage.from(BUCKET_POD_PRIVATE).remove([coverPath]);
    }
    setCoverPath(undefined);
    await updateDbBkBook(podId, {coverStoragePath: null});
  };

  if (!canManage) {
    return <Text color="fg.muted">Only pod writers can edit book metadata.</Text>;
  }

  return (
    <Stack gap={3} w="full" maxW="md">
      <Text fontWeight="semibold">Book metadata</Text>
      <Field.Root>
        <Field.Label>Subtitle</Field.Label>
        <Input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
      </Field.Root>
      {coverPreview !== '' ? <Image src={coverPreview} alt="Book cover" maxH="200px" borderRadius="md" /> : null}
      <HStack>
        <Button
          variant="outline"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/webp';
            input.onchange = () => {
              const file = input.files?.[0];
              if (file === undefined) {
                return;
              }
              void uploadStorageBookCover(podId, file).then((path) => setCoverPath(path));
            };
            input.click();
          }}
        >
          {coverPath === undefined ? 'Upload cover' : 'Replace cover'}
        </Button>
        {coverPath !== undefined ? (
          <Button variant="outline" onClick={() => void removeCover()}>
            Remove cover
          </Button>
        ) : null}
      </HStack>
      {error !== '' ? (
        <Text color="fg.error" fontSize="sm">
          {error}
        </Text>
      ) : null}
      <Button colorPalette="brand" loading={saving} onClick={() => void save()} alignSelf="start">
        Save book metadata
      </Button>
    </Stack>
  );
}
