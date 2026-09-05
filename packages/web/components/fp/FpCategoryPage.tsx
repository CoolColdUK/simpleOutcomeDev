'use client';

import {Button, HStack, Stack, Table, Text} from '@chakra-ui/react';
import {fpCategoryDirectionLabel} from '@so/model';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';

export interface FpCategoryPageProps {
  readonly categories: readonly DbFpCategory[];
  readonly canCreate: boolean;
  readonly canUpdate: boolean;
  readonly canDelete: boolean;
  readonly onAdd: () => void;
  readonly onEdit: (category: DbFpCategory) => void;
  readonly onDelete: (category: DbFpCategory) => void;
}

export default function FpCategoryPage({
  categories,
  canCreate,
  canUpdate,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}: FpCategoryPageProps) {
  return (
    <Stack gap={3}>
      <HStack justify="space-between">
        <Text fontWeight="medium">Categories</Text>
        {canCreate ? (
          <Button size="sm" colorPalette="brand" onClick={onAdd}>
            Add category
          </Button>
        ) : null}
      </HStack>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Direction</Table.ColumnHeader>
            <Table.ColumnHeader>Budget</Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {categories.map((category) => (
            <Table.Row key={category.id}>
              <Table.Cell>
                {category.name}
                {category.favourite ? ' ★' : ''}
              </Table.Cell>
              <Table.Cell>{fpCategoryDirectionLabel(category.direction)}</Table.Cell>
              <Table.Cell>
                {category.budgetAmount === undefined
                  ? '—'
                  : `${category.budgetAmount} ${category.budgetPeriod ?? ''}`}
              </Table.Cell>
              <Table.Cell>
                <HStack gap={1}>
                  {canUpdate ? (
                    <Button size="xs" variant="outline" onClick={() => onEdit(category)}>
                      Edit
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button size="xs" variant="outline" onClick={() => onDelete(category)}>
                      Delete
                    </Button>
                  ) : null}
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
      {categories.length === 0 ? <Text color="fg.muted">No categories yet.</Text> : null}
    </Stack>
  );
}
