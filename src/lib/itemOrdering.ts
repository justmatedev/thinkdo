import type { Item } from "@/types/item";

const DEFAULT_GAP = 1000;

const DEFAULT_MIN_GAP = 1;

export function nextSortOrder(now: number = Date.now()): number {
  return now;
}

/** `above` = higher sortOrder (toward top); `below` = lower sortOrder (toward bottom). */
export function sortOrderBetween(
  above: number | null,
  below: number | null,
  now: number = Date.now()
): number {
  if (above == null && below == null) return nextSortOrder(now);
  if (above == null) return below! + DEFAULT_GAP;
  if (below == null) return above - DEFAULT_GAP;
  return (above + below) / 2;
}

export function needsRebalance(
  above: number | null,
  below: number | null,
  minGap: number = DEFAULT_MIN_GAP
): boolean {
  if (above == null || below == null) return false;
  return Math.abs(above - below) < minGap;
}

export function rebalanceSortOrders(
  count: number,
  base: number = Date.now(),
  step: number = DEFAULT_GAP
): number[] {
  return Array.from({ length: count }, (_, i) => base - i * step);
}

export type InboxReorderPlan =
  | { kind: "noop" }
  | { kind: "midpoint"; itemId: string; sortOrder: number }
  | { kind: "rebalance"; orderedIds: string[] };

/** Visible neighbors decide the gap; the full inbox is used only when rebalancing. */
export function planInboxReorder(
  movedId: string,
  orderedVisible: Item[],
  allItems: Item[],
  now: number = Date.now()
): InboxReorderPlan {
  const index = orderedVisible.findIndex((i) => i.id === movedId);
  if (index < 0) return { kind: "noop" };

  const aboveItem = index > 0 ? orderedVisible[index - 1] : null;
  const belowItem =
    index < orderedVisible.length - 1 ? orderedVisible[index + 1] : null;
  const above = aboveItem?.sortOrder ?? null;
  const below = belowItem?.sortOrder ?? null;

  if (!needsRebalance(above, below)) {
    return {
      kind: "midpoint",
      itemId: movedId,
      sortOrder: sortOrderBetween(above, below, now),
    };
  }

  const full = [...allItems].sort((a, b) => b.sortOrder - a.sortOrder);
  const moved = full.find((i) => i.id === movedId);
  if (!moved) return { kind: "noop" };

  const without = full.filter((i) => i.id !== movedId);
  let insertAt = 0;
  if (aboveItem) {
    const ai = without.findIndex((i) => i.id === aboveItem.id);
    insertAt = ai >= 0 ? ai + 1 : 0;
  }
  without.splice(insertAt, 0, moved);
  return { kind: "rebalance", orderedIds: without.map((i) => i.id) };
}
