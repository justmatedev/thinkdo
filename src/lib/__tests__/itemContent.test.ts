import {
  normalizeTitle,
  resolveEditorTitle,
  toTask,
  toNote,
  normalizePreviewText,
  getItemPreview,
} from "@/lib/itemContent";
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

const task: Item = { ...note, id: "2", type: "task", done: true, sortOrder: 2 };

describe("normalizeTitle", () => {
  it("trims valid titles", () => {
    expect(normalizeTitle("  Comprar café  ")).toBe("Comprar café");
  });
  it("returns null for empty or whitespace-only", () => {
    expect(normalizeTitle("")).toBeNull();
    expect(normalizeTitle("   ")).toBeNull();
  });
});

describe("toTask", () => {
  it("converts note to task with done=false and preserves body", () => {
    const patch = toTask(note);
    expect(patch).toEqual({ type: "task", done: false });
    expect(patch).not.toHaveProperty("body");
  });
});

describe("toNote", () => {
  it("converts task to note without touching done", () => {
    expect(toNote(task)).toEqual({ type: "note" });
  });
});

describe("normalizePreviewText", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizePreviewText("  Leite,\n  pão  ")).toBe("Leite, pão");
  });
});

describe("getItemPreview", () => {
  it("returns null for empty body", () => {
    expect(getItemPreview({ title: "Lista", body: "" })).toBeNull();
    expect(getItemPreview({ title: "Lista", body: "   " })).toBeNull();
  });

  it("returns null when body equals title", () => {
    expect(getItemPreview({ title: "Lista", body: "Lista" })).toBeNull();
    expect(getItemPreview({ title: "Lista", body: "  lista  " })).toBeNull();
  });

  it("returns continuation when body starts with title", () => {
    expect(
      getItemPreview({ title: "Lista", body: "Lista: leite, pão" })
    ).toBe("leite, pão");
  });

  it("returns null when the body is only the title plus punctuation", () => {
    expect(getItemPreview({ title: "Lista", body: "Lista:" })).toBeNull();
    expect(getItemPreview({ title: "Lista", body: "Lista —" })).toBeNull();
  });

  it("returns normalized body when it adds context", () => {
    expect(
      getItemPreview({
        title: "Lembrar de tal coisa",
        body: "Tenho que lembrar disso amanhã",
      })
    ).toBe("Tenho que lembrar disso amanhã");
  });
});

describe("resolveEditorTitle", () => {
  it("trims a non-empty draft", () => {
    expect(resolveEditorTitle("  Comprar  ", "Antigo")).toBe("Comprar");
  });

  it("keeps the last valid title when the draft is empty", () => {
    expect(resolveEditorTitle("   ", "Comprar café")).toBe("Comprar café");
    expect(resolveEditorTitle("", "Comprar café")).toBe("Comprar café");
  });
});
