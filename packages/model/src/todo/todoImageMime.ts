export enum TodoImageMime {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
}

export default function getTodoImageFileExtension(mime: TodoImageMime): 'jpg' | 'png' {
  if (mime === TodoImageMime.JPEG) {
    return 'jpg';
  }
  return 'png';
}
