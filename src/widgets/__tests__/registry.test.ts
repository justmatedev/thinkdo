import { WIDGET_NATIVE_NAMES, isWidgetId } from "@/widgets/registry";

describe("WIDGET_NATIVE_NAMES", () => {
  it("maps capture to native Capture name", () => {
    expect(WIDGET_NATIVE_NAMES.capture).toBe("Capture");
  });

  it("maps inbox to native Inbox name", () => {
    expect(WIDGET_NATIVE_NAMES.inbox).toBe("Inbox");
  });
});

describe("isWidgetId", () => {
  it("accepts capture", () => {
    expect(isWidgetId("capture")).toBe(true);
  });

  it("accepts inbox", () => {
    expect(isWidgetId("inbox")).toBe(true);
  });

  it("rejects unknown", () => {
    expect(isWidgetId("unknown")).toBe(false);
  });
});
