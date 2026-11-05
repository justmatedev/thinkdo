import { buildCreatePayload } from "@/services/itemPayload";
describe("buildCreatePayload", () => {
  it("defaults body to empty string and done to false for notes", () => {
    expect(
      buildCreatePayload({ type: "note", title: "A" }, 1_700_000_000_000)
    ).toEqual({
      type: "note",
      title: "A",
      body: "",
      done: false,
      sortOrder: 1_700_000_000_000,
    });
  });
  it("defaults done to false for tasks", () => {
    expect(
      buildCreatePayload({ type: "task", title: "B" }, 1_700_000_000_001)
    ).toEqual({
      type: "task",
      title: "B",
      body: "",
      done: false,
      sortOrder: 1_700_000_000_001,
    });
  });
  it("keeps provided body and done", () => {
    expect(
      buildCreatePayload(
        { type: "task", title: "C", body: "x", done: true },
        1_700_000_000_002
      )
    ).toEqual({
      type: "task",
      title: "C",
      body: "x",
      done: true,
      sortOrder: 1_700_000_000_002,
    });
  });
  it("includes sortOrder from nextSortOrder(now) when now is passed", () => {
    expect(
      buildCreatePayload({ type: "note", title: "A" }, 1_700_000_000_000)
    ).toEqual({
      type: "note",
      title: "A",
      body: "",
      done: false,
      sortOrder: 1_700_000_000_000,
    });
  });
});
