import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseItemReminder } from '@/features/reminders/reminderModel';
import { parseItemColor } from '@/lib/itemColors';
import type { UpdateItemInput } from '@/types/item';

export type EditorDraft = {
  version: 1;
  uid: string;
  itemId: string;
  revision: string;
  patch: UpdateItemInput;
  original: UpdateItemInput;
};
const queues = new Map<string, Promise<unknown>>();
const keyFor = (uid: string, itemId: string) =>
  `thinkdo.editor.draft.v1:${encodeURIComponent(uid)}:${encodeURIComponent(itemId)}`;

function enqueue<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const result = (queues.get(key) ?? Promise.resolve()).then(operation);
  const settled = result.catch(() => {});
  queues.set(key, settled);
  void settled.then(() => { if (queues.get(key) === settled) queues.delete(key); });
  return result;
}

function parsePatch(raw: unknown): UpdateItemInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid draft patch');
  const patch: UpdateItemInput = {};
  for (const [key, value] of Object.entries(raw)) {
    switch (key) {
      case 'title': case 'body':
        if (typeof value !== 'string') throw new Error('Invalid draft text');
        patch[key] = value; break;
      case 'type':
        if (value !== 'note' && value !== 'task') throw new Error('Invalid draft type');
        patch.type = value; break;
      case 'done':
        if (typeof value !== 'boolean') throw new Error('Invalid draft completion');
        patch.done = value; break;
      case 'color':
        if (value !== null && parseItemColor(value) === null) throw new Error('Invalid draft color');
        patch.color = parseItemColor(value); break;
      case 'reminder': {
        if (value === null) { patch.reminder = null; break; }
        const rawReminder = value as Record<string, unknown>;
        const reminder = parseItemReminder(rawReminder?.kind === 'once'
          ? { ...rawReminder, at: new Date(rawReminder.at as string) } : rawReminder);
        if (!reminder) throw new Error('Invalid draft reminder');
        patch.reminder = reminder; break;
      }
      default: throw new Error('Unknown draft field');
    }
  }
  return patch;
}

async function read(uid: string, itemId: string): Promise<EditorDraft | null> {
  const raw = await AsyncStorage.getItem(keyFor(uid, itemId));
  if (raw === null) return null;
  const draft = JSON.parse(raw) as EditorDraft;
  if (!draft || draft.version !== 1 || draft.uid !== uid || draft.itemId !== itemId || typeof draft.revision !== 'string')
    throw new Error('Invalid editor draft');
  const patch = parsePatch(draft.patch);
  const original = parsePatch(draft.original);
  if (Object.keys(patch).some((field) => !(field in original))) throw new Error('Missing draft original');
  return { ...draft, patch, original };
}

export function readEditorDraft(uid: string, itemId: string): Promise<EditorDraft | null> {
  return enqueue(keyFor(uid, itemId), () => read(uid, itemId));
}
export function writeEditorDraft(draft: EditorDraft): Promise<void> {
  return enqueue(keyFor(draft.uid, draft.itemId), () =>
    AsyncStorage.setItem(keyFor(draft.uid, draft.itemId), JSON.stringify(draft)));
}
export function clearEditorDraft(uid: string, itemId: string, revision: string): Promise<void> {
  return enqueue(keyFor(uid, itemId), async () => {
    const current = await read(uid, itemId);
    if (current?.revision === revision) await AsyncStorage.removeItem(keyFor(uid, itemId));
  });
}
