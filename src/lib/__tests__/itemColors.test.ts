import {
  ITEM_COLORS,
  itemColorLabel,
  itemColorMuted,
  itemColorSheet,
  itemColorSwatch,
  itemColorTint,
  parseItemColor,
} from "@/lib/itemColors";

describe("ITEM_COLORS", () => {
  it("has the eight palette keys from the item-color spec", () => {
    expect([...ITEM_COLORS]).toEqual([
      "yellow",
      "orange",
      "red",
      "pink",
      "purple",
      "blue",
      "green",
      "gray",
    ]);
  });
});

describe("parseItemColor", () => {
  it("returns null for missing, null, or invalid values", () => {
    expect(parseItemColor(undefined)).toBeNull();
    expect(parseItemColor(null)).toBeNull();
    expect(parseItemColor("#FEF3C7")).toBeNull();
    expect(parseItemColor("Yellow")).toBeNull();
    expect(parseItemColor(1)).toBeNull();
  });

  it("returns the key for each allowed color", () => {
    for (const key of ITEM_COLORS) {
      expect(parseItemColor(key)).toBe(key);
    }
  });
});

describe("itemColorTint", () => {
  it("returns null when color is null", () => {
    expect(itemColorTint(null, "light")).toBeNull();
    expect(itemColorTint(null, "dark")).toBeNull();
  });

  it("returns a hex string for every key in light and dark", () => {
    for (const key of ITEM_COLORS) {
      expect(itemColorTint(key, "light")).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(itemColorTint(key, "dark")).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("uses different tints for light vs dark yellow", () => {
    expect(itemColorTint("yellow", "light")).not.toBe(
      itemColorTint("yellow", "dark")
    );
  });
});

describe("itemColorSheet", () => {
  it("returns null when color is null", () => {
    expect(itemColorSheet(null, "light")).toBeNull();
  });

  it("differs from tint for every key", () => {
    for (const key of ITEM_COLORS) {
      expect(itemColorSheet(key, "dark")).not.toBe(itemColorTint(key, "dark"));
      expect(itemColorSheet(key, "light")).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("itemColorMuted", () => {
  it("returns null when color is null", () => {
    expect(itemColorMuted(null, "dark")).toBeNull();
  });

  it("returns a hex for every key and differs from primary-like swatch", () => {
    for (const key of ITEM_COLORS) {
      expect(itemColorMuted(key, "dark")).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(itemColorMuted(key, "dark")).not.toBe(
        itemColorSwatch(key, "dark")
      );
    }
  });
});

describe("itemColorSwatch", () => {
  it("returns a hex for every key", () => {
    for (const key of ITEM_COLORS) {
      expect(itemColorSwatch(key, "light")).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("itemColorLabel", () => {
  it("returns Portuguese labels", () => {
    expect(itemColorLabel("yellow")).toBe("Amarelo");
    expect(itemColorLabel("gray")).toBe("Cinza");
  });
});
