import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { resolveEditorTitle, toNote, toTask } from "@/lib/itemContent";
import { getItem, updateItem } from "@/services/items";
import { deleteItemsWithReminders } from "@/services/deleteItemsWithReminders";
import {
  cancelItemReminder,
  requestReminderPermissions,
  scheduleItemReminder,
} from "@/features/reminders/reminderScheduler";
import {
  getInboxSession,
  isInboxSessionCurrent,
} from "@/widgets/snapshot/session";
import type { Item, SaveStatus, UpdateItemInput } from "@/types/item";

const AUTOSAVE_MS = 500;
type EditorState = {
  item: Item | null;
  loading: boolean;
  loadError: Error | null;
  notFound: boolean;
  status: SaveStatus;
  permissionDenied: boolean;
};

function createEditorSession(uid: string | undefined, itemId: string) {
  const session = uid ? getInboxSession(uid) : null;
  let state: EditorState = {
    item: null,
    loading: true,
    loadError: null,
    notFound: false,
    status: "saved",
    permissionDenied: false,
  };
  const listeners = new Set<() => void>();
  let active = true;
  let readVersion = 0;
  let pending: UpdateItemInput = {};
  let saving = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastValidTitle = "";
  const emit = (patch: Partial<EditorState>) => {
    state = { ...state, ...patch };
    if (active) listeners.forEach((listener) => listener());
  };
  const syncSchedule = async (saved: Item) => {
    if (!active || Platform.OS === "web" || !isInboxSessionCurrent(session))
      return;
    if (!saved.reminder) {
      await cancelItemReminder(saved.id);
      return;
    }
    const granted = await requestReminderPermissions();
    if (!active || !isInboxSessionCurrent(session)) return;
    emit({ permissionDenied: !granted });
    await scheduleItemReminder(
      saved,
      () => active && isInboxSessionCurrent(session),
    );
  };
  const flush = async (): Promise<void> => {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (saving || !uid || !state.item || !Object.keys(pending).length) return;
    saving = true;
    const patch = pending;
    pending = {};
    if (patch.title !== undefined)
      patch.title = resolveEditorTitle(patch.title, lastValidTitle);
    const saved = { ...state.item, ...patch };
    emit({ status: "saving" });
    try {
      await updateItem(uid, itemId, patch);
      if (patch.title !== undefined) lastValidTitle = patch.title;
    } catch {
      pending = { ...patch, ...pending };
      saving = false;
      emit({ status: "error" });
      return;
    }
    saving = false;
    const hasPending = Object.keys(pending).length > 0;
    emit({ status: hasPending ? "saving" : "saved" });
    // Reconciliation retries local notification failures without undoing persistence.
    if (active) void syncSchedule(saved).catch(() => {});
    if (hasPending && !timer) await flush();
  };
  const update = (patch: UpdateItemInput) => {
    if (!uid || !state.item || !active) return;
    pending = { ...pending, ...patch };
    emit({ item: { ...state.item, ...patch }, status: "saving" });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      void flush();
    }, AUTOSAVE_MS);
  };
  const load = async () => {
    active = true;
    const version = ++readVersion;
    emit({ loading: true, loadError: null, notFound: false });
    if (!uid || !itemId) {
      emit({ loading: false, notFound: true });
      return;
    }
    try {
      const item = await getItem(uid, itemId);
      if (!active || version !== readVersion) return;
      lastValidTitle = item?.title ?? "";
      emit({ item, loading: false, notFound: item === null });
    } catch (error) {
      if (active && version === readVersion)
        emit({
          loading: false,
          loadError: error instanceof Error ? error : new Error("load failed"),
        });
    }
  };
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    retryLoad: load,
    retrySave: flush,
    update,
    convert() {
      if (state.item)
        update(
          state.item.type === "note" ? toTask(state.item) : toNote(state.item),
        );
    },
    async remove() {
      if (!uid || !state.item) return;
      if (timer) clearTimeout(timer);
      // Let an in-flight write finish before deleting its document.
      if (saving) throw new Error("save in progress");
      const { failed } = await deleteItemsWithReminders(uid, [itemId]);
      if (failed.length) throw new Error("delete failed");
      pending = {};
    },
    start() {
      void load();
    },
    dispose() {
      active = false;
      ++readVersion;
      // Preserve edits when leaving before the debounce expires.
      void flush();
    },
  };
}

export function useItemEditor(itemId: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const session = useMemo(
    () => createEditorSession(uid, itemId),
    [uid, itemId],
  );
  const state = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getSnapshot,
  );
  useEffect(() => {
    session.start();
    return () => session.dispose();
  }, [session]);
  return {
    ...state,
    update: session.update,
    convert: session.convert,
    remove: session.remove,
    retryLoad: session.retryLoad,
    retrySave: session.retrySave,
  };
}
