import { useCallback, useMemo, useReducer } from "react";
import { pruneSelectedIds } from "@/lib/inboxSelection";

export type InboxSelectionState = {
  mode: boolean;
  selectedIds: string[];
};

export const initialInboxSelection: InboxSelectionState = {
  mode: false,
  selectedIds: [],
};

export type InboxSelectionAction =
  | { type: "enter"; itemId: string }
  | { type: "toggle"; itemId: string }
  | { type: "clear" }
  | { type: "prune"; existingIds: string[] }
  | { type: "removeIds"; ids: string[] };

function selectionOrIdle(selectedIds: string[]): InboxSelectionState {
  if (selectedIds.length === 0) return initialInboxSelection;
  return { mode: true, selectedIds };
}

export function inboxSelectionReducer(
  state: InboxSelectionState,
  action: InboxSelectionAction
): InboxSelectionState {
  switch (action.type) {
    case "enter":
      return { mode: true, selectedIds: [action.itemId] };
    case "toggle": {
      if (!state.mode) return state;
      const has = state.selectedIds.includes(action.itemId);
      const selectedIds = has
        ? state.selectedIds.filter((id) => id !== action.itemId)
        : [...state.selectedIds, action.itemId];
      return selectionOrIdle(selectedIds);
    }
    case "clear":
      return initialInboxSelection;
    case "prune":
      if (!state.mode) return state;
      return selectionOrIdle(
        pruneSelectedIds(state.selectedIds, action.existingIds)
      );
    case "removeIds": {
      if (!state.mode) return state;
      const drop = new Set(action.ids);
      return selectionOrIdle(
        state.selectedIds.filter((id) => !drop.has(id))
      );
    }
    default:
      return state;
  }
}

export function useInboxSelection() {
  const [state, dispatch] = useReducer(
    inboxSelectionReducer,
    initialInboxSelection
  );
  const enter = useCallback(
    (itemId: string) => dispatch({ type: "enter", itemId }),
    []
  );
  const toggle = useCallback(
    (itemId: string) => dispatch({ type: "toggle", itemId }),
    []
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const prune = useCallback(
    (existingIds: string[]) => dispatch({ type: "prune", existingIds }),
    []
  );
  const removeIds = useCallback(
    (ids: string[]) => dispatch({ type: "removeIds", ids }),
    []
  );
  const selectedSet = useMemo(
    () => new Set(state.selectedIds),
    [state.selectedIds]
  );
  return { ...state, selectedSet, enter, toggle, clear, prune, removeIds };
}
