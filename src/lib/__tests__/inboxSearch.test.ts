import { itemMatchesQuery, normalizeSearchText } from "@/lib/inboxSearch";

const item = { title: "Reunião com Ana", body: "Levar o notebook" };

describe("normalizeSearchText", () => {
  it("lowercases and strips combining marks", () => {
    expect(normalizeSearchText("Reunião")).toBe("reuniao");
  });
});

describe("itemMatchesQuery", () => {
  it("matches title case-insensitively", () => {
    expect(itemMatchesQuery(item, "reunião")).toBe(true);
    expect(itemMatchesQuery(item, "REUNIÃO")).toBe(true);
  });

  it("matches title without accents", () => {
    expect(itemMatchesQuery(item, "reuniao")).toBe(true);
  });

  it("matches body and not only title", () => {
    expect(itemMatchesQuery(item, "notebook")).toBe(true);
    expect(itemMatchesQuery({ title: "Compras", body: "" }, "notebook")).toBe(
      false
    );
  });

  it("returns true for empty or whitespace query", () => {
    expect(itemMatchesQuery(item, "")).toBe(true);
    expect(itemMatchesQuery(item, "   ")).toBe(true);
  });

  it("keeps internal spaces as substring", () => {
    expect(itemMatchesQuery(item, "com  Ana")).toBe(false);
    expect(itemMatchesQuery(item, "com Ana")).toBe(true);
  });
});
