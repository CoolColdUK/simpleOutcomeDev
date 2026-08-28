export default function throwIfSupabaseError(error: {message: string} | null | undefined): void {
  if (error !== undefined && error !== null) {
    throw new Error(error.message);
  }
}
