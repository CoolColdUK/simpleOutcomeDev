import dayjs from 'dayjs';

export default function formatTodoDueAt(dueAt: string | undefined): string | undefined {
  if (dueAt === undefined) {
    return undefined;
  }
  const parsed = dayjs(dueAt);
  if (!parsed.isValid()) {
    return dueAt;
  }
  return parsed.format('YYYY-MM-DD HH:mm');
}

export function todoDueAtToInputValue(dueAt: string | undefined): string {
  if (dueAt === undefined) {
    return '';
  }
  const parsed = dayjs(dueAt);
  if (!parsed.isValid()) {
    return '';
  }
  return parsed.format('YYYY-MM-DDTHH:mm');
}

export function todoDueAtFromInputValue(value: string): string | undefined {
  if (value === '') {
    return undefined;
  }
  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return undefined;
  }
  return parsed.toISOString();
}
