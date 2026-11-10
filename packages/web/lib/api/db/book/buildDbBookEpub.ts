import {buildStoreZip, BookOutlineKind} from '@so/model';
import type {SupabaseClient} from '@supabase/supabase-js';
import {BUCKET_POD_PRIVATE, extractSoImageObjectPathsFromBody} from '@so/model';
import type {Database} from '@/lib/supabase/database';
import type {DbBookWorkspace} from '@/lib/api/db/book/loadDbBookWorkspace';

export interface BuildDbBookEpubInput {
  readonly title: string;
  readonly includeNotes: boolean;
}

function escapeXml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function markdownToSimpleHtml(markdown: string, imageMap: ReadonlyMap<string, string>): string {
  const withImages = markdown.replace(/!\[[^\]]*\]\(soimg:[^)]+\)/g, (match) => {
    const paths = extractSoImageObjectPathsFromBody(match);
    const path = paths[0];
    if (path === undefined) {
      return '';
    }
    const href = imageMap.get(path);
    return href === undefined ? '' : `<p><img alt="" src="${escapeXml(href)}"/></p>`;
  });
  const paragraphs = withImages
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : `<p>${escapeXml(line)}</p>`))
    .filter((line) => line !== '');
  return paragraphs.join('\n');
}

function buildPlaceholderCoverPng(title: string, subtitle: string): Uint8Array {
  const label = `${title}\n${subtitle}`.slice(0, 120);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2560"><rect width="100%" height="100%" fill="#2d2419"/><text x="50%" y="45%" fill="#f5efe6" font-size="64" font-family="serif" text-anchor="middle">${escapeXml(label)}</text></svg>`;
  return new TextEncoder().encode(svg);
}

export default async function buildDbBookEpub(
  supabase: SupabaseClient<Database>,
  workspace: DbBookWorkspace,
  input: BuildDbBookEpubInput,
): Promise<Uint8Array> {
  const chapters = workspace.outline.filter((entry) => entry.kind === BookOutlineKind.CHAPTER);
  const notes = input.includeNotes ? workspace.outline.filter((entry) => entry.kind === BookOutlineKind.NOTE) : [];
  const paths = new Set<string>();
  workspace.outline.forEach((entry) => {
    extractSoImageObjectPathsFromBody(`${entry.summaryMd}\n${entry.contentMd}`).forEach((path) => paths.add(path));
  });
  if (workspace.book.coverStoragePath !== undefined) {
    paths.add(workspace.book.coverStoragePath);
  }
  const imageMap = new Map<string, string>();
  const imageBytes = new Map<string, Uint8Array>();
  await Promise.all(
    [...paths].map(async (path) => {
      const {data, error} = await supabase.storage.from(BUCKET_POD_PRIVATE).download(path);
      if (error !== null || data === null) {
        return;
      }
      const bytes = new Uint8Array(await data.arrayBuffer());
      const fileName = `images/${path.split('/').pop() ?? 'img.bin'}`;
      imageMap.set(path, fileName);
      imageBytes.set(fileName, bytes);
    }),
  );
  const chapterItems = chapters
    .map((ch, index) => {
      const file = `chapter-${index + 1}.xhtml`;
      return `<item id="ch${index + 1}" href="${file}" media-type="application/xhtml+xml"/>`;
    })
    .join('\n');
  const noteItems = input.includeNotes
    ? notes
        .map((note, index) => {
          const file = `note-${index + 1}.xhtml`;
          return `<item id="note${index + 1}" href="${file}" media-type="application/xhtml+xml"/>`;
        })
        .join('\n')
    : '';
  const coverHref = workspace.book.coverStoragePath !== undefined && imageMap.has(workspace.book.coverStoragePath)
    ? imageMap.get(workspace.book.coverStoragePath)!
    : 'cover.svg';
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="bookid" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(input.title)}</dc:title>
    <dc:creator>SimpleOutcome</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().slice(0, 19)}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="cover-image" href="${coverHref}" media-type="${coverHref.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg'}" properties="cover-image"/>
    ${chapterItems}
    ${noteItems}
  </manifest>
  <spine>
    ${chapters.map((_, index) => `<itemref idref="ch${index + 1}"/>`).join('')}
    ${input.includeNotes ? notes.map((_, index) => `<itemref idref="note${index + 1}"/>`).join('') : ''}
  </spine>
</package>`;
  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<body><nav epub:type="toc"><ol>
${chapters.map((ch, index) => `<li><a href="chapter-${index + 1}.xhtml">${escapeXml(`${ch.chapterNumber ?? index + 1} · ${ch.title}`)}</a></li>`).join('')}
</ol></nav></body></html>`;
  const chapterFiles = chapters.map((ch, index) => {
    const body = markdownToSimpleHtml(ch.contentMd, imageMap);
    const html = `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeXml(ch.title)}</title></head><body><h1>${escapeXml(ch.title)}</h1>${body}</body></html>`;
    return {path: `OEBPS/chapter-${index + 1}.xhtml`, data: new TextEncoder().encode(html)};
  });
  const noteFiles = input.includeNotes
    ? notes.map((note, index) => {
        const body = markdownToSimpleHtml(note.contentMd, imageMap);
        const html = `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escapeXml(note.title)}</title></head><body><h1>Note ${note.noteNumber ?? index + 1}</h1>${body}</body></html>`;
        return {path: `OEBPS/note-${index + 1}.xhtml`, data: new TextEncoder().encode(html)};
      })
    : [];
  const hasUserCover =
    workspace.book.coverStoragePath !== undefined &&
    imageMap.has(workspace.book.coverStoragePath) &&
    imageBytes.has(imageMap.get(workspace.book.coverStoragePath)!);
  const coverEntry = hasUserCover
    ? {
        path: `OEBPS/${imageMap.get(workspace.book.coverStoragePath!)!}`,
        data: imageBytes.get(imageMap.get(workspace.book.coverStoragePath!)!)!,
      }
    : {path: 'OEBPS/cover.svg', data: buildPlaceholderCoverPng(input.title, workspace.book.subtitle)};
  const entries = [
    {path: 'mimetype', data: new TextEncoder().encode('application/epub+zip')},
    {path: 'META-INF/container.xml', data: new TextEncoder().encode(`<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`)},
    {path: 'OEBPS/content.opf', data: new TextEncoder().encode(opf)},
    {path: 'OEBPS/nav.xhtml', data: new TextEncoder().encode(nav)},
    coverEntry,
    ...chapterFiles,
    ...noteFiles,
    ...[...imageBytes.entries()].map(([name, data]) => ({path: `OEBPS/${name}`, data})),
  ];
  return buildStoreZip(entries);
}
