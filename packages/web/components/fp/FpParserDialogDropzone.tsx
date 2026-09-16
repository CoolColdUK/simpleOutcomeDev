'use client';

import {useRef, useState} from 'react';
import {Box, Text} from '@chakra-ui/react';

export interface FpParserDialogDropzoneProps {
  readonly onFile: (file: File) => Promise<void>;
}

export default function FpParserDialogDropzone({onFile}: FpParserDialogDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [dragging, setDragging] = useState(false);

  const applyFile = (file: File | undefined): void => {
    if (file === undefined) {
      return;
    }
    setFileName(file.name);
    void onFile(file);
  };

  return (
    <>
      <Box
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={dragging ? 'colorPalette.solid' : 'border.emphasized'}
        colorPalette="brand"
        borderRadius="md"
        p={4}
        bg={dragging ? 'colorPalette.subtle' : 'bg.subtle'}
        cursor="pointer"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          const fromList = e.dataTransfer.files[0];
          const fromItems = [...e.dataTransfer.items]
            .filter((item) => item.kind === 'file')
            .map((item) => item.getAsFile())
            .find((file) => file !== undefined);
          applyFile(fromList ?? fromItems);
        }}
      >
        <Text fontSize="sm">
          {fileName === undefined
            ? 'Drop an example CSV, or click to choose'
            : fileName}
        </Text>
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          applyFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </>
  );
}
