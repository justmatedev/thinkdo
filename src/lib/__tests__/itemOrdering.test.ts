import {
  nextSortOrder,
  sortOrderBetween,
  needsRebalance,
  rebalanceSortOrders,
  planInboxReorder,
} from "@/lib/itemOrdering";
import type { Item } from "@/types/item";

const note: Item = {
  id: "1",
  type: "note",
  title: "Comprar café",
  body: "Grãos, moagem média",
  done: false,
  color: null,
  reminder: null,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function row(id: string, sortOrder: number): Item {
  return { ...note, id, title: id, sortOrder };
}

describe("nextSortOrder", () => {
  it("returns the provided now value", () => {
    expect(nextSortOrder(1_700_000_000_000)).toBe(1_700_000_000_000);
  });
});

describe("sortOrderBetween", () => {
  it("returns midpoint when both neighbors exist", () => {
    expect(sortOrderBetween(100, 50)).toBe(75);
  });
  it("places above the only below neighbor when moving to top", () => {
    expect(sortOrderBetween(null, 50)).toBe(1050);
  });
  it("places below the only above neighbor when moving to bottom", () => {
    expect(sortOrderBetween(100, null)).toBe(-900);
  });
  it("falls back to nextSortOrder when no neighbors", () => {
    expect(sortOrderBetween(null, null, 42)).toBe(42);
  });
});

describe("needsRebalance", () => {
  it("is true when gap is below minGap", () => {
    expect(needsRebalance(10, 9.5, 1)).toBe(true);
  });
  it("is false when either neighbor is missing", () => {
    expect(needsRebalance(null, 9, 1)).toBe(false);
    expect(needsRebalance(10, null, 1)).toBe(false);
  });
  it("is false when gap is large enough", () => {
    expect(needsRebalance(100, 50, 1)).toBe(false);
  });
});

describe("rebalanceSortOrders", () => {
  it("returns descending values with fixed step", () => {
    expect(rebalanceSortOrders(3, 3000, 1000)).toEqual([3000, 2000, 1000]);
  });
  it("returns empty array for count 0", () => {
    expect(rebalanceSortOrders(0)).toEqual([]);
  });
});

describe("planInboxReorder", () => {
  it("is noop when the moved id is not in the visible list", () => {
    expect(planInboxReorder("gone", [row("a", 100)], [row("a", 100)])).toEqual({
      kind: "noop",
    });
  });

  it("places at the top with a gap above the new below neighbor", () => {
    const a = row("a", 100);
    const b = row("b", 50);
    expect(planInboxReorder("b", [b, a], [a, b])).toEqual({
      kind: "midpoint",
      itemId: "b",
      sortOrder: 1100,
    });
  });

  it("places at the bottom with a gap below the new above neighbor", () => {
    const a = row("a", 100);
    const b = row("b", 50);
    expect(planInboxReorder("a", [b, a], [a, b])).toEqual({
      kind: "midpoint",
      itemId: "a",
      sortOrder: -950,
    });
  });

  it("uses the midpoint when both visible neighbors have enough gap", () => {
    const a = row("a", 100);
    const b = row("b", 50);
    const c = row("c", 0);
    expect(planInboxReorder("c", [a, c, b], [a, b, c])).toEqual({
      kind: "midpoint",
      itemId: "c",
      sortOrder: 75,
    });
  });

  it("rebalances the full inbox and inserts after the visible above neighbor", () => {
    const a = row("a", 10);
    const b = row("b", 9.5);
    const c = row("c", 0);
    expect(planInboxReorder("c", [a, c, b], [a, b, c])).toEqual({
      kind: "rebalance",
      orderedIds: ["a", "c", "b"],
    });
  });

  it("rebalances into the full list, not only the filtered visible slice", () => {
    const taskTop = { ...row("t", 300), type: "task" as const };
    const n1 = row("n1", 10);
    const n2 = row("n2", 9.5);
    const n3 = row("n3", 0);
    expect(planInboxReorder("n3", [n1, n3, n2], [taskTop, n1, n2, n3])).toEqual({
      kind: "rebalance",
      orderedIds: ["t", "n1", "n3", "n2"],
    });
  });
});
