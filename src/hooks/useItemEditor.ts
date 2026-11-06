import { useEffect, useMemo, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { resolveEditorTitle, toNote, toTask } from "@/lib/itemContent";
import { getItem, updateItem } from "@/services/items";
import { deleteItemsWithReminders } from "@/services/deleteItemsWithReminders";
import { requestReminderPermissions, scheduleItemReminder } from "@/features/reminders/reminderScheduler";
import { getInboxSession, isInboxSessionCurrent } from "@/widgets/snapshot/session";
import { clearEditorDraft, readEditorDraft, writeEditorDraft, type EditorDraft } from "@/features/editor/editorDrafts";
import { validateEditorText, type EditorFieldErrors } from "@/features/editor/editorValidation";
import { runEditorOperation } from "@/features/editor/editorOperations";
import type { Item, SaveStatus, UpdateItemInput } from "@/types/item";

const AUTOSAVE_MS = 500;
let nextRevision = 0;
const revisionId = () => `${Date.now()}:${++nextRevision}`;
type Field = keyof UpdateItemInput;
type EditorState = {
  item: Item | null;
  loading: boolean;
  loadError: Error | null;
  notFound: boolean;
  missing: boolean;
  status: SaveStatus;
  localPersistence: "idle" | "saving" | "saved" | "error";
  fieldErrors: EditorFieldErrors;
  titleHint: string | null;
  permissionDenied: boolean;
  recoveryDraft: EditorDraft | null;
  recoveryConflicts: Field[];
  deleting: boolean;
  deleteError: string | null;
};

function createEditorSession(uid: string | undefined, itemId: string) {
  const session = uid ? getInboxSession(uid) : null;
  const current = () => isInboxSessionCurrent(session);
  let state: EditorState = {
    item: null, loading: true, loadError: null, notFound: false, missing: false,
    status: "saved", localPersistence: "idle", fieldErrors: {}, titleHint: null,
    permissionDenied: false, recoveryDraft: null, recoveryConflicts: [], deleting: false, deleteError: null,
  };
  const listeners = new Set<() => void>();
  let active = true;
  let readVersion = 0;
  let pending: UpdateItemInput = {};
  let confirmed: Item | null = null;
  const fieldVersions: Partial<Record<Field, number>> = {};
  let editVersion = 0;
  let draft: EditorDraft | null = null;
  let persistence: Promise<boolean> = Promise.resolve(true);
  let inFlight: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let deleted = false;
  let scheduleVersion = 0;
  let removeAppState: (() => void) | undefined;
  const emit = (patch: Partial<EditorState>) => {
    state = { ...state, ...patch };
    if (active) listeners.forEach((listener) => listener());
  };
  const stopTimer = () => { if (timer) clearTimeout(timer); timer = undefined; };
  const fields = () => Object.keys(pending) as Field[];
  const syncSchedule = async (saved: Item) => {
    const version = ++scheduleVersion;
    const isLatest = () => version === scheduleVersion && active && current() && !state.deleting && !deleted;
    if (Platform.OS === "web" || !isLatest()) return;
    if (saved.reminder && !(saved.type === "task" && saved.done)) {
      const granted = await requestReminderPermissions();
      if (!isLatest()) return;
      emit({ permissionDenied: !granted });
    } else emit({ permissionDenied: false });
    await scheduleItemReminder(saved, isLatest);
  };
  const persist = (): Promise<boolean> => {
    if (!uid || !confirmed) return Promise.resolve(false);
    const original: UpdateItemInput = {};
    for (const field of fields()) Object.assign(original, { [field]: confirmed[field] });
    const previous = draft;
    const next: EditorDraft | null = fields().length ? {
      version: 1, uid, itemId, revision: revisionId(), patch: { ...pending }, original,
    } : null;
    draft = next;
    emit({ localPersistence: "saving" });
    const operation = next ? writeEditorDraft(next)
      : previous ? clearEditorDraft(uid, itemId, previous.revision) : Promise.resolve();
    persistence = operation.then(() => {
      if (draft === next) emit({ localPersistence: "saved" });
      return true;
    }, () => {
      if (draft === next) emit({ localPersistence: "error", status: "error" });
      return false;
    });
    return persistence;
  };
  const flush = (): Promise<void> => {
    stopTimer();
    if (inFlight) return inFlight;
    if (!uid || !state.item || !fields().length || state.recoveryDraft || state.deleting || deleted) return Promise.resolve();
    const saveOnce = async () => {
      // A failed local write is retried only through retrySave, never silently skipped.
      let persisted = false;
      // An edit can enqueue another local write while the previous one is awaited.
      // Only send the latest patch once that exact revision is durable.
      while (true) {
        const latestPersistence = persistence;
        persisted = await latestPersistence;
        if (latestPersistence === persistence) break;
      }
      if (!persisted || !current() || state.deleting || deleted) return;
      if (Object.keys(state.fieldErrors).length) { emit({ status: "draft" }); return; }
      const patch: UpdateItemInput = { ...pending };
      const versions = { ...fieldVersions };
      const savedDraft = draft;
      if (patch.title !== undefined) patch.title = resolveEditorTitle(patch.title, confirmed!.title);
      emit({ status: "saving" });
      try {
        await updateItem(uid, itemId, patch);
      } catch {
        emit({ status: state.localPersistence === "error" ? "error" : "draft" });
        return;
      }
      confirmed = { ...confirmed!, ...patch };
      for (const field of Object.keys(patch) as Field[]) {
        if (fieldVersions[field] === versions[field]) {
          delete pending[field];
          if (state.item) emit({ item: { ...state.item, [field]: patch[field] } });
        }
      }
      if (fields().length) {
        if (!(await persist())) return;
      } else if (savedDraft) {
        // Conditional removal prevents a stale acknowledgement from erasing newer edits.
        try {
          await clearEditorDraft(uid, itemId, savedDraft.revision);
          if (draft === savedDraft) { draft = null; emit({ localPersistence: "idle" }); }
        } catch { emit({ localPersistence: "error" }); }
      }
      emit({ status: fields().length ? "saving" : "saved" });
      if (active && current()) void syncSchedule(confirmed).catch(() => {});
    };
    const operation = runEditorOperation(uid, itemId, async () => {
      // Keep departure follow-up saves inside this reservation: a remounted
      // editor must not read a recovery draft that this session can still upload.
      do {
        await saveOnce();
      } while (fields().length && !timer && !state.deleting && !deleted && current() && state.status === "saving");
    });
    inFlight = operation.finally(() => { inFlight = null; });
    return inFlight;
  };
  const update = (patch: UpdateItemInput) => {
    if (!uid || !state.item || !active || !current() || state.recoveryDraft || state.deleting || deleted) return;
    ++editVersion;
    for (const field of Object.keys(patch) as Field[]) fieldVersions[field] = editVersion;
    pending = { ...pending, ...patch };
    const item = { ...state.item, ...patch };
    emit({ item, status: "saving", fieldErrors: validateEditorText(item), titleHint: patch.title !== undefined ? null : state.titleHint });
    void persist();
    stopTimer();
    timer = setTimeout(() => { timer = undefined; void flush(); }, AUTOSAVE_MS);
  };
  const finishTitleEditing = () => {
    if (!state.item || !confirmed || state.recoveryDraft || state.deleting || state.item.title.trim()) return;
    const title = resolveEditorTitle(state.item.title, confirmed.title);
    if (title !== state.item.title) {
      const empty = !state.item.title.trim();
      update({ title });
      if (empty) emit({ titleHint: "Título vazio. O último título válido foi restaurado." });
    }
  };
  const load = async () => {
    const version = ++readVersion;
    emit({ loading: true, loadError: null, notFound: false });
    if (!uid || !itemId) { emit({ loading: false, notFound: true }); return; }
    try {
      const [item, stored] = await runEditorOperation(uid, itemId, () =>
        Promise.all([getItem(uid, itemId), readEditorDraft(uid, itemId)]));
      if (!active || version !== readVersion || !current()) return;
      confirmed = item;
      draft = stored;
      const conflicts = item && stored ? (Object.keys(stored.patch) as Field[]).filter((field) =>
        JSON.stringify(item[field]) !== JSON.stringify(stored.original[field]) &&
        JSON.stringify(item[field]) !== JSON.stringify(stored.patch[field])) : [];
      emit({ item, loading: false, missing: !item && !!stored, notFound: !item && !stored,
        recoveryDraft: stored, recoveryConflicts: conflicts, status: stored ? "draft" : "saved", localPersistence: stored ? "saved" : "idle" });
    } catch (error) {
      if (active && version === readVersion)
        emit({ loading: false, loadError: error instanceof Error ? error : new Error("load failed") });
    }
  };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getSnapshot: () => state,
    retryLoad: load,
    async retrySave() {
      if (state.recoveryDraft || !current() || state.deleting || deleted) return;
      if (!fields().length && draft && uid) {
        try {
          await clearEditorDraft(uid, itemId, draft.revision);
          draft = null;
          emit({ localPersistence: "idle" });
        } catch { emit({ localPersistence: "error" }); }
        return;
      }
      if (fields().length && !(await persist())) return;
      await flush();
    },
    finishTitleEditing,
    recoverDraft() {
      if (!state.item || !state.recoveryDraft || !current()) return;
      const patch = state.recoveryDraft.patch;
      emit({ recoveryDraft: null, recoveryConflicts: [] });
      update(patch);
    },
    async discardDraft() {
      if (!uid || !state.recoveryDraft || !current()) return;
      const stored = state.recoveryDraft;
      try {
        await clearEditorDraft(uid, itemId, stored.revision);
        if (!active || !current()) return;
        draft = null;
        emit({ recoveryDraft: null, recoveryConflicts: [], status: "saved", localPersistence: "idle", notFound: state.missing });
      } catch { emit({ localPersistence: "error" }); }
    },
    update,
    convert() { if (state.item) update(state.item.type === "note" ? toTask(state.item) : toNote(state.item)); },
    async remove() {
      if (!uid || !state.item || !current() || state.deleting || deleted || state.recoveryDraft) return;
      stopTimer();
      emit({ deleting: true, deleteError: null });
      await inFlight;
      await persistence;
      try {
        await runEditorOperation(uid, itemId, async () => {
          if (!current()) throw new Error("session changed");
          const { failed } = await deleteItemsWithReminders(uid, [itemId]);
          if (failed.length) throw new Error("delete failed");
          deleted = true;
          pending = {};
          if (draft) await clearEditorDraft(uid, itemId, draft.revision);
          draft = null;
        });
      } catch (error) {
        if (!deleted) {
          emit({ deleting: false, deleteError: "Não foi possível excluir. Tente novamente.", status: fields().length ? "draft" : state.status });
          throw error;
        }
        // A deleted remote item must never be recreated because local cleanup failed.
        emit({ localPersistence: "error" });
      }
    },
    start() {
      active = true;
      void load();
      const subscription = AppState.addEventListener("change", (next) => {
        if (next !== "active") { finishTitleEditing(); void flush(); }
      });
      removeAppState = () => subscription.remove();
    },
    dispose() {
      finishTitleEditing();
      active = false;
      ++readVersion;
      removeAppState?.();
      void flush();
    },
  };
}

export function useItemEditor(itemId: string) {
  const { user } = useAuth();
  const uid = user?.uid;
  const session = useMemo(() => createEditorSession(uid, itemId), [uid, itemId]);
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  useEffect(() => { session.start(); return () => session.dispose(); }, [session]);
  return { ...state, update: session.update, convert: session.convert, remove: session.remove,
    retryLoad: session.retryLoad, retrySave: session.retrySave, finishTitleEditing: session.finishTitleEditing,
    recoverDraft: session.recoverDraft, discardDraft: session.discardDraft };
}
