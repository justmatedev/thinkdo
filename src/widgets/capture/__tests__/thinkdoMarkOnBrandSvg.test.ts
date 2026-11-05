import {
  CAPTURE_MARK_VIEW_BOX,
  captureMarkTileTransform,
  computeCaptureMarkViewBox,
  thinkdoCaptureMarkSvg,
  thinkdoCaptureTileSvg,
  thinkdoMarkCompactSvg,
  thinkdoMarkSvg,
  THINKDO_MARK_COMPACT_SVG,
  THINKDO_MARK_ON_BRAND_SVG,
} from "@/widgets/capture/thinkdoMarkOnBrandSvg";

describe("thinkdoMarkSvg", () => {
  it("applies the given fill", () => {
    const svg = thinkdoMarkSvg("#8B5CF6");
    expect(svg).toContain("<svg");
    expect(svg).toContain('fill="#8B5CF6"');
    expect(svg).toContain("M168.802,671.345");
  });
});

describe("thinkdoMarkCompactSvg", () => {
  it("uses a tighter viewBox and the given fill", () => {
    const svg = thinkdoMarkCompactSvg("#A78BFA");
    expect(svg).toContain('viewBox="-40 -30 1320 820"');
    expect(svg).toContain('fill="#A78BFA"');
  });
});

describe("computeCaptureMarkViewBox", () => {
  it("returns a square viewBox centered on the glyph bounds", () => {
    const vb = computeCaptureMarkViewBox();
    const [x, y, w, h] = vb.split(" ").map(Number);
    expect(w).toBe(h);
    expect(w).toBeGreaterThan(1000);
    const cx = x + w / 2;
    const cy = y + h / 2;
    expect(cx).toBeCloseTo(621.3, 0);
    expect(cy).toBeLessThan(400);
    expect(cy).toBeGreaterThan(150);
  });

  it("matches the exported CAPTURE_MARK_VIEW_BOX", () => {
    expect(CAPTURE_MARK_VIEW_BOX).toBe(computeCaptureMarkViewBox());
  });
});

describe("thinkdoCaptureMarkSvg", () => {
  it("uses the computed centered viewBox", () => {
    const svg = thinkdoCaptureMarkSvg("#8B5CF6");
    expect(svg).toContain(`viewBox="${CAPTURE_MARK_VIEW_BOX}"`);
    expect(svg).toContain("<path");
    expect(svg).toContain('fill="#8B5CF6"');
    expect(svg).toContain("M168.802,671.345");
  });
});

describe("captureMarkTileTransform", () => {
  it("scales the mark viewBox into a centered square with optical nudge", () => {
    const t = captureMarkTileTransform(70, 85);
    // inset = 9.8 → side = 50.4 → geometric x/y = 9.8 / 17.3
    expect(t.scale).toBeCloseTo(50.4 / 1461, 5);
    expect(t.translateX).toBeGreaterThan(9.8); // includes -vbX*scale + optical
    expect(t.translateY).toBeGreaterThan(17.3);
  });
});

describe("thinkdoCaptureTileSvg", () => {
  it("draws a full tile with a flat transform (no nested svg)", () => {
    const svg = thinkdoCaptureTileSvg("#FFFFFF", "#8B5CF6", "#E5E7EB", 70, 85);
    const t = captureMarkTileTransform(70, 85);
    const fmt1 = (n: number) => (Math.round(n * 10) / 10).toString();
    const fmt4 = (n: number) => (Math.round(n * 10000) / 10000).toString();
    expect(svg).toContain('viewBox="0 0 70 85"');
    expect(svg).toContain('fill="#FFFFFF"');
    expect(svg).toContain('fill="#8B5CF6"');
    expect(svg).not.toContain(`viewBox="${CAPTURE_MARK_VIEW_BOX}"`);
    expect(svg).toContain(
      `transform="translate(${fmt1(t.translateX)} ${fmt1(t.translateY)}) scale(${fmt4(t.scale)})"`
    );
    expect(t.scale).toBeGreaterThan(0.01);
  });
});

describe("legacy white exports", () => {
  it("keep white fill for compatibility", () => {
    expect(THINKDO_MARK_ON_BRAND_SVG).toContain('fill="#FFFFFF"');
    expect(THINKDO_MARK_COMPACT_SVG).toContain('fill="#FFFFFF"');
  });
});
