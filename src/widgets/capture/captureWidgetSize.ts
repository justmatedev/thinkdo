export type CaptureWidgetSize = "compact" | "wide";

/**
 * Pick layout from widget RemoteViews size (dp from Android).
 * The row needs room for its mark, padding and title. A tall widget does
 * not gain horizontal space, so narrow sizes keep the icon layout.
 */
export function resolveCaptureWidgetSize(
  width: number,
  height: number
): CaptureWidgetSize {
  if (width < 200 || height < 64) return "compact";
  return "wide";
}
