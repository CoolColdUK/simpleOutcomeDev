'use client';

import {useEffect, useMemo, useState} from 'react';
import {Button, HStack, Input, NativeSelect, SimpleGrid, Stack, Text} from '@chakra-ui/react';
import type {DbBookWorkspace} from '@/lib/api/db/book/loadDbBookWorkspace';
import createDbBkAsset from '@/lib/api/db/book/createDbBkAsset';
import createDbBkAssetType from '@/lib/api/db/book/createDbBkAssetType';
import deleteDbBkAssetType from '@/lib/api/db/book/deleteDbBkAssetType';
import BookAssetReadOnlyCard from '@/components/book/BookAssetReadOnlyCard';
import BookAddAssetTypeDialog from '@/components/book/BookAddAssetTypeDialog';

export interface BookAssetsSectionProps {
  readonly workspace: DbBookWorkspace;
  readonly podId: string;
  readonly canWrite: boolean;
  readonly onEditAsset: (assetId: string) => void;
  readonly onReload: () => Promise<void>;
  readonly onError: (message: string) => void;
}

const ALL_TYPES = '';

export default function BookAssetsSection({workspace, podId, canWrite, onEditAsset, onReload, onError}: BookAssetsSectionProps) {
  const [typeFilter, setTypeFilter] = useState(ALL_TYPES);
  const [search, setSearch] = useState('');
  const [assetTypeDialogOpen, setAssetTypeDialogOpen] = useState(false);
  const [addTypeId, setAddTypeId] = useState(workspace.assetTypes[0]?.id ?? '');

  useEffect(() => {
    if (addTypeId === '' && workspace.assetTypes[0] !== undefined) {
      queueMicrotask(() => setAddTypeId(workspace.assetTypes[0]!.id));
    }
  }, [addTypeId, workspace.assetTypes]);

  const typeById = useMemo(() => new Map(workspace.assetTypes.map((type) => [type.id, type])), [workspace.assetTypes]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workspace.assets.filter((asset) => {
      if (typeFilter !== ALL_TYPES && asset.assetTypeId !== typeFilter) {
        return false;
      }
      if (query === '') {
        return true;
      }
      const typeLabel = typeById.get(asset.assetTypeId)?.label.toLowerCase() ?? '';
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.descriptionMd.toLowerCase().includes(query) ||
        typeLabel.includes(query)
      );
    });
  }, [search, typeById, typeFilter, workspace.assets]);

  return (
    <Stack gap={4} w="full">
      {canWrite ? (
        <HStack wrap="wrap" gap={2}>
          <NativeSelect.Root size="sm" maxW="14rem">
            <NativeSelect.Field value={addTypeId} onChange={(event) => setAddTypeId(event.target.value)}>
              {workspace.assetTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
          <Button
            size="sm"
            onClick={() => {
              if (addTypeId === '') {
                return;
              }
              void createDbBkAsset(podId, addTypeId, 'New asset')
                .then(() => onReload())
                .catch((err: unknown) => onError(err instanceof Error ? err.message : String(err)));
            }}
          >
            Add asset
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAssetTypeDialogOpen(true)}>
            Add custom asset type
          </Button>
        </HStack>
      ) : null}
      <HStack wrap="wrap" gap={2} align="center">
        <Text fontSize="sm" fontWeight="medium">
          Filter
        </Text>
        <Button size="xs" variant={typeFilter === ALL_TYPES ? 'solid' : 'outline'} onClick={() => setTypeFilter(ALL_TYPES)}>
          All types
        </Button>
        {workspace.assetTypes.map((type) => (
          <Button
            key={type.id}
            size="xs"
            variant={typeFilter === type.id ? 'solid' : 'outline'}
            onClick={() => setTypeFilter(type.id)}
          >
            {type.label}
          </Button>
        ))}
        {canWrite && typeFilter !== ALL_TYPES && !typeById.get(typeFilter)?.isSystem ? (
          <Button
            size="xs"
            variant="outline"
            colorPalette="red"
            onClick={() =>
              void deleteDbBkAssetType(podId, typeFilter)
                .then(() => {
                  setTypeFilter(ALL_TYPES);
                  return onReload();
                })
                .catch((err: unknown) => onError(err instanceof Error ? err.message : String(err)))
            }
          >
            Delete type
          </Button>
        ) : null}
      </HStack>
      <Input
        size="sm"
        placeholder="Search assets…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        maxW={{base: 'full', md: '20rem'}}
      />
      {filteredAssets.length === 0 ? (
        <Text color="fg.muted">No assets match this filter.</Text>
      ) : (
        <SimpleGrid columns={{base: 1, md: 2, lg: 3}} gap={3} w="full">
          {filteredAssets.map((asset) => {
            const typeLabel = typeById.get(asset.assetTypeId)?.label ?? 'Asset';
            return (
              <BookAssetReadOnlyCard
                key={asset.id}
                asset={asset}
                typeLabel={typeLabel}
                onEdit={() => onEditAsset(asset.id)}
              />
            );
          })}
        </SimpleGrid>
      )}
      <BookAddAssetTypeDialog
        open={assetTypeDialogOpen}
        onClose={() => setAssetTypeDialogOpen(false)}
        onCreate={async (label) => {
          const slug = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
          await createDbBkAssetType(podId, label, slug);
          await onReload();
        }}
      />
    </Stack>
  );
}
