import type { WidgetThemePreference } from "@/widgets/capture/widgetThemePreference";

export type CaptureWidgetRenderMode =
  | { kind: "day_night" }
  | { kind: "single"; themeName: "light" | "dark" };

/**
 * Dual RemoteViews when the tile follows the device (Sistema).
 * Fixed Claro/Escuro use a single representation.
 */
export function resolveCaptureWidgetRenderMode(
  widgetPref: WidgetThemePreference
): CaptureWidgetRenderMode {
  if (widgetPref === "system") {
    return { kind: "day_night" };
  }
  return { kind: "single", themeName: widgetPref };
}
