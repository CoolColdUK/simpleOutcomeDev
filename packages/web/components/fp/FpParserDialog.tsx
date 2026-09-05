'use client';

import {useState} from 'react';
import {
  Box,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Field,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react';
import {
  FpAmountSign,
  FpColumnTarget,
  mapCsvRowToFpTransaction,
  parseFpCsvTable,
  parseFpName,
  type FpColumnMap,
} from '@so/model';
import createDbFpParser from '@/lib/api/db/createDbFpParser';
import updateDbFpParser from '@/lib/api/db/updateDbFpParser';
import type {DbFpParser} from '@/lib/api/db/mapDbFpParser';

const TARGETS = Object.values(FpColumnTarget);

export interface FpParserDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly parser?: DbFpParser;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export default function FpParserDialog({open, podId, parser, onClose, onSaved}: FpParserDialogProps) {
  const [name, setName] = useState(parser?.name ?? '');
  const [useIdentifier, setUseIdentifier] = useState(parser?.identifier !== undefined);
  const [identifier, setIdentifier] = useState(parser?.identifier ?? '');
  const [hasHeader, setHasHeader] = useState(parser?.hasHeader ?? true);
  const [skipRows, setSkipRows] = useState(String(parser?.skipRows ?? 0));
  const [headers, setHeaders] = useState<readonly string[]>(Object.keys(parser?.columnMap ?? {}));
  const [sampleRow, setSampleRow] = useState<Record<string, string> | undefined>(undefined);
  const [columnMap, setColumnMap] = useState<FpColumnMap>(parser?.columnMap ?? {});
  const [pendingColumn, setPendingColumn] = useState<string | undefined>(undefined);
  const [dateFormat, setDateFormat] = useState(parser?.columnMap.date?.dateFormat ?? 'DD/MM/YYYY');
  const [sign, setSign] = useState<FpAmountSign>(parser?.columnMap.amount?.sign ?? FpAmountSign.AS_IS);
  const [saving, setSaving] = useState(false);

  const onFile = async (file: File): Promise<void> => {
    const text = await file.text();
    const table = parseFpCsvTable(text, ',', hasHeader, Number(skipRows) || 0);
    setIdentifier(table.headerLine);
    setHeaders(table.headers);
    setSampleRow(table.rows[0]);
  };

  const mappingFor = (target: FpColumnTarget, column: string) => {
    if (target === FpColumnTarget.DATE) {
      return {column, dateFormat};
    }
    if (target === FpColumnTarget.AMOUNT) {
      return {column, sign};
    }
    return {column};
  };

  const assign = (target: FpColumnTarget, column: string): void => {
    setColumnMap({...columnMap, [target]: mappingFor(target, column)});
    setPendingColumn(undefined);
  };

  const preview = sampleRow === undefined ? undefined : mapCsvRowToFpTransaction(sampleRow, {
    ...columnMap,
    [FpColumnTarget.DATE]: columnMap[FpColumnTarget.DATE]
      ? {...columnMap[FpColumnTarget.DATE], dateFormat}
      : undefined,
    [FpColumnTarget.AMOUNT]: columnMap[FpColumnTarget.AMOUNT]
      ? {...columnMap[FpColumnTarget.AMOUNT], sign}
      : undefined,
  });

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const map: FpColumnMap = {
        ...columnMap,
        [FpColumnTarget.DATE]: columnMap[FpColumnTarget.DATE]
          ? {...columnMap[FpColumnTarget.DATE], dateFormat}
          : undefined,
        [FpColumnTarget.AMOUNT]: columnMap[FpColumnTarget.AMOUNT]
          ? {...columnMap[FpColumnTarget.AMOUNT], sign}
          : undefined,
      };
      const opts = {
        identifier: useIdentifier ? identifier : undefined,
        hasHeader,
        skipRows: Number(skipRows) || 0,
      };
      if (parser === undefined) {
        await createDbFpParser(podId, parseFpName(name), map, opts);
      } else {
        await updateDbFpParser(parser.id, {name: parseFpName(name), columnMap: map, ...opts});
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="lg">
          <DialogHeader>
            <DialogTitle>{parser === undefined ? 'New parser' : 'Edit parser'}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field.Root>
              <Box
                borderWidth="1px"
                borderRadius="md"
                p={4}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file !== undefined) {
                    void onFile(file);
                  }
                }}
              >
                <Text fontSize="sm">Drop an example CSV, or</Text>
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  mt={2}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file !== undefined) {
                      void onFile(file);
                    }
                  }}
                />
              </Box>
              <Switch.Root checked={useIdentifier} onCheckedChange={(e) => setUseIdentifier(e.checked)}>
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label>Use first-row identifier</Switch.Label>
              </Switch.Root>
              <Switch.Root checked={hasHeader} onCheckedChange={(e) => setHasHeader(e.checked)}>
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label>First data row is a header</Switch.Label>
              </Switch.Root>
              <Field.Root>
                <Field.Label>Skip leading rows</Field.Label>
                <Input type="number" value={skipRows} onChange={(e) => setSkipRows(e.target.value)} />
              </Field.Root>
              {useIdentifier ? <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} /> : null}
              <Field.Root>
                <Field.Label>Date format</Field.Label>
                <Input value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Amount sign</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={sign} onChange={(e) => setSign(e.target.value as FpAmountSign)}>
                    {Object.values(FpAmountSign).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Text fontSize="sm">Tap a column, then a transaction field to map.</Text>
              <HStack flexWrap="wrap" gap={2}>
                {headers.map((h) => (
                  <Button
                    key={h}
                    size="xs"
                    variant={pendingColumn === h ? 'solid' : 'outline'}
                    onClick={() => setPendingColumn(h)}
                  >
                    {h}
                  </Button>
                ))}
              </HStack>
              <HStack flexWrap="wrap" gap={2}>
                {TARGETS.map((t) => (
                  <Button
                    key={t}
                    size="xs"
                    colorPalette="brand"
                    variant="outline"
                    onClick={() => (pendingColumn === undefined ? undefined : assign(t, pendingColumn))}
                  >
                    {t}
                    {columnMap[t] !== undefined ? ` ← ${columnMap[t]?.column}` : ''}
                  </Button>
                ))}
              </HStack>
              {preview !== undefined ? (
                <Box borderWidth="1px" borderRadius="md" p={3}>
                  <Text fontSize="sm">Preview</Text>
                  <Text fontSize="sm">
                    {preview.postedDate} {preview.description} {preview.amount}
                  </Text>
                </Box>
              ) : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="brand" loading={saving} disabled={name.trim() === ''} onClick={() => void save()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
