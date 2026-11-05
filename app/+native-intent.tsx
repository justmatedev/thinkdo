import { WIDGET_INBOX_CAPTURE_HREF } from "@/lib/inboxWidgetEntry";
import { parseWidgetDeepLinkPath } from "@/widgets/widgetLinks";

export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    const id = parseWidgetDeepLinkPath(path);
    if (id === "capture") return WIDGET_INBOX_CAPTURE_HREF;
    if (path.includes("focus=capture")) return path;
    return path;
  } catch {
    return path;
  }
}
