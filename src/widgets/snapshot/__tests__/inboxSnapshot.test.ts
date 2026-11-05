import AsyncStorage from "@react-native-async-storage/async-storage";
import { beginInboxSession, getInboxSession } from "@/widgets/snapshot/session";
import type { Item } from "@/types/item";
import {
  clearInboxSnapshot,
  INBOX_SNAPSHOT_CAP,
  INBOX_SNAPSHOT_KEY,
  buildInboxSnapshot,
  filterInboxSnapshotRows,
  patchInboxSnapshotItemDone,
  readInboxSnapshot,
  toInboxSnapshotRows,
  writeInboxSnapshot,
} from "@/widgets/snapshot/inboxSnapshot";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const item = (
  partial: Partial<Item> & Pick<Item, "id" | "type" | "title">,
): Item =>
  ({
    done: false,
    body: "",
    color: null,
    reminder: null,
    sortOrder: 1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...partial,
  }) as Item;

describe("toInboxSnapshotRows", () => {
  it("keeps slim fields and caps length", () => {
    const rows = toInboxSnapshotRows(
      Array.from({ length: 40 }, (_, i) =>
        item({ id: String(i), type: "note", title: `t${i}` }),
      ),
      30,
    );
    expect(rows).toHaveLength(INBOX_SNAPSHOT_CAP);
    expect(rows[0]).toEqual({
      id: "0",
      type: "note",
      title: "t0",
      done: false,
    });
  });
});

describe("filterInboxSnapshotRows", () => {
  const rows = [
    { id: "1", type: "note" as const, title: "n", done: false },
    { id: "2", type: "task" as const, title: "t", done: true },
  ];
  it("filters notes and tasks", () => {
    expect(filterInboxSnapshotRows(rows, "notes")).toEqual([rows[0]]);
    expect(filterInboxSnapshotRows(rows, "tasks")).toEqual([rows[1]]);
    expect(filterInboxSnapshotRows(rows, "all")).toEqual(rows);
  });
});

describe("read/write/patch", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    beginInboxSession("user-1");
  });

  it("round-trips a snapshot", async () => {
    const snap = buildInboxSnapshot({
      signedIn: true,
      uid: "user-1",
      items: [item({ id: "a", type: "task", title: "X", done: false })],
      now: 1000,
    });
    await writeInboxSnapshot(snap);
    expect(await readInboxSnapshot()).toEqual(snap);
  });

  it("patches done on an existing row", async () => {
    await writeInboxSnapshot(
      buildInboxSnapshot({
        signedIn: true,
        uid: "user-1",
        items: [item({ id: "a", type: "task", title: "X", done: false })],
        now: 1,
      }),
    );
    const next = await patchInboxSnapshotItemDone(
      "a",
      true,
      getInboxSession("user-1")!,
    );
    expect(next?.items[0].done).toBe(true);
  });

  it("returns an empty snapshot when stored JSON is invalid", async () => {
    await AsyncStorage.setItem(INBOX_SNAPSHOT_KEY, "{not-json");
    expect(await readInboxSnapshot()).toEqual({
      updatedAt: 0,
      signedIn: false,
      uid: null,
      items: [],
    });
  });

  it("returns null when patching an unknown item", async () => {
    await writeInboxSnapshot(
      buildInboxSnapshot({
        signedIn: true,
        uid: "user-1",
        items: [item({ id: "a", type: "task", title: "X", done: false })],
        now: 1,
      }),
    );
    expect(
      await patchInboxSnapshotItemDone(
        "gone",
        true,
        getInboxSession("user-1")!,
      ),
    ).toBeNull();
  });
});

describe("session privacy", () => {
  it("does not expose a legacy snapshot without an owner", async () => {
    await AsyncStorage.setItem(
      INBOX_SNAPSHOT_KEY,
      JSON.stringify({
        signedIn: true,
        updatedAt: 1,
        items: [{ id: "secret", title: "Private" }],
      }),
    );
    expect((await readInboxSnapshot()).signedIn).toBe(false);
    expect((await readInboxSnapshot()).items).toEqual([]);
  });
});

describe("serialized session writes", () => {
  it("rejects an old producer after logout, even when the same account signs in again", async () => {
    beginInboxSession("user-1");
    const old = getInboxSession("user-1")!;
    const snapshot = buildInboxSnapshot({
      uid: "user-1",
      signedIn: true,
      items: [item({ id: "secret", type: "note", title: "Private" })],
    });
    await writeInboxSnapshot(snapshot, old);
    await clearInboxSnapshot();
    beginInboxSession("user-1");
    await writeInboxSnapshot(snapshot, old);
    expect((await readInboxSnapshot()).signedIn).toBe(false);
  });
  it("waits for an in-flight storage write before clearing it", async () => {
    beginInboxSession("user-1");
    let finish!: () => void;
    const original = AsyncStorage.setItem;
    const spy = jest
      .spyOn(AsyncStorage, "setItem")
      .mockImplementationOnce(async (key, value) => {
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        await original(key, value);
      });
    const snapshot = buildInboxSnapshot({
      uid: "user-1",
      signedIn: true,
      items: [],
    });
    const write = writeInboxSnapshot(snapshot);
    await Promise.resolve();
    const clear = clearInboxSnapshot();
    finish();
    await Promise.all([write, clear]);
    expect((await readInboxSnapshot()).signedIn).toBe(false);
    spy.mockRestore();
  });
});


describe("filtered widget capacity", () => {
  it.each(["note", "task"] as const)(
    "shows %s items beyond the first 30 inbox rows and caps the filtered result",
    (type) => {
      const otherType = type === "note" ? "task" : "note";
      const snapshot = buildInboxSnapshot({
        uid: "user-1",
        signedIn: true,
        items: [
          ...Array.from({ length: 30 }, (_, i) =>
            item({ id: `other-${i}`, type: otherType, title: "Other" }),
          ),
          ...Array.from({ length: 40 }, (_, i) =>
            item({ id: `match-${i}`, type, title: "Match" }),
          ),
        ],
      });
      const visible = filterInboxSnapshotRows(
        snapshot.items,
        type === "note" ? "notes" : "tasks",
      );
      expect(visible).toHaveLength(30);
      expect(visible[0].id).toBe("match-0");
      expect(visible[29].id).toBe("match-29");
      expect(filterInboxSnapshotRows(snapshot.items, "all")).toHaveLength(30);
    },
  );
});
