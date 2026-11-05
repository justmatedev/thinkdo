import { useEffect, useRef, useState } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { useAuth } from "@/features/auth/AuthProvider";
import { planInboxReorder } from "@/lib/itemOrdering";
import {
  backfillMissingSortOrders,
  createItem,
  rebalanceAllSortOrders,
  reorderItem,
  subscribeItems,
  updateItem,
} from "@/services/items";
import {
  deleteItemsWithReminders,
  type DeleteItemsWithRemindersResult,
} from "@/services/deleteItemsWithReminders";
import { reconcileReminders } from "@/features/reminders/reminderScheduler";
import type { Item, ItemType } from "@/types/item";
import {
  buildInboxSnapshot,
  writeInboxSnapshot,
} from "@/widgets/snapshot";
import { getInboxSession, isInboxSessionCurrent } from "@/widgets/snapshot/session";
import { refreshInboxWidgets } from "@/widgets/refreshWidgets";

type ItemsQueryState = {
  items: Item[];
  loading: boolean;
  error: Error | null;
};

export function useItems(): ItemsQueryState & {
  saveError: string | null;
  create: (type: ItemType, title: string) => Promise<boolean>;
  toggleDone: (itemId: string, done: boolean) => Promise<void>;
  reorder: (movedId: string, orderedVisible: Item[]) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  removeMany: (itemIds: string[]) => Promise<DeleteItemsWithRemindersResult>;
} {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [trackedUid, setTrackedUid] = useState(uid);
  const [state, setState] = useState<ItemsQueryState>({
    items: [],
    loading: uid != null,
    error: null,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const itemsRef = useRef<Item[]>([]);

  if (uid !== trackedUid) {
    setTrackedUid(uid);
    setState({ items: [], loading: uid != null, error: null });
  }

  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);

  useEffect(() => {
    if (!uid || state.loading || !isInboxSessionCurrent(getInboxSession(uid))) return;
    void reconcileReminders(state.items);
  }, [uid, state.items, state.loading]);

  useEffect(() => {
    if (!uid) return;
    const onChange = (next: AppStateStatus) => {
      if (next === "active" && isInboxSessionCurrent(getInboxSession(uid))) {
        void reconcileReminders(itemsRef.current);
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const session = getInboxSession(uid);
    let cancelled = false;
    let unsub: (() => void) | undefined;

    (async () => {
      try {
        await backfillMissingSortOrders(uid);
      } catch {
        // Still attempt subscribe; mapDoc fallback covers missing field briefly
      }
      if (cancelled) return;
      unsub = subscribeItems(
        uid,
        (items) => {
          if (cancelled) return;
          setState({ items, loading: false, error: null });
          void (async () => {
            try {
              await writeInboxSnapshot(
                buildInboxSnapshot({ signedIn: true, uid, items }),
                session
              );
              if (Platform.OS === "android") await refreshInboxWidgets();
            } catch {
              // Snapshot persistence must not block or fail the inbox UI.
            }
          })();
        },
        (error) => setState((s) => ({ ...s, loading: false, error }))
      );
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [uid]);

  const create = async (type: ItemType, title: string) => {
    if (!user) return false;
    try {
      setSaveError(null);
      await createItem(user.uid, { type, title });
      return true;
    } catch {
      setSaveError("Não foi possível salvar. Tente de novo.");
      return false;
    }
  };

  const toggleDone = async (itemId: string, done: boolean) => {
    if (!user) return;
    try {
      setSaveError(null);
      await updateItem(user.uid, itemId, { done });
    } catch {
      setSaveError("Não foi possível salvar. Tente de novo.");
    }
  };

  const reorder = async (movedId: string, orderedVisible: Item[]) => {
    if (!user) return;
    const plan = planInboxReorder(movedId, orderedVisible, state.items);
    if (plan.kind === "noop") return;

    try {
      setSaveError(null);
      if (plan.kind === "rebalance") {
        await rebalanceAllSortOrders(user.uid, plan.orderedIds);
      } else {
        await reorderItem(user.uid, plan.itemId, plan.sortOrder);
      }
    } catch {
      setSaveError("Não foi possível reordenar. Tente de novo.");
      throw new Error("reorder failed");
    }
  };

  const remove = async (itemId: string) => {
    if (!user) return;
    try {
      setSaveError(null);
      const { failed } = await deleteItemsWithReminders(user.uid, [itemId]);
      if (failed.length > 0) {
        setSaveError("Não foi possível excluir. Tente de novo.");
        throw new Error("delete failed");
      }
    } catch (e) {
      if (e instanceof Error && e.message === "delete failed") throw e;
      setSaveError("Não foi possível excluir. Tente de novo.");
      throw e;
    }
  };

  const removeMany = async (itemIds: string[]) => {
    if (!user) return { deleted: [] as string[], failed: itemIds };
    setSaveError(null);
    const result = await deleteItemsWithReminders(user.uid, itemIds);
    if (result.failed.length > 0) {
      setSaveError("Não foi possível excluir. Tente de novo.");
    }
    return result;
  };

  return {
    ...state,
    saveError,
    create,
    toggleDone,
    reorder,
    remove,
    removeMany,
  };
}
