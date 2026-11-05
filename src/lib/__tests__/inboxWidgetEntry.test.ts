import {
  WIDGET_INBOX_CAPTURE_HREF,
  parseInboxWidgetParams,
  shouldDismissAfterWidgetCapture,
  shouldDismissOnInboxBack,
} from "@/lib/inboxWidgetEntry";

describe("WIDGET_INBOX_CAPTURE_HREF", () => {
  it("is the canonical query path", () => {
    expect(WIDGET_INBOX_CAPTURE_HREF).toBe("/?focus=capture&source=widget");
  });
});

describe("parseInboxWidgetParams", () => {
  it("detects focus and widget source", () => {
    expect(
      parseInboxWidgetParams({ focus: "capture", source: "widget" })
    ).toEqual({ focusCapture: true, fromWidget: true });
  });
  it("focus without widget source", () => {
    expect(parseInboxWidgetParams({ focus: "capture" })).toEqual({
      focusCapture: true,
      fromWidget: false,
    });
  });
  it("ignores other values", () => {
    expect(parseInboxWidgetParams({ focus: "other", source: "app" })).toEqual({
      focusCapture: false,
      fromWidget: false,
    });
  });
  it("handles array params from expo-router", () => {
    expect(
      parseInboxWidgetParams({ focus: ["capture"], source: ["widget"] })
    ).toEqual({ focusCapture: true, fromWidget: true });
  });
});

describe("dismiss rules", () => {
  it("dismisses after capture only from widget", () => {
    expect(shouldDismissAfterWidgetCapture(true)).toBe(true);
    expect(shouldDismissAfterWidgetCapture(false)).toBe(false);
  });
  it("dismisses on back only from widget", () => {
    expect(shouldDismissOnInboxBack(true)).toBe(true);
    expect(shouldDismissOnInboxBack(false)).toBe(false);
  });
});
