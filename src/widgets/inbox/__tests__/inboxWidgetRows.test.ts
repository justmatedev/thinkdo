import {
  INBOX_WIDGET_ROW_HEIGHT,
  selectInboxWidgetRows,
} from "../inboxWidgetRows";

const ids = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: String(i) }));

describe("selectInboxWidgetRows", () => {
  it("returns all rows when scrollable", () => {
    const rows = ids(10);
    expect(
      selectInboxWidgetRows(rows, { scrollable: true, widgetHeight: 100 })
    ).toEqual(rows);
  });

  it("slices to rows that fit when not scrollable", () => {
    // listHeight = max(44, 148 - 16) = 132 → floor(132/44) = 3
    const rows = ids(10);
    expect(
      selectInboxWidgetRows(rows, { scrollable: false, widgetHeight: 148 })
    ).toEqual(rows.slice(0, 3));
  });

  it("always shows at least one row slot when not scrollable", () => {
    const rows = ids(5);
    expect(
      selectInboxWidgetRows(rows, { scrollable: false, widgetHeight: 10 })
    ).toEqual(rows.slice(0, 1));
  });

  it("exports ROW_HEIGHT 44 for layout parity", () => {
    expect(INBOX_WIDGET_ROW_HEIGHT).toBe(44);
  });
});
