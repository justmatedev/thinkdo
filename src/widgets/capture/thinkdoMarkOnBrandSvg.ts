/** Thinkdo mark SVG for Capture widget (SvgWidget). */

const THINKDO_MARK_PATH =
  "M168.802,671.345C171.990,650.507 182.492,632.611 200.311,617.645C218.130,602.683 237.456,595.204 258.289,595.204C279.503,595.204 296.986,602.873 310.741,618.215C324.495,633.557 329.719,652.023 326.418,673.616C323.234,694.449 312.797,712.539 295.107,727.881C277.422,743.223 257.970,750.892 236.757,750.892C215.168,750.892 197.616,743.033 184.112,727.311C170.604,711.589 165.501,692.934 168.802,671.345ZM510.391,409.283C582.310,409.283 631.771,467.670 620.776,539.589C609.778,611.507 542.465,669.894 470.547,669.894C398.628,669.894 349.167,611.507 360.161,539.589C371.156,467.670 438.472,409.283 510.391,409.283ZM1243.054,83.816C1212.916,224.239 1079.786,321.020 934.546,303.112C886.822,297.225 843.370,279.652 806.709,253.610C739.522,308.009 651.190,336.108 558.701,324.705C465.771,313.246 386.603,264.116 334.653,194.504C292.315,211.362 245.271,218.114 196.884,212.150C123.458,203.095 60.146,166.370 16.115,113.716C-8.407,84.386 -4.504,40.666 24.823,16.140C54.154,-8.383 97.873,-4.479 122.396,24.847C144.672,51.487 176.697,70.070 213.839,74.652C252.366,79.404 289.204,68.199 317.739,46.238C334.641,33.232 356.589,28.734 377.245,34.048C397.896,39.361 414.952,53.891 423.478,73.440C449.669,133.491 505.983,178.617 575.655,187.207C644.867,195.741 710.042,166.107 750.104,114.856C763.111,98.221 782.995,88.422 804.115,88.253C825.231,88.079 845.273,97.550 858.546,113.971C880.870,141.589 913.506,160.931 951.500,165.614C1024.971,174.673 1092.356,125.778 1107.601,54.744C1115.626,17.364 1152.484,-6.467 1189.864,1.557C1227.244,9.578 1251.079,46.440 1243.054,83.816Z";

/** Axis-aligned bounds of path control points (stable for this mark). */
const MARK_BOUNDS = {
  minX: -8.407,
  maxX: 1251.079,
  minY: -8.383,
  maxY: 750.892,
} as const;

const MARK_CX = (MARK_BOUNDS.minX + MARK_BOUNDS.maxX) / 2;

const PLUS_ARM = 168;
const PLUS_T = 64;
/** Gap between mark top and plus bottom. */
const PLUS_GAP = 36;
const PLUS_CY = MARK_BOUNDS.minY - PLUS_GAP - PLUS_ARM;

/** Padding around the glyph as a fraction of the longer side (each side). */
const VIEW_PAD = 0.08;

type Bounds = { minX: number; maxX: number; minY: number; maxY: number };

function plusBounds(): Bounds {
  return {
    minX: MARK_CX - PLUS_ARM,
    maxX: MARK_CX + PLUS_ARM,
    minY: PLUS_CY - PLUS_ARM,
    maxY: PLUS_CY + PLUS_ARM,
  };
}

function unionBounds(a: Bounds, b: Bounds): Bounds {
  return {
    minX: Math.min(a.minX, b.minX),
    maxX: Math.max(a.maxX, b.maxX),
    minY: Math.min(a.minY, b.minY),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/**
 * Square viewBox centered on the +/mark bounding box.
 * Equal padding on all sides — geometric center, no screenshot tuning.
 */
export function computeCaptureMarkViewBox(): string {
  const bounds = unionBounds(MARK_BOUNDS, plusBounds());
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const side = Math.max(width, height) * (1 + VIEW_PAD * 2);
  const x = cx - side / 2;
  const y = cy - side / 2;
  const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
  return `${fmt(x)} ${fmt(y)} ${fmt(side)} ${fmt(side)}`;
}

export const CAPTURE_MARK_VIEW_BOX = computeCaptureMarkViewBox();

function plusPath(fill: string): string {
  const hx = MARK_CX - PLUS_ARM;
  const hy = PLUS_CY - PLUS_T / 2;
  const vx = MARK_CX - PLUS_T / 2;
  const vy = PLUS_CY - PLUS_ARM;
  const d = [
    `M${hx} ${hy}h${PLUS_ARM * 2}v${PLUS_T}h${-PLUS_ARM * 2}z`,
    `M${vx} ${vy}h${PLUS_T}v${PLUS_ARM * 2}h${-PLUS_T}z`,
  ].join("");
  return `<path fill="${fill}" d="${d}"/>`;
}

export function thinkdoMarkSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="-260.304 -510.386 1763.280 1763.280"><path fill="${fill}" fill-rule="evenodd" d="${THINKDO_MARK_PATH}"/></svg>`;
}

/** Cropped viewBox so the mark sits tight under a separate “+” (legacy). */
export function thinkdoMarkCompactSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="320" viewBox="-40 -30 1320 820"><path fill="${fill}" fill-rule="evenodd" d="${THINKDO_MARK_PATH}"/></svg>`;
}

/** Single SVG for the Capture widget: geometrically centered “+” + mark. */
export function thinkdoCaptureMarkSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="${CAPTURE_MARK_VIEW_BOX}">${plusPath(fill)}<path fill="${fill}" fill-rule="evenodd" d="${THINKDO_MARK_PATH}"/></svg>`;
}

/**
 * Place mark paths into the tile with a flat transform.
 * Nested `<svg x y>` is unreliable in androidsvg 1.4 (SvgWidget) — the mark
 * ends up top-left on device even when librsvg/sharp centers it correctly.
 */
export function captureMarkTileTransform(
  width: number,
  height: number
): { translateX: number; translateY: number; scale: number } {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const inset = Math.min(w, h) * 0.14;
  const markSide = Math.min(w, h) - inset * 2;
  const markX = (w - markSide) / 2;
  const markY = (h - markSide) / 2;
  const [vbX, vbY, vbW] = CAPTURE_MARK_VIEW_BOX.split(" ").map(Number);
  const scale = markSide / vbW;
  // Zero mass offset in the baked PNG (ImageWidget shows this file as-is).
  const opticalX = markSide * 0.025;
  const opticalY = 0;
  return {
    translateX: markX - vbX * scale + opticalX,
    translateY: markY - vbY * scale + opticalY,
    scale,
  };
}

/**
 * Full compact tile: background + border + mark in one flat SVG.
 * Centering is baked into the artwork so FlexWidget/PictureDrawable
 * misalignment cannot offset the mark relative to the white tile.
 */
export function thinkdoCaptureTileSvg(
  background: string,
  accent: string,
  border: string,
  width: number,
  height: number
): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const fmt1 = (n: number) => (Math.round(n * 10) / 10).toString();
  // Scale is ~0.03 — one decimal would round to 0 and wipe the mark.
  const fmt4 = (n: number) => (Math.round(n * 10000) / 10000).toString();
  const rx = Math.min(w, h) * 0.28;
  const stroke = Math.max(1, Math.min(w, h) * 0.015);
  const { translateX, translateY, scale } = captureMarkTileTransform(w, h);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<rect x="${fmt1(stroke / 2)}" y="${fmt1(stroke / 2)}" width="${fmt1(w - stroke)}" height="${fmt1(h - stroke)}" rx="${fmt1(rx)}" fill="${background}" stroke="${border}" stroke-width="${fmt1(stroke)}"/>`,
    `<g transform="translate(${fmt1(translateX)} ${fmt1(translateY)}) scale(${fmt4(scale)})">`,
    plusPath(accent),
    `<path fill="${accent}" fill-rule="evenodd" d="${THINKDO_MARK_PATH}"/>`,
    `</g>`,
    `</svg>`,
  ].join("");
}

/** @deprecated Prefer thinkdoMarkSvg with an explicit fill. */
export const THINKDO_MARK_ON_BRAND_SVG = thinkdoMarkSvg("#FFFFFF");

/** @deprecated Prefer thinkdoMarkCompactSvg with an explicit fill. */
export const THINKDO_MARK_COMPACT_SVG = thinkdoMarkCompactSvg("#FFFFFF");
