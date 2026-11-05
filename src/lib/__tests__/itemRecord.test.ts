import { mapItemRecord } from "@/lib/itemRecord";

const now = new Date("2026-08-16T12:00:00.000Z");

describe("mapItemRecord", () => {
  it("throws when data is missing", () => {
    expect(() => mapItemRecord("x", undefined)).toThrow("Item x has no data");
  });

  it("maps a complete document", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-01-02T00:00:00.000Z");
    expect(
      mapItemRecord("abc", {
        type: "task",
        title: "Café",
        body: "Moagem média",
        done: true,
        color: "yellow",
        reminder: { kind: "daily", hour: 9, minute: 0 },
        sortOrder: 42,
        createdAt: { toDate: () => createdAt },
        updatedAt: { toDate: () => updatedAt },
      })
    ).toEqual({
      id: "abc",
      type: "task",
      title: "Café",
      body: "Moagem média",
      done: true,
      color: "yellow",
      reminder: { kind: "daily", hour: 9, minute: 0 },
      sortOrder: 42,
      createdAt,
      updatedAt,
    });
  });

  it("falls back sortOrder to updatedAt millis when the field is missing", () => {
    const updatedAt = new Date("2026-04-01T00:00:00.000Z");
    const item = mapItemRecord(
      "1",
      {
        type: "note",
        title: "A",
        body: "",
        done: false,
        createdAt: { toDate: () => now },
        updatedAt: { toDate: () => updatedAt },
      },
      now
    );
    expect(item.sortOrder).toBe(updatedAt.getTime());
  });

  it("uses 0 when sortOrder and updatedAt are both missing", () => {
    const item = mapItemRecord(
      "1",
      { type: "note", title: "A", body: "", done: false },
      now
    );
    expect(item.sortOrder).toBe(0);
  });

  it("uses now when createdAt or updatedAt are missing", () => {
    const item = mapItemRecord(
      "1",
      { type: "note", title: "A", body: "", done: false, sortOrder: 1 },
      now
    );
    expect(item.createdAt).toBe(now);
    expect(item.updatedAt).toBe(now);
  });

  it("accepts native Date timestamps", () => {
    const createdAt = new Date("2026-05-01T00:00:00.000Z");
    const item = mapItemRecord(
      "1",
      {
        type: "note",
        title: "A",
        body: "",
        done: false,
        sortOrder: 1,
        createdAt,
        updatedAt: createdAt,
      },
      now
    );
    expect(item.createdAt).toBe(createdAt);
    expect(item.updatedAt).toBe(createdAt);
  });

  it("nulls invalid color and reminder", () => {
    const item = mapItemRecord(
      "1",
      {
        type: "note",
        title: "A",
        body: "",
        done: false,
        sortOrder: 1,
        color: "#fff",
        reminder: { kind: "monthly" },
      },
      now
    );
    expect(item.color).toBeNull();
    expect(item.reminder).toBeNull();
  });
});
