import type { ItemColor } from "@/types/item";
import { itemColorTokens } from "@/lib/itemColorTokens";
import type { ThemeName } from "@/lib/theme";

export const ITEM_COLORS = [
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "blue",
  "green",
  "gray",
] as const satisfies readonly ItemColor[];

const LABEL_PT: Record<ItemColor, string> = {
  yellow: "Amarelo",
  orange: "Laranja",
  red: "Vermelho",
  pink: "Rosa",
  purple: "Roxo",
  blue: "Azul",
  green: "Verde",
  gray: "Cinza",
};

export function parseItemColor(value: unknown): ItemColor | null {
  if (typeof value !== "string") return null;
  return (ITEM_COLORS as readonly string[]).includes(value)
    ? (value as ItemColor)
    : null;
}

export function itemColorTint(
  color: ItemColor | null,
  scheme: ThemeName
): string | null {
  if (!color) return null;
  return itemColorTokens[scheme][color].tint;
}

export function itemColorSheet(
  color: ItemColor | null,
  scheme: ThemeName
): string | null {
  if (!color) return null;
  return itemColorTokens[scheme][color].sheet;
}

export function itemColorMuted(
  color: ItemColor | null,
  scheme: ThemeName
): string | null {
  if (!color) return null;
  return itemColorTokens[scheme][color].muted;
}

export function itemColorSwatch(color: ItemColor, scheme: ThemeName): string {
  return itemColorTokens[scheme][color].swatch;
}

export function itemColorLabel(color: ItemColor): string {
  return LABEL_PT[color];
}

/** Choose the stronger black/white contrast for the decorative swatch check. */
export function itemColorCheck(color: ItemColor, scheme: ThemeName): string {
  const hex = itemColorSwatch(color, scheme).slice(1);
  const channels = [0, 2, 4].map((offset) => {
    const srgb = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#000000" : "#FFFFFF";
}
