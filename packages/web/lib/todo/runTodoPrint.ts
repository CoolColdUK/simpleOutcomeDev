export type TodoPrintMode = 'card' | 'description';

const CLASS_BY_MODE: Record<TodoPrintMode, string> = {
  card: 'print-todo-card',
  description: 'print-todo-description',
};

export default function runTodoPrint(mode: TodoPrintMode): void {
  const className = CLASS_BY_MODE[mode];
  const cleanup = (): void => {
    document.body.classList.remove(className);
    window.removeEventListener('afterprint', cleanup);
  };
  document.body.classList.add(className);
  window.addEventListener('afterprint', cleanup);
  window.print();
}
