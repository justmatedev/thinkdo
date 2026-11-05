import { Platform } from "react-native";
import {
  getWidgetInfo,
  requestWidgetUpdateById,
  type WidgetInfo,
  type WidgetRepresentation,
} from "react-native-android-widget";
import { resolveCaptureWidgetRepresentation } from "@/widgets/capture/captureWidgetRender";
import { resolveInboxWidgetRepresentation } from "@/widgets/inbox/inboxWidgetRender";
import { WIDGET_NATIVE_NAMES, type WidgetId } from "@/widgets/registry";

export async function requestNamedWidgetUpdate(
  id: WidgetId,
  renderWidget: (
    info: WidgetInfo,
  ) => WidgetRepresentation | Promise<WidgetRepresentation>,
): Promise<void> {
  if (Platform.OS !== "android") return Promise.resolve();
  const widgetName = WIDGET_NATIVE_NAMES[id];
  const widgets = await getWidgetInfo(widgetName);
  // The library's bulk updater uses an unawaited async forEach. Updating by ID
  // lets logout wait until every render has actually submitted its native draw.
  for (const widget of widgets) {
    await requestWidgetUpdateById({
      widgetName,
      widgetId: widget.widgetId,
      renderWidget,
    });
  }
}

export function refreshCaptureWidgets(): Promise<void> {
  if (Platform.OS !== "android") return Promise.resolve();
  return requestNamedWidgetUpdate("capture", async (info) =>
    resolveCaptureWidgetRepresentation(info.widgetId, info.width, info.height),
  );
}

let inboxUpdate: Promise<void> | null = null;

export function refreshInboxWidgets(): Promise<void> {
  if (Platform.OS !== "android") return Promise.resolve();
  const publish = () =>
    requestNamedWidgetUpdate("inbox", async (info) =>
      resolveInboxWidgetRepresentation(info.widgetId, info.width, info.height),
    );
  const pending = inboxUpdate
    ? inboxUpdate.catch(() => {}).then(publish)
    : Promise.resolve(publish());
  const settled = pending.finally(() => {
    if (inboxUpdate === settled) inboxUpdate = null;
  });
  inboxUpdate = settled;
  return settled;
}
