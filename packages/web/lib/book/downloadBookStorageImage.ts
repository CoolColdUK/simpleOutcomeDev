export default async function downloadBookStorageImage(signedUrl: string, storagePath: string): Promise<void> {
  const fileName = storagePath.split('/').pop() ?? 'image';
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error('Download failed');
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
