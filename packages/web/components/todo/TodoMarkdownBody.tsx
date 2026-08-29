'use client';

import {Box} from '@chakra-ui/react';
import {useEffect, useState} from 'react';
import ReactMarkdown, {defaultUrlTransform} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import resolveStorageTodoImageSignedUrls from '@/lib/api/storage/resolveStorageTodoImageSignedUrls';

export interface TodoMarkdownBodyProps {
  readonly markdown: string;
}

function safeMarkdownUrlTransform(url: string): string {
  const t = url.trim();
  const lower = t.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('file:')) {
    return '';
  }
  return defaultUrlTransform(t);
}

export default function TodoMarkdownBody({markdown}: TodoMarkdownBodyProps) {
  const [resolved, setResolved] = useState(markdown);
  const [err, setErr] = useState('');

  useEffect(() => {
    void resolveStorageTodoImageSignedUrls(markdown)
      .then(setResolved)
      .catch((e: unknown) => {
        setErr(e instanceof Error ? e.message : 'Could not resolve images');
        setResolved(markdown);
      });
  }, [markdown]);

  if (err !== '') {
    return (
      <Box fontSize="sm" color="fg.muted">
        {err}
      </Box>
    );
  }

  return (
    <Box fontSize="sm" className="todo-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={safeMarkdownUrlTransform}>
        {resolved}
      </ReactMarkdown>
    </Box>
  );
}
