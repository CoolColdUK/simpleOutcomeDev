export default function pickImageFileFromDataTransfer(data: DataTransfer): File | undefined {
  const fromItem = [...data.items]
    .map((item) => (item.kind === 'file' && item.type.startsWith('image/') ? item.getAsFile() : undefined))
    .find((file) => file !== undefined && file !== null);
  if (fromItem !== undefined && fromItem !== null) {
    return fromItem;
  }
  return [...data.files].find((file) => file.type.startsWith('image/'));
}
