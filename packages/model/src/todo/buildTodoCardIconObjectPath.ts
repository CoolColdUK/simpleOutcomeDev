import getTodoImageFileExtension, {TodoImageMime} from './todoImageMime';

export default function buildTodoCardIconObjectPath(
  podId: string,
  cardId: string,
  mime: TodoImageMime,
  uniqueSuffix?: string,
): string {
  const ext = getTodoImageFileExtension(mime);
  const token = `${Date.now()}${uniqueSuffix !== undefined ? `-${uniqueSuffix}` : ''}`;
  return `${podId}/${cardId}/icon-${token}.${ext}`;
}
