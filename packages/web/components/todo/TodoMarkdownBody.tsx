'use client';

import {Box} from '@chakra-ui/react';
import {useEffect, useState} from 'react';
import resolveStorageTodoImageSignedUrls from '@/lib/api/storage/resolveStorageTodoImageSignedUrls';
import SoMarkdown from '@/lib/markdown/SoMarkdown';

export interface TodoMarkdownBodyProps {
  readonly markdown: string;
}

export default function TodoMarkdownBody({markdown}: TodoMarkdownBodyProps) {
  const [resolved, setResolved] = useState(markdown);
  const [err, setErr] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void resolveStorageTodoImageSignedUrls(markdown)
        .then((next) => {
          setErr('');
          setResolved(next);
        })
        .catch((e: unknown) => {
          setErr(e instanceof Error ? e.message : 'Could not resolve images');
          setResolved(markdown);
        });
    }, 200);
    return () => window.clearTimeout(handle);
  }, [markdown]);

  if (err !== '') {
    return (
      <Box fontSize="sm" color="fg.muted">
        {err}
      </Box>
    );
  }

  return <SoMarkdown markdown={resolved} />;
}
