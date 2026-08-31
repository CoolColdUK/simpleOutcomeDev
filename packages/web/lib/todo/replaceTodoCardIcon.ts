import uploadStorageTodoCardIcon from '@/lib/api/storage/uploadStorageTodoCardIcon';
import deleteStorageTodoObject from '@/lib/api/storage/deleteStorageTodoObject';
import updateDbTodoCard from '@/lib/api/db/updateDbTodoCard';

export default async function replaceTodoCardIcon(
  podId: string,
  cardId: string,
  file: File,
  previousPath: string | undefined,
): Promise<void> {
  const nextPath = await uploadStorageTodoCardIcon(podId, cardId, file);
  await updateDbTodoCard(cardId, {iconPath: nextPath});
  if (previousPath !== undefined && previousPath !== nextPath) {
    await deleteStorageTodoObject(previousPath).catch(() => undefined);
  }
}
