import {
  EDITOR_SHEET_COLLAPSED_CONTENT,
  clampEditorSheetOpenHeight,
  editorSheetCollapsedHeight,
  resolveContentLayoutHeight,
  shouldDeferSheetOpenForKeyboard,
} from "@/components/editor/editorSheetSnaps";

describe("editorSheetCollapsedHeight", () => {
  it("adds bottom inset to the collapsed content constant", () => {
    expect(EDITOR_SHEET_COLLAPSED_CONTENT).toBe(56);
    expect(editorSheetCollapsedHeight(34)).toBe(56 + 34);
  });
});

describe("clampEditorSheetOpenHeight", () => {
  it("uses measured content when it fits between collapsed and max cap", () => {
    expect(clampEditorSheetOpenHeight(180, 90, 800)).toBe(180);
  });

  it("never opens shorter than collapsed", () => {
    expect(clampEditorSheetOpenHeight(40, 90, 800)).toBe(90);
  });

  it("clamps below the top chrome reserve", () => {
    expect(clampEditorSheetOpenHeight(500, 90, 200)).toBe(200 - 64);
  });
});

describe("shouldDeferSheetOpenForKeyboard", () => {
  it("defers only when opening while the keyboard is visible", () => {
    expect(shouldDeferSheetOpenForKeyboard(true, true)).toBe(true);
    expect(shouldDeferSheetOpenForKeyboard(true, false)).toBe(false);
    expect(shouldDeferSheetOpenForKeyboard(false, true)).toBe(false);
  });
});

describe("resolveContentLayoutHeight", () => {
  it("updates open height only while collapsed", () => {
    expect(
      resolveContentLayoutHeight({
        expanded: false,
        nextOpenHeight: 280,
        currentOpenHeight: 90,
      })
    ).toEqual({ openHeight: 280, sheetHeight: null });
  });

  it("snaps sheet height when expanded content size changes", () => {
    expect(
      resolveContentLayoutHeight({
        expanded: true,
        nextOpenHeight: 320,
        currentOpenHeight: 280,
      })
    ).toEqual({ openHeight: 320, sheetHeight: 320 });
  });

  it("does not touch sheet height when open height is unchanged", () => {
    expect(
      resolveContentLayoutHeight({
        expanded: true,
        nextOpenHeight: 280,
        currentOpenHeight: 280,
      })
    ).toEqual({ openHeight: 280, sheetHeight: null });
  });
});

test('uses measured enlarged header without shrinking the normal collapsed size', () => {
  expect(editorSheetCollapsedHeight(24, 96)).toBe(120);
  expect(editorSheetCollapsedHeight(24, 40)).toBe(80);
});
test('reserves the larger of the top safe area and the existing chrome reserve', () => {
  expect(clampEditorSheetOpenHeight(900, 80, 600, 100)).toBe(500);
  expect(clampEditorSheetOpenHeight(900, 80, 600, 20)).toBe(536);
});
