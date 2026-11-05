export type WidgetId = "capture" | "inbox";

export const WIDGET_NATIVE_NAMES: Record<WidgetId, string> = {
  capture: "Capture",
  inbox: "Inbox",
};

const IDS = new Set<string>(Object.keys(WIDGET_NATIVE_NAMES));

export function isWidgetId(value: string): value is WidgetId {
  return IDS.has(value);
}
