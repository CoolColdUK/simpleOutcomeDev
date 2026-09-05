'use client';

import {useState} from 'react';
import {Button, Field, Heading, Input, Stack, Switch, Table, Text} from '@chakra-ui/react';
import {FpAction, FpResource, parseFpCurrency, PodRole, type FpPermissionMatrix} from '@so/model';
import updateDbFpSetting from '@/lib/api/db/updateDbFpSetting';
import deleteAllDbFpTransactions from '@/lib/api/db/deleteAllDbFpTransactions';
import type {DbFpSetting} from '@/lib/api/db/mapDbFpSetting';

export interface FpSettingsPanelProps {
  readonly podId: string;
  readonly setting: DbFpSetting;
  readonly canUpdateSettings: boolean;
  readonly canDeleteAll: boolean;
  readonly onSaved: () => void;
}

const RESOURCES = Object.values(FpResource);
const ACTIONS = Object.values(FpAction);
const ROLES = Object.values(PodRole);

export default function FpSettingsPanel({
  podId,
  setting,
  canUpdateSettings,
  canDeleteAll,
  onSaved,
}: FpSettingsPanelProps) {
  const [currency, setCurrency] = useState(setting.currency);
  const [matrix, setMatrix] = useState<FpPermissionMatrix>(setting.permission);
  const [saving, setSaving] = useState(false);

  const toggle = (role: PodRole, resource: FpResource, action: FpAction): void => {
    const current = matrix[role][resource];
    const next = current.includes(action) ? current.filter((a) => a !== action) : [...current, action];
    setMatrix({...matrix, [role]: {...matrix[role], [resource]: next}});
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      await updateDbFpSetting(podId, {currency: parseFpCurrency(currency), permission: matrix});
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const wipe = async (): Promise<void> => {
    if (!window.confirm('Delete all transactions in this pod?')) {
      return;
    }
    await deleteAllDbFpTransactions(podId);
    onSaved();
  };

  return (
    <Stack gap={4} pt={6}>
      <Heading as="h2" size="md">
        Financial planning
      </Heading>
      <Field.Root maxW="xs">
        <Field.Label>Currency</Field.Label>
        <Input value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!canUpdateSettings} />
      </Field.Root>
      {canUpdateSettings ? (
        <Stack gap={2} overflowX="auto">
          <Text fontSize="sm">Permissions</Text>
          {ROLES.map((role) => (
            <Stack key={role} gap={1}>
              <Text fontWeight="medium">{role}</Text>
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Resource</Table.ColumnHeader>
                    {ACTIONS.map((a) => (
                      <Table.ColumnHeader key={a}>{a}</Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {RESOURCES.map((resource) => (
                    <Table.Row key={resource}>
                      <Table.Cell>{resource}</Table.Cell>
                      {ACTIONS.map((action) => (
                        <Table.Cell key={action}>
                          <Switch.Root
                            size="sm"
                            checked={matrix[role][resource].includes(action)}
                            onCheckedChange={() => toggle(role, resource, action)}
                          >
                            <Switch.HiddenInput />
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch.Root>
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Stack>
          ))}
          <Button colorPalette="brand" loading={saving} onClick={() => void save()} alignSelf="start">
            Save money settings
          </Button>
        </Stack>
      ) : (
        <Text color="fg.muted">Display currency: {setting.currency}</Text>
      )}
      {canDeleteAll ? (
        <Button variant="outline" colorPalette="brand" onClick={() => void wipe()} alignSelf="start">
          Delete all transactions
        </Button>
      ) : null}
    </Stack>
  );
}
