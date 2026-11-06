export type TextField = 'title' | 'body';
export type TextEdit = { field: TextField; before: string; after: string; at: number };
export type TextHistoryEntry = Omit<TextEdit, 'at'>;

export const TEXT_HISTORY_GROUP_GAP_MS = 700;
export const TEXT_HISTORY_GROUP_MAX_MS = 3000;
export const TEXT_HISTORY_LIMIT = 100;

type EditKind = 'insert' | 'delete';
type Group = { field: TextField; kind: EditKind; started: number; last: number };
export type TextHistory = {
  readonly past: readonly TextHistoryEntry[];
  readonly future: readonly TextHistoryEntry[];
  readonly group: Group | null;
};

export function createTextHistory(): TextHistory {
  return { past: [], future: [], group: null };
}

export function closeTextGroup(history: TextHistory): TextHistory {
  return history.group ? { ...history, group: null } : history;
}

export function invalidateTextField(history: TextHistory, field: TextField): TextHistory {
  return { past: history.past.filter(entry => entry.field !== field),
    future: history.future.filter(entry => entry.field !== field), group: null };
}

// Compare code points, while retaining complete strings for lossless restoration.
function describeEdit(before: string, after: string) {
  const oldPoints = Array.from(before);
  const newPoints = Array.from(after);
  let start = 0;
  while (start < oldPoints.length && start < newPoints.length && oldPoints[start] === newPoints[start]) start++;
  let oldEnd = oldPoints.length;
  let newEnd = newPoints.length;
  while (oldEnd > start && newEnd > start && oldPoints[oldEnd - 1] === newPoints[newEnd - 1]) {
    oldEnd--; newEnd--;
  }
  const removed = oldEnd - start;
  const added = newEnd - start;
  const kind: EditKind | null = removed === 0 && added === 1 ? 'insert'
    : added === 0 && removed === 1 ? 'delete' : null;
  return kind;
}

export function recordTextEdit(history: TextHistory, edit: TextEdit): TextHistory {
  if (edit.before === edit.after) return history;
  const kind = describeEdit(edit.before, edit.after);
  const group = history.group;
  const previous = history.past[history.past.length - 1];
  const merge = kind && group && previous && group.field === edit.field && group.kind === kind &&
    previous.after === edit.before && edit.at >= group.last &&
    edit.at - group.last < TEXT_HISTORY_GROUP_GAP_MS && edit.at - group.started < TEXT_HISTORY_GROUP_MAX_MS;
  const entry: TextHistoryEntry = { field: edit.field, before: merge ? previous.before : edit.before, after: edit.after };
  const past = merge ? [...history.past.slice(0, -1), entry] : [...history.past, entry];
  return {
    past: past.slice(-TEXT_HISTORY_LIMIT), future: [],
    group: kind ? { field: edit.field, kind, started: merge ? group.started : edit.at,
      last: edit.at } : null,
  };
}

export function undoTextEdit(history: TextHistory): { history: TextHistory; patch: Partial<Record<TextField, string>> | null } {
  const entry = history.past[history.past.length - 1];
  if (!entry) return { history: closeTextGroup(history), patch: null };
  return { history: { past: history.past.slice(0, -1), future: [...history.future, entry], group: null },
    patch: { [entry.field]: entry.before } };
}

export function redoTextEdit(history: TextHistory): { history: TextHistory; patch: Partial<Record<TextField, string>> | null } {
  const entry = history.future[history.future.length - 1];
  if (!entry) return { history: closeTextGroup(history), patch: null };
  return { history: { past: [...history.past, entry], future: history.future.slice(0, -1), group: null },
    patch: { [entry.field]: entry.after } };
}

export function textHistoryAvailability(history: TextHistory): { canUndo: boolean; canRedo: boolean } {
  return { canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}
