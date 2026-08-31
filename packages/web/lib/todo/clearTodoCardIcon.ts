import deleteStorageTodoObject from '@/lib/api/storage/deleteStorageTodoObject';
import updateDbTodoCard from '@/lib/api/db/updateDbTodoCard';

export default async function clearTodoCardIcon(cardId: string, previousPath: string | undefined): Promise<void> {
  await updateDbTodoCard(cardId, {iconPath: ''});
  if (previousPath !== undefined) {
    await deleteStorageTodoObject(previousPath).catch(() => undefined);
  }
}
