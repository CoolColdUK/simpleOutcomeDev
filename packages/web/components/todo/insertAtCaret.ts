function insertAtCaret(value: string, ta: HTMLTextAreaElement, insert: string): {next: string; caret: number} {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const next = value.slice(0, start) + insert + value.slice(end);
  return {next, caret: start + insert.length};
}

export default insertAtCaret;
