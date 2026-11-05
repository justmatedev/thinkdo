"use no memo";

import type { WidgetRepresentation } from "react-native-android-widget";
import {
  resolveCaptureWidgetRenderMode,
  type CaptureWidgetRenderMode,
} from "@/widgets/capture/captureWidgetRenderMode";
import { loadWidgetThemePreference } from "@/widgets/capture/widgetThemePreference";
import type { InboxSnapshot } from "@/widgets/snapshot/inboxSnapshot";
import { readAuthenticatedInboxSnapshot } from "@/widgets/snapshot/authenticatedSnapshot";
import type { InboxFilter } from "@/types/item";
import { InboxWidget } from "@/widgets/inbox/InboxWidget";
import { loadInboxWidgetFilter } from "@/widgets/inbox/inboxWidgetFilter";

export function buildInboxWidgetRepresentation(
  width: number,
  height: number,
  mode: CaptureWidgetRenderMode,
  filter: InboxFilter,
  snapshot: InboxSnapshot
): WidgetRepresentation {
  if (mode.kind === "day_night") {
    return {
      light: (
        <InboxWidget
          width={width}
          height={height}
          themeName="light"
          filter={filter}
          snapshot={snapshot}
        />
      ),
      dark: (
        <InboxWidget
          width={width}
          height={height}
          themeName="dark"
          filter={filter}
          snapshot={snapshot}
        />
      ),
    };
  }

  return (
    <InboxWidget
      width={width}
      height={height}
      themeName={mode.themeName}
      filter={filter}
      snapshot={snapshot}
    />
  );
}

export async function resolveInboxWidgetRepresentation(
  widgetId: number,
  width: number,
  height: number
): Promise<WidgetRepresentation> {
  const [themePreference, filter] = await Promise.all([
    loadWidgetThemePreference(widgetId),
    loadInboxWidgetFilter(widgetId),
  ]);

  const snapshot = await readAuthenticatedInboxSnapshot();
  return buildInboxWidgetRepresentation(
    width,
    height,
    resolveCaptureWidgetRenderMode(themePreference),
    filter,
    snapshot
  );
}
