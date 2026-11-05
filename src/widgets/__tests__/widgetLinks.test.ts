import {
  isWidgetCaptureLink,
  parseWidgetDeepLinkPath,
  widgetRoutePath,
} from "@/widgets/widgetLinks";
import { WIDGET_INBOX_CAPTURE_HREF } from "@/lib/inboxWidgetEntry";

describe("widgetRoutePath", () => {
  it("uses canonical inbox capture href for capture", () => {
    expect(widgetRoutePath("capture")).toBe(WIDGET_INBOX_CAPTURE_HREF);
  });

  it("uses the widget route for inbox", () => {
    expect(widgetRoutePath("inbox")).toBe("/widget/inbox");
  });
});

describe("isWidgetCaptureLink", () => {
  it("detects capture widget URLs", () => {
    expect(isWidgetCaptureLink("/?focus=capture&source=widget")).toBe(true);
    expect(
      isWidgetCaptureLink("thinkdo:///?focus=capture&source=widget")
    ).toBe(true);
    expect(isWidgetCaptureLink("/settings")).toBe(false);
  });
});

describe("parseWidgetDeepLinkPath", () => {
  it("parses legacy path forms for capture", () => {
    expect(parseWidgetDeepLinkPath("/widget/capture")).toBe("capture");
    expect(parseWidgetDeepLinkPath("widget/capture")).toBe("capture");
    expect(parseWidgetDeepLinkPath("/capture")).toBe("capture");
    expect(parseWidgetDeepLinkPath("thinkdo:///capture")).toBe("capture");
  });
  it("parses inbox query focus=capture", () => {
    expect(parseWidgetDeepLinkPath("/?focus=capture&source=widget")).toBe(
      "capture"
    );
    expect(
      parseWidgetDeepLinkPath("thinkdo:///?focus=capture&source=widget")
    ).toBe("capture");
  });
  it("parses the inbox widget path", () => {
    expect(parseWidgetDeepLinkPath("/widget/inbox")).toBe("inbox");
  });
  it("returns null for unknown", () => {
    expect(parseWidgetDeepLinkPath("/widget/unknown")).toBe(null);
    expect(parseWidgetDeepLinkPath("/settings")).toBe(null);
  });
});
