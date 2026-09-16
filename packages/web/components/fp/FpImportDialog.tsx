'use client';

import {useRef, useState} from 'react';
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
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react';
import {collectFpImportRows, matchFpParserIdentifier, parseFpCsvTable} from '@so/model';
import createDbFpImport from '@/lib/api/db/createDbFpImport';
import applyDbFpAutoAssign from '@/lib/api/db/applyDbFpAutoAssign';
import hasDbFpImportHash from '@/lib/api/db/hasDbFpImportHash';
import sha256Hex from '@/lib/fp/sha256Hex';
import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpParser} from '@/lib/api/db/mapDbFpParser';

export interface FpImportDialogProps {
  readonly open: boolean;
  readonly podId: string;
  readonly accounts: readonly DbFpAccount[];
  readonly parsers: readonly DbFpParser[];
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export default function FpImportDialog({open, podId, accounts, parsers, onClose, onSaved}: FpImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [parserId, setParserId] = useState(parsers[0]?.id ?? '');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const ingest = async (incoming: FileList | File[]): Promise<void> => {
    const list = [...incoming];
    setFiles(list);
    const first = list[0];
    if (first === undefined) {
      return;
    }
    const text = await first.text();
    const header = (text.split(/\r?\n/)[0] ?? '').trim();
    const matched = parsers.filter((p) => matchFpParserIdentifier(header, p.identifier));
    if (matched.length === 1 && matched[0] !== undefined) {
      setParserId(matched[0].id);
    }
  };

  const run = async (): Promise<void> => {
    const parser = parsers.find((p) => p.id === parserId);
    if (parser === undefined) {
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const payloads = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const sha = await sha256Hex(buffer);
          const text = new TextDecoder().decode(buffer);
          if (await hasDbFpImportHash(podId, sha)) {
            const again = window.confirm(`${file.name} was imported before. Import again?`);
            if (!again) {
              return undefined;
            }
          }
          const table = parseFpCsvTable(text, parser.delimiter, parser.hasHeader, parser.skipRows);
          const collected = collectFpImportRows(
            table.rows,
            parser.columnMap,
            parser.skipRows,
            parser.hasHeader,
          );
          return {
            fileName: file.name,
            contentSha256: sha,
            parsed: collected.parsed,
            rows: collected.rows,
            logs: collected.logs,
          };
        }),
      );
      const ready = payloads.filter((p) => p !== undefined);
      if (ready.length === 0) {
        setMessage('Nothing to import');
        return;
      }
      await ready.reduce(
        async (previous, file) => {
          await previous;
          await createDbFpImport(podId, parser.id, accountId, file);
        },
        Promise.resolve(),
      );
      await applyDbFpAutoAssign(podId);
      setFiles([]);
      if (fileInputRef.current !== null) {
        fileInputRef.current.value = '';
      }
      setMessage(`Imported ${ready.length} file${ready.length === 1 ? '' : 's'}.`);
      onSaved();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={3}>
              <Box
                borderWidth="1px"
                borderRadius="md"
                p={4}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void ingest(e.dataTransfer.files);
                }}
              >
                <Text fontSize="sm">Drop one or more CSV files</Text>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  multiple
                  onChange={(e) => {
                    if (e.target.files !== null) {
                      void ingest(e.target.files);
                    }
                  }}
                />
                <Text fontSize="sm">{files.map((f) => f.name).join(', ')}</Text>
              </Box>
              <Field.Root>
                <Field.Label>Parser</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={parserId} onChange={(e) => setParserId(e.target.value)}>
                    {parsers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              <Field.Root>
                <Field.Label>Account</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Field.Root>
              {message !== '' ? <Text fontSize="sm">{message}</Text> : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="brand"
              loading={saving}
              disabled={files.length === 0 || parserId === '' || accountId === ''}
              onClick={() => void run()}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
