import { resolveCaptureWidgetSize } from "@/widgets/capture/captureWidgetSize";

describe("resolveCaptureWidgetSize", () => {
  it("treats true 1×1 cells as compact (including tall ~82×100)", () => {
    expect(resolveCaptureWidgetSize(40, 40)).toBe("compact");
    expect(resolveCaptureWidgetSize(70, 70)).toBe("compact");
    expect(resolveCaptureWidgetSize(82, 100)).toBe("compact");
    expect(resolveCaptureWidgetSize(100, 100)).toBe("compact");
    expect(resolveCaptureWidgetSize(70, 85)).toBe("compact");
  });

  it("uses the text layout only when it has enough horizontal space", () => {
    expect(resolveCaptureWidgetSize(210, 140)).toBe("wide");
    expect(resolveCaptureWidgetSize(250, 70)).toBe("wide");
    expect(resolveCaptureWidgetSize(276, 100)).toBe("wide");
  });
  it.each([[70, 150], [100, 210], [120, 120], [150, 140], [70, 450], [250, 40]])(
    "keeps %i×%i widgets in the icon layout when text cannot fit",
    (width, height) => {
      expect(resolveCaptureWidgetSize(width, height)).toBe("compact");
    },
  );
});
