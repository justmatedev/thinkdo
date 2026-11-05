import {
  shouldEnterSelectionFromDrag,
  deleteConfirmTitle,
  selectionCountLabel,
  pruneSelectedIds,
} from "@/lib/inboxSelection";

describe("shouldEnterSelectionFromDrag", () => {
  it("is true when indices match", () => {
    expect(shouldEnterSelectionFromDrag(2, 2)).toBe(true);
  });
  it("is false when indices differ", () => {
    expect(shouldEnterSelectionFromDrag(1, 3)).toBe(false);
  });
});

describe("deleteConfirmTitle", () => {
  it("uses the item title when present", () => {
    expect(
      deleteConfirmTitle({ kind: "one", type: "note", title: "Titulo tal" })
    ).toBe("Excluir “Titulo tal”?");
    expect(
      deleteConfirmTitle({ kind: "one", type: "task", title: "Uma tarefa" })
    ).toBe("Excluir “Uma tarefa”?");
  });
  it("falls back to note/task copy when title is empty", () => {
    expect(deleteConfirmTitle({ kind: "one", type: "note", title: "  " })).toBe(
      "Excluir esta anotação?"
    );
    expect(deleteConfirmTitle({ kind: "one", type: "task", title: "" })).toBe(
      "Excluir esta tarefa?"
    );
  });
  it("uses many copy with count", () => {
    expect(deleteConfirmTitle({ kind: "many", count: 3 })).toBe(
      "Excluir 3 itens?"
    );
  });
});

describe("selectionCountLabel", () => {
  it("formats count", () => {
    expect(selectionCountLabel(1)).toBe("1 selecionados");
    expect(selectionCountLabel(2)).toBe("2 selecionados");
  });
});

describe("pruneSelectedIds", () => {
  it("drops missing ids preserving order", () => {
    expect(pruneSelectedIds(["a", "b", "c"], ["c", "a"])).toEqual(["a", "c"]);
  });
});
