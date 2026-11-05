import { useCallback, useMemo, useState } from "react";
import { deleteConfirmTitle } from "@/lib/inboxSelection";
import type { DeleteItemsWithRemindersResult } from "@/services/deleteItemsWithReminders";
import type { Item } from "@/types/item";

type ConfirmTarget = null | { kind: "one"; itemId: string } | { kind: "many" };

type Options = {
  online: boolean;
  items: Item[];
  selectedIds: string[];
  remove: (itemId: string) => Promise<void>;
  removeMany: (itemIds: string[]) => Promise<DeleteItemsWithRemindersResult>;
  clearSelection: () => void;
  removeSelectionIds: (ids: string[]) => void;
};

export function useInboxDeletion({
  online,
  items,
  selectedIds,
  remove,
  removeMany,
  clearSelection,
  removeSelectionIds,
}: Options) {
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const resetConfirm = useCallback(() => setConfirmTarget(null), []);

  const confirmTitle = useMemo(() => {
    if (!confirmTarget) return "";
    if (confirmTarget.kind === "many") {
      return deleteConfirmTitle({ kind: "many", count: selectedIds.length });
    }
    const item = items.find((i) => i.id === confirmTarget.itemId);
    return deleteConfirmTitle({
      kind: "one",
      type: item?.type === "task" ? "task" : "note",
      title: item?.title ?? "",
    });
  }, [confirmTarget, items, selectedIds.length]);

  const requestDelete = useCallback(
    (itemId: string) => {
      if (!online) return;
      setConfirmTarget({ kind: "one", itemId });
    },
    [online],
  );

  const requestDeleteSelected = () => {
    if (!online || selectedIds.length === 0) return;
    setConfirmTarget({ kind: "many" });
  };

  const confirmDelete = async () => {
    if (!online || !confirmTarget || deleting) return;
    setDeleting(true);
    try {
      if (confirmTarget.kind === "one") {
        await remove(confirmTarget.itemId);
      } else {
        const { deleted } = await removeMany(selectedIds);
        if (deleted.length === selectedIds.length) clearSelection();
        else removeSelectionIds(deleted);
      }
      setConfirmTarget(null);
    } catch {
      // The items hook exposes the persistence error to the screen.
    } finally {
      setDeleting(false);
    }
  };

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmTarget(null);
  };

  return {
    confirmOpen: confirmTarget !== null,
    confirmTitle,
    deleting,
    requestDelete,
    requestDeleteSelected,
    confirmDelete,
    closeConfirm,
    resetConfirm,
  };
}
