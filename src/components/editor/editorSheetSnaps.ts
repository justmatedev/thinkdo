export const EDITOR_SHEET_COLLAPSED_CONTENT = 56;
const TOP_RESERVE = 64;

/** Collapsed sheet height: handle row + bottom safe inset. */
export function editorSheetCollapsedHeight(bottomInset: number): number {
  return EDITOR_SHEET_COLLAPSED_CONTENT + bottomInset;
}

/**
 * Open height hugs measured content (header + options), never below
 * collapsed and never above the top chrome reserve.
 */
export function clampEditorSheetOpenHeight(
  measuredContentHeight: number,
  collapsed: number,
  windowHeight: number
): number {
  const maxCap = Math.max(collapsed, windowHeight - TOP_RESERVE);
  return Math.min(
    Math.max(collapsed, Math.round(measuredContentHeight)),
    maxCap
  );
}

/** Opening while the keyboard is up should wait for hide to avoid layout thrash. */
export function shouldDeferSheetOpenForKeyboard(
  opening: boolean,
  keyboardVisible: boolean
): boolean {
  return opening && keyboardVisible;
}

/**
 * Content remeasure while open must not restart a full open timing animation.
 * Snap when the open height changed; otherwise only remember the measurement.
 */
export function resolveContentLayoutHeight(args: {
  expanded: boolean;
  nextOpenHeight: number;
  currentOpenHeight: number;
}): { openHeight: number; sheetHeight: number | null } {
  const { expanded, nextOpenHeight, currentOpenHeight } = args;
  if (!expanded || nextOpenHeight === currentOpenHeight) {
    return { openHeight: nextOpenHeight, sheetHeight: null };
  }
  return { openHeight: nextOpenHeight, sheetHeight: nextOpenHeight };
}
