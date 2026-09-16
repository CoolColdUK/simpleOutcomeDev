'use client';

import {useState} from 'react';
import {
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
  Stack,
  Switch,
} from '@chakra-ui/react';
import {
  FpAmountSign,
  FpColumnTarget,
  parseFpCsvTable,
  parseFpName,
  type FpColumnMap,
} from '@so/model';
import createDbFpParser from '@/lib/api/db/createDbFpParser';
import updateDbFpParser from '@/lib/api/db/updateDbFpParser';
import type {DbFpParser} from '@/lib/api/db/mapDbFpParser';
import AppInfoTooltip from '@/components/app/AppInfoTooltip';
import FpParserDialogDropzone from '@/components/fp/FpParserDialogDropzone';
import FpParserDialogMapping from '@/components/fp/FpParserDialogMapping';

export interface FpParserDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly parser?: DbFpParser;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

function mappedColumns(columnMap: FpColumnMap): readonly string[] {
  return Object.values(columnMap).flatMap((m) => (m === undefined ? [] : [m.column]));
}

export default function FpParserDialog(props: FpParserDialogProps) {
  if (!props.open) {
    return null;
  }
  return <FpParserDialogBody key={props.parser?.id ?? 'new'} {...props} />;
}

function FpParserDialogBody({open, podId, parser, onClose, onSaved}: FpParserDialogProps) {
  const [name, setName] = useState(parser?.name ?? '');
  const [useIdentifier, setUseIdentifier] = useState(parser?.identifier !== undefined);
  const [identifier, setIdentifier] = useState(parser?.identifier ?? '');
  const [hasHeader, setHasHeader] = useState(parser?.hasHeader ?? true);
  const [skipRows, setSkipRows] = useState(String(parser?.skipRows ?? 0));
  const [csvText, setCsvText] = useState<string | undefined>(undefined);
  const [csvFileName, setCsvFileName] = useState<string | undefined>(undefined);
  const [headers, setHeaders] = useState<readonly string[]>(mappedColumns(parser?.columnMap ?? {}));
  const [sampleRows, setSampleRows] = useState<readonly Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<FpColumnMap>(parser?.columnMap ?? {});
  const [dateFormat, setDateFormat] = useState(parser?.columnMap.date?.dateFormat ?? 'DD/MM/YYYY');
  const [sign, setSign] = useState<FpAmountSign>(parser?.columnMap.amount?.sign ?? FpAmountSign.AS_IS);
  const [saving, setSaving] = useState(false);

  const applyCsv = (text: string, headerFlag: boolean, skip: string): void => {
    const table = parseFpCsvTable(text, ',', headerFlag, Number(skip) || 0);
    setIdentifier(table.headerLine);
    setHeaders(table.headers);
    setSampleRows(table.rows);
  };

  const onFile = async (file: File): Promise<void> => {
    const text = await file.text();
    setCsvText(text);
    setCsvFileName(file.name);
    applyCsv(text, hasHeader, skipRows);
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

  const assign = (target: FpColumnTarget, column: string | undefined): void => {
    if (column === undefined) {
      setColumnMap({...columnMap, [target]: undefined});
      return;
    }
    setColumnMap({...columnMap, [target]: mappingFor(target, column)});
  };

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
        hasHeader,
        skipRows: Number(skipRows) || 0,
      };
      if (parser === undefined) {
        await createDbFpParser(podId, parseFpName(name), map, {
          ...opts,
          identifier: useIdentifier ? identifier : undefined,
        });
      } else {
        await updateDbFpParser(parser.id, {
          name: parseFpName(name),
          columnMap: map,
          ...opts,
          identifier: useIdentifier ? identifier : '',
        });
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
        <DialogContent maxW="3xl">
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
              <FpParserDialogDropzone onFile={onFile} />
              <Switch.Root checked={useIdentifier} onCheckedChange={(e) => setUseIdentifier(e.checked)}>
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Label>Use first-row identifier</Switch.Label>
              </Switch.Root>
              <HStack gap={1} align="center">
                <Switch.Root
                  checked={hasHeader}
                  onCheckedChange={(e) => {
                    setHasHeader(e.checked);
                    if (csvText !== undefined) {
                      applyCsv(csvText, e.checked, skipRows);
                    }
                  }}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <Switch.Label>CSV has a header row</Switch.Label>
                </Switch.Root>
                <AppInfoTooltip label="When on, the first row after any skipped lines names the columns. Leave skip at 0 — do not set skip to 1 just because a header exists." />
              </HStack>
              <Field.Root>
                <HStack gap={1} align="center">
                  <Field.Label mb={0}>Skip leading rows</Field.Label>
                  <AppInfoTooltip label="Extra lines to ignore above the header or first data row (title, account number, blanks). Keep this at 0 if the file starts with the header. The header switch already uses that row; skip 1 would throw the header away." />
                </HStack>
                <Input
                  type="number"
                  value={skipRows}
                  onChange={(e) => {
                    setSkipRows(e.target.value);
                    if (csvText !== undefined) {
                      applyCsv(csvText, hasHeader, e.target.value);
                    }
                  }}
                />
              </Field.Root>
              {useIdentifier ? <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} /> : null}
              <FpParserDialogMapping
                key={csvFileName ?? 'no-csv'}
                csvFileName={csvFileName}
                hasHeader={hasHeader}
                skipRows={Number(skipRows) || 0}
                headers={headers}
                sampleRows={sampleRows}
                columnMap={columnMap}
                dateFormat={dateFormat}
                sign={sign}
                onAssign={assign}
                onDateFormat={setDateFormat}
                onSign={setSign}
              />
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
