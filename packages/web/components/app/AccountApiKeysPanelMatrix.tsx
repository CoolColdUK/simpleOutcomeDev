'use client';

import {Checkbox, Heading, Stack, Table} from '@chakra-ui/react';
import {
  ApiKeyAction,
  apiKeyMatrixCellsCheck,
  apiKeyMatrixColumnCheck,
  toggleApiKeyMatrixPodCell,
  toggleApiKeyMatrixPodColumn,
  toggleApiKeyMatrixPodRow,
  toggleApiKeyMatrixSpaceCell,
  toggleApiKeyMatrixSpaceColumn,
  toggleApiKeyMatrixSpaceRow,
  type ApiKeyMatrixCheck,
  type ApiKeyPermissionMatrix,
  type ApiKeySpaceResource,
} from '@so/model';

const COLUMNS: readonly {readonly action: ApiKeyAction; readonly label: string}[] = [
  {action: ApiKeyAction.CREATE, label: 'Create'},
  {action: ApiKeyAction.READ, label: 'Read'},
  {action: ApiKeyAction.UPDATE, label: 'Update'},
  {action: ApiKeyAction.DELETE, label: 'Delete'},
];

export interface AccountApiKeysPanelMatrixProps {
  readonly matrix: ApiKeyPermissionMatrix;
  readonly onChange: (matrix: ApiKeyPermissionMatrix) => void;
}

function checkedProp(state: boolean | ApiKeyMatrixCheck): boolean | 'indeterminate' {
  if (state === true || state === 'on') {
    return true;
  }
  if (state === 'mixed') {
    return 'indeterminate';
  }
  return false;
}

function MatrixCheck({label, state, onToggle}: {readonly label: string; readonly state: boolean | ApiKeyMatrixCheck; readonly onToggle: () => void}) {
  return (
    <Checkbox.Root checked={checkedProp(state)} onCheckedChange={() => onToggle()} aria-label={label}>
      <Checkbox.HiddenInput />
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
    </Checkbox.Root>
  );
}

function headerCells(rows: readonly {readonly create: boolean; readonly read: boolean; readonly update: boolean; readonly delete: boolean}[], onColumn: (action: ApiKeyAction) => void) {
  return COLUMNS.map((column) => (
    <Table.ColumnHeader key={column.action}>
      <Stack gap={1} align="start">
        <MatrixCheck label={`${column.label} for every row`} state={apiKeyMatrixColumnCheck(rows, column.action)} onToggle={() => onColumn(column.action)} />
        {column.label}
      </Stack>
    </Table.ColumnHeader>
  ));
}

export default function AccountApiKeysPanelMatrix({matrix, onChange}: AccountApiKeysPanelMatrixProps) {
  return (
    <>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader />
            <Table.ColumnHeader>Pod</Table.ColumnHeader>
            {headerCells(
              matrix.pods.map((row) => row.cells),
              (action) => onChange(toggleApiKeyMatrixPodColumn(matrix, action)),
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {matrix.pods.map((row) => {
            const label = `${row.spaceName} / ${row.podName}`;
            return (
              <Table.Row key={row.podId}>
                <Table.Cell>
                  <MatrixCheck label={`All actions for ${label}`} state={apiKeyMatrixCellsCheck(row.cells)} onToggle={() => onChange(toggleApiKeyMatrixPodRow(matrix, row.podId))} />
                </Table.Cell>
                <Table.Cell>{label}</Table.Cell>
                {COLUMNS.map((column) => (
                  <Table.Cell key={column.action}>
                    <MatrixCheck
                      label={`${column.label} ${label}`}
                      state={row.cells[column.action]}
                      onToggle={() => onChange(toggleApiKeyMatrixPodCell(matrix, row.podId, column.action))}
                    />
                  </Table.Cell>
                ))}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
      {matrix.spaces.map((section) => (
        <StackSection
          key={section.spaceId}
          matrix={matrix}
          spaceId={section.spaceId}
          spaceName={section.spaceName}
          onChange={onChange}
        />
      ))}
    </>
  );
}

function StackSection({
  matrix,
  spaceId,
  spaceName,
  onChange,
}: {
  readonly matrix: ApiKeyPermissionMatrix;
  readonly spaceId: string;
  readonly spaceName: string;
  readonly onChange: (matrix: ApiKeyPermissionMatrix) => void;
}) {
  const section = matrix.spaces.find((item) => item.spaceId === spaceId);
  if (section === undefined) {
    return null;
  }
  const rows = [
    {resource: 'space' as const, label: 'Space', cells: section.space},
    {resource: 'group' as const, label: 'Group', cells: section.group},
  ];
  return (
    <>
      <Heading as="h3" size="sm">
        {spaceName}
      </Heading>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader />
            <Table.ColumnHeader />
            {headerCells(
              rows.map((row) => row.cells),
              (action) => onChange(toggleApiKeyMatrixSpaceColumn(matrix, spaceId, action)),
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((row) => (
            <SpaceResourceRow key={row.resource} matrix={matrix} spaceId={spaceId} spaceName={spaceName} resource={row.resource} label={row.label} onChange={onChange} />
          ))}
        </Table.Body>
      </Table.Root>
    </>
  );
}

function SpaceResourceRow({
  matrix,
  spaceId,
  spaceName,
  resource,
  label,
  onChange,
}: {
  readonly matrix: ApiKeyPermissionMatrix;
  readonly spaceId: string;
  readonly spaceName: string;
  readonly resource: ApiKeySpaceResource;
  readonly label: string;
  readonly onChange: (matrix: ApiKeyPermissionMatrix) => void;
}) {
  const section = matrix.spaces.find((item) => item.spaceId === spaceId);
  if (section === undefined) {
    return null;
  }
  const cells = resource === 'space' ? section.space : section.group;
  const rowLabel = `${spaceName} ${label}`;
  return (
    <Table.Row>
      <Table.Cell>
        <MatrixCheck
          label={`All actions for ${rowLabel}`}
          state={apiKeyMatrixCellsCheck(cells)}
          onToggle={() => onChange(toggleApiKeyMatrixSpaceRow(matrix, spaceId, resource))}
        />
      </Table.Cell>
      <Table.Cell>{label}</Table.Cell>
      {COLUMNS.map((column) => (
        <Table.Cell key={column.action}>
          <MatrixCheck
            label={`${column.label} ${rowLabel}`}
            state={cells[column.action]}
            onToggle={() => onChange(toggleApiKeyMatrixSpaceCell(matrix, spaceId, resource, column.action))}
          />
        </Table.Cell>
      ))}
    </Table.Row>
  );
}
