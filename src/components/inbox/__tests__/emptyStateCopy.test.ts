import {
  emptyStateMessage,
  inboxEmptyVariant,
} from "@/components/inbox/emptyStateCopy";

describe("emptyStateMessage", () => {
  it("uses capture hint outside search", () => {
    expect(emptyStateMessage("inbox")).toBe("Nada por aqui. Anote acima.");
  });

  it("omits capture hint when search is idle", () => {
    expect(emptyStateMessage("searchIdle")).toBe("Nada por aqui.");
  });

  it("uses none copy when query has no matches", () => {
    expect(emptyStateMessage("searchNone")).toBe("Nenhum resultado.");
  });
});

describe("inboxEmptyVariant", () => {
  it("is inbox when search is off", () => {
    expect(inboxEmptyVariant(false, "qualquer")).toBe("inbox");
  });

  it("is searchIdle when search is on and query is empty", () => {
    expect(inboxEmptyVariant(true, "")).toBe("searchIdle");
    expect(inboxEmptyVariant(true, "   ")).toBe("searchIdle");
  });

  it("is searchNone when search is on and query is non-empty", () => {
    expect(inboxEmptyVariant(true, "reunião")).toBe("searchNone");
  });
});
