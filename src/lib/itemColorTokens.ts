import type { ItemColor } from "@/types/item";
import type { ThemeName } from "@/lib/theme";

export type ItemColorFace = {
  /** Full-bleed editor / inbox row fill */
  tint: string;
  /** Options sheet — related but distinct from tint */
  sheet: string;
  /** Checkbox / handle / back accent */
  swatch: string;
  /** Secondary / placeholder text on tint or sheet */
  muted: string;
};

export const itemColorTokens: Record<
  ThemeName,
  Record<ItemColor, ItemColorFace>
> = {
  light: {
    yellow: {
      tint: "#FFF9C4",
      sheet: "#FFF3A0",
      swatch: "#FBC02D",
      muted: "#8A7340",
    },
    orange: {
      tint: "#FFE0B2",
      sheet: "#FFCC80",
      swatch: "#FB8C00",
      muted: "#8D5E2A",
    },
    red: {
      tint: "#FFCDD2",
      sheet: "#EF9A9A",
      swatch: "#E53935",
      muted: "#8F3A44",
    },
    pink: {
      tint: "#F8BBD9",
      sheet: "#F48FB1",
      swatch: "#EC407A",
      muted: "#8A3D5C",
    },
    purple: {
      tint: "#E1BEE7",
      sheet: "#CE93D8",
      swatch: "#8E24AA",
      muted: "#6B4578",
    },
    blue: {
      tint: "#BBDEFB",
      sheet: "#90CAF9",
      swatch: "#1E88E5",
      muted: "#3D5F80",
    },
    green: {
      tint: "#C8E6C9",
      sheet: "#A5D6A7",
      swatch: "#43A047",
      muted: "#3F6B45",
    },
    gray: {
      tint: "#E8E6ED",
      sheet: "#D5D0E0",
      swatch: "#78718A",
      muted: "#5C5668",
    },
  },
  dark: {
    yellow: {
      tint: "#3D3420",
      sheet: "#52462C",
      swatch: "#FBC02D",
      muted: "#D4C4A0",
    },
    orange: {
      tint: "#3D2E1A",
      sheet: "#53402A",
      swatch: "#FB8C00",
      muted: "#D4B896",
    },
    red: {
      tint: "#3A1E24",
      sheet: "#4E2A32",
      swatch: "#E57373",
      muted: "#D4A8B0",
    },
    pink: {
      tint: "#3A1E2E",
      sheet: "#4E2A3E",
      swatch: "#F06292",
      muted: "#D4A8BC",
    },
    purple: {
      tint: "#2E1A3A",
      sheet: "#3F2750",
      swatch: "#CE93D8",
      muted: "#C4B0D4",
    },
    blue: {
      tint: "#1A283A",
      sheet: "#263950",
      swatch: "#64B5F6",
      muted: "#A8C0D4",
    },
    green: {
      tint: "#1A2E22",
      sheet: "#263E30",
      swatch: "#81C784",
      muted: "#A8C4B0",
    },
    gray: {
      tint: "#2A2733",
      sheet: "#3A3648",
      swatch: "#A39BB8",
      muted: "#C4BDD0",
    },
  },
};
