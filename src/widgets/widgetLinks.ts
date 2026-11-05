import * as Linking from "expo-linking";
import { WIDGET_INBOX_CAPTURE_HREF } from "@/lib/inboxWidgetEntry";
import { isWidgetId, type WidgetId } from "@/widgets/registry";

/** Expo Router path opened by the widget. Avoid host-style URLs (thinkdo://widget/...). */
export function widgetRoutePath(id: WidgetId): string {
  return id === "capture" ? WIDGET_INBOX_CAPTURE_HREF : `/widget/${id}`;
}

export function widgetDeepLink(id: WidgetId): string {
  if (id === "capture") {
    return Linking.createURL("/", {
      queryParams: { focus: "capture", source: "widget" },
    });
  }
  return Linking.createURL(widgetRoutePath(id));
}

export function isWidgetCaptureLink(url: string): boolean {
  return parseWidgetDeepLinkPath(url) === "capture";
}

export function parseWidgetDeepLinkPath(path: string): WidgetId | null {
  if (path.includes("focus=capture")) return "capture";

  const normalized = path
    .replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "")
    .replace(/^\/+/, "")
    .split("?")[0]
    .split("#")[0];

  if (normalized === "capture") return "capture";

  const match = normalized.match(/^widget\/([^/]+)/);
  if (!match) return null;
  return isWidgetId(match[1]) ? match[1] : null;
}
