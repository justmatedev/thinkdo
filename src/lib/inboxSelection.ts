export function shouldEnterSelectionFromDrag(
  fromIndex: number,
  toIndex: number
): boolean {
  return fromIndex === toIndex;
}

export function deleteConfirmTitle(
  input:
    | { kind: "one"; type: "note" | "task"; title: string }
    | { kind: "many"; count: number }
): string {
  if (input.kind === "many") return `Excluir ${input.count} itens?`;
  const trimmed = input.title.trim();
  if (trimmed.length > 0) return `Excluir “${trimmed}”?`;
  return input.type === "note"
    ? "Excluir esta anotação?"
    : "Excluir esta tarefa?";
}

export function selectionCountLabel(count: number): string {
  return `${count} selecionados`;
}

export function pruneSelectedIds(
  selectedIds: string[],
  existingIds: Iterable<string>
): string[] {
  const set = existingIds instanceof Set ? existingIds : new Set(existingIds);
  return selectedIds.filter((id) => set.has(id));
}
