import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearInboxWidgetFilter,
  clearInboxWidgetInstancePrefs,
  inboxFilterLabel,
  inboxWidgetFilterStorageKey,
  loadInboxWidgetFilter,
  parseInboxWidgetFilter,
  saveInboxWidgetFilter,
} from "@/widgets/inbox/inboxWidgetFilter";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("inboxWidgetFilterStorageKey", () => {
  it("keys by widget id", () => {
    expect(inboxWidgetFilterStorageKey(42)).toBe("thinkdo.widget.42.filter");
  });
});

describe("parseInboxWidgetFilter", () => {
  it("accepts all, notes, and tasks", () => {
    expect(parseInboxWidgetFilter("all")).toBe("all");
    expect(parseInboxWidgetFilter("notes")).toBe("notes");
    expect(parseInboxWidgetFilter("tasks")).toBe("tasks");
  });

  it("defaults missing or invalid to all", () => {
    expect(parseInboxWidgetFilter(null)).toBe("all");
    expect(parseInboxWidgetFilter("nope")).toBe("all");
  });
});

describe("inboxFilterLabel", () => {
  it("returns Portuguese labels", () => {
    expect(inboxFilterLabel("all")).toBe("Tudo");
    expect(inboxFilterLabel("notes")).toBe("Notas");
    expect(inboxFilterLabel("tasks")).toBe("Tarefas");
  });
});

describe("load/save/clear", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("loads all when empty", async () => {
    expect(await loadInboxWidgetFilter(7)).toBe("all");
  });

  it("round-trips a filter", async () => {
    await saveInboxWidgetFilter(7, "notes");
    expect(await loadInboxWidgetFilter(7)).toBe("notes");
    expect(await AsyncStorage.getItem("thinkdo.widget.7.filter")).toBe("notes");
  });

  it("clears the key", async () => {
    await saveInboxWidgetFilter(7, "tasks");
    await clearInboxWidgetFilter(7);
    expect(await AsyncStorage.getItem("thinkdo.widget.7.filter")).toBeNull();
    expect(await loadInboxWidgetFilter(7)).toBe("all");
  });
});

describe("clearInboxWidgetInstancePrefs", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("clears theme and filter keys", async () => {
    await AsyncStorage.setItem("thinkdo.widget.3.theme", "dark");
    await AsyncStorage.setItem("thinkdo.widget.3.filter", "tasks");
    await clearInboxWidgetInstancePrefs(3);
    expect(await AsyncStorage.getItem("thinkdo.widget.3.theme")).toBeNull();
    expect(await AsyncStorage.getItem("thinkdo.widget.3.filter")).toBeNull();
  });
});
