'use client';

import {Checkbox, Stack, Table, Text} from '@chakra-ui/react';
import {
  ApiKeyAction,
  FeatureKind,
  apiKeyMatrixCellsCheck,
  apiKeyMatrixColumnCheck,
  toggleApiKeyMatrixDeleteAll,
  toggleApiKeyMatrixPodCell,
  toggleApiKeyMatrixPodColumn,
  toggleApiKeyMatrixPodRow,
  toggleApiKeyMatrixProfile,
  toggleApiKeyMatrixProfileRow,
  toggleApiKeyMatrixSpaceCell,
  toggleApiKeyMatrixSpaceRow,
  type ApiKeyMatrixCells,
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

const HEADER_BG = 'bg.muted';

export interface AccountApiKeysPanelMatrixProps {
  readonly matrix: ApiKeyPermissionMatrix;
  readonly onChange: (matrix: ApiKeyPermissionMatrix) => void;
}

function profileRowCheck(read: boolean, update: boolean): ApiKeyMatrixCheck {
  if (read && update) {
    return 'on';
  }
  if (read || update) {
    return 'mixed';
  }
  return 'off';
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

function actionCells(
  label: string,
  cells: ApiKeyMatrixCells,
  onToggle: (action: ApiKeyAction) => void,
) {
  return COLUMNS.map((column) => (
    <Table.Cell key={column.action}>
      <MatrixCheck label={`${column.label} ${label}`} state={cells[column.action]} onToggle={() => onToggle(column.action)} />
    </Table.Cell>
  ));
}

export default function AccountApiKeysPanelMatrix({matrix, onChange}: AccountApiKeysPanelMatrixProps) {
  const spaces = [...matrix.spaces].sort((left, right) => left.spaceName.localeCompare(right.spaceName));
  return (
    <Stack gap={4}>
      <Table.Root size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader />
            <Table.ColumnHeader>Pod</Table.ColumnHeader>
            {COLUMNS.map((column) => (
              <Table.ColumnHeader key={column.action}>
                <Stack gap={1} align="start">
                  <MatrixCheck
                    label={`${column.label} for every pod row`}
                    state={apiKeyMatrixColumnCheck(
                      matrix.pods.map((row) => row.cells),
                      column.action,
                    )}
                    onToggle={() => onChange(toggleApiKeyMatrixPodColumn(matrix, column.action))}
                  />
                  {column.label}
                </Stack>
              </Table.ColumnHeader>
            ))}
            <Table.ColumnHeader>Delete all transactions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              <MatrixCheck
                label="All profile actions"
                state={profileRowCheck(matrix.profile.read, matrix.profile.update)}
                onToggle={() => onChange(toggleApiKeyMatrixProfileRow(matrix))}
              />
            </Table.Cell>
            <Table.Cell>Profile</Table.Cell>
            <Table.Cell />
            <Table.Cell>
              <MatrixCheck label="Read profile" state={matrix.profile.read} onToggle={() => onChange(toggleApiKeyMatrixProfile(matrix, 'read'))} />
            </Table.Cell>
            <Table.Cell>
              <MatrixCheck label="Update profile" state={matrix.profile.update} onToggle={() => onChange(toggleApiKeyMatrixProfile(matrix, 'update'))} />
            </Table.Cell>
            <Table.Cell />
            <Table.Cell />
          </Table.Row>
          {spaces.flatMap((section) => {
            const pods = matrix.pods.filter((row) => row.spaceId === section.spaceId);
            return [
              <SpaceGrantRow
                key={`${section.spaceId}-space`}
                matrix={matrix}
                spaceId={section.spaceId}
                label={section.spaceName}
                resource="space"
                header
                onChange={onChange}
              />,
              <SpaceGrantRow
                key={`${section.spaceId}-group`}
                matrix={matrix}
                spaceId={section.spaceId}
                label="Group"
                resource="group"
                header
                onChange={onChange}
              />,
              ...pods.map((row) => (
                <Table.Row key={row.podId}>
                  <Table.Cell>
                    <MatrixCheck
                      label={`All actions for ${row.podName}`}
                      state={apiKeyMatrixCellsCheck(row.cells)}
                      onToggle={() => onChange(toggleApiKeyMatrixPodRow(matrix, row.podId))}
                    />
                  </Table.Cell>
                  <Table.Cell>{row.podName}</Table.Cell>
                  {actionCells(row.podName, row.cells, (action) => onChange(toggleApiKeyMatrixPodCell(matrix, row.podId, action)))}
                  <Table.Cell>
                    {row.feature === FeatureKind.FINANCIAL_PLANNING ? (
                      <MatrixCheck
                        label={`Delete all transactions ${row.podName}`}
                        state={row.deleteAll}
                        onToggle={() => onChange(toggleApiKeyMatrixDeleteAll(matrix, row.podId))}
                      />
                    ) : null}
                  </Table.Cell>
                </Table.Row>
              )),
            ];
          })}
        </Table.Body>
      </Table.Root>
      {spaces.length === 0 ? <Text color="fg.muted">No spaces yet. Profile can still be granted.</Text> : null}
    </Stack>
  );
}

function SpaceGrantRow({
  matrix,
  spaceId,
  label,
  resource,
  header,
  onChange,
}: {
  readonly matrix: ApiKeyPermissionMatrix;
  readonly spaceId: string;
  readonly label: string;
  readonly resource: ApiKeySpaceResource;
  readonly header: boolean;
  readonly onChange: (matrix: ApiKeyPermissionMatrix) => void;
}) {
  const section = matrix.spaces.find((item) => item.spaceId === spaceId);
  if (section === undefined) {
    return null;
  }
  const cells = resource === 'space' ? section.space : section.group;
  const rowLabel = resource === 'space' ? label : `${section.spaceName} Group`;
  return (
    <Table.Row bg={header ? HEADER_BG : undefined}>
      <Table.Cell>
        <MatrixCheck
          label={`All actions for ${rowLabel}`}
          state={apiKeyMatrixCellsCheck(cells)}
          onToggle={() => onChange(toggleApiKeyMatrixSpaceRow(matrix, spaceId, resource))}
        />
      </Table.Cell>
      <Table.Cell fontWeight={resource === 'space' ? 'semibold' : 'medium'}>{label}</Table.Cell>
      {actionCells(rowLabel, cells, (action) => onChange(toggleApiKeyMatrixSpaceCell(matrix, spaceId, resource, action)))}
      <Table.Cell />
    </Table.Row>
  );
}
