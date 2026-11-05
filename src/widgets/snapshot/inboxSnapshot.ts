import AsyncStorage from "@react-native-async-storage/async-storage";
import type { InboxFilter, Item } from "@/types/item";
import type { InboxSnapshot, InboxSnapshotRow } from "@/widgets/snapshot/types";
import {
  getInboxSession,
  invalidateInboxSession,
  isInboxSessionCurrent,
  type InboxSession,
} from "@/widgets/snapshot/session";

export const INBOX_SNAPSHOT_KEY = "thinkdo.widget.inbox.snapshot";
export const INBOX_SNAPSHOT_CAP = 30;

export const EMPTY_SNAPSHOT: InboxSnapshot = {
  uid: null,
  updatedAt: 0,
  signedIn: false,
  items: [],
};

export function toInboxSnapshotRows(
  items: Pick<Item, "id" | "type" | "title" | "done">[],
  cap: number = Infinity,
): InboxSnapshotRow[] {
  return items.slice(0, cap).map(({ id, type, title, done }) => ({
    id,
    type,
    title,
    done,
  }));
}

export function filterInboxSnapshotRows(
  rows: InboxSnapshotRow[],
  filter: InboxFilter,
): InboxSnapshotRow[] {
  switch (filter) {
    case "notes":
      return rows.filter((row) => row.type === "note").slice(0, INBOX_SNAPSHOT_CAP);
    case "tasks":
      return rows.filter((row) => row.type === "task").slice(0, INBOX_SNAPSHOT_CAP);
    default:
      return rows.slice(0, INBOX_SNAPSHOT_CAP);
  }
}

export function buildInboxSnapshot(input: {
  signedIn: boolean;
  uid: string;
  items: Item[];
  now?: number;
}): InboxSnapshot {
  return {
    uid: input.uid,
    updatedAt: input.now ?? Date.now(),
    signedIn: input.signedIn,
    // Keep slim rows for every type so filtering happens before the render cap.
    items: toInboxSnapshotRows(input.items),
  };
}

export async function readInboxSnapshot(): Promise<InboxSnapshot> {
  try {
    const stored = await AsyncStorage.getItem(INBOX_SNAPSHOT_KEY);
    if (!stored) return EMPTY_SNAPSHOT;
    const snapshot = JSON.parse(stored) as InboxSnapshot;
    if (
      !snapshot ||
      typeof snapshot.uid !== "string" ||
      !snapshot.signedIn ||
      !Array.isArray(snapshot.items)
    )
      return EMPTY_SNAPSHOT;
    return snapshot;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

// The queue orders storage mutations; session tokens reject stale producers.
let storageQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageQueue.then(operation);
  storageQueue = result.catch(() => {});
  return result;
}

export function writeInboxSnapshot(
  snapshot: InboxSnapshot,
  session = snapshot.uid ? getInboxSession(snapshot.uid) : null,
): Promise<void> {
  return enqueue(async () => {
    if (!isInboxSessionCurrent(session) || snapshot.uid !== session?.uid)
      return;
    await AsyncStorage.setItem(INBOX_SNAPSHOT_KEY, JSON.stringify(snapshot));
  });
}

export function clearInboxSnapshot(): Promise<void> {
  invalidateInboxSession();
  return enqueue(() => AsyncStorage.removeItem(INBOX_SNAPSHOT_KEY));
}

export function patchInboxSnapshotItemDone(
  itemId: string,
  done: boolean,
  session: InboxSession,
): Promise<InboxSnapshot | null> {
  return enqueue(async () => {
    if (!isInboxSessionCurrent(session)) return null;
    const snapshot = await readInboxSnapshot();
    if (!isInboxSessionCurrent(session) || snapshot.uid !== session.uid)
      return null;
    const index = snapshot.items.findIndex((row) => row.id === itemId);
    if (index === -1) return null;
    const next = {
      ...snapshot,
      items: snapshot.items.map((row) =>
        row.id === itemId ? { ...row, done } : row,
      ),
    };
    await AsyncStorage.setItem(INBOX_SNAPSHOT_KEY, JSON.stringify(next));
    return next;
  });
}

export type { InboxSnapshot, InboxSnapshotRow } from "@/widgets/snapshot/types";
