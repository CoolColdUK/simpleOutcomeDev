import {renderToStaticMarkup} from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {applySoImageUrlMapToMarkdown} from '@so/model';

export default function markdownToBookXhtmlBody(
  markdown: string,
  imageHrefByStoragePath: ReadonlyMap<string, string>,
): string {
  const record = Object.fromEntries(imageHrefByStoragePath.entries());
  const withImages = applySoImageUrlMapToMarkdown(markdown, record);
  return renderToStaticMarkup(<ReactMarkdown remarkPlugins={[remarkGfm]}>{withImages}</ReactMarkdown>);
}
