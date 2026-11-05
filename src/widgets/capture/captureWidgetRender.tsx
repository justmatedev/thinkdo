import type { WidgetRepresentation } from "react-native-android-widget";
import { CaptureWidget } from "@/widgets/capture/CaptureWidget";
import {
  resolveCaptureWidgetRenderMode,
  type CaptureWidgetRenderMode,
} from "@/widgets/capture/captureWidgetRenderMode";
import {
  loadWidgetThemePreference,
  type WidgetThemePreference,
} from "@/widgets/capture/widgetThemePreference";

export type { CaptureWidgetRenderMode };
export { resolveCaptureWidgetRenderMode };

export function buildCaptureWidgetRepresentation(
  width: number,
  height: number,
  mode: CaptureWidgetRenderMode
): WidgetRepresentation {
  if (mode.kind === "day_night") {
    return {
      light: (
        <CaptureWidget width={width} height={height} themeName="light" />
      ),
      dark: <CaptureWidget width={width} height={height} themeName="dark" />,
    };
  }
  return (
    <CaptureWidget
      width={width}
      height={height}
      themeName={mode.themeName}
    />
  );
}

export async function resolveCaptureWidgetRepresentation(
  widgetId: number,
  width: number,
  height: number
): Promise<WidgetRepresentation> {
  const widgetPref = await loadWidgetThemePreference(widgetId);
  const mode = resolveCaptureWidgetRenderMode(widgetPref);
  return buildCaptureWidgetRepresentation(width, height, mode);
}

/** Sync helper for config screen (prefs already in memory). */
export function captureWidgetRepresentationForPrefs(
  width: number,
  height: number,
  widgetPref: WidgetThemePreference
): WidgetRepresentation {
  return buildCaptureWidgetRepresentation(
    width,
    height,
    resolveCaptureWidgetRenderMode(widgetPref)
  );
}
