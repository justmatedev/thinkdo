import { resolveCaptureWidgetRenderMode } from "@/widgets/capture/captureWidgetRenderMode";

describe("resolveCaptureWidgetRenderMode", () => {
  it("uses day/night when widget follows the device", () => {
    expect(resolveCaptureWidgetRenderMode("system")).toEqual({
      kind: "day_night",
    });
  });

  it("uses a single theme when widget is fixed", () => {
    expect(resolveCaptureWidgetRenderMode("light")).toEqual({
      kind: "single",
      themeName: "light",
    });
    expect(resolveCaptureWidgetRenderMode("dark")).toEqual({
      kind: "single",
      themeName: "dark",
    });
  });
});
