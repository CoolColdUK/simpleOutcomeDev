import {encodeSoImageMarkdownUri} from '../todo/soImageMarkdownUri';

export default function bookAssetInlineMarkdownFragment(storagePath: string): string {
  return `![](${encodeSoImageMarkdownUri(storagePath)})\n`;
}
