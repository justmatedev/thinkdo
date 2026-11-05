export const INBOX_WIDGET_ROW_HEIGHT = 44;
/** Vertical padding/chrome subtracted from widget height for the list area. */
export const INBOX_WIDGET_VERTICAL_CHROME = 16;

export function selectInboxWidgetRows<T>(
  rows: T[],
  options: { scrollable: boolean; widgetHeight: number }
): T[] {
  if (options.scrollable) return rows;

  const listHeight = Math.max(
    INBOX_WIDGET_ROW_HEIGHT,
    options.widgetHeight - INBOX_WIDGET_VERTICAL_CHROME
  );
  const maxRows = Math.max(
    1,
    Math.floor(listHeight / INBOX_WIDGET_ROW_HEIGHT)
  );
  return rows.slice(0, maxRows);
}
