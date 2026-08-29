'use client';

import {Box} from '@chakra-ui/react';
import ReactMarkdown, {defaultUrlTransform, type Components} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import soMarkdown from '@/lib/markdown/soMarkdown.module.css';

export interface SoMarkdownProps {
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

const markdownComponents: Components = {
  table: ({children, ...props}) => (
    <div className={soMarkdown.tableScroll}>
      <table {...props}>{children}</table>
    </div>
  ),
  img: ({src, alt}) => {
    if (typeof src !== 'string' || src === '') {
      return null;
    }
    return <img src={src} alt={alt ?? ''} />;
  },
};

export default function SoMarkdown({markdown}: SoMarkdownProps) {
  return (
    <Box fontSize="sm" className={soMarkdown.root}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeMarkdownUrlTransform}
        components={markdownComponents}
      >
        {markdown}
      </ReactMarkdown>
    </Box>
  );
}
