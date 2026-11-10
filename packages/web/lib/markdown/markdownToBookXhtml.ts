import {applySoImageUrlMapToMarkdown} from '@so/model';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import {unified} from 'unified';

const markdownToHtml = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify);

export default async function markdownToBookXhtmlBody(
  markdown: string,
  imageHrefByStoragePath: ReadonlyMap<string, string>,
): Promise<string> {
  const record = Object.fromEntries(imageHrefByStoragePath.entries());
  const withImages = applySoImageUrlMapToMarkdown(markdown, record);
  const file = await markdownToHtml.process(withImages);
  return String(file);
}
