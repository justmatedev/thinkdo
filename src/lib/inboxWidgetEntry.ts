export const WIDGET_INBOX_CAPTURE_HREF = "/?focus=capture&source=widget";

export type InboxWidgetEntry = {
  focusCapture: boolean;
  fromWidget: boolean;
};

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseInboxWidgetParams(
  params: Record<string, string | string[] | undefined>
): InboxWidgetEntry {
  const focus = firstParam(params.focus);
  const source = firstParam(params.source);
  return {
    focusCapture: focus === "capture",
    fromWidget: source === "widget",
  };
}

export function shouldDismissAfterWidgetCapture(fromWidget: boolean): boolean {
  return fromWidget;
}

export function shouldDismissOnInboxBack(fromWidget: boolean): boolean {
  return fromWidget;
}
