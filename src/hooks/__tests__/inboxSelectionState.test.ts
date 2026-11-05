import {
  inboxSelectionReducer,
  initialInboxSelection,
} from "@/hooks/useInboxSelection";

describe("inboxSelectionReducer", () => {
  it("enter enables mode and selects id", () => {
    expect(
      inboxSelectionReducer(initialInboxSelection, {
        type: "enter",
        itemId: "a",
      })
    ).toEqual({ mode: true, selectedIds: ["a"] });
  });

  it("toggle adds and removes", () => {
    const s1 = inboxSelectionReducer(
      { mode: true, selectedIds: ["a"] },
      { type: "toggle", itemId: "b" }
    );
    expect(s1.selectedIds).toEqual(["a", "b"]);
    const s2 = inboxSelectionReducer(s1, { type: "toggle", itemId: "a" });
    expect(s2.selectedIds).toEqual(["b"]);
  });

  it("toggle of last selected exits mode", () => {
    expect(
      inboxSelectionReducer(
        { mode: true, selectedIds: ["a"] },
        { type: "toggle", itemId: "a" }
      )
    ).toEqual(initialInboxSelection);
  });

  it("clear resets", () => {
    expect(
      inboxSelectionReducer(
        { mode: true, selectedIds: ["a"] },
        { type: "clear" }
      )
    ).toEqual(initialInboxSelection);
  });

  it("prune drops missing but keeps mode when some remain", () => {
    expect(
      inboxSelectionReducer(
        { mode: true, selectedIds: ["a", "gone"] },
        { type: "prune", existingIds: ["a"] }
      )
    ).toEqual({ mode: true, selectedIds: ["a"] });
  });

  it("prune exits mode when none remain", () => {
    expect(
      inboxSelectionReducer(
        { mode: true, selectedIds: ["gone"] },
        { type: "prune", existingIds: ["a"] }
      )
    ).toEqual(initialInboxSelection);
  });

  it("removeIds exits mode when empty", () => {
    expect(
      inboxSelectionReducer(
        { mode: true, selectedIds: ["a"] },
        { type: "removeIds", ids: ["a"] }
      )
    ).toEqual(initialInboxSelection);
  });
});
